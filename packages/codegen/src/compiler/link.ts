/**
 * compiler/link.ts — Link phase.
 *
 * Resolves what nodes ARE.
 * After Link: no symbol, alias, token. `repeat1` is preserved — see rule.ts header.
 * Terminals (string, pattern) and structural whitespace (indent, dedent, newline) survive.
 * All field nodes enriched with provenance.
 *
 * Link does NOT restructure the tree — shape identical before and after.
 * Link does NOT process overrides — already applied by Evaluate.
 */

import {
	ALIAS,
	CHOICE,
	DEDENT,
	FIELD,
	GROUP,
	INDENT,
	NEWLINE,
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
	SymbolRef,
	FieldRule,
	SupertypeRule,
	EnumRule,
	GroupRule,
	SeqRule,
	ChoiceRule,
	Repeat1Rule,
	SymbolRule,
	StringRule,
	RepeatRule,
	AliasRule
} from '../types/rule.ts';
import {
	isSeq,
	isChoice,
	isEnumChoiceRule,
	sym,
	replaceAtPath,
	isSymbol,
	isString,
	isRepeat1,
	isRepeat,
	isOptional,
	isField
} from '../types/rule.ts';
import { normalizeEnumMembers, makeRuleMetadata } from '../dsl/rule-metadata.ts';
import {
	collectGeneratedKindEntries,
	findGeneratedKindEntry,
	type GeneratedIdTables,
	type GeneratedKindEntry
} from './generated-metadata.ts';
import type {
	RawGrammar,
	LinkedGrammar,
	ExternalRole,
	IncludeFilter,
	DerivationLog,
	RepeatedShapeEntry,
	RefineForm
} from './types.ts';
import { hasAnyField } from './model/node-map.ts';

import { isAsciiIdentifier } from '../util/identifier-shape.ts';
import { compileWordMatcher, matchesWordShape } from '../util/word-matcher.ts';
import { isHiddenKind, deriveComplexAliasTargetHidden } from './evaluate.ts';
import { polymorphVisibleName } from '../dsl/wire/wire.ts';
import { deriveStructuralVariantChildren, isAliasMintedRef, prefixNamedSuffix } from './variant-structural.ts';
import { rulesEqual, detectRepeatSeparator } from '../dsl/list-patterns.ts';
import { parsePath, type PathSegment } from '../dsl/transform/transform-path.ts';
import { DiagnosticSink, type CompilerDiagnostic } from '../types/diagnostics.ts';
import { BaseCtx, type BaseCtxInit } from './ctx.ts';
import { RuleWalker } from '../dsl/rule-walker.ts';

// ---------------------------------------------------------------------------
// link() — main entry point
// ---------------------------------------------------------------------------

export interface LinkOptions {
	readonly include?: IncludeFilter;
	readonly generatedIdTables?: GeneratedIdTables;
	readonly diagnostics?: DiagnosticSink;
}

export class LinkCtx extends BaseCtx<'evaluate'> {
	readonly supertypes: ReadonlySet<string>;
	readonly externalRoles: Map<string, ExternalRole>;
	readonly inline?: readonly string[];
	readonly derivations: DerivationLog;
	readonly applyPromotedRules: boolean;
	readonly hiddenChoicesWithNamedAliasMembers: ReadonlySet<string>;

	constructor(
		init: BaseCtxInit<'evaluate'> & {
			supertypes: ReadonlySet<string>;
			externalRoles: Map<string, ExternalRole>;
			inline?: readonly string[];
			derivations: DerivationLog;
			applyPromotedRules: boolean;
			hiddenChoicesWithNamedAliasMembers: ReadonlySet<string>;
		}
	) {
		super(init);
		this.supertypes = init.supertypes;
		this.externalRoles = init.externalRoles;
		this.inline = init.inline;
		this.derivations = init.derivations;
		this.applyPromotedRules = init.applyPromotedRules;
		this.hiddenChoicesWithNamedAliasMembers = init.hiddenChoicesWithNamedAliasMembers;
	}

	get rules(): Record<string, Rule<'evaluate'>> {
		return this.grammar.rules;
	}
}

export function link(raw: RawGrammar, ctx?: LinkOptions): LinkedGrammar {
	const include = ctx?.include;
	const supertypes = new Set(raw.supertypes);
	const externalRoles = buildExternalRolesMap(raw.externalRoles);
	const references = [...raw.references];
	const kindEntries = collectGeneratedKindEntries(ctx?.generatedIdTables);

	// Resolve include defaults: undefined means "include everything".
	// Explicit empty arrays mean "include nothing of this category".
	const includeRules = new Set(include?.rules ?? (['promoted'] as const));
	const applyPromotedRules = includeRules.has('promoted');

	// Derivation log — populated unconditionally; each entry records
	// whether the mutation was also applied.
	const derivations: DerivationLog = {
		// inferredFields stays empty: the statistical field-name-inference pass was
		// deleted (it was apply=false / analysis-only). suggested-overrides emission
		// is disabled for now, so nothing reads this.
		inferredFields: [],
		promotedRules: [],
		repeatedShapes: []
	};

	// Compute the hidden-choice classification guard from the RAW
	// (pre-resolveRule) rules — hoisted above the resolve loop (pure function
	// of `raw.rules`, independent of it) so ONE LinkCtx instance can serve
	// both the resolve walk and the later hidden-rule classification pass.
	//
	// hiddenChoicesWithNamedAliasMembers: hidden choice kinds whose own body
	// has named-alias members → must NOT be promoted to supertype.
	const hiddenChoicesWithNamedAliasMembers = collectHiddenChoicesWithNamedAliasMembers(raw.rules);
	// PIN POINT (2026-07-05 design): compiled exactly ONCE here, from
	// `raw.rules` — the evaluate-view rule tree, where the `word` rule's
	// authored wrappers (notably a trailing REPEAT) are still intact. This is
	// the grammar's single word-matcher compilation for the entire pipeline;
	// every later phase CARRIES `wordMatcherRegex` forward on its
	// `LinkedGrammar`/`NormalizedGrammar`/`SimplifiedGrammar`/`NodeMap`
	// container rather than recompiling from its own post-link rules view
	// (see `LinkedGrammar.wordMatcher`'s doc comment for why recompiling from
	// a post-normalize view is unsound).
	const wordMatcherRegex = compileWordMatcher(raw.word, raw.rules);

	// Resolve all rules. Named `linkCtx` (not `ctx`) to avoid shadowing the
	// public `ctx: LinkOptions` entry param above — this is the internal,
	// BaseCtx-extending phase context threaded through the resolve/classify
	// walks below, a distinct object from the public options bag.
	const linkCtx = new LinkCtx({
		grammar: raw,
		diagnostics: ctx?.diagnostics ?? new DiagnosticSink(),
		wordMatcher: (s) => matchesWordShape(s, wordMatcherRegex),
		supertypes,
		externalRoles,
		inline: raw.inline,
		derivations,
		applyPromotedRules,
		hiddenChoicesWithNamedAliasMembers
	});
	const rules: Record<string, Rule<'link'>> = {};
	for (const [name, rule] of Object.entries(raw.rules)) {
		// raw.rules is Rule<'evaluate'> (pre-link); resolveRule's own job IS the
		// evaluate→link transition, so it structurally handles both phases —
		// widen the phase view (post-PR-S, RepeatRule<'evaluate'>/<'link'> genuinely
		// diverge in shape, so this is now an explicit cast, not a coincidence).
		rules[name] = resolveRule(rule as Rule<'link'>, linkCtx, name);
	}

	// Lift separated lists into canonical separator-bearing repeat nodes:
	// repeat(seq(sep, x)) → repeat{sep}, commaSep1 → repeat1{sep}, and
	// trailing-separator absorb. This is the SAME lift the evaluate
	// constructors perform; centralizing it here (post-resolve, post-wire,
	// post-enrich-injection) makes it the single source and lets it reach the
	// enrich-injected group rules the constructors miss. Idempotent over
	// already-lifted shapes (see lift-separators.ts), so it is a no-op while
	// the constructors still lift. Runs before group-lift / classification,
	// which expect the canonical separator shape.
	for (const name of Object.keys(rules)) {
		rules[name] = liftSeparators(rules[name]!, linkCtx);
	}

	// Retired: `mintContentAliasKinds` used to copy a SYMBOL-content alias's
	// hidden source rule body into a NEW top-level entry under the alias's
	// target name (`rules[value] = <copy of _<name>'s body>`). Its gate
	// (the retired `isClauseHoistVisibleGroupAlias`) required SYMBOL content
	// referencing a real hidden rule — meaning it only ever fired for aliases
	// that ALSO now flow through `resolveRule`'s `aliasedFrom` provenance
	// path uniformly (above). Minting a duplicate independent rule for that
	// case was redundant at best (two disagreeing representations of the
	// same content at worst — the exact bug this retirement fixes): the
	// underlying `_<name>` rule stays the single source of truth, referenced
	// via `aliasedFrom`, and gets promoted to user-facing visibility by the
	// existing `aliasSourceKinds` mechanism (assemble.ts) once its slot
	// reference is hydrated.

	stripResolvedRoleRules(rules);
	createSyntheticExternalRules(rules, raw.externals);

	// Map hidden rules to alias targets before resolveRule collapses them.
	const aliasedHiddenKinds = collectAliasedHiddenKinds(raw.rules);

	// Stamp static renderAs entries first — replaces field/symbol refs
	// to externals declared via `renderAs` with their literal text inline.
	// After this, downstream phases see bare string literals at those
	// positions and treat them as inline mandatory literals in seq
	// context — same as how `seq('mod', $.name)` renders `mod {{ name }}`
	// with `mod` stamped inline. Runs BEFORE applyGroupOverrides so any
	// group lifts operate on already-stamped rule bodies.
	// raw.renderAs is Rule<'evaluate'> (pre-link, override-authored literal
	// bodies); stampStaticRenderAs only reads STRING-shaped bodies, so the
	// phase view is a widen-only cast (post-PR-S, RepeatRule's per-phase
	// shapes genuinely diverge, so this is now explicit, not a coincidence).
	const renderAs = (raw.renderAs ?? {}) as Record<string, Rule<'link'>>;
	if (Object.keys(renderAs).length > 0) {
		const stamped = stampStaticRenderAs(rules, renderAs);
		for (const key of Object.keys(rules)) {
			if (!(key in stamped)) delete rules[key];
		}
		Object.assign(rules, stamped);
	}

	// visibleExternals: nothing to register here. evaluate's
	// drainVisibleExternalsMetadata already injected each body into the
	// rules map under the HIDDEN name (the storage identity, mirroring
	// drainRenderAsMetadata), replacing the external's empty-pattern
	// placeholder; the SYMBOL→ALIAS reference rewrites carry the visible
	// parse identity. Registering under the VISIBLE name here instead
	// creates a second node colliding on the same typeName — the transport
	// struct then emits from the empty placeholder (no render text).
	// Deliberately excluded from `renderAs` so `stampStaticRenderAs`
	// never inlines these bodies into referencing rules.

	// Group lift pass — run BEFORE classifyAndLogHiddenRules so path
	// resolution addresses the raw resolved seq/choice bodies before
	// classifyHiddenSeqRule wraps them in GroupRule<'link'> nodes. Also runs
	// BEFORE polymorph alias so lifts happen against the original rule
	// body. See:
	//   docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md
	const groupsConfig = raw.groups ?? {};
	if (Object.keys(groupsConfig).length > 0) {
		const lifted = applyGroupOverrides({
			rules,
			groups: groupsConfig,
			polymorphs: raw.polymorphsConfig ?? {}
		});
		for (const key of Object.keys(rules)) {
			if (!(key in lifted.rules)) delete rules[key];
		}
		Object.assign(rules, lifted.rules);
		// Force-classify synthesized kinds as GroupRule<'link'> so downstream
		// normalize.inlineSingleUseHidden skips them (it preserves 'group'
		// type rules) and assemble sees them as AssembledGroup candidates.
		for (const synthKind of lifted.synthesizedKinds) {
			const body = rules[synthKind];
			if (body && body.type !== GROUP) {
				// Lift separated lists in the synth group body — this runs after
				// the main lift loop, so an un-lifted commaSep1 inside a synth
				// group would otherwise escape #62's separator centralization.
				rules[synthKind] = {
					type: GROUP,
					name: synthKind,
					content: liftSeparators(body, linkCtx)
				} satisfies GroupRule<'link'>;
			}
		}
	}

	// Compute the remaining classification guard from the RAW (pre-resolveRule)
	// rules so the original alias structure is still visible.
	// (hiddenChoicesWithNamedAliasMembers is computed earlier, above the
	// resolve loop, and already lives on `linkCtx`.)
	//
	// - parentAliasedKinds: hidden kinds that appear as the content of a
	//   named alias in any parent rule → real runtime CST nodes even when
	//   their normalized body is a repeat1 → must NOT be classified as multi.
	// ONE deep-walk yields BOTH the hidden-aliased set (classifier guard) and the
	// visible→visible alias-target map (slot accept-set union), derived together so
	// the two facets of `alias(symbol(X), $.target)` can never drift apart.
	// raw.rules is Rule<'evaluate'> (pre-resolveRule, by design — see comment
	// above), matching collectAliasedByParents's own Rule<'evaluate'> parameter
	// directly — no phase-widening cast needed here.
	const { parentAliasedKinds, visibleAliasTargets } = collectAliasedByParents(raw.rules);

	classifyAndLogHiddenRules(rules, linkCtx);
	// PR-P Task 2: promoteAndLogTerminalRules removed — terminals classify by shape at Assemble

	// `inline = hidden && !aliased && !supertype`. A supertype ref is a DISPATCH
	// point, not an inline helper: its CST node is a transparent choice that
	// materializes via its slot, never flattening into the parent. The
	// construction default stamped `inline=true` for the leading `_`; flip it off
	// for every ref to a SUPERTYPE-classified kind (grammar-declared OR
	// link-promoted, now that classification has run) so the emit-time inline path
	// never renders a supertype as an empty body (empty template → unused-lifetime
	// E0392). Runs post-classification so promoted supertypes are included.
	markSupertypeRefsNonInline(rules);

	// Apply wire-produced variant alias push-down (ambient scaffolding into
	// variant children). R12/decision-7 V2 Task 2: `applyOverridePolymorphs`
	// discovers its own (parent, children) pairs structurally from `rules`
	// now (`deriveStructuralVariantChildren`) instead of the deleted wire
	// metadata channel — see that function's own comment for the byte-gate
	// verification this re-keying was checked against.
	applyOverridePolymorphs(rules, derivations);

	hoistIndentIntoRepeat(rules);
	annotateBlockBearerFields(rules);
	collectRepeatedShapes(rules, derivations.repeatedShapes);
	const complexAliasTargetHidden = deriveComplexAliasTargetHidden(raw.rules);
	const topLevelAliasBodies = collectTopLevelAliasBodies(
		rules,
		linkCtx,
		complexAliasTargetHidden.size > 0 ? complexAliasTargetHidden : undefined
	);
	canonicalizeCatalogLiteralRefs(rules, kindEntries);
	canonicalizeCatalogLiteralRefsInMap(topLevelAliasBodies, kindEntries);

	// Validate refine() forms against the linked rule tree.
	if (raw.refineForms && raw.refineForms.size > 0) {
		for (const [kind, forms] of raw.refineForms) {
			const rule = rules[kind];
			if (!rule) {
				throw new Error(
					`refine(${kind}): no rule named '${kind}' found at link time — refine() target must be a top-level rule`
				);
			}
			validateRefineForms(kind, rule, forms, rules);
		}
	}

	return {
		name: raw.name,
		rules,
		supertypes,
		externalRoles,
		externals: raw.externals,
		word: raw.word,
		wordMatcher: wordMatcherRegex,
		references,
		derivations,
		aliasedHiddenKinds,
		topLevelAliasBodies,
		refineForms: raw.refineForms,
		parentAliasedKinds,
		visibleAliasTargets: visibleAliasTargets.size > 0 ? visibleAliasTargets : undefined
	};
}

