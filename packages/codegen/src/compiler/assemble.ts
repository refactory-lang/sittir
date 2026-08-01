/**
 * compiler/assemble.ts — Assemble phase.
 *
 * First time nodes appear. All metadata (required, multiple, contentTypes,
 * detectToken, modelType) derived from the rule tree — not carried on Rule<'link'> nodes.
 */

import {
	ALIAS,
	CHOICE,
	FIELD,
	GROUP,
	OPTIONAL,
	PATTERN,
	REPEAT,
	REPEAT1,
	SEQ,
	STRING,
	SUPERTYPE,
	SYMBOL,
	TOKEN,
	VARIANT
} from '../types/rule-types.ts'; // @rule-type-consts
import type {
	Rule,
	AnyRule,
	RenderRule,
	SimplifiedRule,
	GroupRule,
	SymbolRule,
	SeqRule,
	ChoiceRule,
	RepeatRule,
	Repeat1Rule,
	StringRule,
	EnumRule,
	SupertypeRule
} from '../types/rule.ts';
import { isLinkSymbol, isEnumChoiceRule, subtypeParseNamesOf } from '../types/rule.ts';
import { isNonterminalRuleType } from './rule-catalog.ts';
import type { SimplifiedGrammar, NodeMap, SignaturePool } from './types.ts';
import type { RuleId } from '../types/rule.ts';
import {
	collectGeneratedKindEntries,
	findEntryForKindName,
	findEntryForLiteralText,
	type GeneratedIdTables,
	type GeneratedKindEntry
} from './generated-metadata.ts';
import type { AssembledNode, AssembledNonterminal, NodeOrTerminal, SubtypeRef, UnresolvedRef } from './model/node-map.ts';
import {
	AssembledBranch,
	AssembledPattern,
	AssembledKeyword,
	AssembledToken,
	AssembledEnum,
	AssembledSupertype,
	AssembledGroup,
	AssembledMulti,
	AssembledSeparatedList,
	drainParseKindCollisionDiagnostics,
	drainDeriveShapeDiagnostics,
	drainAssembleWarnings,
	recordAssembleWarning,
	resetAssembleWarnings,
	nameNode,
	isNodeRef,
	storageKindOfRef,
	isUnresolvedRef,
	allSlotsOf,
	resetParseKindCollisionDiagnostics,
	resetDeriveShapeDiagnostics,
	setOptionalBodyKinds,
	buildParseKindRuleSignatures,
	type AssembleWarning
} from './model/node-map.ts';
import { simplifyRule, hoistInnerFieldsForTemplate } from './simplify.ts';
import { deriveStructuralVariantChildren } from './variant-structural.ts';
import { inlineRefs } from '../dsl/rule-transforms.ts';
import { matchesWordShape } from '../util/word-matcher.ts';
import type { ParseKindCollisionDiagnostic } from '../types/parsekind-collisions.ts';
import type { DeriveShapeDiagnostic } from './diagnostics/derive-shapes.ts';
import { DiagnosticSink } from '../types/diagnostics.ts';
import { BaseCtx, type BaseCtxInit } from './ctx.ts';

export class AssembleCtx extends BaseCtx<'simplify'> {
	readonly kindEntries?: readonly GeneratedKindEntry[];
	readonly generatedIdTables?: GeneratedIdTables;
	readonly topLevelAliasBodies: ReadonlyMap<string, Rule<'link'>>;
	/**
	 * Hidden symbol name → its REAL compiled alias name, read back from the
	 * compiled `grammar.json` (see `loadGrammarJsonAliasMap`, inline-sets.ts).
	 *
	 * Needed because enrich's clause-hoist/choice-arm promotion
	 * (`promoteExistingHiddenRuleName`, enrich.ts) is evaluated TWICE per
	 * grammar — once building the wire config tree-sitter's native
	 * `grammar()` call compiles, once inside sittir's own evaluate()
	 * pipeline — each with its OWN fresh `groupDedupeMap`/counter state.
	 * The promotion is order-dependent ("whichever parent asks first wins
	 * the name"), so when a single hidden rule is referenced from multiple
	 * parents (e.g. rust's `_non_special_token`, referenced from `_tokens`,
	 * `_non_delim_token`, AND `_token_pattern`), the two invocations can —
	 * and in this exact case do — settle on DIFFERENT winning names
	 * ("token_pattern_group1" vs "non_delim_token_group1") depending on
	 * which parent each invocation happens to visit first. Only the
	 * wire-config invocation's name is real (it's what tree-sitter actually
	 * compiled); sittir's own `subtypeParseNames` guess can be wrong. This
	 * map lets `resolveHiddenSubtypes` correct for that divergence rather
	 * than trusting the guess.
	 */
	readonly grammarJsonAliasMap: ReadonlyMap<string, string>;
	private readonly _nodes: Map<string, AssembledNode>;

	constructor(
		init: BaseCtxInit<'simplify'> & {
			generatedIdTables?: GeneratedIdTables;
			kindEntries?: readonly GeneratedKindEntry[];
			topLevelAliasBodies?: ReadonlyMap<string, Rule<'link'>>;
			grammarJsonAliasMap?: ReadonlyMap<string, string>;
			nodes?: Map<string, AssembledNode>;
		}
	) {
		super(init);
		this.kindEntries = init.kindEntries;
		this.generatedIdTables = init.generatedIdTables;
		this.topLevelAliasBodies = init.topLevelAliasBodies ?? new Map();
		this.grammarJsonAliasMap = init.grammarJsonAliasMap ?? new Map();
		this._nodes = init.nodes ?? new Map();
	}

	get rules(): Record<string, SimplifiedRule> {
		return this.grammar.rules;
	}

	get normalizedRules(): Record<string, RenderRule> {
		return this.grammar.normalizedRules;
	}

	get nodes(): Map<string, AssembledNode> {
		return this._nodes;
	}

	static from(
		normalized: SimplifiedGrammar,
		generatedIdTables?: GeneratedIdTables,
		diagnostics: DiagnosticSink = new DiagnosticSink(),
		grammarJsonAliasMap?: ReadonlyMap<string, string>
	): AssembleCtx {
		return new AssembleCtx({
			grammar: normalized,
			diagnostics,
			wordMatcher: (s) => matchesWordShape(s, normalized.wordMatcher),
			generatedIdTables,
			topLevelAliasBodies: normalized.topLevelAliasBodies ?? new Map(),
			grammarJsonAliasMap
		});
	}
}

export interface AssembledNodeMap extends NodeMap {
	readonly parseKindCollisions: readonly ParseKindCollisionDiagnostic[];
	readonly deriveShapeDiagnostics: readonly DeriveShapeDiagnostic[];
	readonly assembleWarnings: readonly AssembleWarning[];
}

