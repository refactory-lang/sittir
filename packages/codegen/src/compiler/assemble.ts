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
import { isLinkSymbol, isEnumChoiceRule } from '../types/rule.ts';
import { isNonterminalRuleType } from './rule-catalog.ts';
import type { SimplifiedGrammar, NodeMap, SignaturePool } from './types.ts';
import type { RuleId } from '../types/rule.ts';
import { collectGeneratedKindEntries, type GeneratedIdTables, type GeneratedKindEntry } from './generated-metadata.ts';
import type { AssembledNode, AssembledNonterminal, UnresolvedRef } from './model/node-map.ts';
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
	hasAnyField,
	hasAnyChild,
	nameNode,
	isNodeRef,
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
import { inlineRefs, extractRepeatShape } from '../dsl/rule-transforms.ts';
import { matchesWordShape } from '../util/word-matcher.ts';
import type { ParseKindCollisionDiagnostic } from '../types/parsekind-collisions.ts';
import type { DeriveShapeDiagnostic } from './diagnostics/derive-shapes.ts';
import { DiagnosticSink } from '../types/diagnostics.ts';
import { BaseCtx, type BaseCtxInit } from './ctx.ts';

/**
 * Phase context for the Assemble phase (S2, `BaseCtx<'simplify'>` — Assemble
 * READS `Grammar<'simplify'>` = {@link SimplifiedGrammar}; see
 * docs/superpowers/specs/2026-07-04-grammar-phase-ctx-design.md §2). The
 * grammar container itself now lives on `ctx.grammar` — `assemble()`'s former
 * `(normalized, ctx)` two-param signature folds into just `(ctx)` (§2: "the
 * whole input container moves INTO the ctx").
 *
 * Absorbs the former `SubtypeCtx` (`topLevelAliasBodies` — R4 / #14; `seen`
 * cycle-guards and the per-call subtypeSet stay explicit pass-local params,
 * CW6). The hidden-body/subtype-resolution family (`resolveHiddenSubtypes` /
 * `includeAliasMemberKinds` / `isAliasMemberKind` / `isCompatibleSubtypeMember`
 * / `resolveHiddenRuleContent`) migrated OFF `linkRules` onto `normalizedRules`
 * (2026-07-05, PR-137 follow-on-3): the wrapper shapes that switch used to
 * pattern-match (REPEAT/REPEAT1/OPTIONAL/ALIAS/TOKEN) don't exist post-
 * wrapper-deletion — their meaning is stamped as leaf attributes
 * (`multiplicity`/`aliasedFrom`/`aliasNamed`/`fieldName`) — so the family now
 * checks those attributes BEFORE dispatching on `rule.type`. See each
 * function's doc comment for its specific translation.
 *
 * PR-137 follow-on-4 (same day) re-examined that choice: follow-on-3's own
 * justification ("wrapper shapes don't exist here") is EQUALLY true of
 * `ctx.rules` (`SimplifiedRule` — also wrapper-free, `SimplifiedGrammar`'s own
 * phase product, the map `assemble()`'s input container is actually named
 * for) — so it never actually established why `normalizedRules` beat `rules`.
 * Migrating the family to `ctx.rules` was tried and EMPIRICALLY REJECTED: it
 * changes real output. Across all 3 grammars' hidden supertype/alias-mint
 * chains, exactly one diverges — python's `_simple_pattern` supertype loses
 * its `_simple_pattern_negative` subtype entry (the polymorph-variant-adopted
 * `-1`/`-1.0` match-pattern arm, `overrides.ts`'s `_simple_pattern: { '11':
 * 'negative' }`) and gains bogus `integer`/`float` entries instead — verified
 * via `pnpm exec tsx packages/cli/src/cli.ts gen --grammar python …`: the
 * regen diff shows `node-model.json5`'s `_simple_pattern.subtypes` changing,
 * cascading into `types.ts`'s `SimplePattern` union (dropping
 * `SimplePatternNegative`) and `transport.rs`'s dispatch table (deleting the
 * kind_id-250 arm entirely) — a real runtime dispatch break for `-1` literal
 * match patterns, not a cosmetic difference. rust (16 supertypes) and
 * typescript (26 supertypes) showed zero divergence; python showed this one.
 *
 * Root cause: `_simple_pattern_negative`'s body is `SEQ[OPTIONAL('-'),
 * CHOICE(integer, float)]`. On `normalizedRules` (wrapper-deletion only) this
 * stays a top-level SEQ — a shape `resolveHiddenRuleContent`'s switch has NO
 * case for, so it falls to `default: []` (opaque), and the caller's "opaque →
 * keep the hidden name as-is" fallback correctly preserves
 * `_simple_pattern_negative` as its own subtype entry. On `rules`,
 * `simplifySeqRule`'s anonymous-literal stripping deletes the bare `-` (not
 * slot-promoted) and the resulting single-member seq collapses to the inner
 * `CHOICE(integer, float)` — a shape the switch DOES handle, so it wrongly
 * expands to `integer`/`float` directly, discarding the variant-adopted
 * kind's own name. This is the SAME bug class the `_delim_tokens` regression
 * fixture below already guards (an opaque wrapper shape being unmasked into a
 * dispatchable one), but triggered by simplify's SEQ-collapse rather than by
 * wrapper-deletion's multiplicity stamping — and there is no leaf attribute
 * (analogous to `multiplicity`/`fieldName`) that survives simplify's
 * canonicalization to flag "this used to be an opaque multi-member SEQ",
 * so an attribute check can't neutralize it the way the multiplicity/
 * fieldName checks neutralize the wrapper-deletion case. The family's
 * opacity-via-shape fallback depends on the input NOT having gone through
 * simplify's independent structural canonicalization (anon-literal SEQ
 * stripping, single-member collapse, branch-merging) — `normalizedRules`
 * (wrapper-deletion only) is the correct, and only correct, source for that
 * reason, not merely a leftover choice. Since `resolveHiddenRuleContent` is
 * one shared primitive reachable from any hidden kind via mutual recursion
 * across all five family functions, this can't be split per-function or
 * per-kind — the whole family reads the same map uniformly.
 *
 * `topLevelAliasBodies` stays as a distinct field: it isn't a body cache (its
 * VALUES are fully reproducible from `normalizedRules[name]` — verified
 * empirically, every alias-body kind across all 3 grammars satisfies
 * `normalizedRules[name] === applyWrapperDeletion(topLevelAliasBodies.get(name))`),
 * it's a *presence* table (which hidden kinds are alias-mint targets at all)
 * with no rule-level attribute equivalent — a hidden kind's own rule body
 * carries no trace of being aliased-TO by some other rule elsewhere in the
 * grammar.
 *
 * `rules` reads `grammar.rules` — same one-liner as every other phase ctx
 * (2026-07-05: `SimplifiedGrammar`'s phase product field was renamed from
 * `simplifiedRules` to `rules`, closing the one exception this class used to
 * need; see `Grammar<P>`'s doc comment in types.ts). `normalizedRules` stays
 * exposed as its own getter below — the resolver family (and no one else on
 * this ctx) reads it directly, per the correction above.
 *
 * `nodes` is the cross-node store the post-passes need for `markUserFacing` /
 * resolveColliding / resolveIrKeys / collectAnonymous — a live `Map` so the
 * post-passes can read peers; exposed as a getter (the class's one mutation
 * surface) rather than a bare public field. `kindEntries` feeds the same
 * per-node constructors that previously received it positionally.
 */