// ---------------------------------------------------------------------------
// link() sub-step helpers
// ---------------------------------------------------------------------------

function buildExternalRolesMap(rawExternalRoles: Map<string, ExternalRole> | undefined): Map<string, ExternalRole> {
	return rawExternalRoles ? new Map<string, ExternalRole>(rawExternalRoles) : new Map<string, ExternalRole>();
}

function stripResolvedRoleRules(rules: Record<string, Rule<'link'>>): void {
	for (const name of Object.keys(rules)) {
		const r = rules[name]!;
		if (r.type === INDENT || r.type === DEDENT || r.type === NEWLINE) {
			delete rules[name];
		}
	}
}

function createSyntheticExternalRules(rules: Record<string, Rule<'link'>>, externals: readonly string[]): void {
	for (const ext of externals) {
		if (!rules[ext]) {
			rules[ext] = { type: PATTERN, value: '' } as Rule<'link'>;
		}
	}
}

function canonicalizeCatalogLiteralRefs(
	rules: Record<string, Rule<'link'>>,
	kindEntries: readonly GeneratedKindEntry[]
): void {
	for (const [name, rule] of Object.entries(rules)) {
		rules[name] = canonicalizeRuleLiterals(rule, kindEntries, false);
	}
}

function canonicalizeCatalogLiteralRefsInMap(
	rules: Map<string, Rule<'link'>>,
	kindEntries: readonly GeneratedKindEntry[]
): void {
	for (const [name, rule] of rules.entries()) {
		rules.set(name, canonicalizeRuleLiterals(rule, kindEntries, false));
	}
}

function canonicalizeRuleLiterals(
	rule: Rule<'link'>,
	kindEntries: readonly GeneratedKindEntry[],
	allowLiteralRewrite: boolean
): Rule<'link'> {
	switch (rule.type) {
		case SEQ:
			return {
				...rule,
				members: rule.members.map((member) => canonicalizeRuleLiterals(member, kindEntries, false))
			};
		case CHOICE:
			return {
				...rule,
				members: rule.members.map((member) => canonicalizeRuleLiterals(member, kindEntries, allowLiteralRewrite))
			};
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case VARIANT:
		case GROUP:
		case TOKEN:
			return {
				...rule,
				content: canonicalizeRuleLiterals(rule.content, kindEntries, allowLiteralRewrite)
			};
		case FIELD:
			return {
				...rule,
				content: canonicalizeRuleLiterals(rule.content, kindEntries, true)
			};
		case STRING: {
			if (!allowLiteralRewrite) return rule;
			const entry = findGeneratedKindEntry(kindEntries, rule.value);
			if (!entry) return rule;
			return {
				type: SYMBOL,
				name: entry.kind,
				literal: rule.value,
				inline: isHiddenKind(entry.kind),
				metadata: makeRuleMetadata({ symbolSource: 'link' })
			};
		}
		default:
			return rule;
	}
}

function classifyAndLogHiddenRules(rules: Record<string, Rule<'link'>>, ctx: LinkCtx): void {
	const { inline, supertypes, derivations, applyPromotedRules } = ctx;
	for (const [name, rule] of Object.entries(rules)) {
		if (isHiddenKind(name, inline) || supertypes.has(name)) {
			// (debt PR-P1, item 3) Branch on the RETURNED classification only —
			// never re-read a stamp off `classified.rule`. See ClassifyResult.
			const { rule: classified, classification } = classifyHiddenRule(rule, ctx, name, rules);
			if (classified !== rule && classification !== undefined) {
				derivations.promotedRules.push({
					kind: name,
					classification,
					applied: applyPromotedRules
				});
				if (applyPromotedRules) rules[name] = classified;
			} else {
				rules[name] = classified;
			}
		}
	}
}

function markSupertypeRefsNonInline(rules: Record<string, Rule<'link'>>): void {
	const nonInlineKinds = new Set<string>();
	for (const [name, rule] of Object.entries(rules)) {
		if (rule.type === SUPERTYPE || referencesSelf(rule, name)) nonInlineKinds.add(name);
	}
	if (nonInlineKinds.size === 0) return;
	const walk = (rule: Rule<'link'>): Rule<'link'> => {
		if (rule.type === SYMBOL) {
			return nonInlineKinds.has(rule.name) && rule.inline !== false ? { ...rule, inline: false } : rule;
		}
		const xs = rule as { members?: readonly Rule<'link'>[]; content?: Rule<'link'> };
		if (xs.members) return { ...rule, members: xs.members.map(walk) } as Rule<'link'>;
		if (xs.content) return { ...rule, content: walk(xs.content) } as Rule<'link'>;
		return rule;
	};
	for (const name of Object.keys(rules)) rules[name] = walk(rules[name]!);
}

const selfRefWalker = new RuleWalker<Rule<'link'>>();

function referencesSelf(rule: Rule<'link'>, self: string): boolean {
	return selfRefWalker.find(rule, (r) => r.type === SYMBOL && r.name === self) !== undefined;
}

function collectAliasedHiddenKinds(rawRules: Record<string, Rule<'evaluate'>>): Map<string, string> {
	const out = new Map<string, string>();
	for (const [name, rule] of Object.entries(rawRules)) {
		if (!name.startsWith('_')) continue;
		// rawRules is Rule<'evaluate'> (pre-link); extractTopLevelAliasTarget
		// only walks the OPTIONAL/ALIAS/SEQ/CHOICE shell around a top-level
		// alias, present in both phases — widen the phase view (post-PR-S cast).
		const target = extractTopLevelAliasTarget(rule as Rule<'link'>);
		if (target) out.set(name, target);
	}
	return out;
}

function extractTopLevelAliasTarget(rule: Rule<'link'>): string | undefined {
	if (rule.type === ALIAS && rule.named) return rule.value;
	if (rule.type === GROUP || rule.type === VARIANT || rule.type === TOKEN) {
		return extractTopLevelAliasTarget((rule as { content: Rule<'link'> }).content);
	}
	return undefined;
}

function collectHiddenChoicesWithNamedAliasMembers(rawRules: Record<string, Rule<'evaluate'>>): ReadonlySet<string> {
	const out = new Set<string>();
	for (const [name, rule] of Object.entries(rawRules)) {
		if (!name.startsWith('_')) continue;
		// Only pure alias-dispatch choices: every member must be a named alias.
		if (rule.type === CHOICE && rule.members.length > 0 && rule.members.every((m) => m.type === ALIAS && m.named)) {
			out.add(name);
		}
	}
	return out;
}

function collectAliasedByParents(rawRules: Record<string, Rule<'evaluate'>>): {
	parentAliasedKinds: ReadonlySet<string>;
	visibleAliasTargets: ReadonlyMap<string, readonly string[]>;
} {
	const parentAliasedKinds = new Set<string>();
	const visibleAliasTargets = new Map<string, string[]>();
	function walk(rule: Rule<'link'>): void {
		if (rule.type === ALIAS) {
			if (rule.named && rule.content.type === SYMBOL) {
				const source = rule.content.name;
				if (source.startsWith('_')) {
					parentAliasedKinds.add(source);
				} else if (typeof rule.value === 'string' && !rule.value.startsWith('_')) {
					const arr = visibleAliasTargets.get(rule.value);
					if (arr) {
						if (!arr.includes(source)) arr.push(source);
					} else {
						visibleAliasTargets.set(rule.value, [source]);
					}
				}
			}
			walk(rule.content);
			return;
		}
		if ('members' in rule && Array.isArray((rule as ChoiceRule<'link'> | SeqRule<'link'>).members)) {
			for (const m of (rule as ChoiceRule<'link'> | SeqRule<'link'>).members) walk(m);
		}
		if ('content' in rule && (rule as { content?: Rule<'link'> }).content) {
			walk((rule as { content: Rule<'link'> }).content);
		}
	}
	// rawRules is Rule<'evaluate'> (pre-resolveRule); walk only reads
	// ALIAS/SYMBOL/structural shapes present in both phases — widen the phase
	// view (post-PR-S cast), same pattern as collectAliasedHiddenKinds above.
	for (const rule of Object.values(rawRules)) walk(rule as Rule<'link'>);
	return { parentAliasedKinds, visibleAliasTargets };
}

function collectTopLevelAliasBodies(
	resolvedRules: Record<string, Rule<'link'>>,
	ctx: LinkCtx,
	complexAliasTargetHidden?: ReadonlySet<string>
): Map<string, Rule<'link'>> {
	const rawRules = ctx.rules;
	const out = new Map<string, Rule<'link'>>();
	for (const [name, rule] of Object.entries(rawRules)) {
		if (!name.startsWith('_')) continue;
		// rawRules (ctx.rules) is Rule<'evaluate'> (RAW view);
		// extractTopLevelNamedAliasContent only walks OPTIONAL/ALIAS/SEQ/CHOICE
		// shapes present in both phases — widen the phase view (post-PR-S cast).
		const content = extractTopLevelNamedAliasContent(rule as Rule<'link'>);
		if (!content) continue;
		// LOAD-BEARING GUARD — NOT a removable band-aid (isolation-test-verified).
		// Never inline a named-alias-target's hidden body into the visible-alias
		// parent. Body-pattern groups produce `alias(SYMBOL(_hidden), $.visible)`
		// where `_hidden` is a complex-body alias-target kind (derived via
		// `deriveComplexAliasTargetHidden`). The alias' content is a symbol ref
		// to the hidden rule (`_type_argument` etc.), but the render template
		// must reference the VISIBLE kind (e.g. `type_argument`) — not inline
		// the hidden rule's body. Skip these entries so `normalizedRules[name]`
		// keeps the wrapper-deleted `SYMBOL(visible, aliasedFrom='_hidden')` form
		// set by the main normalization path, rather than being overwritten with
		// the hidden rule's body.
		//
		// Removing this skip REGRESSES `type_arguments`/`type_parameters` jinja
		// (`{{ type_argument | joinWithTrailing(",") }}` → `{{ content }}…`) and
		// leaks the hidden kinds' slots (`content`/`trait_bounds`) into the LIVE
		// transport render surface — proven by delete→regen→diff, NOT a static
		// probe (a guard-free nodeMap dump reads the derived set empty because it
		// bypasses the evaluate pipeline). The predicate is now derived on-demand
		// from `raw.rules` via `deriveComplexAliasTargetHidden` (structural
		// derivation, not a cached set). See project_pr_e_spec_premises_false.
		if (complexAliasTargetHidden && content.type === SYMBOL && complexAliasTargetHidden.has(content.name)) {
			continue;
		}
		const resolvedContent = resolveRule(content, ctx, name);
		out.set(name, dereferenceTopLevelAliasBody(resolvedContent, ctx, resolvedRules, new Set()));
	}
	return out;
}

function extractTopLevelNamedAliasContent(rule: Rule<'link'>): Rule<'link'> | undefined {
	if (rule.type === ALIAS && rule.named) return rule.content;
	if (rule.type === GROUP || rule.type === VARIANT || rule.type === TOKEN) {
		return extractTopLevelNamedAliasContent((rule as { content: Rule<'link'> }).content);
	}
	return undefined;
}

function dereferenceTopLevelAliasBody(
	rule: Rule<'link'>,
	ctx: LinkCtx,
	resolvedRules: Record<string, Rule<'link'>>,
	seen: Set<string>
): Rule<'link'> {
	const supertypes = ctx.supertypes;
	if (rule.type !== SYMBOL) return rule;
	const refName = rule.aliasedFrom ?? rule.name;
	if (supertypes.has(refName)) return rule;
	if (seen.has(refName)) return rule;
	const target = resolvedRules[refName];
	if (!target) return rule;
	seen.add(refName);
	return dereferenceTopLevelAliasBody(target, ctx, resolvedRules, seen);
}