// ---------------------------------------------------------------------------
// assemble() — main entry point
// ---------------------------------------------------------------------------
export function assemble(ctx: AssembleCtx): AssembledNodeMap {
	const normalized = ctx.grammar;
	// Link-time-pinned, carried — NOT recompiled here. See
	// `LinkedGrammar.wordMatcher`'s doc comment for why a post-link recompile
	// (from `normalized.linkRules`, the wrapper-bearing view this function used
	// to compile from) is unsound in general.
	const wordMatcherRegex = normalized.wordMatcher;
	const nodes = ctx.nodes;
	// collectGeneratedKindEntries(undefined) is []; keep the non-optional
	// entries array downstream constructors expect.
	const kindEntries = ctx.kindEntries ?? collectGeneratedKindEntries(ctx.generatedIdTables);
	resetParseKindCollisionDiagnostics();
	resetDeriveShapeDiagnostics();
	// Parents that went through variant-child adoption keep their original
	// rule shape but should NOT auto-promote to polymorph — each variant
	// child renders via its own kind-template.
	//
	// R12/decision-7 V1/V2: derived STRUCTURALLY from the post-link rule
	// tree (`deriveStructuralVariantChildren`, compiler/variant-structural.ts).
	// V1 flipped this call site off the former wire-metadata channel
	// (`normalized.polymorphVariants`, populated by
	// `wireRegisterPolymorphVariant`); V2 deletes that channel entirely —
	// see variant-structural.ts's top-of-file STATUS comment for the full
	// deletion inventory and `tool variant-derivation-probe`'s doc for its
	// new cross-commit drift-detector contract (compares this derivation's
	// live output against committed node-model.json5, not a wire channel).
	// See the research doc's V1/V2 OUTCOME sections for the reviewed-
	// additive delta this flip introduced (hand-authored `alias()`-arm
	// surfaces with no former wire pair — rust `impl_item`/
	// `reference_expression`, ts `string`'s `string_fragment` — joined the
	// form set) and the enumerated known exceptions (parents that
	// structurally qualify but can never appear in node-model.json5 because
	// they classify to SupertypeRule/AssembledGroup, not AssembledBranch).
	const variantChildrenByParent = deriveStructuralVariantChildren(normalized.linkRules);
	const variantParents = new Set(variantChildrenByParent.keys());

	// Identify rule kinds whose resolved body is wholly optional. This
	// happens primarily through `renderAs: blank()` stamping
	// (`stampStaticRenderAs` collapses `choice(X, blank)` →
	// `optional(X)` at link time), but detection is generic: any rule
	// body that's `optional(...)` or `choice(blank, ...)` qualifies. Set
	// on a module-level pointer in node-map.ts for the slot-value
	// constructors to consult during the rule walk below.
	const optionalBodyKinds = collectOptionalBodyKinds(normalized.linkRules);
	setOptionalBodyKinds(optionalBodyKinds);
	const parseKindCollisionContext = {
		ruleSignatures: buildParseKindRuleSignatures(normalized.normalizedRules!)
	} as const;

	try {
		for (const [kind, rule] of Object.entries(normalized.linkRules)) {
			const assemblyRule = normalized.topLevelAliasBodies?.get(kind) ?? rule;
			// `inlinedRule` still uses inlineRefs here because the
			// RAW rule path (for template emission + classification) isn't
			// run through simplify. Only `simplifiedRule` (derivation view)
			// picks up inlining from the simplify fixpoint.
			//
			// `hoistInnerFieldsForTemplate` then drops outer
			// `field('outer', ...)` wrappers when their content carries an
			// inner field tree-sitter would expose at the top level of the
			// parent kind. The literal-stripping / single-member-collapsing
			// work that simplify also does is intentionally NOT applied
			// here — templates need anonymous delimiters (`,`, `(`, `;`,
			// …) to surface as template text. See
			// `project_simplify_template_walker_divergence.md`.
			// hoistInnerFieldsForTemplate's declared return type is the phase-
			// agnostic AnyRule, but `assemblyRule` (its input, through inlineRefs)
			// is Rule<'link'> and the function is shape-preserving — widen the
			// phase view back (post-PR-S, RepeatRule<'evaluate'>/<'link'> genuinely
			// diverge in shape, so AnyRule no longer coincidentally structurally
			// matches Rule<'link'> here).
			const inlinedRule = hoistInnerFieldsForTemplate(
				inlineRefs(assemblyRule, { rules: normalized.linkRules })
			) as Rule<'link'>;
			// `rules[kind]` (SimplifiedGrammar's phase product) and `normalizedRules[kind]`
			// are both pre-computed by normalize — alias-body kinds are now also
			// snapshotted there (PR2 Task 3.B-prereq-alias).
			const simplifiedRule = normalized.rules[kind]!;
			const renderRule: RenderRule = normalized.normalizedRules![kind]!;
			// Classification reads the already-stamped normalize-phase view
			// (`renderRule`) instead of re-deriving wrapper shape from
			// `inlinedRule` — wrapper-deletion already computed the same facts
			// (multiplicity/nonterminal/separator) these checks used to walk
			// OPTIONAL/FIELD/REPEAT/REPEAT1 nodes for. `inlinedRule` (Rule<'link'>)
			// still feeds most node CONSTRUCTORS below (AssembledGroup deliberately
			// needs the pre-deletion wrapper node); AssembledMulti constructs
			// directly off `renderRule` — a hidden repeat helper's own body IS the
			// repeat, so wrapper-deletion's pushed-down attributes are already
			// everything it needs.
			const modelType = classifyNode(kind, renderRule, {
				variantParents,
				parentAliasedKinds: normalized.parentAliasedKinds,
				wordMatcher: wordMatcherRegex
			});
			const variantChildKinds = variantChildrenByParent.get(kind);

			switch (modelType) {
				case 'branch': {
					nodes.set(
						kind,
						new AssembledBranch(
							kind,
							inlinedRule as SeqRule<'link'> | ChoiceRule<'link'> | RepeatRule | Repeat1Rule,
							simplifiedRule,
							renderRule,
							{
								variantChildKinds,
								kindEntries,
								parseKindCollisionContext,
								visibleAliasTargets: normalized.visibleAliasTargets,
								simplifiedRules: normalized.rules
							}
						)
					);
					break;
				}
				case 'pattern': {
					nodes.set(kind, new AssembledPattern(kind, assemblyRule));
					break;
				}
				case 'keyword': {
					nodes.set(kind, new AssembledKeyword(kind, assemblyRule as StringRule<'link'>, { kindEntries }));
					break;
				}
				case 'token': {
					// Hidden — no factoryName; token kinds have StringRule<'link'> bodies
					nodes.set(kind, new AssembledToken(kind, assemblyRule as StringRule<'link'>, { kindEntries }));
					break;
				}
				case 'enum': {
					nodes.set(kind, new AssembledEnum(kind, assemblyRule as EnumRule<'link'>, { kindEntries }));
					break;
				}
				case 'supertype': {
					const subtypes = resolveSupertypeSubtypes(assemblyRule, ctx, kindEntries);
					nodes.set(
						kind,
						new AssembledSupertype(kind, assemblyRule as SupertypeRule<'link'> | ChoiceRule<'link'>, subtypes)
					);
					break;
				}
				case 'group': {
					const { groupRule, groupSimplified, groupRenderRule } = unwrapGroupRuleAndSimplified(
						assemblyRule,
						simplifiedRule,
						renderRule
					);
					nodes.set(
						kind,
						new AssembledGroup(kind, groupRule, groupSimplified, groupRenderRule, {
							kindEntries,
							parseKindCollisionContext
						})
					);
					break;
				}
				case 'multi': {
					nodes.set(kind, new AssembledMulti(kind, renderRule));
					break;
				}
				case 'separatedList': {
					const listRule = inlinedRule as RepeatRule | Repeat1Rule;
					const sep = listRule.separator;
					const separatorRule = sep && isNonterminalRuleType(sep.value as Rule<'evaluate'>) ? sep.value : undefined;
					nodes.set(
						kind,
						new AssembledSeparatedList(
							kind,
							listRule,
							{ kindEntries },
							{
								separatorRule,
								// TEMPORARY behavior-preserving stub (see
								// AssembledSeparatedList's doc comment) — the SAME
								// simplifiedRule/renderRule/parseKindCollisionContext
								// the 'branch' case above passes, so wrap/render/
								// factory emission reusing 'branch's code path stays
								// byte-identical to pre-Task-2 output.
								simplifiedRule,
								renderRule,
								parseKindCollisionContext
							}
						)
					);
					break;
				}
			}
		}

		// Nested-supertype alias materialization (spec 026): a nested
		// SUPERTYPE rule (e.g. rust's `_non_special_token`, itself a
		// SUPERTYPE referenced as a subtype of `_tokens`/`_non_delim_token`/
		// `_token_pattern`) can be aliased by tree-sitter's real compile into
		// a genuinely distinct, named CST node at that occurrence
		// (`SupertypeRule.subtypeParseNames`, confirmed against grammar.json
		// — see `resolveHiddenSubtypes`'s doc comment). That aliased name has
		// no entry of its own in `normalized.linkRules` (it's a parse-time
		// label, not a rule sittir's own grammar declares), so the main loop
		// above never assembles it. Give it one here: reuse the nested rule's
		// OWN already-resolved subtypes (identical union either way — the
		// alias and the hidden rule are the same underlying content, just a
		// different name at this occurrence) under a fresh `AssembledSupertype`
		// keyed by the alias, so it gets a real kindId/typeName/dispatch entry
		// like any other node. Multiple parents aliasing the SAME nested rule
		// to the SAME name (confirmed: `_tokens`/`_non_delim_token`/
		// `_token_pattern` all alias `_non_special_token` to
		// "token_pattern_group1") register it exactly once.
		for (const rule of Object.values(normalized.linkRules)) {
			if (rule.type !== SUPERTYPE) continue;
			for (const [subName, aliasName] of Object.entries(subtypeParseNamesOf(rule))) {
				if (nodes.has(aliasName)) continue;
				const subRule = normalized.linkRules[subName];
				// Only nested SUPERTYPE arms materialize their own node —
				// other parse-alias occurrences (e.g. an ENUM-shaped hidden
				// rule like rust's `_primitive_type`, aliased to
				// `primitive_type` at this same site) aren't a case of
				// tree-sitter inserting a distinct intermediate node; they
				// stay resolved via `resolveHiddenSubtypes`'s existing
				// flatten-through path.
				if (!subRule || subRule.type !== SUPERTYPE) continue;
				const subtypes = resolveSupertypeSubtypes(subRule, ctx, kindEntries);
				nodes.set(aliasName, new AssembledSupertype(aliasName, subRule, subtypes));
			}
		}

		collectAnonymousNodes(normalized.linkRules, nodes, wordMatcherRegex, kindEntries);
		resolveCollidingNames(nodes);
		resolveIrKeys(nodes);
		// Pre-compute the two cross-node sets once, then run the merged
		// markUserFacing pass (M3 — one pass marks both alias-source + variant-
		// children; see _UserFacingCtx / markUserFacing JSDoc).
		const aliasSourceKinds = new Set<string>();
		for (const n of nodes.values()) {
			for (const slot of allSlotsOf(n)) {
				for (const v of slot.values) {
					if (!isNodeRef(v)) continue;
					const name = storageKindOfRef(v.node);
					if (name.startsWith('_')) aliasSourceKinds.add(name);
				}
			}
		}
		// R12/decision-7 V1: reuse the SAME structural derivation computed
		// above (`variantChildrenByParent`) rather than re-deriving from the
		// wire channel a second time — one source, no risk of the two sets
		// drifting (and no repeat of the former reconstruction's hidden-
		// parent naming bug; see the `variantChildrenByParent` comment).
		const variantChildKindsSet = new Set<string>([...variantChildrenByParent.values()].flat());
		// SUPERTYPE-parent EXCEPTION (V2 Task 1: now reads the DECLARED fact,
		// not the wire channel — see the research doc's "V2 OUTCOME" section
		// and `RuleBase.variantArms`'s doc comment, types/rule.ts): a
		// SUPERTYPE-classified parent (python's `_simple_pattern` / its
		// `negative` arm) has NO reproduction in
		// `deriveStructuralVariantChildren` — link's `classifyHiddenChoiceRule`
		// flattens the original CHOICE's alias/symbol arms into a bare
		// `subtypes: string[]` BEFORE `normalized.rules` is built, destroying
		// the alias-mint linkage `isAliasMintedRef`'s "no independent body"
		// test needs. Verified NOT a clean structural rule DERIVABLE from
		// `normalized.rules` alone: the coincidental-collision arm this
		// module's predicate excludes for CHOICE parents (`dictionary`/
		// `dictionary_splat`) has an EXACT analogue here (ts `type`'s
		// `_type_query_member_expression_in_type_annotation` subtype — its
		// own visible-stripped form ALSO has no independent body, making it
		// structurally indistinguishable from the true positive using only
		// post-link `normalized.rules` data). Rather than risk that false
		// positive, `classifyHiddenChoiceRule` stamps `variantArms` on the
		// `SupertypeRule` AT THE MOMENT of flatten (when the pre-flatten
		// CHOICE's per-arm shape is still available) — a declared structural
		// fact read directly here, gated structurally on `rule.type ===
		// SUPERTYPE` (not kind-NAME-gated) so it can never silently expand
		// beyond this one shape. `variantArms` entries are already the HIDDEN
		// helper-body kind name (`_simple_pattern_negative`, matching
		// `subtypes`'s own per-arm naming) — `nodes` is keyed by that hidden
		// name; the alias-mint's VISIBLE target (`simple_pattern_negative`,
		// what `variantChildrenByParent`'s values hold for CHOICE parents) is
		// never assembled into its own node at all for this shape, so
		// promoting IT would be a no-op. `markUserFacing`'s own doc already
		// documents this as case (d) — "hidden variant-child kinds ... the
		// slot walker never reaches when the parent is a supertype."
		for (const rule of Object.values(normalized.linkRules)) {
			if (rule.type !== SUPERTYPE || !rule.variantArms) continue;
			for (const arm of rule.variantArms) variantChildKindsSet.add(arm);
		}
		const userFacingCtx: _UserFacingCtx = {
			aliasSourceKinds,
			variantChildKinds: variantChildKindsSet
		};
		for (const node of nodes.values()) {
			markUserFacing(node, userFacingCtx);
		}

		// Attach the node map to every branch/group so their `parameterless`
		// getter can resolve UnresolvedRef slots by name before hydrateSlotRefs
		// runs (pre-hydration == node-model.json5 serialization). This
		// replicates the former markParameterlessKinds fixpoint's name-lookup
		// and prevents spurious false-negatives on compound kinds whose only
		// required slot is an unresolved ref to a parameterless child.
		for (const node of nodes.values()) {
			if (node.modelType === 'branch' || node.modelType === 'group') {
				node.attachNodeMap(nodes);
			}
		}

		// Slot-ref hydration is NOT done here — `hydrateSlotRefs(nodes)` is
		// exported separately so the caller can serialize the unhydrated NodeMap
		// (e.g. node-model.json5) BEFORE wiring up cyclic AssembledNode refs.
		// Post-hydration the slot graph is cyclic and JSON.stringify breaks.

		// Back-pointer maps — let downstream consumers (the new template
		// emitter and friends) look up an AssembledNode / AssembledNonterminal
		// from a rule's `id` without owner traversal. See
		// feedback_ruleid_backpointer.
		const nodeByRuleId = new Map<RuleId, AssembledNode>();
		const slotByRuleId = new Map<RuleId, AssembledNonterminal>();
		for (const [kind, rule] of Object.entries(normalized.linkRules)) {
			const node = nodes.get(kind);
			if (!node) continue;
			if (rule.id) nodeByRuleId.set(rule.id, node);
		}
		for (const node of nodes.values()) {
			for (const slot of allSlotsOf(node)) {
				for (const id of slot.sourceRuleIds) slotByRuleId.set(id, slot);
			}
		}

		// Back-compat: also index raw FieldRule ids from `normalized.rules` so that
		// consumers holding a reference to the original field-wrapper rule (before
		// applyWrapperDeletion stripped it) can still resolve the slot. The leaf's
		// sourceRuleIds may differ from the FieldRule's id after wrapper-deletion
		// pushes modifier attrs down; walking the raw rules and name-matching
		// against the assembled slots bridges the gap without requiring the
		// pipeline to thread the FieldRule id through to the RenderRule leaf.
		for (const [kind, rawRule] of Object.entries(normalized.linkRules)) {
			const node = nodes.get(kind);
			if (!node) continue;
			const slotsByName = new Map<string, AssembledNonterminal>();
			for (const slot of allSlotsOf(node)) slotsByName.set(slot.name, slot);
			// Walk the raw rule tree collecting FieldRule ids by name.
			const walkForFieldIds = (r: Rule<'link'>): void => {
				if (r.type === FIELD && r.id) {
					const slot = slotsByName.get(r.name);
					if (slot && !slotByRuleId.has(r.id)) slotByRuleId.set(r.id, slot);
				}
				if ('members' in r && Array.isArray((r as { members?: unknown }).members)) {
					for (const m of (r as { members: Rule<'link'>[] }).members) walkForFieldIds(m);
				}
				if ('content' in r && (r as { content?: Rule<'link'> }).content) {
					walkForFieldIds((r as { content: Rule<'link'> }).content);
				}
			};
			walkForFieldIds(rawRule);
		}

		return {
			name: normalized.name,
			nodes,
			nodeByRuleId,
			slotByRuleId,
			aliasedHiddenKinds: normalized.aliasedHiddenKinds,
			signatures: computeSignatures(nodes),
			derivations: normalized.derivations,
			linkRules: normalized.linkRules,
			normalizedRules: normalized.normalizedRules,
			word: normalized.word,
			wordMatcher: normalized.wordMatcher,
			externals: normalized.externals ? new Set(normalized.externals) : undefined,
			polymorphFormKinds: computePolymorphFormKinds(nodes),
			refineForms: normalized.refineForms,
			parseKindCollisions: drainParseKindCollisionDiagnostics(),
			deriveShapeDiagnostics: drainDeriveShapeDiagnostics(),
			assembleWarnings: drainAssembleWarnings()
		};
	} finally {
		resetParseKindCollisionDiagnostics();
		resetDeriveShapeDiagnostics();
		resetAssembleWarnings();
		setOptionalBodyKinds(null);
	}
}

