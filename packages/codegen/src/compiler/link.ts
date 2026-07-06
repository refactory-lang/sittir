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

import { ALIAS, CHOICE, DEDENT, FIELD, GROUP, INDENT, NEWLINE, OPTIONAL, PATTERN, REPEAT, REPEAT1, SEQ, STRING, SUPERTYPE, SYMBOL, TOKEN, VARIANT } from '../types/rule-types.ts'; // @rule-type-consts
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
	VariantRule,
	AliasRule,
	AnyRule,
} from '../types/rule.ts';
import { isSeq, isChoice, isEnumChoiceRule, sym, replaceAtPath, isSymbol, isString, isRepeat1, isRepeat, isOptional, isField } from '../types/rule.ts';
import { isStringType } from '../types/runtime-shapes.ts';
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
	RefineForm,
} from './types.ts';
import { hasAnyField } from './model/node-map.ts';
import { collectFieldNames } from '../types/rule.ts';
import { isAsciiIdentifier } from '../util/identifier-shape.ts';
import { compileWordMatcher, matchesWordShape } from '../util/word-matcher.ts';
import {
	isHiddenKind,
	deriveComplexAliasTargetHidden,
	isClauseHoistVisibleGroupAlias,
	isOptionalOrBlankChoice
} from './evaluate.ts';
import { polymorphVisibleName } from '../dsl/wire/wire.ts';
import { deriveStructuralVariantChildren, isAliasMintedRef, prefixNamedSuffix } from './variant-structural.ts';
import { rulesEqual, detectRepeatSeparator } from '../dsl/list-patterns.ts';
import { parsePath, type PathSegment } from '../dsl/transform/transform-path.ts';
import { DiagnosticSink } from '../types/diagnostics.ts';
import { BaseCtx, type BaseCtxInit } from './ctx.ts';
import { RuleWalker } from '../dsl/rule-walker.ts';

// ---------------------------------------------------------------------------
// link() — main entry point
// ---------------------------------------------------------------------------

/**
 * Public options bag for {@link link} (formerly named `LinkCtx` — renamed so
 * the name is free for the phase-internal context below, matching the
 * NormalizeCtx/SimplifyCtx/AssembleCtx convention).
 *
 * Folds the former positional `include?` + `generatedIdTables?` args into a
 * single `(raw, ctx?)` shape (CW5). The old 3-arg positional form is gone —
 * every real caller either omitted both or used it positionally, and the
 * one that did (generate.ts) is updated alongside this.
 */
export interface LinkOptions {
	readonly include?: IncludeFilter;
	readonly generatedIdTables?: GeneratedIdTables;
}

/**
 * Phase context for the Link phase (S2, `BaseCtx<'evaluate'>` — Link READS
 * `Grammar<'evaluate'>` = {@link RawGrammar}; see
 * docs/superpowers/specs/2026-07-04-grammar-phase-ctx-design.md §2). Was
 * `BaseCtx<Rule<'link'>>` (R12 PR-4) — a mislabel: the ctx was always
 * constructed from `raw.rules` (`Rule<'evaluate'>`-shaped), never the
 * `Rule<'link'>` resolve-loop accumulator (PR #136's finding, closed here —
 * `ctx.rules`/`ctx.grammar.rules` is now honestly the RAW pre-resolve view).
 *
 * Merges the former `ResolveCtx` (rule-resolution walk: `rules` — inherited
 * from `BaseCtx`, was `allRules` — `supertypes`, `externalRoles`) and
 * `HiddenClassifyCtx` (hidden-rule classification cluster: `inline`,
 * `derivations`, `applyPromotedRules`, `hiddenChoicesWithNamedAliasMembers`)
 * — both were R4 / #14 pass-constant/pass-shared state for the same `link()`
 * call, just threaded as two separate bags. `currentName`/per-rule `name`
 * stay explicit trailing params (CW6), as in `resolveRule(rule, ctx, name)`.
 *
 * `externalRoles` and `derivations` are write-through accumulators mutated
 * during the resolve/classify walks (role-lookup memoization and the
 * promoted-rules log, respectively) — kept as plain mutable fields rather
 * than wrapped in methods, mirroring `AssembleCtx.nodes`' getter tradeoff.
 *
 * S3 raw-vs-accumulator audit (per
 * docs/superpowers/specs/2026-07-04-grammar-phase-ctx-design.md §3): every
 * `ctx.rules` / `ctx.grammar.rules` read site inside this file was checked
 * against what it factually needs. All FOUR consult the RAW pre-resolve view
 * (correctly — none needed the post-resolve accumulator, which is already
 * threaded explicitly as a plain parameter everywhere it IS needed):
 *   - `resolveRule`'s ALIAS case / `isClauseHoistVisibleGroupAlias` guard —
 *     runs DURING the resolve loop itself, so only the raw view exists yet;
 *     the mint condition structurally requires "no independent rule body
 *     exists" (`ctx.rules[rule.value] === undefined`), a fact only the raw
 *     grammar can answer.
 *   - `resolveSymbolRoleOrPass` (legacy structural role detection) — same
 *     reason: called from `resolveRule` during the resolve loop, checking the
 *     RAW target's shape (`_foo: () => role('indent')` dummy declarations,
 *     which never survive into any resolved view).
 *   - `mintContentAliasKinds`'s walk (`for (const [name, rule] of
 *     Object.entries(ctx.rules))`) and its `ctx.rules[hiddenBody]` lookup —
 *     both explicitly walk the RAW tree because `resolveRule` (run earlier,
 *     over the SAME raw source) already collapsed the ALIAS nodes this pass
 *     is looking for into plain SYMBOL refs; walking the post-resolve
 *     accumulator would find nothing to mint. The minted body is then run
 *     through `resolveRule` fresh, so the pre-resolve (unresolved) form is
 *     exactly what's wanted.
 *   - `collectTopLevelAliasBodies`'s `rawRules = ctx.rules` walk — same
 *     rationale (finds ALIAS nodes the resolve loop already collapsed); its
 *     sibling `dereferenceTopLevelAliasBody` call correctly takes the
 *     ACCUMULATOR as an explicit `resolvedRules` parameter (not `ctx.rules`)
 *     to follow already-resolved SYMBOL chains.
 * `classifyAndLogHiddenRules` / `classifyHiddenRule` / `classifyHiddenChoiceRule`
 * already take the accumulator as an explicit `rules` parameter (V2 fixed
 * this pre-S3 — kept as-is). `applyOverridePolymorphs` /
 * `deriveStructuralVariantChildren` callers in this file, normalize.ts, and
 * assemble.ts each pass an explicit accumulator/carried-view parameter, never
 * an ambient ctx field. No STOP-worthy wrong-phase value flow found.
 */
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

/**
 * Build a minimal `Grammar<'link'>` (= {@link LinkedGrammar}) from a bare
 * resolved rules map, defaulting every other phase-invariant field to an
 * empty/absent value. For call sites (tests) that only have a rules map in
 * hand — not a full `link()` output — and need a `NormalizeCtx` (S2:
 * `NormalizeCtx` now requires a full `Grammar<'link'>` container, not a bare
 * `rules` field).
 */
export function makeLinkedGrammar(rules: Record<string, Rule<'link'>>): LinkedGrammar {
	return {
		name: '',
		rules,
		supertypes: new Set(),
		externalRoles: new Map(),
		word: null,
		references: [],
		derivations: { inferredFields: [], promotedRules: [], repeatedShapes: [] }
	};
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
		diagnostics: new DiagnosticSink(),
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
		rules[name] = liftSeparators(rules[name]!);
	}

	// Mint visible kinds from enrich content-aliases. enrich wraps an
	// inline-unsafe `optional(seq)` / bare `choice` in
	// `alias(<non-symbol content>, $.<name>)` tagged `metadata.source==='enrich'`.
	// resolveRule (above) already turned the PARENT reference into a clean
	// `symbol(<name>)` ref — but the referenced rule body does not exist yet.
	// Walk the RAW rule bodies (before resolveRule collapsed the alias) and
	// register `<name> = resolveRule(<content>)` so codegen has the IR rule
	// (template / type / slots). The kindId itself is real — tree-sitter emits
	// the alias as a node in parser.c; this pass only supplies the matching IR
	// entry. SYMBOL aliases keep their `aliasedFrom` provenance (untouched).
	// §D-2a DIAGNOSTIC-ONLY content-alias provenance (see LinkedGrammar docs).
	const contentAliasedFrom = new Map<string, string>();
	const contentAliasedTo = new Map<string, string[]>();
	mintContentAliasKinds(rules, linkCtx, contentAliasedFrom, contentAliasedTo);

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
					content: liftSeparators(body)
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
	// above); collectAliasedByParents only walks ALIAS/SYMBOL/structural shapes
	// present in both phases — widen the phase view (post-PR-S cast, see
	// resolveRule's call site above for the same rationale).
	const { parentAliasedKinds, visibleAliasTargets } = collectAliasedByParents(
		raw.rules as Record<string, Rule<'link'>>
	);

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
		visibleAliasTargets: visibleAliasTargets.size > 0 ? visibleAliasTargets : undefined,
		contentAliasedFrom: contentAliasedFrom.size > 0 ? contentAliasedFrom : undefined,
		contentAliasedTo: contentAliasedTo.size > 0 ? contentAliasedTo : undefined
	};
}