function extractAliasedFromName(content: Rule<'link'>, supertypes: ReadonlySet<string>): string | undefined {
	if (content.type === SYMBOL) {
		// Record the alias SOURCE as provenance even when it is a supertype.
		// `alias($.expression, $.as_pattern_target)` aliases the `expression`
		// supertype: the slot must be typed by that source (the expression
		// union, which IS in the node map), NOT by the bare target label
		// `as_pattern_target` — the target has no rule body, so leaving
		// aliasedFrom unset makes `refName = aliasedFrom ?? name` fall back to
		// the target and emit a phantom unresolved ref. The target still
		// survives as the symbol `name` (the CST `$type` the reader matches).
		return content.name;
	}
	if (content.type === VARIANT || content.type === GROUP || content.type === TOKEN) {
		return extractAliasedFromName((content as { content: Rule<'link'> }).content, supertypes);
	}
	return undefined;
}

// tagVariants / isStructurallyHomogeneousChoice removed.
// Auto-wrapping heuristics replaced by explicit user-declared
// `variant()` / `polymorphs:` in grammar.sittir.ts. See commit
// "013: disable tagAllRulesVariants — auto-tagging masked real
// adoption work" for the rationale.

function _wouldInlineAtAssemble(kindName: string, rules: Record<string, Rule<'link'>>): boolean {
	const target = rules[kindName];
	if (!target) return false;
	if (target.type === GROUP) return true;
	// Pure repeat/repeat1 (possibly wrapped in optional/variant) = multi.
	const unwrap = (r: Rule<'link'>): Rule<'link'> => (r.type === OPTIONAL || r.type === VARIANT ? unwrap(r.content) : r);
	const bare = unwrap(target);
	return bare.type === REPEAT || bare.type === REPEAT1;
}

// ---------------------------------------------------------------------------
// promotePolymorph — wrap heterogeneous-field choices in PolymorphRule
// ---------------------------------------------------------------------------
//
export interface VariantChoiceLocation {
	choice: ChoiceRule<'link'>;
	prefix: Rule<'link'>[];
	suffix: Rule<'link'>[];
}

// ---------------------------------------------------------------------------
// applyOverridePolymorphs — variant-adoption choice → ambient-scaffold push-down
// ---------------------------------------------------------------------------
//
// R12/decision-7 V2 Task 2: (parent, children) pairs are now discovered
// STRUCTURALLY from `rules` (`deriveStructuralVariantChildren`,
// variant-structural.ts) instead of the deleted wire-metadata channel
// (formerly `variants: PolymorphVariant[]`, populated by
// `wireRegisterPolymorphVariant`). Verified byte-neutral: the ONE parent
// that reaches this function's real structural mutation
// (`pushAmbientScaffoldIntoVariantChildren` — the `!anyChildMemberInFoundChoice`
// branch; the OTHER branch below is a no-op derivation-log-only path since
// the 2026-06-01 DE-POLYMORPH change) is typescript's
// `public_field_definition`; `deriveStructuralVariantChildren` reproduces
// its exact 5-child set (same full names, same order) both mid-link (the
// `rules` snapshot this function receives, already past wire's alias
// injection + `resolveRule`) and post-link — confirmed empirically during
// V2 development. Short suffixes (needed by `emitVariantChildDerivations`'s
// `${parentKind}_${child}` log format and `polymorphVisibleName`) are
// recovered from the derivation's full target names via `prefixNamedSuffix`
// (the exact inverse of `polymorphVisibleName`, shared not re-derived).
//
// Form names use the SHORT child suffix from variant() — not the
// tagVariants-derived names — so generated factories/types align with
// what the user wrote. Mutates `rules` in place; logs to derivations.

export function applyOverridePolymorphs(rules: Record<string, Rule<'link'>>, derivations: DerivationLog): void {
	const structural = deriveStructuralVariantChildren(rules);
	const parentToChildren = new Map<string, string[]>();
	for (const [parentKind, targetNames] of structural) {
		const suffixes = targetNames.map((t) => prefixNamedSuffix(parentKind, t)).filter((s): s is string => s !== null);
		if (suffixes.length > 0) parentToChildren.set(parentKind, suffixes);
	}

	for (const [parentKind, children] of parentToChildren) {
		const rule = rules[parentKind];
		if (!rule) continue;

		const found = findVariantChoice(rule);
		if (!found) continue;

		// Deep choice: push ambient scaffold into variant children instead.
		emitVariantChildDerivations(parentKind, children, derivations);

		const variantChildSymbolNames = new Set(children.map((c) => polymorphVisibleName(parentKind, c)));
		// Check whether any variant-child symbol appears in the found choice — either
		// as a direct member or nested inside choice/seq arms at any shallow depth.
		const symbolInNames = (r: Rule<'link'>): boolean => {
			const inner = r.type === VARIANT ? r.content : r;
			return inner.type === SYMBOL && variantChildSymbolNames.has(inner.name);
		};
		const symbolInRule = (r: Rule<'link'>): boolean => {
			if (symbolInNames(r)) return true;
			const inner = r.type === VARIANT ? r.content : r;
			if (inner.type === CHOICE) return inner.members.some(symbolInNames);
			if (inner.type === SEQ)
				return inner.members.some((m) => symbolInNames(m) || (m.type === CHOICE && m.members.some(symbolInNames)));
			return false;
		};
		const anyChildMemberInFoundChoice = found.choice.members.some(symbolInRule);
		if (!anyChildMemberInFoundChoice) {
			pushAmbientScaffoldIntoVariantChildren(rules, parentKind, children);
			continue;
		}

		// DE-POLYMORPH (2026-06-01): wire already injected the variant-child
		// aliases into this choice (confirmed by anyChildMemberInFoundChoice
		// above). We intentionally STOP here — no longer reclassifying the
		// parent into a PolymorphRule / modelType:'polymorph' with forms. The
		// rule stays the wire-produced seq(..., choice(alias_a, alias_b, …), …)
		// and flows through as a plain BRANCH: faithful order-preserving render
		// over a single choice slot, no forms / no $variant dispatch. The
		// `polymorphs:` / `variant()` overlay and wire's alias synthesis are
		// retained, so factory submethod sugar derives from the choice arms
		// (the alias kinds) rather than from a forms list.
		//
		// (Was: rules[parentKind] = { type:'polymorph',
		//   forms: buildOverridePolymorphForms(parentKind, children, found, rules),
		//   source:'override' }.)
	}
}

function emitVariantChildDerivations(parentKind: string, children: string[], derivations: DerivationLog): void {
	for (const child of children) {
		const variantChildKind = `${parentKind}_${child}`;
		derivations.promotedRules.push({
			kind: variantChildKind,
			classification: 'polymorph',
			applied: true
		});
	}
}

function pushAmbientScaffoldIntoVariantChildren(
	rules: Record<string, Rule<'link'>>,
	parentKind: string,
	children: readonly string[]
): void {
	const variantChildVisibleNames = new Set(children.map((c) => `${parentKind}_${c}`));
	const parentRule = rules[parentKind];
	if (!parentRule) return;

	// Rewrite the parent rule: find seq members that contain a choice of
	// aliases matching the registered variant children, extract the
	// literal prefix/suffix inside that seq, and strip them. For each
	// matched alias, rewrite its `_${parent}_${child}` hidden-rule body
	// to wrap with the same prefix/suffix.
	const rewritten = rewriteSeqWithVariantAliasChoice(parentRule, rules, variantChildVisibleNames);
	if (rewritten !== parentRule) rules[parentKind] = rewritten;
}

function rewriteSeqWithVariantAliasChoice(
	rule: Rule<'link'>,
	rules: Record<string, Rule<'link'>>,
	variantChildVisibleNames: Set<string>
): Rule<'link'> {
	switch (rule.type) {
		case SEQ: {
			// Does this seq directly contain the alias-choice?
			const choiceIdx = rule.members.findIndex((m) => isAllAliasChoice(m, variantChildVisibleNames));
			if (choiceIdx !== -1) {
				return applyVariantScaffoldPushDown(rule, choiceIdx, rules);
			}
			const members = rule.members.map((m) => rewriteSeqWithVariantAliasChoice(m, rules, variantChildVisibleNames));
			return { type: SEQ, members };
		}
		case CHOICE: {
			const members = rule.members.map((m) => rewriteSeqWithVariantAliasChoice(m, rules, variantChildVisibleNames));
			return { type: CHOICE, members };
		}
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case VARIANT:
		case GROUP:
		case FIELD:
		case TOKEN: {
			const content = rewriteSeqWithVariantAliasChoice(
				(rule as { content: Rule<'link'> }).content,
				rules,
				variantChildVisibleNames
			);
			return { ...(rule as object), content } as Rule<'link'>;
		}
		default:
			return rule;
	}
}

function isAllAliasChoice(rule: Rule<'link'>, variantChildVisibleNames: Set<string>): boolean {
	if (rule.type !== CHOICE || rule.members.length === 0) return false;
	return rule.members.every((m) => {
		const core = m.type === VARIANT ? m.content : m;
		if (core.type === ALIAS) return variantChildVisibleNames.has(core.value);
		if (core.type === SYMBOL) return variantChildVisibleNames.has(core.name);
		return false;
	});
}

function applyVariantScaffoldPushDown(
	seq: SeqRule<'link'>,
	choiceIdx: number,
	rules: Record<string, Rule<'link'>>
): Rule<'link'> {
	const prefix = seq.members.slice(0, choiceIdx).filter((m) => m.type === STRING) as StringRule<'link'>[];
	const suffix = seq.members.slice(choiceIdx + 1).filter((m) => m.type === STRING) as StringRule<'link'>[];
	if (prefix.length === 0 && suffix.length === 0) return seq; // nothing to push
	const choice = seq.members[choiceIdx] as ChoiceRule<'link'>;
	for (const member of choice.members) {
		const core = member.type === VARIANT ? member.content : member;
		let visibleName: string | null = null;
		if (core.type === ALIAS) {
			visibleName = core.value;
		} else if (core.type === SYMBOL) {
			// Link already collapsed the alias wrapper; the symbol's
			// name IS the visible variant-child kind name.
			visibleName = core.name;
		}
		if (!visibleName) continue;
		const hiddenName = `_${visibleName}`;
		// `collectAliasTargets` at Link entry seeds both `rules[hiddenName]`
		// (the hidden rule) and `rules[visibleName]` (the alias target)
		// with separate references to the same source content. Wrap once
		// and assign to both so the visible kind's emitted template —
		// which is what render consults — picks up the pushed scaffold.
		const body = rules[hiddenName] ?? rules[visibleName];
		if (!body) continue;
		const wrapped: Rule<'link'> = {
			type: SEQ,
			members: [...prefix, body, ...suffix]
		};
		if (hiddenName in rules) rules[hiddenName] = wrapped;
		if (visibleName in rules) rules[visibleName] = wrapped;
	}
	// Strip the literals we just pushed down, keep everything else (the
	// choice itself plus any non-string members).
	const remaining = seq.members.filter((m, i) => i === choiceIdx || m.type !== STRING);
	if (remaining.length === 1) return remaining[0]!;
	return { type: SEQ, members: remaining };
}

export function findVariantChoice(rule: Rule<'link'>): VariantChoiceLocation | null {
	// Matches bare choices (post-spec-013) and seq-wrapped choices.
	if (isChoice(rule)) {
		return { choice: rule, prefix: [], suffix: [] };
	}
	if (rule.type === SEQ) {
		const choiceIdx = rule.members.findIndex((m) => m.type === CHOICE);
		if (choiceIdx !== -1) {
			// More than one choice in the seq is ambiguous — bail.
			const more = rule.members.findIndex((m, i) => i !== choiceIdx && m.type === CHOICE);
			if (more !== -1) return null;
			return {
				choice: rule.members[choiceIdx] as ChoiceRule<'link'>,
				prefix: rule.members.slice(0, choiceIdx),
				suffix: rule.members.slice(choiceIdx + 1)
			};
		}

		// No direct choice — check if exactly one member is a seq that contains
		// exactly one choice (the variant choice nested in an inner seq, e.g. function_type).
		// Guard: there must be zero choices at the outer level AND exactly one in the
		// inner seq; if more than one choice total, bail (ambiguous).
		const innerSeqIdx = rule.members.findIndex(
			(m) => m.type === SEQ && (m as SeqRule<'link'>).members.some((mm) => mm.type === CHOICE)
		);
		if (innerSeqIdx === -1) return null;
		// Make sure there is no other member that is also a seq with a choice in it,
		// and no choices at all elsewhere in the outer seq.
		const outerChoiceCount = rule.members.filter((m) => m.type === CHOICE).length;
		if (outerChoiceCount > 0) return null; // would have been caught above, defensive
		const innerSeq = rule.members[innerSeqIdx] as SeqRule<'link'>;
		const innerChoiceIdx = innerSeq.members.findIndex((m) => m.type === CHOICE);
		if (innerChoiceIdx === -1) return null;
		// Ensure there is only ONE choice total across outer + inner levels.
		const innerChoiceCount = innerSeq.members.filter((m) => m.type === CHOICE).length;
		const otherSeqChoiceCount = rule.members
			.filter((m, i) => i !== innerSeqIdx && m.type === SEQ)
			.reduce((acc, m) => acc + (m as SeqRule<'link'>).members.filter((mm) => mm.type === CHOICE).length, 0);
		if (innerChoiceCount !== 1 || otherSeqChoiceCount > 0) return null;
		// Merge outer prefix/suffix with the inner seq's non-choice members.
		const outerPrefix = rule.members.slice(0, innerSeqIdx);
		const outerSuffix = rule.members.slice(innerSeqIdx + 1);
		const innerPrefix = innerSeq.members.slice(0, innerChoiceIdx);
		const innerSuffix = innerSeq.members.slice(innerChoiceIdx + 1);
		return {
			choice: innerSeq.members[innerChoiceIdx] as ChoiceRule<'link'>,
			prefix: [...outerPrefix, ...innerPrefix],
			suffix: [...innerSuffix, ...outerSuffix]
		};
	}
	return null;
}