// No PolymorphRule/AssembledPolymorph model types exist at runtime —
// polymorphFormKinds is always empty. Kept in NodeMap for API stability.
function computePolymorphFormKinds(_nodes: Map<string, AssembledNode>): Set<string> {
	return new Set<string>();
}

function collectOptionalBodyKinds(rules: Record<string, Rule<'link'>>): ReadonlySet<string> {
	const out = new Set<string>();
	const isBlank = (r: Rule<'link'>): boolean =>
		(r.type === CHOICE && r.members.length === 0) || (r.type === SEQ && r.members.length === 0);
	const unwrap = (r: Rule<'link'>): Rule<'link'> => {
		if (r.type === ALIAS || r.type === TOKEN) {
			// PR-P Task 2: TERMINAL case removed — TerminalRule deleted from Rule<'link'> union.
			return unwrap((r as { content: Rule<'link'> }).content);
		}
		return r;
	};
	for (const [kind, rule] of Object.entries(rules)) {
		const body = unwrap(rule);
		if (body.type === OPTIONAL) {
			out.add(kind);
			continue;
		}
		if (body.type === CHOICE && body.members.some(isBlank)) {
			out.add(kind);
		}
	}
	return out;
}

// ---------------------------------------------------------------------------
// Supertype + group assembly helpers
// ---------------------------------------------------------------------------

