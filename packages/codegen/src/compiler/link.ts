/**
 * compiler/link.ts — Link phase.
 *
 * Resolves what nodes ARE.
 * After Link: no symbol, alias, token. `repeat1` is preserved — see rule.ts header.
 * Terminals (string, pattern) and structural whitespace (indent, dedent, newline) survive.
 * All field nodes enriched with provenance. Clauses detected.
 *
 * Link does NOT restructure the tree — shape identical before and after.
 * Link does NOT process overrides — already applied by Evaluate.
 */

import type {
	Rule,
	SymbolRef,
	FieldRule,
	SupertypeRule,
	EnumRule,
	ClauseRule,
	GroupRule,
	SeqRule,
	ChoiceRule,
	VariantRule,
	PolymorphRule,
	PolymorphForm,
	Repeat1Rule,
	SymbolRule,
	StringRule
} from './rule.ts';
import { isField, isSeq, isChoice, isString, normalizeEnumMembers } from './rule.ts';
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
	InferredFieldEntry,
	RepeatedShapeEntry
} from './types.ts';
import { hasAnyField, hasAnyChild } from './node-map.ts';
import { collectFieldNames } from './rule.ts';
import { isHiddenKind, deriveComplexAliasTargetHidden } from './evaluate.ts';
import type { PolymorphVariant } from './types.ts';
import { validateRefineForms } from './link-refine.ts';
import { applyGroupOverrides, stampStaticRenderAs } from './group-synthesis.ts';
import { polymorphVisibleName } from '../dsl/wire/wire.ts';

// ---------------------------------------------------------------------------
// link() — main entry point
// ---------------------------------------------------------------------------

/**
 * Phase context for the Link phase (spec §7.7).
 *
 * Folds the former positional `include?` + `generatedIdTables?` args into a
 * single ctx object so every pipeline method follows the `(target, ctx)`
 * convention (CW5). Both fields remain optional for backward compatibility with
 * call sites that have not yet been migrated.
 */
export interface LinkCtx {
	readonly include?: IncludeFilter;
	readonly generatedIdTables?: GeneratedIdTables;
}

/** True iff `v` is a `LinkCtx` (discriminated by the presence of `generatedIdTables`). */
function isLinkCtx(v: IncludeFilter | LinkCtx): v is LinkCtx {
	return 'generatedIdTables' in v || 'include' in v;
}