// ---------------------------------------------------------------------------
// tokenToName — map punctuation to readable names
// ---------------------------------------------------------------------------
//
// Used by both nameVariant (above) and Assemble's nameNode for kinds
// that are operators / punctuation. Single source of truth for "what
// do we call this token in TypeScript identifier space".

const TOKEN_NAMES: Record<string, string> = {
	';': 'semi',
	'{': 'brace',
	'}': 'close_brace',
	'(': 'paren',
	')': 'close_paren',
	'[': 'bracket',
	']': 'close_bracket',
	',': 'comma',
	':': 'colon',
	'.': 'dot',
	'::': 'path',
	'->': 'arrow',
	'=>': 'fat_arrow',
	'=': 'eq',
	'!': 'bang',
	'?': 'question',
	'<': 'lt',
	'>': 'gt',
	'+': 'plus',
	'-': 'minus',
	'*': 'star',
	'/': 'slash',
	'%': 'percent',
	'&': 'amp',
	'|': 'pipe',
	'^': 'caret',
	'~': 'tilde',
	'#': 'hash',
	'@': 'at',
	// Multi-char tokens
	'==': 'eqeq',
	'!=': 'neq',
	'<=': 'le',
	'>=': 'ge',
	'&&': 'andand',
	'||': 'oror',
	'<<': 'shl',
	'>>': 'shr',
	'**': 'starstar',
	'...': 'ellipsis',
	'..': 'dotdot',
	'..=': 'dotdoteq',
	'+=': 'pluseq',
	'-=': 'minuseq',
	'*=': 'stareq',
	'/=': 'slasheq',
	'%=': 'percenteq',
	'&=': 'ampeq',
	'|=': 'pipeeq',
	'^=': 'careteq',
	'<<=': 'shleq',
	'>>=': 'shreq',
	'**=': 'starstareq',
	'//': 'slashslash',
	'//=': 'slashslasheq',
	'++': 'plusplus',
	'--': 'minusminus',
	':=': 'coloneq',
	'<>': 'ltgt',
	'@=': 'ateq',
	'0b': 'tok_0b',
	'0B': 'tok_0B',
	'0o': 'tok_0o',
	'0O': 'tok_0O',
	'0x': 'tok_0x',
	'0X': 'tok_0X'
};

function charFallback(token: string): string {
	const CHAR_NAMES: Record<string, string> = {
		'!': 'bang',
		'"': 'dq',
		'#': 'hash',
		$: 'dollar',
		'%': 'pct',
		'&': 'amp',
		"'": 'sq',
		'(': 'lp',
		')': 'rp',
		'*': 'star',
		'+': 'plus',
		',': 'comma',
		'-': 'minus',
		'.': 'dot',
		'/': 'slash',
		':': 'colon',
		';': 'semi',
		'<': 'lt',
		'=': 'eq',
		'>': 'gt',
		'?': 'q',
		'@': 'at',
		'[': 'lb',
		'\\': 'bs',
		']': 'rb',
		'^': 'caret',
		'`': 'bt',
		'{': 'lbr',
		'|': 'pipe',
		'}': 'rbr',
		'~': 'tilde',
		' ': 'sp',
		'\t': 'tab',
		'\n': 'nl',
		'\r': 'cr'
	};
	return 'tok_' + [...token].map((c) => CHAR_NAMES[c] ?? (/[\w]/.test(c) ? c : 'x')).join('_');
}

export function tokenToName(token: string): string {
	if (TOKEN_NAMES[token]) return TOKEN_NAMES[token];
	if (/^[\w_]+$/.test(token)) return token;
	return charFallback(token);
}

// ---------------------------------------------------------------------------
// resolveRule — recursive resolution of all reference types
// ---------------------------------------------------------------------------

function resolveRule(rule: Rule<'link'>, ctx: LinkCtx, currentName: string): Rule<'link'> {
	switch (rule.type) {
		case SEQ:
			return {
				...rule,
				members: rule.members.map((m) => resolveRule(m, ctx, currentName))
			};

		case CHOICE: {
			return {
				...rule,
				members: rule.members.map((m) => resolveRule(m, ctx, currentName))
			};
		}

		case OPTIONAL: {
			const content = resolveRule(rule.content, ctx, currentName);
			return { ...rule, content };
		}

		case REPEAT:
			return {
				...rule,
				content: resolveRule(rule.content, ctx, currentName)
			};

		case REPEAT1:
			return resolveRepeat1PreservingNonEmpty(rule, ctx, currentName);

		case FIELD:
			return {
				...rule,
				content: resolveRule(rule.content, ctx, currentName)
			};

		case TOKEN:
			// Flatten: extract content
			return resolveRule(rule.content, ctx, currentName);

		case ALIAS: {
			// Every named alias routes uniformly through provenance
			// (`aliasedFrom`), whether its content is a clause-hoist/
			// visible-group mint's freshly-synthesized `_<name>` rule or an
			// authored relabel of a pre-existing rule (PR3's
			// `applyUnaliasDistinct` retarget, e.g. `_simple_statements` →
			// `simple_statements`). Both are `alias(symbol(_<name>), $<value>)`
			// with no independent rule under `<value>` — structurally
			// indistinguishable — and the OLD special-case here
			// (`isClauseHoistVisibleGroupAlias`, retired) tried to tell them
			// apart by checking only whether `<value>` had a rule body,
			// which can't actually distinguish "content is itself a fresh
			// mint" from "content is a real pre-existing rule being
			// relabeled" — both produce that same signature.
			//
			// It doesn't need to: whether `content.name`'s rule gets its own
			// independent top-level `AssembledNode` is decided separately, by
			// whether it's a `rules` bag key at all — completely unaffected
			// by whether THIS reference to it carries `aliasedFrom`.
			// `aliasedFrom` only says "this specific occurrence displays
			// under a different name than its underlying rule's own name" —
			// render/read dispatch already resolves the correct numeric id
			// via the alias occurrence's own `alias_sym_<value>` symbol
			// (parseKindId), independent of whether the source rule survives
			// as its own addressable parser symbol.
			if (rule.named && rule.value && !rule.value.startsWith('_')) {
				return resolveNamedAliasWithProvenance(rule.content, ctx, rule.value);
			}
			// Unnamed alias with a non-word literal value (e.g. typescript
			// `alias(_ternary_qmark, '?')` — relabels a hidden external-
			// scanner symbol as the literal punctuation it represents).
			// The inner symbol resolves to an empty-pattern stub during
			// simplify, stranding the walker with nothing to emit. The
			// alias's `value` IS the rendered text — preserve it as a
			// string literal so the template walker surfaces `?` / `:` /
			// whatever the alias relabels to. Only fires for unnamed
			// aliases (named aliases become their own visible kind).
			if (
				!rule.named &&
				typeof rule.value === 'string' &&
				rule.value.length > 0 &&
				!rule.value.startsWith('_') &&
				!/^[A-Za-z_]\w*$/.test(rule.value)
			) {
				return { type: STRING, value: rule.value };
			}
			return resolveRule(rule.content, ctx, currentName);
		}

		case SYMBOL:
			return resolveSymbolRoleOrPass(rule, ctx);

		// These pass through unchanged
		case STRING:
		case PATTERN:
		// PR-P: ENUM case removed — enum-shaped choices are CHOICE type now.
		case SUPERTYPE:
		case GROUP:
		case VARIANT:
		case INDENT:
		case DEDENT:
		case NEWLINE:
			return rule;

		default:
			return rule;
	}
}

function resolveRepeat1PreservingNonEmpty(rule: Repeat1Rule, ctx: LinkCtx, currentName: string): Rule<'link'> {
	return {
		...rule,
		content: resolveRule(rule.content, ctx, currentName)
	};
}

function resolveNamedAliasWithProvenance(content: Rule<'link'>, ctx: LinkCtx, targetName: string): Rule<'link'> {
	const aliasedFrom = extractAliasedFromName(content, ctx.supertypes);
	const sym: SymbolRule<'link'> = aliasedFrom
		? { type: SYMBOL, name: targetName, aliasedFrom, inline: false }
		: { type: SYMBOL, name: targetName, inline: false };
	return sym;
}

const ROLE_TO_RULE_TYPE = {
	indent: INDENT,
	dedent: DEDENT,
	newline: NEWLINE
} as const;
const RULE_TYPE_TO_ROLE = {
	[INDENT]: 'indent',
	[DEDENT]: 'dedent',
	[NEWLINE]: 'newline'
} as const;

function resolveSymbolRoleOrPass(rule: SymbolRule<'link'>, ctx: LinkCtx): Rule<'link'> {
	const { rules: allRules, externalRoles } = ctx;
	const preBound = externalRoles.get(rule.name);
	if (preBound) {
		return { type: ROLE_TO_RULE_TYPE[preBound.role] } as Rule<'link'>;
	}
	const target = allRules[rule.name];
	if (target && (target.type === INDENT || target.type === DEDENT || target.type === NEWLINE)) {
		externalRoles.set(rule.name, { role: RULE_TYPE_TO_ROLE[target.type] });
		return target;
	}
	return rule;
}

// ---------------------------------------------------------------------------
// classifyHiddenRule — determine what a hidden rule IS
// ---------------------------------------------------------------------------

interface ClassifyResult {
	readonly rule: Rule<'link'>;
	readonly classification?: 'enum' | 'supertype';
	readonly classifiedBy?: 'grammar' | 'link';
}

function classifyHiddenRule(
	rule: Rule<'link'>,
	ctx: LinkCtx,
	name: string,
	rules: Record<string, Rule<'link'>>
): ClassifyResult {
	// Already classified (e.g., enum from Evaluate)
	// PR-P: ENUM type retired — isEnumChoiceRule detects enum-shaped ChoiceRules.
	if (isEnumChoiceRule(rule) || rule.type === SUPERTYPE || rule.type === GROUP) {
		return { rule };
	}

	if (rule.type === CHOICE) {
		return classifyHiddenChoiceRule(rule, ctx, name, rules);
	}

	if (isSeq(rule)) {
		return { rule: classifyHiddenSeqRule(name, rule) };
	}

	// Other hidden rules survive as-is — Assemble classifies by structure
	return { rule };
}

function classifyHiddenChoiceRule(
	rule: ChoiceRule<'link'>,
	ctx: LinkCtx,
	name: string,
	rules: Record<string, Rule<'link'>>
): ClassifyResult {
	const { supertypes, hiddenChoicesWithNamedAliasMembers } = ctx;
	// Enum admission. Two terminal-valued member shapes qualify:
	//   - bare STRING literals (the original all-STRING enum), and
	//   - post-resolve SYMBOLs carrying `aliasedFrom` whose STORAGE rule body
	//     is a bare STRING — the kind's whole realization is one fixed render
	//     text (visibleExternals: `_semicolon`'s `automatic_semicolon` arm,
	//     storage `_automatic_semicolon := '\n'`). Convert those to the
	//     literal-carrying SYMBOL shape (`canonicalizeRuleLiterals`' vehicle —
	//     this is deliberately its second writer; `literalTextOf`/
	//     `isEnumChoiceRule` serve the shape uniformly downstream) so the
	//     choice classifies as an ENUM of {literal → kind} members instead of
	//     a supertype whose member set can never project a type union.
	const enumMembers = rule.members.map((m): StringRule<'link'> | SymbolRule<'link'> | undefined => {
		if (m.type === STRING) return m;
		if (m.type === SYMBOL) {
			const sym = m as SymbolRule<'link'>;
			if (sym.literal !== undefined) return sym;
			const storageName = sym.aliasedFrom;
			if (storageName !== undefined) {
				const storageBody = rules[storageName];
				if (storageBody !== undefined && storageBody.type === STRING) {
					return { ...sym, literal: (storageBody as StringRule<'link'>).value };
				}
			}
		}
		return undefined;
	});
	if (enumMembers.every((m): m is StringRule<'link'> | SymbolRule<'link'> => m !== undefined)) {
		const allStrings = enumMembers.every((m): m is StringRule<'link'> => m.type === STRING);
		return {
			rule: allStrings
				? normalizeEnumMembers(enumMembers as StringRule<'link'>[], { classifiedBy: 'link' })
				: ({
						type: CHOICE,
						members: enumMembers,
						metadata: makeRuleMetadata({ classifiedBy: 'link' })
					} as ChoiceRule<'link'>),
			classification: 'enum',
			classifiedBy: 'link'
		};
	}

	// If this hidden choice's ORIGINAL (pre-resolveRule) rule body contained
	// named-alias members, its choice arms represent REAL aliased CST nodes —
	// NOT abstract supertypes that tree-sitter erases at parse time. Block
	// supertype promotion so these kinds fall through to branch classification.
	// Grammar-declared supertypes (in grammar.supertypes) are never blocked.
	if (hiddenChoicesWithNamedAliasMembers.has(name) && !supertypes.has(name)) {
		return { rule };
	}

	const supertypeCompatible = (m: Rule<'link'>): boolean =>
		m.type === SYMBOL || isEnumChoiceRule(m) || m.type === STRING;
	const allCompatible = rule.members.every(supertypeCompatible);
	if (allCompatible || supertypes.has(name)) {
		const { names: subtypes, parseNames: subtypeParseNames } = collectSubtypeNames(rule, ctx);
		// Only promote if we actually resolved subtype names. An empty
		// subtypes list means the choice members aren't symbols and we
		// can't project a union — fall through to leave-as-is.
		if (subtypes.length > 0) {
			const classifiedBy = supertypes.has(name) ? 'grammar' : 'link';
			// R12/decision-7 V2 Task 1: stamp the variant-arm linkage THIS
			// flatten is about to erase — see `RuleBase.variantArms`'s doc
			// comment. Computed from the PRE-flatten CHOICE's own members
			// (not `subtypes`, which already lost per-arm rule-shape info): a
			// bare SYMBOL/ALIAS arm that is alias-minted (the exact
			// `isAliasMintedRef` condition `variant-structural.ts`'s
			// CHOICE-arm predicate uses, shared not re-derived) names its
			// subtype-list entry (`aliasedFrom ?? name` for SYMBOL, matching
			// `collectSubtypeNames`'s own per-arm naming exactly, so
			// `variantArms` entries are always a subset of `subtypes`).
			//
			// This surfaces MORE alias-minted arms than the wire channel ever
			// registered for SUPERTYPE parents: every `alias($.hidden,
			// $.visible)` construct inside a supertype's choice qualifies,
			// whether hand-authored in an override `rules:` replacement OR
			// inherited from the upstream base grammar (verified during Task
			// 1 development: rust's `_pattern`/`wildcard_pattern`,
			// `_condition`/`let_chain`, `_type`/`primitive_type` are all
			// genuine upstream `alias(...)` calls in tree-sitter-rust's own
			// grammar.js, not false positives). This is the SAME
			// reviewed-additive widening V1 already accepted for
			// CHOICE-classified parents (rust's
			// `impl_item`/`reference_expression`, ts `string`'s
			// `string_fragment` — hand-authored `alias()` calls with no
			// `polymorphs:`/`variant()` registration); Task 3's probe
			// exceptions table enumerates the SUPERTYPE-parent instances the
			// same way.
			const variantArms = rule.members
				.map((m): string | null => {
					const core = m.type === VARIANT ? m.content : m;
					if (!isAliasMintedRef(core, rules)) return null;
					// Named ALIAS arm: record the HIDDEN symbol name (content.name),
					// matching collectSubtypeNames' per-arm naming — variantArms
					// entries must stay a subset of `subtypes`, and assemble's
					// lookup keys on the hidden name. (Effectively unreachable
					// today — resolveRule collapses raw alias arms to
					// SYMBOL+aliasedFrom first — but the visible `value` here
					// would silently no-op if an unresolved ALIAS ever arrived.)
					if (core.type === ALIAS) {
						return core.named && core.content.type === SYMBOL ? core.content.name : null;
					}
					if (core.type === SYMBOL) return core.aliasedFrom ?? core.name;
					return null;
				})
				.filter((n): n is string => n !== null);
			return {
				rule: {
					type: SUPERTYPE,
					name,
					subtypes,
					// Storage→parse pairs for aliased arms, stamped at the moment
					// the flatten erases them (same pattern as `variantArms`
					// below) — see `collectSubtypeNames`' doc comment.
					...(Object.keys(subtypeParseNames).length > 0 ? { subtypeParseNames } : {}),
					...(variantArms.length > 0 ? { variantArms } : {})
				} satisfies SupertypeRule<'link'>,
				classification: 'supertype',
				classifiedBy
			};
		}
	}

	// Mixed/structural hidden choice — survive as-is.
	return { rule };
}