function resolveSupertypeSubtypes(
	rule: Rule<'link'>,
	ctx: AssembleCtx,
	kindEntries: readonly GeneratedKindEntry[]
): SubtypeRef[] {
	let subtypes: SubtypeRef[];
	if (rule.type === SUPERTYPE) {
		subtypes = rule.subtypes.map((s) => ({ name: s.aliasedFrom ?? s.name, storageKindId: s.aliasedFromId ?? s.kindId }));
	} else if (rule.type === CHOICE) {
		subtypes = rule.members
			.map((m) => (m.type === VARIANT ? m.content : m))
			.filter((m): m is SymbolRule<'link'> => m.type === SYMBOL)
			.map((m) => ({ name: m.name, storageKindId: m.aliasedFromId ?? m.kindId }));
	} else {
		subtypes = [];
	}
	return resolveHiddenSubtypes(
		subtypes,
		ctx,
		kindEntries,
		rule.type === SUPERTYPE ? rule.name : undefined,
		rule.type === SUPERTYPE ? subtypeParseNamesOf(rule) : undefined
	);
}

function unwrapGroupRuleAndSimplified(
	rule: Rule<'link'>,
	simplifiedRule: SimplifiedRule,
	renderRule: RenderRule
): { groupRule: Rule<'link'>; groupSimplified: SimplifiedRule; groupRenderRule: RenderRule } {
	const groupRule = rule.type === GROUP ? rule.content : rule;
	// applyWrapperDeletion preserves group structure: renderRule.type === GROUP
	// when the source rule was a group, with renderRule.content being the
	// wrapper-deleted inner content. Same for simplifiedRule (simplifyRule recurses
	// through group wrappers preserving the outer group node).
	const groupSimplified = rule.type === GROUP ? (simplifiedRule as GroupRule<'simplify'>).content : simplifiedRule;
	const groupRenderRule: RenderRule =
		rule.type === GROUP ? ((renderRule as GroupRule<'normalize'>).content as RenderRule) : renderRule;
	return { groupRule, groupSimplified, groupRenderRule };
}

// ---------------------------------------------------------------------------
// resolveIrKeys — dedupe-aware short-name pass over the whole NodeMap
// ---------------------------------------------------------------------------

function resolveIrKeys(nodes: Map<string, AssembledNode>): void {
	const claimed = new Set<string>();
	preclaimSupertypeIrKeys(nodes, claimed);
	const { phase1, phase2 } = partitionNodesIntoIrKeyPhases(nodes);
	for (const node of phase1) assignIrKeyWithFallback(node, claimed);
	for (const node of phase2) assignIrKeyWithFallback(node, claimed);
}

function resolveHiddenSubtypes(
	names: readonly SubtypeRef[],
	ctx: AssembleCtx,
	kindEntries: readonly GeneratedKindEntry[],
	ownerName?: string,
	subtypeParseNames?: Readonly<Record<string, string>>
): SubtypeRef[] {
	const { normalizedRules: rules, topLevelAliasBodies } = ctx;
	// Post-synthesis-removal: the rules map is keyed by SOURCE kinds
	// only (hidden `_X`). Subtype names surface as source kinds; we
	// no longer redirect through the aliasedHiddenKinds table (which
	// pointed at visible alias targets). Hidden kinds that have their
	// own rule body are resolved via the rules map directly; the
	// chain terminates at a concrete symbol.
	const out: SubtypeRef[] = [];
	const seen = new Set<string>();
	const visit = (ref: SubtypeRef): void => {
		const name = ref.name;
		if (seen.has(name)) return;
		seen.add(name);
		if (!name.startsWith('_')) {
			out.push(ref);
			return;
		}
		const rule = rules[name];
		if (!rule) {
			out.push(ref);
			return;
		}
		// Declared parse-alias fact: this hidden arm MATERIALIZES as its own
		// node at this supertype site (SupertypeRule.subtypeParseNames, stamped
		// by classifyHiddenChoiceRule — types/rule.ts's doc comment on the
		// field). When the arm's own rule isn't ITSELF a nested SUPERTYPE, it's
		// a dedicated leaf/branch content kind (e.g. `_lhs_expression`, backed
		// by its own LhsExpressionTransport) that must survive as-is rather
		// than being flattened to its leaf members by resolveHiddenRuleContent
		// below.
		if (rule.type !== SUPERTYPE && subtypeParseNames && Object.prototype.hasOwnProperty.call(subtypeParseNames, name)) {
			out.push(ref);
			return;
		}
		// Nested-supertype arms (e.g. rust's `_non_delim_token` stamping
		// `_non_special_token`, itself a further SUPERTYPE with its own
		// subtypes) push the bare name, then walk THIS rule's OWN direct
		// `subtypes` list — NOT `resolveHiddenRuleContent`'s output, which
		// flattens straight through nested supertypes to their eventual leaf
		// kinds, erasing exactly the intermediate names `subtypeParseNames`
		// records. Each SUPERTYPE rule stamps its own map, keyed by its own
		// direct subtypes. A member with an entry there is substituted with
		// its alias ONLY when the member is ITSELF a nested SUPERTYPE — spec
		// 026's alias-materialization pass (assemble()'s main loop, right
		// after the kind-classification switch) registers a real
		// `AssembledSupertype` node for exactly that case, so the alias
		// resolves to a real node (confirmed via grammar.json — see
		// `loadGrammarJsonAliasMap`). A non-SUPERTYPE member with a
		// parse-name entry (e.g. `_primitive_type`, an all-STRING ENUM
		// aliased to `primitive_type` at this occurrence) has no such
		// separately registered node — only the hidden ENUM kind itself
		// exists — so it still recurses via `visit` as before.
		if (rule.type === SUPERTYPE) {
			out.push(ref);
			const nestedParseNames = subtypeParseNamesOf(rule);
			for (const subRef of rule.subtypes) {
				const sub = subRef.aliasedFrom ?? subRef.name;
				const subStamp = subRef.aliasedFromId ?? subRef.kindId;
				const parseName = nestedParseNames[sub];
				const subRule = sub.startsWith('_') ? rules[sub] : undefined;
				if (parseName !== undefined && subRule?.type === SUPERTYPE) {
					if (!seen.has(parseName)) {
						seen.add(parseName);
						// The alias-materialized name's own storageKindId belongs to
						// the separately registered AssembledSupertype node (spec 026)
						// — no ref here carries its stamp; legitimately unstamped.
						out.push({ name: parseName });
					}
					continue;
				}
				if (sub.startsWith('_')) {
					visit({ name: sub, storageKindId: subStamp });
					continue;
				}
				if (!seen.has(sub)) {
					seen.add(sub);
					out.push({ name: sub, storageKindId: subStamp });
				}
			}
			return;
		}
		if (topLevelAliasBodies.has(name)) out.push(ref);
		const resolved = resolveHiddenRuleContent(rule, new Set([name]), ctx, kindEntries);
		if (resolved.length === 0) {
			if (!out.some((o) => o.name === name)) out.push(ref);
			return;
		}
		for (const r of resolved) {
			// Recurse in case a hidden rule resolves to another hidden rule.
			if (r.name.startsWith('_')) {
				visit(r);
				continue;
			}
			if (!seen.has(r.name)) {
				seen.add(r.name);
				out.push(r);
			}
		}
	};
	for (const n of names) visit(n);
	return includeAliasMemberKinds(out, ctx, kindEntries, ownerName);
}