export class AssembleCtx extends BaseCtx<'simplify'> {
	readonly kindEntries?: readonly GeneratedKindEntry[];
	readonly generatedIdTables?: GeneratedIdTables;
	readonly topLevelAliasBodies: ReadonlyMap<string, Rule<'link'>>;
	private readonly _nodes: Map<string, AssembledNode>;

	constructor(
		init: BaseCtxInit<'simplify'> & {
			generatedIdTables?: GeneratedIdTables;
			kindEntries?: readonly GeneratedKindEntry[];
			topLevelAliasBodies?: ReadonlyMap<string, Rule<'link'>>;
			nodes?: Map<string, AssembledNode>;
		}
	) {
		super(init);
		this.kindEntries = init.kindEntries;
		this.generatedIdTables = init.generatedIdTables;
		this.topLevelAliasBodies = init.topLevelAliasBodies ?? new Map();
		this._nodes = init.nodes ?? new Map();
	}

	/** `grammar.rules` — `SimplifiedGrammar`'s phase product (see class doc comment). */
	get rules(): Record<string, SimplifiedRule> {
		return this.grammar.rules;
	}

	/**
	 * `grammar.normalizedRules` — the wrapper-deleted `RenderRule` view. The
	 * hidden-body/subtype-resolution family's map source (see class doc
	 * comment's PR-137 follow-on-4 correction for why `rules`/`SimplifiedRule`
	 * is NOT safe here: simplify's independent structural canonicalization —
	 * beyond wrapper-deletion — can unmask an intentionally opaque SEQ shape
	 * into a dispatchable one, corrupting the family's "unresolvable → keep
	 * the hidden name" fallback for polymorph-variant-adopted arms). Modifier
	 * wrappers (optional/field/repeat/repeat1/alias/token) are pushed down to
	 * leaf attributes (`multiplicity`/`fieldName`/`separator`/`aliasedFrom`/
	 * `aliasNamed`); structural rules (seq/choice/variant/group/supertype) are
	 * preserved and recursed into — the honest post-normalize equivalent of
	 * `linkRules` for callers that read attributes instead of wrapper shape.
	 */
	get normalizedRules(): Record<string, RenderRule> {
		return this.grammar.normalizedRules;
	}

	/** Live node-map accumulator built during assemble(); post-passes read peers from it. */
	get nodes(): Map<string, AssembledNode> {
		return this._nodes;
	}