function classifyHiddenSeqRule(name: string, rule: SeqRule<'link'>): Rule<'link'> {
	if (hasAnyField(rule)) {
		return {
			type: GROUP,
			name,
			content: rule
		} satisfies GroupRule<'link'>;
	}
	return rule;
}

function collectSubtypeNames(
	rule: Rule<'link'>,
	ctx: LinkCtx
): { names: string[]; parseNames: Record<string, string> } {
	const names: string[] = [];
	const parseNames: Record<string, string> = {};
	const visit = (current: Rule<'link'>): void => {
		switch (current.type) {
			case SYMBOL:
				// `aliasedFrom` = the alias SOURCE (storage kind), `name` = the
				// alias target (parse kind) — see `resolveNamedAliasWithProvenance`.
				names.push(current.aliasedFrom ?? current.name);
				if (current.aliasedFrom !== undefined && current.aliasedFrom !== current.name) {
					parseNames[current.aliasedFrom] ??= current.name;
				}
				return;
			case ALIAS:
				// Effectively unreachable today — resolveRule collapses raw
				// alias arms to SYMBOL+aliasedFrom first (see the matching note
				// on `classifyHiddenChoiceRule`'s variantArms computation) —
				// but mirror the SYMBOL branch's storage/parse handling so an
				// unresolved ALIAS arriving here behaves identically.
				if (!current.named) return;
				if (current.content.type === SYMBOL) {
					names.push(current.content.name);
					if (typeof current.value === 'string' && current.value.length > 0 && current.value !== current.content.name) {
						parseNames[current.content.name] ??= current.value;
					}
				} else {
					visit(current.content);
				}
				return;
			case STRING: {
				// Grammar-token shape (name vs punctuation) — routed through the
				// grammar's own word-matcher (R12 Camp A); single source of truth
				// via matchesWordShape, replacing the former hardcoded
				// identifier-shape regex.
				const isWordShape = ctx.wordMatcher
					? ctx.wordMatcher(current.value)
					: matchesWordShape(current.value, undefined);
				if (!isWordShape) names.push(current.value);
				return;
			}
			case CHOICE:
			case SEQ:
				for (const member of current.members) visit(member);
				return;
			case GROUP:
			case VARIANT:
			case TOKEN:
			case OPTIONAL:
			case REPEAT:
			case REPEAT1:
				visit(current.content);
				return;
			// PR-P: ENUM case removed — handled by CHOICE arm above.
			default:
				return;
		}
	};
	visit(rule);
	return { names, parseNames };
}

// ---------------------------------------------------------------------------
// enrichPositions — walk SEQ members to assign position to SymbolRefs
// ---------------------------------------------------------------------------

export function enrichPositions(rules: Record<string, Rule<'link'>>, refs: SymbolRef[]): void {
	for (const ref of refs) {
		const rule = rules[ref.from];
		if (!rule || rule.type !== SEQ) continue;
		const idx = rule.members.findIndex((m) => m.type === SYMBOL && m.name === ref.to);
		if (idx >= 0) ref.position = idx;
	}
}

// ---------------------------------------------------------------------------
// computeParentSets — group refs by target symbol
// ---------------------------------------------------------------------------

export function computeParentSets(refs: SymbolRef[]): Map<string, SymbolRef[]> {
	const parents = new Map<string, SymbolRef[]>();
	for (const ref of refs) {
		const existing = parents.get(ref.to);
		if (existing) {
			existing.push(ref);
		} else {
			parents.set(ref.to, [ref]);
		}
	}
	return parents;
}

// ---------------------------------------------------------------------------
// hoistIndentIntoRepeat — push `indent` siblings into repeat.separator
// ---------------------------------------------------------------------------
//
// Rewrites `seq(..., indent, X, ...)` where X is a `repeat` (directly, via
// symbol ref, or through a wrapping seq in the referenced rule) so that
// the repeat carries `separator: '\n  '`. This is the rule-level encoding
// of "each element of this block appears on its own indented line". The
// template emitter's existing joinBy path then renders multi-statement
// blocks as `stmt1\n  stmt2\n  stmt3` without any template-side hacks.

// Raw newline separator. The renderer re-indents substituted values
// based on the placeholder's column in the surrounding template, so
// joinBy carries no whitespace — nested blocks compound indent levels
// automatically without baking depth into the rule tree.
const BLOCK_SEPARATOR = '\n';

function hoistIndentIntoRepeat(rules: Record<string, Rule<'link'>>): void {
	for (const [, rule] of Object.entries(rules)) {
		walkForIndentHoist(rule, rules);
	}
}

function walkForIndentHoist(rule: Rule<'link'>, rules: Record<string, Rule<'link'>>): void {
	switch (rule.type) {
		case SEQ: {
			// Find every `indent` member; for each, promote the nearest
			// following repeat-bearing member by setting its separator.
			for (let i = 0; i < rule.members.length; i++) {
				if (rule.members[i]!.type !== INDENT) continue;
				for (let j = i + 1; j < rule.members.length; j++) {
					if (assignRepeatSeparator(rule.members[j]!, rules, new Set())) break;
					if (rule.members[j]!.type === DEDENT) break;
				}
			}
			for (const m of rule.members) walkForIndentHoist(m, rules);
			return;
		}
		case CHOICE:
			for (const m of rule.members) walkForIndentHoist(m, rules);
			return;
		case FIELD:
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case VARIANT:
		case GROUP:
		case TOKEN:
		case ALIAS:
			walkForIndentHoist(rule.content, rules);
			return;
		default:
			return;
	}
}

function assignRepeatSeparator(rule: Rule<'link'>, rules: Record<string, Rule<'link'>>, visited: Set<string>): boolean {
	if (rule.type === REPEAT || rule.type === REPEAT1) {
		// Fresh block separator: neither trailing nor leading set, matching
		// the prior behavior of leaving those undefined.
		if (!rule.separator)
			(rule as { separator?: { value: Rule<'link'> } }).separator = {
				value: { type: STRING, value: BLOCK_SEPARATOR } as Rule<'link'>
			};
		return true;
	}
	if (rule.type === SYMBOL) {
		if (visited.has(rule.name)) return false;
		const target = rules[rule.name];
		if (!target) return false;
		visited.add(rule.name);
		const found = assignRepeatSeparator(target, rules, visited);
		visited.delete(rule.name);
		return found;
	}
	if (rule.type === SEQ) {
		for (const m of rule.members) {
			if (assignRepeatSeparator(m, rules, visited)) return true;
		}
		return false;
	}
	if (rule.type === OPTIONAL || rule.type === GROUP || rule.type === FIELD) {
		return assignRepeatSeparator(rule.content, rules, visited);
	}
	return false;
}

// ---------------------------------------------------------------------------
// annotateBlockBearerFields — mark fields whose content reaches `indent`
// ---------------------------------------------------------------------------
//
// Python-style `class X:\n  body` requires a newline + indent before the
// block's rendered content. The template walker emits `\n  $BODY` for a
// field whose content resolves (via symbol deref) to a subtree containing
// an `indent` Rule<'link'> node. This pass computes the set of "block-bearer"
// kinds by reachability and tags every matching field with `blockBearer: true`.

function computeHiddenBearerSet(rules: Record<string, Rule<'link'>>): Set<string> {
	const bearers = new Set<string>();
	for (const [name, rule] of Object.entries(rules)) {
		if (name.startsWith('_') && containsIndent(rule)) bearers.add(name);
	}
	let changed = true;
	while (changed) {
		changed = false;
		for (const [name, rule] of Object.entries(rules)) {
			if (!name.startsWith('_')) continue;
			if (bearers.has(name)) continue;
			if (referencesBearer(rule, bearers)) {
				bearers.add(name);
				changed = true;
			}
		}
	}
	return bearers;
}

function annotateBlockBearerFields(rules: Record<string, Rule<'link'>>): void {
	const bearers = computeHiddenBearerSet(rules);
	// Mutate fields whose content reaches a bearer through hidden-only
	// intermediates. `markBlockBearerFields` recurses so nested visible
	// rules get their own fields inspected independently.
	for (const [, rule] of Object.entries(rules)) {
		markBlockBearerFields(rule, bearers);
	}
}

function containsIndent(rule: Rule<'link'>): boolean {
	switch (rule.type) {
		case INDENT:
			return true;
		case SEQ:
		case CHOICE:
			return rule.members.some(containsIndent);
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case FIELD:
		case VARIANT:
		case GROUP:
		case TOKEN:
		case ALIAS:
			return containsIndent(rule.content);
		default:
			return false;
	}
}

function referencesBearer(rule: Rule<'link'>, bearers: ReadonlySet<string>): boolean {
	switch (rule.type) {
		case SYMBOL:
			return bearers.has(rule.name);
		case SEQ:
		case CHOICE:
			return rule.members.some((m) => referencesBearer(m, bearers));
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case FIELD:
		case VARIANT:
		case GROUP:
		case TOKEN:
		case ALIAS:
			return referencesBearer(rule.content, bearers);
		default:
			return false;
	}
}

function markBlockBearerFields(rule: Rule<'link'>, bearers: ReadonlySet<string>): void {
	switch (rule.type) {
		case FIELD:
			if (referencesBearer(rule.content, bearers)) {
				(rule as { blockBearer?: boolean }).blockBearer = true;
			}
			markBlockBearerFields(rule.content, bearers);
			return;
		case SEQ:
		case CHOICE:
			for (const m of rule.members) markBlockBearerFields(m, bearers);
			return;
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case VARIANT:
		case GROUP:
		case TOKEN:
		case ALIAS:
			markBlockBearerFields(rule.content, bearers);
			return;
		default:
			return;
	}
}

// ---------------------------------------------------------------------------
// collectRepeatedShapes — suggestion pass for shared supertypes/groups
// ---------------------------------------------------------------------------

function collectRepeatedShapes(rules: Record<string, Rule<'link'>>, out: RepeatedShapeEntry[]): void {
	// Build the set of already-declared supertype signatures so we
	// don't duplicate-suggest what the grammar author already wrote.
	const existingSupertypeKeys = new Set<string>();
	for (const rule of Object.values(rules)) {
		if (rule.type === SUPERTYPE) {
			existingSupertypeKeys.add([...rule.subtypes].sort().join('\n'));
		}
	}

	// Parent map: sorted kind key → set of parent rule names that
	// host a field with exactly this content-type set.
	const parentsByKey = new Map<string, Set<string>>();
	for (const [parentName, rule] of Object.entries(rules)) {
		collectFieldKindSets(rule, (kinds) => {
			if (kinds.length < 2) return;
			const key = [...kinds].sort().join('\n');
			let bucket = parentsByKey.get(key);
			if (!bucket) {
				bucket = new Set<string>();
				parentsByKey.set(key, bucket);
			}
			bucket.add(parentName);
		});
	}

	for (const [key, parents] of parentsByKey) {
		if (parents.size < 2) continue;
		if (existingSupertypeKeys.has(key)) continue;
		const kinds = key.split('\n');
		// Suggest a `supertype` when every kind looks like a named
		// rule kind (letters/underscores/digits, not operator
		// punctuation). Otherwise fall back to `group`.
		const shape: 'supertype' | 'group' = kinds.every((k) => /^[\w]+$/.test(k)) ? 'supertype' : 'group';
		out.push({
			suggestedName: suggestSharedName(kinds),
			kinds,
			parents: [...parents].sort(),
			shape
		});
	}
}