// ---------------------------------------------------------------------------
// link() sub-step helpers
// ---------------------------------------------------------------------------

/**
 * Seed the external-roles map from pre-bound override declarations.
 *
 * @param rawExternalRoles - Map populated by `evaluate.ts`'s `grammarFn`
 *   from `role()` calls inside the override file's `externals`/`rules` callbacks.
 * @returns A mutable map used by `resolveRule` during symbol inlining. Falls
 *   back to the legacy structural-detection path in `resolveRule` for grammars
 *   that still declare `_indent: ($) => role('indent')` style dummy rules.
 */
function buildExternalRolesMap(rawExternalRoles: Map<string, ExternalRole> | undefined): Map<string, ExternalRole> {
	return rawExternalRoles ? new Map<string, ExternalRole>(rawExternalRoles) : new Map<string, ExternalRole>();
}

/**
 * Strip role-annotated rules from the resolved rules map.
 *
 * @param rules - Mutable resolved rules map; entries with a whitespace-role
 *   type (`indent`, `dedent`, `newline`) are deleted in place.
 * @remarks
 *   Role-annotated rules (`_indent: ($) => role('indent')`) have done their
 *   job after `resolveRule`: every `$._indent` reference in the rule tree was
 *   inlined to an `indent` node. Strip the top-level entries so Assemble
 *   doesn't try to classify them as real kinds.
 */
function stripResolvedRoleRules(rules: Record<string, Rule<'link'>>): void {
	for (const name of Object.keys(rules)) {
		const r = rules[name]!;
		if (r.type === INDENT || r.type === DEDENT || r.type === NEWLINE) {
			delete rules[name];
		}
	}
}

/**
 * Create synthetic pattern rules for external tokens that have no grammar rule.
 *
 * @param rules - Mutable resolved rules map; missing entries are added in place.
 * @param externals - External token names declared in `grammar.externals`.
 * @remarks
 *   External tokens are declared at the grammar level but have no rule body.
 *   Per design: Link creates empty pattern leaf rules for them so downstream
 *   phases (Assemble, codegen) see them as known leaf kinds.
 */
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
				members: rule.members.map((member) =>
					canonicalizeRuleLiterals(member, kindEntries, false)
				)
			};
		case CHOICE:
			return {
				...rule,
				members: rule.members.map((member) =>
					canonicalizeRuleLiterals(member, kindEntries, allowLiteralRewrite)
				)
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

/**
 * Classify every hidden or grammar-declared-supertype rule and record it in
 * the derivation log.
 *
 * @param rules - Mutable resolved rules map; entries are replaced when
 *   classification succeeds and `ctx.applyPromotedRules` is true.
 * @param ctx - Link phase context. `ctx.inline` lists names from
 *   `grammar.inline`, hidden even without an underscore prefix;
 *   `ctx.supertypes` is the grammar-declared supertype set; `ctx.derivations`
 *   gets promoted classifications appended; `ctx.applyPromotedRules` false
 *   means classifications are logged but the rule map is NOT mutated.
 * @remarks
 *   A kind is "hidden" when its name starts with `_` OR appears in the
 *   grammar's `inline:` array — the latter catches grammars that don't follow
 *   the convention. Tree-sitter's supertype feature marks visible rules whose
 *   CST node never appears — classifying them here prevents the polymorph
 *   promoter from producing bogus variant maps for kinds like ts `primary_type`
 *   that should be a single SupertypeRule<'link'>.
 */
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

/**
 * Flip `inline=false` on every SYMBOL ref whose target kind must MATERIALIZE
 * rather than flatten — implementing the `!supertype && !self-recursive` terms
 * of `inline = hidden && !aliased && !supertype && !self-recursive`.
 *
 * Two non-inline categories (the construction default stamps `inline=true` for
 * any leading-`_` name, which wrongly includes both):
 *
 *  1. SUPERTYPE kinds (grammar-declared OR link-promoted). A supertype is a
 *     transparent dispatch choice: its CST node never materializes inline — it
 *     surfaces via its slot (`_expression`, `_path`,
 *     `_expression_ending_with_block`). Inlining one yields an empty body
 *     (unused-lifetime E0392). Keyed on the classified `type === SUPERTYPE`, so
 *     promoted supertypes (absent from the grammar `supertypes` array) are
 *     included — hence this runs AFTER `classifyAndLogHiddenRules`.
 *
 *  2. SELF-RECURSIVE kinds — a kind whose own body references itself
 *     (`_let_chain = seq(optional($._let_chain), '&&', let_condition)`). The
 *     emit-time inline path has only a one-level `visitingHelpers` cycle guard,
 *     so inlining a self-ref expands one level (duplicating the tail) and drops
 *     the wrapper's multiplicity gate. Materializing instead pushes the
 *     `optional`/`array` down onto the inner slot via `emitSlotReference`
 *     (`{% if let_chain | isPresent %}{{ let_chain }}{% endif %}`), matching the
 *     box-at-back-edge transport. Direct self-reference is detected here; the
 *     box-SCC pass handles the boxing.
 */
function markSupertypeRefsNonInline(rules: Record<string, Rule<'link'>>): void {
	const nonInlineKinds = new Set<string>();
	for (const [name, rule] of Object.entries(rules)) {
		if (rule.type === SUPERTYPE || referencesSelf(rule, name)) nonInlineKinds.add(name);
	}
	if (nonInlineKinds.size === 0) return;
	const walk = (rule: Rule<'link'>): Rule<'link'> => {
		if (rule.type === SYMBOL) {
			return nonInlineKinds.has(rule.name) && rule.inline !== false
				? { ...rule, inline: false }
				: rule;
		}
		const xs = rule as { members?: readonly Rule<'link'>[]; content?: Rule<'link'> };
		if (xs.members) return { ...rule, members: xs.members.map(walk) } as Rule<'link'>;
		if (xs.content) return { ...rule, content: walk(xs.content) } as Rule<'link'>;
		return rule;
	};
	for (const name of Object.keys(rules)) rules[name] = walk(rules[name]!);
}

const selfRefWalker = new RuleWalker<Rule<'link'>>();

/** True when `rule`'s tree contains a SYMBOL ref back to its own kind `self`.
 *  Shallow (no separator-rule descent needed here in practice, but `find`
 *  intentionally does NOT deref symbol refs — a direct self-reference only,
 *  matching the original hand-rolled walk's members/content-only descent). */
function referencesSelf(rule: Rule<'link'>, self: string): boolean {
	return selfRefWalker.find(rule, (r) => r.type === SYMBOL && r.name === self) !== undefined;
}

/**
 * Walk the raw (pre-Link) rule tree and return a map of
 * `hiddenRuleName → aliasTargetName` for every rule whose body is a
 * top-level named alias. Tree-sitter's `alias($.x, $.y)` emits a
 * parse-tree node typed `y` for every match of `x`; without this map
 * Link's alias-collapse would leave downstream passes thinking the
 * hidden rule still produces the original kind.
 */
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
	if (
		rule.type === GROUP ||
		rule.type === VARIANT ||
		rule.type === TOKEN
	) {
		return extractTopLevelAliasTarget((rule as { content: Rule<'link'> }).content);
	}
	return undefined;
}