	/**
	 * Canonical construction from a SimplifiedGrammar — the ONE derivation of
	 * the assemble view (the grammar container, alias bodies). Callers own
	 * the ctx (R12): generate.ts passes its live DiagnosticSink; tests take
	 * the default.
	 *
	 * The grammar word-matcher is NOT derived here — it's pinned once at Link
	 * time (`link.ts`, from `raw.rules`) and carried onto `normalized.wordMatcher`
	 * unchanged; see `LinkedGrammar.wordMatcher`'s doc comment.
	 */
	static from(
		normalized: SimplifiedGrammar,
		generatedIdTables?: GeneratedIdTables,
		diagnostics: DiagnosticSink = new DiagnosticSink()
	): AssembleCtx {
		return new AssembleCtx({
			grammar: normalized,
			diagnostics,
			wordMatcher: (s) => matchesWordShape(s, normalized.wordMatcher),
			generatedIdTables,
			topLevelAliasBodies: normalized.topLevelAliasBodies ?? new Map()
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
/**
 * @param ctx - The Assemble phase context; `ctx.grammar` (`Grammar<'simplify'>`
 *   = {@link SimplifiedGrammar}) is the input container — folded in per §2
 *   (formerly a separate `normalized` positional param).
 */
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
			const modelType = classifyNode(kind, inlinedRule, {
				variantParents,
				parentAliasedKinds: normalized.parentAliasedKinds,
				wordMatcher: wordMatcherRegex
			});
			// `rules[kind]` (SimplifiedGrammar's phase product) and `normalizedRules[kind]`
			// are both pre-computed by normalize — alias-body kinds are now also
			// snapshotted there (PR2 Task 3.B-prereq-alias).
			const simplifiedRule = normalized.rules[kind]!;
			const renderRule: RenderRule = normalized.normalizedRules![kind]!;
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
					const subtypes = resolveSupertypeSubtypes(assemblyRule, ctx);
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
					const shape = extractRepeatShape(inlinedRule);
					if (!shape) {
						throw new Error(
							`assemble: '${kind}' classified as 'multi' but extractRepeatShape ` +
								`returned null — classifier and extractor must agree on shape.`
						);
					}
					nodes.set(kind, new AssembledMulti(kind, shape.repeat));
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
					const name = isUnresolvedRef(v.node) ? v.node.name : v.node.kind;
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

/**
 * Identify rule kinds whose resolved body is wholly optional — references
 * to these are effectively optional at every use site, regardless of how
 * the SYMBOL ref sits in its parent rule. See `currentOptionalBodyKinds`
 * in node-map.ts for the consumer side.
 *
 * A body counts as wholly optional when, stripping transparent wrappers
 * (alias, token, terminal — none of which change "can this match
 * invisibly?" semantics), the top-level form is one of:
 *   - `optional(X)` — the canonical post-stamp shape (DSL-time
 *     `choice(blank, X)` lowers to this; `stampStaticRenderAs`
 *     re-applies the same lowering after blank substitution).
 *   - `choice(...)` containing the blank sentinel. Defensive — the stamp
 *     pass collapses these to `optional()` already, but authored rules
 *     might use this shape directly.
 *
 * Sittir's `terminal` wrapper appears in promoted rules (e.g.
 * `_semicolon` becomes `terminal(optional(';'))` after the normalize
 * fixpoint). Without stripping it, the optionality would be hidden one
 * layer deep and the slot model would still treat references as
 * required-single.
 */
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

/**
 * Resolve the subtype kind list for a supertype node from its rule.
 *
 * @param rule - The rule as it appears in `normalized.linkRules` (pre-inlining;
 *   fed by the caller's main assemble loop — see `assemble()`'s own iteration
 *   over `normalized.linkRules`, out of scope for the `ctx.normalizedRules`
 *   read below since this parameter is dictated by that caller, not by this
 *   function's own map reads).
 * @param ctx - The Assemble phase context, used for hidden-rule resolution.
 * @returns The ordered list of concrete kind names that are members of this
 *   supertype union after resolving any hidden-rule indirections.
 * @remarks
 *   Sources in priority order:
 *   1. `SupertypeRule<'link'>.subtypes` — Link's pre-computed list.
 *   2. `choice` members — each `symbol` child's name (fallback).
 *   3. Empty list — for any other rule shape (best-effort).
 *
 *   Hidden names (`_foo`) are then resolved to the concrete kinds that
 *   tree-sitter actually surfaces at runtime via {@link resolveHiddenSubtypes}.
 */
function resolveSupertypeSubtypes(rule: Rule<'link'>, ctx: AssembleCtx): string[] {
	let subtypes: string[];
	if (rule.type === SUPERTYPE) {
		subtypes = rule.subtypes;
	} else if (rule.type === CHOICE) {
		subtypes = rule.members
			.map((m) => (m.type === VARIANT ? m.content : m))
			.filter((m): m is SymbolRule<'link'> => m.type === SYMBOL)
			.map((m) => m.name);
	} else {
		subtypes = [];
	}
	return resolveHiddenSubtypes(subtypes, ctx, rule.type === SUPERTYPE ? rule.name : undefined);
}

/**
 * Unwrap a `GroupRule<'link'>` to obtain the inner content rule, its simplified view,
 * and its wrapper-deleted RenderRule.
 *
 * @param rule - The raw rule from `normalized.rules`.
 * @param simplifiedRule - The pre-computed simplified rule for the same kind.
 * @param renderRule - The wrapper-deleted RenderRule for the same kind (from
 *   `normalized.normalizedRules[kind]` or a per-call `deleteWrapper` fallback).
 * @returns `groupRule` — the inner seq-with-fields content; `groupSimplified` —
 *   the simplified view of that inner content; `groupRenderRule` — the
 *   wrapper-deleted view of the inner content.
 * @remarks
 *   When the rule is a `GroupRule<'link'>` the pre-computed `simplifiedRule` and
 *   `renderRule` apply to the OUTER group wrapper (the top-level kind entry).
 *   `applyWrapperDeletion` and `simplifyRule` both recurse through group wrappers
 *   preserving the outer node, so `renderRule.content` and `simplifiedRule.content`
 *   are the wrapper-deleted / simplified inner content respectively. Non-group
 *   rules pass through as-is (the fallback path — groups that didn't get the
 *   `GroupRule<'link'>` wrapper).
 */
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

/**
 * Assign a deduplicated short ir-namespace key to every factory-bearing node.
 *
 * @param nodes - The full assembled node map; `irKey` on each node is mutated.
 * @remarks
 *   The ir namespace (`import { ir } from './ir.js'`) exposes each kind under a
 *   short ergonomic key. Collisions on the short form fall back to the full
 *   `factoryName`; JS reserved words get a `_` suffix. This pass claims keys in
 *   nodeMap iteration order.
 *
 *   Two-phase algorithm: supertypes are pre-claimed first so they block suffix-
 *   stripped collisions. Within each factory-bearing phase, hidden kinds sort
 *   after non-hidden so visible kinds always claim the short key first.
 */
function resolveIrKeys(nodes: Map<string, AssembledNode>): void {
	const claimed = new Set<string>();
	preclaimSupertypeIrKeys(nodes, claimed);
	const { phase1, phase2 } = partitionNodesIntoIrKeyPhases(nodes);
	for (const node of phase1) assignIrKeyWithFallback(node, claimed);
	for (const node of phase2) assignIrKeyWithFallback(node, claimed);
}

/**
 * Resolve hidden rule names (`_foo`) referenced as subtypes to the
 * concrete kinds that actually appear in the parse tree.
 *
 * @param names - Raw subtype names from the rule tree (may include `_`-prefixed hidden names).
 * @param ctx - Assemble phase context; `ctx.normalizedRules`/`ctx.topLevelAliasBodies` resolve hidden rule bodies.
 * @returns The resolved list of concrete kind names, deduplicated and in visitation order.
 * @remarks
 *   Tree-sitter inlines hidden rules at parse time — a `_type_identifier` defined as
 *   `alias($.identifier, $.type_identifier)` shows up as `type_identifier` at runtime,
 *   never as `_type_identifier`. Supertype expansion maps built from raw rule-tree names
 *   would miss those kinds and the runtime routing map would fail to promote them.
 *
 *   Handled shapes:
 *   - `alias(x, y)` → `y` (the alias label)
 *   - `symbol(target)` → recurse on target (follow chains)
 *   - `choice(a, b, …)` → flatten each branch
 *   - everything else → keep the hidden name as-is (best-effort)
 *
 *   Non-hidden names pass through unchanged.
 *
 *   2026-07-05 (PR-137 follow-on-3): body lookups migrated from
 *   `ctx.linkRules` to `ctx.normalizedRules` (see `AssembleCtx.normalizedRules`
 *   / `resolveHiddenRuleContent`'s doc comments for the attribute-aware
 *   rationale). follow-on-4 (same day) re-examined `normalizedRules` vs
 *   `ctx.rules` and confirmed empirically that `normalizedRules` must stay —
 *   see `AssembleCtx`'s class doc comment for the `_simple_pattern_negative`
 *   finding that settled it. `ctx.topLevelAliasBodies` is UNCHANGED — its
 *   `.has(name)` test is a presence fact ("is this hidden kind an alias-mint
 *   target elsewhere in the grammar") with no rule-attribute equivalent (a
 *   hidden kind's own rule body carries no trace of being aliased-TO by
 *   another rule), so it can't be derived from `normalizedRules[name]`'s
 *   attributes the way the wrapper shapes could. Its VALUES, however, are now
 *   redundant with `normalizedRules[name]` (verified empirically: every
 *   alias-body kind across all 3 grammars satisfies `normalizedRules[name] ===
 *   applyWrapperDeletion(topLevelAliasBodies.get(name))`, since
 *   `normalizeGrammar` already threads alias-target bodies through the same
 *   wrapper-deletion pipeline and merges them into `normalizedRules` under the
 *   identical hidden-kind key) — so the `body` lookup below reads
 *   `rules[name]` uniformly instead of `topLevelAliasBodies.get(name) ??
 *   rules[name]`.
 */
function resolveHiddenSubtypes(names: readonly string[], ctx: AssembleCtx, ownerName?: string): string[] {
	const { normalizedRules: rules, topLevelAliasBodies } = ctx;
	// Post-synthesis-removal: the rules map is keyed by SOURCE kinds
	// only (hidden `_X`). Subtype names surface as source kinds; we
	// no longer redirect through the aliasedHiddenKinds table (which
	// pointed at visible alias targets). Hidden kinds that have their
	// own rule body are resolved via the rules map directly; the
	// chain terminates at a concrete symbol.
	const out: string[] = [];
	const seen = new Set<string>();
	const visit = (name: string): void => {
		if (seen.has(name)) return;
		seen.add(name);
		if (!name.startsWith('_')) {
			out.push(name);
			return;
		}
		const rule = rules[name];
		if (!rule) {
			out.push(name);
			return;
		}
		if (rule.type === SUPERTYPE || topLevelAliasBodies.has(name)) out.push(name);
		const resolved = resolveHiddenRuleContent(rule, new Set([name]), ctx);
		if (resolved.length === 0) {
			if (!out.includes(name)) out.push(name);
			return;
		}
		for (const r of resolved) {
			// Recurse in case a hidden rule resolves to another hidden rule.
			if (r.startsWith('_')) {
				visit(r);
				continue;
			}
			if (!seen.has(r)) {
				seen.add(r);
				out.push(r);
			}
		}
	};
	for (const n of names) visit(n);
	return includeAliasMemberKinds(out, ctx, ownerName);
}

function includeAliasMemberKinds(subtypes: readonly string[], ctx: AssembleCtx, ownerName?: string): string[] {
	const { normalizedRules: rules } = ctx;
	const out = [...subtypes];
	const subtypeSet = new Set(subtypes);
	let changed = true;
	while (changed) {
		changed = false;
		for (const name of Object.keys(rules)) {
			if (!name.startsWith('_')) continue;
			if (name === ownerName) continue;
			if (subtypeSet.has(name)) continue;
			if (!isAliasMemberKind(name, ctx, subtypeSet)) continue;
			out.push(name);
			subtypeSet.add(name);
			changed = true;
		}
	}
	return out;
}

function isAliasMemberKind(name: string, ctx: AssembleCtx, subtypeSet: ReadonlySet<string>): boolean {
	const { normalizedRules: rules, topLevelAliasBodies } = ctx;
	if (!topLevelAliasBodies.has(name)) return false;
	const body = rules[name];
	if (!body) return false;
	const resolved = resolveHiddenRuleContent(body, new Set([name]), ctx);
	if (resolved.length === 0) return false;
	return resolved.every((member) => isCompatibleSubtypeMember(member, ctx, subtypeSet, new Set()));
}

function isCompatibleSubtypeMember(
	name: string,
	ctx: AssembleCtx,
	subtypeSet: ReadonlySet<string>,
	seen: Set<string>
): boolean {
	const { normalizedRules: rules } = ctx;
	if (subtypeSet.has(name)) return true;
	if (!name.startsWith('_')) return false;
	if (seen.has(name)) return false;
	const rule = rules[name];
	if (!rule) return false;
	seen.add(name);
	const resolved = resolveHiddenRuleContent(rule, new Set([name]), ctx);
	if (resolved.length === 0) return false;
	return resolved.every((member) => isCompatibleSubtypeMember(member, ctx, subtypeSet, seen));
}

/**
 * Attribute-aware hidden-body walker (2026-07-05, PR-137 follow-on-3 —
 * migrated OFF `ctx.linkRules` onto `ctx.normalizedRules`; see
 * `AssembleCtx.normalizedRules`'s doc comment). `rule` is a `RenderRule`
 * (wrapper-free): `optional`/`field`/`repeat`/`repeat1`/`alias` wrappers don't
 * exist as `rule.type` values on this view — their meaning is stamped onto
 * whatever leaf they used to wrap, as `multiplicity`/`fieldName`/`aliasedFrom`/
 * `aliasNamed`. The link-view switch enforced wrapper opacity by SIMPLY HAVING
 * NO CASE for REPEAT/REPEAT1/OPTIONAL/FIELD (falling to `default: []`); the
 * equivalent here is an explicit attribute check BEFORE the type switch,
 * covering every rule type uniformly (a repeat/optional can wrap ANY rule
 * shape, not just the ones the old switch happened to dispatch):
 *
 *   - `multiplicity === 'array' | 'nonEmptyArray'` — was `repeat`/`repeat1`.
 *     LOAD-BEARING: this is the crash fix (regression fixture:
 *     `assemble.test.ts` "keeps a REPEAT1(CHOICE(...)) punctuation-literal
 *     group opaque..."). A `REPEAT1(CHOICE('%','+',...))` (rust's
 *     `_non_special_token`'s TOKEN_TREE_NON_SPECIAL_PUNCTUATION arm, reached
 *     through `_delim_tokens`'s supertype chain) collapses post-wrapper-
 *     deletion to a bare `CHOICE(...)` stamped `multiplicity: 'nonEmptyArray'`
 *     — structurally indistinguishable from an unwrapped CHOICE without this
 *     check, so the old switch's CHOICE case would wrongly recurse into the
 *     punctuation arms and surface `%` as a bogus subtype name (crashing
 *     `emitSupertypeUnionDeclarations`). PR-137 follow-on-4 confirmed this
 *     particular shape actually survives `computeSimplifiedRules` unchanged
 *     too (`simplifyChoiceRule` bails to a no-op `liftSharedArmAttrs` for two
 *     bare STRING branches; `simplifySeqRule`'s anonymous-literal stripping
 *     only fires on SEQ members, never CHOICE members) — but a SIBLING shape
 *     (a SEQ, not a CHOICE, wrapping one anonymous literal + one nonterminal)
 *     does NOT survive unchanged, which is why the family stays on
 *     `normalizedRules` rather than migrating to `ctx.rules` — see the `case
 *     SEQ` branch below and `AssembleCtx`'s class doc comment for that
 *     finding (python's `_simple_pattern_negative`).
 *   - `multiplicity === 'optional'` — was `optional`. The link-view switch had
 *     no OPTIONAL case either (same opacity), so this mirrors it exactly.
 *   - `fieldName !== undefined` — was `field`. Kept for parity though no
 *     caller in this family is expected to hand a field-wrapped position
 *     (callers only pass hidden-kind top-level bodies and supertype/choice
 *     arms, never seq-internal field slots).
 *
 * `ALIAS` is dropped as a switch case (not translated): unlike `token`,
 * `alias` is fully consumed by `applyWrapperDeletion` (it never survives as
 * its own node — the wrapper disappears and `aliasedFrom`/`aliasNamed` land on
 * its content), so `RenderRule` can never have `type === 'ALIAS'` at runtime,
 * not just by static type (`AliasRule<'normalize'> = never`). Its resolution
 * ("resolve to the alias's source kind": `rule.named && content.type ===
 * SYMBOL` → the inner symbol's OWN name — the SOURCE kind, not the alias's
 * `value` target; else → `rule.value`) is subsumed by two reads: the SYMBOL
 * case's existing `aliasedFrom ?? name` (unchanged — that fact predates this
 * migration; see `SymbolRule.aliasedFrom`'s doc comment, a link-time
 * stamping distinct from wrapper-deletion's but carrying the same source-kind
 * meaning and never conflicting, since wrapper-deletion's outer-alias-wins
 * merge only overwrites when an ENCLOSING alias exists) for the
 * `content.type === SYMBOL` case; and a NEW generic non-SYMBOL fallback below
 * (`rule.aliasedFrom` on any other leaf type) for the `else` branch — the old
 * switch never had to handle "alias-of-non-symbol" as its own case because
 * the link-view ALIAS node caught it structurally; post-wrapper-deletion the
 * content's own type dispatches instead, so the fallback re-surfaces exactly
 * that one fact (`rule.value`, preserved as `aliasedFrom`) the SYMBOL-only
 * read would otherwise miss.
 *
 * `TOKEN` is dropped as a switch case (matching `emitters/templates.ts`'s
 * `isLeftmostTerminalImmediate` precedent — see its NOTE comment,
 * `project_preserve_token_wrappers`): `applyWrapperDeletion`'s TOKEN case
 * technically PRESERVES the node (`{...rule, content}`, not deleted like
 * ALIAS), so `RenderRule`'s `never` for TOKEN is a type-level assertion, not a
 * runtime guarantee — but it's backed by the same EMPIRICAL fact that
 * consumer already relies on (0 top-level `token(...)` survivors into
 * `normalizedRules` across all 3 grammars). Adding a defensive case here would
 * require an `as`-cast the gates forbid for a shape that doesn't occur;
 * `default: []` is honest (a hidden supertype/choice chain reaching a
 * TOKEN-wrapped position would be opaque anyway, since opacity is the safe
 * fallback) and matches the recorded preserve-token-wrappers debt rather than
 * papering over it per-callsite.
 */
function resolveHiddenRuleContent(rule: RenderRule, seen: Set<string>, ctx: AssembleCtx): string[] {
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
	// avoid short-circuiting its hidden-prefix/recursion logic.
	if (rule.aliasedFrom !== undefined && rule.type !== SYMBOL) {
		return [rule.aliasedFrom];
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
			if (!refName.startsWith('_')) return [refName];
			if (seen.has(refName)) return [];
			seen.add(refName);
			const target = rules[refName];
			return target ? resolveHiddenRuleContent(target, seen, ctx) : [refName];
		}
		case SUPERTYPE:
			return rule.subtypes.flatMap((s) => {
				if (seen.has(s)) return [];
				seen.add(s);
				if (!s.startsWith('_')) return [s];
				const target = rules[s];
				return target ? resolveHiddenRuleContent(target, seen, ctx) : [s];
			});
		case CHOICE:
			return rule.members.flatMap((m) => resolveHiddenRuleContent(m, seen, ctx));
		case STRING: {
			// Grammar-token shape (name vs literal) — routed through the
			// grammar's own word-matcher (R12 Camp A); single source of
			// truth via matchesWordShape, replacing the former hardcoded
			// identifier-shape regex.
			const isWordShape = ctx.wordMatcher ? ctx.wordMatcher(rule.value) : matchesWordShape(rule.value, undefined);
			return isWordShape ? [] : [rule.value];
		}
		case VARIANT:
		case GROUP:
			return resolveHiddenRuleContent(rule.content, seen, ctx);
		case SEQ:
			// DECLARED opaque (not a `default:` fallthrough) — a bare multi-member
			// SEQ is a real structural body, not a wrapper collapse, most commonly
			// a polymorph-variant-adopted arm materialized as its own hidden kind
			// (e.g. python's `_simple_pattern_negative`, `SEQ[OPTIONAL('-'),
			// CHOICE(integer, float)]` — `overrides.ts`'s `_simple_pattern: { '11':
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

/**
 * Find `typeName` collisions between hidden (`_`-prefixed) kinds and their visible
 * siblings, and disambiguate by renaming the hidden kinds.
 *
 * @param nodes - The full assembled node map; `typeName` and `factoryName` on
 *   colliding hidden nodes are mutated.
 * @remarks
 *   Non-colliding hidden kinds keep their clean names. Emits a warning for every
 *   rename so the run log surfaces which grammar rules are sharing names.
 *
 *   Three collision patterns are handled:
 *   - `visible ≥ 1` AND `hidden ≥ 1` → rename hidden(s) via {@link renameCollidingHiddenKinds}
 *   - `visible ≥ 2` → rename lower-priority visible(s) via {@link renameCollidingVisibleKinds}
 *   - `hidden ≥ 2` → rename lower-priority hidden(s) via {@link renameCollidingHiddenOnlyKinds}
 */
/**
 * Populate each node's `userFacing` flag — the single source of truth
 * for whether emitters (templates, factories, types, IR) should
 * produce output for the kind.
 *
 * - `token` / `multi` modelTypes: never user-facing (structural helpers).
 * - Visible kinds (not `_`-prefixed): user-facing.
 * - Hidden kinds: user-facing only when they're alias sources
 *   (referenced elsewhere via `aliasedFrom`, meaning factories
 *   stamp this kind as `$type`).
 *
 * Alias-source detection: walk every node's field / child value
 * slots and collect unresolved-ref names starting with `_`. Those
 * references only exist in the emitted NodeMap when
 * `walkForChildren` / `deriveValuesForRule` stamped the source
 * (`aliasedFrom`) rather than the visible target.
 */
/**
 * Hydrate every slot value's `node` reference from `UnresolvedRef` to the
 * concrete `AssembledNode` produced during assembly.
 *
 * Called by the codegen pipeline AFTER `assemble()` returns AND AFTER the
 * raw NodeMap has been serialized (e.g. `node-model.json5` emit) but
 * BEFORE the in-memory consumers (factories, types, render, etc.) read
 * slot graphs. Once hydrated, `slot.values[*].node` carries the full
 * `AssembledNode` reference — the consumer-side
 * `isUnresolvedRef(v.node) ? v.node.name : v.node.kind` ternary becomes
 * unnecessary; emitters can read `v.node.kind` (or `.modelType`) directly.
 *
 * THROWS on any reference that points to a kind absent from `nodes` —
 * unresolvable refs are codegen bugs, not runtime data, and must surface
 * loudly. The error names source kind, slot, and unresolved target.
 *
 * Mutation: rewrites `NodeRef.node` in place via a single justified
 * `readonly` cast. Slot `values` array identity is preserved; only the
 * `.node` field updates. Constitution VIII exception — this IS the
 * legitimate boundary turning the `T | UnresolvedRef` placeholder into
 * the resolved `T`. After hydration the node graph is CYCLIC, so the
 * NodeMap is no longer JSON-serializable — call this only after any
 * serialization passes.
 */
export function hydrateSlotRefs(nodeMap: NodeMap): void {
	const externals = nodeMap.externals ?? new Set<string>();
	for (const [kind, node] of nodeMap.nodes) {
		if (node.modelType === 'branch' || node.modelType === 'group') {
			hydrateSlots(kind, node.slots, nodeMap.nodes, externals);
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
		for (const v of slot.values) {
			if (!isNodeRef(v)) continue;
			if (!isUnresolvedRef(v.node)) continue;
			const targetName = v.node.name;
			const target = nodes.get(targetName);
			if (target) {
				(v as { node: AssembledNode | UnresolvedRef }).node = target;
				continue;
			}
			// Canonical-hidden architecture: alias-target names like
			// `as_pattern_target` are the VISIBLE names; the assembled node
			// map registers the hidden source `_as_pattern_target`. When the
			// visible name isn't found, retry with `_<name>` — that's the
			// canonical form per the alias-target → hidden-source convention.
			if (!targetName.startsWith('_')) {
				const hiddenSource = nodes.get(`_${targetName}`);
				if (hiddenSource) {
					(v as { node: AssembledNode | UnresolvedRef }).node = hiddenSource;
					continue;
				}
			}
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
						`'${parentKind}' slot '${slot.name}' references kind ` +
						`'${targetName}' which is absent from the assembled ` +
						`node map (likely parser-only leaf kind, alias collapse, ` +
						`or override referencing an inlined kind). Leaving as ` +
						`UnresolvedRef.\n`
				);
			}
		}
	}
}

/**
 * Per-node context for {@link markUserFacing} — carries the two cross-node
 * sets pre-computed once before the per-node loop (M3 / spec §7.7 / principle
 * #14: cross-node state lives on ctx, not a getter-with-arg).
 *
 * @internal — not exported; used only by the post-pass driver inside assemble().
 */
interface _UserFacingCtx {
	/** Hidden kinds that appear as alias sources in at least one other node's slot. */
	readonly aliasSourceKinds: ReadonlySet<string>;
	/**
	 * Hidden variant-child kind strings (`${parent}_${child}`) registered via
	 * `polymorphVariants`. These are NOT slot-reachable when the parent is a
	 * supertype, so they must be promoted independently of `aliasSourceKinds`.
	 */
	readonly variantChildKinds: ReadonlySet<string>;
}

/**
 * Mark every node in `nodes` with its `userFacing` flag (M3 — merged pass).
 *
 * A single `(node, ctx)` pass that replaces the former two-pass sequence
 * (`markUserFacing` + `markVariantChildrenUserFacing`). The set of kinds
 * marked `userFacing=true` is the union of:
 *
 *   (a) visible (non-`_`-prefixed) non-token/multi kinds,
 *   (b) hidden polymorph kinds (dispatched into via `$variant`),
 *   (c) hidden kinds that surface as alias sources in another node's slots
 *       (`ctx.aliasSourceKinds`), and
 *   (d) hidden variant-child kinds from `polymorphVariants` that the slot
 *       walker never reaches when the parent is a supertype
 *       (`ctx.variantChildKinds`).
 *
 * Per principle #14, `userFacing` is cross-node state (whether THIS hidden
 * kind appears in ANOTHER node's slot, or in the `polymorphVariants` list),
 * so it MUST be a `(node, ctx)` pass — never a getter-with-arg. Emitters read
 * the populated `node.userFacing` field; no read-site changes needed.
 *
 * @param node - The node to mark; `node.userFacing` is written in place.
 * @param ctx - Pre-computed cross-node sets (built once before the loop).
 */
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

/**
 * Rename hidden kinds that share a `typeName` with at least one non-token visible kind
 * by adding a `_` prefix to their `typeName` and `factoryName`.
 *
 * @param visible - Nodes with non-hidden kinds that share the same `typeName`.
 * @param hidden - Nodes with hidden (`_`-prefixed) kinds that share the same `typeName`.
 * @param typeName - The shared `typeName` string before disambiguation.
 * @remarks
 *   Only renames when a visible sibling actually gets an exported TypeScript declaration.
 *   Token nodes (`modelType === 'token'`) are anonymous structural delimiters that only
 *   appear as exported type aliases if they are referenced in a field/child union — many
 *   aren't. If ALL visible siblings are tokens, there is no actual TypeScript collision
 *   and the hidden kind's name is left unchanged.
 *
 *   Visible wins. Hidden kinds are renamed with a `_` prefix to preserve the tree-sitter
 *   convention that hidden/internal kinds start with an underscore.
 */
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

/**
 * Rename all but the first (alphabetically) of multiple visible kinds that have
 * collapsed to the same `typeName`, appending a numeric disambiguator to the rest.
 *
 * @param visible - Two or more visible (non-hidden) nodes that share the same `typeName`.
 * @param typeName - The shared `typeName` string before disambiguation.
 * @remarks
 *   Two visible kinds collapse to the same typeName when grammar symbols differ only
 *   in case (e.g. python's `true` keyword + `True` named node). The first kind (sorted
 *   by kind string) keeps the original name; subsequent ones receive a numeric suffix.
 *   A warning is emitted so the situation is visible in the run log.
 */
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

/**
 * Rename all but the first of multiple hidden kinds that have normalised to the same
 * `typeName`, appending a numeric suffix to each after the first.
 *
 * @param hidden - Two or more hidden (`_`-prefixed) nodes that share the same `typeName`.
 * @param typeName - The shared `typeName` string before disambiguation.
 * @remarks
 *   Two hidden kinds both normalized to the same name receive numeric suffixes on every
 *   node after the first. A warning is emitted for each rename.
 */
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

/**
 * Pre-claim the short ir-namespace key for every supertype node in the map.
 *
 * @param nodes - The full assembled node map.
 * @param claimed - Mutable set of already-claimed ir keys; modified in place.
 * @remarks
 *   Supertypes don't get factories but they DO occupy a name in the ir namespace
 *   (as a type alias). Pre-claiming their short form ensures that a factoryless
 *   supertype like python `expression` still blocks `expression_statement` from
 *   collapsing its irKey onto `expression`.
 */
function preclaimSupertypeIrKeys(nodes: Map<string, AssembledNode>, claimed: Set<string>): void {
	for (const node of nodes.values()) {
		if (node.modelType !== 'supertype') continue;
		claimed.add(shortenIrKey(node.kind));
	}
}

/**
 * Partition factory-bearing nodes into two priority phases for ir-key assignment.
 *
 * @param nodes - The full assembled node map.
 * @returns Two arrays — `phase1` contains nodes whose short form equals their
 *   factoryName (they have no distinct fallback), `phase2` contains nodes whose
 *   short form is a suffix-stripped abbreviation of their factoryName (they have
 *   a longer factoryName to fall back to on collision). Within each phase, hidden
 *   kinds sort after non-hidden so visible kinds claim the short key first.
 * @remarks
 *   Priority 1 — "short form is the full name". Any node whose short irKey equals its
 *   own factoryName gets first dibs (it has nothing to fall back to that wouldn't
 *   also collide). Examples: `expression`, `as_pattern` (→ `asPattern`), `module`
 *   (→ `module`). This forces suffix-stripped collisions (e.g. `expression_statement`
 *   → `expression`) to lose to the genuinely-short kind.
 *   Priority 2 — "short form is a strip of the full name". These have a distinct
 *   factoryName fallback (e.g. `expression_statement` → `expressionStatement`).
 */
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

/**
 * Assign an ir-namespace key to a single node, falling back to the full factory
 * name (and then a numeric suffix) when the short form is already claimed.
 *
 * @param node - The node whose `irKey` property is assigned.
 * @param claimed - Mutable set of already-claimed ir keys; modified in place.
 * @remarks
 *   On collision, falls back to the full factory name. For hidden kinds this is
 *   `hiddenX`, distinct from the visible short form. In the extremely rare case
 *   where even the full name collides (two kinds normalise to the same factoryName),
 *   a numeric suffix is appended to guarantee uniqueness.
 */
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
		if (nodes.has(kindName)) continue; // Already classified as a named rule
		if (literalText === '' || /^\s+$/.test(literalText)) continue; // Skip whitespace/empty

		const isWordShape = matchesWordShape(literalText, wordMatcher);
		const syntheticStringRule: StringRule<'link'> = { type: STRING, value: literalText };

		if (isWordShape) {
			// Keyword token (e.g., "if", "class", "pub")
			// Anonymous keywords from grammar — no factory (hidden: no user construction path)
			nodes.set(kindName, new AssembledKeyword(kindName, syntheticStringRule, { hidden: true, kindEntries }));
		} else {
			// Operator/punctuation token (e.g., "+", "->", "{")
			nodes.set(kindName, new AssembledToken(kindName, syntheticStringRule, { kindEntries }));
		}
	}
}

/**
 * Recursively collect all string literals from a rule tree into `out`.
 *
 * @param rule - The rule to walk.
 * @param out - Mutable set that receives each string literal value.
 * @remarks
 *   `enum` rules are deliberately **not** descended. Enum values are the `text`
 *   content of the parent kind, not distinct node kinds — the parser produces a
 *   single node (e.g. `primitive_type` with text `"usize"`), never a `usize`
 *   node, so collecting the enum member strings as anonymous token kinds would
 *   be incorrect.
 */
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

/**
 * Classify a rule into a model type by pure rule.type dispatch.
 *
 * By the time rules reach Assemble, Link and Normalize have already
 * pre-classified the interesting cases via dedicated rule types:
 *
 *   EnumRule<'link'>       — Link: choice-of-strings
 *   SupertypeRule<'link'>  — Link: hidden choice-of-symbols (grammar or promoted)
 *   GroupRule<'link'>      — Link: hidden seq with fields
 *   TerminalRule   — Link: subtree with no fields and no symbol refs
 *   PolymorphRule  — Normalize: choice-of-variants with heterogeneous fields
 *
 * Assemble just dispatches on rule.type. The only structural inspection
 * left is distinguishing branch (has fields) from container (has children
 * only) for ordinary seq rules — that's a one-level check.
 */
export function classifyNode(
	kind: string,
	rule: Rule<'link'>,
	opts?: { variantParents?: ReadonlySet<string>; parentAliasedKinds?: ReadonlySet<string>; wordMatcher?: RegExp }
): ModelType {
	// PR-P: enum-shaped ChoiceRules detected via isEnumChoiceRule before switch.
	if (isEnumChoiceRule(rule)) return 'enum';
	switch (rule.type) {
		// PR-P: ENUM case removed — handled by isEnumChoiceRule above.
		case SUPERTYPE:
			return 'supertype';
		case GROUP:
			return 'group';
		// PR-P Task 2: TERMINAL case removed — TerminalRule deleted; shape-classify via classifyTerminalFallback
		case PATTERN:
			return 'pattern';
		case STRING:
			// keyword vs token honours the grammar's `word` rule — see matchesWordShape.
			return matchesWordShape(rule.value, opts?.wordMatcher) ? 'keyword' : 'token';
	}

	if (isHiddenRepeatHelper(kind, rule, opts?.parentAliasedKinds)) return 'multi';
	if (isSeparatedListShape(rule)) return 'separatedList';
	const branchOrContainer = classifyBranchOrContainer(rule);
	if (branchOrContainer !== null) return branchOrContainer;
	return classifyTerminalFallback(kind, rule);
}

/**
 * A rule whose ENTIRE top-level structure is a repeated list with genuine
 * per-instance separator variability — either the separator itself is
 * nonterminal (multiple possible literal kinds), or it's a literal
 * separator with an optional (not mandatory, not absent) leading/trailing
 * flank. See docs/superpowers/specs/2026-07-12-separator-as-slot-design.md.
 *
 * Does NOT match a branch that merely HAS one array-multiplicity field
 * among several named fields (that stays 'branch', unchanged) — only a
 * rule whose own top-level type IS repeat/repeat1 qualifies, which is
 * exactly the same shape gate `isHiddenRepeatHelper` uses via
 * `extractRepeatShape` for the (unrelated) hidden-multi case above.
 */
function isSeparatedListShape(rule: Rule<'link'>): boolean {
	if (rule.type !== REPEAT && rule.type !== REPEAT1) return false;
	const sep = rule.separator;
	if (sep === undefined) return false;
	if (isNonterminalRuleType(sep.value as Rule<'evaluate'>)) return true;
	// Only a genuinely OPTIONAL flank has per-instance variability worth
	// this classification — 'mandatory' (always present) is compile-time
	// renderable exactly like 'none' (absent), and stays classified as
	// 'branch' via the pre-existing hasTrailing/hasLeading mechanism.
	return sep.trailing === 'optional' || sep.leading === 'optional';
}

/**
 * Test whether a kind should be classified as a hidden `multi` helper.
 *
 * @param kind - The rule kind name (snake_case, may start with `_`).
 * @param rule - The rule body for that kind.
 * @param parentAliasedKinds - Optional set of hidden kind names that appear
 *   as the content of a named alias in a parent rule. When provided, kinds
 *   in this set are excluded from the `multi` classification even if their
 *   rule body is a repeat: they surface as REAL runtime CST nodes (under
 *   the alias target name) and need their own `branch` transport type.
 * @returns `true` when the kind is hidden, its body unwraps to a repeat,
 *   AND it is NOT aliased by a parent rule.
 * @remarks
 *   Hidden repeat helpers are inlined by tree-sitter at parse time, so they never
 *   surface as concrete nodes. Classifying them as `multi` lets downstream emitters
 *   skip the interface/factory/resolver and the walker inlines the repeat at
 *   referrers (rest-params factory, multi-valued child slot). See AssembledMulti doc.
 *
 *   Aliased hidden kinds (e.g. `_with_clause_bare` aliased to `with_clause_bare`)
 *   are NOT inlined — tree-sitter exposes them as concrete named nodes. They must
 *   classify as `branch` so the Rust transport can dispatch on their kind ID.
 */
function isHiddenRepeatHelper(kind: string, rule: Rule<'link'>, parentAliasedKinds?: ReadonlySet<string>): boolean {
	if (!kind.startsWith('_')) return false;
	if (extractRepeatShape(rule) === null) return false;
	// If this kind appears as the content of a named alias in any parent rule,
	// it produces a real runtime CST node — do NOT classify as multi.
	if (parentAliasedKinds?.has(kind)) return false;
	return true;
}

/**
 * Classify a rule as `branch` based on presence of fields or children,
 * or return `null` when neither applies.
 *
 * The prior `'container'` model was collapsed into
 * `'branch'`: nodes that carry only unnamed children (no `field()` on
 * the rule) are still `AssembledBranch` instances, distinguishable at
 * the call site via `AssembledBranch.isContainerShape`. The single
 * classification arm reflects that there is one runtime class for
 * both shapes.
 *
 * @param rule - The rule to inspect.
 * @returns `'branch'` if the rule has any named field or unnamed child,
 *   or `null` when neither applies.
 * @remarks
 *   Only existence checks are performed — not full extraction. The class
 *   getter (`AssembledBranch.fields`) does the full walk later, once.
 */
function classifyBranchOrContainer(rule: Rule<'link'>): ModelType | null {
	if (hasAnyField(rule) || hasAnyChild(rule)) return 'branch';
	return null;
}

/**
 * Apply the terminal fallback classification after all structural checks
 * have failed to assign a model type.
 *
 * @param kind - The rule kind name, used in the error message.
 * @param rule - The rule body for that kind.
 * @returns `'pattern'` for all-text subtrees, `'enum'` for pure choice-of-strings.
 * @throws {Error} When the rule cannot be classified by any heuristic — indicates
 *   that Link should have wrapped it as a `TerminalRule`.
 * @remarks
 *   All-text subtree → leaf; pure choice-of-strings → enum. Anything still
 *   unclassifiable after this is a real pipeline error.
 */
function classifyTerminalFallback(kind: string, rule: Rule<'link'>): ModelType {
	// PR-P: isEnumChoiceRule checked BEFORE isAllTextShape — an all-STRING ChoiceRule<'link'>
	// passes isAllTextShape too, but must classify as 'enum', not 'pattern'.
	if (isEnumChoiceRule(rule)) return 'enum';
	if (isAllTextShape(rule)) return 'pattern';
	throw new Error(
		`classifyNode: '${kind}' has no fields, no children, and no rule-type ` +
			`classification. Link should have wrapped it as TerminalRule. rule.type=${rule.type}`
	);
}

/**
 * Shape-inspection helper for the classifier fallback. A rule is
 * "all text" when every leaf is a string or pattern and there are
 * no symbol references. Walked recursively through seq/choice/
 * optional/repeat/token/variant/clause/group wrappers.
 *
 * Exported so the slot-grouping diagnostic can reuse the SAME predicate
 * to suppress content-collision false-positives on pattern kinds — DRY:
 * one definition, no mirrored copy that can drift (e.g. the REPEAT1 case).
 */
export function isAllTextShape(rule: Rule<'link'>): boolean {
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