function collectFieldKindSets(rule: Rule<'link'>, yield_: (kinds: readonly string[]) => void): void {
	switch (rule.type) {
		case FIELD: {
			const kinds = directContentKinds(rule.content);
			if (kinds.length > 0) yield_(kinds);
			// Walk into the content too — nested fields get yielded
			// on their own.
			collectFieldKindSets(rule.content, yield_);
			return;
		}
		case SEQ:
		case CHOICE:
			for (const m of rule.members) collectFieldKindSets(m, yield_);
			return;
		case OPTIONAL:
		case REPEAT:
		case TOKEN:
		case VARIANT:
		case GROUP:
			collectFieldKindSets(rule.content, yield_);
			return;
	}
}

function directContentKinds(rule: Rule<'link'>): string[] {
	switch (rule.type) {
		case SYMBOL:
			return [rule.name];
		case SUPERTYPE:
			return [...rule.subtypes];
		case CHOICE:
			return rule.members.flatMap(directContentKinds);
		case OPTIONAL:
		case REPEAT:
		case TOKEN:
		case VARIANT:
		case GROUP:
			return directContentKinds(rule.content);
		default:
			return [];
	}
}

function suggestSharedName(kinds: readonly string[]): string {
	// Longest common suffix works surprisingly well for grammars —
	// `binary_expression` / `call_expression` / `field_expression`
	// all share `_expression`. Fall back to the kinds count when
	// nothing common sticks out.
	const words = kinds.map((k) => k.split('_').filter(Boolean));
	if (words.length === 0) return '_shared';
	const first = words[0]!;
	let suffix: string[] = [];
	for (let i = 1; i <= first.length; i++) {
		const tail = first.slice(first.length - i);
		if (words.every((w) => w.length >= i && w.slice(w.length - i).join('_') === tail.join('_'))) {
			suffix = tail;
		} else break;
	}
	if (suffix.length > 0) return '_' + suffix.join('_');
	return `_shared_${kinds.length}`;
}
// ---------------------------------------------------------------------------
// Separator-lift pass (moved from lift-separators.ts in R7 de-scatter).
//
// This is the TRANSFORM half of separated-list handling (the DETECTION half
// lives in `dsl/list-patterns.ts`). It rewrites the raw shapes tree-sitter
// authors write into one canonical repeat node carrying `separator` /
// `leading` / `trailing` markers.
//
// Why a link pass (not the evaluate constructors): the lift used to run at
// DSL-call time, before wire/override callbacks and enrich-injected rules
// existed. Running it here (post-wire, post-enrich) means every separated
// list — authored or synthesized — is lifted from one place.
//
// Idempotent: re-running over an already-lifted tree is a no-op.
// ---------------------------------------------------------------------------

/**
 * Merge adjacent `repeat`/`repeat1`(with separator) + `optional(sepLit)` pairs
 * inside a seq's member list by stamping `trailing: true` on the repeat and
 * dropping the optional. Returns the new member array if anything merged, else
 * `null`.
 */

export function absorbTrailingSeparator(members: Rule<'link'>[]): Rule<'link'>[] | null {
	let changed = false;
	const out: Rule<'link'>[] = [];
	for (let i = 0; i < members.length; i++) {
		const cur = members[i]!;
		const next = members[i + 1];
		const curSep = cur.type === REPEAT || cur.type === REPEAT1 ? cur.separator : undefined;
		const isSepRepeat = curSep !== undefined && !curSep.trailing;
		// Structural comparison (not literal-string-only) so a choice-shaped
		// separator (e.g. `optional(choice(',', ';'))`) is absorbed the same
		// way a plain literal one is.
		const isOptionalSepLit = (r: Rule<'link'> | undefined, sep: { value: Rule<'link'> }): boolean => {
			if (!r || r.type !== OPTIONAL) return false;
			return rulesEqual(r.content, sep.value);
		};
		if (isSepRepeat && isOptionalSepLit(next, curSep!)) {
			out.push({ ...(cur as RepeatRule | Repeat1Rule), separator: { ...curSep!, trailing: 'optional' } });
			i++;
			changed = true;
			continue;
		}
		out.push(cur);
	}
	return changed ? out : null;
}
/**
 * Detect the `commaSep1` family inside a seq's member list and lift it to a
 * single `repeat1` node with `separator` plus optional `leading` / `trailing`
 * markers. Returns `null` if no lift applies. Relies on the inner
 * `repeat(seq(sep, x))` already carrying a lifted `separator` — guaranteed
 * when this runs bottom-up (children lifted first).
 */

export function liftCommaSep(members: Rule<'link'>[]): Rule<'link'> | null {
	if (members.length < 2 || members.length > 3) return null;

	const repeatIdx = findRepeatWithSeparator(members);
	if (repeatIdx === -1) return null;
	const repeatNode = members[repeatIdx] as RepeatRule | Repeat1Rule;
	const sep = repeatNode.separator!;
	const elem = repeatNode.content;

	const matchesElem = (r: Rule<'link'>): boolean => rulesEqual(r, elem);
	// Structural comparison (not literal-string-only) so a choice-shaped
	// separator (e.g. `optional(choice(',', ';'))`) is absorbed the same way
	// a plain literal one is.
	const matchesOptionalSep = (r: Rule<'link'>): boolean => {
		if (r.type !== OPTIONAL) return false;
		return rulesEqual(r.content, sep.value);
	};

	// Head absorption (Cases 1-2): the standalone head element is the
	// structural proof of BETWEEN-join semantics — each ex-repeat element's
	// prefix separator becomes a between-separator once the head merges into
	// the same list. Clear the positional `leading: 'mandatory'` the inner
	// sep-first repeat lift stamped; only a HEADLESS sep-first repeat (no
	// absorbable head in its rule, e.g. python `_expression_list_group1`)
	// keeps it and renders the flank.
	// Case 1: [x, repeat(sep, x)]
	if (members.length === 2 && repeatIdx === 1 && matchesElem(members[0]!)) {
		return { type: REPEAT1, content: elem, separator: { ...sep, leading: undefined } };
	}
	// Case 2: [x, repeat(sep, x), optional(sep)] — genuinely OPTIONAL
	// trailing (per-instance variability, needs runtime capture).
	if (members.length === 3 && repeatIdx === 1 && matchesElem(members[0]!) && matchesOptionalSep(members[2]!)) {
		return { type: REPEAT1, content: elem, separator: { ...sep, leading: undefined, trailing: 'optional' } };
	}
	// Case 3: [sep, x, repeat(sep, x)] — a MANDATORY leading separator
	// (bare, not `optional(...)`-wrapped): always present, no per-instance
	// variability. Stamped `leading: 'mandatory'` — a real, distinct
	// `SeparatorFlankMode` value from Case 4's `'optional'`, not the same
	// boolean `true` both used to share (which is what let a genuinely
	// mandatory flank get misclassified as `'optional'` downstream, per
	// `AssembledSeparatedList.leadingMode`'s doc comment, node-map.ts).
	if (members.length === 3 && repeatIdx === 2 && rulesEqual(members[0]!, sep.value) && matchesElem(members[1]!)) {
		return { type: REPEAT1, content: elem, separator: { ...sep, leading: 'mandatory' } };
	}
	// Case 4: [optional(sep), repeat(sep, x)] or
	// [optional(sep), repeat(sep, x), optional(sep)] — genuinely OPTIONAL
	// leading separator (the flanking counterpart of Case 3's mandatory
	// form), also absorbing a trailing optional on the far side when
	// present. No case handled an OPTIONAL leading flank at all before this
	// widening (Case 3 only ever matched a bare, mandatory literal/
	// structural separator).
	if (repeatIdx === 1 && matchesOptionalSep(members[0]!)) {
		if (members.length === 2) {
			return { type: REPEAT1, content: elem, separator: { ...sep, leading: 'optional' } };
		}
		if (members.length === 3 && matchesOptionalSep(members[2]!)) {
			return { type: REPEAT1, content: elem, separator: { ...sep, leading: 'optional', trailing: 'optional' } };
		}
	}
	return null;
}
function findRepeatWithSeparator(members: Rule<'link'>[]): number {
	return members.findIndex((m) => (m.type === REPEAT || m.type === REPEAT1) && m.separator !== undefined);
}
function liftSeqMembers(seq: SeqRule<'link'>, members: Rule<'link'>[]): Rule<'link'> {
	const lifted = liftCommaSep(members);
	if (lifted) return { ...carrySeqAttrs(seq), ...lifted };
	const absorbed = absorbTrailingSeparator(members);
	return { ...seq, members: absorbed ?? members };
}
function carrySeqAttrs(seq: SeqRule<'link'>): Partial<SeqRule<'link'>> {
	const { members: _members, ...rest } = seq;
	return rest;
}
/**
 * Lift every separated list in a rule tree, bottom-up. Children are lifted
 * first so an inner `repeat(seq(sep, x))` carries its separator before the
 * enclosing seq's commaSep1 detection runs — the same order the evaluate
 * constructors produced by lifting inner-to-outer at call time.
 */

export function liftSeparators(rule: Rule<'link'>, ctx: LinkCtx): Rule<'link'> {
	switch (rule.type) {
		case SEQ:
			return liftSeqMembers(
				rule,
				rule.members.map((m) => liftSeparators(m, ctx))
			);
		case CHOICE:
			return { ...rule, members: rule.members.map((m) => liftSeparators(m, ctx)) };
		case REPEAT:
		case REPEAT1: {
			const content = liftSeparators(rule.content, ctx);
			const sep = detectRepeatSeparator(content);
			if (sep) {
				if (sep.separator.type !== STRING) {
					// 0 real grammars (rust/typescript/python) hit this today — this
					// is purely a forward-looking guard. Rendering a non-literal
					// (e.g. choice(',', ';')) separator isn't supported yet; tracked
					// by PR-T (docs/superpowers/specs/2026-05-26-non-slot-separator-rules-design.md).
					const diagnostic: CompilerDiagnostic = {
						code: 'non-literal-separator',
						severity: 'warning',
						message: `Rule '${rule.type === REPEAT ? 'repeat' : 'repeat1'}' has a non-literal separator (${sep.separator.type}); rendering this shape is not yet supported (tracked: PR-T, docs/superpowers/specs/2026-05-26-non-slot-separator-rules-design.md).`,
						canProceed: true,
						scope: 'compiler',
						phase: 'link'
					};
					ctx.diagnostics.emit(diagnostic);
				}
				// `sep.trailing` (list-patterns.ts's `detectRepeatSeparator`) is a
				// POSITIONAL flag: the separator appears AFTER the content element
				// within `repeat(seq(content, SEP))` — every iteration (including
				// the last) unconditionally emits `SEP`, no per-instance
				// omission possible. That is a genuinely MANDATORY trailing
				// flank, not the `optional` kind `liftCommaSep`'s Case 2/4 stamp
				// (this function, `liftSeparators`, is a separate, earlier lift
				// that never sees an `optional(sep)`-wrapped shape — that shape
				// only arises from the seq-of-3-members pattern `liftCommaSep`
				// handles downstream in link).
				// Symmetric positional stamp: sep-FIRST (`repeat(seq(SEP, X))`)
				// means every element is PREFIXED — a mandatory LEADING flank.
				// This is safe for BOTH list shapes because the joinWith*
				// filters are capture-driven: a canonical head-first list
				// captures no leading anon (no separator precedes its first
				// element) and the filter degrades to a plain between-join,
				// while a HEADLESS group (head lives outside the group, e.g.
				// python `_expression_list_group1`) captures its leading ','
				// and renders `,2,3` — previously these reversed to `2,3,`
				// because only the trailing flank was ever stamped.
				return {
					...rule,
					content: sep.content,
					separator: {
						value: sep.separator,
						trailing: sep.trailing ? 'mandatory' : undefined,
						leading: sep.trailing ? undefined : 'mandatory'
					}
				};
			}
			return { ...rule, content };
		}
		case OPTIONAL:
		case FIELD:
		case TOKEN:
		case ALIAS:
			return { ...rule, content: liftSeparators(rule.content, ctx) };
		default:
			// Leaves (symbol/string/pattern/enum). The wrapper *compiler* types
			// group/variant/terminal do NOT exist in the tree when this runs:
			// liftSeparators is invoked in the link resolveRule loop, whereas
			// GROUP is synthesized later in link (link.ts:189/1864) and VARIANT
			// later still in normalize. Their bodies are lifted AT those
			// construction sites, so skipping them here is correct, not lossy.
			// (The pre-link DSL-shaped uppercase 'GROUP'/'VARIANT' are a separate
			// dsl/ vocabulary that never reaches this compiler-Rule<'link'> walker.)
			return rule;
	}
}
// ---------------------------------------------------------------------------
// Group-lift synthesis (moved from group-synthesis.ts in R7 de-scatter).
// Implements the `groups:` override block per
// docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md.
// Pure — no I/O, no side effects on inputs.
// ---------------------------------------------------------------------------
/**
 * Walk a path string ('1/1/0/1/3') into a rule tree, returning the
 * sub-rule at that path. Path segments index into:
 *   - seq.members[i]
 *   - choice.members[i]
 *   - wrapper.content (path '0' for optional/repeat/repeat1/field/token/
 *     alias/variant/clause/group)
 *
 * Throws if any segment fails to address. Mirrors path semantics used
 * by `polymorphs:` / `transforms:` in `grammar.sittir.ts`.
 */