/**
 * Collect the set of hidden (`_`-prefixed) kind names whose OWN raw rule
 * body is a `choice` where **ALL** members are named aliases.
 *
 * These are pure alias-dispatch choices like `_export_statement_default`
 * where every choice arm is `alias(symbol(_child), $.visible)`. After
 * `resolveRule` collapses named aliases to plain `symbol` refs, such a choice
 * looks identical to a bare-symbol supertype — but every alias target IS a
 * real runtime CST node, not an erased abstraction. Classifying them as
 * `supertype` would make the transport expect transparent subtype dispatch,
 * which fails at decode when the reader sees the concrete kind ID.
 *
 * Mixed choices (some alias + some symbol, like `_match_block`) are
 * intentionally excluded: they may still need supertype treatment for the
 * non-aliased arms. Only pure alias-dispatch choices need the branch override.
 *
 * Used in `classifyHiddenChoiceRule` to block unwanted supertype promotion.
 *
 * @param rawRules - The EVALUATED (pre-link/pre-resolveRule) rules map.
 *   Must be called before `resolveRule` flattens alias nodes to symbols.
 */
function collectHiddenChoicesWithNamedAliasMembers(rawRules: Record<string, Rule<'evaluate'>>): ReadonlySet<string> {
	const out = new Set<string>();
	for (const [name, rule] of Object.entries(rawRules)) {
		if (!name.startsWith('_')) continue;
		// Only pure alias-dispatch choices: every member must be a named alias.
		if (
			rule.type === CHOICE &&
			rule.members.length > 0 &&
			rule.members.every((m) => m.type === ALIAS && m.named)
		) {
			out.add(name);
		}
	}
	return out;
}

/**
 * Single deep-walk over raw rule bodies collecting BOTH facets of
 * `alias(symbol(X), $.target)` usage — derived from ONE traversal so the
 * hidden-aliased set and the visible-alias-target map can never drift:
 *
 * - `parentAliasedKinds`: hidden (`_`-prefixed) source kinds `X`. These produce
 *   REAL runtime CST nodes (tree-sitter exposes them under the alias target,
 *   e.g. `_with_clause_bare` → `with_clause_bare`). Even when normalized to a
 *   `repeat1` body (making `isHiddenRepeatHelper` fire) they must NOT be
 *   classified `multi` — they need their own `branch` type so the Rust transport
 *   matches their concrete kind ID at decode.
 * - `visibleAliasTargets`: `target → [visibleSource, ...]` for VISIBLE→VISIBLE
 *   aliases (e.g. `alias($.delim_token_tree, $.token_tree)`). An aliased instance
 *   surfaces under `target` carrying the SOURCE's body, so the target kind's slot
 *   accept-set must union the source's parse-surface children. Hidden sources are
 *   already handled structurally via the `aliasedFrom` mechanism, so only visible
 *   sources need this union — hence the split.
 *
 * @param rawRules - The EVALUATED (pre-resolveRule) rules map, alias nodes present.
 */
function collectAliasedByParents(rawRules: Record<string, Rule<'link'>>): {
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
	for (const rule of Object.values(rawRules)) walk(rule);
	return { parentAliasedKinds, visibleAliasTargets };
}

/**
 * Mint visible IR kinds from clause-hoist visible-group aliases.
 *
 * `applyClauseHoist`'s `peelOptionalSeq` surfaces an inline-unsafe
 * `optional(seq)` / bare `choice` as a visible CST node by wrapping a SYMBOL
 * ref to its hoisted hidden body in `alias(symbol(_<name>), $.<name>)`.
 * tree-sitter assigns `<name>` a real kindId in `parser.c` (the alias lives
 * in the grammar) — so the kind is a real CST kind. This pass supplies the
 * matching IR rule entry: it registers `rules[<name>] = resolveRule(<hidden
 * body>)` so codegen emits the kind's template, type, and slots.
 *
 * The population is identified STRUCTURALLY (debt PR-0c / doctrine decision
 * 4), not via a provenance tag: `isClauseHoistVisibleGroupAlias` requires
 * (a) the alias's immediate parent is `optional(...)` or a 2-member
 * `CHOICE[x, BLANK]` — the exact shape `peelOptionalSeq` recognizes; (b) the
 * alias VALUE has no independent rule body elsewhere in `rules` — the target
 * name has no rule definition of its own, exactly the fact tree-sitter's own
 * grammar compiler keys on; (c) the alias CONTENT is a symbol ref to a
 * `_`-prefixed hidden rule (not a visible rule being relabeled — an authored
 * relabel like `alias($.identifier, $.statement_identifier)` keeps its
 * `aliasedFrom` provenance via `resolveNamedAliasWithProvenance` and is NOT
 * minted here); (d) that hidden rule is not in the grammar's `inline:` list
 * (an inlined helper is a polymorph-variant-hoist byproduct with no CST node
 * of its own — a different producer). These four conditions select EXACTLY
 * the same population the retired `metadata.source === 'enrich'` tag did,
 * verified across all 3 real grammars. An existing rule of the same name is
 * left byte-unchanged (no clobber).
 *
 * Runs after the `resolveRule` loop (which already turned the PARENT alias
 * reference into a clean `symbol(<name>)` ref) and before
 * `classifyAndLogHiddenRules` / assemble, so the minted kind classifies and
 * assembles via the normal path.
 *
 * @param rawRules - The EVALUATED (pre-resolveRule) rules — alias nodes present.
 * @param rules - The mutable resolved rules map; minted bodies are added here.
 */
function mintContentAliasKinds(
	rules: Record<string, Rule<'link'>>,
	ctx: LinkCtx,
	/**
	 * DIAGNOSTIC-ONLY accumulators (§D-2a). When a visible twin `<name>` is
	 * minted from a hidden symbol body `_<name>`, record `<name> → _<name>` in
	 * `contentAliasedFrom` and the inverse in `contentAliasedTo`. Consumed ONLY
	 * by the §D-2c non-injective fan-in check; nothing in the fold path reads
	 * them. Empty on every grammar today.
	 */
	contentAliasedFrom?: Map<string, string>,
	contentAliasedTo?: Map<string, string[]>
): void {
	function walk(rule: Rule<'link'>, ownerName: string, parentIsOptionalSeq: boolean): void {
		if (rule.type === ALIAS) {
			const value = (rule as { value?: string }).value;
			const content = (rule as { content?: Rule<'link'> }).content;
			// Structural mint condition (debt PR-0c / doctrine decision 4) —
			// replaces the former `metadata.source === 'enrich'` tag read. See
			// `isClauseHoistVisibleGroupAlias`'s doc comment for the full
			// rationale and the probe verifying this selects the identical
			// population across all 3 real grammars.
			if (
				isClauseHoistVisibleGroupAlias(rule as unknown as AliasRule<'link'>, {
					rules: ctx.rules,
					inlineNames: ctx.inline,
					parentIsOptionalSeq
				}) &&
				typeof value === 'string' &&
				value.length > 0 &&
				content
			) {
				if (!(value in rules)) {
					// Resolve THROUGH a symbol-form alias content: the clause-hoist
					// visible group is `alias($._<name>, $.<name>)` whose content is a
					// SYMBOL ref to the hidden `_<name>` rule. Register the kind from
					// the hidden rule's BODY (not the bare symbol ref), so the minted
					// kind carries the group's real slots/template.
					let body: Rule<'link'> = content;
					if (content.type === SYMBOL) {
						const hiddenBody = (content as SymbolRule<'link'>).name;
						// S3 raw-vs-accumulator: RAW view (`ctx.rules` / `ctx.grammar.rules`) —
						// `body` is fed to `resolveRule` fresh below, so the UNRESOLVED
						// hidden body is what's wanted here, not whatever the accumulator's
						// entry (if any) already resolved to.
						const target = ctx.rules[hiddenBody];
						// ctx.rules is Rule<'evaluate'> (RAW view, deliberately —
						// see comment above); `body` is fed to resolveRule fresh
						// below, which itself accepts the evaluate→link transition —
						// widen the phase view (post-PR-S cast).
						if (target) body = target as Rule<'link'>;
						// DIAGNOSTIC-ONLY provenance: visible twin → hidden body kind.
						if (contentAliasedFrom) contentAliasedFrom.set(value, hiddenBody);
						if (contentAliasedTo) {
							const arr = contentAliasedTo.get(hiddenBody);
							if (arr) arr.push(value);
							else contentAliasedTo.set(hiddenBody, [value]);
						}
					}
					// Lift separated-list shapes in the minted body. This site runs
					// AFTER the main per-rule lift loop, so a minted twin whose body
					// is `seq(item, repeat(seq(sep, item)))` would otherwise keep the
					// raw shape and lose the separator/trailing metadata #62 centralizes.
					rules[value] = liftSeparators(
						resolveRule(body, ctx, value)
					);
				}
			}
			if (content) walk(content, ownerName, false);
			return;
		}
		if (rule.type === OPTIONAL && 'content' in rule) {
			const content = (rule as { content?: Rule<'link'> }).content;
			if (content) walk(content, ownerName, true);
			return;
		}
		if (rule.type === CHOICE && 'members' in rule && Array.isArray((rule as ChoiceRule<'link'>).members)) {
			// A 2-member CHOICE[x, BLANK] is the desugared `optional(x)` form —
			// its members' immediate-child alias qualifies exactly like
			// `optional(...)`'s content does.
			const isBlankChoice = isOptionalOrBlankChoice(rule as unknown as AnyRule);
			for (const m of (rule as ChoiceRule<'link'>).members) walk(m, ownerName, isBlankChoice);
			return;
		}
		if ('members' in rule && Array.isArray((rule as ChoiceRule<'link'> | SeqRule<'link'>).members)) {
			for (const m of (rule as ChoiceRule<'link'> | SeqRule<'link'>).members) walk(m, ownerName, false);
		}
		if ('content' in rule && (rule as { content?: Rule<'link'> }).content) {
			walk((rule as { content: Rule<'link'> }).content, ownerName, false);
		}
	}
	// ctx.rules is Rule<'evaluate'> (RAW view); walk only inspects
	// OPTIONAL/CHOICE/SEQ/content shapes present in both phases — widen
	// the phase view (post-PR-S cast).
	for (const [name, rule] of Object.entries(ctx.rules)) walk(rule as Rule<'link'>, name, false);
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
		if (
			complexAliasTargetHidden &&
			content.type === SYMBOL &&
			complexAliasTargetHidden.has(content.name)
		) {
			continue;
		}
		const resolvedContent = resolveRule(content, ctx, name);
		out.set(
			name,
			dereferenceTopLevelAliasBody(resolvedContent, ctx, resolvedRules, new Set())
		);
	}
	return out;
}