export function link(
	raw: RawGrammar,
	includeOrCtx?: IncludeFilter | LinkCtx,
	generatedIdTables?: GeneratedIdTables
): LinkedGrammar {
	// Accept either the old positional form link(raw, include?, tables?) or
	// the new ctx form link(raw, ctx?). A LinkCtx carries `include` and/or
	// `generatedIdTables`; an IncludeFilter carries `rules` / `fields`.
	let include: IncludeFilter | undefined;
	let resolvedIdTables: GeneratedIdTables | undefined = generatedIdTables;
	if (includeOrCtx !== undefined) {
		if (isLinkCtx(includeOrCtx)) {
			include = includeOrCtx.include;
			resolvedIdTables = includeOrCtx.generatedIdTables ?? generatedIdTables;
		} else {
			include = includeOrCtx;
		}
	}
	const supertypes = new Set(raw.supertypes);
	const externalRoles = buildExternalRolesMap(raw.externalRoles);
	const references = [...raw.references];
	const kindEntries = collectGeneratedKindEntries(resolvedIdTables);

	// Resolve include defaults: undefined means "include everything".
	// Explicit empty arrays mean "include nothing of this category".
	const includeRules = new Set(include?.rules ?? (['promoted'] as const));
	const applyPromotedRules = includeRules.has('promoted');

	// Derivation log — populated unconditionally; each entry records
	// whether the mutation was also applied.
	const derivations: DerivationLog = {
		inferredFields: [],
		promotedRules: [],
		repeatedShapes: []
	};

	// Resolve all rules
	const rules: Record<string, Rule> = {};
	for (const [name, rule] of Object.entries(raw.rules)) {
		rules[name] = resolveRule(rule, name, raw.rules, supertypes, externalRoles);
	}

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
	const renderAs = raw.renderAs ?? {};
	if (Object.keys(renderAs).length > 0) {
		const stamped = stampStaticRenderAs(rules, renderAs);
		for (const key of Object.keys(rules)) {
			if (!(key in stamped)) delete rules[key];
		}
		Object.assign(rules, stamped);
	}

	// Group lift pass — run BEFORE classifyAndLogHiddenRules so path
	// resolution addresses the raw resolved seq/choice bodies before
	// classifyHiddenSeqRule wraps them in GroupRule nodes. Also runs
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
		// Force-classify synthesized kinds as GroupRule so downstream
		// optimize.inlineSingleUseHidden skips them (it preserves 'group'
		// type rules) and assemble sees them as AssembledGroup candidates.
		for (const synthKind of lifted.synthesizedKinds) {
			const body = rules[synthKind];
			if (body && body.type !== 'group') {
				rules[synthKind] = { type: 'group', name: synthKind, content: body } satisfies GroupRule;
			}
		}
	}

	classifyAndLogHiddenRules(rules, raw.inline, supertypes, references, derivations, applyPromotedRules);
	promoteAndLogTerminalRules(rules, derivations, applyPromotedRules);
	runFieldNameInferencePass(rules, references, derivations);

	detectAndLogPolymorphs(rules, derivations);

	// Override-source polymorph classification from variant() metadata.
	if (raw.polymorphVariants?.length) {
		applyOverridePolymorphs(rules, raw.polymorphVariants, derivations);
	}

	hoistIndentIntoRepeat(rules);
	annotateBlockBearerFields(rules);
	collectRepeatedShapes(rules, derivations.repeatedShapes);
	const complexAliasTargetHidden = deriveComplexAliasTargetHidden(raw.rules);
	const topLevelAliasBodies = collectTopLevelAliasBodies(
		raw.rules,
		rules,
		supertypes,
		externalRoles,
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
		references,
		derivations,
		aliasedHiddenKinds,
		topLevelAliasBodies,
		polymorphVariants: raw.polymorphVariants,
		refineForms: raw.refineForms
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
function stripResolvedRoleRules(rules: Record<string, Rule>): void {
	for (const name of Object.keys(rules)) {
		const r = rules[name]!;
		if (r.type === 'indent' || r.type === 'dedent' || r.type === 'newline') {
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
function createSyntheticExternalRules(rules: Record<string, Rule>, externals: readonly string[]): void {
	for (const ext of externals) {
		if (!rules[ext]) {
			rules[ext] = { type: 'pattern', value: '' } as Rule;
		}
	}
}

function canonicalizeCatalogLiteralRefs(
	rules: Record<string, Rule>,
	kindEntries: readonly GeneratedKindEntry[]
): void {
	for (const [name, rule] of Object.entries(rules)) {
		rules[name] = canonicalizeRuleLiterals(rule, kindEntries, false);
	}
}

function canonicalizeCatalogLiteralRefsInMap(
	rules: Map<string, Rule>,
	kindEntries: readonly GeneratedKindEntry[]
): void {
	for (const [name, rule] of rules.entries()) {
		rules.set(name, canonicalizeRuleLiterals(rule, kindEntries, false));
	}
}

function canonicalizeRuleLiterals(
	rule: Rule,
	kindEntries: readonly GeneratedKindEntry[],
	allowLiteralRewrite: boolean
): Rule {
	switch (rule.type) {
		case 'seq':
			return {
				...rule,
				members: rule.members.map((member) =>
					canonicalizeRuleLiterals(member, kindEntries, false)
				)
			};
		case 'choice':
			return {
				...rule,
				members: rule.members.map((member) =>
					canonicalizeRuleLiterals(member, kindEntries, allowLiteralRewrite)
				)
			};
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'variant':
		case 'clause':
		case 'group':
		case 'terminal':
		case 'token':
			return {
				...rule,
				content: canonicalizeRuleLiterals(rule.content, kindEntries, allowLiteralRewrite)
			};
		case 'field':
			return {
				...rule,
				content: canonicalizeRuleLiterals(rule.content, kindEntries, true)
			};
		case 'polymorph':
			return {
				...rule,
				forms: rule.forms.map((form) => ({
					...form,
					content: canonicalizeRuleLiterals(form.content, kindEntries, true)
				}))
			};
		case 'string': {
			if (!allowLiteralRewrite) return rule;
			const entry = findGeneratedKindEntry(kindEntries, rule.value);
			if (!entry) return rule;
			return {
				type: 'symbol',
				name: entry.kind,
				source: 'link',
				literal: rule.value
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
 *   classification succeeds and `applyPromotedRules` is true.
 * @param inline - Names listed in `grammar.inline`; they are hidden even
 *   without an underscore prefix.
 * @param supertypes - Set of kind names explicitly declared in `grammar.supertypes`.
 * @param references - Symbol-reference list used by `classifyHiddenRule`.
 * @param derivations - Derivation log; promoted classifications are appended.
 * @param applyPromotedRules - When false, classifications are logged but the
 *   rule map is NOT mutated.
 * @remarks
 *   A kind is "hidden" when its name starts with `_` OR appears in the
 *   grammar's `inline:` array — the latter catches grammars that don't follow
 *   the convention. Tree-sitter's supertype feature marks visible rules whose
 *   CST node never appears — classifying them here prevents the polymorph
 *   promoter from producing bogus variant maps for kinds like ts `primary_type`
 *   that should be a single SupertypeRule.
 */
function classifyAndLogHiddenRules(
	rules: Record<string, Rule>,
	inline: readonly string[] | undefined,
	supertypes: Set<string>,
	references: SymbolRef[],
	derivations: DerivationLog,
	applyPromotedRules: boolean
): void {
	for (const [name, rule] of Object.entries(rules)) {
		if (isHiddenKind(name, inline) || supertypes.has(name)) {
			const classified = classifyHiddenRule(name, rule, supertypes, references);
			if (
				classified !== rule &&
				(classified.type === 'enum' || classified.type === 'supertype') &&
				(classified.source === 'promoted' || classified.source === 'grammar')
			) {
				derivations.promotedRules.push({
					kind: name,
					classification: classified.type,
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
 * Promote pure-terminal rules to `TerminalRule` and record each in the
 * derivation log.
 *
 * @param rules - Mutable resolved rules map; terminal entries are wrapped in
 *   place when `applyPromotedRules` is true.
 * @param derivations - Derivation log; terminal classifications are appended.
 * @param applyPromotedRules - When false, promotions are logged but the rule
 *   map is NOT mutated.
 * @remarks
 *   A pure-terminal rule has no fields and no symbol references — tree-sitter
 *   exposes such a kind as a plain text node at parse time. Always logged;
 *   applied only when `include.rules` permits `promoted`.
 */
function promoteAndLogTerminalRules(
	rules: Record<string, Rule>,
	derivations: DerivationLog,
	applyPromotedRules: boolean
): void {
	for (const [name, rule] of Object.entries(rules)) {
		if (isTerminalShape(rule)) {
			derivations.promotedRules.push({
				kind: name,
				classification: 'terminal',
				applied: applyPromotedRules
			});
			if (applyPromotedRules) {
				rules[name] = {
					type: 'terminal',
					content: rule,
					source: 'promoted'
				} as Rule;
			}
		}
	}
}

/**
 * Run field-name inference analysis and record findings in the derivation log.
 *
 * @param rules - Resolved rules map; not mutated (analysis only).
 * @param references - Symbol-reference list used to infer consistent field names.
 * @param derivations - Derivation log; inferred-field entries are appended.
 * @remarks
 *   Previously this phase mutated rules by wrapping bare symbol refs as
 *   `field(X, $.Y)` wrappers. Spec 007 moved field coverage to the
 *   override-compiled parser: `transform()` patches in `overrides.ts` +
 *   `enrich()` mechanical passes now carry all field labels natively.
 *   The analysis is preserved for `suggested-overrides.ts` output.
 */
function runFieldNameInferencePass(
	rules: Record<string, Rule>,
	references: SymbolRef[],
	derivations: DerivationLog
): void {
	const inferredFieldNames = inferFieldNames(references);
	for (const [name, rule] of Object.entries(rules)) {
		applyInferredFields(rule, name, inferredFieldNames, false, derivations.inferredFields);
	}
}

/**
 * Run polymorph detection across all rules and record candidates in the
 * derivation log.
 *
 * @param rules - Resolved rules map; not mutated (suggestion-only pass).
 * @param derivations - Derivation log; polymorph candidates are appended.
 * @remarks
 *   Previously mutated rules by wrapping heterogeneous-field choices in
 *   `PolymorphRule`. This is analysis-only for
 *   `suggested-overrides.ts`. For rules where `promotePolymorph` returns a
 *   new rule the derivation is logged as `applied: false` (suggestion). For
 *   others, `findAllPolymorphCandidates` surfaces structurally-distinguishable
 *   choices that a grammar author could promote with an explicit `variant()`
 *   override.
 */
function detectAndLogPolymorphs(rules: Record<string, Rule>, derivations: DerivationLog): void {
	for (const [name, rule] of Object.entries(rules)) {
		const result = promotePolymorph(rule);
		if (result !== rule) {
			derivations.promotedRules.push({
				kind: name,
				classification: 'polymorph',
				applied: false
			});
			continue;
		}
		const allCandidates = findAllPolymorphCandidates(rule);
		if (allCandidates.length > 0) {
			derivations.promotedRules.push({
				kind: name,
				classification: 'polymorph',
				applied: false,
				polymorphCandidates: allCandidates.map((c) => ({
					choiceArmCount: c.choice.members.length,
					armNames: c.choice.members.map((m, i) => (m.type === 'variant' ? m.name : `form${i}`)),
					path: c.path,
					fieldWrapperName: c.fieldWrapperName
				}))
			});
		}
	}
}

/**
 * Walk the raw (pre-Link) rule tree and return a map of
 * `hiddenRuleName → aliasTargetName` for every rule whose body is a
 * top-level named alias. Tree-sitter's `alias($.x, $.y)` emits a
 * parse-tree node typed `y` for every match of `x`; without this map
 * Link's alias-collapse would leave downstream passes thinking the
 * hidden rule still produces the original kind.
 */
function collectAliasedHiddenKinds(rawRules: Record<string, Rule>): Map<string, string> {
	const out = new Map<string, string>();
	for (const [name, rule] of Object.entries(rawRules)) {
		if (!name.startsWith('_')) continue;
		const target = extractTopLevelAliasTarget(rule);
		if (target) out.set(name, target);
	}
	return out;
}

function extractTopLevelAliasTarget(rule: Rule): string | undefined {
	if (rule.type === 'alias' && rule.named) return rule.value;
	if (
		rule.type === 'group' ||
		rule.type === 'variant' ||
		rule.type === 'clause' ||
		rule.type === 'token' ||
		rule.type === 'terminal'
	) {
		return extractTopLevelAliasTarget((rule as { content: Rule }).content);
	}
	return undefined;
}

function collectTopLevelAliasBodies(
	rawRules: Record<string, Rule>,
	resolvedRules: Record<string, Rule>,
	supertypes: Set<string>,
	externalRoles: Map<string, ExternalRole>,
	complexAliasTargetHidden?: ReadonlySet<string>
): Map<string, Rule> {
	const out = new Map<string, Rule>();
	for (const [name, rule] of Object.entries(rawRules)) {
		if (!name.startsWith('_')) continue;
		const content = extractTopLevelNamedAliasContent(rule);
		if (!content) continue;
		// LOAD-BEARING GUARD — NOT a removable band-aid (isolation-test-verified).
		// Never inline a named-alias-target's hidden body into the visible-alias
		// parent. Body-pattern groups produce `alias(SYMBOL(_hidden), $.visible)`
		// where `_hidden` is a complex-body alias-target kind (derived via
		// `deriveComplexAliasTargetHidden`). The alias' content is a symbol ref
		// to the hidden rule (`_type_argument` etc.), but the render template
		// must reference the VISIBLE kind (e.g. `type_argument`) — not inline
		// the hidden rule's body. Skip these entries so `renderRules[name]`
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
			content.type === 'symbol' &&
			complexAliasTargetHidden.has(content.name)
		) {
			continue;
		}
		const resolvedContent = resolveRule(content, name, rawRules, supertypes, externalRoles);
		out.set(
			name,
			dereferenceTopLevelAliasBody(resolvedContent, resolvedRules, supertypes, new Set())
		);
	}
	return out;
}

function extractTopLevelNamedAliasContent(rule: Rule): Rule | undefined {
	if (rule.type === 'alias' && rule.named) return rule.content;
	if (
		rule.type === 'group' ||
		rule.type === 'variant' ||
		rule.type === 'clause' ||
		rule.type === 'token' ||
		rule.type === 'terminal'
	) {
		return extractTopLevelNamedAliasContent((rule as { content: Rule }).content);
	}
	return undefined;
}

function dereferenceTopLevelAliasBody(
	rule: Rule,
	resolvedRules: Record<string, Rule>,
	supertypes: ReadonlySet<string>,
	seen: Set<string>
): Rule {
	if (rule.type !== 'symbol') return rule;
	const refName = rule.aliasedFrom ?? rule.name;
	if (supertypes.has(refName)) return rule;
	if (seen.has(refName)) return rule;
	const target = resolvedRules[refName];
	if (!target) return rule;
	seen.add(refName);
	return dereferenceTopLevelAliasBody(target, resolvedRules, supertypes, seen);
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
function extractAliasedFromName(content: Rule, supertypes: Set<string>): string | undefined {
	if (content.type === 'symbol') {
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
		content.type === 'variant' ||
		content.type === 'group' ||
		content.type === 'clause' ||
		content.type === 'token' ||
		content.type === 'terminal'
	) {
		return extractAliasedFromName((content as { content: Rule }).content, supertypes);
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
function _wouldInlineAtAssemble(kindName: string, rules: Record<string, Rule>): boolean {
	const target = rules[kindName];
	if (!target) return false;
	if (target.type === 'group') return true;
	// Pure repeat/repeat1 (possibly wrapped in optional/variant) = multi.
	const unwrap = (r: Rule): Rule => (r.type === 'optional' || r.type === 'variant' ? unwrap(r.content) : r);
	const bare = unwrap(target);
	return bare.type === 'repeat' || bare.type === 'repeat1';
}

// ---------------------------------------------------------------------------
// wrapVariants / nameVariant / deduplicateVariants
// ---------------------------------------------------------------------------
//
// Wrap every member of a choice in a `variant` rule, deriving each
// member's name from a distinguishing detect token / symbol / index.
// Structurally identical members are deduplicated (non-lossy: tree-sitter
// would parse them the same way).

export function wrapVariants(choice: Rule): Rule {
	if (choice.type !== 'choice') return choice;

	const members = choice.members.map((member, i) => {
		const variantName = nameVariant(member, i, choice.members);
		return {
			type: 'variant' as const,
			name: variantName,
			content: member
		} satisfies VariantRule;
	});

	return { type: 'choice', members: deduplicateVariants(members) };
}

export function deduplicateVariants(variants: Rule[]): Rule[] {
	const seen: Rule[] = [];
	const result: Rule[] = [];

	for (const v of variants) {
		const content = v.type === 'variant' ? v.content : v;
		const isDuplicate = seen.some((s) => rulesEqualForVariant(s, content));
		if (!isDuplicate) {
			seen.push(content);
			result.push(v);
		}
	}

	return result;
}

export function nameVariant(variant: Rule, index: number, _all: Rule[]): string {
	// Find a distinguishing string literal in this branch.
	const detectToken = findDetectToken(variant);
	if (detectToken) return tokenToName(detectToken);

	// Find a distinguishing symbol name.
	const detectSymbol = findDetectSymbol(variant);
	if (detectSymbol) return detectSymbol;

	return `form_${index}`;
}

function findDetectToken(rule: Rule): string | null {
	if (rule.type === 'string') return rule.value;
	if (rule.type === 'seq' && rule.members.length > 0) {
		for (const m of rule.members) {
			if (m.type === 'string') return m.value;
		}
	}
	return null;
}

function findDetectSymbol(rule: Rule): string | null {
	if (rule.type === 'symbol') return rule.name;
	if (rule.type === 'field') return rule.name;
	if (rule.type === 'seq') {
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
function rulesEqualForVariant(a: Rule, b: Rule): boolean {
	if (a.type !== b.type) return false;
	// `a.type === b.type` narrows `a` via the switch below, but TS can't
	// propagate that narrowing to `b`. One cast-to-`typeof a` per case
	// gives us discriminated access to `b`'s fields without a raw `any`.
	switch (a.type) {
		case 'string':
		case 'pattern': {
			const bn = b as typeof a;
			return a.value === bn.value;
		}
		case 'symbol': {
			const bn = b as typeof a;
			return a.name === bn.name;
		}
		case 'seq':
		case 'choice': {
			const bn = b as typeof a;
			return (
				a.members.length === bn.members.length && a.members.every((m, i) => rulesEqualForVariant(m, bn.members[i]!))
			);
		}
		case 'optional':
		case 'repeat':
		case 'repeat1': {
			const bn = b as typeof a;
			return rulesEqualForVariant(a.content, bn.content);
		}
		case 'field': {
			const bn = b as typeof a;
			return a.name === bn.name && rulesEqualForVariant(a.content, bn.content);
		}
		case 'variant': {
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
// Walks the top level of a rule looking for a choice-of-variants. Promotes
// to PolymorphRule only when:
//
//   - Every variant has at least one field or symbol reference (a pure
//     terminal variant means the kind is a branch with anonymous text
//     content — polymorph forms have no way to render raw text).
//   - Field sets across variants are heterogeneous (otherwise it's a
//     plain branch where all variants share the same shape).
//
// "Top level" means: the outermost choice reachable through anonymous
// delimiter seq wrappers (e.g. `seq('(', choice, ')')`).

export function promotePolymorph(rule: Rule): Rule {
	const found = findVariantChoice(rule);
	if (!found) return rule;
	const { choice, prefix, suffix } = found;

	const contents = choice.members.map((m) => (m.type === 'variant' ? m.content : m));
	if (!allVariantContentsAreDistinguishable(contents)) return rule;
	if (variantFieldSetsAreHomogeneous(contents)) return rule;
	return buildPolymorphFromFusedForms(choice, prefix, suffix);
}

/**
 * Return true when every variant content rule is parse-tree distinguishable.
 *
 * @param contents - Unwrapped contents of each choice member (variant wrappers
 *   already stripped).
 * @returns `true` when every content can be told apart at parse time; `false`
 *   when at least one arm is indistinguishable, which disqualifies polymorph
 *   promotion.
 * @remarks
 *   A branch is distinguishable when any of:
 *   - it carries inner fields,
 *   - it has named children,
 *   - it references a named grammar kind (bare visible symbol or supertype) —
 *     tree-sitter surfaces those as a distinct `$type`, so the parse tree alone
 *     identifies the variant.
 *   Previously the check only allowed (1) + (2), which mistakenly rejected
 *   `choice($.wildcard_import, $._import_list, seq('(', ...))` and similar —
 *   a named-symbol branch is legitimate polymorph content.
 */
function allVariantContentsAreDistinguishable(contents: Rule[]): boolean {
	const isDistinguishable = (c: Rule): boolean =>
		hasAnyField(c) || hasAnyChild(c) || (c.type === 'symbol' && !c.hidden) || c.type === 'supertype';
	return contents.every(isDistinguishable);
}

/**
 * Return true when the field sets across all variant contents are identical.
 *
 * @param contents - Unwrapped contents of each choice member.
 * @returns `true` when all variants share the same field-name set, meaning
 *   polymorph promotion is unnecessary (homogeneous variants stay as a regular
 *   branch). Returns `false` when at least one variant differs, qualifying the
 *   choice for polymorph promotion.
 */
function variantFieldSetsAreHomogeneous(contents: Rule[]): boolean {
	const fieldSets = contents.map((c) => collectFieldNames(c));
	return fieldSets.every((s) => setsEqual(s, fieldSets[0]!));
}

/**
 * Build a `PolymorphRule` from the choice members, fusing prefix/suffix seq
 * members into each form's content.
 *
 * @param choice - The variant-wrapped choice rule to promote.
 * @param prefix - Seq members from the enclosing seq that precede the choice.
 * @param suffix - Seq members from the enclosing seq that follow the choice.
 * @returns A new `PolymorphRule` with `source: 'promoted'` whose forms each
 *   include the fused prefix and suffix so every form renders a complete shape.
 * @remarks
 *   Without fusion, python's `assignment` polymorph would drop `$LEFT` from
 *   all three variants because the `field('left', ...)` member sits before the
 *   choice in the enclosing seq and would otherwise be omitted from each form.
 */
function buildPolymorphFromFusedForms(choice: ChoiceRule, prefix: Rule[], suffix: Rule[]): PolymorphRule {
	const fuse = (inner: Rule): Rule => {
		if (prefix.length === 0 && suffix.length === 0) return inner;
		const members = [...prefix, inner, ...suffix];
		return { type: 'seq', members };
	};
	const forms: PolymorphRule['forms'] = choice.members.map((m, i) => ({
		name: m.type === 'variant' ? m.name : `form_${i}`,
		content: fuse(m.type === 'variant' ? m.content : m)
	}));
	return { type: 'polymorph', forms, source: 'promoted' };
}

export interface VariantChoiceLocation {
	choice: ChoiceRule;
	/** Members of the outer seq that appear before the choice. */
	prefix: Rule[];
	/** Members of the outer seq that appear after the choice. */
	suffix: Rule[];
}

// ---------------------------------------------------------------------------
// applyOverridePolymorphs — variant() metadata → PolymorphRule(source:'override')
// ---------------------------------------------------------------------------
//
// variant() in transform patches registers (parent, child) entries during
// evaluate. Here we look up the parent rule, find the choice with
// alias-symbol members matching `${parentKind}_${child}`, and wrap as
// PolymorphRule with `source: 'override'`.
//
// Form names use the SHORT child suffix from variant() — not the
// tagVariants-derived names — so generated factories/types align with
// what the user wrote. Mutates `rules` in place; logs to derivations.

export function applyOverridePolymorphs(
	rules: Record<string, Rule>,
	variants: PolymorphVariant[],
	derivations: DerivationLog
): void {
	const parentToChildren = new Map<string, string[]>();
	for (const pv of variants) {
		const existing = parentToChildren.get(pv.parent) ?? [];
		existing.push(pv.child);
		parentToChildren.set(pv.parent, existing);
	}

	for (const [parentKind, children] of parentToChildren) {
		const rule = rules[parentKind];
		if (!rule || rule.type === 'polymorph') continue;

		const found = findVariantChoice(rule);
		if (!found) continue;

		// Deep choice: push ambient scaffold into variant children instead.
		emitVariantChildDerivations(parentKind, children, derivations);

		const variantChildSymbolNames = new Set(children.map((c) => polymorphVisibleName(parentKind, c)));
		// Check whether any variant-child symbol appears in the found choice — either
		// as a direct member or nested inside choice/seq arms at any shallow depth,
		// matching the depth that the form builder (buildOverridePolymorphForms /
		// findVariantSymbolInSeqArm) already handles.
		const symbolInNames = (r: Rule): boolean => {
			const inner = r.type === 'variant' ? r.content : r;
			return inner.type === 'symbol' && variantChildSymbolNames.has(inner.name);
		};
		const symbolInRule = (r: Rule): boolean => {
			if (symbolInNames(r)) return true;
			const inner = r.type === 'variant' ? r.content : r;
			if (inner.type === 'choice') return inner.members.some(symbolInNames);
			if (inner.type === 'seq') return inner.members.some((m) => symbolInNames(m) || (m.type === 'choice' && m.members.some(symbolInNames)));
			return false;
		};
		const anyChildMemberInFoundChoice = found.choice.members.some(symbolInRule);
		if (!anyChildMemberInFoundChoice) {
			pushAmbientScaffoldIntoVariantChildren(rules, parentKind, children);
			continue;
		}

		const forms = buildOverridePolymorphForms(parentKind, children, found, rules);

		rules[parentKind] = {
			type: 'polymorph',
			forms,
			source: 'override'
		} satisfies PolymorphRule;

		derivations.promotedRules.push({
			kind: parentKind,
			classification: 'polymorph',
			applied: true
		});
	}
}

function buildOverridePolymorphForms(
	parentKind: string,
	children: readonly string[],
	found: VariantChoiceLocation,
	rules: Record<string, Rule>
): PolymorphForm[] {
	const variantChildSymbolNames = new Set(children.map((child) => polymorphVisibleName(parentKind, child)));
	const explicitVariantForms = new Map<string, PolymorphForm>();
	for (const child of children) {
		const visibleChildKind = polymorphVisibleName(parentKind, child);
		const directMember = found.choice.members.find((member) => matchesOverrideChoiceMember(member, visibleChildKind));
		const content =
			directMember?.type === 'variant'
				? directMember.content
				: (directMember ??
					findVariantSymbolInSeqArm(found.choice, visibleChildKind, rules) ??
					resolveVisibleSymbolRule(visibleChildKind, rules));
		explicitVariantForms.set(visibleChildKind, {
			name: child,
			content: fuseOverridePolymorphFormContent(found.prefix, content, found.suffix),
			visibleChildKind,
			discriminatorKinds: [visibleChildKind]
		});
	}

	const orderedForms: PolymorphForm[] = [];
	const seenExplicit = new Set<string>();
	for (const member of found.choice.members) {
		const visibleChildKind = findMatchingOverrideVariantKind(member, variantChildSymbolNames);
		if (visibleChildKind) {
			const form = explicitVariantForms.get(visibleChildKind);
			if (form && !seenExplicit.has(visibleChildKind)) {
				orderedForms.push(form);
				seenExplicit.add(visibleChildKind);
			}
			continue;
		}
		const discriminatorKind = extractOverridePassthroughKind(member, variantChildSymbolNames);
		if (!discriminatorKind) continue;
		orderedForms.push({
			name: visibleOverrideFormName(discriminatorKind),
			content: fuseOverridePolymorphFormContent(
				found.prefix,
				resolveVisibleSymbolRule(discriminatorKind, rules),
				found.suffix
			),
			discriminatorKinds: [discriminatorKind]
		});
	}

	for (const child of children) {
		const visibleChildKind = polymorphVisibleName(parentKind, child);
		const form = explicitVariantForms.get(visibleChildKind);
		if (form && !seenExplicit.has(visibleChildKind)) orderedForms.push(form);
	}
	return orderedForms;
}

function resolveVisibleSymbolRule(name: string, rules: Record<string, Rule>): SymbolRule {
	const hiddenAlias = `_${name}`;
	return rules[hiddenAlias]
		? { type: 'symbol', name, aliasedFrom: hiddenAlias }
		: { type: 'symbol', name };
}

function fuseOverridePolymorphFormContent(prefix: readonly Rule[], content: Rule, suffix: readonly Rule[]): Rule {
	if (prefix.length === 0 && suffix.length === 0) return content;
	return {
		type: 'seq',
		members: [...prefix, content, ...suffix]
	};
}

function matchesOverrideChoiceMember(member: Rule, targetSymbolName: string): boolean {
	const core = member.type === 'variant' ? member.content : member;
	if (core.type === 'symbol') return core.name === targetSymbolName;
	return false;
}

function findMatchingOverrideVariantKind(
	member: Rule,
	variantChildSymbolNames: ReadonlySet<string>
): string | undefined {
	const core = member.type === 'variant' ? member.content : member;
	if (core.type === 'symbol') {
		return variantChildSymbolNames.has(core.name) ? core.name : undefined;
	}
	if (core.type !== 'seq') return undefined;
	for (const inner of core.members) {
		const nested = inner.type === 'variant' ? inner.content : inner;
		if (nested.type === 'symbol' && variantChildSymbolNames.has(nested.name)) return nested.name;
	}
	return undefined;
}

function extractOverridePassthroughKind(
	member: Rule,
	variantChildSymbolNames: ReadonlySet<string>
): string | undefined {
	const core = member.type === 'variant' ? member.content : member;
	if (core.type !== 'symbol') return undefined;
	return variantChildSymbolNames.has(core.name) ? undefined : core.name;
}

function visibleOverrideFormName(kind: string): string {
	return kind.startsWith('_') ? kind.slice(1) : kind;
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
	rules: Record<string, Rule>,
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
	rule: Rule,
	rules: Record<string, Rule>,
	variantChildVisibleNames: Set<string>
): Rule {
	switch (rule.type) {
		case 'seq': {
			// Does this seq directly contain the alias-choice?
			const choiceIdx = rule.members.findIndex((m) => isAllAliasChoice(m, variantChildVisibleNames));
			if (choiceIdx !== -1) {
				return applyVariantScaffoldPushDown(rule, choiceIdx, rules);
			}
			const members = rule.members.map((m) => rewriteSeqWithVariantAliasChoice(m, rules, variantChildVisibleNames));
			return { type: 'seq', members };
		}
		case 'choice': {
			const members = rule.members.map((m) => rewriteSeqWithVariantAliasChoice(m, rules, variantChildVisibleNames));
			return { type: 'choice', members };
		}
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'variant':
		case 'clause':
		case 'group':
		case 'field':
		case 'token':
		case 'terminal': {
			const content = rewriteSeqWithVariantAliasChoice(
				(rule as { content: Rule }).content,
				rules,
				variantChildVisibleNames
			);
			return { ...(rule as object), content } as Rule;
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
function isAllAliasChoice(rule: Rule, variantChildVisibleNames: Set<string>): boolean {
	if (rule.type !== 'choice' || rule.members.length === 0) return false;
	return rule.members.every((m) => {
		const core = m.type === 'variant' ? m.content : m;
		if (core.type === 'alias') return variantChildVisibleNames.has(core.value);
		if (core.type === 'symbol') return variantChildVisibleNames.has(core.name);
		return false;
	});
}

/**
 * Given a seq containing the variant-alias choice at `choiceIdx`, extract
 * the flanking string-literal members of the seq and push them into each
 * alias's `_${parent}_${child}` hidden-rule body. Return the seq with the
 * literals removed (single-member seq collapses to its inner content).
 */
function applyVariantScaffoldPushDown(seq: SeqRule, choiceIdx: number, rules: Record<string, Rule>): Rule {
	const prefix = seq.members.slice(0, choiceIdx).filter((m) => m.type === 'string') as StringRule[];
	const suffix = seq.members.slice(choiceIdx + 1).filter((m) => m.type === 'string') as StringRule[];
	if (prefix.length === 0 && suffix.length === 0) return seq; // nothing to push
	const choice = seq.members[choiceIdx] as ChoiceRule;
	for (const member of choice.members) {
		const core = member.type === 'variant' ? member.content : member;
		let visibleName: string | null = null;
		if (core.type === 'alias') {
			visibleName = core.value;
		} else if (core.type === 'symbol') {
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
		const wrapped: Rule = {
			type: 'seq',
			members: [...prefix, body, ...suffix]
		};
		if (hiddenName in rules) rules[hiddenName] = wrapped;
		if (visibleName in rules) rules[visibleName] = wrapped;
	}
	// Strip the literals we just pushed down, keep everything else (the
	// choice itself plus any non-string members).
	const remaining = seq.members.filter((m, i) => i === choiceIdx || m.type !== 'string');
	if (remaining.length === 1) return remaining[0]!;
	return { type: 'seq', members: remaining };
}

export function findVariantChoice(rule: Rule): VariantChoiceLocation | null {
	// Matches bare choices (post-spec-013) and seq-wrapped choices.
	if (isChoice(rule)) {
		return { choice: rule, prefix: [], suffix: [] };
	}
	if (rule.type === 'seq') {
		const choiceIdx = rule.members.findIndex((m) => m.type === 'choice');
		if (choiceIdx !== -1) {
			// More than one choice in the seq is ambiguous — bail.
			const more = rule.members.findIndex((m, i) => i !== choiceIdx && m.type === 'choice');
			if (more !== -1) return null;
			return {
				choice: rule.members[choiceIdx] as ChoiceRule,
				prefix: rule.members.slice(0, choiceIdx),
				suffix: rule.members.slice(choiceIdx + 1)
			};
		}

		// No direct choice — check if exactly one member is a seq that contains
		// exactly one choice (the variant choice nested in an inner seq, e.g. function_type).
		// Guard: there must be zero choices at the outer level AND exactly one in the
		// inner seq; if more than one choice total, bail (ambiguous).
		const innerSeqIdx = rule.members.findIndex(
			(m) => m.type === 'seq' && (m as SeqRule).members.some((mm) => mm.type === 'choice')
		);
		if (innerSeqIdx === -1) return null;
		// Make sure there is no other member that is also a seq with a choice in it,
		// and no choices at all elsewhere in the outer seq.
		const outerChoiceCount = rule.members.filter((m) => m.type === 'choice').length;
		if (outerChoiceCount > 0) return null; // would have been caught above, defensive
		const innerSeq = rule.members[innerSeqIdx] as SeqRule;
		const innerChoiceIdx = innerSeq.members.findIndex((m) => m.type === 'choice');
		if (innerChoiceIdx === -1) return null;
		// Ensure there is only ONE choice total across outer + inner levels.
		const innerChoiceCount = innerSeq.members.filter((m) => m.type === 'choice').length;
		const otherSeqChoiceCount = rule.members
			.filter((m, i) => i !== innerSeqIdx && m.type === 'seq')
			.reduce((acc, m) => acc + (m as SeqRule).members.filter((mm) => mm.type === 'choice').length, 0);
		if (innerChoiceCount !== 1 || otherSeqChoiceCount > 0) return null;
		// Merge outer prefix/suffix with the inner seq's non-choice members.
		const outerPrefix = rule.members.slice(0, innerSeqIdx);
		const outerSuffix = rule.members.slice(innerSeqIdx + 1);
		const innerPrefix = innerSeq.members.slice(0, innerChoiceIdx);
		const innerSuffix = innerSeq.members.slice(innerChoiceIdx + 1);
		return {
			choice: innerSeq.members[innerChoiceIdx] as ChoiceRule,
			prefix: [...outerPrefix, ...innerPrefix],
			suffix: [...innerSuffix, ...outerSuffix]
		};
	}
	return null;
}

/**
 * Search `choice.members` for a SEQ arm that contains a reference to
 * `targetSymbolName` (either as a direct symbol member or inside an inner
 * choice). When found, return a copy of the SEQ with the inner alias/symbol
 * replaced by the resolved symbol `symbol(targetSymbolName, aliasedFrom)`,
 * so the outer SEQ's non-symbol members (e.g. `field('left', ...)`) travel
 * with the form content.
 *
 * Canonical case: `range_pattern` outer choice arm 0 is
 * `seq(field('left', ...), choice(alias(left_with_right), alias(left_bare)))`.
 * For `left_with_right`, this function returns
 * `seq(field('left', ...), symbol('range_pattern_left_with_right'))` so the
 * rendered template includes the left operand.
 *
 * Returns `null` when no SEQ arm contains the target.
 */
function findVariantSymbolInSeqArm(
	choice: ChoiceRule,
	targetSymbolName: string,
	rules: Record<string, Rule>
): Rule | null {
	for (const arm of choice.members) {
		if (arm.type !== 'seq') continue;
		// Does this SEQ arm contain the target? Check direct and inner-choice positions.
		const foundIdx = arm.members.findIndex((m) => {
			if (m.type === 'symbol') return m.name === targetSymbolName;
			if (m.type === 'alias') return m.value === targetSymbolName;
			if (m.type === 'choice') {
				return m.members.some((mm) => {
					const core = mm.type === 'variant' ? mm.content : mm;
					if (core.type === 'symbol') return core.name === targetSymbolName;
					if (core.type === 'alias') return core.value === targetSymbolName;
					return false;
				});
			}
			return false;
		});
		if (foundIdx === -1) continue;
		// Build the resolved symbol for `targetSymbolName`.
		const hiddenAlias = `_${targetSymbolName}`;
		const resolvedSymbol: SymbolRule = rules[hiddenAlias]
			? { type: 'symbol', name: targetSymbolName, aliasedFrom: hiddenAlias }
			: { type: 'symbol', name: targetSymbolName };
		// Reconstruct the SEQ with the matched position replaced by the resolved symbol.
		const newMembers: Rule[] = arm.members.map((m, i) => (i === foundIdx ? resolvedSymbol : m));
		return newMembers.length === 1 ? newMembers[0]! : { type: 'seq', members: newMembers };
	}
	return null;
}

/**
 * Find a polymorph-candidate choice in a rule that does NOT already have
 * `variant()` markers. Used to suggest NEW polymorphs where a grammar
 * author could reasonably apply `variant()` to each arm. The candidate is
 * strictly more permissive than `findVariantChoice` — it sees raw choices
 * inside field wrappers too, because `field(X, choice(A, B, C))` with
 * structurally-distinct branches is the textbook miss-case (e.g. python's
 * `import_from_statement`).
 *
 * The returned `prefix` / `suffix` capture members from the enclosing seq
 * that should travel with each form; the `fieldWrapper` (if set) is the
 * outer `field(...)` node the choice is nested in — callers that rewrite
 * the rule need to know to strip or repurpose that wrapper.
 */
export interface PolymorphCandidateLocation {
	choice: ChoiceRule;
	prefix: Rule[];
	suffix: Rule[];
	/** When the choice is wrapped in `field(name, choice(...))`, the outer field name. */
	fieldWrapperName?: string;
	/** Path from the rule root to the choice, expressed as seq-member indices. */
	path: string;
}

/**
 * Does a bare choice look like a polymorph candidate? Criteria:
 *   - at least 2 branches,
 *   - every branch is structurally distinguishable at parse time
 *     (has inner fields/children, OR references a named kind),
 *   - branches' field sets differ (otherwise it's a homogeneous choice
 *     that doesn't benefit from polymorph dispatch).
 *
 * Shared with `promotePolymorph` — same core predicate, different scope.
 */
function looksLikePolymorphCandidate(choice: ChoiceRule): boolean {
	if (choice.members.length < 2) return false;
	const contents = choice.members.map((m) => (m.type === 'variant' ? m.content : m));
	// A branch is "distinguishable" when tree-sitter produces enough
	// information to tell it apart from its siblings at parse time:
	//   - inner fields or named children → explicit structural distinction
	//   - named (visible) symbol reference → distinct `$type` in parse tree
	//   - hidden symbol reference → expands in place, usually carrying
	//     its own fields/children that surface on the parent
	//   - supertype → dispatch-by-inner-kind
	//   - seq wrapping any of the above → same distinction via descent
	const isDistinguishable = (c: Rule): boolean => {
		if (hasAnyField(c) || hasAnyChild(c)) return true;
		if (c.type === 'symbol' || c.type === 'supertype') return true;
		// Bare literals (string/pattern) ARE distinguishable as arms —
		// they differ from structural siblings by text content. They
		// can't carry \$type until variant() hoists them, but that's
		// exactly what the polymorph-promotion path is for. Previously
		// rejecting these kept rust impl_item's `choice(field('body',
		// decl_list), ';')` from being flagged as a polymorph at all.
		if (c.type === 'string' || c.type === 'pattern') return true;
		if (c.type === 'seq') return c.members.some(isDistinguishable);
		if (c.type === 'optional' || c.type === 'group' || c.type === 'variant' || c.type === 'clause')
			return isDistinguishable(c.content);
		if (c.type === 'repeat' || c.type === 'repeat1') return isDistinguishable(c.content);
		return false;
	};
	if (contents.some((c) => !isDistinguishable(c))) return false;

	// Signature each branch — either its field set OR its top-level
	// content-kind shape. Two bare-symbol branches with the SAME symbol
	// name are indistinguishable (redundant choice). Two bare-symbol
	// branches with DIFFERENT symbol names are a legitimate polymorph.
	// Field sets alone can't tell them apart because symbols expose zero
	// fields without cross-rule lookup.
	const signature = (c: Rule): string => {
		const fs = [...collectFieldNames(c)].sort().join(',');
		if (fs) return `fields:${fs}`;
		if (c.type === 'symbol' || c.type === 'supertype') return `sym:${c.name}`;
		if (c.type === 'seq') return `seq:${c.members.map(signature).join('|')}`;
		return `shape:${c.type}`;
	};
	const signatures = contents.map(signature);
	const allSame = signatures.every((s) => s === signatures[0]);
	return !allSame;
}

/**
 * Does this choice actually need `variant()` wrapping to make rendering
 * discriminate between arms?
 *
 * Rendering dispatches on `$type` at every NodeData boundary. Any arm
 * that resolves to a named parse-tree node — visible symbol, supertype,
 * or hidden symbol (hidden rules either (a) alias to a visible kind so
 * the $type surfaces, or (b) expand in place, in which case their own
 * expansion's $types handle the dispatch) — is already discriminable.
 * variant() on these arms produces synthetic `_parent_arm` rules that
 * carry no render benefit.
 *
 * Arms that NEED variant() are the ones whose content is NOT a named
 * rule: anonymous seq/choice/repeat, bare literals, patterns. These
 * produce anonymous tokens in the parse tree; rendering can't dispatch
 * on arm identity without hoisting them into their own aliased kinds.
 *
 * A choice needs variant() treatment iff AT LEAST ONE of its arms is
 * anonymous — `tagVariants` wraps the whole choice uniformly, and the
 * suggester mirrors that (all arms become variant() calls or none do).
 * Choices where every arm is a symbol reference are skipped entirely.
 */
function choiceNeedsVariantWrapping(choice: ChoiceRule): boolean {
	const armNeedsVariant = (c: Rule): boolean => {
		// Any symbol reference — render dispatches on the resolved
		// NodeData's $type, not on which arm produced it. Hidden symbols
		// that alias to a visible kind surface as that kind; hidden
		// symbols that inline become their inner content's tokens
		// (which would need variant ONLY if the inner content is itself
		// anonymous — handled when Assemble classifies the hidden rule
		// as a group and inlineRefs expands it).
		if (c.type === 'symbol' || c.type === 'supertype') return false;
		// Transparent wrappers — look inside. `field(name, content)` is
		// included: if content is a symbol/supertype, render dispatches
		// on the resolved $type just as for a bare symbol arm, so the
		// field wrapper doesn't force variant() treatment.
		if (
			c.type === 'field' ||
			c.type === 'variant' ||
			c.type === 'group' ||
			c.type === 'clause' ||
			c.type === 'optional'
		) {
			return armNeedsVariant(c.content);
		}
		// Nested choice as an arm (e.g. `field('trait', choice(sym1,
		// sym2))`) — the outer arm only needs variant() if at least one
		// inner member does. All-symbol inner choices dispatch by $type
		// just like bare symbol arms; no variant needed.
		if (c.type === 'choice') {
			return c.members.some(armNeedsVariant);
		}
		// Anonymous content — seqs, repeats, literals, patterns, nested
		// choices. These have no $type to dispatch on. variant() is the
		// only way to give rendering a stable handle for the arm.
		return true;
	};
	const contents = choice.members.map((m) => (m.type === 'variant' ? m.content : m));
	return contents.some(armNeedsVariant);
}

/**
 * Find every polymorph candidate in a rule. A single rule can have
 * multiple qualifying choices — e.g. python's `import_from_statement`
 * has `module_name` (relative vs dotted) AND `wildcard_import` (wildcard
 * vs list vs paren). The suggester emits one `variant()` snippet per
 * candidate; the grammar author picks which ones to promote.
 *
 * Descends through:
 *   - Nested `seq` — common after prec wrappers get stripped by
 *     `evaluate.normalize`. Rust `function_type` is the textbook case:
 *     the author writes `prec(PREC.call, seq(choice(...), field('parameters',
 *     ...)))`, the prec is stripped, and the inner seq surfaces as a
 *     member of the outer seq.
 *   - `field(X, choice(...))` wrappers — since `tagVariants` auto-wraps
 *     vs "auto-tagged" can't be recovered by inspecting the choice alone.
 *
 * Path reflects how `applyPath` in transform-path.ts consumes segments:
 * one per seq-member descent; field wrappers are consumed (their content
 * takes the next segment); prec wrappers are transparent.
 */
export function findAllPolymorphCandidates(rule: Rule): PolymorphCandidateLocation[] {
	const qualifies = (c: ChoiceRule): boolean => looksLikePolymorphCandidate(c) && choiceNeedsVariantWrapping(c);

	const out: PolymorphCandidateLocation[] = [];

	const pushCandidate = (
		choice: ChoiceRule,
		prefix: Rule[],
		suffix: Rule[],
		path: string,
		fieldWrapperName?: string
	): void => {
		out.push({ choice, prefix, suffix, path, fieldWrapperName });
	};

	// Walk `rule`, building `path` as we descend. Invariants:
	//   - `prefix` / `suffix` track the members of the IMMEDIATELY
	//     enclosing seq (used by tryHoistSiblingVariants to preserve
	//     the scaffolding around each hoisted variant body).
	//   - `path` is what `applyPath` would consume to reach this rule.
	const walk = (r: Rule, path: string, prefix: Rule[], suffix: Rule[]): void => {
		if (isChoice(r) && qualifies(r)) {
			pushCandidate(r, prefix, suffix, path);
			return;
		}
		if (r.type === 'field' && r.content.type === 'choice' && qualifies(r.content)) {
			pushCandidate(r.content, prefix, suffix, path, r.name);
			return;
		}
		if (r.type !== 'seq') return;
		for (let i = 0; i < r.members.length; i++) {
			const m = r.members[i]!;
			const childPath = path === '' ? `${i}` : `${path}/${i}`;
			walk(m, childPath, r.members.slice(0, i), r.members.slice(i + 1));
		}
	};

	walk(rule, '', [], []);
	return out;
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
 * group, terminal) — those are terminal in the "structural" sense but
 * Link has already tagged them and we don't want to double-wrap.
 */
function isTerminalShape(rule: Rule): boolean {
	switch (rule.type) {
		case 'enum':
		case 'supertype':
		case 'group':
		case 'terminal':
		case 'polymorph':
			return false; // already has a structural classification

		case 'field':
			return false; // a field means it's a branch

		case 'symbol':
		case 'supertype' as never:
			return false; // a symbol means it carries children

		case 'string':
		case 'pattern':
		case 'indent':
		case 'dedent':
		case 'newline':
			// Bare terminals don't need wrapping — they're already leaf-shaped
			// at the point Assemble inspects them. We only wrap composed
			// terminal structures.
			return false;

		case 'seq':
			return rule.members.every(isTerminalShape_allowBareTerm);
		case 'choice':
			return rule.members.every(isTerminalShape_allowBareTerm);
		case 'optional':
		case 'repeat':
		case 'repeat1':
			return isTerminalShape_allowBareTerm(rule.content);
		case 'variant':
		case 'clause':
			return isTerminalShape_allowBareTerm(rule.content);
		case 'alias':
		case 'token':
			// Should be resolved by Link, but handle defensively
			return isTerminalShape_allowBareTerm(rule.content);
	}
	return false;
}

/**
 * Like isTerminalShape but bare terminals (string/pattern/whitespace) count
 * as terminal. Used to recurse into composed structures.
 */
function isTerminalShape_allowBareTerm(rule: Rule): boolean {
	switch (rule.type) {
		case 'string':
		case 'pattern':
		case 'indent':
		case 'dedent':
		case 'newline':
			return true;
		case 'enum':
			return true; // enum is a set of string literals → still terminal
		case 'field':
			return false;
		case 'symbol':
			return false;
		case 'supertype':
			return false;
		case 'group':
		case 'terminal':
			return false;
		case 'seq':
		case 'choice':
			return rule.members.every(isTerminalShape_allowBareTerm);
		case 'optional':
		case 'repeat':
		case 'repeat1':
			return isTerminalShape_allowBareTerm(rule.content);
		case 'variant':
		case 'clause':
			return isTerminalShape_allowBareTerm(rule.content);
		case 'alias':
		case 'token':
			return isTerminalShape_allowBareTerm(rule.content);
		case 'polymorph':
			return false;
	}
	return false;
}

// ---------------------------------------------------------------------------
// resolveRule — recursive resolution of all reference types
// ---------------------------------------------------------------------------

function resolveRule(
	rule: Rule,
	currentName: string,
	allRules: Record<string, Rule>,
	supertypes: Set<string>,
	externalRoles: Map<string, ExternalRole>
): Rule {
	switch (rule.type) {
		case 'seq':
			return {
				...rule,
				members: rule.members.map((m) => resolveRule(m, currentName, allRules, supertypes, externalRoles))
			};

		case 'choice':
			return {
				...rule,
				members: rule.members.map((m) => resolveRule(m, currentName, allRules, supertypes, externalRoles))
			};

		case 'optional': {
			const content = resolveRule(rule.content, currentName, allRules, supertypes, externalRoles);
			// Clause detection: optional(seq(STRING, FIELD, ...))
			// Preserve original rule.id through detectClause's fresh object construction
			// so NodeMap.nodeByRuleId can register optional-rooted kinds.
			const detected = detectClause(content, currentName);
			return rule.id !== undefined ? { ...detected, id: rule.id } : detected;
		}

		case 'repeat':
			return {
				...rule,
				content: resolveRule(rule.content, currentName, allRules, supertypes, externalRoles)
			};

		case 'repeat1':
			return resolveRepeat1PreservingNonEmpty(rule, currentName, allRules, supertypes, externalRoles);

		case 'field':
			return {
				...rule,
				content: resolveRule(rule.content, currentName, allRules, supertypes, externalRoles)
			};

		case 'token':
			// Flatten: extract content
			return resolveRule(rule.content, currentName, allRules, supertypes, externalRoles);

		case 'alias':
			if (rule.named && rule.value && !rule.value.startsWith('_')) {
				return resolveNamedAliasWithProvenance(rule.content, rule.value, supertypes);
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
				return { type: 'string', value: rule.value };
			}
			return resolveRule(rule.content, currentName, allRules, supertypes, externalRoles);

		case 'symbol':
			return resolveSymbolRoleOrPass(rule, allRules, externalRoles);

		// These pass through unchanged
		case 'string':
		case 'pattern':
		case 'enum':
		case 'supertype':
		case 'group':
		case 'clause':
		case 'variant':
		case 'indent':
		case 'dedent':
		case 'newline':
			return rule;

		default:
			return rule;
	}
}

/**
 * Resolve a `repeat1` rule while preserving the `repeat1` type through Link.
 *
 * @param rule - The `repeat1` rule to resolve.
 * @param currentName - Name of the rule being resolved (for error context).
 * @param allRules - Full grammar rule map.
 * @param supertypes - Set of grammar-declared supertype names.
 * @param externalRoles - Pre-bound external role map (mutated by role detection).
 * @returns The resolved repeat1 rule with its content recursively resolved.
 * @remarks
 *   Downstream derivation reads the `repeat1` type to stamp `nonEmpty: true`
 *   on the resulting `AssembledField` / `AssembledChild` so the emitter can
 *   render non-empty tuple types for those slots. Earlier builds collapsed
 *   `repeat1` → `repeat` here unconditionally, which erased the non-empty
 *   signal.
 */
function resolveRepeat1PreservingNonEmpty(
	rule: Repeat1Rule,
	currentName: string,
	allRules: Record<string, Rule>,
	supertypes: Set<string>,
	externalRoles: Map<string, ExternalRole>
): Rule {
	return {
		...rule,
		content: resolveRule(rule.content, currentName, allRules, supertypes, externalRoles)
	};
}

/**
 * Resolve a named alias to a symbol rule that carries aliased-from provenance.
 *
 * @param content - The body of the alias (typically a symbol referencing the
 *   original kind).
 * @param targetName - The alias target kind name (the visible kind produced in
 *   the parse tree).
 * @param supertypes - Set of supertype names; supertypes are not valid
 *   aliased-from sources.
 * @returns A `SymbolRule` for `targetName`, with `aliasedFrom` set when the
 *   body resolves to a concrete non-supertype symbol.
 * @remarks
 *   Preserving alias provenance lets the wrap emitter rewrite `$type` at
 *   drill-in via `drillAs()` for alias-target rewrites.
 */
function resolveNamedAliasWithProvenance(content: Rule, targetName: string, supertypes: Set<string>): Rule {
	const aliasedFrom = extractAliasedFromName(content, supertypes);
	const sym: SymbolRule = aliasedFrom
		? { type: 'symbol', name: targetName, aliasedFrom }
		: { type: 'symbol', name: targetName };
	return sym as unknown as Rule;
}

/**
 * Resolve a symbol rule, inlining it when it references an external role token.
 *
 * @param rule - The symbol rule to resolve.
 * @param allRules - Full grammar rule map used for legacy structural detection.
 * @param externalRoles - Pre-bound external role map; entries are added when
 *   a dummy role rule is detected (legacy path).
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
function resolveSymbolRoleOrPass(
	rule: SymbolRule,
	allRules: Record<string, Rule>,
	externalRoles: Map<string, ExternalRole>
): Rule {
	const preBound = externalRoles.get(rule.name);
	if (preBound) {
		return { type: preBound.role } as Rule;
	}
	const target = allRules[rule.name];
	if (target && (target.type === 'indent' || target.type === 'dedent' || target.type === 'newline')) {
		externalRoles.set(rule.name, { role: target.type });
		return target;
	}
	return rule;
}

// ---------------------------------------------------------------------------
// classifyHiddenRule — determine what a hidden rule IS
// ---------------------------------------------------------------------------

function classifyHiddenRule(name: string, rule: Rule, supertypes: Set<string>, _references: SymbolRef[]): Rule {
	// Already classified (e.g., enum from Evaluate)
	if (rule.type === 'enum' || rule.type === 'supertype' || rule.type === 'group') {
		return rule;
	}

	if (rule.type === 'choice') {
		return classifyHiddenChoiceRule(name, rule, supertypes);
	}

	if (isSeq(rule)) {
		return classifyHiddenSeqRule(name, rule);
	}

	// Other hidden rules survive as-is — Assemble classifies by structure
	return rule;
}

/**
 * Classify a hidden `choice` rule per the spec taxonomy.
 *
 * @param name - The grammar kind name (used to check the grammar's supertypes).
 * @param rule - A `ChoiceRule` to classify.
 * @param supertypes - Set of kind names explicitly declared in `grammar.supertypes`.
 * @returns An `EnumRule`, `SupertypeRule`, or the original rule unchanged.
 * @remarks
 *   Classification:
 *   - All-string members → `EnumRule` (promoted).
 *   - Supertype-compatible members (symbols, named aliases, enums/strings) →
 *     `SupertypeRule` when at least one concrete subtype name can be resolved.
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
function classifyHiddenChoiceRule(name: string, rule: ChoiceRule, supertypes: Set<string>): Rule {
	if (rule.members.every((m): m is StringRule => m.type === 'string')) {
		return normalizeEnumMembers(rule.members, 'promoted');
	}

	const supertypeCompatible = (m: Rule): boolean =>
		m.type === 'symbol' || (m.type === 'alias' && m.named) || m.type === 'enum' || m.type === 'string';
	const allCompatible = rule.members.every(supertypeCompatible);
	if (allCompatible || supertypes.has(name)) {
		const subtypes = collectSubtypeNames(rule);
		// Only promote if we actually resolved subtype names. An empty
		// subtypes list means the choice members aren't symbols and we
		// can't project a union — fall through to leave-as-is.
		if (subtypes.length > 0) {
			return {
				type: 'supertype',
				name,
				subtypes,
				source: supertypes.has(name) ? 'grammar' : 'promoted'
			} satisfies SupertypeRule;
		}
	}

	// Mixed/structural hidden choice — survive as-is.
	return rule;
}

/**
 * Classify a hidden `seq` rule as a `GroupRule` when it contains fields.
 *
 * @param name - The grammar kind name for the group.
 * @param rule - A `SeqRule` to classify.
 * @returns A `GroupRule` wrapping the seq when fields are present; the original
 *   rule otherwise.
 * @remarks
 *   Uses `hasAnyField` so nested structures (`repeat(field(...))`,
 *   `optional(field(...))`, choice of fields) trigger classification, not just
 *   direct `field(...)` members. Python's `_import_list` is the textbook case:
 *   `seq(repeat1(field('name', ...)), optional(','))` — no direct field member,
 *   but the repeated field inside is exactly what groups capture.
 */
function classifyHiddenSeqRule(name: string, rule: SeqRule): Rule {
	if (hasAnyField(rule)) {
		return {
			type: 'group',
			name,
			content: rule
		} satisfies GroupRule;
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
 */
function collectSubtypeNames(rule: Rule): string[] {
	const names: string[] = [];
	const visit = (current: Rule): void => {
		switch (current.type) {
			case 'symbol':
				names.push(current.aliasedFrom ?? current.name);
				return;
			case 'alias':
				if (!current.named) return;
				if (current.content.type === 'symbol') {
					names.push(current.content.name);
				} else {
					visit(current.content);
				}
				return;
			case 'string':
				if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(current.value)) names.push(current.value);
				return;
			case 'choice':
			case 'seq':
				for (const member of current.members) visit(member);
				return;
			case 'group':
			case 'variant':
			case 'clause':
			case 'token':
			case 'terminal':
			case 'optional':
			case 'repeat':
			case 'repeat1':
				visit(current.content);
				return;
			case 'enum':
				for (const member of current.members) visit(member);
				return;
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

export function enrichPositions(rules: Record<string, Rule>, refs: SymbolRef[]): void {
	for (const ref of refs) {
		const rule = rules[ref.from];
		if (!rule || rule.type !== 'seq') continue;
		const idx = rule.members.findIndex((m) => m.type === 'symbol' && m.name === ref.to);
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

function hoistIndentIntoRepeat(rules: Record<string, Rule>): void {
	for (const [, rule] of Object.entries(rules)) {
		walkForIndentHoist(rule, rules);
	}
}

function walkForIndentHoist(rule: Rule, rules: Record<string, Rule>): void {
	switch (rule.type) {
		case 'seq': {
			// Find every `indent` member; for each, promote the nearest
			// following repeat-bearing member by setting its separator.
			for (let i = 0; i < rule.members.length; i++) {
				if (rule.members[i]!.type !== 'indent') continue;
				for (let j = i + 1; j < rule.members.length; j++) {
					if (assignRepeatSeparator(rule.members[j]!, rules, new Set())) break;
					if (rule.members[j]!.type === 'dedent') break;
				}
			}
			for (const m of rule.members) walkForIndentHoist(m, rules);
			return;
		}
		case 'choice':
			for (const m of rule.members) walkForIndentHoist(m, rules);
			return;
		case 'field':
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'variant':
		case 'clause':
		case 'group':
		case 'token':
		case 'alias':
		case 'terminal':
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
function assignRepeatSeparator(rule: Rule, rules: Record<string, Rule>, visited: Set<string>): boolean {
	if (rule.type === 'repeat' || rule.type === 'repeat1') {
		if (!rule.separator) (rule as { separator?: string }).separator = BLOCK_SEPARATOR;
		return true;
	}
	if (rule.type === 'symbol') {
		if (visited.has(rule.name)) return false;
		const target = rules[rule.name];
		if (!target) return false;
		visited.add(rule.name);
		const found = assignRepeatSeparator(target, rules, visited);
		visited.delete(rule.name);
		return found;
	}
	if (rule.type === 'seq') {
		for (const m of rule.members) {
			if (assignRepeatSeparator(m, rules, visited)) return true;
		}
		return false;
	}
	if (rule.type === 'optional' || rule.type === 'group' || rule.type === 'field') {
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
// an `indent` Rule node. This pass computes the set of "block-bearer"
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
function computeHiddenBearerSet(rules: Record<string, Rule>): Set<string> {
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

function annotateBlockBearerFields(rules: Record<string, Rule>): void {
	const bearers = computeHiddenBearerSet(rules);
	// Mutate fields whose content reaches a bearer through hidden-only
	// intermediates. `markBlockBearerFields` recurses so nested visible
	// rules get their own fields inspected independently.
	for (const [, rule] of Object.entries(rules)) {
		markBlockBearerFields(rule, bearers);
	}
}

function containsIndent(rule: Rule): boolean {
	switch (rule.type) {
		case 'indent':
			return true;
		case 'seq':
		case 'choice':
			return rule.members.some(containsIndent);
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'field':
		case 'variant':
		case 'clause':
		case 'group':
		case 'token':
		case 'alias':
		case 'terminal':
			return containsIndent(rule.content);
		default:
			return false;
	}
}

function referencesBearer(rule: Rule, bearers: ReadonlySet<string>): boolean {
	switch (rule.type) {
		case 'symbol':
			return bearers.has(rule.name);
		case 'seq':
		case 'choice':
			return rule.members.some((m) => referencesBearer(m, bearers));
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'field':
		case 'variant':
		case 'clause':
		case 'group':
		case 'token':
		case 'alias':
		case 'terminal':
			return referencesBearer(rule.content, bearers);
		default:
			return false;
	}
}

function markBlockBearerFields(rule: Rule, bearers: ReadonlySet<string>): void {
	switch (rule.type) {
		case 'field':
			if (referencesBearer(rule.content, bearers)) {
				(rule as { blockBearer?: boolean }).blockBearer = true;
			}
			markBlockBearerFields(rule.content, bearers);
			return;
		case 'seq':
		case 'choice':
			for (const m of rule.members) markBlockBearerFields(m, bearers);
			return;
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'variant':
		case 'clause':
		case 'group':
		case 'token':
		case 'alias':
		case 'terminal':
			markBlockBearerFields(rule.content, bearers);
			return;
		default:
			return;
	}
}

// ---------------------------------------------------------------------------
// detectClause — optional(seq(STRING, FIELD, ...)) → clause
// ---------------------------------------------------------------------------

function detectClause(content: Rule, currentName: string): Rule {
	if (isSeq(content)) {
		const hasString = content.members.some(isString);
		const hasField = content.members.some(isField);
		if (hasString && hasField) {
			// Name the clause from the first field
			const firstField = content.members.find(isField);
			const clauseName = firstField?.name ?? currentName;
			return {
				type: 'clause',
				name: clauseName,
				content
			} satisfies ClauseRule;
		}
	}
	return { type: 'optional', content };
}

// ---------------------------------------------------------------------------
// Field name inference
// ---------------------------------------------------------------------------
//
// Walks the reference graph to find "this symbol is consistently named
// 'X' in N parents, but parent Y uses it bare" cases. When found, rewrite
// parent Y's rule tree to wrap the bare reference in `field('X', $.Y)`
// with source: 'inferred'. Downstream emitters treat inferred fields as
// real fields (they appear in interfaces, factories, etc.), and the
// suggested.ts emitter surfaces them as override candidates for the
// grammar curator to accept / reject.
//
// Inference rules:
//   - Symbol has ≥5 named references across parents
//   - ≥80% of the named references agree on the same field name
//   - Confidence = 'high' (≥95%), 'medium' (≥85%), 'low' (≥80%)
//   - Only the highest-confidence inference is emitted per target symbol
// ---------------------------------------------------------------------------

interface InferredName {
	readonly name: string;
	readonly confidence: 'high' | 'medium' | 'low';
	readonly agreement: number;
	readonly sampleSize: number;
}

function inferFieldNames(references: SymbolRef[]): Map<string, InferredName> {
	// Group references by `to` (the symbol being referenced).
	const refsByTo = new Map<string, SymbolRef[]>();
	for (const ref of references) {
		const list = refsByTo.get(ref.to) ?? [];
		list.push(ref);
		refsByTo.set(ref.to, list);
	}

	const inferred = new Map<string, InferredName>();
	for (const [to, refs] of refsByTo) {
		const namedRefs = refs.filter((r) => r.fieldName !== undefined);
		if (namedRefs.length < 5) continue;

		const nameCounts = new Map<string, number>();
		for (const r of namedRefs) {
			nameCounts.set(r.fieldName!, (nameCounts.get(r.fieldName!) ?? 0) + 1);
		}
		let bestName = '';
		let bestCount = 0;
		for (const [name, count] of nameCounts) {
			if (count > bestCount) {
				bestName = name;
				bestCount = count;
			}
		}
		const agreement = bestCount / namedRefs.length;
		if (agreement < 0.8) continue;
		const confidence: InferredName['confidence'] = agreement >= 0.95 ? 'high' : agreement >= 0.85 ? 'medium' : 'low';
		inferred.set(to, {
			name: bestName,
			confidence,
			agreement,
			sampleSize: namedRefs.length
		});
	}
	return inferred;
}

/**
 * Walk a rule tree and, for every bare symbol reference whose target
 * has an inferred name:
 *
 *   1. Append a DerivationLog entry recording the finding.
 *   2. If `apply` is true, wrap the bare ref in `field('name', $.Y)`
 *      with source: 'inferred'. Otherwise leave the rule tree alone.
 *
 * Stops descending into existing `field()` / `alias` boundaries — those
 * already own their field name. The returned `applied` flag reflects
 * whether the walker actually mutated anything (always false when
 * `apply` is false, true only when at least one wrap happened).
 */
function applyInferredFields(
	rule: Rule,
	ruleName: string,
	inferred: Map<string, InferredName>,
	apply: boolean,
	log: InferredFieldEntry[],
	_insideField = false
): { rule: Rule; applied: boolean } {
	switch (rule.type) {
		case 'symbol': {
			if (_insideField) return { rule, applied: false };
			const inf = inferred.get(rule.name);
			if (!inf) return { rule, applied: false };
			// Log unconditionally.
			log.push({
				kind: ruleName,
				fieldName: inf.name,
				targetSymbol: rule.name,
				confidence: inf.confidence,
				agreement: inf.agreement,
				sampleSize: inf.sampleSize,
				applied: apply
			});
			if (!apply) return { rule, applied: false };
			return {
				rule: {
					type: 'field',
					name: inf.name,
					content: rule,
					source: 'inferred'
				} satisfies FieldRule,
				applied: true
			};
		}

		case 'field':
		case 'alias':
			return { rule, applied: false };

		case 'seq': {
			const siblingDups = collectSeqSiblingDuplicates(rule.members);
			const members: Rule[] = [];
			let any = false;
			for (const m of rule.members) {
				const sn = unwrapSymRef(m);
				if (sn && siblingDups.has(sn)) {
					members.push(m);
					continue;
				}
				const r = applyInferredFields(m, ruleName, inferred, apply, log, _insideField);
				members.push(r.rule);
				any = any || r.applied;
			}
			return { rule: any ? { type: 'seq', members } : rule, applied: any };
		}

		case 'choice': {
			const members: Rule[] = [];
			let any = false;
			for (const m of rule.members) {
				const r = applyInferredFields(m, ruleName, inferred, apply, log, _insideField);
				members.push(r.rule);
				any = any || r.applied;
			}
			return { rule: any ? { type: 'choice', members } : rule, applied: any };
		}

		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'variant':
		case 'clause':
		case 'group': {
			const r = applyInferredFields(rule.content, ruleName, inferred, apply, log, _insideField);
			return {
				rule: r.applied ? ({ ...rule, content: r.rule } as Rule) : rule,
				applied: r.applied
			};
		}

		default:
			return { rule, applied: false };
	}
}

/**
 * Collect the set of symbol names that appear as direct seq siblings more than
 * once, which are ineligible for field-name inference in that seq.
 *
 * @param members - The members of a `SeqRule`.
 * @returns A set of symbol names that appear at least twice as direct siblings.
 * @remarks
 *   Wrapping duplicate-named siblings in `field` would collide on the same
 *   inferred name, losing all but the first. Patterns like rust `or_pattern`'s
 *   two `_pattern` refs separated by `|` are tree-sitter's "multi children"
 *   shape and belong in the `$$$CHILDREN` slot, not as fields.
 */
function collectSeqSiblingDuplicates(members: Rule[]): Set<string> {
	const symCounts = new Map<string, number>();
	for (const m of members) {
		const sn = unwrapSymRef(m);
		if (sn) symCounts.set(sn, (symCounts.get(sn) ?? 0) + 1);
	}
	const dups = new Set<string>();
	for (const [sn, cnt] of symCounts) if (cnt > 1) dups.add(sn);
	return dups;
}

/**
 * Unwrap transparent rule wrappers to find the innermost symbol name.
 *
 * @param r - A rule to inspect.
 * @returns The symbol name if `r` is a symbol or wraps one through
 *   `optional`/`variant`/`clause`/`group`; `null` otherwise.
 */
function unwrapSymRef(r: Rule): string | null {
	if (r.type === 'symbol') return r.name;
	if (r.type === 'optional' || r.type === 'variant' || r.type === 'clause' || r.type === 'group') {
		return unwrapSymRef(r.content);
	}
	return null;
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
function collectRepeatedShapes(rules: Record<string, Rule>, out: RepeatedShapeEntry[]): void {
	// Build the set of already-declared supertype signatures so we
	// don't duplicate-suggest what the grammar author already wrote.
	const existingSupertypeKeys = new Set<string>();
	for (const rule of Object.values(rules)) {
		if (rule.type === 'supertype') {
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
function collectFieldKindSets(rule: Rule, yield_: (kinds: readonly string[]) => void): void {
	switch (rule.type) {
		case 'field': {
			const kinds = directContentKinds(rule.content);
			if (kinds.length > 0) yield_(kinds);
			// Walk into the content too — nested fields get yielded
			// on their own.
			collectFieldKindSets(rule.content, yield_);
			return;
		}
		case 'seq':
		case 'choice':
			for (const m of rule.members) collectFieldKindSets(m, yield_);
			return;
		case 'optional':
		case 'repeat':
		case 'token':
		case 'variant':
		case 'clause':
		case 'group':
			collectFieldKindSets(rule.content, yield_);
			return;
	}
}

/**
 * Extract the immediate concrete kind set a rule expression
 * resolves to. Unwraps seq/choice/optional/repeat/variant but
 * stops at field/symbol boundaries.
 */
function directContentKinds(rule: Rule): string[] {
	switch (rule.type) {
		case 'symbol':
			return [rule.name];
		case 'supertype':
			return [...rule.subtypes];
		case 'choice':
			return rule.members.flatMap(directContentKinds);
		case 'optional':
		case 'repeat':
		case 'token':
		case 'variant':
		case 'clause':
		case 'group':
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