export function resolveGroupPath(rule: Rule<'link'>, path: string): Rule<'link'> {
	const segments = path.split('/').filter((s) => s.length > 0);
	let cur: Rule<'link'> = rule;
	for (let i = 0; i < segments.length; i++) {
		const seg = segments[i]!;
		const idx = parseInt(seg, 10);
		if (Number.isNaN(idx)) {
			throw new Error(`group path '${path}' has non-numeric segment '${seg}' at position ${i}`);
		}
		cur = stepInto(cur, idx, path);
	}
	return cur;
}
function stepInto(rule: Rule<'link'>, idx: number, fullPath: string): Rule<'link'> {
	switch (rule.type) {
		case SEQ:
		case CHOICE: {
			const m = rule.members[idx];
			if (!m) {
				throw new Error(
					`group path '${fullPath}' does not resolve: index ${idx} out of range in ${rule.type} of ${rule.members.length} members`
				);
			}
			return m;
		}
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case FIELD:
		case TOKEN:
		case ALIAS:
		case VARIANT:
		case GROUP:
			if (idx !== 0) {
				throw new Error(
					`group path '${fullPath}' does not resolve: index ${idx} invalid for wrapper '${rule.type}' (only 0 is content)`
				);
			}
			return (rule as { content: Rule<'link'> }).content;
		default:
			throw new Error(`group path '${fullPath}' does not resolve: cannot descend into rule of type '${rule.type}'`);
	}
}

export interface DeriveSynthesizedNameArgs {
	parentKind: string;
	path: string;
	discriminator: string;
	polymorphs: Record<string, Record<string, string> | undefined>;
}
/**
 * Compute the synthesized hidden kind name for a group lift.
 *
 * Rule<'link'>: `_<parent>` + for each path-prefix that ALSO appears as a key
 * in polymorphs[parent], append `_<variantName>` + `_<discriminator>`.
 *
 * Polymorph prefixes are matched by string prefix of the slash-joined
 * path. polymorphs['1'] matches lift paths '1', '1/2', '1/2/3' etc.
 * polymorphs['1/2'] matches '1/2', '1/2/3' etc.
 */

export function deriveSynthesizedName(args: DeriveSynthesizedNameArgs): string {
	const { parentKind, path, discriminator, polymorphs } = args;
	const polymorphsForKind = polymorphs[parentKind] ?? {};
	const segments = path.split('/').filter((s) => s.length > 0);

	const contributions: string[] = [];
	for (let i = 1; i <= segments.length; i++) {
		const prefix = segments.slice(0, i).join('/');
		if (prefix in polymorphsForKind) {
			contributions.push(polymorphsForKind[prefix]!);
		}
	}

	// When parentKind already starts with '_' (hidden rule), use it as-is
	// as the base; otherwise prepend '_' to canonicalize.
	const base = parentKind.startsWith('_') ? parentKind : '_' + parentKind;
	return [base, ...contributions, discriminator].join('_');
}

export interface ValidateGroupsArgs {
	groups: Record<string, Record<string, string> | undefined>;
	polymorphs: Record<string, Record<string, string> | undefined>;
	rules: Record<string, Rule<'link'>>;
	warn?: (msg: string) => void;
}
/**
 * Validate all groups config at config-load time. Throws on E1-E5,
 * warns on E6. See spec §"Error handling" for the full taxonomy.
 */

function resolveGroupsConfigKey(kind: string, rules: Record<string, Rule<'link'>>): string | undefined {
	if (kind in rules) return kind;
	if (!kind.startsWith('_')) return undefined;
	const visibleName = kind.slice(1);
	return visibleName in rules ? visibleName : undefined;
}

export function validateGroupsConfig(args: ValidateGroupsArgs): void {
	const { groups, polymorphs, rules, warn } = args;
	const emitWarn = warn ?? ((msg: string) => console.warn(`[groups] ${msg}`));

	for (const [kind, lifts] of Object.entries(groups)) {
		if (!lifts) continue;
		const resolvedKey = resolveGroupsConfigKey(kind, rules);
		const root = resolvedKey !== undefined ? rules[resolvedKey] : undefined;
		if (!root) {
			throw new Error(`groups['${kind}']: kind not in rule map`);
		}
		const polysForKind = polymorphs[kind] ?? {};
		const liftPaths = Object.keys(lifts);

		for (const path of liftPaths) {
			const discriminator = lifts[path]!;

			let target: Rule<'link'>;
			try {
				target = resolveGroupPath(root, path);
			} catch (e) {
				throw new Error(`groups['${kind}']['${path}']: ${(e as Error).message}`);
			}

			if (discriminator.length === 0) {
				throw new Error(`groups['${kind}']['${path}']: discriminator must be a non-empty identifier`);
			}
			if (!isAsciiIdentifier(discriminator)) {
				throw new Error(`groups['${kind}']['${path}']: discriminator '${discriminator}' is not a valid identifier`);
			}

			for (const polyPath of Object.keys(polysForKind)) {
				if (polyPath === path) {
					throw new Error(
						`groups['${kind}']['${path}'] and polymorphs['${kind}']['${polyPath}'] target the same position; pick one`
					);
				}
				if (isAncestorPath(path, polyPath)) {
					const synName = deriveSynthesizedName({ parentKind: kind, path, discriminator, polymorphs });
					throw new Error(
						`groups['${kind}']['${path}'] would lift content containing polymorphs['${kind}']['${polyPath}']; ` +
							`rewrite the inner polymorph relative to the lifted kind (${synName}) or remove the overlapping entry`
					);
				}
			}

			for (const otherPath of liftPaths) {
				if (otherPath === path) continue;
				if (isAncestorPath(path, otherPath)) {
					throw new Error(
						`groups['${kind}']['${path}'] contains another group lift at '${otherPath}'; nested group lifts are not supported`
					);
				}
			}

			const synthName = deriveSynthesizedName({ parentKind: kind, path, discriminator, polymorphs });
			if (synthName in rules) {
				throw new Error(
					`groups['${kind}']['${path}'] would synthesize ${synthName}, but a rule with that name already exists; pick a different discriminator`
				);
			}

			if (!hasStructuralMember(target)) {
				emitWarn(
					`groups['${kind}']['${path}']: lifted body has no structural members (purely literal/punctuation content)`
				);
			}
		}
	}
}
function isAncestorPath(ancestor: string, descendant: string): boolean {
	if (ancestor === descendant) return false;
	const a = ancestor.split('/');
	const d = descendant.split('/');
	if (a.length >= d.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== d[i]) return false;
	}
	return true;
}
function hasStructuralMember(rule: Rule<'link'>): boolean {
	switch (rule.type) {
		case FIELD:
		case SYMBOL:
		case SUPERTYPE:
			return true;
		case SEQ:
		case CHOICE:
			return rule.members.some(hasStructuralMember);
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case TOKEN:
		case ALIAS:
		case VARIANT:
		case GROUP:
			return hasStructuralMember((rule as { content: Rule<'link'> }).content);
		default:
			return false;
	}
}

export interface ApplyGroupOverridesArgs {
	rules: Record<string, Rule<'link'>>;
	groups: Record<string, Record<string, string> | undefined>;
	polymorphs: Record<string, Record<string, string> | undefined>;
	warn?: (msg: string) => void;
}

export interface ApplyGroupOverridesResult {
	rules: Record<string, Rule<'link'>>;
	synthesizedKinds: readonly string[];
}
/**
 * Apply all `groups:` lifts. Pure transform — input rules are not
 * mutated; a new rules map is returned with lifted bodies registered
 * under their synthesized kind names and parent bodies rewritten to
 * reference them.
 *
 * Wrapper handling: when the lift target is wrapped (`optional` /
 * `repeat` / `repeat1`), only the wrapper's content is moved into the
 * synthesized kind. The wrapper stays at the parent's lift position
 * with the synthesized symbol ref inside. This preserves cardinality
 * semantics at the parent.
 */

export function applyGroupOverrides(args: ApplyGroupOverridesArgs): ApplyGroupOverridesResult {
	validateGroupsConfig(args);

	const newRules: Record<string, Rule<'link'>> = { ...args.rules };
	const synthesizedKinds: string[] = [];

	for (const [kind, lifts] of Object.entries(args.groups)) {
		if (!lifts || Object.keys(lifts).length === 0) continue;
		// `kind` may be variant()/polymorphs' INTENDED hidden name rather
		// than the name the rule is actually registered under — see
		// `resolveGroupsConfigKey`'s doc comment. `deriveSynthesizedName`
		// below still uses the ORIGINAL `kind` (the naming convention
		// callers/templates expect), only the rules-map read/write target
		// resolves to wherever the body actually lives.
		const resolvedKey = resolveGroupsConfigKey(kind, newRules) ?? kind;
		const sortedPaths = Object.keys(lifts).sort((a, b) => b.length - a.length); // deep first
		let parentBody = clone(newRules[resolvedKey]!);

		for (const path of sortedPaths) {
			const discriminator = lifts[path]!;
			const synName = deriveSynthesizedName({
				parentKind: kind,
				path,
				discriminator,
				polymorphs: args.polymorphs
			});
			const target = resolveGroupPath(parentBody, path);
			const { liftedBody, replacement } = liftRule(target, synName, discriminator);

			parentBody = replaceAtPath(parentBody, path, replacement);
			newRules[synName] = liftedBody;
			synthesizedKinds.push(synName);
		}

		newRules[resolvedKey] = parentBody;
	}

	return { rules: newRules, synthesizedKinds };
}
function liftRule(
	target: Rule<'link'>,
	synName: string,
	_discriminator: string
): { liftedBody: Rule<'link'>; replacement: Rule<'link'> } {
	// Mint the helper ref through evaluate's `symbol()` so it gets the SAME
	// construction-time stamps (`hidden`, `inline = name.startsWith('_')`) as any
	// other ref — group-lift helpers are `_`-prefixed → inline=true. Stamping at
	// the one constructor (then revised at wrapper push-down / link supertype pass)
	// keeps `inline` authoritative on the normalizedRules path, so normalize's fold
	// can read it instead of re-deriving hiddenness structurally.
	const synSym = { ...sym(synName), metadata: makeRuleMetadata({ symbolSource: 'group-lift' }) };
	// (_discriminator kept for future use; the current implementation does not use it.
	// The discriminator participates only in the synthesized kind name component.)
	switch (target.type) {
		case OPTIONAL:
			return {
				liftedBody: target.content,
				replacement: { type: OPTIONAL, content: synSym } as Rule<'link'>
			};
		case REPEAT:
			// target.separator already carries trailing/leading nested — rides
			// along for free (same pattern as wrapper-deletion.ts's REPEAT case).
			return {
				liftedBody: target.content,
				replacement: { type: REPEAT, content: synSym, separator: target.separator } as Rule<'link'>
			};
		case REPEAT1:
			return {
				liftedBody: target.content,
				replacement: { type: REPEAT1, content: synSym, separator: target.separator } as Rule<'link'>
			};
		default:
			return { liftedBody: target, replacement: synSym };
	}
}
function clone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}
// ---------------------------------------------------------------------------
// stampStaticRenderAs — inline string() renderAs bodies into rule trees
// ---------------------------------------------------------------------------
/**
 * Stamp static renderAs entries into rule bodies.
 *
 * For each renderAs entry with a `string(lit)` body, walk the rule map
 * and replace every occurrence of:
 *   - `SYMBOL(x)` (bare)
 *   - `FIELD(name, SYMBOL(x))` (field-wrapped)
 *   - `FIELD(name, ALIAS(SYMBOL(x)))` (alias-wrapped — any depth)
 * with `STRING(lit)` at the same position. Pure transform — input rule
 * map not mutated.
 *
 * Symbol resolution is transitive: when `x` itself is not in `renderAs`
 * but `rules[x]` is a `StringRule<'link'>` whose value matches a renderAs literal,
 * the stamp fires. This handles post-evaluate renaming — evaluate's
 * `synthesizeFieldEnumRules` replaces `field(n, SYMBOL(renderAs))` with
 * `field(n, SYMBOL(_parentKind_fieldName))` where the new hidden rule
 * has the same `string` body as the original renderAs entry.
 *
 * After this pass, downstream phases (slot derivation, template walker,
 * factory emitter, from emitter) see bare string literals at those
 * positions and treat them as inline mandatory literals in seq context —
 * the same as how `seq('mod', $.name)` renders `mod {{ name }}` with
 * `mod` stamped inline.
 */