function includeAliasMemberKinds(
	subtypes: readonly SubtypeRef[],
	ctx: AssembleCtx,
	kindEntries: readonly GeneratedKindEntry[],
	ownerName?: string
): SubtypeRef[] {
	const { normalizedRules: rules } = ctx;
	const out = [...subtypes];
	const subtypeSet = new Set(subtypes.map((s) => s.name));
	let changed = true;
	while (changed) {
		changed = false;
		for (const name of Object.keys(rules)) {
			if (!name.startsWith('_')) continue;
			if (name === ownerName) continue;
			if (subtypeSet.has(name)) continue;
			if (!isAliasMemberKind(name, ctx, subtypeSet, kindEntries)) continue;
			// Structurally discovered (no ref points at this kind from the
			// supertype) — a catalog lookup is the only available stamp source.
			out.push({ name, storageKindId: findEntryForKindName(kindEntries, name)?.id });
			subtypeSet.add(name);
			changed = true;
		}
	}
	return out;
}

function isAliasMemberKind(
	name: string,
	ctx: AssembleCtx,
	subtypeSet: ReadonlySet<string>,
	kindEntries: readonly GeneratedKindEntry[]
): boolean {
	const { normalizedRules: rules, topLevelAliasBodies } = ctx;
	if (!topLevelAliasBodies.has(name)) return false;
	const body = rules[name];
	if (!body) return false;
	const resolved = resolveHiddenRuleContent(body, new Set([name]), ctx, kindEntries);
	if (resolved.length === 0) return false;
	return resolved.every((member) => isCompatibleSubtypeMember(member.name, ctx, subtypeSet, new Set(), kindEntries));
}

function isCompatibleSubtypeMember(
	name: string,
	ctx: AssembleCtx,
	subtypeSet: ReadonlySet<string>,
	seen: Set<string>,
	kindEntries: readonly GeneratedKindEntry[]
): boolean {
	const { normalizedRules: rules } = ctx;
	if (subtypeSet.has(name)) return true;
	if (!name.startsWith('_')) return false;
	if (seen.has(name)) return false;
	const rule = rules[name];
	if (!rule) return false;
	seen.add(name);
	const resolved = resolveHiddenRuleContent(rule, new Set([name]), ctx, kindEntries);
	if (resolved.length === 0) return false;
	return resolved.every((member) => isCompatibleSubtypeMember(member.name, ctx, subtypeSet, seen, kindEntries));
}

function resolveHiddenRuleContent(
	rule: RenderRule,
	seen: Set<string>,
	ctx: AssembleCtx,
	kindEntries: readonly GeneratedKindEntry[]
): SubtypeRef[] {
	const rules = ctx.normalizedRules;
	// Wrapper-opacity attribute checks — see doc comment. Must run BEFORE the
	// type switch: a repeat/repeat1/optional can wrap ANY rule shape, and the
	// collapsed leaf's `rule.type` is otherwise indistinguishable from an
	// unwrapped occurrence of that same type.
	if (rule.multiplicity === 'array' || rule.multiplicity === 'nonEmptyArray' || rule.multiplicity === 'optional') {
		return [];
	}
	if (rule.fieldName !== undefined) {
		return [];
	}
	// Generic alias-of-non-symbol fallback (the `else` branch of the former
	// ALIAS case — see doc comment). SYMBOL has its own `aliasedFrom` read
	// below (unchanged, predates this migration) so it's excluded here to
	// avoid short-circuiting its hidden-prefix/recursion logic. No stamp is
	// available here — `aliasedFrom`/`aliasedFromId` are a SYMBOL-only
	// pairing (types/rule.ts), and this rule isn't one.
	if (rule.aliasedFrom !== undefined && rule.type !== SYMBOL) {
		return [{ name: rule.aliasedFrom }];
	}
	// A closed literal-enum body (bare `choice` of all-STRING members, e.g.
	// rust's `_primitive_type` / the alias-minted `_token_tree_punctuation`
	// sentinel) is an opaque terminal set, not a compound structure to
	// decompose. Without this check, `case CHOICE` below flatMaps into every
	// member and `case STRING` returns non-word-shape literals verbatim —
	// harmless for word-shaped enums (`u8`, `i32`, ... all filtered out by
	// the STRING case's word-shape check, so they silently contribute
	// nothing), but for a punctuation enum (`+`, `-`, `%`, ...) every member
	// IS non-word-shape, so they all survive the flatMap and get reported as
	// bogus subtype names — crashing `emitSupertypeUnionDeclarations` with
	// "references subtype '%' which is not in NodeMap". Treating the WHOLE
	// enum as opaque (matching the existing SEQ case's opacity rationale)
	// makes punctuation enums behave the same as word-shaped ones instead of
	// applying the STRING case's word-shape filter per-member.
	if (isEnumChoiceRule(rule)) {
		return [];
	}
	switch (rule.type) {
		case SYMBOL: {
			const refName = rule.aliasedFrom ?? rule.name;
			const refStamp = rule.aliasedFromId ?? rule.kindId;
			if (!refName.startsWith('_')) return [{ name: refName, storageKindId: refStamp }];
			if (seen.has(refName)) return [];
			seen.add(refName);
			const target = rules[refName];
			return target ? resolveHiddenRuleContent(target, seen, ctx, kindEntries) : [{ name: refName, storageKindId: refStamp }];
		}
		case SUPERTYPE:
			return rule.subtypes.flatMap((symbolRef) => {
				const s = symbolRef.aliasedFrom ?? symbolRef.name;
				const sStamp = symbolRef.aliasedFromId ?? symbolRef.kindId;
				if (seen.has(s)) return [];
				seen.add(s);
				if (!s.startsWith('_')) return [{ name: s, storageKindId: sStamp }];
				const target = rules[s];
				return target ? resolveHiddenRuleContent(target, seen, ctx, kindEntries) : [{ name: s, storageKindId: sStamp }];
			});
		case CHOICE:
			return rule.members.flatMap((m) => resolveHiddenRuleContent(m, seen, ctx, kindEntries));
		case STRING: {
			// Grammar-token shape (name vs literal) — routed through the
			// grammar's own word-matcher (R12 Camp A); single source of
			// truth via matchesWordShape, replacing the former hardcoded
			// identifier-shape regex.
			const isWordShape = ctx.wordMatcher ? ctx.wordMatcher(rule.value) : matchesWordShape(rule.value, undefined);
			if (isWordShape) return [];
			// Same catalog-first resolution `collectAnonymousNodes` keys its
			// minted AssembledKeyword/AssembledToken nodes by — this literal's
			// NodeMap key is the catalog row's kind name when one exists (e.g.
			// `$` may dedupe under a sanitized/named catalog entry), not the
			// raw literal text. Returning the raw text here when a resolved
			// name exists would name a subtype the NodeMap never keys anything
			// under. A literal has no ref to stamp — the catalog lookup by
			// text IS the primary derivation, not a fallback for a lost stamp.
			const entry = findEntryForLiteralText(kindEntries, rule.value);
			return [{ name: entry?.kind ?? rule.value, storageKindId: rule.resolvedKindId ?? entry?.id }];
		}
		case VARIANT:
		case GROUP:
			return resolveHiddenRuleContent(rule.content, seen, ctx, kindEntries);
		case SEQ:
			// DECLARED opaque (not a `default:` fallthrough) — a bare multi-member
			// SEQ is a real structural body, not a wrapper collapse, most commonly
			// a polymorph-variant-adopted arm materialized as its own hidden kind
			// (e.g. python's `_simple_pattern_negative`, `SEQ[OPTIONAL('-'),
			// CHOICE(integer, float)]` — `grammar.sittir.ts`'s `_simple_pattern: { '11':
			// 'negative' }`). Recursing into a SEQ's members here would be WRONG:
			// the caller's "opaque → keep the hidden name as-is" fallback
			// (`resolveHiddenSubtypes`'s `resolved.length === 0` branch) is what
			// correctly preserves such a kind's OWN name as its subtype/alias-
			// member entry, instead of flattening it into its inner leaf types.
			// This was the exact PR-137 follow-on-4 finding: on `ctx.rules`
			// (SimplifiedRule), `simplifySeqRule`'s anonymous-literal stripping +
			// single-member-seq collapse turns this same SEQ into a bare
			// `CHOICE(integer, float)` — a shape the CHOICE case above DOES
			// handle — silently discarding `_simple_pattern_negative` and
			// resolving to `integer`/`float` instead (see `AssembleCtx`'s class
			// doc comment). Declaring this case explicitly (rather than relying
			// on `default:`) means a future switch-arm addition can't
			// accidentally start recursing into SEQ members without a reviewer
			// noticing the case is gone.
			return [];
		default:
			return [];
	}
}