function extractTopLevelNamedAliasContent(rule: Rule<'link'>): Rule<'link'> | undefined {
	if (rule.type === ALIAS && rule.named) return rule.content;
	if (
		rule.type === GROUP ||
		rule.type === VARIANT ||
		rule.type === TOKEN
	) {
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

/**
 * Given `alias($.X, $.Y)`'s content (the aliased-from body), extract
 * the source kind-name `X` when the alias was specifically a rename of
 * a named symbol. Returns undefined for alias-of-literal, alias-of-seq,
 * alias-of-choice, and other non-symbol bodies where there's no single
 * source kind to track.
 *
 * Walks through transparent wrappers (variant/group/clause/token/terminal)
 * so patterns like `alias(token($.inner), $.target)` still resolve.
 *
 * @remarks
 *   Hidden symbols (`$._match_block`) are valid alias sources — they still
 *   have concrete shape interfaces emitted from Assemble and are the canonical
 *   type factories/types surface. Tree-sitter emits `_match_block`'s body
 *   structure at the node labeled `block` per `alias($._match_block, $.block)`,
 *   and the drillAs layer rewrites `$type` at wrap time so downstream sees the
 *   source kind.
 *
 *   Supertypes (`alias($.expression, $.as_pattern_target)`) are NOT valid alias
 *   sources: supertypes are abstract unions with no concrete shape of their own.
 *   Tree-sitter uses them to mean "parse anything in the expression grammar at
 *   this slot, label the result `as_pattern_target`". Using the supertype as
 *   canonical would strip the concrete kind the runtime actually produces.
 */
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
	if (
		content.type === VARIANT ||
		content.type === GROUP ||
		content.type === TOKEN
	) {
		return extractAliasedFromName((content as { content: Rule<'link'> }).content, supertypes);
	}
	return undefined;
}

// tagVariants / isStructurallyHomogeneousChoice removed.
// Auto-wrapping heuristics replaced by explicit user-declared
// `variant()` / `polymorphs:` in overrides.ts. See commit
// "013: disable tagAllRulesVariants — auto-tagging masked real
// adoption work" for the rationale.

/**
 * Would a reference to `kindName` be inlined at assemble time?
 *
 * Assemble's `inlineRefs` inlines symbol refs to hidden rules
 * whose body is a `group` (hidden seq-with-fields helper) or a pure
 * `repeat` / `repeat1` (multi helper). Those splice into the parent
 * rule's structure. Everything else — visible kinds, supertypes,
 * enums, terminals, tokens, hidden branches — stays as a symbol
 * reference at parse time and is opaque to the parent's structural
 * shape.
 */
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
// wrapVariants / nameVariant / deduplicateVariants
// ---------------------------------------------------------------------------
//
// Wrap every member of a choice in a `variant` rule, deriving each
// member's name from a distinguishing detect token / symbol / index.
// Structurally identical members are deduplicated (non-lossy: tree-sitter
// would parse them the same way).

export function wrapVariants(choice: Rule<'link'>): Rule<'link'> {
	if (choice.type !== CHOICE) return choice;

	const members = choice.members.map((member, i) => {
		const variantName = nameVariant(member, i, choice.members);
		return {
			type: VARIANT,
			name: variantName,
			content: member
		} satisfies VariantRule<'link'>;
	});

	return { type: CHOICE, members: deduplicateVariants(members) };
}

export function deduplicateVariants(variants: Rule<'link'>[]): Rule<'link'>[] {
	const seen: Rule<'link'>[] = [];
	const result: Rule<'link'>[] = [];

	for (const v of variants) {
		const content = v.type === VARIANT ? v.content : v;
		const isDuplicate = seen.some((s) => rulesEqualForVariant(s, content));
		if (!isDuplicate) {
			seen.push(content);
			result.push(v);
		}
	}

	return result;
}

export function nameVariant(variant: Rule<'link'>, index: number, _all: Rule<'link'>[]): string {
	// Find a distinguishing string literal in this branch.
	const detectToken = findDetectToken(variant);
	if (detectToken) return tokenToName(detectToken);

	// Find a distinguishing symbol name.
	const detectSymbol = findDetectSymbol(variant);
	if (detectSymbol) return detectSymbol;

	return `form_${index}`;
}

function findDetectToken(rule: Rule<'link'>): string | null {
	if (rule.type === STRING) return rule.value;
	if (rule.type === SEQ && rule.members.length > 0) {
		for (const m of rule.members) {
			if (m.type === STRING) return m.value;
		}
	}
	return null;
}

function findDetectSymbol(rule: Rule<'link'>): string | null {
	if (rule.type === SYMBOL) return rule.name;
	if (rule.type === FIELD) return rule.name;
	if (rule.type === SEQ) {
		for (const m of rule.members) {
			const sym = findDetectSymbol(m);
			if (sym) return sym;
		}
	}
	return null;
}

// Structural equality used by deduplicateVariants — must NOT recurse
// into details we don't care about for "are these two variants the
// same shape". We compare member-by-member, normalising variant
// wrappers to their content.
function rulesEqualForVariant(a: Rule<'link'>, b: Rule<'link'>): boolean {
	if (a.type !== b.type) return false;
	// `a.type === b.type` narrows `a` via the switch below, but TS can't
	// propagate that narrowing to `b`. One cast-to-`typeof a` per case
	// gives us discriminated access to `b`'s fields without a raw `any`.
	switch (a.type) {
		case STRING:
		case PATTERN: {
			const bn = b as typeof a;
			return a.value === bn.value;
		}
		case SYMBOL: {
			const bn = b as typeof a;
			return a.name === bn.name;
		}
		case SEQ:
		case CHOICE: {
			const bn = b as typeof a;
			return (
				a.members.length === bn.members.length && a.members.every((m, i) => rulesEqualForVariant(m, bn.members[i]!))
			);
		}
		case OPTIONAL:
		case REPEAT:
		case REPEAT1: {
			const bn = b as typeof a;
			return rulesEqualForVariant(a.content, bn.content);
		}
		case FIELD: {
			const bn = b as typeof a;
			return a.name === bn.name && rulesEqualForVariant(a.content, bn.content);
		}
		case VARIANT: {
			const bn = b as typeof a;
			return rulesEqualForVariant(a.content, bn.content);
		}
		default:
			return false;
	}
}

// ---------------------------------------------------------------------------
// promotePolymorph — wrap heterogeneous-field choices in PolymorphRule
// ---------------------------------------------------------------------------
//
export interface VariantChoiceLocation {
	choice: ChoiceRule<'link'>;
	/** Members of the outer seq that appear before the choice. */
	prefix: Rule<'link'>[];
	/** Members of the outer seq that appear after the choice. */
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
		const suffixes = targetNames
			.map((t) => prefixNamedSuffix(parentKind, t))
			.filter((s): s is string => s !== null);
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
			if (inner.type === SEQ) return inner.members.some((m) => symbolInNames(m) || (m.type === CHOICE && m.members.some(symbolInNames)));
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

/**
 * Emit derivation log entries for each variant child kind of a polymorph parent.
 *
 * @param parentKind - The grammar kind that owns the polymorph.
 * @param children - Short child suffixes from `variant()` declarations; each
 *   produces a visible kind named `${parentKind}_${child}` in the parse tree.
 * @param derivations - Derivation log; one entry per child is appended.
 * @remarks
 *   The `variant()` naming convention produces visible kinds named
 *   `${parentKind}_${child}` (the alias target tree-sitter creates). Emitting
 *   each as a derivation gives `suggested.ts` visibility into what the parse
 *   tree carries vs what sittir's typed surface presents. Without this,
 *   `readNode` would have to infer polymorph-internal shape from
 *   grammar-specific knowledge.
 */
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

/**
 * Push the literals immediately flanking each variant choice INTO each
 * variant child's hidden-rule body. The parent rule is rewritten to drop
 * those literals at the corresponding position, so the render template
 * emitted by the walker collapses from `$PUB($$$CHILDREN)` to
 * `$PUB$$$CHILDREN` — ambient structure now lives inside each variant
 * child's own template.
 *
 * Canonical case: rust's `visibility_modifier` ends up with variant
 * aliases buried in `optional(seq('(', choice(a1, a2, a3, a4), ')'))`.
 * Each `_${parent}_${child}` hidden rule's body is rewritten from
 * `$.<original>` to `seq('(', $.<original>, ')')` so the variant-child
 * template emits its own parens. The `seq('(', CHOICE, ')')` in the
 * parent rule collapses to just `CHOICE` (single-member seq collapses
 * later by simplifyRule).
 *
 * Falls back to a no-op when the rule's variant-choice position is not
 * wrapped in any literal-flanking seq (e.g. the variant aliases are
 * direct members of a top-level choice — nothing to push down).
 *
 * @param rules - The mutable rule map; modified in place for both the
 *   parent rule and each `_${parent}_${child}` hidden rule.
 * @param parentKind - The override-polymorph parent kind name.
 * @param children - Registered variant-child short names for `parentKind`.
 */
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

/**
 * Walk a rule tree looking for a seq whose members include a choice
 * whose every member (unwrapped through variant/alias) is an alias
 * targeting a registered variant-child visible name. When found,
 * extract the surrounding literal string members of that seq, push
 * them into each alias's hidden-rule body, and return the parent seq
 * with those literals stripped. Non-matching subtrees are returned
 * unchanged.
 */
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

/**
 * Is `rule` a choice whose every member (after unwrapping variant
 * wrappers) is a reference to one of the registered variant-child
 * visible names? Link's `resolveRule` collapses `alias($._hidden,
 * $.visible)` into `symbol('visible', aliasedFrom: '_hidden')` before
 * this pass runs — so both raw `alias` rules AND collapsed symbol refs
 * need to count.
 */
function isAllAliasChoice(rule: Rule<'link'>, variantChildVisibleNames: Set<string>): boolean {
	if (rule.type !== CHOICE || rule.members.length === 0) return false;
	return rule.members.every((m) => {
		const core = m.type === VARIANT ? m.content : m;
		if (core.type === ALIAS) return variantChildVisibleNames.has(core.value);
		if (core.type === SYMBOL) return variantChildVisibleNames.has(core.name);
		return false;
	});
}

/**
 * Given a seq containing the variant-alias choice at `choiceIdx`, extract
 * the flanking string-literal members of the seq and push them into each
 * alias's `_${parent}_${child}` hidden-rule body. Return the seq with the
 * literals removed (single-member seq collapses to its inner content).
 */
function applyVariantScaffoldPushDown(seq: SeqRule<'link'>, choiceIdx: number, rules: Record<string, Rule<'link'>>): Rule<'link'> {
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

function setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
	if (a.size !== b.size) return false;
	for (const x of a) if (!b.has(x)) return false;
	return true;
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

/** Char-by-char fallback for arbitrary punctuation (e.g. "\\n", "~@"). */
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

/**
 * A rule is terminal-shaped when its subtree has no fields and no symbol
 * references — hidden or visible. Tree-sitter exposes such a kind as a
 * pure text node at parse time.
 *
 * Skips rules that already have a classification wrapper (enum, supertype,
 * group) — those are structural but Assemble has dedicated classifiers.
 * PR-P Task 2: TERMINAL case removed — TerminalRule deleted from Rule<'link'> union.
 */
export function isTerminalShape(rule: Rule<'link'>): boolean {
	switch (rule.type) {
		// PR-P: ENUM case removed — isEnumChoiceRule guard in CHOICE arm handles this.
		// PR-P Task 2: TERMINAL case removed — TerminalRule deleted from Rule<'link'> union.
		case SUPERTYPE:
		case GROUP:
			return false; // already has a structural classification

		case FIELD:
			return false; // a field means it's a branch

		case SYMBOL:
		case 'supertype' as never:
			return false; // a symbol means it carries children

		case STRING:
		case PATTERN:
		case INDENT:
		case DEDENT:
		case NEWLINE:
			// Bare terminals don't need wrapping — they're already leaf-shaped
			// at the point Assemble inspects them. We only wrap composed
			// terminal structures.
			return false;

		case SEQ:
			return rule.members.every(isTerminalShape_allowBareTerm);
		case CHOICE:
			// PR-P: enum-shaped choices (all-STRING members) are classified as enum,
			// not terminal — guard here to prevent double-wrapping.
			if (isEnumChoiceRule(rule)) return false;
			return rule.members.every(isTerminalShape_allowBareTerm);
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
			return isTerminalShape_allowBareTerm(rule.content);
		case VARIANT:
			return isTerminalShape_allowBareTerm(rule.content);
		case ALIAS:
		case TOKEN:
			// Should be resolved by Link, but handle defensively
			return isTerminalShape_allowBareTerm(rule.content);
	}
	return false;
}

/**
 * Like isTerminalShape but bare terminals (string/pattern/whitespace) count
 * as terminal. Used to recurse into composed structures.
 */
function isTerminalShape_allowBareTerm(rule: Rule<'link'>): boolean {
	switch (rule.type) {
		case STRING:
		case PATTERN:
		case INDENT:
		case DEDENT:
		case NEWLINE:
			return true;
		// PR-P: ENUM case removed — enum-shaped ChoiceRules fall through to CHOICE arm above.
		// All-STRING ChoiceRules are terminal-like but classified as enum, not terminal.
		case FIELD:
			return false;
		case SYMBOL:
			return false;
		case SUPERTYPE:
			return false;
		case GROUP:
			return false;
		case SEQ:
		case CHOICE:
			return rule.members.every(isTerminalShape_allowBareTerm);
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
			return isTerminalShape_allowBareTerm(rule.content);
		case VARIANT:
			return isTerminalShape_allowBareTerm(rule.content);
		case ALIAS:
		case TOKEN:
			return isTerminalShape_allowBareTerm(rule.content);
	}
	return false;
}

// ---------------------------------------------------------------------------
// resolveRule — recursive resolution of all reference types
// ---------------------------------------------------------------------------

function resolveRule(
	rule: Rule<'link'>,
	ctx: LinkCtx,
	currentName: string,
	parentIsOptionalSeq = false
): Rule<'link'> {
	switch (rule.type) {
		case SEQ:
			return {
				...rule,
				members: rule.members.map((m) => resolveRule(m, ctx, currentName))
			};

		case CHOICE: {
			// A 2-member CHOICE[x, BLANK] is the desugared `optional(x)` form —
			// its immediate-child alias qualifies as a clause-hoist mint site
			// exactly like `optional(...)`'s content does. See
			// `isClauseHoistVisibleGroupAlias` / `isOptionalOrBlankChoice`.
			const isBlankChoice = isOptionalOrBlankChoice(rule as unknown as AnyRule);
			return {
				...rule,
				members: rule.members.map((m) => resolveRule(m, ctx, currentName, isBlankChoice))
			};
		}

		case OPTIONAL: {
			const content = resolveRule(rule.content, ctx, currentName, true);
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
			// Clause-hoist visible-group mint site (`alias(symbol(_<name>),
			// $.<name>)`, structurally identified by `isClauseHoistVisibleGroupAlias`
			// — see debt PR-0c / doctrine decision 4): the PARENT must reference
			// the minted kind by a clean SYMBOL ref so codegen emits the visible
			// group via its own AssembledGroup template. `mintContentAliasKinds`
			// registers the body under `<name>`. Fire for BOTH declared (`parens`)
			// and default (`_enum_body_group1`) names — the default name is
			// `_`-prefixed, so we must NOT route it through the generic
			// `!startsWith('_')` branch (which would inline the content instead
			// of referencing the kind).
			if (
				isClauseHoistVisibleGroupAlias(rule as unknown as AliasRule<'link'>, {
					rules: ctx.rules,
					inlineNames: ctx.inline,
					parentIsOptionalSeq
				})
			) {
				// The content is now a SYMBOL ref to the hidden `_<name>` rule
				// (`alias($._<name>, $.<name>)`). The PARENT must reference the
				// minted VISIBLE kind by a clean `symbol(<name>)` ref;
				// `mintContentAliasKinds` registers the body. (Symbol content
				// that does NOT satisfy the structural mint condition is an
				// authored relabel, handled below via `aliasedFrom`.)
				return { type: SYMBOL, name: rule.value, inline: false } as Rule<'link'>;
			}
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

/**
 * Resolve a `repeat1` rule while preserving the `repeat1` type through Link.
 *
 * @param rule - The `repeat1` rule to resolve.
 * @param ctx - Link phase context (`rules`/`supertypes`/`externalRoles`).
 * @param currentName - Name of the rule being resolved (for error context).
 * @returns The resolved repeat1 rule with its content recursively resolved.
 * @remarks
 *   Downstream derivation reads the `repeat1` type to stamp `nonEmpty: true`
 *   on the resulting `AssembledField` / `AssembledChild` so the emitter can
 *   render non-empty tuple types for those slots. Earlier builds collapsed
 *   `repeat1` → `repeat` here unconditionally, which erased the non-empty
 *   signal.
 */
function resolveRepeat1PreservingNonEmpty(rule: Repeat1Rule, ctx: LinkCtx, currentName: string): Rule<'link'> {
	return {
		...rule,
		content: resolveRule(rule.content, ctx, currentName)
	};
}

/**
 * Resolve a named alias to a symbol rule that carries aliased-from provenance.
 *
 * @param content - The body of the alias (typically a symbol referencing the
 *   original kind).
 * @param ctx - Link phase context; `ctx.supertypes` are not valid
 *   aliased-from sources.
 * @param targetName - The alias target kind name (the visible kind produced in
 *   the parse tree).
 * @returns A `SymbolRule<'link'>` for `targetName`, with `aliasedFrom` set when the
 *   body resolves to a concrete non-supertype symbol.
 * @remarks
 *   Preserving alias provenance lets the wrap emitter rewrite `$type` at
 *   drill-in via `drillAs()` for alias-target rewrites.
 */
function resolveNamedAliasWithProvenance(content: Rule<'link'>, ctx: LinkCtx, targetName: string): Rule<'link'> {
	const aliasedFrom = extractAliasedFromName(content, ctx.supertypes);
	const sym: SymbolRule<'link'> = aliasedFrom
		? { type: SYMBOL, name: targetName, aliasedFrom, inline: false }
		: { type: SYMBOL, name: targetName, inline: false };
	return sym as unknown as Rule<'link'>;
}

/**
 * Resolve a symbol rule, inlining it when it references an external role token.
 *
 * @param rule - The symbol rule to resolve.
 * @param ctx - Link phase context; `ctx.rules` is used for legacy structural
 *   detection, `ctx.externalRoles` is the pre-bound external role map (entries
 *   are added when a dummy role rule is detected — legacy path).
 * @returns An inlined role rule (`indent`/`dedent`/`newline`) when the symbol
 *   resolves to an external role; the original symbol rule otherwise.
 * @remarks
 *   Two resolution paths:
 *   - Pre-bound: the override declared the role via `role($._indent, 'indent')`
 *     in `externals`; `raw.externalRoles` seeded the map before `resolveRule`
 *     ran. Inline a role node so template emitters render real newlines/indents.
 *   - Legacy structural: the grammar declares a dummy rule like
 *     `_foo: ($) => role('indent')` whose body is a direct
 *     `indent`/`dedent`/`newline` node. Inline it and record the binding for
 *     downstream consumers.
 *   Visible symbols that don't match either path are returned unchanged.
 */
const ROLE_TO_RULE_TYPE = {
	indent: INDENT,
	dedent: DEDENT,
	newline: NEWLINE,
} as const;
const RULE_TYPE_TO_ROLE = {
	[INDENT]: 'indent',
	[DEDENT]: 'dedent',
	[NEWLINE]: 'newline',
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

/**
 * Result of classifying a hidden (or grammar-declared-supertype) rule.
 *
 * (debt PR-P1, item 3) Replaces the former stamp-then-reread pattern: the
 * classifiers used to stamp a top-level `source` / `metadata.source` tag onto
 * the returned rule, and the caller (`classifyAndLogHiddenRules`) re-read that
 * stamp off the rule to decide whether to log a derivation + mutate the rule
 * map. Per decision 3's corollary, that "stamp then re-inspect the rule"
 * pattern must become direct return-value dataflow: the classifier now
 * returns its classification/classifiedBy ALONGSIDE the rule, and the caller
 * reads ONLY the return value — never re-reads a tag off `rule`.
 */
interface ClassifyResult {
	readonly rule: Rule<'link'>;
	/** Set only when `rule` was newly classified this call (enum or supertype). */
	readonly classification?: 'enum' | 'supertype';
	/**
	 * Whether this classification was declared in the grammar (`'grammar'`,
	 * e.g. present in `grammar.supertypes`) or inferred by this structural
	 * classifier (`'link'`). For the derivation log (diagnostics only) — NOT
	 * an authorship fact (decision 6: `'promoted'` is not an `author` value;
	 * it lives on its own `classifiedBy` axis in `RuleMetadataShape`).
	 */
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

/**
 * Classify a hidden `choice` rule per the spec taxonomy.
 *
 * @param rule - A `ChoiceRule<'link'>` to classify.
 * @param ctx - Link phase context; `ctx.supertypes` are kind names explicitly
 *   declared in `grammar.supertypes`.
 * @param name - The grammar kind name (used to check `ctx.supertypes`).
 * @param rules - The resolved rules map under construction (same map
 *   `classifyAndLogHiddenRules` iterates) — needed to compute `variantArms`
 *   via `isAliasMintedRef`'s independent-body test. See `RuleBase.variantArms`
 *   doc comment (types/rule.ts).
 * @returns A {@link ClassifyResult}: `rule` is an `EnumRule<'link'>`,
 *   `SupertypeRule<'link'>`, or the original rule unchanged; `classification`
 *   / `classifiedBy` are set only when a new classification was made.
 * @remarks
 *   Classification:
 *   - All-string members → `EnumRule<'link'>` (promoted).
 *   - Supertype-compatible members (symbols, named aliases, enums/strings) →
 *     `SupertypeRule<'link'>` when at least one concrete subtype name can be resolved.
 *   - Mixed/structural members → rule unchanged; Assemble classifies by shape.
 *
 *   The old rule ("any hidden choice → supertype, subtypes best-effort")
 *   produced zero-subtype supertypes for hidden choices of structural members
 *   (`_match_block`, `_line_doc_comment_marker`, `_jsx_string`, …). Those are
 *   real alternatives with fields/seqs, not abstract kind unions.
 *
 *   A choice member is "supertype-compatible" when it is: a bare `symbol`
 *   ($.foo), a named `alias(..., $.foo)`, or an `enum`/`string`. Mixed
 *   structural members (seq, field, nested choice/optional/repeat) disqualify.
 */
function classifyHiddenChoiceRule(
	rule: ChoiceRule<'link'>,
	ctx: LinkCtx,
	name: string,
	rules: Record<string, Rule<'link'>>
): ClassifyResult {
	const { supertypes, hiddenChoicesWithNamedAliasMembers } = ctx;
	if (rule.members.every((m): m is StringRule<'link'> => m.type === STRING)) {
		return {
			rule: normalizeEnumMembers(rule.members, { classifiedBy: 'link' }),
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
		const subtypes = collectSubtypeNames(rule, ctx);
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

/**
 * Classify a hidden `seq` rule as a `GroupRule<'link'>` when it contains fields.
 *
 * @param name - The grammar kind name for the group.
 * @param rule - A `SeqRule<'link'>` to classify.
 * @returns A `GroupRule<'link'>` wrapping the seq when fields are present; the original
 *   rule otherwise.
 * @remarks
 *   Uses `hasAnyField` so nested structures (`repeat(field(...))`,
 *   `optional(field(...))`, choice of fields) trigger classification, not just
 *   direct `field(...)` members. Python's `_import_list` is the textbook case:
 *   `seq(repeat1(field('name', ...)), optional(','))` — no direct field member,
 *   but the repeated field inside is exactly what groups capture.
 */
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

/**
 * Extract concrete kind names from a choice for supertype subtypes.
 * Handles bare `symbol` members directly and `alias(_, $.foo)`
 * members by emitting the alias's target name (the synthetic kind
 * tree-sitter produces for aliased nodes). `seq` members are walked
 * for the rare hybrid case where a supertype branch wraps a single
 * symbol in a seq.
 *
 * @param rule - The rule subtree to walk for subtype names.
 * @param ctx - Link phase context; `ctx.wordMatcher` decides whether a bare
 *   string-literal member lexes as a word (keyword) vs punctuation.
 */
function collectSubtypeNames(rule: Rule<'link'>, ctx: LinkCtx): string[] {
	const names: string[] = [];
	const visit = (current: Rule<'link'>): void => {
		switch (current.type) {
			case SYMBOL:
				names.push(current.aliasedFrom ?? current.name);
				return;
			case ALIAS:
				if (!current.named) return;
				if (current.content.type === SYMBOL) {
					names.push(current.content.name);
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
	return names;
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

/**
 * Try to set `separator: '\n'` on the repeat reachable from `rule`.
 * Returns true if a repeat was found and updated. Follows symbol refs
 * (into the referenced rule) and descends through structural wrappers
 * (seq/optional/group/field). `visited` guards against recursive hidden
 * chains so a left-recursive helper doesn't stack-overflow. Idempotent.
 */
function assignRepeatSeparator(rule: Rule<'link'>, rules: Record<string, Rule<'link'>>, visited: Set<string>): boolean {
	if (rule.type === REPEAT || rule.type === REPEAT1) {
		// Fresh block separator: neither trailing nor leading set, matching
		// the prior behavior of leaving those undefined.
		if (!rule.separator)
			(rule as { separator?: { value: Rule<'link'> } }).separator = {
				value: { type: STRING, value: BLOCK_SEPARATOR } as Rule<'link'>,
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

/**
 * Compute the set of hidden grammar kind names that are "block-bearers".
 *
 * @param rules - Full resolved rules map.
 * @returns A set of kind names (all underscore-prefixed) whose rule trees
 *   directly contain or transitively reference an `indent` node through
 *   other hidden rules only.
 * @remarks
 *   A bearer is a hidden rule whose content directly contains an `indent`
 *   node OR transitively references another bearer via symbols that only
 *   pass through hidden rules. Visible intermediate rules break the chain —
 *   e.g. `else_clause` transitively reaches indent through its body, but
 *   it's visible, so consumers of `else_clause` are NOT block-bearers
 *   themselves (the `else_clause` renders flush-left).
 */
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

/**
 * Walk every rule's field content-type unions and flag kind sets
 * that appear in ≥2 distinct parent rules. Each unique set becomes
 * a `RepeatedShapeEntry` that the suggested.ts emitter surfaces as
 * a review candidate — the grammar author can then declare a shared
 * supertype (choice of the kinds) or a group and replace the
 * repeated union with a single reference.
 *
 * Non-mutating: purely additive to `derivations.repeatedShapes`.
 * Doesn't reshape `rules`, so downstream classification is
 * unaffected regardless of include filter.
 *
 * Heuristics:
 *   - Kind sets smaller than 2 are skipped (single-type fields
 *     don't benefit from a supertype).
 *   - Sets that already match an existing supertype's subtypes are
 *     skipped — no value in suggesting what's already declared.
 *   - Shape is tagged `supertype` when every kind in the set is a
 *     named visible rule (candidates for a choice-of-symbols),
 *     `group` otherwise.
 */
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

/**
 * Walk a rule tree and invoke `yield_` for every `field` node's
 * content-type set. Strips supertype references to their subtypes
 * before yielding, matching the way the from emitter classifies
 * resolver kind lists.
 */
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

/**
 * Extract the immediate concrete kind set a rule expression
 * resolves to. Unwraps seq/choice/optional/repeat/variant but
 * stops at field/symbol boundaries.
 */
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

/** Suggest a readable shared name from the kind set. */
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
        // Bail unless the separator is a plain literal — one level deeper
        // than before now that `.separator` is the nested {value, ...} fact.
        const isOptionalSepLit = (r: Rule<'link'> | undefined, sep: { value: Rule<'link'> }): boolean => {
            if (!r || r.type !== OPTIONAL || r.content.type !== STRING) return false;
            if (!isStringType(sep.value.type)) return false;
            return r.content.value === (sep.value as StringRule<'link'>).value;
        };
        if (isSepRepeat && isOptionalSepLit(next, curSep!)) {
            out.push({ ...(cur as RepeatRule | Repeat1Rule), separator: { ...curSep!, trailing: true } });
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
    const repeatNode = members[repeatIdx] as RepeatRule;
    const sep = repeatNode.separator!;
    const elem = repeatNode.content;

    const matchesElem = (r: Rule<'link'>): boolean => rulesEqual(r, elem);
    // Bail unless the separator is a plain literal — one level deeper than
    // before now that `.separator` is the nested {value, ...} fact.
    const matchesOptionalSep = (r: Rule<'link'>): boolean => {
        if (r.type !== OPTIONAL || r.content.type !== STRING) return false;
        if (!isStringType(sep.value.type)) return false;
        return r.content.value === (sep.value as StringRule<'link'>).value;
    };

    // Case 1: [x, repeat(sep, x)]
    if (members.length === 2 && repeatIdx === 1 && matchesElem(members[0]!)) {
        return { type: REPEAT1, content: elem, separator: sep };
    }
    // Case 2: [x, repeat(sep, x), optional(sep)] — trailing allowed.
    if (members.length === 3 && repeatIdx === 1 && matchesElem(members[0]!) && matchesOptionalSep(members[2]!)) {
        return { type: REPEAT1, content: elem, separator: { ...sep, trailing: true } };
    }
    // Case 3: [sep, x, repeat(sep, x)] — leading separator.
    if (members.length === 3 &&
        repeatIdx === 2 &&
        isStringType(sep.value.type) &&
        members[0]!.type === STRING &&
        members[0]!.value === (sep.value as StringRule<'link'>).value &&
        matchesElem(members[1]!)) {
        return { type: REPEAT1, content: elem, separator: { ...sep, leading: true } };
    }
    return null;
}
/**
 * Locate the unique repeat-with-separator member in a seq's member list, or
 * `-1` when there is zero or more than one (not a commaSep shape).
 */
function findRepeatWithSeparator(members: Rule<'link'>[]): number {
    return members.findIndex((m) => m.type === REPEAT && m.separator !== undefined);
}
/**
 * Lift a seq's member list: try the `commaSep1` collapse first, then trailing-
 * separator absorption, else keep the seq unchanged. When the seq survives, the
 * original node is preserved via spread so its `id` / `fieldName` / `metadata`
 * (assigned by the time this runs in link — unlike at evaluate-construction
 * time) are NOT dropped. A `commaSep1` collapse to `repeat1` carries the seq's
 * own modifier attributes onto the replacement, since the repeat takes the
 * seq's structural position.
 */
function liftSeqMembers(seq: SeqRule<'link'>, members: Rule<'link'>[]): Rule<'link'> {
    const lifted = liftCommaSep(members);
    if (lifted) return { ...carrySeqAttrs(seq), ...lifted };
    const absorbed = absorbTrailingSeparator(members);
    return { ...seq, members: absorbed ?? members };
}
/** Pick the position-carried modifier attrs a seq passes to a repeat that
 *  replaces it (id/fieldName/multiplicity/nonterminal/metadata) — NOT `members`. */
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

export function liftSeparators(rule: Rule<'link'>): Rule<'link'> {
    switch (rule.type) {
        case SEQ:
            return liftSeqMembers(rule, rule.members.map(liftSeparators));
        case CHOICE:
            return { ...rule, members: rule.members.map(liftSeparators) };
        case REPEAT:
        case REPEAT1: {
            const content = liftSeparators(rule.content);
            const sep = detectRepeatSeparator(content);
            if (sep) return { ...rule, content: sep.content, separator: { value: sep.separator, trailing: sep.trailing } };
            return { ...rule, content };
        }
        case OPTIONAL:
        case FIELD:
        case TOKEN:
        case ALIAS:
            return { ...rule, content: liftSeparators(rule.content) };
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
 * by `polymorphs:` / `transforms:` in `overrides.ts`.
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
            return (rule as { content: Rule<'link'>; }).content;
        default:
            throw new Error(
                `group path '${fullPath}' does not resolve: cannot descend into rule of type '${rule.type}'`
            );
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

export function validateGroupsConfig(args: ValidateGroupsArgs): void {
    const { groups, polymorphs, rules, warn } = args;
    const emitWarn = warn ?? ((msg: string) => console.warn(`[groups] ${msg}`));

    for (const [kind, lifts] of Object.entries(groups)) {
        if (!lifts) continue;
        const root = rules[kind];
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
                throw new Error(
                    `groups['${kind}']['${path}']: discriminator '${discriminator}' is not a valid identifier`
                );
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
            return hasStructuralMember((rule as { content: Rule<'link'>; }).content);
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
        const sortedPaths = Object.keys(lifts).sort((a, b) => b.length - a.length); // deep first
        let parentBody = clone(newRules[kind]!);

        for (const path of sortedPaths) {
            const discriminator = lifts[path]!;
            const synName = deriveSynthesizedName({
                parentKind: kind, path, discriminator, polymorphs: args.polymorphs
            });
            const target = resolveGroupPath(parentBody, path);
            const { liftedBody, replacement } = liftRule(target, synName, discriminator);

            parentBody = replaceAtPath(parentBody, path, replacement);
            newRules[synName] = liftedBody;
            synthesizedKinds.push(synName);
        }

        newRules[kind] = parentBody;
    }

    return { rules: newRules, synthesizedKinds };
}
function liftRule(target: Rule<'link'>, synName: string, _discriminator: string): { liftedBody: Rule<'link'>; replacement: Rule<'link'>; } {
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
/**
 * `blank()` produces `{ type: 'CHOICE', members: [] }` (see evaluate.ts).
 * Same shape detection used by choice()'s optional-collapse pass.
 */
function isBlankRule(rule: Rule<'link'>): boolean {
    return (
        (rule.type === CHOICE && rule.members.length === 0) ||
        (rule.type === SEQ && rule.members.length === 0)
    );
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
/**
 * Unwrap alias (and token) wrappers to find the inner rule for stamp
 * candidate checking. Does NOT recurse into field/optional/etc — only
 * strips alias/token transparency layers.
 */
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
    /** The field name whose content resolves to the choice, when the
     *  path descent crossed a `field(name, ...)` wrapper. `undefined`
     *  when the choice is at the rule root or inside a non-field
     *  wrapper (refine currently only supports the field-wrapping
     *  case, but we keep this optional so future non-field refinement
     *  sites don't need a schema change). */
    readonly fieldName: string | undefined;
    /** The resolved choice rule — either a `ChoiceRule<'link'>` or an `EnumRule<'link'>`
     *  (the normalized choice-of-strings). Both expose `members`, so
     *  consumers that walk them uniformly work without adapting. */
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
/**
 * Advance one path segment. Handles positional index, wildcard (treated
 * as "the single wrapped content" for wrappers and the first member for
 * containers — refine paths should be deterministic, so wildcard isn't
 * really meaningful here but we accept it for symmetry), kind-match is
 * unsupported for refine paths, and `fieldName` descends through a
 * `field(name, ...)` wrapper.
 */
function stepPath(rule: Rule<'link'>, seg: PathSegment, kind: string, formName: string, pathStr: string): { next: Rule<'link'>; } {
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
/**
 * Unwrap common single-content wrappers (optional, repeat, repeat1) to
 * reach an inner `choice` — or an `enum` (normalized choice-of-strings).
 * Returns `undefined` if the eventual node is neither a choice nor an
 * enum. Wrappers between the start and the terminal choice are
 * structurally transparent for selection purposes.
 *
 * `EnumRule<'link'>` is shape-compatible with `ChoiceRule<'link'>` (both expose
 * `members`) — callers that walk members uniformly can accept the union
 * without further adaptation. The discriminant is still useful
 * information downstream so we surface it here instead of collapsing.
 */
/**
 * Unwrap wrappers to reach a `ChoiceRule<'link'>` or `EnumRule<'link'>`.
 *
 * @param rule - The rule to unwrap.
 * @param rules - Optional rules map for resolving synthesized symbol
 *   references. When `rule` is a `SymbolRule<'link'>` whose name starts with `_`
 *   (a synthesized field-enum hidden rule), the target is looked up in
 *   `rules` and unwrapped. One level of indirection only.
 * @returns The underlying choice or enum, or `undefined` when the rule
 *   does not reduce to one.
 */
function unwrapToChoice(rule: Rule<'link'>, rules?: Readonly<Record<string, Rule<'link'>>>): ChoiceRule<'link'> | EnumRule<'link'> | undefined {
    let cur = rule;
    const visitedSymbols = new Set<string>();
    for (; ;) {
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
/**
 * Walk a rule looking for a direct `field(fieldName, ...)` wrapper.
 * Descends through seq / optional / repeat / repeat1 to find the
 * field. Returns the first match (refine paths target one field per
 * segment; duplicate field names at the same level aren't meaningful).
 */
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
/**
 * Validate one selection value against the target choice.
 *
 * @param kind - Rule<'link'> kind (error-message context).
 * @param formName - Refine form name (error-message context).
 * @param pathStr - Path string (error-message context).
 * @param choice - The resolved choice rule.
 * @param selection - Declared selection: numeric branch index or string
 *   matching one of the choice's string branches.
 */
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
/**
 * Unwrap a choice-arm rule to its string value, if any. Link wraps
 * string literals inside choices in `variant(...)` rules for polymorph
 * classification; this helper transparently descends through one
 * `variant` wrapper to reach the underlying string. Non-string arms
 * return `undefined`.
 */
function unwrapToStringValue(rule: Rule<'link'>): string | undefined {
    if (isString(rule)) return rule.value;
    if (rule.type === VARIANT) {
        const inner = (rule as { content: Rule<'link'>; }).content;
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
): Array<{ fieldName: string; literal: string; }> {
    const out: Array<{ fieldName: string; literal: string; }> = [];
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

export function resolveSelectionLiteral(choice: ChoiceRule<'link'> | EnumRule<'link'>, selection: number | string): string | undefined {
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