export function stampStaticRenderAs(
	rules: Record<string, Rule<'link'>>,
	renderAs: Record<string, Rule<'link'>>
): Record<string, Rule<'link'>> {
	// Build the stamp lookup: renderAs-key → literal value, for entries
	// that are single string() bodies.
	const renderStamps: Record<string, string> = {};
	// Blank-bodied renderAs entries: zero-width-equivalent. References
	// get replaced with `{ type: 'CHOICE', members: [] }` (the blank
	// sentinel), which the choice() collapse in `rewriteRuleForStamp`
	// lowers to `optional(other)` when paired with another member. Use
	// case: tree-sitter externals that fire invisibly at runtime (e.g.
	// ASI's `_automatic_semicolon`). The slot-model look-through in
	// node-map.ts propagates this optionality up to any SYMBOL ref
	// pointing at the now-optional-bodied wrapper rule (`_semicolon`).
	const blankStamps = new Set<string>();
	for (const [sym, body] of Object.entries(renderAs)) {
		if (body.type === STRING) renderStamps[sym] = body.value;
		else if (isBlankRule(body)) blankStamps.add(sym);
	}
	if (Object.keys(renderStamps).length === 0 && blankStamps.size === 0) return rules;

	// Build symToLit: symbol-name → literal to stamp.
	// Includes:
	//   1. The original renderAs key names (exact match).
	//   2. Names whose string body matches a renderAs value AND whose
	//      name ends with the renderAs key (handling evaluate's
	//      synthesized renames: `synthesizeFieldEnumRules` creates
	//      `_<parent>_<fieldName>` where `<fieldName>` corresponds to the
	//      field that referenced the renderAs symbol — the renderAs key
	//      itself ends with `_<fieldName>`).
	// This is deliberately conservative: we do NOT match all string rules
	// by value alone, to avoid stamping unrelated `_kw_*` helpers that
	// happen to share a character with a renderAs literal (e.g.
	// `_kw_negative` has body `'!'` which clashes with the
	// `_inner_*_doc_comment_marker` renderAs values).
	const symToLit: Record<string, string> = { ...renderStamps };
	for (const [sym, body] of Object.entries(rules)) {
		if (sym in symToLit) continue; // Already included via exact match.
		if (body.type !== STRING) continue;
		// Check whether any renderAs key is a suffix of this symbol name.
		for (const [renderKey, lit] of Object.entries(renderStamps)) {
			if (sym.endsWith(renderKey) && body.value === lit) {
				symToLit[sym] = lit;
				break;
			}
		}
	}
	if (Object.keys(symToLit).length === 0 && blankStamps.size === 0) return rules;

	const out: Record<string, Rule<'link'>> = {};
	for (const [name, rule] of Object.entries(rules)) {
		// Blank-stamped entries are removed from the rules map: their
		// references have been replaced inline with the blank sentinel
		// (which `rewriteRuleForStamp` collapses to `optional(...)` in
		// containing choices). Keeping the entry would cause assemble to
		// classify an empty `choice` body as an empty AssembledEnum and
		// throw.
		if (blankStamps.has(name)) continue;
		out[name] = rewriteRuleForStamp(rule, symToLit, blankStamps);
	}
	return out;
}
function isBlankRule(rule: Rule<'link'>): boolean {
	return (rule.type === CHOICE && rule.members.length === 0) || (rule.type === SEQ && rule.members.length === 0);
}
function rewriteRuleForStamp(
	rule: Rule<'link'>,
	symToLit: Record<string, string>,
	blankStamps: ReadonlySet<string>
): Rule<'link'> {
	switch (rule.type) {
		case SYMBOL: {
			const lit = symToLit[rule.name];
			if (lit !== undefined) return { type: STRING, value: lit };
			if (blankStamps.has(rule.name)) return { type: CHOICE, members: [] };
			return rule;
		}

		case FIELD: {
			const inner = unwrapAliasForCheck(rule.content);
			if (inner.type === SYMBOL) {
				const lit = symToLit[inner.name];
				if (lit !== undefined) {
					// Drop the field wrapper; stamp the literal inline.
					return { type: STRING, value: lit };
				}
				// Blank-stamped: the field references a zero-width-equivalent
				// external. Replace the whole field with blank so the parent
				// seq/choice collapse handles cardinality.
				if (blankStamps.has(inner.name)) return { type: CHOICE, members: [] };
			}
			return { ...rule, content: rewriteRuleForStamp(rule.content, symToLit, blankStamps) };
		}

		case ALIAS:
			return { ...rule, content: rewriteRuleForStamp(rule.content, symToLit, blankStamps) };

		case TOKEN:
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case VARIANT:
		case GROUP:
			return { ...rule, content: rewriteRuleForStamp(rule.content, symToLit, blankStamps) } as Rule<'link'>;

		case SEQ:
			return { ...rule, members: rule.members.map((m) => rewriteRuleForStamp(m, symToLit, blankStamps)) };

		case CHOICE: {
			// Recursively stamp members, then re-apply the blank-collapse that
			// evaluate.ts's choice() applies at DSL time. `choice(X, blank)` →
			// `optional(X)`. Re-applied here because stamping may have
			// synthesized new blank members the DSL-time pass didn't see.
			const members = rule.members.map((m) => rewriteRuleForStamp(m, symToLit, blankStamps));
			const nonBlank = members.filter((m) => !isBlankRule(m));
			const hadBlank = nonBlank.length < members.length;
			if (!hadBlank) return { ...rule, members };
			if (nonBlank.length === 0) return { type: CHOICE, members: [] };
			if (nonBlank.length === 1) return { type: OPTIONAL, content: nonBlank[0]! };
			return { type: OPTIONAL, content: { type: CHOICE, members: nonBlank } };
		}

		default:
			return rule;
	}
}
function unwrapAliasForCheck(rule: Rule<'link'>): Rule<'link'> {
	if (rule.type === ALIAS || rule.type === TOKEN) return unwrapAliasForCheck(rule.content);
	return rule;
}
// ---------------------------------------------------------------------------
// Refine-form validation (moved from link-refine.ts in R7 de-scatter).
//
// Validates `refine()` metadata against the linked rule tree at link time.
// `refine()` registers per-form choice selections at authoring time; the rule
// tree may still be mid-transform then, so validation is deferred to here.
// See refine() DSL primitive for the full design.
// ---------------------------------------------------------------------------

/**
 * The result of resolving a refine() path against a rule tree. Carries
 * both the containing field name (when the terminal choice lives inside
 * a field wrapper) and the choice itself so emitters can narrow the
 * field's literal values per form.
 */

export interface RefinePathResolution {
	readonly fieldName: string | undefined;
	readonly choice: ChoiceRule<'link'> | EnumRule<'link'>;
}
/**
 * Validate every refine form's paths and selections for one kind.
 * Throws on the first failure — codegen fails loud when a refine
 * declaration is inconsistent with the rule shape.
 *
 * @param kind - Rule<'link'> kind being validated (used in error messages).
 * @param rule - Post-link rule tree for `kind`.
 * @param forms - Ordered list of refine forms declared for `kind`.
 * @param rules - Optional rules map for resolving symbol references
 *   introduced by evaluate's field-enum synthesis pass. When a path
 *   terminus resolves to a `SymbolRule<'link'>`, the target rule is looked up
 *   here to retrieve the underlying `EnumRule<'link'>`.
 */

export function validateRefineForms(
	kind: string,
	rule: Rule<'link'>,
	forms: readonly RefineForm[],
	rules?: Readonly<Record<string, Rule<'link'>>>
): void {
	for (const form of forms) {
		for (const [pathStr, selection] of Object.entries(form.selections)) {
			const resolution = resolveRefinePath(kind, form.name, pathStr, rule, rules);
			validateSelection(kind, form.name, pathStr, resolution.choice, selection);
		}
	}
}
/**
 * Resolve a refine() path against a rule tree to the target CHOICE.
 *
 * @param kind - Rule<'link'> kind being validated (used in error messages).
 * @param formName - Refine form name (used in error messages).
 * @param pathStr - The path string as declared in the refine() call.
 * @param rule - Post-link rule tree for `kind`.
 * @param rules - Optional rules map for resolving symbol references
 *   introduced by evaluate's field-enum synthesis pass.
 * @returns A {@link RefinePathResolution} carrying the choice and the
 *   enclosing field name (when the terminal step was a `name:` segment).
 * @throws When the path doesn't resolve, or resolves to a non-choice.
 */

export function resolveRefinePath(
	kind: string,
	formName: string,
	pathStr: string,
	rule: Rule<'link'>,
	rules?: Readonly<Record<string, Rule<'link'>>>
): RefinePathResolution {
	const segments = parsePath(pathStr);
	if (segments.length === 0) {
		throw new Error(`refine(${kind}) form '${formName}': path '${pathStr}' is empty`);
	}
	let cur: Rule<'link'> = rule;
	let fieldName: string | undefined;
	for (let i = 0; i < segments.length; i++) {
		const seg = segments[i]!;
		const res = stepPath(cur, seg, kind, formName, pathStr);
		cur = res.next;
		if (seg.kind === 'fieldName') fieldName = seg.name;
	}
	const final = unwrapToChoice(cur, rules);
	if (!final) {
		throw new Error(
			`refine(${kind}) form '${formName}': path '${pathStr}' does not resolve to a choice (got '${cur.type}')`
		);
	}
	return { fieldName, choice: final };
}
function stepPath(
	rule: Rule<'link'>,
	seg: PathSegment,
	kind: string,
	formName: string,
	pathStr: string
): { next: Rule<'link'> } {
	switch (seg.kind) {
		case 'fieldName': {
			const target = findFieldByName(rule, seg.name);
			if (!target) {
				throw new Error(
					`refine(${kind}) form '${formName}': path '${pathStr}' segment '${seg.name}:' does not match any field in rule (type '${rule.type}')`
				);
			}
			return { next: target.content };
		}
		case 'index': {
			const members = membersOf(rule);
			if (!members) {
				throw new Error(
					`refine(${kind}) form '${formName}': path '${pathStr}' segment '${seg.value}' cannot descend into '${rule.type}'`
				);
			}
			const idx = seg.value < 0 ? members.length + seg.value : seg.value;
			if (idx < 0 || idx >= members.length) {
				throw new Error(
					`refine(${kind}) form '${formName}': path '${pathStr}' segment '${seg.value}' out of bounds for ${rule.type} (length ${members.length})`
				);
			}
			return { next: members[idx]! };
		}
		case 'wildcard': {
			const members = membersOf(rule);
			if (members && members.length > 0) {
				return { next: members[0]! };
			}
			const content = singleContentOf(rule);
			if (content) return { next: content };
			throw new Error(
				`refine(${kind}) form '${formName}': path '${pathStr}' wildcard cannot descend into '${rule.type}'`
			);
		}
		case 'kind-match':
			throw new Error(
				`refine(${kind}) form '${formName}': path '${pathStr}' uses kind-match '(${seg.name})' — refine paths only support positional indices and 'name:' field traversal`
			);
	}
}
function unwrapToChoice(
	rule: Rule<'link'>,
	rules?: Readonly<Record<string, Rule<'link'>>>
): ChoiceRule<'link'> | EnumRule<'link'> | undefined {
	let cur = rule;
	const visitedSymbols = new Set<string>();
	for (;;) {
		if (isChoice(cur)) return cur;
		if (isOptional(cur) || isRepeat(cur) || isRepeat1(cur)) {
			cur = cur.content;
			continue;
		}
		// Follow synthesized field-enum indirection until we reach the
		// underlying enum/choice. Real grammars often lower field-wrapped
		// literal choices to hidden symbol refs during evaluate.
		if (isSymbol(cur) && rules !== undefined) {
			if (visitedSymbols.has(cur.name)) return undefined;
			visitedSymbols.add(cur.name);
			const target = rules[cur.name];
			if (target !== undefined) {
				cur = target;
				continue;
			}
		}
		return undefined;
	}
}
function findFieldByName(rule: Rule<'link'>, fieldName: string): FieldRule | undefined {
	if (isField(rule)) return rule.name === fieldName ? rule : undefined;
	if (isSeq(rule)) {
		for (const m of rule.members) {
			const hit = findFieldByName(m, fieldName);
			if (hit) return hit;
		}
		return undefined;
	}
	if (isOptional(rule) || isRepeat(rule) || isRepeat1(rule)) {
		return findFieldByName(rule.content, fieldName);
	}
	return undefined;
}
function validateSelection(
	kind: string,
	formName: string,
	pathStr: string,
	choice: ChoiceRule<'link'> | EnumRule<'link'>,
	selection: number | string
): void {
	const arms: readonly Rule<'link'>[] = choice.members;
	if (typeof selection === 'number') {
		if (selection < 0 || selection >= arms.length) {
			throw new Error(
				`refine(${kind}) form '${formName}': path '${pathStr}' selection index ${selection} out of range (choice has ${arms.length} branches)`
			);
		}
		return;
	}
	const stringValues = arms.map(unwrapToStringValue).filter((v): v is string => v !== undefined);
	if (!stringValues.includes(selection)) {
		throw new Error(
			`refine(${kind}) form '${formName}': path '${pathStr}' selection '${selection}' does not match any string branch of the choice (available: ${stringValues.map((v) => `'${v}'`).join(', ') || '<none>'})`
		);
	}
}
function unwrapToStringValue(rule: Rule<'link'>): string | undefined {
	if (isString(rule)) return rule.value;
	if (rule.type === VARIANT) {
		const inner = (rule as { content: Rule<'link'> }).content;
		if (isString(inner)) return inner.value;
	}
	return undefined;
}
/**
 * Given a rule tree and a resolved refine form, return the field name
 * whose single literal value should be narrowed for per-form Config
 * emission, along with the narrowed literal.
 *
 * Used by the type/factory emitters to build the per-form narrowed
 * fields. Returns an array because a form may narrow multiple selections
 * (e.g. `opening` and `closing` simultaneously).
 *
 * @returns Array of `{ fieldName, literal }` tuples. `fieldName` is the
 *   enclosing field (when the selection targets a field-wrapped choice)
 *   and `literal` is the chosen string value. Entries whose selection
 *   can't be resolved to a string (e.g. numeric selection into a
 *   non-string branch) are omitted — those forms still narrow the
 *   choice shape at parse time but don't qualify for auto-stamp.
 */

export function narrowedFieldLiteralsForForm(
	rule: Rule<'link'>,
	form: RefineForm,
	rules?: Readonly<Record<string, Rule<'link'>>>
): Array<{ fieldName: string; literal: string }> {
	const out: Array<{ fieldName: string; literal: string }> = [];
	for (const [pathStr, selection] of Object.entries(form.selections)) {
		const resolution = resolveRefinePath('<emit>', form.name, pathStr, rule, rules);
		if (!resolution.fieldName) continue;
		const literal = resolveSelectionLiteral(resolution.choice, selection);
		if (literal === undefined) continue;
		out.push({ fieldName: resolution.fieldName, literal });
	}
	return out;
}
/**
 * Map a selection (numeric index or string) to the terminal string
 * value it selects. Returns `undefined` when the index points at a
 * non-string branch.
 */

export function resolveSelectionLiteral(
	choice: ChoiceRule<'link'> | EnumRule<'link'>,
	selection: number | string
): string | undefined {
	if (typeof selection === 'string') return selection;
	const arm = choice.members[selection];
	if (!arm) return undefined;
	return unwrapToStringValue(arm);
}
// ---------------------------------------------------------------------------
// Rule<'link'>-shape helpers (localized — we don't want link-refine to grow into
// a general rule-walking utility; it's path-resolution only)
// ---------------------------------------------------------------------------
function membersOf(rule: Rule<'link'>): Rule<'link'>[] | undefined {
	if (rule.type === SEQ || rule.type === CHOICE) return rule.members;
	return undefined;
}
function singleContentOf(rule: Rule<'link'>): Rule<'link'> | undefined {
	switch (rule.type) {
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case FIELD:
		case VARIANT:
		case GROUP:
			// PR-P Task 2: TERMINAL case removed — TerminalRule deleted from Rule<'link'> union.
			return rule.content;
		default:
			return undefined;
	}
}