export function hydrateSlotRefs(nodeMap: NodeMap): void {
	const externals = nodeMap.externals ?? new Set<string>();
	for (const [kind, node] of nodeMap.nodes) {
		if (node.modelType === 'branch' || node.modelType === 'group') {
			hydrateSlots(kind, node.slots, nodeMap.nodes, externals);
		}
		if (node.modelType === 'supertype') {
			hydrateValues(node.subtypes, { parentKind: kind, siteLabel: 'subtypes', nodes: nodeMap.nodes, externals });
		}
	}
}

function hydrateSlots(
	parentKind: string,
	slots: Readonly<Record<string, AssembledNonterminal>>,
	nodes: Map<string, AssembledNode>,
	externals: ReadonlySet<string>
): void {
	for (const slot of Object.values(slots)) {
		hydrateValues(slot.values, { parentKind, siteLabel: `slot '${slot.name}'`, nodes, externals });
	}
}

interface HydrateValuesCtx {
	readonly parentKind: string;
	readonly siteLabel: string;
	readonly nodes: Map<string, AssembledNode>;
	readonly externals: ReadonlySet<string>;
}

function hydrateValues(values: readonly NodeOrTerminal[], ctx: HydrateValuesCtx): void {
	const { parentKind, siteLabel, nodes, externals } = ctx;
	for (const v of values) {
		if (!isNodeRef(v)) continue;
		if (!isUnresolvedRef(v.node)) continue;
		const targetName = v.node.name;
		const target = nodes.get(targetName);
		if (target) {
			(v as { node: AssembledNode | UnresolvedRef }).node = target;
			continue;
		}
		// PR-K3f: the historical `_<name>` retry (visible alias-target name →
		// hidden MODEL node) was probed across all three grammars and fired
		// ZERO times — the mint now resolves canonical names, so every
		// hydratable ref hits the primary lookup above. Retired per the
		// KindId-NodeRefs spec §2.3 retire-list. A future grammar that
		// reintroduces visible→hidden refs surfaces below as the loud
		// unresolved-slot-reference diagnostic, not a silent rewire.
		// Three legitimate categories where the target ISN'T in the
		// assembled NodeMap and we leave the `UnresolvedRef` in place:
		//
		//   1. External tokens (lexer-callback symbols) — no rule body,
		//      just a name. Tracked in `nodeMap.externals`.
		//   2. Parser-only leaf kinds — the parser symbol table knows
		//      them but codegen has no rule body to assemble (e.g.
		//      `_as_pattern_target` in python). These behave like
		//      externals from the consumer's POV.
		//   3. Inlined-before-assemble kinds referenced by overrides —
		//      a known deferred case (see e.g. `_block_comment_content`
		//      in rust). Should be cleaned up at the override layer.
		//
		// Distinguishing (1) from (2)/(3) without threading the parser
		// kind catalog isn't possible here. Logging a single line per
		// occurrence surfaces the (3) cases for follow-up; (1) and (2)
		// are expected and harmless. Consumers that walk
		// `slot.values[*]` already handle `isUnresolvedRef` defensively,
		// so leaving these as `UnresolvedRef` matches prior
		// behavior.
		if (externals.has(targetName)) continue;
		if (!process.env.SITTIR_QUIET) {
			process.stderr.write(
				`hydrateSlotRefs: unresolved slot reference — kind ` +
					`'${parentKind}' ${siteLabel} references kind ` +
					`'${targetName}' which is absent from the assembled ` +
					`node map (likely parser-only leaf kind, alias collapse, ` +
					`or override referencing an inlined kind). Leaving as ` +
					`UnresolvedRef.\n`
			);
		}
	}
}

interface _UserFacingCtx {
	readonly aliasSourceKinds: ReadonlySet<string>;
	readonly variantChildKinds: ReadonlySet<string>;
}

function markUserFacing(node: AssembledNode, ctx: _UserFacingCtx): void {
	const { kind } = node;
	if (node.modelType === 'token' || node.modelType === 'multi') {
		// token/multi are structural delimiters — never directly user-facing.
		// NOTE: the OR with variantChildKinds is intentionally AFTER the
		// token/multi guard so that a theoretical token/multi variant-child
		// would still be promoted. The original pass-2 applied unconditionally
		// after pass-1 set token/multi→false, so this matches the union exactly.
		node.userFacing = ctx.variantChildKinds.has(kind);
		return;
	}
	if (!kind.startsWith('_')) {
		// Visible kinds are always user-facing.
		node.userFacing = true;
		return;
	}
	// Hidden — user-facing when any of the conditions above hold (b/c/d).
	node.userFacing = ctx.aliasSourceKinds.has(kind) || ctx.variantChildKinds.has(kind);
}

function resolveCollidingNames(nodes: Map<string, AssembledNode>): void {
	// Group nodes by typeName. Preferred winner: the non-hidden kind.
	const byType = new Map<string, AssembledNode[]>();
	for (const node of nodes.values()) {
		const bucket = byType.get(node.typeName) ?? [];
		bucket.push(node);
		byType.set(node.typeName, bucket);
	}
	for (const [typeName, group] of byType) {
		if (group.length < 2) continue;
		const visible = group.filter((n) => !n.kind.startsWith('_'));
		const hidden = group.filter((n) => n.kind.startsWith('_'));
		if (visible.length >= 1 && hidden.length >= 1) {
			renameCollidingHiddenKinds(visible, hidden, typeName);
		} else if (visible.length >= 2) {
			renameCollidingVisibleKinds(visible, typeName);
		} else if (hidden.length >= 2) {
			renameCollidingHiddenOnlyKinds(hidden, typeName);
		}
	}
}

function renameCollidingHiddenKinds(visible: AssembledNode[], hidden: AssembledNode[], typeName: string): void {
	const hasNonTokenVisible = visible.some((n) => n.modelType !== 'token');
	if (!hasNonTokenVisible) return;
	for (const h of hidden) {
		const newType = `_${typeName}`;
		recordAssembleWarning({
			code: 'typename-collision',
			message:
				`[assemble] typeName collision: kind '${h.kind}' renamed ` +
				`'${typeName}' → '${newType}' (visible sibling(s): ${visible.map((v) => `'${v.kind}'`).join(', ')})`,
			ownerKind: h.kind,
			details: { typeName, newType, visibleKinds: visible.map((v) => v.kind) }
		});
		h.typeName = newType;
		if (h.factoryName !== undefined) {
			// _TypeName → _typeName (camelCase with leading _)
			h.factoryName = `_${typeName.charAt(0).toLowerCase()}${typeName.slice(1)}`;
		}
	}
}

