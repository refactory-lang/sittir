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

import { ALIAS, CHOICE, DEDENT, FIELD, GROUP, INDENT, NEWLINE, OPTIONAL, PATTERN, REPEAT, REPEAT1, SEQ, STRING, SUPERTYPE, SYMBOL, TOKEN, VARIANT } from './rule-types.ts'; // @rule-type-consts
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
	StringRule
} from './rule.ts';
import { isSeq, isChoice, normalizeEnumMembers, isEnumChoiceRule } from './rule.ts';
import { liftSeparators } from './lift-separators.ts';
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
		// inferredFields stays empty: the statistical field-name-inference pass was
		// deleted (it was apply=false / analysis-only). suggested-overrides emission
		// is disabled for now, so nothing reads this.
		inferredFields: [],
		promotedRules: [],
		repeatedShapes: []
	};

	// Resolve all rules
	const rules: Record<string, Rule> = {};
	for (const [name, rule] of Object.entries(raw.rules)) {
		rules[name] = resolveRule(rule, name, raw.rules, supertypes, externalRoles);
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
	mintContentAliasKinds(raw.rules, rules, supertypes, externalRoles, contentAliasedFrom, contentAliasedTo);

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
			if (body && body.type !== GROUP) {
				// Lift separated lists in the synth group body — this runs after
				// the main lift loop, so an un-lifted commaSep1 inside a synth
				// group would otherwise escape #62's separator centralization.
				rules[synthKind] = {
					type: GROUP,
					name: synthKind,
					content: liftSeparators(body)
				} satisfies GroupRule;
			}
		}
	}

	// Compute classification guards from the RAW (pre-resolveRule) rules so
	// the original alias structure is still visible.
	//
	// - hiddenChoicesWithNamedAliasMembers: hidden choice kinds whose own
	//   body has named-alias members → must NOT be promoted to supertype.
	// - parentAliasedKinds: hidden kinds that appear as the content of a
	//   named alias in any parent rule → real runtime CST nodes even when
	//   their normalized body is a repeat1 → must NOT be classified as multi.
	const hiddenChoicesWithNamedAliasMembers = collectHiddenChoicesWithNamedAliasMembers(raw.rules);
	// ONE deep-walk yields BOTH the hidden-aliased set (classifier guard) and the
	// visible→visible alias-target map (slot accept-set union), derived together so
	// the two facets of `alias(symbol(X), $.target)` can never drift apart.
	const { parentAliasedKinds, visibleAliasTargets } = collectAliasedByParents(raw.rules);

	classifyAndLogHiddenRules(
		rules,
		raw.inline,
		supertypes,
		references,
		derivations,
		applyPromotedRules,
		hiddenChoicesWithNamedAliasMembers
	);
	// PR-P Task 2: promoteAndLogTerminalRules removed — terminals classify by shape at Assemble

	// Apply wire-produced variant alias push-down (ambient scaffolding into variant children).
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
function stripResolvedRoleRules(rules: Record<string, Rule>): void {
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
	applyPromotedRules: boolean,
	hiddenChoicesWithNamedAliasMembers: ReadonlySet<string>
): void {
	for (const [name, rule] of Object.entries(rules)) {
		if (isHiddenKind(name, inline) || supertypes.has(name)) {
			const classified = classifyHiddenRule(
				name,
				rule,
				supertypes,
				references,
				hiddenChoicesWithNamedAliasMembers
			);
			const classifiedSource = (classified as { source?: string }).source ?? classified.metadata?.source;
			const isPromotedEnum = isEnumChoiceRule(classified);
			const isPromotedSupertype = classified.type === SUPERTYPE;
			if (
				classified !== rule &&
				(isPromotedEnum || isPromotedSupertype) &&
				(classifiedSource === 'promoted' || classifiedSource === 'grammar')
			) {
				derivations.promotedRules.push({
					kind: name,
					classification: isPromotedEnum ? 'enum' : 'supertype',
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
	if (rule.type === ALIAS && rule.named) return rule.value;
	if (
		rule.type === GROUP ||
		rule.type === VARIANT ||
		rule.type === TOKEN
	) {
		return extractTopLevelAliasTarget((rule as { content: Rule }).content);
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
function collectHiddenChoicesWithNamedAliasMembers(rawRules: Record<string, Rule>): ReadonlySet<string> {
	const out = new Set<string>();
	for (const [name, rule] of Object.entries(rawRules)) {
		if (!name.startsWith('_')) continue;
		// Only pure alias-dispatch choices: every member must be a named alias.
		if (
			rule.type === CHOICE &&
			rule.members.length > 0 &&
			rule.members.every((m) => m.type === 'alias' && m.named)
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
function collectAliasedByParents(rawRules: Record<string, Rule>): {
	parentAliasedKinds: ReadonlySet<string>;
	visibleAliasTargets: ReadonlyMap<string, readonly string[]>;
} {
	const parentAliasedKinds = new Set<string>();
	const visibleAliasTargets = new Map<string, string[]>();
	function walk(rule: Rule): void {
		if (rule.type === ALIAS) {
			if (rule.named && rule.content.type === 'symbol') {
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
		if ('members' in rule && Array.isArray((rule as ChoiceRule | SeqRule).members)) {
			for (const m of (rule as ChoiceRule | SeqRule).members) walk(m);
		}
		if ('content' in rule && (rule as { content?: Rule }).content) {
			walk((rule as { content: Rule }).content);
		}
	}
	for (const rule of Object.values(rawRules)) walk(rule);
	return { parentAliasedKinds, visibleAliasTargets };
}

/**
 * Mint visible IR kinds from enrich content-aliases.
 *
 * enrich surfaces an inline-unsafe `optional(seq)` / bare `choice` as a visible
 * CST node by wrapping its CONTENT in `alias(<content>, $.<name>)` tagged
 * `metadata.source === 'enrich'`. tree-sitter assigns `<name>` a real kindId in
 * `parser.c` (the alias lives in the grammar) — so the kind is a real CST kind.
 * This pass supplies the matching IR rule entry: it registers
 * `rules[<name>] = resolveRule(<content>)` so codegen emits the kind's template,
 * type, and slots.
 *
 * The alias is keyed on **non-symbol** content — `alias($._sym, $.name)` keeps
 * its existing `aliasedFrom` provenance (handled by
 * `resolveNamedAliasWithProvenance`) and is NOT minted here. An existing rule of
 * the same name is left byte-unchanged (no clobber).
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
	rawRules: Record<string, Rule>,
	rules: Record<string, Rule>,
	supertypes: Set<string>,
	externalRoles: Map<string, ExternalRole>,
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
	function isEnrichContentAlias(rule: Rule): boolean {
		if (rule.type !== ALIAS) return false;
		const meta = (rule as unknown as { metadata?: { source?: string } }).metadata;
		// Only enrich-tagged aliases mint a kind. A symbol alias WITHOUT this tag
		// is an authored relabel (`alias($._hidden, $.visible)`) and keeps its
		// `aliasedFrom` provenance handling — never minted here.
		if (meta?.source !== 'enrich') return false;
		// Accept BOTH forms of the enrich visible-group alias:
		//   - symbol content `alias($._<name>, $.<name>)` — the current shape; the
		//     hidden `_<name>` rule's body is resolved THROUGH the symbol below.
		//   - non-symbol content (legacy direct content-alias), still registered.
		const content = (rule as { content?: Rule }).content;
		return content !== undefined;
	}
	function walk(rule: Rule, ownerName: string): void {
		if (rule.type === ALIAS) {
			const value = (rule as { value?: string }).value;
			const content = (rule as { content?: Rule }).content;
			if (isEnrichContentAlias(rule) && typeof value === 'string' && value.length > 0 && content) {
				if (!(value in rules)) {
					// Resolve THROUGH a symbol-form alias content: the enrich visible
					// group is `alias($._<name>, $.<name>)` whose content is a SYMBOL
					// ref to the hidden `_<name>` rule. Register the kind from the
					// hidden rule's BODY (not the bare symbol ref), so the minted kind
					// carries the group's real slots/template. Non-symbol content
					// (legacy) resolves directly.
					let body: Rule = content;
					if (content.type === SYMBOL) {
						const hiddenBody = (content as SymbolRule).name;
						const target = rawRules[hiddenBody];
						if (target) body = target;
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
						resolveRule(body, value, rawRules, supertypes, externalRoles)
					);
				}
			}
			if (content) walk(content, ownerName);
			return;
		}
		if ('members' in rule && Array.isArray((rule as ChoiceRule | SeqRule).members)) {
			for (const m of (rule as ChoiceRule | SeqRule).members) walk(m, ownerName);
		}
		if ('content' in rule && (rule as { content?: Rule }).content) {
			walk((rule as { content: Rule }).content, ownerName);
		}
	}
	for (const [name, rule] of Object.entries(rawRules)) walk(rule, name);
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
			content.type === SYMBOL &&
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
	if (rule.type === ALIAS && rule.named) return rule.content;
	if (
		rule.type === GROUP ||
		rule.type === VARIANT ||
		rule.type === TOKEN
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
	if (rule.type !== SYMBOL) return rule;
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
	if (target.type === GROUP) return true;
	// Pure repeat/repeat1 (possibly wrapped in optional/variant) = multi.
	const unwrap = (r: Rule): Rule => (r.type === OPTIONAL || r.type === VARIANT ? unwrap(r.content) : r);
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

export function wrapVariants(choice: Rule): Rule {
	if (choice.type !== CHOICE) return choice;

	const members = choice.members.map((member, i) => {
		const variantName = nameVariant(member, i, choice.members);
		return {
			type: 'variant' as const,
			name: variantName,
			content: member
		} satisfies VariantRule;
	});

	return { type: CHOICE, members: deduplicateVariants(members) };
}

export function deduplicateVariants(variants: Rule[]): Rule[] {
	const seen: Rule[] = [];
	const result: Rule[] = [];

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
	if (rule.type === STRING) return rule.value;
	if (rule.type === SEQ && rule.members.length > 0) {
		for (const m of rule.members) {
			if (m.type === 'string') return m.value;
		}
	}
	return null;
}

function findDetectSymbol(rule: Rule): string | null {
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
function rulesEqualForVariant(a: Rule, b: Rule): boolean {
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
		if (!rule) continue;

		const found = findVariantChoice(rule);
		if (!found) continue;

		// Deep choice: push ambient scaffold into variant children instead.
		emitVariantChildDerivations(parentKind, children, derivations);

		const variantChildSymbolNames = new Set(children.map((c) => polymorphVisibleName(parentKind, c)));
		// Check whether any variant-child symbol appears in the found choice — either
		// as a direct member or nested inside choice/seq arms at any shallow depth.
		const symbolInNames = (r: Rule): boolean => {
			const inner = r.type === VARIANT ? r.content : r;
			return inner.type === 'symbol' && variantChildSymbolNames.has(inner.name);
		};
		const symbolInRule = (r: Rule): boolean => {
			if (symbolInNames(r)) return true;
			const inner = r.type === VARIANT ? r.content : r;
			if (inner.type === 'choice') return inner.members.some(symbolInNames);
			if (inner.type === 'seq') return inner.members.some((m) => symbolInNames(m) || (m.type === 'choice' && m.members.some(symbolInNames)));
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
	if (rule.type !== CHOICE || rule.members.length === 0) return false;
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
	const prefix = seq.members.slice(0, choiceIdx).filter((m) => m.type === STRING) as StringRule[];
	const suffix = seq.members.slice(choiceIdx + 1).filter((m) => m.type === STRING) as StringRule[];
	if (prefix.length === 0 && suffix.length === 0) return seq; // nothing to push
	const choice = seq.members[choiceIdx] as ChoiceRule;
	for (const member of choice.members) {
		const core = member.type === VARIANT ? member.content : member;
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

export function findVariantChoice(rule: Rule): VariantChoiceLocation | null {
	// Matches bare choices (post-spec-013) and seq-wrapped choices.
	if (isChoice(rule)) {
		return { choice: rule, prefix: [], suffix: [] };
	}
	if (rule.type === SEQ) {
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
			(m) => m.type === SEQ && (m as SeqRule).members.some((mm) => mm.type === CHOICE)
		);
		if (innerSeqIdx === -1) return null;
		// Make sure there is no other member that is also a seq with a choice in it,
		// and no choices at all elsewhere in the outer seq.
		const outerChoiceCount = rule.members.filter((m) => m.type === 'choice').length;
		if (outerChoiceCount > 0) return null; // would have been caught above, defensive
		const innerSeq = rule.members[innerSeqIdx] as SeqRule;
		const innerChoiceIdx = innerSeq.members.findIndex((m) => m.type === CHOICE);
		if (innerChoiceIdx === -1) return null;
		// Ensure there is only ONE choice total across outer + inner levels.
		const innerChoiceCount = innerSeq.members.filter((m) => m.type === CHOICE).length;
		const otherSeqChoiceCount = rule.members
			.filter((m, i) => i !== innerSeqIdx && m.type === 'seq')
			.reduce((acc, m) => acc + (m as SeqRule).members.filter((mm) => mm.type === CHOICE).length, 0);
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
 * PR-P Task 2: TERMINAL case removed — TerminalRule deleted from Rule union.
 */
export function isTerminalShape(rule: Rule): boolean {
	switch (rule.type) {
		// PR-P: ENUM case removed — isEnumChoiceRule guard in CHOICE arm handles this.
		// PR-P Task 2: TERMINAL case removed — TerminalRule deleted from Rule union.
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
function isTerminalShape_allowBareTerm(rule: Rule): boolean {
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
	rule: Rule,
	currentName: string,
	allRules: Record<string, Rule>,
	supertypes: Set<string>,
	externalRoles: Map<string, ExternalRole>
): Rule {
	switch (rule.type) {
		case SEQ:
			return {
				...rule,
				members: rule.members.map((m) => resolveRule(m, currentName, allRules, supertypes, externalRoles))
			};

		case CHOICE:
			return {
				...rule,
				members: rule.members.map((m) => resolveRule(m, currentName, allRules, supertypes, externalRoles))
			};

		case OPTIONAL: {
			const content = resolveRule(rule.content, currentName, allRules, supertypes, externalRoles);
			return { ...rule, content };
		}

		case REPEAT:
			return {
				...rule,
				content: resolveRule(rule.content, currentName, allRules, supertypes, externalRoles)
			};

		case REPEAT1:
			return resolveRepeat1PreservingNonEmpty(rule, currentName, allRules, supertypes, externalRoles);

		case FIELD:
			return {
				...rule,
				content: resolveRule(rule.content, currentName, allRules, supertypes, externalRoles)
			};

		case TOKEN:
			// Flatten: extract content
			return resolveRule(rule.content, currentName, allRules, supertypes, externalRoles);

		case ALIAS: {
			// enrich content-alias (`alias(<non-symbol content>, $.<name>)` tagged
			// metadata.source='enrich'): the PARENT must reference the minted kind
			// by a clean SYMBOL ref so codegen emits the visible group via its own
			// AssembledGroup template. `mintContentAliasKinds` registers the body
			// under `<name>`. Fire for BOTH declared (`parens`) and default
			// (`_enum_body_group1`) names — the default name is `_`-prefixed, so we
			// must NOT route it through the generic `!startsWith('_')` branch (which
			// would inline the content instead of referencing the kind).
			const aliasMeta = (rule as unknown as { metadata?: { source?: string } }).metadata;
			if (
				aliasMeta?.source === 'enrich' &&
				rule.named &&
				typeof rule.value === 'string' &&
				rule.value.length > 0
			) {
				// enrich visible-group alias — its content is now a SYMBOL ref to the
				// hidden `_<name>` rule (`alias($._<name>, $.<name>)`). The PARENT must
				// reference the minted VISIBLE kind by a clean `symbol(<name>)` ref;
				// `mintContentAliasKinds` registers the body. (Symbol content WITHOUT
				// the enrich tag is an authored relabel handled below via aliasedFrom.)
				return { type: 'symbol', name: rule.value } as Rule;
			}
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
				return { type: STRING, value: rule.value };
			}
			return resolveRule(rule.content, currentName, allRules, supertypes, externalRoles);
		}

		case SYMBOL:
			return resolveSymbolRoleOrPass(rule, allRules, externalRoles);

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
	if (target && (target.type === INDENT || target.type === DEDENT || target.type === NEWLINE)) {
		externalRoles.set(rule.name, { role: target.type });
		return target;
	}
	return rule;
}

// ---------------------------------------------------------------------------
// classifyHiddenRule — determine what a hidden rule IS
// ---------------------------------------------------------------------------

function classifyHiddenRule(
	name: string,
	rule: Rule,
	supertypes: Set<string>,
	_references: SymbolRef[],
	hiddenChoicesWithNamedAliasMembers: ReadonlySet<string>
): Rule {
	// Already classified (e.g., enum from Evaluate)
	// PR-P: ENUM type retired — isEnumChoiceRule detects enum-shaped ChoiceRules.
	if (isEnumChoiceRule(rule) || rule.type === SUPERTYPE || rule.type === GROUP) {
		return rule;
	}

	if (rule.type === CHOICE) {
		return classifyHiddenChoiceRule(name, rule, supertypes, hiddenChoicesWithNamedAliasMembers);
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
function classifyHiddenChoiceRule(
	name: string,
	rule: ChoiceRule,
	supertypes: Set<string>,
	hiddenChoicesWithNamedAliasMembers: ReadonlySet<string>
): Rule {
	if (rule.members.every((m): m is StringRule => m.type === STRING)) {
		return normalizeEnumMembers(rule.members, 'promoted');
	}

	// If this hidden choice's ORIGINAL (pre-resolveRule) rule body contained
	// named-alias members, its choice arms represent REAL aliased CST nodes —
	// NOT abstract supertypes that tree-sitter erases at parse time. Block
	// supertype promotion so these kinds fall through to branch classification.
	// Grammar-declared supertypes (in grammar.supertypes) are never blocked.
	if (hiddenChoicesWithNamedAliasMembers.has(name) && !supertypes.has(name)) {
		return rule;
	}

	const supertypeCompatible = (m: Rule): boolean =>
		m.type === SYMBOL || isEnumChoiceRule(m) || m.type === STRING;
	const allCompatible = rule.members.every(supertypeCompatible);
	if (allCompatible || supertypes.has(name)) {
		const subtypes = collectSubtypeNames(rule);
		// Only promote if we actually resolved subtype names. An empty
		// subtypes list means the choice members aren't symbols and we
		// can't project a union — fall through to leave-as-is.
		if (subtypes.length > 0) {
			return {
				type: SUPERTYPE,
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
			type: GROUP,
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
			case SYMBOL:
				names.push(current.aliasedFrom ?? current.name);
				return;
			case ALIAS:
				if (!current.named) return;
				if (current.content.type === 'symbol') {
					names.push(current.content.name);
				} else {
					visit(current.content);
				}
				return;
			case STRING:
				if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(current.value)) names.push(current.value);
				return;
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

export function enrichPositions(rules: Record<string, Rule>, refs: SymbolRef[]): void {
	for (const ref of refs) {
		const rule = rules[ref.from];
		if (!rule || rule.type !== SEQ) continue;
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
		case SEQ: {
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
function assignRepeatSeparator(rule: Rule, rules: Record<string, Rule>, visited: Set<string>): boolean {
	if (rule.type === REPEAT || rule.type === REPEAT1) {
		if (!rule.separator) (rule as { separator?: string }).separator = BLOCK_SEPARATOR;
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

function referencesBearer(rule: Rule, bearers: ReadonlySet<string>): boolean {
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

function markBlockBearerFields(rule: Rule, bearers: ReadonlySet<string>): void {
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
function collectRepeatedShapes(rules: Record<string, Rule>, out: RepeatedShapeEntry[]): void {
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
function collectFieldKindSets(rule: Rule, yield_: (kinds: readonly string[]) => void): void {
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
function directContentKinds(rule: Rule): string[] {
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