function renameCollidingVisibleKinds(visible: AssembledNode[], typeName: string): void {
	const sorted = [...visible].sort((a, b) => a.kind.localeCompare(b.kind));
	for (let i = 1; i < sorted.length; i++) {
		const n = sorted[i]!;
		const newType = `${typeName}${i + 1}`;
		recordAssembleWarning({
			code: 'typename-collision',
			message:
				`[assemble] typeName collision between visible kinds: '${n.kind}' renamed ` +
				`'${typeName}' → '${newType}' (siblings: ${sorted
					.slice(0, i)
					.map((s) => `'${s.kind}'`)
					.join(', ')})`,
			ownerKind: n.kind,
			details: { typeName, newType, siblingKinds: sorted.slice(0, i).map((s) => s.kind) }
		});
		n.typeName = newType;
		if (n.factoryName !== undefined) {
			n.factoryName = newType.charAt(0).toLowerCase() + newType.slice(1);
		}
	}
}

function renameCollidingHiddenOnlyKinds(hidden: AssembledNode[], typeName: string): void {
	for (let i = 1; i < hidden.length; i++) {
		const h = hidden[i]!;
		const newType = `${typeName}${i + 1}`;
		recordAssembleWarning({
			code: 'typename-collision',
			message: `[assemble] typeName collision among hidden kinds: '${h.kind}' renamed '${typeName}' → '${newType}'`,
			ownerKind: h.kind,
			details: { typeName, newType }
		});
		h.typeName = newType;
		if (h.factoryName !== undefined) {
			h.factoryName = newType.charAt(0).toLowerCase() + newType.slice(1);
		}
	}
}

function preclaimSupertypeIrKeys(nodes: Map<string, AssembledNode>, claimed: Set<string>): void {
	for (const node of nodes.values()) {
		if (node.modelType !== 'supertype') continue;
		claimed.add(shortenIrKey(node.kind));
	}
}

function partitionNodesIntoIrKeyPhases(nodes: Map<string, AssembledNode>): {
	phase1: AssembledNode[];
	phase2: AssembledNode[];
} {
	const phase1: AssembledNode[] = [];
	const phase2: AssembledNode[] = [];
	for (const node of nodes.values()) {
		if (!node.factoryName) continue;
		if (node.modelType === 'group') continue;
		const short = shortenIrKey(node.kind);
		if (short === node.factoryName) phase1.push(node);
		else phase2.push(node);
	}
	const hiddenSort = (a: AssembledNode, b: AssembledNode) => {
		const aHidden = a.kind.startsWith('_') ? 1 : 0;
		const bHidden = b.kind.startsWith('_') ? 1 : 0;
		return aHidden - bHidden;
	};
	phase1.sort(hiddenSort);
	phase2.sort(hiddenSort);
	return { phase1, phase2 };
}

function assignIrKeyWithFallback(node: AssembledNode, claimed: Set<string>): void {
	const short = shortenIrKey(node.kind);
	if (!claimed.has(short)) {
		claimed.add(short);
		node.irKey = short;
		return;
	}
	let full = node.factoryName!;
	let candidate = full;
	let n = 2;
	while (claimed.has(candidate)) {
		candidate = `${full}${n++}`;
	}
	claimed.add(candidate);
	node.irKey = candidate;
}

function shortenIrKey(kind: string): string {
	const stripped = kind;
	const parts = stripped.split('_').filter(Boolean);
	if (parts.length === 0) return nameNode(kind).irKey;
	const camel = parts.map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1))).join('');
	return camel;
}

// ---------------------------------------------------------------------------
// collectAnonymousNodes — extract string literals from rules as token/keyword entries
// ---------------------------------------------------------------------------

// "Keyword shape" (does a literal lex as a word under the grammar's `word`
// rule?) is tested via `matchesWordShape` from util/word-matcher.ts — the single
// source of truth that bakes the `/^\w+$/` fallback. Both call sites
// (collectAnonymousNodes and classifyNode's STRING case) route through it.

function collectAnonymousNodes(
	rules: Record<string, Rule<'link'>>,
	nodes: Map<string, AssembledNode>,
	wordMatcher: RegExp | undefined,
	kindEntries: readonly GeneratedKindEntry[]
): void {
	const seen = new Map<string, string>();

	for (const rule of Object.values(rules)) {
		// PR-P Task 2: skip COMPOUND all-text rules (SEQ/CHOICE/OPTIONAL/REPEAT/REPEAT1).
		// These arise from tree-sitter TOKEN bodies that Link flattens to bare SEQ/CHOICE/etc.
		// The string literals inside are token-internal fragments (e.g. the "b" byte-prefix
		// inside `char_literal`) — they are NOT distinct CST node kinds and must not be
		// collected as anonymous nodes. Previously Link's `promoteAndLogTerminalRules` wrapped
		// these as TerminalRule, so `walkForStrings` hit the default case and returned without
		// collecting anything. After Task 2 removes TerminalRule, we replicate the gate via
		// isAllTextShape on compound rule types.
		//
		// We deliberately EXCLUDE bare STRING/PATTERN rules from this guard: those contribute
		// their own literal as the first `seen` entry, preserving the collection order that
		// was established when they were top-level STRING/PATTERN rules before TOKEN-flattening.
		if (rule.type !== STRING && rule.type !== PATTERN && isAllTextShape(rule)) continue;
		walkForStrings(rule, seen);
	}

	for (const [kindName, literalText] of seen) {
		if (literalText === '' || /^\s+$/.test(literalText)) continue; // Skip whitespace/empty

		// Resolve through the catalog FIRST (anon-token-first chain — the same
		// resolution AssembledKeyword/AssembledToken's own constructor uses to
		// stamp resolvedKind/resolvedKindId) so the minted node is keyed by the
		// catalog row's kind name, not the literal's raw text. Tree-sitter often
		// sanitizes or dedupes anonymous literals under a different name
		// (`,` → `comma`, `mut` → `mutable_specifier`) — keying by raw text mints
		// a phantom name with no id row even though the token already has one.
		const catalogEntry = findEntryForLiteralText(kindEntries, literalText);
		const resolvedKind = catalogEntry?.kind ?? kindName;
		if (nodes.has(resolvedKind)) continue; // Already classified as a named rule (or dedup target)

		if (catalogEntry === undefined) {
			// No catalog row for this literal — fall back to raw-text keying and
			// surface it in the same grammar-diagnostics.json stream the link-time
			// kindid-unstamped-* report uses, so this fallback is visible and
			// ratcheted rather than silently minting a phantom.
			recordAssembleWarning({
				code: 'kindid-unstamped-anon-literal',
				message: `[assemble] anonymous literal ${JSON.stringify(literalText)} resolved no parser kindId — keyed by raw text '${kindName}'`,
				ownerKind: kindName,
				details: { literalText }
			});
		}

		const isWordShape = matchesWordShape(literalText, wordMatcher);
		const syntheticStringRule: StringRule<'link'> = { type: STRING, value: literalText };

		if (isWordShape) {
			// Keyword token (e.g., "if", "class", "pub")
			// Anonymous keywords from grammar — no factory (hidden: no user construction path)
			nodes.set(resolvedKind, new AssembledKeyword(resolvedKind, syntheticStringRule, { hidden: true, kindEntries }));
		} else {
			// Operator/punctuation token (e.g., "+", "->", "{")
			nodes.set(resolvedKind, new AssembledToken(resolvedKind, syntheticStringRule, { kindEntries }));
		}
	}
}

function walkForStrings(rule: Rule<'link'>, out: Map<string, string>): void {
	switch (rule.type) {
		case STRING:
			out.set(rule.value, rule.value);
			break;
		case SYMBOL:
			if (isLinkSymbol(rule) && rule.literal !== undefined) {
				out.set(rule.name, rule.literal);
			}
			break;
		// PR-P: ENUM case removed — enum-shaped ChoiceRules fall through to CHOICE.
		case SEQ:
			for (const m of rule.members) walkForStrings(m, out);
			break;
		case CHOICE:
			// Do NOT descend into enum-shaped choices. Two forms must be guarded:
			// 1. Pre-link: all members are STRING nodes (isEnumChoiceRule).
			// 2. Post-link: all members are LINK-SYMBOL nodes (canonicalizeRuleLiterals).
			if (isEnumChoiceRule(rule)) break;
			if (rule.members.length >= 2 && rule.members.every((m) => isLinkSymbol(m) && m.literal !== undefined)) break;
			for (const m of rule.members) walkForStrings(m, out);
			break;
		case OPTIONAL:
			walkForStrings(rule.content, out);
			break;
		case REPEAT:
			walkForStrings(rule.content, out);
			break;
		case FIELD:
			walkForStrings(rule.content, out);
			break;
		case VARIANT:
			walkForStrings(rule.content, out);
			break;
		case GROUP:
			walkForStrings(rule.content, out);
			break;
	}
}

// ---------------------------------------------------------------------------
// classifyNode — structural simplification + visibility
// ---------------------------------------------------------------------------

type ModelType = AssembledNode['modelType'];

// `inlineRefs` / `resolveGroupOrMultiInlineTarget` moved to
// `simplify.ts` so the group-inlining happens inside the simplify
// fixpoint (enables flatten + canonicalize to re-fire on inlined
// content). Imported above; no longer defined here.

// Phase-invariant leaf check, usable by both `classifyNode` and
// `buildInlinableKinds` (inline-sets.ts) — see "classifyNode's RenderRule-only
// design" in docs/compiler-phase-glossary.md.
export function isNonInlinableLeafShape(rule: AnyRule): boolean {
	if (isEnumChoiceRule(rule)) return true;
	return rule.type === SUPERTYPE || rule.type === PATTERN || rule.type === STRING;
}

// Reads RenderRule directly — see "classifyNode's RenderRule-only design" in
// docs/compiler-phase-glossary.md. Kept as a module-level export purely for
// assemble.test.ts's direct unit coverage; assemble()'s own loop is the only
// real caller.
export function classifyNode(
	kind: string,
	rule: RenderRule,
	opts?: { variantParents?: ReadonlySet<string>; parentAliasedKinds?: ReadonlySet<string>; wordMatcher?: RegExp }
): ModelType {
	// Guards against a DECORATED PATTERN/STRING (wrapper-collapsible content
	// masquerading as bare) early-exiting wrong — see "classifyNode's
	// RenderRule-only design" in docs/compiler-phase-glossary.md.
	if (rule.fieldName === undefined && rule.multiplicity === undefined) {
		// Enum-shaped ChoiceRules aren't one of the switch cases below — detect
		// them directly via isEnumChoiceRule.
		if (isEnumChoiceRule(rule)) return 'enum';
		switch (rule.type) {
			case SUPERTYPE:
				return 'supertype';
			case GROUP:
				return 'group';
			// No TERMINAL case: that rule type doesn't exist — terminal-shaped
			// leaves classify via classifyTerminalFallback below instead.
			case PATTERN:
				return 'pattern';
			case STRING:
				// keyword vs token honours the grammar's `word` rule — see matchesWordShape.
				return matchesWordShape(rule.value, opts?.wordMatcher) ? 'keyword' : 'token';
		}
	}

	if (isHiddenRepeatHelper(kind, rule, opts?.parentAliasedKinds)) return 'multi';
	if (isSeparatedListShape(rule)) return 'separatedList';
	const branchOrContainer = classifyBranchOrContainer(rule);
	if (branchOrContainer !== null) return branchOrContainer;
	return classifyTerminalFallback(kind, rule);
}

function isSeparatedListShape(rule: RenderRule): boolean {
	if (rule.multiplicity !== 'array' && rule.multiplicity !== 'nonEmptyArray') return false;
	const sep = rule.separator;
	if (sep === undefined) return false;
	if (isNonterminalRuleType(sep.value)) return true;
	// Only a genuinely OPTIONAL flank has per-instance variability worth
	// this classification — 'mandatory' (always present) is compile-time
	// renderable exactly like 'none' (absent), and stays classified as
	// 'branch' via the pre-existing hasTrailing/hasLeading mechanism.
	return sep.trailing === 'optional' || sep.leading === 'optional';
}

function isHiddenRepeatHelper(kind: string, rule: RenderRule, parentAliasedKinds?: ReadonlySet<string>): boolean {
	if (!kind.startsWith('_')) return false;
	if (rule.multiplicity !== 'array' && rule.multiplicity !== 'nonEmptyArray') return false;
	// If this kind appears as the content of a named alias in any parent rule,
	// it produces a real runtime CST node — do NOT classify as multi.
	if (parentAliasedKinds?.has(kind)) return false;
	return true;
}

function classifyBranchOrContainer(rule: RenderRule): ModelType | null {
	if (hasSlotBearingContent(rule)) return 'branch';
	return null;
}

// Replaces the link-phase `hasAnyField(rule) || hasAnyChild(rule)` walk with
// the same, narrower question — see "classifyNode's RenderRule-only design"
// in docs/compiler-phase-glossary.md.
function hasSlotBearingContent(rule: RenderRule): boolean {
	if (rule.fieldName !== undefined) return true;
	switch (rule.type) {
		case SYMBOL:
		case SUPERTYPE:
			return true;
		case SEQ:
		case CHOICE:
			return rule.members.some(hasSlotBearingContent);
		case VARIANT:
		case GROUP:
			return hasSlotBearingContent(rule.content);
		default:
			return false;
	}
}

function classifyTerminalFallback(kind: string, rule: RenderRule): ModelType {
	// isEnumChoiceRule checked BEFORE isAllTextShape — an all-STRING ChoiceRule
	// passes isAllTextShape too, but must classify as 'enum', not 'pattern'.
	if (isEnumChoiceRule(rule)) return 'enum';
	if (isAllTextShape(rule)) return 'pattern';
	throw new Error(
		`classifyNode: '${kind}' has no fields, no children, and no rule-type ` +
			`classification. Link should have wrapped it as TerminalRule. rule.type=${rule.type}`
	);
}

// Phase-invariant by construction — see "classifyNode's RenderRule-only
// design" in docs/compiler-phase-glossary.md for why one implementation
// correctly serves all three real callers.
export function isAllTextShape(rule: AnyRule): boolean {
	switch (rule.type) {
		case STRING:
		case PATTERN:
			return true;
		case SYMBOL:
		case FIELD:
			return false;
		case SEQ:
		case CHOICE:
			return rule.members.length > 0 && rule.members.every(isAllTextShape);
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case TOKEN:
		case VARIANT:
		case GROUP:
			return isAllTextShape(rule.content);
		default:
			return false;
	}
}

// ---------------------------------------------------------------------------
// simplifyRule lives in compiler/simplify.ts and now runs as a
// dedicated pipeline stage at the end of `normalizeGrammar()`. Re-exported
// here so the existing assemble.test.ts import site keeps working.
// ---------------------------------------------------------------------------

export { simplifyRule };

// ---------------------------------------------------------------------------
// extractFields — walk rule tree, collect fields with derived metadata
// ---------------------------------------------------------------------------

// extractForms — deleted along with the PolymorphRule IR type and its
// AssembledPolymorph node class; no 'polymorph' classification exists in
// assemble's dispatch anymore.

// ---------------------------------------------------------------------------
// Naming
// ---------------------------------------------------------------------------
// nameNode has moved to node-map.ts (imported above); re-exported here for
// backwards compatibility with assemble.test.ts and any other callers that
// import it from this module.
export { nameNode } from './model/node-map.ts';

// `extractRepeatShape` moved to `simplify.ts` (needed by the inlining
// fixpoint and re-exported for the remaining assemble call sites). The
// function's own semantics are unchanged — peels optional / variant /
// clause / group / token wrappers to expose a `repeat` / `repeat1`.

// ---------------------------------------------------------------------------
// Signatures & Projections (stubs — full implementation in refinement)
// ---------------------------------------------------------------------------

function computeSignatures(_nodes: Map<string, AssembledNode>): SignaturePool {
	return { signatures: new Map() };
}
