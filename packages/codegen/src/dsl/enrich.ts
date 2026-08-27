/**
 * dsl/enrich.ts — mechanical grammar enrichment passes.
 *
 * `enrich(base)` returns a new grammar with each rule's body enriched
 * by mechanical passes. No side-channel callbacks: enrich builds the
 * wrapped FIELD/SYMBOL nodes inline and injects any required `_kw_<name>`
 * hidden rules directly into `base.grammar.rules`, so tree-sitter's
 * native `grammar()` sees a complete, self-consistent grammar.
 *
 *     export default grammar(enrich(base), { rules: { ... } })
 *
 * Current passes:
 *
 *   1. Unambiguous kind-to-name field wrapping — bare `$.kind` symbol
 *      at a top-level seq position appearing exactly once → wrap as
 *      `field('kind', $.kind)` with `source: 'enriched'`.
 *
 *   2. Bare leading-keyword field promotion — first seq member is an
 *      identifier-shaped string literal (`'break'`, `'async'`) →
 *      wrap as `field(kw, SYMBOL(_kw_<kw>))` and register the hidden
 *      rule `_kw_<kw>: prec.left(1, 'kw')` so tree-sitter's normalizer
 *      preserves the FIELD around SYMBOL (bare STRING inside FIELD
 *      gets stripped).
 *
 *   3. Optional keyword-prefix promotion — `optional(identifier-literal)`
 *      at any seq position → wrap inner as the same FIELD(SYMBOL) form.
 *      Field is named `<token>_marker` (semantic suffix indicating
 *      "presence-indicator slot for this literal"); avoids JS-reserved-
 *      keyword collisions (`async`, `static`, `const`) at the
 *      factory/config surface.
 *
 *   4. Optional-symbol promotion — at a TOP-LEVEL seq position:
 *
 *        optional($.kind)                    → wrap inner SYMBOL
 *        optional(seq($.kind, <anon…>))      → wrap inner SYMBOL
 *
 *      Both descend through `CHOICE(X, BLANK)` (tree-sitter's
 *      normalized optional form). Case B stays strict: the inner seq
 *      must contain exactly one SYMBOL; all other members must be
 *      anonymous terminals (STRING / PATTERN) — guards against
 *      accidentally labelling multi-symbol seqs. Same uniqueness +
 *      claimed-name guards as pass 1.
 *
 *   5. Choice-arm terminal field wrapping — pass 1 only inspects a
 *      rule's OWN top-level body when it's a bare seq (or repeat(seq)).
 *      A seq buried as an ARM of a top-level CHOICE (e.g.
 *      `export_statement: choice(previous, seq('export','type',
 *      $.export_clause,optional($._from_clause),$._semicolon), ...)`)
 *      never gets pass 1's treatment, even once that arm is later
 *      promoted into its own visible node kind by a downstream
 *      choice-arm-promotion mechanism. This pass applies pass 1's Shape-1
 *      (bare SYMBOL only) decision independently to each seq-shaped
 *      choice arm. Also widens eligibility for underscore-prefixed
 *      targets beyond `supertypeNames` (tree-sitter's declared
 *      `supertypes:` list) to any hidden rule that is "terminal-shaped"
 *      — built entirely from anonymous literals and/or references to
 *      other terminal-shaped hidden rules, recursively (see
 *      `isAnonymousLiteralShapedRule`) — since a rule like `_semicolon
 *      = choice($._automatic_semicolon, ';')` is exactly this shape but
 *      was never a declared supertype. One level of choice-arm descent
 *      only (an arm that is itself a further CHOICE is left alone).
 *      Doesn't share pass 1's numbered-duplicate / nested-repeat
 *      disqualification machinery — choice arms are simple,
 *      single-occurrence positions in practice; per-arm collisions still
 *      skip via `reportSkip`.
 *
 *   6. Node-choice field wrapping — a bare `repeat(choice(...))` wraps the
 *      whole choice as `field('elements', choice(...))` instead of leaving
 *      each arm to route into a separate per-kind read bucket; a bare
 *      eligible-referent symbol as a repeat's direct content gets the same
 *      treatment; and a separated list's leading + repeated element
 *      positions get the SAME field name so they merge into one slot (see
 *      `applyNodeChoiceFieldWrap`'s doc comment for all three). Runs once,
 *      LAST, over the fully-merged rule map — not part of the fixed-point
 *      loop above. Numbered on collision (`elements_2`, ...) rather than
 *      skipped, and reaches hidden rules too — unlike passes 1-5. Callers
 *      exempt individual rule names via `enrich()`'s `config` parameter
 *      when the wrap would be structurally correct but empirically wrong
 *      (a choice arm that's an implicit, unmodeled text gap rather than a
 *      real CST child; or a rule whose own override already fields this
 *      exact position).
 *
 * All passes collision-aware: skip (stderr notification) when the
 * promotion would shadow an existing field name. Strictly local — no
 * cross-rule analysis, no thresholds. All enrich-added FIELDs carry
 * `source: 'enriched'` so downstream passes distinguish them from
 * user-authored overrides.
 *
 * Why inject `_kw_<name>` into `base.grammar.rules` instead of using
 * `registerSyntheticRule`: the synthetic-rules module-level map gets
 * reset by `installGrammarWrapper` at the start of every `wrappedGrammar`
 * call (synthetic-rules.ts:394). That works when the registration
 * happens INSIDE a rule callback (pass-1 dry-run captures it before the
 * reset), but enrich runs BEFORE `grammar()` — so the reset wipes the
 * registrations and the enriched rules end up with dangling SYMBOL
 * references. Injecting the hidden rules directly into `base.grammar.rules`
 * sidesteps the scope machinery entirely; tree-sitter's native grammar
 * picks them up via line-315 `Object.assign({}, baseGrammar.rules)`.
 */

import type { Rule, AnyRule } from '../types/rule.ts';
import { isEnumChoiceRule } from '../types/rule.ts';
import { RuleWalker } from './rule-walker.ts';
import { makeRuleMetadata, normalizeEnumMembers } from './rule-metadata.ts';
import type { GrammarJson } from '../grammar-shapes/grammar-json.ts';
import type { EnrichRule } from '../grammar-shapes/enrich-type.ts';
import {
	isSeqType,
	isStringType,
	isSymbolType,
	isFieldType,
	isOptionalType,
	isChoiceType,
	isRepeatType,
	isBlankType,
	isPrecWrapper,
	typeEq
} from '../types/runtime-shapes.ts';
import type { RuntimeRule } from '../types/runtime-shapes.ts';
import { detectRepeatSeparator, firstStringOfChoice } from './list-patterns.ts';
import { ruleKey } from './shared.ts';
import {
	diagnoseParseKindCollisions,
	type ParseKindCollisionDiagnostic,
	type ParseKindCollisionValue
} from '../types/parsekind-collisions.ts';
import { setGroupLiftRuleMap } from './transform/transform-path.ts';
import { ruleMatchesEmpty, isInlineSafe, isSupertypeLike, isPermutationChoice } from './group-classify.ts';
import { compileWordMatcher, matchesWordShape } from '../util/word-matcher.ts';

// Shape of the tree-sitter grammar result that our grammarFn produces.
// The outer wrapper is `{ grammar: {...} }` because tree-sitter's
// top-level `grammar()` call wraps its result; we preserve that shape.
export interface GrammarResult {
	grammar: {
		name: string;
		rules: Record<string, Rule>;
		[other: string]: unknown;
	};
}

export type EnrichedGrammar<B> = B extends GrammarJson
	? {
			readonly [K in keyof B]: K extends 'rules'
				? { readonly [R in keyof B['rules']]: EnrichRule<B['rules'][R]> }
				: B[K];
		}
	: B;

export interface EnrichConfig {
	/**
	 * Rule names exempt from EVERY mechanical enrich pass — the fixed-point
	 * loop (symbol-to-field, choice-arm-field-wrap, optional-keyword),
	 * clause-hoist, un-aliasing, and `applyNodeChoiceFieldWrap`. Escape
	 * hatch for a rule where the grammar shape looks like a pass's target
	 * but empirically isn't — e.g. python's `string_content`, or rust's
	 * `tuple_type`/`trait_bounds` whose own hand-authored override already
	 * fields the exact position `applyNodeChoiceFieldWrap`'s separated-list
	 * target would also try to field (see that function's doc comment) —
	 * rather than a
	 * per-pass knob that every future pass would need its own copy of.
	 */
	readonly skip?: readonly string[];
}

export function enrich<B = GrammarResult>(baseInput: B, config?: EnrichConfig): EnrichedGrammar<B> {
	const base = baseInput as unknown as GrammarResult;
	const enrichSkip = new Set(config?.skip ?? []);
	if (!base || typeof base !== 'object') {
		throw new Error('enrich(): expected a grammar object, got ' + typeof base);
	}
	const hasWrapper = 'grammar' in base;
	const rulesBag = (hasWrapper ? base.grammar?.rules : (base as unknown as { rules?: unknown }).rules) as
		| Record<string, Rule>
		| undefined;
	if (!rulesBag) return base as unknown as EnrichedGrammar<B>;
	// Grammar-wide word-shape matcher (R12 Camp A). `word`'s shape depends on
	// which runtime is evaluating us: under sittir's own `grammarFn` (the
	// globalThis.grammar shim — see compiler/evaluate.ts
	// saveAndInjectDslGlobals) it is already a resolved rule NAME
	// (string | null); but the emitted `.sittir/grammar.js` runs enrich()
	// BEFORE tree-sitter's native `grammar()`, so there `word` is still the
	// raw `$ => $.identifier` callback. Resolve the callback form with the
	// same symbol-shaped-proxy trick `extractSupertypeNames` uses, so both
	// paths compile the SAME word regex (PR #111 review finding — previously
	// the CLI path silently fell back to /^\w+$/, letting keyword promotion
	// diverge between parser and IR). ruleToRegexSource in util/word-matcher
	// is dual-case for the same reason. Single source of truth via
	// matchesWordShape; used by pass 3's optional-keyword-prefix below.
	const grammarMeta = (hasWrapper ? base.grammar : base) as
		| { word?: string | null | ((dollar: unknown) => unknown) }
		| undefined;
	const wordMatcher = compileWordMatcher(extractWordName(grammarMeta?.word), rulesBag);
	// Extract declared supertype names so pass 3 can treat `_prefix`-
	// stripped labels as valid field names (e.g. `optional($._expression)`
	// → `field('expression', $._expression)`). `supertypes` is a
	// `$ => [...]` callback on the base grammar; we invoke it with a
	// trivial symbol-shaped proxy so enrich can extract the names
	// without waiting for tree-sitter to run the real grammar pipeline.
	const supertypeNames = extractSupertypeNames(base, hasWrapper);
	// Per-enrich hidden-rule bag. Passes that wrap keywords populate it
	// via `registerKwRule` below; the final rule map merges it with the
	// enriched user rules.
	const kwRules: Record<string, Rule> = {};
	// Clause-hoist hidden-rule bag. The clause-hoist pass injects hoisted
	// optional(seq(STRING,FIELD…)) groups here so tree-sitter sees them
	// from base.grammar.rules (same path as _kw_* rules).
	const clauseGroupRules: Record<string, Rule> = {};
	// Cross-parent dedupe map for clause-hoist: canonicalStringify(seq) → name.
	// Shared across all parent rules within a single enrich() call — mirrors
	// applyAutoGroups's dedupe map so identical clause seqs in different
	// parents reuse the same hidden rule.
	const clauseDedupeMap: Record<string, string> = {};
	// Cross-parent dedupe map for inline-UNSAFE visible content-aliases:
	// canonicalStringify(content) → `_<parent>_group<N>` name. Identical
	// inline-unsafe bodies in different parents reuse the same visible kind.
	const groupDedupeMap: Record<string, string> = {};
	// Hidden-rule names (`_<parent>_group<N>`) for VISIBLE-aliased groups. These
	// are registered in `clauseGroupRules` (so tree-sitter sees the rule) but must
	// be EXCLUDED from the `inline:` list: the parent references them via
	// `alias($._<name>, $.<name>)`, and inlining the hidden rule would make
	// tree-sitter alias the EXPANDED seq (re-distributing the alias across its
	// members — the exact bug this restructure fixes). Inline-safe clause groups
	// stay in `inline:`. Tagged ONCE at creation (visibleGroupSynthName) — read
	// here, never re-derived.
	const visibleGroupHiddenNames = new Set<string>();
	// Synthesized clause-hoist name → the parent kind whose body it was
	// hoisted FROM (recorded once, at first mint — see the two record sites
	// inside `applyClauseHoist`). Exposed via `ENRICH_CLAUSE_GROUP_OWNERS_KEY`
	// so wire() can tell, once an override redeclares that owner, that the
	// synthesized name is now orphaned (the override author could never have
	// typed a reference to a name that doesn't exist until THIS enrich() call
	// mints it from the base grammar's own, pre-override shape).
	const clauseGroupOwners = new Map<string, string>();
	// Per-call un-aliasing diagnostic sink (see ENRICH_UNALIAS_DIAGNOSTICS_KEY):
	// local to THIS enrich() invocation, attached to its result below.
	const unaliasSink: UnaliasDiagnosticSink = { diagnostics: [], seen: new Set() };
	const enrichedRules: Record<string, Rule> = {};
	// Loop 1: field-wrap every rule to its fixed point BEFORE any hoisting, so
	// the hoist stage below sees the whole grammar's enriched fields (the
	// separated-list naming needs grammar-global field-name knowledge).
	for (const name of Object.keys(rulesBag)) {
		const rule = rulesBag[name];
		enrichedRules[name] =
			rule && !enrichSkip.has(name)
				? applyFieldWrapPasses(name, rule, kwRules, supertypeNames, rulesBag, wordMatcher)
				: rule!;
	}
	// Whole-body list normalization: an existing rule whose ENTIRE body is a
	// flank-carrying separated list in the nested-head spelling
	// (`seq(seq(elem, repeat(sep elem)), flank)`) — e.g. python's upstream
	// `_patterns`/`_parameters`/`_import_list` helpers — flattens to the
	// canonical head-form so the link phase's separator lift recognizes it
	// and the kind classifies 'separatedList' (kind-level flank keys), same
	// as the mints below. Language-identical: seq nesting is associative.
	for (const name of Object.keys(enrichedRules)) {
		const rule = enrichedRules[name];
		if (!rule || enrichSkip.has(name)) continue;
		if (!isSeqType((rule as { type?: string }).type)) continue;
		const info = separatedListBodyInfo(rule);
		if (!info?.flankCarrying || info.form !== 'head') continue;
		const members = (rule as unknown as { members: Rule[] }).members;
		if (info.flatMembers === members) continue;
		enrichedRules[name] = { ...rule, members: info.flatMembers } as Rule;
	}
	// Exclusive field-choice distribution, BEFORE loop 2: the mint below lifts
	// choice arms into kinds, so the alternatives have to be arms by the time
	// it runs — afterwards they are already fused onto one kind as independent
	// optional fields. Reads `enrichedRules` for the hidden marker helpers it
	// inlines, so it sees them fully field-wrapped.
	for (const name of Object.keys(enrichedRules)) {
		const rule = enrichedRules[name];
		if (!rule || enrichSkip.has(name)) continue;
		enrichedRules[name] = distributeExclusiveFieldChoices(rule, enrichedRules);
	}
	// Loop 2: clause/group hoisting + base-grammar un-aliasing, per rule in the
	// same order loop 1 ran. The separated-list name counts computed from the
	// fully field-wrapped grammar are what let a mint claim a bare element
	// name only with global uniqueness.
	separatedListNameCounts = collectSeparatedListNameProposals(enrichedRules);
	separatedListEnrichSkip = enrichSkip;
	hiddenListPromotionNames = new Map();
	hoistKwRules = kwRules;
	hoistWordMatcher = wordMatcher;
	try {
		for (const name of Object.keys(enrichedRules)) {
			const rule = enrichedRules[name];
			if (!rule || enrichSkip.has(name)) continue;
			enrichedRules[name] = applyHoistAndUnalias(
				name,
				rule,
				kwRules,
				supertypeNames,
				rulesBag,
				clauseGroupRules,
				clauseDedupeMap,
				groupDedupeMap,
				visibleGroupHiddenNames,
				clauseGroupOwners,
				unaliasSink
			);
		}
	} finally {
		separatedListNameCounts = null;
		separatedListEnrichSkip = null;
		hiddenListPromotionNames = null;
		hoistKwRules = null;
		hoistWordMatcher = undefined;
	}
	// Base-grammar un-aliasing also needs to reach clause-hoist-minted group
	// rules, not just the original rulesBag entries above. `applyEnrichPasses`
	// only calls `applyUnaliasDistinct` on EACH RULE'S OWN body — but the
	// widened clause-hoist mint gate can hoist a `choice(…, alias($._reserved_identifier,
	// $.identifier), …)`-shaped position OUT of a rule that pass would otherwise
	// have un-aliased, into a brand-new `clauseGroupRules` entry the per-name
	// loop above never independently visits (it iterates `rulesBag`, not
	// `clauseGroupRules`). Run the same pass over every minted group once the
	// main loop has fully settled, so it sees every mint from every rule.
	for (const groupName of Object.keys(clauseGroupRules)) {
		const groupBody = clauseGroupRules[groupName];
		if (!groupBody) continue;
		const groupUnaliasResult = applyUnaliasDistinct(
			groupName,
			groupBody,
			rulesBag,
			kwRules,
			clauseGroupRules,
			supertypeNames
		);
		clauseGroupRules[groupName] = groupUnaliasResult.rule;
		for (const diagnostic of groupUnaliasResult.diagnostics) {
			recordUnaliasDiagnostic(unaliasSink, diagnostic);
		}
	}
	// Inject `_<kw>_marker` hidden rules — `registerKwRule` already checked
	// each one against `rulesBag` (reusing or declining on collision), so
	// nothing here can shadow a base-grammar rule of the same name.
	// Inject clause-group rules — user rules NEVER shadow them either
	// (they start with `_<parentKind>_optional`, a synthesized prefix).
	const mergedRules = { ...enrichedRules, ...kwRules, ...clauseGroupRules };
	// Singleton-ordinal collapse: an arm/group mint's ordinal exists only to
	// disambiguate siblings under one parent — a parent with exactly one mint
	// of a flavor drops it (`slice_group1` → `slice_group`). Runs before the
	// later passes so they (and wire's override callbacks) see final names.
	collapseSingletonMintOrdinals(mergedRules, clauseGroupRules, visibleGroupHiddenNames, clauseGroupOwners);
	// Node-choice field wrapping (pass 6) — runs once, last, over every rule
	// this enrich() call produced (original + kw + clause-hoist mints), never
	// inside the fixed-point loop above. Needs `mergedRules` itself (to
	// dereference a hidden referent's own body, and to mint literal-arm
	// promotion rules directly into the final rule bag). See
	// `applyNodeChoiceFieldWrap`'s doc comment for why.
	for (const name of Object.keys(mergedRules)) {
		if (enrichSkip.has(name)) continue;
		const rule = mergedRules[name];
		if (rule) mergedRules[name] = applyNodeChoiceFieldWrap(name, rule, mergedRules, supertypeNames);
	}
	// Mint inline field-enum choices (`field('operator', choice('+', '-', …))`)
	// as named hidden rules directly into `mergedRules`, pre-generate — see
	// `synthesizeFieldEnumRules`'s doc comment. Runs last so it also sees
	// clause-hoist-minted rules from the merge above. Verified across all
	// three grammars (docs/superpowers/specs/2026-07-30-kindid-invariant-restoration.md
	// §1): `tree-sitter generate` succeeds, `grammar.json`'s `conflicts` array
	// is unchanged, and `node-types.json` is byte-identical for rust,
	// typescript, and python — the `prec(-1, …)` wrapper (see
	// `tryExtractFieldEnum`) is what keeps a newly-real hidden rule from
	// shifting any LR state, so no grammar's `conflicts:` list needed a
	// manual entry.
	synthesizeFieldEnumRules(mergedRules);
	// Register the merged rule-map so transform()/groups path-descent can resolve
	// (and patch) enrich group-lift symbol bodies by name — the lookup that lets a
	// path patch travel THROUGH a hoisted `_<parent>_<kind><N>` symbol into its
	// referenced body. Write-back mutates THIS object (the grammar's `rules` point
	// at it below), so a patched group rule reaches both the parser seed and the
	// IR-materialized kind. Last-registration-wins is safe: codegen processes one
	// grammar at a time and enrich runs before any transform fn executes.
	setGroupLiftRuleMap({
		get: (n) => mergedRules[n] as unknown as RuntimeRule | undefined,
		set: (n, b) => {
			mergedRules[n] = b as unknown as Rule;
		}
	});
	// Attach the set of clause-group names as a well-known non-enumerable
	// property on the enriched grammar. Wire.ts reads this to register the
	// hoisted groups in `context.syntheticInline` so they get added to the
	// grammar's `inline:` list — without inlining, tree-sitter creates LR
	// conflicts for the new hidden rules. Non-enumerable so it is invisible
	// to rule iteration, JSON serialization, and spread operators.
	// Only inline-safe hidden clause groups go into `inline:` (syntheticInline).
	// VISIBLE-aliased groups' hidden rules (`_<parent>_group<N>`) are excluded —
	// inlining them would re-distribute the visible alias across the seq members.
	const clauseGroupNames = new Set(Object.keys(clauseGroupRules).filter((n) => !visibleGroupHiddenNames.has(n)));
	const result: unknown = hasWrapper
		? { ...base, grammar: { ...base.grammar, rules: mergedRules } }
		: { ...(base as unknown as object), rules: mergedRules };
	if (clauseGroupNames.size > 0) {
		Object.defineProperty(result, ENRICH_CLAUSE_GROUPS_KEY, {
			value: clauseGroupNames,
			enumerable: false,
			writable: false,
			configurable: true
		});
	}
	// Attach the synthesized-name → owning-parent-kind map (BOTH categories —
	// inline-safe AND visible-aliased) so wire() can detect when an override
	// redeclares the owner and orphans the synthesized rule. See
	// `getEnrichClauseGroupOwners`.
	if (clauseGroupOwners.size > 0) {
		Object.defineProperty(result, ENRICH_CLAUSE_GROUP_OWNERS_KEY, {
			value: clauseGroupOwners,
			enumerable: false,
			writable: false,
			configurable: true
		});
	}
	// Attach this call's un-aliasing diagnostics to its own result (non-enumerable,
	// like the clause-groups key) so they travel with the grammar object instead
	// of a module-global accumulator — see ENRICH_UNALIAS_DIAGNOSTICS_KEY.
	if (unaliasSink.diagnostics.length > 0) {
		Object.defineProperty(result, ENRICH_UNALIAS_DIAGNOSTICS_KEY, {
			value: unaliasSink.diagnostics,
			enumerable: false,
			writable: false,
			configurable: true
		});
	}
	// Attach the hidden SOURCE names behind every visible-group mint (both the
	// promote-existing and synthesize-new categories). Wire reads this to
	// FILTER these names out of the grammar's final `inline:` list: a mint
	// `alias($._src, $.visible)` only survives to the parser if `_src` is a
	// real (non-inlined) rule — tree-sitter's inline processing erases inlined
	// rules before table construction, taking the alias (and the minted kind's
	// entire parser identity) with it, while the IR still models the kind —
	// the "VAPORIZED" phantom divergence. See getEnrichVisibleGroupSources.
	if (visibleGroupHiddenNames.size > 0) {
		Object.defineProperty(result, ENRICH_VISIBLE_GROUP_SOURCES_KEY, {
			value: visibleGroupHiddenNames,
			enumerable: false,
			writable: false,
			configurable: true
		});
	}
	return result as unknown as EnrichedGrammar<B>;
}

export const ENRICH_CLAUSE_GROUPS_KEY = '__enrichedClauseGroups__' as const;

export function getEnrichClauseGroups(grammar: unknown): ReadonlySet<string> {
	if (!grammar || typeof grammar !== 'object') return new Set();
	const names = (grammar as Record<string, unknown>)[ENRICH_CLAUSE_GROUPS_KEY];
	if (names instanceof Set) return names as ReadonlySet<string>;
	return new Set();
}

export const ENRICH_CLAUSE_GROUP_OWNERS_KEY = '__enrichedClauseGroupOwners__' as const;

export function getEnrichClauseGroupOwners(grammar: unknown): ReadonlyMap<string, string> {
	if (!grammar || typeof grammar !== 'object') return new Map();
	const owners = (grammar as Record<string, unknown>)[ENRICH_CLAUSE_GROUP_OWNERS_KEY];
	if (owners instanceof Map) return owners as ReadonlyMap<string, string>;
	return new Map();
}

export const ENRICH_VISIBLE_GROUP_SOURCES_KEY = '__enrichedVisibleGroupSources__' as const;

export function getEnrichVisibleGroupSources(grammar: unknown): ReadonlySet<string> {
	if (!grammar || typeof grammar !== 'object') return new Set();
	const names = (grammar as Record<string, unknown>)[ENRICH_VISIBLE_GROUP_SOURCES_KEY];
	if (names instanceof Set) return names as ReadonlySet<string>;
	return new Set();
}

function applyFieldWrapPasses(
	ruleName: string,
	rule: Rule,
	kwRules: Record<string, Rule>,
	supertypeNames: ReadonlySet<string>,
	rulesBag: Record<string, Rule>,
	wordMatcher: RegExp | undefined
): Rule {
	// Fixed-point loop. The current pass set has well-defined
	// non-overlapping outputs (symbol-to-field wraps SYMBOLs as FIELD;
	// optional-keyword wraps optional(STRING) as FIELD(SYMBOL(_<x>_marker))),
	// so a single iteration converges in practice. Looping is defensive:
	// if a pass's output ever exposes new candidates for an earlier
	// pass (e.g. structural simplification creates a new top-level
	// SYMBOL position), we converge instead of silently losing the
	// promotion. `MAX_ITERATIONS` caps blow-ups from any future pass
	// that accidentally produces ever-changing output.
	const MAX_ITERATIONS = 8;
	let r = rule;
	let converged = false;
	for (let i = 0; i < MAX_ITERATIONS; i++) {
		const before = r;
		r = applySymbolToField(ruleName, r, supertypeNames);
		// Choice-arm terminal field wrapping (pass 5) — see
		// `applyChoiceArmFieldWrap`'s doc comment. Mutually exclusive with
		// `applySymbolToField` at the top level (a rule's own body is
		// either a seq/repeat(seq) or a choice, never both), so ordering
		// within this loop doesn't matter.
		r = applyChoiceArmFieldWrap(ruleName, r, supertypeNames, rulesBag);
		// Repeat-union field promotion (pass 6) — see
		// `applyRepeatUnionFieldPromotion`'s doc comment. Targets a shape no
		// other pass touches (bare `repeat($._union)` content, including in
		// hidden rules), so loop ordering doesn't matter.
		r = applyRepeatUnionFieldPromotion(ruleName, r, rulesBag);
		// Bare leading-keyword pass intentionally omitted — the docstring
		// above explains why: wrapping bare leading literals as FIELD(SYM)
		// adds `_kw_<name>` hidden rules that shift tree-sitter's parser-
		// generator tables, breaking unrelated rules' reparse (rust corpus
		// regresses by ~47/136 with this pass on).
		r = applyOptionalKeyword(ruleName, r, kwRules, rulesBag, wordMatcher);
		if (r === before) {
			converged = true;
			break;
		}
	}
	if (!converged && !process.env.SITTIR_QUIET) {
		process.stderr.write(`enrich: fixed-point did not converge for '${ruleName}' after ${MAX_ITERATIONS} iterations\n`);
	}
	return r;
}

// Clause-hoist runs AFTER the field-wrapping loop has converged — it must
// see the enrich-inferred (`source:'enriched'`) FIELDs, because its trigger
// is `optional(seq(…))` with `some(isString) && some(isField)`. Running it
// first (the original placement) missed every clause whose field is added
// by applySymbolToField (e.g. rust `abstract_type`'s
// `for <type_parameters>`), leaving those for detectClause. One pass: once a
// seq is hoisted its replacement is `optional(SYMBOL)`, which won't re-trigger.
// It is a separate per-rule stage (not the tail of `applyFieldWrapPasses`)
// so enrich() can field-wrap EVERY rule before hoisting ANY of them — the
// separated-list naming below needs grammar-global field-name uniqueness,
// which only exists once all rules carry their enriched fields.
function applyHoistAndUnalias(
	ruleName: string,
	rule: Rule,
	kwRules: Record<string, Rule>,
	supertypeNames: ReadonlySet<string>,
	rulesBag: Record<string, Rule>,
	clauseGroupRules: Record<string, Rule>,
	clauseDedupeMap: Record<string, string>,
	groupDedupeMap: Record<string, string>,
	visibleGroupHiddenNames: Set<string>,
	clauseGroupOwners: Map<string, string>,
	unaliasSink: UnaliasDiagnosticSink
): Rule {
	let r = rule;
	// Per-parent counter is local; dedupeMap + clauseGroupRules are shared across rules.
	const clauseHoistCounter: ClauseHoistCounter = { opt: 0, grp: 0, arm: 0, supertypeNames };
	r = applyClauseHoist(
		ruleName,
		r,
		rulesBag,
		clauseGroupRules,
		clauseDedupeMap,
		clauseHoistCounter,
		groupDedupeMap,
		visibleGroupHiddenNames,
		clauseGroupOwners
	);
	// Base-grammar un-aliasing: drop (visible X) or retarget (hidden X)
	// alias($.X, $.Y) sites where X's storage kind is structurally distinct
	// from the other value(s) sharing parse kind Y (parsekind-noninjective).
	// Runs after clause-hoist has settled so it sees the final member shape.
	const unaliasResult = applyUnaliasDistinct(ruleName, r, rulesBag, kwRules, clauseGroupRules, supertypeNames);
	r = unaliasResult.rule;
	for (const diagnostic of unaliasResult.diagnostics) {
		recordUnaliasDiagnostic(unaliasSink, diagnostic);
	}
	return r;
}

function extractSupertypeNames(base: unknown, hasWrapper: boolean): ReadonlySet<string> {
	const root = hasWrapper ? (base as { grammar?: Record<string, unknown> }).grammar : (base as Record<string, unknown>);
	const supertypes = root?.supertypes;
	// Callback form (raw author grammar): `$ => [$._expr, ...]`. Invoke
	// with a symbol-shaped proxy and harvest the names.
	if (typeof supertypes === 'function') {
		// Proxy that returns a SYMBOL-shaped object for any property access —
		// matches tree-sitter's grammar-authoring protocol where `$.foo`
		// produces a SYMBOL reference named 'foo'. Enough to let the
		// callback return its array; any `.field()` / `.optional()` calls
		// inside would miss but no grammars we've seen do that in
		// supertypes:.
		const dollar = new Proxy(
			{},
			{
				get(_t, prop) {
					if (typeof prop === 'string') return { type: 'SYMBOL', name: prop };
					return undefined;
				}
			}
		);
		let result: unknown;
		try {
			result = (supertypes as (proxy: unknown) => unknown)(dollar);
		} catch {
			return new Set();
		}
		return harvestSupertypeNames(result);
	}
	// Pre-evaluated form: tree-sitter's native grammar() and sittir's
	// evaluate() both convert the supertypes callback to an array before
	// returning. Tree-sitter native emits `[{type:'SYMBOL', name:'_expr'}, …]`;
	// sittir evaluate() emits `['_expr', …]`. Accept both forms.
	if (Array.isArray(supertypes)) return harvestSupertypeNames(supertypes);
	return new Set();
}

/**
 * @internal — true when `name` (an underscore-prefixed hidden-rule
 * reference, e.g. `_semicolon`) is "terminal-shaped": its own body is
 * built ENTIRELY from anonymous literals (STRING/PATTERN) and/or SYMBOL
 * references to other terminal-shaped hidden rules, recursively (e.g.
 * `_semicolon = choice($._automatic_semicolon, ';')`). A SYMBOL with no
 * entry in `rulesBag` is presumed to be an external-scanner token (e.g.
 * `_automatic_semicolon`, `_function_signature_automatic_semicolon`) —
 * these have no rule body of their own (they're declared in `externals:`,
 * not `rules:`), but are exactly as terminal/anonymous-shaped as a bare
 * STRING for this purpose.
 *
 * This is a WIDER net than `supertypeNames` (tree-sitter's own declared
 * `supertypes:` list, which only covers real NAMED-node unions like
 * `_expression`/`_statement`) — a hidden rule can be "purely a choice of
 * anonymous alternatives" without ever being declared a supertype, and
 * `applySymbolToField`'s existing `supertypeNames.has()` gate wrongly
 * treats such rules the same as any other unclassified hidden helper,
 * blocking a bare `$._semicolon`-shaped reference from ever being
 * auto-fielded even when the containing rule IS a top-level seq.
 */
function isAnonymousLiteralShapedRule(name: string, rulesBag: Record<string, Rule>, seen: Set<string>): boolean {
	if (seen.has(name)) return false; // cycle guard — never seen in practice, but don't hang if it occurs
	seen.add(name);
	const rule = rulesBag[name];
	if (!rule) return true; // no rule body — presumed external scanner token
	return isAnonymousLiteralShapedContent(rule, rulesBag, seen);
}

function isAnonymousLiteralShapedContent(rule: Rule, rulesBag: Record<string, Rule>, seen: Set<string>): boolean {
	if (isStringType(rule.type) || rule.type === 'PATTERN') return true;
	if (isChoiceType(rule.type)) {
		const members = (rule as unknown as { members: Rule[] }).members;
		return members.every((m) => isAnonymousLiteralShapedContent(m, rulesBag, seen));
	}
	if (isSymbolType(rule.type) && typeof (rule as { name?: unknown }).name === 'string') {
		return isAnonymousLiteralShapedRule((rule as { name: string }).name, rulesBag, seen);
	}
	return false;
}

/**
 * Pass 5 (choice-arm terminal field wrapping). Pass 1
 * (`applySymbolToField`) only inspects a rule's OWN top-level body when
 * it's (optionally prec-wrapped) a bare seq, or a repeat/repeat1 wrapping
 * one (`tryPromoteInRepeatSeq`) — it never descends into individual arms
 * of a top-level CHOICE. `export_statement`'s body is
 * `choice(previous, seq('export','type',$.export_clause,
 * optional($._from_clause),$._semicolon), seq(...), seq(...))` — a
 * top-level CHOICE with the semicolon-bearing seq buried as one arm. Pass
 * 1 never sees it, so when that arm is later promoted into its own
 * visible node kind (`_export_statement_type_export`) by a downstream
 * choice-arm-promotion mechanism, it inherits a body where `semicolon`
 * was never fielded — a real bug: `automatic_semicolon` is a NAMED node
 * type, so the native reader routes an unfielded occurrence of it to its
 * own kind-keyed `_automatic_semicolon` field, a different key than
 * generated wrap code checks (which only catches the anonymous `;`
 * alternative via the generic `$other` bucket). Explicit `;` worked; ASI
 * (no trailing `;`) threw.
 *
 * This pass mirrors pass 1's per-member decision (Shape 1 / bare SYMBOL
 * only — the same restriction pass 1 applies to underscore-prefixed
 * targets, since wrapping Shape 2/3 nested inside an OPTIONAL breaks
 * override `transform()` patches that expect a direct enriched FIELD),
 * applied independently to each seq-shaped CHOICE arm instead of only a
 * rule's own top-level seq. Non-underscore bare symbols use their own
 * kind name; underscore-prefixed ones are eligible when either a real
 * declared supertype OR (new) `isAnonymousLiteralShapedRule`.
 *
 * Deliberately ONE level of choice-arm descent (arms that are themselves
 * a nested CHOICE, rather than a SEQ, are left alone) — matches the
 * concrete need (`export_statement`'s arms are each a flat seq) without
 * open-ended recursion into arbitrarily deep choice-of-choice shapes.
 * Deliberately omits pass 1's numbered-duplicate and nested-repeat
 * disqualification machinery — choice arms in practice are simple,
 * single-occurrence positions; a per-arm collision (`existing.has`) still
 * skips with `reportSkip` rather than risk stamping a wrong/colliding
 * field name.
 */
function applyChoiceArmFieldWrap(
	ruleName: string,
	rule: Rule,
	supertypeNames: ReadonlySet<string>,
	rulesBag: Record<string, Rule>
): Rule {
	if (ruleName.startsWith('_')) return rule; // skip hidden helpers — same gate as pass 1
	let cursor: Rule = rule;
	const precStack: Rule[] = [];
	while (isPrecWrapper(cursor as { type: string })) {
		precStack.push(cursor);
		cursor = (cursor as unknown as { content: Rule }).content;
	}
	if (!isChoiceType(cursor.type)) return rule;
	const armMembers = (cursor as unknown as { members: Rule[] }).members;
	let anyArmChanged = false;
	const newArms = armMembers.map((arm) => {
		let armCursor: Rule = arm;
		const armPrecStack: Rule[] = [];
		while (isPrecWrapper(armCursor as { type: string })) {
			armPrecStack.push(armCursor);
			armCursor = (armCursor as unknown as { content: Rule }).content;
		}
		if (!isSeqType(armCursor.type)) return arm;
		const seqMembers = (armCursor as unknown as { members: Rule[] }).members;
		const existing = collectFieldNamesRuntime(armCursor);
		let armChanged = false;
		const newSeqMembers = seqMembers.map((m) => {
			const t = detectSymbolTarget(m);
			if (!t) return m;
			if (!isBareShapeTarget(m, t)) return m; // Shape 1 only, same as pass 1's underscore restriction
			let fieldName = t.name;
			if (t.name.startsWith('_')) {
				const eligible = supertypeNames.has(t.name) || isAnonymousLiteralShapedRule(t.name, rulesBag, new Set());
				if (!eligible) return m;
				fieldName = t.name.slice(1);
			}
			if (existing.has(fieldName)) {
				reportSkip('choice-arm-field', ruleName, `field '${fieldName}' already exists`);
				return m;
			}
			existing.add(fieldName);
			armChanged = true;
			const fieldNode = makeField(fieldName, t.symbolRule);
			return t.wrap(fieldNode);
		});
		if (!armChanged) return arm;
		anyArmChanged = true;
		let rebuiltArm: Rule = { ...armCursor, members: newSeqMembers } as Rule;
		for (let i = armPrecStack.length - 1; i >= 0; i--) {
			rebuiltArm = { ...armPrecStack[i]!, content: rebuiltArm } as Rule;
		}
		return rebuiltArm;
	});
	if (!anyArmChanged) return rule;
	let result: Rule = { ...cursor, members: newArms } as Rule;
	for (let i = precStack.length - 1; i >= 0; i--) {
		result = { ...precStack[i]!, content: result } as Rule;
	}
	return result;
}

function collectAllFieldNamesDeep(rule: Rule, into: Set<string>): void {
	if (isFieldType((rule as { type: string }).type) && typeof (rule as { name?: unknown }).name === 'string') {
		into.add((rule as { name: string }).name);
	}
	const bag = rule as unknown as { members?: readonly Rule[]; content?: Rule };
	if (Array.isArray(bag.members)) {
		for (const m of bag.members) collectAllFieldNamesDeep(m, into);
	} else if (bag.content && typeof bag.content === 'object') {
		collectAllFieldNamesDeep(bag.content, into);
	}
}

/**
 * A choice whose arms are all node-shaped (SYMBOL/ALIAS references, no bare
 * literal arm) is the merge-order-bug shape this pass targets. Run as-is
 * against a repeat's raw choice content, a bare literal arm (e.g.
 * `class_body`'s `;` terminator alongside method/member arms) disqualifies
 * it here — but `promoteLiteralChoiceArms` (below) runs first and turns a
 * literal arm into a node-shaped one, so by the time this check matters it
 * usually no longer applies. See that function's doc comment for why
 * promoting is safe.
 */
function isAllArmsNodeShaped(choiceRule: Rule): boolean {
	const members = (choiceRule as unknown as { members: readonly Rule[] }).members;
	return members.every((arm) => {
		let cursor = arm;
		while (isPrecWrapper(cursor as { type: string })) {
			cursor = (cursor as unknown as { content: Rule }).content;
		}
		const t = (cursor as { type: string }).type;
		return t === 'SYMBOL' || t === 'ALIAS';
	});
}

/**
 * Same as `isAllArmsNodeShaped` but also accepts a bare literal (STRING /
 * PATTERN) arm — the shape `promoteLiteralChoiceArms` knows how to fix.
 * Deliberately excludes anything else (nested SEQ/CHOICE arms, etc.): those
 * are a different shape (e.g. a separated list) that this pass doesn't
 * touch.
 */
function isAllArmsNodeOrLiteralShaped(choiceRule: Rule): boolean {
	const members = (choiceRule as unknown as { members: readonly Rule[] }).members;
	return members.every((arm) => {
		let cursor = arm;
		while (isPrecWrapper(cursor as { type: string })) {
			cursor = (cursor as unknown as { content: Rule }).content;
		}
		const t = (cursor as { type: string }).type;
		return t === 'SYMBOL' || t === 'ALIAS' || isStringType(t) || t === 'PATTERN';
	});
}

/** Minimal punctuation → readable-name map for `promoteLiteralChoiceArms`.
 * Not a general token-naming utility (that's `compiler/link.ts`'s
 * `tokenToName`, a later compiler phase enrich.ts doesn't import from —
 * same reasoning as `pluralizeFieldName`); the promoted name is a
 * synthesized hidden-rule identifier immediately folded into the outer
 * `elements` field, so it only needs to be valid, unique, and readable
 * enough for debugging, not exhaustive. */
const LITERAL_ARM_NAMES: Record<string, string> = {
	';': 'semi'
};

function literalArmNameHint(text: string): string {
	return LITERAL_ARM_NAMES[text] ?? text.replace(/[^\w]+/g, '');
}

/**
 * Promotes each bare literal (STRING/PATTERN) arm of a choice into a
 * minted `_kw_<name>` hidden-rule SYMBOL — via `registerKwRule`, the same
 * mechanism passes 2-4 already use for keyword promotion — so a mixed
 * node+literal choice becomes all-node-shaped and reaches case 1's
 * ordinary `field('elements', repeat(choice(...)))` wrap instead of
 * staying split across per-kind wire buckets joined by
 * `_concatInSourceOrder`.
 *
 * Only called on a REPEAT's direct choice content (never a rule's own
 * top-level dispatch choice, which classifies what variant a single node
 * itself is): `isAllArmsNodeShaped`'s doc comment used to warn that a
 * literal arm here signals per-arm `polymorphs:` classification that
 * fielding the choice would break. That classification (see
 * `node-model.json5`'s `childKind` maps) is keyed by each occurrence's own
 * CST kind name, not by its position among the choice's arms or which wire
 * bucket it arrived in — promoting the literal doesn't rename or reorder
 * any node-shaped arm, so the classification survives fielding the whole
 * repeat the same way case 1 already does for a purely node-shaped choice.
 *
 * Returns `null` (no-op) if nothing changed — e.g. every arm was already
 * node-shaped, or a mint declined due to a genuine name collision
 * (`registerKwRule`'s own conservative guard); the caller keeps the
 * original choice in that case rather than risk a partially-promoted one.
 */
function promoteLiteralChoiceArms(choiceRule: Rule, mergedRules: Record<string, Rule>): Rule | null {
	const members = (choiceRule as unknown as { members: readonly Rule[] }).members;
	let changed = false;
	let declined = false;
	const newMembers = members.map((arm) => {
		let cursor = arm;
		const precStack: Rule[] = [];
		while (isPrecWrapper(cursor as { type: string })) {
			precStack.push(cursor);
			cursor = (cursor as unknown as { content: Rule }).content;
		}
		const t = (cursor as { type: string }).type;
		if (!isStringType(t) && t !== 'PATTERN') return arm;
		const text = (cursor as unknown as { value: string }).value;
		const nameHint = literalArmNameHint(text);
		const symbol = nameHint ? registerKwRule(cursor, nameHint, mergedRules, mergedRules) : null;
		if (!symbol) {
			declined = true;
			return arm;
		}
		changed = true;
		let rebuilt: Rule = symbol;
		for (let i = precStack.length - 1; i >= 0; i--) {
			rebuilt = { ...(precStack[i] as object), content: rebuilt } as Rule;
		}
		return rebuilt;
	});
	if (!changed || declined) return null;
	return { ...(choiceRule as object), members: newMembers } as Rule;
}

/**
 * Node-choice field wrapping. Two independent targets, one tree walk:
 *
 *  1. `repeat(choice(...))` with no field wrapper routes each repetition
 *     into a separate per-arm-kind read bucket (tree-sitter has no field to
 *     key on), and any arm whose text collapses to a scalar leaf on the
 *     wire loses the position data needed to recombine those buckets in
 *     document order (`typescript`'s `template_literal_type` —
 *     string_fragment/template_type arms — is the motivating case).
 *     Rewriting `repeat(choice(...))` to `field('elements',
 *     repeat(choice(...)))` — the field wraps the WHOLE repeat, matching
 *     the codebase's existing `field(name, repeat(...))` convention (e.g.
 *     `array: {1: field('elements')}`) rather than living inside it —
 *     keeps every repetition in a single read bucket, in source order,
 *     regardless of arm kind, with no cross-bucket reassembly needed. The
 *     outer placement also keeps a pre-existing hand-authored
 *     `field(newName)` override at this same position working unmodified:
 *     it finds a plain top-level FIELD and renames it via
 *     `resolveFieldPlaceholder`'s ordinary unwrap-and-rewrap path (see
 *     `transform.ts`) instead of finding a bare REPEAT underneath and
 *     nesting a second field around it. Scoped to all-node-shaped choices
 *     (`isAllArmsNodeShaped`) — a choice with a literal arm alongside node
 *     arms (e.g. `class_body`'s method/member arms plus a `;` terminator)
 *     first goes through `promoteLiteralChoiceArms`, which turns the
 *     literal arm into a node-shaped one so it reaches this same wrap; a
 *     choice with any OTHER shape (nested SEQ/CHOICE arms — a separated
 *     list, say) is left alone.
 *
 *  2. `repeat($.statement)` — an eligible field referent
 *     (`isEligibleFieldReferent`: a DECLARED supertype from `supertypeNames`,
 *     OR an undeclared de facto union — a hidden rule whose whole body is a
 *     node-shaped CHOICE, `isHiddenPureUnionRule` — the grammar just never
 *     added it to `supertypes:`) as the DIRECT content of a REPEAT, e.g.
 *     `program`'s `field('statements', repeat($.statement))` — is case 1's
 *     own territory extended to a bare symbol instead of a choice: the field
 *     wraps the WHOLE repeat from outside, same as case 1's
 *     `field('elements', repeat(...))` convention, rather than living inside
 *     it. Named after the referent,
 *     pluralized (`pluralizeFieldName` — an array-valued slot gets a plural
 *     name, e.g. `statement` → `statements`, matching `program`'s own
 *     hand-authored name for this exact position). Restricted to a single,
 *     unambiguous case: it's the rule's ONLY unfielded occurrence of that
 *     referent AND the repeat isn't `suppressed` (threaded through the
 *     walk) — a direct arm of a CHOICE (a dispatch alternative, "this arm
 *     names a possible kind", where fielding it would corrupt the
 *     polymorph/dispatch classification every OTHER rule referencing that
 *     choice depends on). Deliberately does NOT extend to a bare supertype
 *     symbol ANYWHERE ELSE (a plain SEQ member, say) — an earlier, wider
 *     version fielding those too regressed python's validate:native
 *     metrics in ways traced to real but scattered causes: wire()'s
 *     clause-hoist/alias-promotion for `yield`'s `'from'` clause depends on
 *     finding that exact bare shape (enrich runs before wire, so fielding
 *     it first hid the promotable shape), and a downstream node-model
 *     polymorph/variant classification pass got confused by
 *     `expression_list`'s newly-fielded first item. The REPEAT-direct-
 *     content variant carries none of that risk — it was clean end to end
 *     for both rust and typescript — so it's the only form kept.
 *
 * Deliberately NOT run from `enrich()`'s fixed-point loop, and deliberately
 * NOT skipping hidden (`_`-prefixed) rule names — both differ from every
 * other pass in this file. Run mid-loop, it would fire before the loop's
 * other passes (and clause-hoist, which runs once after the loop settles)
 * have finished reshaping the rule, risking a wrap that clause-hoist no
 * longer recognizes as hoistable. Run instead as the LAST step of
 * `enrich()`, over the fully-merged `mergedRules` bag (every rule's fixed
 * point already reached, every clause-hoist mint already folded in) — see
 * the call site near `synthesizeFieldEnumRules`. Hidden rules are eligible
 * because by this point they're the final atomic units; nothing later in
 * `enrich()` restructures them further.
 *
 * Some `repeat(choice(...))` shapes still can't be judged safe from grammar
 * structure alone even at this late point — e.g. python's `string_content`,
 * whose plain-text arm is an implicit gap (no real CST child), correctly
 * rendered today via a verbatim `$TEXT` fallback that fielding would
 * displace. That's a corpus fact, not a structural one, so callers pass an
 * explicit `EnrichConfig.skip` list for cases like it — see `enrich()`'s
 * `config` parameter (skips ALL enrich passes for the named rule, not just
 * this one).
 *
 * Note this still runs BEFORE `wire()`, so a rule split apart later by
 * `variant()` (e.g. `typescript`'s `string` choice, whose two arms
 * `variant('double')`/`variant('single')` later mint into their own
 * `_string_double` / `_string_single` rules) is wrapped as ONE rule here —
 * both of its repeat-choice sites get `elements` in the same call, so the
 * second is numbered `elements_2` to avoid colliding with the first.
 */

/** Pluralizes a snake_case grammar field name for an array-valued slot
 * (repeated/array slots get plural names). Deliberately local rather than
 * importing `compiler/model/node-map.ts`'s camelCase `pluralize` — that
 * would pull a later compiler-phase module into the DSL layer, which runs
 * first; grammar field names are snake_case, not camelCase, so the two
 * naming domains don't share a suffix vocabulary anyway. */
function pluralizeFieldName(name: string): string {
	if (name.endsWith('s')) return name;
	if (name.endsWith('y') && !/[aeiou]y$/.test(name)) return name.slice(0, -1) + 'ies';
	return name + 's';
}

/**
 * A hidden rule (`_`-prefixed) whose ENTIRE top-level body — after peeling
 * PREC-family wrappers, same convention as `isAllArmsNodeShaped`'s per-arm
 * peel — is itself a node-shaped CHOICE: a de facto union that just never
 * got added to the grammar's declared `supertypes:` list. Eligible for
 * case 2's `repeat($.referent)` variant the same way a declared supertype
 * is; see `isEligibleFieldReferent`.
 */
function isHiddenPureUnionRule(name: string, mergedRules: Record<string, Rule>): boolean {
	if (!name.startsWith('_')) return false;
	const target = mergedRules[name];
	if (!target) return false;
	let core = target;
	while (isPrecWrapper(core as { type: string })) {
		core = (core as unknown as { content: Rule }).content;
	}
	return isChoiceType((core as { type: string }).type) && isAllArmsNodeShaped(core);
}

function isEligibleFieldReferent(
	name: string,
	mergedRules: Record<string, Rule>,
	supertypeNames: ReadonlySet<string>
): boolean {
	return supertypeNames.has(name) || isHiddenPureUnionRule(name, mergedRules);
}

function sameElementShape(a: Rule, b: Rule): boolean {
	return ruleKey(a as unknown as RuntimeRule) === ruleKey(b as unknown as RuntimeRule);
}

/** Field name for a separated list's element pair (see
 * `fieldSeparatedListElements`): named after the element's own referent
 * when it's a single SYMBOL/ALIAS (matching case 2's
 * `refName.replace(/^_/, '')` convention — singular, since each field
 * occurrence covers one element, not the whole list); falls back to the
 * generic `element` for a choice-shaped element (no single referent to
 * name it after). */
/** Peel PREC wrappers and single-member CHOICEs (they can nest in either
 * order) — a choice-of-one is a transparent wrapper around its referent,
 * not a union, and the slot derivation downstream names the slot after
 * that referent; the field must land on the same name or coverage sees a
 * declared-but-unreferenced field (one fact, two derivations). */
function peelTransparentElementWrappers(rule: Rule): Rule {
	if (isPrecWrapper(rule as { type: string })) {
		return peelTransparentElementWrappers((rule as unknown as { content: Rule }).content);
	}
	const members = (rule as unknown as { members?: Rule[] }).members;
	if (isChoiceType((rule as { type: string }).type) && members?.length === 1) {
		return peelTransparentElementWrappers(members[0]!);
	}
	return rule;
}

function deriveElementFieldName(elementRule: Rule): string {
	const cursor = peelTransparentElementWrappers(elementRule);
	const t = (cursor as { type: string }).type;
	if (t === 'SYMBOL') {
		return (cursor as unknown as { name: string }).name.replace(/^_/, '');
	}
	if (t === 'ALIAS') {
		const value = (cursor as unknown as { value?: string }).value;
		if (typeof value === 'string') return value;
	}
	return 'element';
}

/**
 * A separated list — `seq(element, repeat(seq(SEP, element)), optional(SEP))`
 * (tree-sitter's `commaSep1`-style desugaring; `dsl/list-patterns.ts`'s
 * `detectRepeatSeparator` is the canonical recognizer for the repeat's own
 * `seq(SEP, element)` content) — routes its LEADING element and every
 * REPEATED element into separate per-kind wire buckets today (no field
 * ties them together), needing `_concatInSourceOrder` to reassemble
 * document order at read time.
 *
 * Fields the LEADING element and the repeat's per-iteration element with
 * the SAME name. Tree-sitter tracks a field by name across every position
 * it's attached to within a rule, and `compiler/model/node-map.ts`'s
 * `mergeSlotsByName` already folds same-named fields at different
 * structural positions into one array-valued slot downstream — so two
 * SIBLING per-occurrence fields (this position, and the repeat's own) is
 * enough; no outer field wrapping the whole list is needed. That outer-
 * field approach was tried earlier and abandoned: it collided with an
 * ancestor override's own field at the same position ("fields don't
 * stack" — tree-sitter only keeps the innermost field name). Two sibling
 * fields at different positions carries no such risk.
 *
 * Declines when the leading position is already fielded (nothing to do),
 * when the repeat is the TRAILING-separator form (`seq(element, SEP)` —
 * `detected.trailing`, a different, rarer shape not handled here), or
 * when the leading element and the repeat's element aren't the same shape
 * (`sameElementShape` — a mismatch means this isn't really one list, e.g.
 * an unrelated repeat happens to sit right after some other element).
 *
 * Runs everywhere the shape matches — same as case 1/case 2 above, no
 * pass-specific gate of its own. Rules whose own hand-authored override
 * already fields this exact position exempt themselves the standard way,
 * via `enrich()`'s `config.skip` (see `EnrichConfig.skip`'s doc comment):
 * enrich runs before any override, so it has no way to see one exists.
 * rust's `tuple_type: { '(_type)': field('type') }` was the first found
 * this way — this pass fielding `_type` first left the override's kind
 * search with zero occurrences to find, a hard `tree-sitter generate`
 * failure, not a silent one; `trait_bounds`'s own `'bounds'`-fielding
 * override showed up the same way, as an `accessor-throw: repeated slot
 * "bounds" requires at least one value` — both are skip-listed in their
 * grammar's own `enrich(base, { skip: [...] })` call, same discovery path
 * as python's `string_content`.
 */
function fieldSeparatedListElements(seqRule: Rule, reserve: (base: string) => string): Rule | null {
	const members = (seqRule as unknown as { members?: Rule[] }).members;
	if (!Array.isArray(members)) return null;
	for (let i = 0; i < members.length - 1; i++) {
		const leading = members[i]!;
		if (isFieldType((leading as { type: string }).type)) continue;
		let repeatCursor: Rule = members[i + 1]!;
		const outerPrecStack: Rule[] = [];
		while (isPrecWrapper(repeatCursor as { type: string })) {
			outerPrecStack.push(repeatCursor);
			repeatCursor = (repeatCursor as unknown as { content: Rule }).content;
		}
		if (!isRepeatType((repeatCursor as { type: string }).type)) continue;
		let inner = (repeatCursor as unknown as { content: RuntimeRule }).content;
		const innerPrecStack: Rule[] = [];
		while (isPrecWrapper(inner as unknown as { type: string })) {
			innerPrecStack.push(inner as unknown as Rule);
			inner = (inner as unknown as { content: RuntimeRule }).content;
		}
		const detected = detectRepeatSeparator(inner);
		if (!detected || detected.trailing) continue;
		const innerElement = detected.content as unknown as Rule;
		if (!sameElementShape(leading, innerElement)) continue;
		const fieldName = reserve(deriveElementFieldName(leading));

		const innerMembers = (inner as unknown as { members: Rule[] }).members;
		const newInnerMembers = innerMembers.slice();
		const elementIdx = innerMembers.indexOf(innerElement as unknown as Rule);
		newInnerMembers[elementIdx] = makeField(fieldName, innerElement);
		let rebuiltInner: Rule = { ...(inner as unknown as object), members: newInnerMembers } as Rule;
		for (let j = innerPrecStack.length - 1; j >= 0; j--) {
			rebuiltInner = { ...(innerPrecStack[j] as object), content: rebuiltInner } as Rule;
		}
		let rebuiltRepeat: Rule = { ...(repeatCursor as object), content: rebuiltInner } as Rule;
		for (let j = outerPrecStack.length - 1; j >= 0; j--) {
			rebuiltRepeat = { ...(outerPrecStack[j] as object), content: rebuiltRepeat } as Rule;
		}

		const newMembers = members.slice();
		newMembers[i] = makeField(fieldName, leading);
		newMembers[i + 1] = rebuiltRepeat;
		return { ...(seqRule as object), members: newMembers } as Rule;
	}
	return null;
}

function applyNodeChoiceFieldWrap(
	ruleName: string,
	rule: Rule,
	mergedRules: Record<string, Rule>,
	supertypeNames: ReadonlySet<string>
): Rule {
	const usedNames = new Set<string>();
	collectAllFieldNamesDeep(rule, usedNames);
	let changed = false;

	const reserve = (base: string): string => {
		if (!usedNames.has(base)) {
			usedNames.add(base);
			return base;
		}
		let n = 2;
		while (usedNames.has(`${base}_${n}`)) n++;
		const name = `${base}_${n}`;
		usedNames.add(name);
		return name;
	};

	const refCounts = new Map<string, number>();
	const countEligibleRefs = (r: Rule): void => {
		if (isFieldType((r as { type: string }).type)) return;
		if (isSymbolType((r as { type: string }).type)) {
			const name = (r as unknown as { name: string }).name;
			if (isEligibleFieldReferent(name, mergedRules, supertypeNames)) {
				refCounts.set(name, (refCounts.get(name) ?? 0) + 1);
			}
			return;
		}
		const bag = r as unknown as { members?: readonly Rule[]; content?: Rule };
		if (Array.isArray(bag.members)) {
			for (const m of bag.members) countEligibleRefs(m);
		} else if (bag.content && typeof bag.content === 'object') {
			countEligibleRefs(bag.content);
		}
	};
	countEligibleRefs(rule);

	// `suppressed` is true exactly when case 2 must not fire at `r`'s own
	// top position because an established convention already owns it:
	// either `r` is a direct member of a CHOICE (an alternative in a
	// dispatch decision — see the function doc comment), or `r` is the
	// DIRECT content of a REPEAT (case 1's own territory — a bare
	// supertype symbol there is the standard `field(name, repeat($.super))`
	// shape, e.g. `program`'s `field('statements', repeat($.statement))`;
	// fielding the inner `$.statement` too would nest a field inside a
	// field, and tree-sitter fields don't stack — the outer field would
	// silently end up with zero children, the SAME "ancestor collision"
	// class as the rust `trait_bounds` case found earlier).
	const visit = (r: Rule, suppressed: boolean = false): Rule => {
		if (isFieldType((r as { type: string }).type)) return r;

		if (!suppressed && isRepeatType((r as { type: string }).type)) {
			const content = (r as unknown as { content: Rule }).content;
			const precStack: Rule[] = [];
			let inner = content;
			while (isPrecWrapper(inner as { type: string })) {
				precStack.push(inner);
				inner = (inner as unknown as { content: Rule }).content;
			}
			const rebuildRepeat = (newInner: Rule): Rule => {
				let rebuiltInner = newInner;
				for (let i = precStack.length - 1; i >= 0; i--) {
					rebuiltInner = { ...(precStack[i] as object), content: rebuiltInner } as Rule;
				}
				return { ...(r as object), content: rebuiltInner } as Rule;
			};
			// Case 2, repeat variant: `inner` is itself a bare eligible
			// supertype symbol — `repeat($.statement)` is exactly
			// `program`'s `field('statements', repeat($.statement))` shape.
			// Field the WHOLE repeat from outside (never suppress and skip
			// — an earlier version tried that; the codebase's own
			// `field(name, repeat($.super))` convention is what
			// hand-authored overrides expect to find and rename).
			if (isSymbolType((inner as { type: string }).type)) {
				const refName = (inner as unknown as { name: string }).name;
				if (isEligibleFieldReferent(refName, mergedRules, supertypeNames) && refCounts.get(refName) === 1) {
					changed = true;
					const fieldName = pluralizeFieldName(refName.replace(/^_/, ''));
					return makeField(reserve(fieldName), rebuildRepeat(inner));
				}
			}
			let visitedInner = visit(inner, true);
			if (
				isChoiceType((visitedInner as { type: string }).type) &&
				!isAllArmsNodeShaped(visitedInner) &&
				isAllArmsNodeOrLiteralShaped(visitedInner)
			) {
				// A mixed node+literal choice (e.g. class_body's method/member
				// arms plus its `;` terminator) — promote the literal arm(s) into
				// node-shaped symbols first, then fall through to the ordinary
				// all-node-shaped field wrap below. See
				// `promoteLiteralChoiceArms`'s doc comment for why this is safe.
				const promoted = promoteLiteralChoiceArms(visitedInner, mergedRules);
				if (promoted) visitedInner = promoted;
			}
			if (isChoiceType((visitedInner as { type: string }).type) && isAllArmsNodeShaped(visitedInner)) {
				changed = true;
				// Field wraps the WHOLE repeat (matching the codebase's existing
				// `field(name, repeat(...))` convention — e.g. `array: {1:
				// field('elements')}` — rather than living inside it) so an
				// existing hand-authored `field(newName)` override targeting this
				// same position sees a plain top-level FIELD and renames it via
				// `resolveFieldPlaceholder`'s ordinary unwrap-and-rewrap path,
				// instead of finding a bare REPEAT and nesting a second field
				// around it.
				return makeField(reserve('elements'), rebuildRepeat(visitedInner));
			}
			if (visitedInner === inner) return r;
			return rebuildRepeat(visitedInner);
		}

		if (isSeqType((r as { type: string }).type)) {
			const sepListRewrite = fieldSeparatedListElements(r, reserve);
			if (sepListRewrite) {
				changed = true;
				r = sepListRewrite;
			}
		}

		const bag = r as unknown as { members?: readonly Rule[]; content?: Rule };
		if (Array.isArray(bag.members)) {
			const memberSuppressed = isChoiceType((r as { type: string }).type);
			let memberChanged = false;
			const newMembers = bag.members.map((m) => {
				const nm = visit(m, memberSuppressed);
				if (nm !== m) memberChanged = true;
				return nm;
			});
			return memberChanged ? ({ ...(r as object), members: newMembers } as Rule) : r;
		}
		if (bag.content && typeof bag.content === 'object') {
			const nc = visit(bag.content, suppressed);
			return nc !== bag.content ? ({ ...(r as object), content: nc } as Rule) : r;
		}
		return r;
	};

	const result = visit(rule);
	return changed ? result : rule;
}

/**
 * Resolve the grammar's `word` declaration to a rule NAME across both
 * runtimes. Under sittir's grammarFn it is already a string; in the emitted
 * `.sittir/grammar.js` (which runs enrich BEFORE tree-sitter's native
 * `grammar()`) it is still the raw `$ => $.identifier` callback — invoke it
 * with the same symbol-shaped proxy `extractSupertypeNames` uses and take
 * the returned symbol's name. Returns null when absent/unresolvable (the
 * word matcher then falls back via matchesWordShape).
 */
function extractWordName(word: unknown): string | null {
	if (typeof word === 'string') return word;
	if (typeof word !== 'function') return null;
	const dollar = new Proxy(
		{},
		{
			get(_t, prop) {
				if (typeof prop === 'string') return { type: 'SYMBOL', name: prop };
				return undefined;
			}
		}
	);
	try {
		const result = (word as (proxy: unknown) => unknown)(dollar);
		const name = (result as { name?: unknown } | undefined)?.name;
		return typeof name === 'string' ? name : null;
	} catch {
		return null;
	}
}

function harvestSupertypeNames(result: unknown): Set<string> {
	const names = new Set<string>();
	if (!Array.isArray(result)) return names;
	for (const r of result) {
		if (typeof r === 'string') {
			names.add(r);
			continue;
		}
		const n = (r as { name?: unknown })?.name;
		if (typeof n === 'string') names.add(n);
	}
	return names;
}

// ---------------------------------------------------------------------------
// Direct-mutation builders
// ---------------------------------------------------------------------------

export function nativeRuleFn<F>(...names: string[]): F {
	const g = globalThis as Record<string, unknown>;
	for (const name of names) {
		if (typeof g[name] === 'function') return g[name] as F;
	}
	throw new Error(
		`enrich: no global ${names.join('()/')}() — enrich must run inside a DSL runtime ` +
			`(sittir evaluate.ts or tree-sitter CLI; tests inject via _test-helpers.ts)`
	);
}

function makeField(name: string, content: unknown): Rule {
	const field = nativeRuleFn<(n: string, c: unknown) => Rule>('field');
	return { ...field(name, content), metadata: makeRuleMetadata({ fieldSource: 'enriched' }) };
}

/** The branches of a choice whose every arm is a single, distinctly-named
 *  field — the shape that means "exactly one of these". Reached either
 *  directly or through a hidden rule, since such a choice is usually spelled
 *  as a helper (`_line_doc_comment_marker`) rather than inline.
 *
 *  Two arms sharing a field name are ONE slot with a union value, not a set
 *  of alternatives, so a repeated name declines. */
function exclusiveFieldChoiceBranches(member: Rule, rulesBag: Record<string, Rule>): readonly Rule[] | undefined {
	let target: Rule | undefined = member;
	if (isSymbolType((member as { type?: string }).type)) {
		const name = (member as { name?: string }).name;
		if (typeof name !== 'string' || !name.startsWith('_')) return undefined;
		target = rulesBag[name];
	}
	if (!target || !isChoiceType((target as { type?: string }).type)) return undefined;
	const branches = (target as unknown as { members?: Rule[] }).members;
	if (!Array.isArray(branches) || branches.length < 2) return undefined;
	const names = new Set<string>();
	for (const branch of branches) {
		if (!isFieldType((branch as { type?: string }).type)) return undefined;
		const name = (branch as { name?: string }).name;
		if (typeof name !== 'string') return undefined;
		names.add(name);
	}
	return names.size === branches.length ? branches : undefined;
}

/**
 * Exclusive field-choice distribution — `seq(…, choice(field('a', X),
 * field('b', Y)), …)` becomes `choice(seq(…, field('a', X), …), seq(…,
 * field('b', Y), …))`.
 *
 * Arms that are each a single, distinctly-named field are ALTERNATIVES: only
 * one of them is ever parsed. Left as a choice sitting inside a sequence they
 * land on ONE kind as N independent optional fields, and that flattening
 * admits combinations no parse produces — several of the fields at once, or
 * none of them. Rust's doc comments are the case in hand: `///` and `//!` are
 * the `outer`/`inner` marker fields of a single `line_comment` arm, so the
 * flattened kind accepts both markers together, and also neither, the latter
 * rendering a doc-comment kind as a plain `//` comment.
 *
 * Distributing the choice over its sequence gives each alternative its own
 * arm, which the mint downstream lifts into its own kind. Exclusivity then
 * rides on the kind rather than on a convention nothing enforces, and each
 * alternative gains a constructor a caller can name.
 *
 * Language-identical: `seq(A, choice(X, Y), B)` and `choice(seq(A, X, B),
 * seq(A, Y, B))` accept the same strings.
 */
function distributeExclusiveFieldChoices(rule: Rule, rulesBag: Record<string, Rule>): Rule {
	const seqFn = nativeRuleFn<(...args: unknown[]) => Rule>('seq');
	const choiceFn = nativeRuleFn<(...args: unknown[]) => Rule>('choice');

	/** One rule again, choosing between the alternatives when there are
	 *  several. */
	const collapse = (alts: readonly Rule[]): Rule =>
		alts.length === 1
			? alts[0]!
			: ({ ...choiceFn(...alts), metadata: makeRuleMetadata({ author: 'enrich' }) } as Rule);

	/** The alternatives a node expands to — normally just itself. A sequence
	 *  carrying an exclusive field choice expands to one alternative per
	 *  branch, and an enclosing CHOICE absorbs them as its own arms instead of
	 *  nesting a second choice inside one arm. That flattening is what keeps
	 *  the arms individually addressable, both to the mint that lifts them
	 *  into kinds and to the variant paths that name them. */
	const expand = (node: Rule): readonly Rule[] => {
		if (!node || typeof node !== 'object') return [node];
		// Rebuild children first, so a choice uncovered deeper has already
		// distributed by the time this level inspects its own members.
		let out: Rule = node;
		const members = (node as unknown as { members?: Rule[] }).members;
		const content = (node as unknown as { content?: Rule }).content;
		if (Array.isArray(members)) {
			const next = isChoiceType((node as { type?: string }).type)
				? members.flatMap((m) => expand(m))
				: members.map((m) => collapse(expand(m)));
			if (next.length !== members.length || next.some((m, i) => m !== members[i]))
				out = { ...node, members: next } as Rule;
		} else if (content && typeof content === 'object') {
			const next = collapse(expand(content));
			if (next !== content) out = { ...node, content: next } as Rule;
		}

		if (!isSeqType((out as { type?: string }).type)) return [out];
		const seqMembers = (out as unknown as { members?: Rule[] }).members;
		if (!Array.isArray(seqMembers)) return [out];
		for (let i = 0; i < seqMembers.length; i += 1) {
			const branches = exclusiveFieldChoiceBranches(seqMembers[i]!, rulesBag);
			if (!branches) continue;
			// Re-expand each arm, so a sequence carrying two such choices
			// distributes over both.
			return branches.flatMap((branch) => {
				const swapped = [...seqMembers];
				swapped[i] = branch;
				return expand(seqFn(...swapped));
			});
		}
		return [out];
	};

	return collapse(expand(rule));
}

/**
 * Pass 6 — repeat-union field promotion: an un-fielded `repeat($._union)`
 * (bare hidden-CHOICE symbol content) gets the whole repeat wrapped in
 * `field('<stripped>', repeat(...))`.
 *
 * An unnamed union repeat forces the native read to bucket children
 * per concrete kind and the wrap to re-merge them (`_concatInSourceOrder`),
 * which cannot order text-collapsed scalar elements (no `$span` /
 * `$childIndex`) and does not guarantee cross-kind interleaving even for
 * node stubs. A field-keyed read delivers ONE array in cursor order and
 * never enters that path. The field name is the union symbol's name
 * stripped of leading underscores — the same name wrapper-deletion
 * derives for the slot, so storage keys are stable.
 *
 * Positions already under a `field()` (authored or override-applied) are
 * owned — never re-wrapped. Grammar-declared supertype repeats that reach
 * enrich un-fielded are equally eligible: "bare at enrich time" IS the
 * unnamed-slot population, since differently-named positions get their
 * field from overrides before enrich runs.
 */
function applyRepeatUnionFieldPromotion(ruleName: string, rule: Rule, rulesBag: Record<string, Rule>): Rule {
	// Names owned by fields that existed BEFORE this pass — those positions
	// (or their siblings) claimed the name deliberately; never shadow them.
	const preExistingFieldNames = new Set<string>();
	const collectNames = (node: Rule): void => {
		const n = node as unknown as {
			type: string;
			name?: unknown;
			content?: Rule;
			members?: Rule[];
			metadata?: { fieldSource?: string };
		};
		if (isFieldType(n.type) && typeof n.name === 'string' && n.metadata?.fieldSource !== 'enriched') {
			preExistingFieldNames.add(n.name);
		}
		if (n.members) for (const m of n.members) collectNames(m);
		else if (n.content) collectNames(n.content);
	};
	collectNames(rule);
	// This pass's own mints, keyed by the union symbol they name. The SAME
	// name recurring for the SAME symbol across sibling CHOICE arms is the
	// normal shape (each delimiter arm of a token tree carries the same
	// repeat) — mutually exclusive at parse time, one shared slot at model
	// time. A DIFFERENT symbol wanting an already-minted name is a real
	// collision and skips.
	const mintedBySymbol = new Map<string, string>();
	const mintedNames = new Set<string>();

	const rebuild = (node: Rule): Rule => {
		const n = node as unknown as { type: string; content?: Rule; members?: Rule[] };
		// A fielded position is owned — its content is that field's business.
		if (isFieldType(n.type)) return node;
		if (isRepeatType(n.type) && n.content) {
			let inner: Rule = n.content;
			while (isPrecWrapper(inner as { type: string })) inner = (inner as unknown as { content: Rule }).content;
			const sym = inner as unknown as { type: string; name?: unknown };
			if (sym.type === 'SYMBOL' && typeof sym.name === 'string' && sym.name.startsWith('_')) {
				const target = rulesBag[sym.name];
				if (target !== undefined && isChoiceType((target as { type: string }).type)) {
					// Repeated/array slots get plural names — same convention
					// pluralizeFieldName serves everywhere else in enrich.
					const fieldName = mintedBySymbol.get(sym.name) ?? pluralizeFieldName(sym.name.replace(/^_+/, ''));
					const mintedForOther = mintedNames.has(fieldName) && mintedBySymbol.get(sym.name) !== fieldName;
					if (preExistingFieldNames.has(fieldName) || mintedForOther) {
						reportSkip('repeat-union-field', ruleName, `field '${fieldName}' already exists`);
						return node;
					}
					mintedBySymbol.set(sym.name, fieldName);
					mintedNames.add(fieldName);
					return makeField(fieldName, node);
				}
			}
			const content = rebuild(n.content);
			return content === n.content ? node : ({ ...node, content } as Rule);
		}
		if (n.members) {
			let changed = false;
			const members = n.members.map((m) => {
				const r = rebuild(m);
				if (r !== m) changed = true;
				return r;
			});
			return changed ? ({ ...node, members } as Rule) : node;
		}
		if (n.content) {
			const content = rebuild(n.content);
			return content === n.content ? node : ({ ...node, content } as Rule);
		}
		return node;
	};
	return rebuild(rule);
}

function makeSymbol(name: string): Rule {
	// Both runtimes inject the symbol constructor under the SAME name `sym`
	// (sittir's `saveAndInjectDslGlobals` shadows tree-sitter's baseline `sym`).
	const symFn = nativeRuleFn<(n: string) => Rule>('sym');
	return symFn(name);
}

function registerKwRule(
	stringLiteral: Rule,
	keyword: string,
	kwRules: Record<string, Rule>,
	rulesBag: Record<string, Rule>
): Rule | null {
	const hiddenName = `_kw_${keyword}`;
	if (hiddenName in kwRules) return makeSymbol(hiddenName);
	const existing = rulesBag[hiddenName];
	if (existing === undefined) {
		kwRules[hiddenName] = stringLiteral;
		return makeSymbol(hiddenName);
	}
	// The name is a convention (`_<kw>_marker`), not a reservation — a base
	// grammar can define its own rule at this exact name. Reuse it when it
	// structurally IS this keyword (ruleKey covers type/named along with
	// value, so an existing rule that displays the same text but visibly —
	// e.g. a `named: true` ALIAS — correctly does NOT match); only decline
	// on a genuine, unrelated collision.
	if (ruleKey(existing as RuntimeRule) === ruleKey(stringLiteral as RuntimeRule)) {
		return makeSymbol(hiddenName);
	}
	return null;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function normalizeMember(m: unknown): {
	type: string;
	value?: string;
	content?: unknown;
	members?: unknown[];
	name?: string;
} {
	if (typeof m === 'string') return { type: 'STRING', value: m };
	if (m instanceof RegExp) return { type: 'PATTERN', value: m.source };
	return (m as { type: string }) ?? { type: 'UNKNOWN' };
}

function collectFieldNamesRuntime(rule: Rule): Set<string> {
	const names = new Set<string>();
	if (!isSeqType(rule.type)) return names;
	const members = (rule as unknown as { members: unknown[] }).members;
	for (const raw of members) {
		const m = normalizeMember(raw);
		if (isFieldType(m.type) && typeof m.name === 'string') {
			names.add(m.name);
			continue;
		}
		const peeled = peelOptional(m as unknown as Rule);
		if (peeled.isOptional) {
			const innerN = normalizeMember(peeled.inner);
			if (isFieldType(innerN.type) && typeof innerN.name === 'string') {
				names.add(innerN.name);
			}
		}
	}
	return names;
}

function peelOptional(rule: Rule): { inner: Rule; isOptional: boolean } {
	if (isOptionalType(rule.type)) {
		return {
			inner: (rule as unknown as { content: Rule }).content,
			isOptional: true
		};
	}
	if (isChoiceType(rule.type)) {
		const members = (rule as unknown as { members: Array<{ type: string }> }).members;
		if (members.length === 2) {
			const blankIdx = members.findIndex((m) => m.type === 'BLANK');
			if (blankIdx !== -1) {
				const inner = members[1 - blankIdx] as unknown as Rule;
				return { inner, isOptional: true };
			}
		}
	}
	return { inner: rule, isOptional: false };
}

function reportSkip(pass: string, ruleName: string, reason: string): void {
	if (process.env.SITTIR_QUIET) return;
	process.stderr.write(`enrich: skipped ${pass} on ${ruleName} (${reason})\n`);
}

// ---------------------------------------------------------------------------
// Pass 1+3: symbol-to-field promotion
// ---------------------------------------------------------------------------
// Wraps unique bare symbols as field(name, symbol) on non-hidden rules.
// Handles bare, optional(symbol), optional(seq(symbol, anon...)) shapes.
// Guards: skip hidden rules, duplicate symbols, claimed names, _-prefix
// (except supertypes). See compiler-phase-glossary.md for full details.

interface SymbolTarget {
	readonly name: string;
	readonly symbolRule: Rule;
	wrap(fieldNode: Rule): Rule;
}

function isBareShapeTarget(member: Rule, target: SymbolTarget): boolean {
	return target.symbolRule === member;
}

function detectSymbolTarget(member: Rule): SymbolTarget | null {
	// Shape 1: bare SYMBOL.
	if (isSymbolType(member.type) && typeof (member as { name?: unknown }).name === 'string') {
		const name = (member as { name: string }).name;
		return {
			name,
			symbolRule: member,
			wrap: (fieldNode) => fieldNode
		};
	}
	const peeled = peelOptional(member);
	if (!peeled.isOptional) return null;
	const innerN = normalizeMember(peeled.inner);
	// Shape 2: optional(SYMBOL).
	if (isSymbolType(innerN.type) && typeof innerN.name === 'string') {
		return {
			name: innerN.name,
			symbolRule: peeled.inner,
			wrap: (fieldNode) => rebuildOptional(member, fieldNode)
		};
	}
	// Shape 3: optional(seq(SYMBOL, <anon…>)) — exactly one SYMBOL,
	// all other seq members anonymous (STRING / PATTERN).
	if (!isSeqType(innerN.type)) return null;
	const seqMembers = (peeled.inner as unknown as { members: Rule[] }).members;
	let symIdx = -1;
	for (let i = 0; i < seqMembers.length; i++) {
		const sn = normalizeMember(seqMembers[i]!);
		if (isSymbolType(sn.type) && typeof sn.name === 'string') {
			if (symIdx !== -1) return null; // >1 SYMBOL — too complex
			symIdx = i;
		} else if (!isStringType(sn.type) && sn.type !== 'PATTERN') {
			return null; // non-anonymous, non-symbol — too complex
		}
	}
	if (symIdx === -1) return null;
	const symMember = seqMembers[symIdx]!;
	const sn = normalizeMember(symMember);
	if (!isSymbolType(sn.type) || typeof sn.name !== 'string') return null;
	const seqRule = peeled.inner;
	return {
		name: sn.name,
		symbolRule: symMember,
		wrap: (fieldNode) => {
			const newSeqMembers = seqMembers.map((mm, i) => (i === symIdx ? fieldNode : mm));
			const newSeq = { ...seqRule, members: newSeqMembers } as Rule;
			return rebuildOptional(member, newSeq);
		}
	};
}

function countSymbolsInRepeat(
	node: Rule | undefined | null,
	kindCounts: Map<string, number>,
	inRepeat: boolean = false
): void {
	if (!node) return;
	const t = (node as { type?: string }).type;
	if (!t) return;
	if (isFieldType(t)) return;
	if (t === 'ALIAS') return;
	if (isSymbolType(t)) {
		if (!inRepeat) return;
		const name = (node as unknown as { name?: string }).name;
		if (typeof name === 'string') {
			kindCounts.set(name, (kindCounts.get(name) ?? 0) + 1);
		}
		return;
	}
	if (isRepeatType(t)) {
		const content = (node as unknown as { content?: Rule }).content;
		countSymbolsInRepeat(content, kindCounts, true);
		return;
	}
	if (isSeqType(t) || isChoiceType(t)) {
		const members = (node as unknown as { members?: Rule[] }).members;
		if (Array.isArray(members)) {
			for (const m of members) countSymbolsInRepeat(m, kindCounts, inRepeat);
		}
		return;
	}
	if (isOptionalType(t) || isPrecWrapper(node as { type: string })) {
		const content = (node as unknown as { content?: Rule }).content;
		countSymbolsInRepeat(content, kindCounts, inRepeat);
		return;
	}
	// STRING / PATTERN / TOKEN / BLANK — leaves with no symbols.
}

function applySymbolToField(ruleName: string, rule: Rule, supertypeNames: ReadonlySet<string>): Rule {
	if (ruleName.startsWith('_')) return rule; // skip hidden helpers
	// Peel prec wrappers; rebuild on top after field-wrapping.
	const precStack: Rule[] = [];
	let cursor: Rule = rule;
	while (isPrecWrapper(cursor as { type: string })) {
		precStack.push(cursor);
		cursor = (cursor as unknown as { content: Rule }).content;
	}
	if (!isSeqType(cursor.type)) {
		// Not a top-level seq — check for repeat/repeat1 wrapping a seq.
		return tryPromoteInRepeatSeq(ruleName, rule, cursor, precStack, supertypeNames);
	}
	const members = (cursor as unknown as { members: Rule[] }).members;
	// Direct-position counts power the duplicate-numbering decision:
	// when the same kind appears at >1 direct seq positions, those get
	// numbered (`<kind>1`, `<kind>2`). Nested-repeat appearances are
	// tracked separately and disqualify direct positions entirely so
	// the direct-position field doesn't collide with whatever
	// `promoteInsideRepeatMembers` does inside the repeat's seq.
	const directKindCounts = new Map<string, number>();
	const targetByIdx: Array<SymbolTarget | null> = members.map((m) => {
		const t = detectSymbolTarget(m);
		if (!t) return null;
		// Supertype-prefixed kinds (`_expression`, `_type`, ...) only
		// wrap when the member IS the bare SYMBOL (Shape 1). Wrapping
		// Shape 2 (`optional($._expression)`) or Shape 3
		// (`optional(seq($._expression, anon))`) adds an enriched FIELD
		// inside an OPTIONAL — and user overrides often apply
		// `field('newname')` patches to the SAME position via
		// `transform()`. `resolveFieldPlaceholder` (transform.ts) only
		// peels a direct enriched FIELD; one nested inside OPTIONAL
		// survives, producing `FIELD(override, OPTIONAL(FIELD(enriched,
		// SYMBOL)))` that downstream codegen can't handle. Non-supertype
		// kinds keep the original three-shape behavior — their wrap
		// names are the kind itself (e.g. `visibility_modifier`) and
		// rarely collide with override targets.
		if (t.name.startsWith('_') && !isBareShapeTarget(m, t)) return null;
		return t;
	});
	for (const t of targetByIdx) {
		if (t) directKindCounts.set(t.name, (directKindCounts.get(t.name) ?? 0) + 1);
	}
	// Nested-repeat counts disqualify direct-position wrapping for any
	// kind that also surfaces inside a repeat — splitting it across
	// $fields (direct) and $children (inside-repeat) breaks variadic
	// factory reconstruction.
	const nestedRepeatCounts = new Map<string, number>();
	for (const m of members) {
		countSymbolsInRepeat(m, nestedRepeatCounts);
	}
	const existing = collectFieldNamesRuntime(cursor);
	// Per-rule sequence counters for numbered-duplicate naming. Reset
	// per seq so each numbered-suffix sequence starts at 1 within its
	// own outer seq.
	const sequenceCounters = new Map<string, number>();
	let changed = false;
	const newMembers = members.map((m, i) => {
		const t = targetByIdx[i];
		if (!t) return m;
		let baseFieldName = t.name;
		if (t.name.startsWith('_')) {
			if (!supertypeNames.has(t.name)) return m;
			baseFieldName = t.name.slice(1);
		}
		if ((nestedRepeatCounts.get(t.name) ?? 0) > 0) return m;
		const directCount = directKindCounts.get(t.name) ?? 0;
		let fieldName = baseFieldName;
		if (directCount > 1) {
			// Numbered duplicates: 1-based sequence index per kind.
			const seqIdx = (sequenceCounters.get(t.name) ?? 0) + 1;
			sequenceCounters.set(t.name, seqIdx);
			fieldName = `${baseFieldName}${seqIdx}`;
		}
		if (existing.has(fieldName)) {
			reportSkip('symbol-to-field', ruleName, `field '${fieldName}' already exists`);
			return m;
		}
		existing.add(fieldName);
		changed = true;
		const fieldNode = makeField(fieldName, t.symbolRule);
		return t.wrap(fieldNode);
	});
	// Second pass: descend into repeat/repeat1 members whose content is a
	// seq. Promotes bare symbols inside the inner seq to field() wrappers.
	// Pattern: seq("(", repeat(seq($.attr, $.content)), ")")
	// → the repeat member's inner seq gets its bare symbols field-wrapped.
	// Pass the combined kindCounts (direct + nested) so the repeat-inner
	// pass keeps the same outer-shadow-prevention invariant as before.
	const combinedKindCounts = new Map<string, number>(directKindCounts);
	for (const [k, v] of nestedRepeatCounts) {
		combinedKindCounts.set(k, (combinedKindCounts.get(k) ?? 0) + v);
	}
	const finalMembers = promoteInsideRepeatMembers(ruleName, newMembers, supertypeNames, existing, combinedKindCounts);
	if (finalMembers === newMembers && !changed) return rule;
	let result: Rule = { ...cursor, members: finalMembers } as Rule;
	for (let i = precStack.length - 1; i >= 0; i--) {
		result = { ...precStack[i]!, content: result } as Rule;
	}
	return result;
}

function promoteInsideRepeatMembers(
	ruleName: string,
	members: Rule[],
	supertypeNames: ReadonlySet<string>,
	existing: Set<string>,
	outerKindCounts: Map<string, number>
): Rule[] {
	let anyRepeatChanged = false;
	const result = members.map((m) => {
		const rebuilt = tryPromoteInRepeatMember(ruleName, m, supertypeNames, existing, outerKindCounts);
		if (rebuilt === null) return m;
		anyRepeatChanged = true;
		return rebuilt;
	});
	if (!anyRepeatChanged) return members;
	return result;
}

function tryPromoteInRepeatMember(
	ruleName: string,
	member: Rule,
	supertypeNames: ReadonlySet<string>,
	existing: Set<string>,
	outerKindCounts: Map<string, number>
): Rule | null {
	// Peel prec wrappers on the member itself.
	let cursor: Rule = member;
	const memberPrecStack: Rule[] = [];
	while (isPrecWrapper(cursor as { type: string })) {
		memberPrecStack.push(cursor);
		cursor = (cursor as unknown as { content: Rule }).content;
	}
	if (!isRepeatType(cursor.type)) return null;

	// Peel prec wrappers on the repeat's content.
	let inner = (cursor as unknown as { content: Rule }).content;
	const innerPrecStack: Rule[] = [];
	while (isPrecWrapper(inner as { type: string })) {
		innerPrecStack.push(inner);
		inner = (inner as unknown as { content: Rule }).content;
	}
	if (!isSeqType(inner.type)) return null;

	const innerMembers = (inner as unknown as { members: Rule[] }).members;
	const innerTargets: Array<SymbolTarget | null> = innerMembers.map((m) => {
		const t = detectSymbolTarget(m);
		if (!t) return null;
		// Same supertype-only-bare gate as `applySymbolToField` —
		// see that function for the rationale.
		if (t.name.startsWith('_') && !isBareShapeTarget(m, t)) return null;
		return t;
	});

	// Direct-position counts within the repeat's inner seq drive the
	// numbered-duplicate naming; deeper-nested repeats disqualify entirely.
	const directKindCounts = new Map<string, number>();
	for (const t of innerTargets) {
		if (t) directKindCounts.set(t.name, (directKindCounts.get(t.name) ?? 0) + 1);
	}
	const nestedRepeatCounts = new Map<string, number>();
	for (const im of innerMembers) {
		countSymbolsInRepeat(im, nestedRepeatCounts);
	}

	const innerExisting = collectFieldNamesRuntime(inner);
	const sequenceCounters = new Map<string, number>();

	let innerChanged = false;
	const newInnerMembers = innerMembers.map((im, i) => {
		const t = innerTargets[i];
		if (!t) return im;
		let baseFieldName = t.name;
		if (t.name.startsWith('_')) {
			if (!supertypeNames.has(t.name)) return im;
			baseFieldName = t.name.slice(1);
		}
		if ((nestedRepeatCounts.get(t.name) ?? 0) > 0) return im;
		// Skip when the same symbol kind appears in the outer seq — promoting
		// it here would split the kind across $fields (inner) and $children
		// (outer bare symbol), which variadic factories can't reconstruct.
		if ((outerKindCounts.get(t.name) ?? 0) > 0) return im;
		const directCount = directKindCounts.get(t.name) ?? 0;
		let fieldName = baseFieldName;
		if (directCount > 1) {
			const seqIdx = (sequenceCounters.get(t.name) ?? 0) + 1;
			sequenceCounters.set(t.name, seqIdx);
			fieldName = `${baseFieldName}${seqIdx}`;
		}
		if (innerExisting.has(fieldName)) return im;
		if (existing.has(fieldName)) {
			reportSkip('symbol-to-field', ruleName, `field '${fieldName}' already exists (outer seq)`);
			return im;
		}
		innerExisting.add(fieldName);
		innerChanged = true;
		const fieldNode = makeField(fieldName, t.symbolRule);
		return t.wrap(fieldNode);
	});

	if (!innerChanged) return null;

	// Rebuild: inner seq → inner prec stack → repeat → member prec stack.
	let rebuilt: Rule = { ...inner, members: newInnerMembers } as Rule;
	for (let i = innerPrecStack.length - 1; i >= 0; i--) {
		rebuilt = { ...innerPrecStack[i]!, content: rebuilt } as Rule;
	}
	rebuilt = { ...cursor, content: rebuilt } as Rule;
	for (let i = memberPrecStack.length - 1; i >= 0; i--) {
		rebuilt = { ...memberPrecStack[i]!, content: rebuilt } as Rule;
	}
	return rebuilt;
}

function tryPromoteInRepeatSeq(
	ruleName: string,
	rule: Rule,
	cursor: Rule,
	outerPrecStack: Rule[],
	supertypeNames: ReadonlySet<string>
): Rule {
	if (!isRepeatType(cursor.type)) return rule;
	let inner = (cursor as unknown as { content: Rule }).content;
	// Peel prec wrappers on the inner content (e.g.
	// `repeat(prec.left(seq($.a, $.b)))`).
	const innerPrecStack: Rule[] = [];
	while (isPrecWrapper(inner as { type: string })) {
		innerPrecStack.push(inner);
		inner = (inner as unknown as { content: Rule }).content;
	}
	if (!isSeqType(inner.type)) return rule;
	const members = (inner as unknown as { members: Rule[] }).members;
	const directKindCounts = new Map<string, number>();
	// Same supertype-only-bare gate as `applySymbolToField`.
	const targetByIdx: Array<SymbolTarget | null> = members.map((m) => {
		const t = detectSymbolTarget(m);
		if (!t) return null;
		if (t.name.startsWith('_') && !isBareShapeTarget(m, t)) return null;
		return t;
	});
	for (const t of targetByIdx) {
		if (t) directKindCounts.set(t.name, (directKindCounts.get(t.name) ?? 0) + 1);
	}
	// Count symbols in further-nested repeats within the inner seq so
	// a symbol appearing both as a direct seq member and inside a
	// nested repeat is disqualified from numbering/wrapping.
	const nestedRepeatCounts = new Map<string, number>();
	for (const m of members) {
		countSymbolsInRepeat(m, nestedRepeatCounts);
	}
	const existing = collectFieldNamesRuntime(inner);
	const sequenceCounters = new Map<string, number>();
	let changed = false;
	const newMembers = members.map((m, i) => {
		const t = targetByIdx[i];
		if (!t) return m;
		let baseFieldName = t.name;
		if (t.name.startsWith('_')) {
			if (!supertypeNames.has(t.name)) return m;
			baseFieldName = t.name.slice(1);
		}
		if ((nestedRepeatCounts.get(t.name) ?? 0) > 0) return m;
		const directCount = directKindCounts.get(t.name) ?? 0;
		let fieldName = baseFieldName;
		if (directCount > 1) {
			const seqIdx = (sequenceCounters.get(t.name) ?? 0) + 1;
			sequenceCounters.set(t.name, seqIdx);
			fieldName = `${baseFieldName}${seqIdx}`;
		}
		if (existing.has(fieldName)) {
			reportSkip('symbol-to-field', ruleName, `field '${fieldName}' already exists`);
			return m;
		}
		existing.add(fieldName);
		changed = true;
		const fieldNode = makeField(fieldName, t.symbolRule);
		return t.wrap(fieldNode);
	});
	if (!changed) return rule;
	// Rebuild: inner seq → inner prec stack → repeat → outer prec stack
	let result: Rule = { ...inner, members: newMembers } as Rule;
	for (let i = innerPrecStack.length - 1; i >= 0; i--) {
		result = { ...innerPrecStack[i]!, content: result } as Rule;
	}
	result = { ...cursor, content: result } as Rule;
	for (let i = outerPrecStack.length - 1; i >= 0; i--) {
		result = { ...outerPrecStack[i]!, content: result } as Rule;
	}
	return result;
}

// `enrichFieldWrappers` REMOVED — `fieldName`/`nonterminal` are derived by
// `applyWrapperDeletion`'s FIELD case (push the field's name + nonterminal onto
// its content) and its SEQ case (retains fieldName on the seq node), with
// `materializeInlinedBody` carrying fieldName through group inlining. Stamping it
// in enrich was premature (nothing reads it before wrapper-deletion); enrich no
// longer stamps the derived slot attributes at all (see also the removed
// `enrichMultiplicityWrappers`). Field naming that enrich INFERS on bare symbols
// still happens in `applySymbolToField` (a real structural promotion, not a
// derived-attr stamp).

// Multiplicity / nonterminal are NOT stamped here — they are derived later by
// `applyWrapperDeletion` (normalize) from the OPTIONAL/REPEAT/REPEAT1/FIELD
// wrapper structure, the single source of truth. Stamping them in enrich was
// premature (nothing reads them before wrapper-deletion) and polluted the
// `nonterminal` slot signal — enrich marked bare `optional(',')` delimiters
// `nonterminal:true`, which wrapper-deletion deliberately does not (a bare
// optional terminal is render-only, not a slot).

// ---------------------------------------------------------------------------
// Pass 2: optional keyword-prefix
// ---------------------------------------------------------------------------

function applyOptionalKeyword(
	ruleName: string,
	rule: Rule,
	kwRules: Record<string, Rule>,
	rulesBag: Record<string, Rule>,
	wordMatcher: RegExp | undefined
): Rule {
	// Peel prec wrappers so claimed-name set covers the inner seq.
	const inner = peelPrec(rule);
	const claimed = isSeqType(inner.type) ? collectFieldNamesRuntime(inner) : new Set<string>();
	return walkOptionalKeyword(ruleName, rule, claimed, kwRules, rulesBag, wordMatcher) ?? rule;
}

function peelPrec(rule: Rule): Rule {
	let cursor: Rule = rule;
	while (isPrecWrapper(cursor as { type: string })) {
		cursor = (cursor as unknown as { content: Rule }).content;
	}
	return cursor;
}

// Peels an optional-shape node (sittir's own OPTIONAL wrapper, or
// tree-sitter's native CHOICE(X, BLANK) sugar for optional()) and attempts
// keyword-prefix promotion on its inner content. `matched: false` means the
// node isn't optional-shaped at all — caller should try other handling.
// `matched: true, result: null` means it IS optional-shaped but promotion
// declined (already claimed, collision, non-keyword inner, etc).
function tryPromoteOptionalNode(
	ruleName: string,
	rule: Rule,
	claimedAtSeqLevel: Set<string>,
	kwRules: Record<string, Rule>,
	rulesBag: Record<string, Rule>,
	wordMatcher: RegExp | undefined
): { matched: boolean; result: Rule | null } {
	const peeled = peelOptional(rule);
	if (!peeled.isOptional) return { matched: false, result: null };
	const replacement = tryPromoteInnerKeyword(
		ruleName,
		rule,
		peeled.inner,
		claimedAtSeqLevel,
		kwRules,
		rulesBag,
		wordMatcher
	);
	if (replacement !== null) return { matched: true, result: replacement };
	const innerRewritten = walkOptionalKeyword(ruleName, peeled.inner, claimedAtSeqLevel, kwRules, rulesBag, wordMatcher);
	if (innerRewritten !== null) {
		return { matched: true, result: rebuildOptional(rule, innerRewritten) };
	}
	return { matched: true, result: null };
}

function walkOptionalKeyword(
	ruleName: string,
	rule: Rule,
	claimedAtSeqLevel: Set<string>,
	kwRules: Record<string, Rule>,
	rulesBag: Record<string, Rule>,
	wordMatcher: RegExp | undefined
): Rule | null {
	if (isSeqType(rule.type)) {
		const members = (rule as unknown as { members: Rule[] }).members;
		let changed = false;
		const newMembers = members.map((m) => {
			const out = walkOptionalKeyword(ruleName, m, claimedAtSeqLevel, kwRules, rulesBag, wordMatcher);
			if (out === null) return m;
			changed = true;
			return out;
		});
		return changed ? ({ ...rule, members: newMembers } as Rule) : null;
	}
	if (isChoiceType(rule.type)) {
		// tree-sitter's native optional() is sugar for choice(rule, blank()) —
		// it never produces a distinct OPTIONAL wrapper, so a CHOICE(X, BLANK)
		// arriving here (as opposed to sittir's own optional(), which preserves
		// OPTIONAL) IS an optional-shape and must be tried via peelOptional
		// before falling back to generic per-member CHOICE recursion below.
		const promoted = tryPromoteOptionalNode(ruleName, rule, claimedAtSeqLevel, kwRules, rulesBag, wordMatcher);
		if (promoted.matched) return promoted.result;
		const members = (rule as unknown as { members: Rule[] }).members;
		let changed = false;
		const newMembers = members.map((m) => {
			const out = walkOptionalKeyword(ruleName, m, claimedAtSeqLevel, kwRules, rulesBag, wordMatcher);
			if (out === null) return m;
			changed = true;
			return out;
		});
		return changed ? ({ ...rule, members: newMembers } as Rule) : null;
	}
	const promoted = tryPromoteOptionalNode(ruleName, rule, claimedAtSeqLevel, kwRules, rulesBag, wordMatcher);
	if (promoted.matched) return promoted.result;
	if (isRepeatType(rule.type) || isFieldType(rule.type)) {
		const content = (rule as unknown as { content: Rule }).content;
		const out = walkOptionalKeyword(ruleName, content, claimedAtSeqLevel, kwRules, rulesBag, wordMatcher);
		if (out === null) return null;
		return { ...rule, content: out } as Rule;
	}
	// Descend through prec wrappers to reach inner seqs.
	if (isPrecWrapper(rule as { type: string })) {
		const content = (rule as unknown as { content: Rule }).content;
		const out = walkOptionalKeyword(ruleName, content, claimedAtSeqLevel, kwRules, rulesBag, wordMatcher);
		if (out === null) return null;
		return { ...rule, content: out } as Rule;
	}
	return null;
}

function tryPromoteInnerKeyword(
	ruleName: string,
	optionalRule: Rule,
	inner: Rule,
	claimed: Set<string>,
	kwRules: Record<string, Rule>,
	rulesBag: Record<string, Rule>,
	wordMatcher: RegExp | undefined
): Rule | null {
	const innerNorm = normalizeMember(inner);
	if (!isStringType(innerNorm.type)) return null;
	const kw = innerNorm.value;
	if (typeof kw !== 'string' || !matchesWordShape(kw, wordMatcher)) return null;
	// `_marker` suffix avoids JS-reserved-keyword collisions.
	const fieldName = `${kw}_marker`;
	if (claimed.has(fieldName)) {
		reportSkip('optional-keyword-prefix', ruleName, `field '${fieldName}' already exists`);
		return null;
	}
	claimed.add(fieldName);
	const symbolRef = registerKwRule(inner, fieldName, kwRules, rulesBag);
	if (symbolRef === null) {
		reportSkip(
			'optional-keyword-prefix',
			ruleName,
			`rule '_kw_${fieldName}' already exists in base.grammar.rules with different content`
		);
		return null;
	}
	const fieldNode = makeField(fieldName, symbolRef);
	return rebuildOptional(optionalRule, fieldNode);
}

function rebuildOptional(optionalRule: Rule, newInner: Rule): Rule {
	if (isOptionalType(optionalRule.type)) {
		return { ...optionalRule, content: newInner } as Rule;
	}
	const members = (optionalRule as unknown as { members: Rule[] }).members;
	const newMembers = members.map((m) => {
		const t = (m as { type?: string }).type;
		return t === 'BLANK' ? m : newInner;
	});
	return { ...optionalRule, members: newMembers } as Rule;
}

// ---------------------------------------------------------------------------
// Pass: clause-hoist — optional(seq(STRING, FIELD…)) → optional(SYMBOL(_N))
// ---------------------------------------------------------------------------
// Hoists `optional(seq(...))` whose seq contains ≥1 STRING and ≥1 FIELD
// member into a hidden rule `_<parent>_optional<N>` injected into
// `base.grammar.rules`, so tree-sitter (kindId) AND the IR (evaluate→link)
// both see it from one source. This matches detectClause's exact predicate
// (link.ts:2043–2045) so the pass covers precisely the clause-shaped optionals.
//
// Predicate: `members.some(isString) && members.some(isField)` — no
// restriction on seq member count; multi-member seqs (string + field1 +
// field2) also match. Does NOT fire on:
//   - optional(field(X))         — no inner seq
//   - optional(seq(field, field)) — seq has no string
//   - optional(seq(symbol, …))   — seq has no field
//
// Handles both the sittir-shape `optional(seq(...))` and the tree-sitter-
// normalized `CHOICE[seq, BLANK]` form (same descent as the existing
// peelOptional helper).
//
// Collision-aware: when the synthesized name is already claimed in
// `rulesBag` (base.grammar.rules), skip with a stderr notice.
//
// Naming: `_<parentKind>_optional<N>` (per-parent 1-indexed counter);
// cross-parent dedupe via canonicalStringify (same convention as
// auto-groups.ts synthesizeGroupName).

interface ClauseHoistCounter {
	// Counts ALL optional(seq) positions in traversal order — both clause
	// (which enrich hoists) and non-clause (which applyAutoGroups hoists).
	// Keeping the counter global across both kinds ensures that the numbers
	// enrich assigns to clause-seqs never collide with the numbers
	// applyAutoGroups assigns to non-clause-seqs in the same parent.
	//
	// Example: index_signature has two optional(seq) positions:
	//   pos 1 — non-clause seq(sign_field, ...)   → applyAutoGroups takes _optional1
	//   pos 2 — clause seq('readonly', field(...)) → enrich takes _optional2
	// If enrich started its own counter at 1, it would emit _optional1 and
	// collide with applyAutoGroups's emission for the non-clause position.
	opt: number;
	// Counts inline-UNSAFE positions surfaced as visible content-aliases
	// (`_<parent>_group<N>`). Independent of `opt` — the visible-alias name
	// space is distinct from the hidden hoist name space, and applyAutoGroups
	// is disabled this chunk so there is no cross-pass numbering to keep in
	// sync for the visible groups.
	grp: number;
	// Counts CHOICE-arm mints surfaced as visible content-aliases
	// (`_<parent>_arm<N>`). Separate from `grp`: an arm of a choice and a
	// nested sequence group are different constructs and carry different
	// name suffixes (armN vs groupN).
	arm: number;
	// DECLARED supertype names (grammar's `supertypes:` array, base +
	// overrides — never structurally inferred). mintStructuredChoiceArm
	// declines symbol arms referencing these: a declared supertype is
	// already a dispatchable union (subtype expansion IS its identity);
	// wrapping it in a mint alias adds a CST wrapper node to every tree it
	// appears in and severs its wrap-time concrete-kind expansion (which
	// keys on `modelType === 'supertype'`). Carried on this per-rule ctx
	// bag (§7.7 Principle #14) because it already travels through every
	// applyClauseHoist recursion into the mint site.
	readonly supertypeNames?: ReadonlySet<string>;
}

function peelOptionalSeq(rule: Rule): {
	seqBody: Rule;
	form: 'optional' | 'choice';
	seqIdx: number;
} | null {
	if (isOptionalType(rule.type)) {
		const content = (rule as unknown as { content?: Rule }).content;
		if (content && isSeqType((content as { type?: string }).type)) {
			return { seqBody: content, form: 'optional', seqIdx: -1 };
		}
		return null;
	}
	if (isChoiceType(rule.type)) {
		const members = (rule as unknown as { members?: Rule[] }).members;
		if (!Array.isArray(members) || members.length !== 2) return null;
		const blankIdx = members.findIndex((m) => isBlankType((m as { type?: string } | undefined)?.type));
		const seqIdx = members.findIndex((m) => isSeqType((m as { type?: string }).type));
		if (blankIdx === -1 || seqIdx === -1 || blankIdx === seqIdx) return null;
		return { seqBody: members[seqIdx]!, form: 'choice', seqIdx };
	}
	return null;
}

function listSeparatorOfOptionalSeq(rule: Rule): string | null {
	const peeled = peelOptionalSeq(rule);
	if (peeled === null) return null;
	const seqMembers = (peeled.seqBody as unknown as { members?: Rule[] }).members;
	if (!Array.isArray(seqMembers)) return null;
	for (const m of seqMembers) {
		if (!isRepeatType((m as { type?: string }).type)) continue;
		// Already-lifted separator attribute.
		const sepAttr = (m as { separator?: unknown }).separator;
		if (typeof sepAttr === 'string') return sepAttr;
		// Raw form: repeat(seq(SEP, x)) — detect the separator from the content
		// via the shared list-pattern detector (same logic evaluate's lift uses).
		const content = (m as { content?: RuntimeRule }).content;
		if (content) {
			const detected = detectRepeatSeparator(content);
			if (detected) {
				const sep = detected.separator;
				if (typeEq(sep.type, 'STRING')) return (sep as { value?: unknown }).value as string;
				if (typeEq(sep.type, 'CHOICE')) {
					const lit = firstStringOfChoice(sep);
					if (lit !== null) return lit;
				}
				// Falls through to the next seq member when the choice has no
				// string arm (e.g. all-symbol/external-scanner separator position)
				// — matches the pre-PR-S behavior, where `detectRepeatSeparator`
				// itself returned null for a stringless choice and the loop kept
				// scanning for a real separator elsewhere in the same seq.
			}
		}
	}
	return null;
}

function optionalStringLiteral(rule: Rule): string | null {
	const peeled = peelOptional(rule);
	if (!peeled.isOptional) return null;
	const innerN = normalizeMember(peeled.inner);
	if (isStringType(innerN.type) && typeof innerN.value === 'string') return innerN.value;
	return null;
}

function appendTrailingMemberToOptionalSeq(optSeqRule: Rule, trailingOptional: Rule): Rule {
	const peeled = peelOptionalSeq(optSeqRule)!;
	const seqBody = peeled.seqBody;
	const seqMembers = (seqBody as unknown as { members: Rule[] }).members;
	const newSeqBody = { ...seqBody, members: [...seqMembers, trailingOptional] } as Rule;
	return rebuildOptional(optSeqRule, newSeqBody);
}

/**
 * @internal — derive the element name a separated-list position exposes from
 * mint-time-visible facts ONLY (`type`/`name`/`members`/`content`), never the
 * per-pipeline decoration stamps (`id`/`_ref`/`metadata`) — the tree-sitter CLI
 * bundle and sittir's evaluate() must derive the SAME name for the same body.
 * A single symbol (or choice-of-one, or FIELD wrapper) names the element; a
 * multi-arm choice or compound seq has no single name (`null` — the caller
 * falls back to the `elements` basis).
 */
function separatedListElementName(rule: Rule): string | null {
	const t = (rule as { type?: string }).type;
	if (typeof t !== 'string') return null;
	if (isFieldType(t)) {
		const name = (rule as { name?: unknown }).name;
		return typeof name === 'string' ? name : null;
	}
	if (isSymbolType(t)) {
		const name = (rule as { name?: unknown }).name;
		return typeof name === 'string' ? name.replace(/^_+/, '') : null;
	}
	if (isChoiceType(t)) {
		const members = (rule as { members?: Rule[] }).members;
		if (Array.isArray(members) && members.length === 1) return separatedListElementName(members[0]!);
		return null;
	}
	if (isPrecWrapper(rule as { type: string }) || typeEq(t, 'ALIAS')) {
		const content = (rule as { content?: Rule }).content;
		return content ? separatedListElementName(content) : null;
	}
	return null;
}

/** @internal — `rule` matches `optional(X)` in either runtime spelling
 *  (`OPTIONAL{content}` or the CLI-desugared `CHOICE[X, BLANK]`); returns the
 *  inner X, else null. */
function peelOptionalEitherSpelling(rule: Rule): Rule | null {
	const peeled = peelOptional(rule);
	return peeled.isOptional ? peeled.inner : null;
}

interface SeparatedListBodyInfo {
	/** Element name per {@link separatedListElementName}; null for multi-arm/compound elements. */
	elementName: string | null;
	/** True when a flank is per-instance data: an optional trailing/leading
	 *  separator, an optionally-unterminated tail form, or a separator-kind
	 *  choice. Flankless lists carry no such data and never hoist. */
	flankCarrying: boolean;
	/** Which spelling matched: `head` = `[elem, repeat(sep elem), opt(sep)?]`,
	 *  `leading` = `[repeat1(sep elem), opt(sep)]` (continues a parent-side
	 *  head), `tail` = `[repeat(elem sep), opt(elem)]` (each element
	 *  separator-terminated, last optionally bare). */
	form: 'head' | 'leading' | 'tail';
	/** The element rule at the repeat position (fields/wrappers intact). */
	element: Rule;
	/** The separator rule (STRING literal or CHOICE). */
	separatorRule: Rule;
	/** The body's members with any nested-head seq spliced FLAT — the
	 *  canonical head-form spelling link's separator lift recognizes.
	 *  Language-identical to the original (seq nesting is associative). */
	flatMembers: Rule[];
}

/**
 * @internal — recognize a whole seq body as ONE separated list, in the two
 * spellings the raw grammars use:
 *   head-form: `[elem, repeat(seq(sep, elem)), optional(sep)?]`
 *              (incl. the nested-head variant `[[elem, repeat(...)], optional(sep)]`)
 *   tail-form: `[repeat(seq(elem, sep)), optional(elem)?]`
 * Works on the pre-pushdown wrapper-intact rule tree (this phase has no
 * `separator`/flank attributes yet) and on both runtime spellings of
 * `optional`. Returns null when the body is not a single separated list.
 */
function separatedListBodyInfo(body: Rule): SeparatedListBodyInfo | null {
	if (!isSeqType((body as { type?: string }).type)) return null;
	const members = (body as unknown as { members?: Rule[] }).members;
	if (!Array.isArray(members) || members.length === 0) return null;

	// A list's repeat member is the one whose content is a separator run —
	// NOT just any repeat (an attributed element is itself `seq(repeat(attr),
	// X)`, whose inner repeat carries no separator).
	const separatorRepeatOf = (m: Rule) => {
		if (!isRepeatType((m as { type?: string }).type)) return null;
		const content = (m as { content?: RuntimeRule }).content;
		return content ? detectRepeatSeparator(content) : null;
	};

	// Nested-head variant: [flank?, [elem, repeat(sep-run)], flank?] — splice
	// the nested seq's members into place and re-examine as the flat
	// head-form (the nested seq may sit after a leading flank member, e.g.
	// object_type_content's optional leading separator).
	if (members.length >= 2 && !members.some((m) => separatorRepeatOf(m) !== null)) {
		const nestedIdx = members.findIndex((m) => {
			if (!isSeqType((m as { type?: string }).type)) return false;
			const inner = (m as unknown as { members?: Rule[] }).members;
			return Array.isArray(inner) && inner.some((im) => separatorRepeatOf(im) !== null);
		});
		if (nestedIdx !== -1) {
			const headMembers = (members[nestedIdx] as unknown as { members: Rule[] }).members;
			return separatedListBodyInfo({
				...body,
				members: [...members.slice(0, nestedIdx), ...headMembers, ...members.slice(nestedIdx + 1)]
			} as Rule);
		}
	}

	const repeatIdx = members.findIndex((m) => separatorRepeatOf(m) !== null);
	if (repeatIdx === -1) return null;
	const detected = separatorRepeatOf(members[repeatIdx]!)!;
	const separatorIsChoice = typeEq(detected.separator.type, 'CHOICE');
	const separatorLiteral = typeEq(detected.separator.type, 'STRING')
		? ((detected.separator as { value?: unknown }).value as string)
		: null;
	const elementName = separatedListElementName(detected.content as Rule);

	if (detected.trailing !== true) {
		// Head-form: repeat is seq(SEP, elem); the member BEFORE the repeat is
		// the head element, an optional(SEP) member after it is the trailing
		// flank (a leading optional(SEP)/bare SEP before the head is the
		// leading flank). A leading-run variant carries NO in-body head — the
		// list continues a head element living in the parent
		// (`[repeat1(seq(sep, elem)), optional(sep)]`, python's
		// expression_list/pattern_list tail groups) — recognized only when a
		// trailing flank follows, so a bare `repeat(seq(sep, elem))` member
		// alone never reads as a whole-body list.
		if (repeatIdx === 0) {
			// REPEAT1 only: a zero-or-more repeat plus an optional flank would
			// match the empty string — not a rule tree-sitter accepts, and not
			// this shape (the leading run CONTINUES a mandatory head element).
			if (!typeEq((members[0] as { type?: string }).type, 'REPEAT1')) return null;
			if (members.length !== 2) return null;
			const flank = peelOptionalEitherSpelling(members[1]!);
			const flankLit =
				flank && isStringType((flank as { type?: string }).type) ? (flank as { value?: unknown }).value : null;
			if (flankLit === null || (separatorLiteral !== null && flankLit !== separatorLiteral)) return null;
			return {
				elementName,
				flankCarrying: true,
				form: 'leading' as const,
				element: detected.content as Rule,
				separatorRule: detected.separator as Rule,
				flatMembers: members
			};
		}
		const head = members[repeatIdx - 1]!;
		if (separatedListElementName(head) !== elementName || elementName === null) {
			// Compound/multi-arm elements: both positions must still AGREE
			// structurally — compare their canonical keys instead of names.
			if (ruleKey(head as RuntimeRule) !== ruleKey(detected.content as RuntimeRule)) return null;
		}
		let flankCarrying = separatorIsChoice;
		for (const [i, m] of members.entries()) {
			if (i === repeatIdx || i === repeatIdx - 1) continue;
			// A bare separator literal is a MANDATORY flank — part of the list
			// shape, but compile-time-known (not per-instance data).
			if (isStringType((m as { type?: string }).type) && (m as { value?: unknown }).value === separatorLiteral) {
				continue;
			}
			const inner = peelOptionalEitherSpelling(m);
			const innerLit =
				inner && isStringType((inner as { type?: string }).type) ? (inner as { value?: unknown }).value : null;
			// A choice-of-separators flank next to a choice-separator list — the
			// two spellings routinely diverge in decoration (one side may hold
			// substituted symbol refs), so match on both being choices rather
			// than exact keys.
			const innerMatchesChoiceSep =
				inner !== null && separatorIsChoice && isChoiceType((inner as { type?: string }).type ?? '');
			if (
				(innerLit !== null && (separatorLiteral === null || innerLit === separatorLiteral)) ||
				innerMatchesChoiceSep
			) {
				flankCarrying = true;
				continue;
			}
			// Any member that is not the head, the repeat, or a flank breaks
			// the "whole body is one list" reading.
			return null;
		}
		return {
			elementName,
			flankCarrying,
			form: 'head' as const,
			element: detected.content as Rule,
			separatorRule: detected.separator as Rule,
			flatMembers: members
		};
	}

	// Tail-form: repeat is seq(elem, SEP); the optional(elem) member after the
	// repeat means the last element may omit its separator — per-instance
	// trailing-separator data. A bare separator-terminated repeat with NO
	// elem? tail is not this shape (every element is mandatorily terminated).
	if (repeatIdx !== 0 || members.length !== 2) return null;
	const tail = peelOptionalEitherSpelling(members[1]!);
	if (tail === null) return null;
	if (elementName !== null && separatedListElementName(tail) !== elementName) return null;
	if (elementName === null && ruleKey(tail as RuntimeRule) !== ruleKey(detected.content as RuntimeRule)) return null;
	return {
		elementName,
		flankCarrying: true,
		form: 'tail' as const,
		element: detected.content as Rule,
		separatorRule: detected.separator as Rule,
		flatMembers: members
	};
}

interface InlineSeparatedListRun {
	info: SeparatedListBodyInfo;
	key: string;
	/** The run's synthetic seq body — the exact members slice, reusable as a
	 *  hoisted rule body. */
	body: Rule;
	start: number;
	size: number;
}

/** @internal — flank-carrying separated-list runs INLINE among a seq's
 *  members (a list that shares its seq with delimiters/other content, e.g.
 *  `'(' repeat(seq(rule, ';')) optional(rule) ')'`). Each window of 3 then 2
 *  adjacent members is offered to {@link separatedListBodyInfo} as a
 *  synthetic seq. A run spanning the WHOLE member list is not reported —
 *  that is the seq body itself, owned by the whole-body paths. Consumed by
 *  the proposal count AND by the seq-descent run hoist. */
function detectInlineSeparatedListRuns(members: Rule[]): InlineSeparatedListRun[] {
	// A window member "carries" the list's repeat either directly or one seq
	// level down (`commaSep1` nests `[elem, repeat(sep elem)]` as a sub-seq
	// with the flank as a SIBLING member; macro_definition nests the whole
	// tail run as one sub-seq member) — separatedListBodyInfo's nested-head
	// splice unpacks these, this predicate only pre-filters.
	const carriesRepeat = (m: Rule): boolean => {
		if (isRepeatType((m as { type?: string }).type)) return true;
		if (!isSeqType((m as { type?: string }).type)) return false;
		const inner = (m as unknown as { members?: Rule[] }).members;
		return Array.isArray(inner) && inner.some((im) => isRepeatType((im as { type?: string }).type));
	};
	const runs: InlineSeparatedListRun[] = [];
	let i = 0;
	while (i < members.length) {
		let consumed = 0;
		for (const size of [3, 2, 1]) {
			if (i + size > members.length || size === members.length) continue;
			const window = members.slice(i, i + size);
			if (!window.some(carriesRepeat)) continue;
			// A size-1 window is a nested whole-list sub-seq member — offer it
			// directly (the ≥2-member synthetic path is for flat/sibling runs).
			const synthetic =
				size === 1 && isSeqType((window[0] as { type?: string }).type)
					? window[0]!
					: ({ type: 'SEQ', members: window } as unknown as Rule);
			const info = separatedListBodyInfo(synthetic);
			if (info?.flankCarrying) {
				if (info.form === 'tail') {
					// Only the empty-matchable `repeat(elem sep) elem?` family
					// (macro_definition) is a hoistable tail run — it rewrites to
					// an optional classic list of the SAME language. A REPEAT1
					// tail, or a tail continuing a mandatory elem-sep pair member
					// before it (tuple_expression's `pair pair* elem?` — the
					// single-element-tuple constraint), is NOT a plain separated
					// list; those stay inline.
					const repeatMember = window[0]!;
					const prev = i > 0 ? members[i - 1] : undefined;
					const prevIsPair =
						prev !== undefined &&
						ruleKey(prev as RuntimeRule) === ruleKey((repeatMember as { content?: RuntimeRule }).content!);
					if (typeEq((repeatMember as { type?: string }).type, 'REPEAT1') || prevIsPair) continue;
				}
				runs.push({ info, key: ruleKey(synthetic as RuntimeRule), body: synthetic, start: i, size });
				consumed = size;
				break;
			}
		}
		i += consumed || 1;
	}
	return runs;
}

/**
 * @internal — grammar-global proposal counts for separated-list kind names:
 * how many DISTINCT flank-carrying list bodies would claim each pluralized
 * element name. A name with count 1 is globally unique and the list kind may
 * take it bare (`use_clauses`); a contested name forces the composite
 * fallback. Identical bodies (by {@link ruleKey}) count once — they dedupe to
 * a single mint anyway. Computed AFTER the field-wrap loop (enrich() loop 1)
 * and consumed by every mint in loop 2 via {@link separatedListNameCounts}.
 */
function collectSeparatedListNameProposals(rules: Record<string, Rule>): Map<string, number> {
	const keysByName = new Map<string, Set<string>>();
	const record = (info: SeparatedListBodyInfo, key: string) => {
		if (info.elementName === null) return;
		const plural = pluralizeFieldName(info.elementName);
		let keys = keysByName.get(plural);
		if (!keys) keysByName.set(plural, (keys = new Set()));
		keys.add(key);
	};
	const visit = (rule: Rule | undefined): void => {
		if (!rule || typeof rule !== 'object') return;
		const t = (rule as { type?: string }).type;
		if (typeof t !== 'string') return;
		if (isSeqType(t)) {
			const rawMembers = (rule as unknown as { members?: Rule[] }).members;
			if (Array.isArray(rawMembers)) {
				// Same pre-fold the hoist applies: pull a stranded trailing
				// `optional(sep)` into its list so the shapes counted here match
				// the shapes the mints will see.
				const members = absorbTrailingListSeparators(rawMembers) ?? rawMembers;
				const folded = members === rawMembers ? rule : ({ ...rule, members } as Rule);
				const whole = separatedListBodyInfo(folded);
				if (whole?.flankCarrying) {
					record(whole, ruleKey(folded as RuntimeRule));
				} else {
					for (const run of detectInlineSeparatedListRuns(members)) record(run.info, run.key);
				}
				for (const m of members) visit(m);
				return;
			}
		}
		const content = (rule as { content?: Rule }).content;
		if (content) visit(content);
		const members = (rule as { members?: Rule[] }).members;
		if (Array.isArray(members)) for (const m of members) visit(m);
	};
	for (const name of Object.keys(rules)) visit(rules[name]);
	return new Map([...keysByName].map(([name, keys]) => [name, keys.size]));
}

/** Grammar-global separated-list name counts for the CURRENT enrich() call —
 *  set between loop 1 (field-wrap) and loop 2 (hoist), cleared after. Module
 *  state rather than a threaded parameter, matching the `setGroupLiftRuleMap`
 *  precedent; null outside enrich() (standalone hoist tests keep ordinal
 *  naming). */
let separatedListNameCounts: Map<string, number> | null = null;

/** The current enrich() call's skip set — consulted by the mint-path list
 *  flattening (a skipped kind keeps its original body spelling: the skip
 *  exists because downstream fielding must not touch it, and the flat
 *  spelling changes its slot derivation). Same lifecycle as
 *  {@link separatedListNameCounts}. */
let separatedListEnrichSkip: ReadonlySet<string> | null = null;

/** Per-enrich() cache of hidden-list-rule promotions: hidden rule name →
 *  the visible kind name every bare reference aliases to. Same lifecycle as
 *  {@link separatedListNameCounts}. */
let hiddenListPromotionNames: Map<string, string> | null = null;

// Loop-2 (clause-hoist) access to the enrich() call's keyword bag and word
// matcher, for the permutation-choice decline + marker normalization: a
// keyword already `_kw_*`-promoted in one arm must key identically to its
// raw string spelling in a sibling arm, and only word-shaped literals are
// modifier candidates. Same set/reset-in-try/finally pattern as the
// separated-list state above.
let hoistKwRules: Record<string, Rule> | null = null;
let hoistWordMatcher: RegExp | undefined;

/**
 * @internal — a bare SYMBOL reference to a hidden rule whose ENTIRE body is
 * a flank-carrying separated list (python's `_import_list`) gets wrapped in
 * a visible alias: the rule IS the per-instance-fact carrier, so its splice
 * must surface as a node. The visible name follows the settled separated-
 * list chain (bare pluralized element name when globally unique, then
 * `<base>_<field>`, then `<base>_elements`) and is cached so every
 * reference agrees. Returns the member unchanged when it is not such a
 * reference.
 */
function promoteHiddenListRef(member: Rule, rulesBag: Record<string, Rule>): Rule {
	if (separatedListNameCounts === null || hiddenListPromotionNames === null) return member;
	if (!isSymbolType((member as { type?: string }).type)) return member;
	const name = (member as { name?: unknown }).name;
	if (typeof name !== 'string' || !name.startsWith('_')) return member;
	if (separatedListEnrichSkip?.has(name)) return member;
	let visibleName = hiddenListPromotionNames.get(name);
	if (visibleName === undefined) {
		const body = rulesBag[name];
		if (!body || !isSeqType((body as { type?: string }).type)) return member;
		const info = separatedListBodyInfo(body);
		if (!info?.flankCarrying || info.form !== 'head') return member;
		const base = name.replace(/^_+/, '');
		const bare = info.elementName !== null ? pluralizeFieldName(info.elementName) : null;
		const candidates: string[] = [];
		if (bare !== null && separatedListNameCounts.get(bare) === 1) candidates.push(bare);
		if (bare !== null && base !== bare && !base.endsWith(`_${bare}`)) candidates.push(`${base}_${bare}`);
		candidates.push(base.endsWith('_elements') ? base : `${base}_elements`);
		visibleName = candidates.find((c) => !(c in rulesBag) && !(`_${c}` in rulesBag));
		if (visibleName === undefined) return member;
		hiddenListPromotionNames.set(name, visibleName);
	}
	return makeVisibleGroupAlias(member, visibleName);
}

function absorbTrailingListSeparators(members: Rule[]): Rule[] | null {
	let changed = false;
	const out: Rule[] = [];
	for (let i = 0; i < members.length; i++) {
		const cur = members[i]!;
		const next = members[i + 1];
		const sep = next ? listSeparatorOfOptionalSeq(cur) : null;
		if (sep !== null && optionalStringLiteral(next!) === sep) {
			out.push(appendTrailingMemberToOptionalSeq(cur, next!));
			i++; // consume the stranded trailing separator
			changed = true;
			continue;
		}
		out.push(cur);
	}
	return changed ? out : null;
}

function applyClauseHoist(
	parentKind: string,
	rule: Rule,
	rulesBag: Record<string, Rule>,
	clauseGroupRules: Record<string, Rule>,
	dedupeMap: Record<string, string>,
	counter: ClauseHoistCounter,
	groupDedupeMap: Record<string, string>,
	visibleGroupHiddenNames: Set<string>,
	clauseGroupOwners: Map<string, string>,
	// PR 3 (2026-07-21 union-slot design): the innermost PREC wrapper (if
	// any) currently enclosing `rule` in the traversal — e.g. rust's
	// `or_pattern: $ => prec.left(-2, choice(...))` deliberately
	// deprioritizes its WHOLE choice relative to sibling pattern rules.
	// Extracting one arm into its own hidden rule (mintStructuredChoiceArm)
	// strips that precedence from the extracted piece (the outer prec
	// still wraps the CHOICE containing the alias reference, but the
	// newly-registered hidden rule's OWN definition has none) — a genuine
	// new tree-sitter LR ambiguity, not a naming collision. Threaded
	// through every recursive call so a mint under a prec wrapper can
	// re-apply the SAME wrapper to its own registered body.
	ambientPrec?: Rule,
	// The nearest enclosing `field(name, ...)` this position is STILL
	// directly the content of — set on FIELD descent, propagated unchanged
	// through PREC/REPEAT/OPTIONAL (transparent wrappers, same position),
	// reset to `undefined` at SEQ/CHOICE member boundaries (a member is a
	// distinct position, no longer "the field's content" as a whole).
	// Consumed by `visibleGroupSynthName` to prefer `_<parent>_<field>`
	// over an opaque ordinal when a group is hoisted from a fielded slot.
	enclosingFieldName?: string
): Rule {
	// Check if this node is an optional(seq) or CHOICE[seq,BLANK] pattern.
	const peeled = peelOptionalSeq(rule);
	if (peeled !== null) {
		// Post-order: recurse into the seq body FIRST, then classify.
		const recursedSeqBody = applyClauseHoist(
			parentKind,
			peeled.seqBody,
			rulesBag,
			clauseGroupRules,
			dedupeMap,
			counter,
			groupDedupeMap,
			visibleGroupHiddenNames,
			clauseGroupOwners,
			ambientPrec,
			enclosingFieldName
		);

		if (ruleMatchesEmpty(recursedSeqBody)) {
			// Empty-matching body: tree-sitter rejects named rules that match the
			// empty string — never hoist. Counter must still increment because
			// applyAutoGroups does NOT check empty-matching and will consume this
			// counter slot for its own numbering.
			counter.opt += 1;
			// Rebuild wrapper with the recursed (possibly updated) seq body, but
			// leave this position un-hoisted.
			if (recursedSeqBody === peeled.seqBody) return rule;
			if (peeled.form === 'optional') {
				return rebuildOptional(rule, recursedSeqBody);
			} else {
				const members = (rule as unknown as { members: Rule[] }).members;
				const newMembers = members.slice() as Rule[];
				newMembers[peeled.seqIdx] = recursedSeqBody;
				return { ...rule, members: newMembers } as Rule;
			}
		} else if (isInlineSafe(recursedSeqBody, rulesBag)) {
			// Inline-safe: exactly one field/symbol slot after dropping literals.
			// Hoist into a hidden _<parent>_optionalN rule (today's clause path).
			// clauseHoistSynthName increments the counter internally.
			const name = clauseHoistSynthName(recursedSeqBody, parentKind, dedupeMap, counter, rulesBag, clauseGroupRules);
			if (name !== null) {
				// Record which parent's body this hoist was minted from — see
				// `ENRICH_CLAUSE_GROUP_OWNERS_KEY` for why wire() needs this.
				if (!clauseGroupOwners.has(name)) clauseGroupOwners.set(name, parentKind);
				const symbolRef = makeGroupLiftSymbol(rule, name);
				if (peeled.form === 'optional') {
					return rebuildOptional(rule, symbolRef);
				} else {
					// CHOICE[seq, BLANK] form
					const members = (rule as unknown as { members: Rule[] }).members;
					const newMembers = members.slice() as Rule[];
					newMembers[peeled.seqIdx] = symbolRef;
					return { ...rule, members: newMembers } as Rule;
				}
			}
			// name === null: collision — skip but still count the position.
			// (Counter was already incremented inside clauseHoistSynthName
			// before the collision was detected — see that function's comments.)
			return rule;
		} else {
			// Inline-unsafe: multi-slot or bare-choice body. Surface it as a
			// VISIBLE CST kind via the standard tree-sitter named-group pattern:
			//   Pass 1 — register a HIDDEN rule `_<parent>_group<N>` whose body is
			//     the seq (visibleGroupSynthName injects it into clauseGroupRules,
			//     exactly like the inline-safe clause-hoist path), and reference it
			//     with a clean `symbol($._<parent>_group<N>)`.
			//   Pass 2 — wrap that symbol ref in `alias($._<name>, $.<name>)` so
			//     tree-sitter renames the ONE symbol-node into ONE clean visible CST
			//     node. (Aliasing the multi-member seq DIRECTLY made tree-sitter
			//     DISTRIBUTE the alias across the seq's members → scattered empty
			//     leaves → reader "singular slot got array" → dropped slot.)
			// The hidden rule stays the single source of truth; link's
			// `aliasSourceKinds` mechanism (assemble.ts) promotes it to
			// user-facing visibility once its slot reference is hydrated,
			// rather than the alias minting a second, duplicate rule.
			// Keep `counter.opt` advancing too — the hidden-hoist name space must
			// stay consistent with applyAutoGroups's ordinal numbering for any
			// run where it is still active (it is disabled this chunk, but the
			// invariant is cheap to preserve).
			counter.opt += 1;
			const names = visibleGroupSynthName(
				recursedSeqBody,
				parentKind,
				groupDedupeMap,
				counter,
				rulesBag,
				clauseGroupRules,
				ambientPrec,
				enclosingFieldName
			);
			if (names !== null) {
				// Pass 2 tag: this hidden rule backs a VISIBLE alias → keep it OUT of
				// the `inline:` list (so tree-sitter aliases the symbol-node, not the
				// expanded seq). Classify ONCE here; read in enrich() at clauseGroupNames.
				visibleGroupHiddenNames.add(names.hiddenName);
				// Record which parent's body this visible-group hoist was minted
				// from — see `ENRICH_CLAUSE_GROUP_OWNERS_KEY` for why wire() needs
				// this (an override that redeclares `parentKind` orphans this hidden
				// rule, since the synthesized name could never appear in the
				// override author's own text).
				if (!clauseGroupOwners.has(names.hiddenName)) clauseGroupOwners.set(names.hiddenName, parentKind);
				// Pass 1: symbol ref to the hidden rule (mirrors makeGroupLiftSymbol).
				const symbolRef = makeGroupLiftSymbol(rule, names.hiddenName);
				// Pass 2: wrap in a visible alias so the inline-unsafe group surfaces
				// as a clean CST node (`<name>`). The alias carries metadata.author so
				// transform-path travels through it and link mints the kind.
				const aliasRule = makeVisibleGroupAlias(symbolRef, names.visibleName);
				if (peeled.form === 'optional') {
					return rebuildOptional(rule, aliasRule);
				} else {
					const members = (rule as unknown as { members: Rule[] }).members;
					const newMembers = members.slice() as Rule[];
					newMembers[peeled.seqIdx] = aliasRule;
					return { ...rule, members: newMembers } as Rule;
				}
			}
			// aliasName === null: collision — leave inline (un-aliased).
			if (recursedSeqBody === peeled.seqBody) return rule;
			if (peeled.form === 'optional') {
				return rebuildOptional(rule, recursedSeqBody);
			} else {
				const members = (rule as unknown as { members: Rule[] }).members;
				const newMembers = members.slice() as Rule[];
				newMembers[peeled.seqIdx] = recursedSeqBody;
				return { ...rule, members: newMembers } as Rule;
			}
		}
	}

	// Optional position with a NON-seq body (optional(seq) was peeled above).
	// `peelOptional` normalizes both runtime spellings — sittir's
	// `{ type: OPTIONAL, content }` and the tree-sitter CLI's desugared
	// `CHOICE[content, BLANK]` — into ONE hoist path. Before this branch the
	// desugared form reached the mint via the generic CHOICE arm walk while
	// the OPTIONAL form fell through untouched, so the two runtimes hoisted
	// DIFFERENT grammars: the parser minted `_<parent>_group<N>` for e.g.
	// rust `attribute`'s `optional(choice(seq('=', value), arguments))`
	// while the IR never registered the kind — the wrapped tree then carried
	// a group node the model couldn't drill (rendered `#[doc =]`, value
	// dropped). Recurse into the content, then offer it to the arm mint
	// exactly as a `CHOICE[content, BLANK]` non-BLANK arm.
	{
		const opt = peelOptional(rule);
		if (opt.isOptional) {
			const recursed = applyClauseHoist(
				parentKind,
				opt.inner,
				rulesBag,
				clauseGroupRules,
				dedupeMap,
				counter,
				groupDedupeMap,
				visibleGroupHiddenNames,
				clauseGroupOwners,
				ambientPrec,
				enclosingFieldName
			);
			const promoted = mintStructuredChoiceArm(
				recursed,
				parentKind,
				rulesBag,
				clauseGroupRules,
				counter,
				groupDedupeMap,
				visibleGroupHiddenNames,
				clauseGroupOwners,
				// Single non-BLANK arm: no siblings, no leading-name collisions.
				new Set(),
				ambientPrec,
				// The whole optional content is still the field's logical
				// position (this is optional(seq)/CHOICE[content, BLANK], not a
				// seq/choice member boundary) — carry the field name in.
				enclosingFieldName
			);
			const final = promoted ?? recursed;
			if (final === opt.inner) return rule;
			if (isOptionalType(rule.type)) {
				return { ...rule, content: final } as Rule;
			}
			// CHOICE[content, BLANK] spelling — swap the non-BLANK member.
			const members = (rule as unknown as { members: Rule[] }).members;
			const idx = members.findIndex((m) => (m as { type: string }).type !== 'BLANK');
			const newMembers = members.slice();
			newMembers[idx] = final;
			return { ...rule, members: newMembers } as Rule;
		}
	}

	// Descend into seq members.
	if (isSeqType(rule.type)) {
		const rawMembers = (rule as unknown as { members?: Rule[] }).members;
		if (!Array.isArray(rawMembers)) return rule;
		// Pre-fold: pull a separated-list's stranded trailing `optional(sep)` INTO
		// the preceding `optional(seq(... repeat(sep) ...))` so the per-member hoist
		// below captures the whole list (head + repeat + trailing) as one group.
		const absorbed = absorbTrailingListSeparators(rawMembers);
		const members = absorbed ?? rawMembers;
		let changed = absorbed !== null;
		const newMembers = members.map((m) => {
			let out = applyClauseHoist(
				parentKind,
				m,
				rulesBag,
				clauseGroupRules,
				dedupeMap,
				counter,
				groupDedupeMap,
				visibleGroupHiddenNames,
				clauseGroupOwners,
				ambientPrec
			);
			out = promoteHiddenListRef(out, rulesBag);
			if (out !== m) changed = true;
			return out;
		});
		// Run hoist: a flank-carrying separated list INLINE among this seq's
		// members (sharing the seq with delimiters, e.g. macro_definition's
		// `'(' repeat(seq(rule, ';')) optional(rule) ')'` or type_arguments'
		// `'<' type sep-run optional(',') '>'`) carries per-instance separator
		// facts with no node to hang them on. Hoist the run into its own
		// VISIBLE separatedList kind — the same hidden-rule + alias mint the
		// optional(seq) whole-body path uses; flankless runs stay inline.
		// Post-order (after member recursion) so inner content is settled.
		// A seq that IS one whole-body list is owned by the whole-body mint
		// paths — carving a sub-run out of it would strand its head element.
		if (separatedListNameCounts !== null && separatedListBodyInfo({ ...rule, members: newMembers } as Rule) === null) {
			const runs = detectInlineSeparatedListRuns(newMembers);
			for (let r = runs.length - 1; r >= 0; r--) {
				const run = runs[r]!;
				// The empty-matchable tail run `repeat(elem sep) elem?` hoists as
				// `optional(<classic list>)`: the classic non-empty spelling
				// `elem (sep elem)* sep?` describes the same language, gives the
				// kind the canonical separated-list shape downstream phases
				// recognize, and the optional wrapper keeps the empty case
				// node-free in the parent.
				const isTail = run.info.form === 'tail';
				// Runtime-native constructors so each pipeline gets ITS optional
				// spelling (sittir: OPTIONAL; tree-sitter CLI: CHOICE[X, BLANK]).
				const seqFn = nativeRuleFn<(...m: unknown[]) => Rule>('seq');
				const repeatFn = nativeRuleFn<(r: unknown) => Rule>('repeat');
				const optionalFn = nativeRuleFn<(r: unknown) => Rule>('optional', 'opt');
				const body = isTail
					? seqFn(
							run.info.element,
							repeatFn(seqFn(run.info.separatorRule, run.info.element)),
							optionalFn(run.info.separatorRule)
						)
					: seqFn(...run.info.flatMembers);
				const names = visibleGroupSynthName(
					body,
					parentKind,
					groupDedupeMap,
					counter,
					rulesBag,
					clauseGroupRules,
					ambientPrec
				);
				if (names === null) continue;
				visibleGroupHiddenNames.add(names.hiddenName);
				if (!clauseGroupOwners.has(names.hiddenName)) clauseGroupOwners.set(names.hiddenName, parentKind);
				const symbolRef = makeGroupLiftSymbol(body, names.hiddenName);
				const aliasRule = makeVisibleGroupAlias(symbolRef, names.visibleName);
				const replacement = isTail ? optionalFn(aliasRule) : aliasRule;
				newMembers.splice(run.start, run.size, replacement);
				changed = true;
			}
		}
		return changed ? ({ ...rule, members: newMembers } as Rule) : rule;
	}

	// Descend into choice branches that are NOT optional(seq) wrappers
	// (those were handled above via peelOptionalSeq).
	if (isChoiceType(rule.type)) {
		let choiceRule = rule;
		/* Permutable-modifier arms (isPermutationChoice): decline minting —
		   the arms differ only in ordering/optionality of one modifier-slot
		   set, so kind identity would be pure ceremony — and normalize each
		   arm's raw keyword steps to marker fields so every arm spells the
		   same slot the same way. */
		const permutationChoice = isPermutationChoice(rule, rulesBag, hoistKwRules ?? undefined, hoistWordMatcher);
		if (permutationChoice && hoistKwRules !== null) {
			choiceRule = promotePermutationArmKeywords(rule, hoistKwRules, rulesBag, hoistWordMatcher);
		}
		const members = (choiceRule as unknown as { members?: Rule[] }).members;
		if (!Array.isArray(members)) return rule;
		// PR 3 (2026-07-21 union-slot design): leading-symbol collisions
		// across THIS choice's arms — any leading name shared by 2+ arms
		// (see armStartsWithSymbol's doc comment for the two exemplars
		// this catches). Arms whose leading symbol collides don't get
		// minted; whichever OTHER mechanism already resolves that
		// ambiguity (a sibling bare-symbol arm rendering the extension
		// arm's mint redundant, or this grammar's own polymorphs/variant()
		// config) keeps doing so, unimpeded.
		const leadingNameCounts = new Map<string, number>();
		for (const m of members) {
			const name = armLeadingSymbolName(m, rulesBag);
			if (name !== undefined) leadingNameCounts.set(name, (leadingNameCounts.get(name) ?? 0) + 1);
		}
		const collidingLeadingNames = new Set<string>();
		for (const [name, count] of leadingNameCounts) {
			if (count >= 2) collidingLeadingNames.add(name);
		}
		let changed = false;
		const newMembers = members.map((m) => {
			const out = applyClauseHoist(
				parentKind,
				m,
				rulesBag,
				clauseGroupRules,
				dedupeMap,
				counter,
				groupDedupeMap,
				visibleGroupHiddenNames,
				clauseGroupOwners,
				ambientPrec
			);
			// PR 3 (2026-07-21 union-slot design): a bare choice-arm position
			// (unnamed, no field wrapper — the gate (c) field-named-mixed-row
			// case is a separate, not-yet-implemented follow-up) that is
			// STRUCTURED (multi-slot, or a symbol ref to a hidden rule whose
			// own body is multi-slot) has no kind identity to serve as a
			// distinguishable union member — an inline symbol/anonymous seq
			// produces no CST node of its own. Mint (or promote an existing
			// hidden rule to) a visible alias, same mechanism as the
			// inline-unsafe optional(seq) path above, just without the
			// optional wrapper: the arm position is replaced directly.
			//
			// Split justification: an arm that differs from a SIBLING only at
			// a literal-choice position stays unminted — extracting it would
			// create a form whose sole difference is a cardinality-1
			// (determined) enum; the literal belongs in the parent's own
			// enum slot instead.
			const literalOnlySplit = members.some((sib) => sib !== m && armsDifferOnlyByLiteralChoice(out, sib));
			const promoted =
				permutationChoice || literalOnlySplit
					? null
					: mintStructuredChoiceArm(
							out,
							parentKind,
							rulesBag,
							clauseGroupRules,
							counter,
							groupDedupeMap,
							visibleGroupHiddenNames,
							clauseGroupOwners,
							collidingLeadingNames,
							ambientPrec
						);
			const final = promoteHiddenListRef(promoted ?? out, rulesBag);
			if (final !== m) changed = true;
			return final;
		});
		return changed || choiceRule !== rule ? ({ ...choiceRule, members: newMembers } as Rule) : rule;
	}

	// Descend into repeat / repeat1 / prec wrappers.
	if (isRepeatType(rule.type) || isPrecWrapper(rule as { type: string })) {
		const content = (rule as unknown as { content?: Rule }).content;
		if (!content) return rule;
		// PR 3 (2026-07-21 union-slot design): entering a PREC wrapper
		// updates the ambient prec context for everything beneath it — a
		// mint under here should carry THIS wrapper's precedence, not an
		// outer one (innermost wins, matching how prec actually scopes).
		// `rule` itself is reused as the wrapper shape; its own `content`
		// gets swapped out wherever it's applied later.
		const innerAmbientPrec = isPrecWrapper(rule as { type: string }) ? rule : ambientPrec;
		const newContent = applyClauseHoist(
			parentKind,
			content,
			rulesBag,
			clauseGroupRules,
			dedupeMap,
			counter,
			groupDedupeMap,
			visibleGroupHiddenNames,
			clauseGroupOwners,
			innerAmbientPrec,
			enclosingFieldName
		);
		if (newContent === content) return rule;
		return { ...rule, content: newContent } as Rule;
	}

	// Descend into field content (a field-wrapped optional(seq) is also a target).
	if (isFieldType(rule.type)) {
		const content = (rule as unknown as { content?: Rule }).content;
		if (!content) return rule;
		const newContent = applyClauseHoist(
			parentKind,
			content,
			rulesBag,
			clauseGroupRules,
			dedupeMap,
			counter,
			groupDedupeMap,
			visibleGroupHiddenNames,
			clauseGroupOwners,
			ambientPrec,
			(rule as unknown as { name: string }).name
		);
		if (newContent === content) return rule;
		return { ...rule, content: newContent } as Rule;
	}

	return rule;
}

// ---------------------------------------------------------------------------
// Base-grammar un-aliasing (parsekind-noninjective auto-fix)
// ---------------------------------------------------------------------------

export function clusterSignatures(values: readonly RuntimeRule[]): string[] {
	const indexByKey = new Map<string, number>();
	const clusterOf: string[] = [];
	for (const value of values) {
		const key = ruleKey(value);
		let idx = indexByKey.get(key);
		if (idx === undefined) {
			idx = indexByKey.size;
			indexByKey.set(key, idx);
		}
		clusterOf.push(String(idx));
	}
	return clusterOf;
}

export const ENRICH_UNALIAS_DIAGNOSTICS_KEY = '__enrichUnaliasDiagnostics__' as const;

function unaliasDiagnosticKey(diagnostic: ParseKindCollisionDiagnostic): string {
	return [
		diagnostic.code,
		diagnostic.ownerKind,
		diagnostic.slotName,
		diagnostic.parseKind,
		diagnostic.storageKinds.join(',')
	].join(' ');
}

interface UnaliasDiagnosticSink {
	readonly diagnostics: ParseKindCollisionDiagnostic[];
	readonly seen: Set<string>;
}

function recordUnaliasDiagnostic(sink: UnaliasDiagnosticSink, diagnostic: ParseKindCollisionDiagnostic): void {
	const key = unaliasDiagnosticKey(diagnostic);
	if (sink.seen.has(key)) return;
	sink.seen.add(key);
	sink.diagnostics.push(diagnostic);
}

export function getEnrichUnaliasDiagnostics(grammar: unknown): readonly ParseKindCollisionDiagnostic[] {
	if (!grammar || typeof grammar !== 'object') return [];
	const diagnostics = (grammar as Record<string, unknown>)[ENRICH_UNALIAS_DIAGNOSTICS_KEY];
	return Array.isArray(diagnostics) ? (diagnostics as ParseKindCollisionDiagnostic[]) : [];
}

interface UnaliasCandidate {
	readonly targetName: string;
	readonly slotKey: string | undefined;
	readonly storageKind: string | undefined;
	readonly resolvedBody: RuntimeRule;
	readonly aliasSite?: { readonly path: readonly (string | number)[]; readonly content: Rule; readonly named: boolean };
}

function collectUnaliasCandidates(
	node: Rule,
	path: readonly (string | number)[],
	slotKey: string | undefined,
	rulesBag: Record<string, Rule>,
	out: UnaliasCandidate[],
	walker: RuleWalker,
	visited: Set<string> = new Set(),
	supertypeNames: ReadonlySet<string> = new Set(),
	// `path` addresses a real, editable location in the TOP-LEVEL rule passed
	// to `applyUnaliasDistinct` only while every ancestor call stayed within
	// that rule's own tree. Once a bare-symbol expansion (below) descends into
	// a REFERENCED rule's body instead, `path` keeps accumulating segments
	// relative to that OTHER rule's structure — segments `rewriteUnaliasAt`
	// cannot follow, since the top-level rule's tree has only a bare SYMBOL at
	// that point, not the referenced rule's expanded shape. `rewritable`
	// tracks whether we're still inside the original rule's own tree; once
	// false (set the moment expansion crosses into a referenced rule), it
	// stays false for every deeper call, and any ALIAS found from then on is
	// witness-only (contributes to collision detection / signature voting)
	// and must never be handed to `rewriteUnaliasAt`.
	rewritable = true
): void {
	const t = (node as { type?: string }).type;
	if (!t) return;
	if (t === 'ALIAS') {
		const aliasRule = node as unknown as { content: Rule; value: string; named: boolean };
		const storageKind = isSymbolType(aliasRule.content.type)
			? (aliasRule.content as unknown as { name?: string }).name
			: undefined;
		const resolvedBody = normalizeMember(
			(storageKind !== undefined ? rulesBag[storageKind] : undefined) ?? aliasRule.content
		);
		out.push({
			targetName: aliasRule.value,
			slotKey,
			storageKind,
			resolvedBody,
			aliasSite: rewritable ? { path, content: aliasRule.content, named: aliasRule.named } : undefined
		});
		return; // do not descend into the alias's own content
	}
	if (isSymbolType(t)) {
		const name = (node as unknown as { name?: string }).name;
		if (typeof name === 'string') {
			const target = rulesBag[name];
			const resolvedBody = normalizeMember(target ?? node);
			// A bare reference to a rule whose OWN body is a pure CHOICE gets
			// its own display identity UNLESS the rule is hidden (leading `_`)
			// or a declared supertype — those are the only two mechanisms
			// that make tree-sitter collapse straight through to whichever
			// arm matched (the same fact this compiler's supertype
			// classification already relies on elsewhere); a plain visible,
			// non-supertype CHOICE-shaped rule still emits its OWN wrapper
			// node, so expanding into it here would be checking the wrong
			// question. When the erasure condition holds, expand into the
			// rule instead of registering ONE leaf candidate named after the
			// union itself, so a sibling alias whose target is only reachable
			// through one of THIS union's arms — not the union's own name —
			// is still caught as a genuine parsekind-noninjective collision
			// (confirmed case: python's argument_list, whose bare `expression`
			// arm — a declared supertype — reaches `parenthesized_expression`
			// several levels down, colliding with a sibling
			// `alias($.parenthesized_list_splat, $.parenthesized_expression)`
			// arm). `visited` guards against infinite recursion through
			// self/mutually-recursive union grammars (e.g. `expression`
			// referencing itself).
			const erasesToArms = name.startsWith('_') || supertypeNames.has(name);
			if (target !== undefined && erasesToArms && isChoiceType(resolvedBody.type) && !visited.has(name)) {
				visited.add(name);
				collectUnaliasCandidates(target, path, slotKey, rulesBag, out, walker, visited, supertypeNames, false);
				return;
			}
			out.push({ targetName: name, slotKey, storageKind: name, resolvedBody });
		}
		return;
	}
	const nextSlotKey = isFieldType(t) ? ((node as unknown as { name?: string }).name ?? slotKey) : slotKey;
	for (const { segment, child } of walker.childEdgesOf(node as unknown as AnyRule)) {
		collectUnaliasCandidates(
			child as unknown as Rule,
			[...path, ...segment],
			nextSlotKey,
			rulesBag,
			out,
			walker,
			visited,
			supertypeNames,
			rewritable
		);
	}
}

function rewriteUnaliasAt(node: Rule, path: readonly (string | number)[], replacement: Rule): Rule {
	if (path.length === 0) return replacement;
	const [key, ...rest] = path;
	if (key === 'members') {
		const idx = rest[0] as number;
		const members = (node as unknown as { members: Rule[] }).members.slice();
		members[idx] = rest.length > 1 ? rewriteUnaliasAt(members[idx]!, rest.slice(1), replacement) : replacement;
		return { ...node, members } as Rule;
	}
	const k = key as string;
	const child = (node as unknown as Record<string, Rule>)[k]!;
	return { ...node, [k]: rest.length > 0 ? rewriteUnaliasAt(child, rest, replacement) : replacement } as Rule;
}

function applyUnaliasDistinct(
	ruleName: string,
	rule: Rule,
	rulesBag: Record<string, Rule>,
	kwRules: Record<string, Rule>,
	clauseGroupRules: Record<string, Rule>,
	supertypeNames: ReadonlySet<string>
): { rule: Rule; diagnostics: ParseKindCollisionDiagnostic[] } {
	const candidates: UnaliasCandidate[] = [];
	collectUnaliasCandidates(rule, [], undefined, rulesBag, candidates, new RuleWalker(), new Set(), supertypeNames);
	if (candidates.length === 0) return { rule, diagnostics: [] };

	// Bucket by `(slotKey ?? targetName, targetName)` — NOT `targetName` alone.
	// Two aliases sharing a target name but living in different fields are
	// genuinely distinguishable (the field name disambiguates the read-time
	// slot), so they must not be merged into one collision bucket. `slotName`
	// is the effective slot key carried onto the diagnostic (the enclosing
	// field name when field-wrapped, else the target name — matching the
	// assemble-time caller's use of the resolved slot name).
	const byBucket = new Map<string, { slotName: string; targetName: string; bucket: UnaliasCandidate[] }>();
	for (const candidate of candidates) {
		const slotName = candidate.slotKey ?? candidate.targetName;
		const key = `${slotName} ${candidate.targetName}`;
		const entry = byBucket.get(key) ?? { slotName, targetName: candidate.targetName, bucket: [] };
		entry.bucket.push(candidate);
		byBucket.set(key, entry);
	}

	// Per-candidate resolution: 'drop' (visible storage kind — bare content
	// replaces the alias site) or a retarget name (hidden storage kind — a
	// faithful new ALIAS node with the same content/named, stripped value).
	const toDrop = new Set<UnaliasCandidate>();
	const toRetarget = new Map<UnaliasCandidate, string>();
	const diagnostics: ParseKindCollisionDiagnostic[] = [];
	// Retarget names already claimed EARLIER in THIS call (across all buckets).
	// Two distinct hidden storage kinds that strip to the same name (e.g.
	// `_foo` and `__foo` → `foo`) would otherwise both be scheduled to retarget
	// to `foo`, recreating the exact non-injective collision this pass exists to
	// eliminate — under the new name. First-claimer wins; later collisions
	// decline (their diagnostic stays at original severity, same as the
	// pre-existing name-collision guard against `rulesBag`/etc.).
	const claimedRetargetNames = new Set<string>();

	for (const { slotName, targetName, bucket } of byBucket.values()) {
		// A collision needs at least one ALIAS site (only aliasing can make a
		// storage kind's parse kind differ from its own name) plus 2+ entries
		// overall sharing the target name.
		if (bucket.length < 2 || !bucket.some((c) => c.aliasSite)) continue;
		const signatures = clusterSignatures(bucket.map((c) => c.resolvedBody));
		const values: ParseKindCollisionValue<UnaliasCandidate>[] = bucket.map((candidate, i) => ({
			original: candidate,
			parseKind: targetName,
			storageKind: candidate.storageKind,
			structuralSignature: signatures[i]!
		}));
		// Representative ("this parse kind's canonical shape") signature. A
		// candidate whose OWN signature matches it is NOT genuinely distinct and
		// is skipped, even though the bucket as a whole fired the diagnostic
		// because of some OTHER candidate.
		//
		// Prefer the signature of the candidate whose `storageKind === targetName`
		// — the bare, self-referencing value that IS the native identity for this
		// parse kind. Only when the bucket has no such native value do we fall
		// back to majority-by-frequency. Frequency alone is wrong: for
		// `choice(alias(a1, y), alias(a2, y), y)` where a1/a2 share one shape and
		// the bare `y` differs, majority-vote (2 vs 1) would pick a1/a2's shape as
		// representative and skip BOTH aliases, leaving the real a1/a2-vs-y
		// collision unresolved. Anchoring on the native `y` fixes that.
		let representativeSignature: string | undefined;
		const nativeIndex = bucket.findIndex((c) => c.storageKind !== undefined && c.storageKind === targetName);
		if (nativeIndex !== -1) {
			representativeSignature = signatures[nativeIndex];
		} else {
			const signatureCounts = new Map<string, number>();
			for (const signature of signatures) signatureCounts.set(signature, (signatureCounts.get(signature) ?? 0) + 1);
			let representativeCount = 1;
			for (const [signature, count] of signatureCounts) {
				if (count > representativeCount) {
					representativeSignature = signature;
					representativeCount = count;
				}
			}
		}
		const resolution = diagnoseParseKindCollisions({ ownerKind: ruleName, slotName, values });
		for (const diagnostic of resolution.diagnostics) {
			// diagnoseParseKindCollisions reasons in aggregate over the bucket and
			// doesn't identify which specific site(s) collided — since the
			// diagnostic only fires on genuine structural distinctness, acting on
			// every GENUINELY DISTINCT alias site in the bucket is correct (never
			// safe to keep one aliased and not another once distinctness is
			// proven) — but a candidate matching the bucket's majority signature
			// (see `representativeSignature` above) is NOT genuinely distinct and
			// is skipped. Each remaining site independently branches drop vs.
			// retarget vs. decline-with-original-severity below.
			let anyActed = false;
			for (const [index, candidate] of bucket.entries()) {
				if (!candidate.aliasSite || candidate.storageKind === undefined) continue;
				if (representativeSignature !== undefined && signatures[index] === representativeSignature) continue;
				const isHidden = candidate.storageKind.startsWith('_');
				if (!isHidden) {
					toDrop.add(candidate);
					anyActed = true;
					continue;
				}
				const strippedName = candidate.storageKind.replace(/^_+/, '');
				const collides =
					// Empty stripped name (a storage kind that is all underscores, e.g.
					// `_`): there's no valid name to retarget to — decline.
					strippedName === '' ||
					// Already claimed by an EARLIER retarget in this same call (see
					// `claimedRetargetNames`) — declining here avoids re-introducing a
					// non-injective collision under the stripped name.
					claimedRetargetNames.has(strippedName) ||
					Object.hasOwn(rulesBag, strippedName) ||
					Object.hasOwn(kwRules, strippedName) ||
					Object.hasOwn(clauseGroupRules, strippedName);
				if (collides) {
					// Name-collision guard: leave this candidate's alias untouched;
					// its diagnostic keeps original (error) severity below — do not
					// downgrade or suppress it.
					continue;
				}
				claimedRetargetNames.add(strippedName);
				toRetarget.set(candidate, strippedName);
				anyActed = true;
			}
			// Only downgrade/record the diagnostic when at least one candidate in
			// this bucket was actually acted on (dropped or retargeted); a bucket
			// where every candidate was declined via the name-collision guard must
			// keep firing at its original error severity, unchanged. Rewrite the
			// wording too, not just the severity — `diagnoseParseKindCollisions`
			// phrases every diagnostic as a live, actionable problem ("collapses
			// onto parse kind X", "give each colliding arm a distinct alias"),
			// but this one describes the BASE grammar's alias shape and has
			// already been fixed by the rewrite below — left as the original
			// wording, it reads as an open issue in the compiled/enriched
			// grammar when it is neither: it's a resolved fact about the
			// upstream construct, kept only for audit visibility.
			if (anyActed) {
				diagnostics.push({
					...diagnostic,
					severity: 'info',
					message: `${diagnostic.message} Found in the base grammar; automatically resolved by giving each colliding arm its own distinct alias.`,
					proposal: 'Already resolved by enrich() — no action needed.'
				});
			}
		}
	}

	if (toDrop.size === 0 && toRetarget.size === 0) return { rule, diagnostics: [] };

	let result = rule;
	for (const candidate of toDrop) {
		result = rewriteUnaliasAt(result, candidate.aliasSite!.path, candidate.aliasSite!.content);
	}
	for (const [candidate, strippedName] of toRetarget) {
		const retargeted = {
			type: 'ALIAS',
			content: candidate.aliasSite!.content,
			named: candidate.aliasSite!.named,
			value: strippedName
		} as unknown as Rule;
		result = rewriteUnaliasAt(result, candidate.aliasSite!.path, retargeted);
	}
	return { rule: result, diagnostics };
}

function clauseHoistSynthName(
	seqBody: Rule,
	parentKind: string,
	dedupeMap: Record<string, string>,
	counter: ClauseHoistCounter,
	rulesBag: Record<string, Rule>,
	clauseGroupRules: Record<string, Rule>
): string | null {
	const key = ruleKey(seqBody as RuntimeRule);
	const existing = dedupeMap[key];
	if (existing !== undefined) {
		// Dedupe hit: reuse the already-assigned name. Do NOT increment the
		// counter again — the ordinal slot was consumed when the name was first
		// created. Inject into clauseGroupRules if not there yet.
		if (!(existing in clauseGroupRules)) {
			clauseGroupRules[existing] = seqBody;
		}
		return existing;
	}
	// Increment FIRST so the slot is reserved before any collision check.
	counter.opt += 1;
	const name = `_${parentKind}_optional${counter.opt}`;
	// Collision guard: if base.grammar.rules already has this name, skip.
	if (name in rulesBag) {
		process.stderr.write(
			`enrich: clause-hoist skipped for '${parentKind}' — rule '${name}' already exists in base.grammar.rules\n`
		);
		return null;
	}
	dedupeMap[key] = name;
	clauseGroupRules[name] = seqBody;
	return name;
}

// Singleton-ordinal collapse — see docs/glossary/dsl.md (`collapseSingletonMintOrdinals`).
function collapseSingletonMintOrdinals(
	mergedRules: Record<string, Rule>,
	mintedRules: Record<string, Rule>,
	visibleGroupHiddenNames: Set<string>,
	clauseGroupOwners: Map<string, string>
): void {
	const byParentFlavor = new Map<string, string[]>();
	for (const hidden of Object.keys(mintedRules)) {
		const m = /^_(.+)_(arm|group)(\d+)$/.exec(hidden);
		if (!m) continue;
		const key = `${m[1]}_${m[2]}`;
		const bucket = byParentFlavor.get(key);
		if (bucket) bucket.push(hidden);
		else byParentFlavor.set(key, [hidden]);
	}
	const renames = new Map<string, string>();
	for (const [bare, hiddens] of byParentFlavor) {
		if (hiddens.length !== 1) continue;
		const oldHidden = hiddens[0]!;
		const newHidden = `_${bare}`;
		if (newHidden in mergedRules || bare in mergedRules) continue;
		renames.set(oldHidden, newHidden);
		renames.set(oldHidden.replace(/^_/, ''), bare);
	}
	if (renames.size === 0) return;
	for (const [oldName, newName] of renames) {
		if (oldName.startsWith('_') && oldName in mergedRules) {
			mergedRules[newName] = mergedRules[oldName]!;
			delete mergedRules[oldName];
		}
		// The minted-rule bag is read again after this pass (clauseGroupNames
		// derives the inline list from its keys) — rename there too.
		if (oldName.startsWith('_') && oldName in mintedRules) {
			mintedRules[newName] = mintedRules[oldName]!;
			delete mintedRules[oldName];
		}
		if (visibleGroupHiddenNames.delete(oldName)) visibleGroupHiddenNames.add(newName);
		const owner = clauseGroupOwners.get(oldName);
		if (owner !== undefined) {
			clauseGroupOwners.delete(oldName);
			clauseGroupOwners.set(newName, owner);
		}
	}
	const rewrite = (node: unknown): void => {
		if (Array.isArray(node)) {
			for (const m of node) rewrite(m);
			return;
		}
		if (node === null || typeof node !== 'object') return;
		const r = node as { type?: string; name?: string; value?: unknown } & Record<string, unknown>;
		if (typeof r.name === 'string' && renames.has(r.name)) r.name = renames.get(r.name)!;
		if (r.type === 'ALIAS' && typeof r.value === 'string' && renames.has(r.value)) r.value = renames.get(r.value)!;
		for (const v of Object.values(r)) rewrite(v);
	};
	for (const name of Object.keys(mergedRules)) rewrite(mergedRules[name]);
}
function visibleGroupSynthName(
	content: Rule,
	parentKind: string,
	groupDedupeMap: Record<string, string>,
	counter: ClauseHoistCounter,
	rulesBag: Record<string, Rule>,
	clauseGroupRules: Record<string, Rule>,
	// PR 3 (2026-07-21 union-slot design): the PREC wrapper (if any)
	// enclosing the CHOICE this content was extracted from — see
	// `applyClauseHoist`'s `ambientPrec` doc comment. Applied to the
	// registered hidden rule's OWN body so extracting an arm out of a
	// deliberately low/high-precedence choice (e.g. rust's
	// `or_pattern: $ => prec.left(-2, choice(...))`) doesn't strip that
	// precedence from the extracted piece and create a NEW ambiguity that
	// didn't exist in the un-extracted grammar.
	ambientPrec?: Rule,
	// The field this content was hoisted out of (e.g. `field('attributes',
	// optional(seq(...)))`), if any — `applyClauseHoist` threads this
	// through FIELD/PREC/REPEAT/OPTIONAL descent, resetting it at SEQ/CHOICE
	// member boundaries (a seq member is no longer "the field's content").
	// Naming the group after the field it fills (`_<parent>_<field>`) is
	// more legible than an opaque ordinal and reuses a name the grammar
	// author already chose, rather than minting a fresh one.
	enclosingFieldName?: string,
	// Ordinal-fallback suffix: 'arm' when the minted content is a CHOICE
	// arm (mintStructuredChoiceArm), 'group' for a nested sequence group —
	// the two constructs carry distinct name suffixes.
	flavor: 'group' | 'arm' = 'group'
): { visibleName: string; hiddenName: string } | null {
	if (process.env.SITTIR_DEBUG_LISTNAME) {
		const info = separatedListBodyInfo(content);
		process.stderr.write(
			`[listname] mint for parent='${parentKind}' list=${JSON.stringify(info)} counts=${
				info?.elementName ? separatedListNameCounts?.get(pluralizeFieldName(info.elementName)) : '-'
			}\n`
		);
	}
	const registeredBody = ambientPrec ? ({ ...ambientPrec, content } as Rule) : content;
	// Key on the registered body, not the bare content: two occurrences of
	// the identical content under different ambient precedence must NOT
	// dedupe to one hidden rule, or the second occurrence's precedence
	// silently vanishes (first-registered body wins at line below).
	const key = ruleKey(registeredBody as RuntimeRule);
	const existing = groupDedupeMap[key];
	if (existing !== undefined) {
		const hiddenName = `_${existing}`;
		if (!(hiddenName in clauseGroupRules)) clauseGroupRules[hiddenName] = registeredBody;
		return { visibleName: existing, hiddenName };
	}
	const base = parentKind.replace(/^_+/, '');
	const register = (visibleName: string, body: Rule = registeredBody): { visibleName: string; hiddenName: string } => {
		const hiddenName = `_${visibleName}`;
		groupDedupeMap[key] = visibleName;
		// Pass 1 — uniform hidden creation: register the seq body as a HIDDEN
		// rule so tree-sitter sees a single named symbol to alias.
		clauseGroupRules[hiddenName] = body;
		return { visibleName, hiddenName };
	};
	// Separated-list naming: a flank-carrying list body names its kind after
	// its element — the bare pluralized element name when globally unique
	// (`use_clauses`), else the `<parent>_<field>` composite, else
	// `<parent>_elements`. Falls through to the ordinal path only when every
	// candidate is taken.
	const listInfo = separatedListNameCounts !== null ? separatedListBodyInfo(content) : null;
	if (listInfo?.flankCarrying) {
		const nameFree = (n: string) =>
			!(n in rulesBag) && !(`_${n}` in rulesBag) && !(n in clauseGroupRules) && !(`_${n}` in clauseGroupRules);
		const bare = listInfo.elementName !== null ? pluralizeFieldName(listInfo.elementName) : null;
		const candidates: string[] = [];
		if (bare !== null && separatedListNameCounts!.get(bare) === 1) candidates.push(bare);
		if (bare !== null && base !== bare && !base.endsWith(`_${bare}`)) candidates.push(`${base}_${bare}`);
		if (bare !== `${base}_elements`) candidates.push(base.endsWith('_elements') ? base : `${base}_elements`);
		// Register the FLATTENED head-form spelling — the canonical shape the
		// link phase's separator lift recognizes, so the kind classifies
		// 'separatedList' (kind-level flank keys) instead of 'group' with
		// per-field capture. Language-identical (seq nesting is associative);
		// the ambient prec wrapper re-applies around the flat seq.
		const flatBody = { ...content, members: listInfo.flatMembers } as Rule;
		const registeredFlat = ambientPrec ? ({ ...ambientPrec, content: flatBody } as Rule) : flatBody;
		for (const candidate of candidates) {
			if (!nameFree(candidate)) continue;
			const skipped =
				separatedListEnrichSkip !== null &&
				(separatedListEnrichSkip.has(candidate) || separatedListEnrichSkip.has(`_${candidate}`));
			return register(candidate, skipped ? registeredBody : registeredFlat);
		}
	}
	if (enclosingFieldName !== undefined) {
		const visibleName = `${base}_${enclosingFieldName}`;
		// Also decline when a DIFFERENT group body already claimed this same
		// field-derived name (e.g. two distinct group bodies under the same
		// parent both wrapped in `field('body', ...)`) — `rulesBag` alone
		// can't see this, since a synthesized hidden name only ever lands in
		// `clauseGroupRules`, never the base grammar.
		if (!(visibleName in rulesBag) && !(`_${visibleName}` in rulesBag) && !(`_${visibleName}` in clauseGroupRules)) {
			return register(visibleName);
		}
	}
	const ordinal = flavor === 'arm' ? ++counter.arm : ++counter.grp;
	const visibleName = `${base}_${flavor}${ordinal}`;
	const hiddenName = `_${visibleName}`;
	if (visibleName in rulesBag || hiddenName in rulesBag) {
		process.stderr.write(
			`enrich: visible-group skipped for '${parentKind}' — rule '${visibleName}'/'${hiddenName}' already exists in base.grammar.rules\n`
		);
		return null;
	}
	return register(visibleName);
}

function promoteExistingHiddenRuleName(
	existingHiddenName: string,
	parentKind: string,
	groupDedupeMap: Record<string, string>,
	counter: ClauseHoistCounter,
	rulesBag: Record<string, Rule>,
	// See visibleGroupSynthName's `flavor` — armN for choice arms.
	flavor: 'group' | 'arm' = 'group'
): { visibleName: string } | null {
	const existing = groupDedupeMap[existingHiddenName];
	if (existing !== undefined) return { visibleName: existing };
	// The rule being promoted already HAS an identity — its own stripped
	// name (`_simple_statements` surfacing visibly is `simple_statements`,
	// not an ordinal `<parent>_group<N>`). Reusing the stripped spelling
	// also converges with any other alias of the same rule under that name
	// (e.g. an upstream reference-site alias): every site then shares ONE
	// visible name, so tree-sitter keeps one symbol for the pair instead of
	// minting a second visible kind for identical content. Ordinal naming
	// survives only as the collision fallback.
	const natural = existingHiddenName.replace(/^_+/, '');
	if (natural.length > 0 && !(natural in rulesBag)) {
		groupDedupeMap[existingHiddenName] = natural;
		return { visibleName: natural };
	}
	const ordinal = flavor === 'arm' ? ++counter.arm : ++counter.grp;
	const visibleName = `${parentKind.replace(/^_+/, '')}_${flavor}${ordinal}`;
	if (visibleName in rulesBag) {
		process.stderr.write(
			`enrich: visible-group promotion skipped for '${parentKind}' — rule '${visibleName}' already exists in base.grammar.rules\n`
		);
		return null;
	}
	groupDedupeMap[existingHiddenName] = visibleName;
	return { visibleName };
}

function armLeadingSymbolName(
	rule: Rule,
	rulesBag: Record<string, Rule>,
	seen: Set<Rule> = new Set()
): string | undefined {
	if (seen.has(rule)) return undefined;
	seen.add(rule);
	const t = (rule as { type?: string }).type;
	if (typeof t !== 'string') return undefined;
	if (isSymbolType(t)) {
		const name = (rule as { name?: string }).name;
		if (typeof name !== 'string') return undefined;
		const hidden = (rule as { hidden?: boolean }).hidden;
		// A VISIBLE symbol is its own meaningful boundary for LR
		// prefix-collision purposes — stop here. A HIDDEN symbol is
		// invisible to the parser's distinguishable-item boundary, so its
		// OWN leading symbol (descend into its body) is what matters.
		if (!hidden) return name;
		const body = rulesBag[name];
		return body ? (armLeadingSymbolName(body, rulesBag, seen) ?? name) : name;
	}
	if (isSeqType(t)) {
		const members = (rule as unknown as { members?: Rule[] }).members;
		const first = Array.isArray(members) ? members[0] : undefined;
		return first ? armLeadingSymbolName(first, rulesBag, seen) : undefined;
	}
	if (isChoiceType(t)) {
		// A nested choice's own leading symbol is ambiguous (varies per
		// branch) — conservatively report none rather than pick one arm.
		return undefined;
	}
	// Single-content wrappers (optional/field/repeat/prec/token/...) — the
	// leftmost path travels through their one child, same convention as
	// this file's other structural walks (e.g. `countBodyAnchors`-style
	// content fallback in dsl/transform/transform.ts).
	const content = (rule as { content?: Rule }).content;
	return content ? armLeadingSymbolName(content, rulesBag, seen) : undefined;
}

function armStartsWithSymbol(
	rule: Rule,
	collidingLeadingNames: ReadonlySet<string>,
	rulesBag: Record<string, Rule>
): boolean {
	if (collidingLeadingNames.size === 0) return false;
	const name = armLeadingSymbolName(rule, rulesBag);
	return name !== undefined && collidingLeadingNames.has(name);
}

/** A position whose content is a literal choice: one string, or a choice
 *  of strings — the shape a kind-enum slot carries. */
function isLiteralChoiceContent(rule: Rule): boolean {
	if (isStringType((rule as { type?: string }).type as string)) return true;
	if (isChoiceType((rule as { type?: string }).type as string)) {
		const members = (rule as unknown as { members?: Rule[] }).members;
		return Array.isArray(members) && members.every((m) => isLiteralChoiceContent(m));
	}
	return false;
}

/**
 * Two choice arms that differ ONLY at literal-choice positions must stay
 * one kind with an enum slot — splitting them would mint a form whose
 * sole difference is a cardinality-1 (determined) enum.
 * `mintStructuredChoiceArm`'s callers decline such arms. Returns true
 * when the arms are structurally identical except for at least one
 * literal-choice position whose texts differ.
 */
export function armsDifferOnlyByLiteralChoice(a: Rule, b: Rule): boolean {
	let literalDeltas = 0;
	const peel = (r: Rule): Rule => {
		while (isPrecWrapper(r as { type: string }) && (r as { content?: Rule }).content) {
			r = (r as { content: Rule }).content;
		}
		return r;
	};
	const same = (x: Rule, y: Rule): boolean => {
		x = peel(x);
		y = peel(y);
		if (isLiteralChoiceContent(x) && isLiteralChoiceContent(y)) {
			if (JSON.stringify(x) !== JSON.stringify(y)) literalDeltas++;
			return true;
		}
		const tx = (x as { type?: string }).type;
		const ty = (y as { type?: string }).type;
		if (tx !== ty || typeof tx !== 'string') return false;
		if (isSymbolType(tx)) return (x as { name?: string }).name === (y as { name?: string }).name;
		if (isFieldType(tx)) {
			return (
				(x as { name?: string }).name === (y as { name?: string }).name &&
				same((x as unknown as { content: Rule }).content, (y as unknown as { content: Rule }).content)
			);
		}
		const mx = (x as unknown as { members?: Rule[] }).members;
		const my = (y as unknown as { members?: Rule[] }).members;
		if (Array.isArray(mx) || Array.isArray(my)) {
			if (!Array.isArray(mx) || !Array.isArray(my) || mx.length !== my.length) return false;
			return mx.every((m, i) => same(m, my[i]!));
		}
		const cx = (x as { content?: Rule }).content;
		const cy = (y as { content?: Rule }).content;
		if (cx !== undefined || cy !== undefined) {
			return cx !== undefined && cy !== undefined && same(cx, cy);
		}
		return JSON.stringify(x) === JSON.stringify(y);
	};
	// EXACTLY one differing position: the delta must be expressible as ONE
	// enum slot. Arms differing at two literal positions (`new.target` vs
	// `import.meta`) are distinct forms — folding them would cross-combine
	// the literals.
	return same(a, b) && literalDeltas === 1;
}

/**
 * Normalize a permutation choice's arms (`isPermutationChoice`) so every raw
 * word-shaped keyword step carries the same marker-field shape the
 * optional-keyword pass gives optional spellings: a REQUIRED keyword in one
 * arm and `optional('<kw>')` in a sibling are the same modifier slot, and
 * slot merging needs both spelled `field('<kw>_marker', $._kw_<kw>_marker)`.
 * Scoped to permutation arms only — global bare-keyword promotion is
 * deliberately off (it shifts parser tables grammar-wide).
 */
function promotePermutationArmKeywords(
	choiceRule: Rule,
	kwRules: Record<string, Rule>,
	rulesBag: Record<string, Rule>,
	wordMatcher: RegExp | undefined
): Rule {
	const members = (choiceRule as unknown as { members: Rule[] }).members;
	let changed = false;
	const newMembers = members.map((arm) => {
		if (!isSeqType((arm as { type?: string }).type as string)) return arm;
		const seqMembers = (arm as unknown as { members: Rule[] }).members;
		let armChanged = false;
		const newSeq = seqMembers.map((m) => {
			const norm = normalizeMember(m);
			if (!isStringType(norm.type) || typeof norm.value !== 'string') return m;
			if (!matchesWordShape(norm.value, wordMatcher)) return m;
			const fieldName = `${norm.value}_marker`;
			const symbolRef = registerKwRule(m, fieldName, kwRules, rulesBag);
			if (symbolRef === null) return m;
			armChanged = true;
			return makeField(fieldName, symbolRef);
		});
		if (!armChanged) return arm;
		changed = true;
		return { ...arm, members: newSeq } as Rule;
	});
	return changed ? ({ ...choiceRule, members: newMembers } as Rule) : choiceRule;
}

function mintStructuredChoiceArm(
	arm: Rule,
	parentKind: string,
	rulesBag: Record<string, Rule>,
	clauseGroupRules: Record<string, Rule>,
	counter: ClauseHoistCounter,
	groupDedupeMap: Record<string, string>,
	visibleGroupHiddenNames: Set<string>,
	clauseGroupOwners: Map<string, string>,
	collidingLeadingNames: ReadonlySet<string>,
	ambientPrec?: Rule,
	// See visibleGroupSynthName's doc comment — same field-derived naming as
	// applyClauseHoist's OPTIONAL-position callers thread in; only those
	// callers pass a value, seq/choice-member callers correctly omit it (a
	// member is a distinct position, not "the field's content" as a whole).
	enclosingFieldName?: string
): Rule | null {
	const t = (arm as { type?: string }).type;
	if (typeof t !== 'string') return null;
	if (armStartsWithSymbol(arm, collidingLeadingNames, rulesBag)) return null;

	// Descend through a precedence wrapper (PREC/PREC_LEFT/PREC_RIGHT/
	// PREC_DYNAMIC — tree-sitter's own dsl.js prec shape, now matched under
	// sittir's runtime too, see evaluate.ts's `prec`). Mint on the CONTENT,
	// then re-wrap the resulting alias/symbol-ref IN THE SAME PREC — not the
	// other way around. Tree-sitter's LR conflict resolution needs the
	// precedence visible AT THE CHOICE-ARM POSITION (where this alternative
	// competes against its siblings), not buried one level down inside the
	// minted hidden rule's own body: a bare alias at the arm position carries
	// NO precedence signal to the enclosing choice's own conflict resolution,
	// which is exactly what broke typescript's `binary_expression`'s `in`
	// arm — extracting it left `for (var x = y in z)` unable to disambiguate
	// against `_initializer` (no explicit conflict references the new
	// symbol). Embedding the alias inside the prec (not the reverse)
	// preserves the SAME precedence signal, in the SAME position, that the
	// un-extracted `prec.left(N, seq(...))` arm carried before minting.
	// Without this branch at all, a PREC-wrapped arm's `type` matches neither
	// `isSymbolType` nor `isSeqType`/`isChoiceType` below and this function
	// declines — the original divergence this branch closes.
	if (isPrecWrapper(arm as { type: string })) {
		const content = (arm as { content?: Rule }).content;
		if (!content) return null;
		// Thread this prec wrapper down as `ambientPrec` (mirrors
		// `applyClauseHoist`'s `innerAmbientPrec` at the analogous descent) so
		// `visibleGroupSynthName` also applies it to the minted hidden rule's
		// OWN body, not only to the outer alias re-wrapped below. A choice arm
		// like `prec('call', seq(field('function', choice($.expression, ...)),
		// ...))` carries an ambiguity (here: `expression` reaching
		// `instantiation_expression`) INSIDE that seq — the precedence needs to
		// stay in scope there too, not just at the arm position, or the
		// internal conflict falls back to unrelated lookahead-sensitive
		// tie-breaking instead of the precedence the un-extracted grammar
		// used to resolve it with.
		const minted = mintStructuredChoiceArm(
			content,
			parentKind,
			rulesBag,
			clauseGroupRules,
			counter,
			groupDedupeMap,
			visibleGroupHiddenNames,
			clauseGroupOwners,
			collidingLeadingNames,
			arm,
			enclosingFieldName
		);
		if (!minted) return null;
		return { ...arm, content: minted } as Rule;
	}

	if (isSymbolType(t)) {
		const name = (arm as { name?: string }).name;
		// Hidden-ness by NAME (`_` prefix — tree-sitter's own convention), NOT
		// the constructor-stamped `hidden` attribute: the stamp exists only
		// under sittir's runtime. Under tree-sitter's CLI runtime (the bundled
		// grammar.js executing this same code), `sym()` produces no `hidden`
		// property, so a stamp-based check silently declines the mint on the
		// parser side while the IR side mints — the exact phantom-kind
		// divergence this file's mints kept hitting.
		if (typeof name !== 'string' || !name.startsWith('_')) return null; // already a real/visible kind — fine as-is
		// DECLARED supertype arm (grammar `supertypes:` array — a declared
		// fact, never structural inference): decline. A declared supertype
		// is already a dispatchable union — its subtype expansion IS its
		// runtime identity — so a mint adds nothing, while the alias wrapper
		// it introduces (a) inserts a CST node level into every tree the
		// supertype appears in, and (b) severs the supertype's wrap-time
		// concrete-kind expansion (keyed on `modelType === 'supertype'`).
		// Empirically: minting python's `_compound_statement` arm produced
		// `statement_group2` wrappers that broke wrap universally (0/115).
		if (counter.supertypeNames?.has(name)) return null;
		// Enrich's OWN synthesized helpers (`_<parent>_optional<N>` clause
		// hoists and prior group mints — every key in `clauseGroupRules`, a
		// declared set, no inference): decline. These are inline-SAFE by
		// construction — their whole design is "hidden helper, spliced away
		// via `inline:`" (syntheticInline). Promoting one as a choice-arm
		// mint puts it in `visibleGroupHiddenNames`, which the un-inline
		// sidecar then removes from `inline:` — the exact opposite of the
		// helper's contract (rust: `_block_optional1` et al vaporized,
		// fixtures 399→41).
		if (Object.hasOwn(clauseGroupRules, name)) return null;
		const body = rulesBag[name];
		if (!body || ruleMatchesEmpty(body) || isInlineSafe(body, rulesBag)) return null;
		// STRUCTURALLY supertype-shaped arm (bare choice-of-symbols union,
		// `isSupertypeLike`): decline, same rationale as the declared gate
		// above — a dispatch union's subtype expansion IS its runtime
		// identity, and the mint's alias wrapper both reshapes every tree
		// the union appears in and severs wrap-time concrete-kind expansion.
		// Complements (does not replace) the declared gate: covers undeclared
		// unions like `_expression_ending_with_block`. Shape-only test, so
		// both runtimes decline identically — the prec-transparency
		// divergence (sittir minted this arm, the CLI never saw it as a
		// SYMBOL) cannot recur for this class.
		if (isSupertypeLike(body)) return null;
		const promoted = promoteExistingHiddenRuleName(name, parentKind, groupDedupeMap, counter, rulesBag, 'arm');
		if (!promoted) return null;
		visibleGroupHiddenNames.add(name);
		if (!clauseGroupOwners.has(name)) clauseGroupOwners.set(name, parentKind);
		return makeVisibleGroupAlias(arm, promoted.visibleName);
	}

	if (isSeqType(t) || isChoiceType(t)) {
		if (ruleMatchesEmpty(arm) || isInlineSafe(arm, rulesBag)) return null;
		// Same structural-union decline as the SYMBOL branch above: a bare
		// choice-of-symbols arm IS a dispatch union in place (the spliced
		// body of a supertype-shaped hidden rule reaches this branch when a
		// prior pass inlined the ref) — minting it wraps the union. See
		// `isSupertypeLike`'s doc comment for the two-runtime rationale.
		if (isSupertypeLike(arm)) return null;
		/* Permutable-modifier choice offered whole (optional-position path):
		   same decline as the per-arm path — the markers collapse into the
		   parent's own slots instead of minting a group kind. */
		if (isPermutationChoice(arm, rulesBag, hoistKwRules ?? undefined, hoistWordMatcher)) return null;
		const names = visibleGroupSynthName(
			arm,
			parentKind,
			groupDedupeMap,
			counter,
			rulesBag,
			clauseGroupRules,
			ambientPrec,
			enclosingFieldName,
			'arm'
		);
		if (!names) return null;
		visibleGroupHiddenNames.add(names.hiddenName);
		if (!clauseGroupOwners.has(names.hiddenName)) clauseGroupOwners.set(names.hiddenName, parentKind);
		const symbolRef = makeGroupLiftSymbol(arm, names.hiddenName);
		return makeVisibleGroupAlias(symbolRef, names.visibleName);
	}

	return null;
}

function makeGroupLiftSymbol(_referenceRule: Rule, name: string): Rule {
	// Pure ref — NO inline body. Tree-sitter serializes any extra structural
	// field on a SYMBOL into grammar.json (a `content` here leaks the seq into
	// the parser), so the symbol stays a clean name-ref. `metadata.author` is
	// the only added marker: `dsl/transform/transform-path.ts`'s path-descent
	// (the sanctioned dsl-side reader — doctrine decision 3) reads it and
	// LOOKS UP the referenced `_<parent>_<kind><N>` rule body by name to travel
	// through (not by carrying the body here). `metadata` is inert to
	// tree-sitter's parse tables. (Debt PR-0c: the compiler side no longer
	// reads this tag — `compiler/link.ts`'s `mintContentAliasKinds` and
	// `resolveRule`'s ALIAS case, and `compiler/evaluate.ts`'s
	// `rewriteInlineAliases`, now identify this population structurally via
	// `isClauseHoistVisibleGroupAlias`. The write here stays load-bearing for
	// transform-path only.)
	// Route through the runtime-injected symbol constructor (`symbol` under
	// sittir, `sym` under tree-sitter's CLI — see `nativeRuleFn`) so the ref
	// carries the SAME construction stamps (`hidden`, `inline =
	// name.startsWith('_')`) as every other ref under sittir's runtime —
	// these `_<parent>_<kind>N` helpers are `_`-prefixed → inline=true.
	// Keeping one constructor (revised at push-down / link) makes `inline`
	// authoritative on the normalizedRules path, so normalize's fold can read it.
	// Under tree-sitter's CLI runtime the injected constructor is the raw
	// SYMBOL form (parser-side, never reaches the IR inline gate).
	const symbol = nativeRuleFn<(n: string) => Rule>('symbol', 'sym');
	const base = symbol(name);
	return {
		...base,
		metadata: makeRuleMetadata({ author: 'enrich', symbolSource: 'group-lift' })
	} as unknown as Rule;
}

function makeVisibleGroupAlias(symbolRef: Rule, name: string): Rule {
	const aliasFn = nativeRuleFn<(r: unknown, v: unknown) => Rule>('alias');
	const symbol = nativeRuleFn<(n: string) => Rule>('symbol', 'sym');
	// Pass a SYMBOL value so the runtime constructor sets named:true, value=name
	// (a bare-string value would yield named:false). `metadata.author: 'enrich'`
	// is REQUIRED for transform-path's path-descent (see doc comment above) —
	// the runtime alias() doesn't add it, so stamp it on the cased result.
	return { ...aliasFn(symbolRef, symbol(name)), metadata: makeRuleMetadata({ author: 'enrich' }) };
}

// ---------------------------------------------------------------------------
// Field-enum synthesis — promote inline field-enums to named hidden rules
// ---------------------------------------------------------------------------
//
// `field('operator', choice('+', '-', …))` has no catalog row of its own —
// tree-sitter never sees a name for the choice, only the anon tokens it
// collapses to — the phantom-kind class documented in
// docs/superpowers/specs/2026-07-30-kindid-invariant-restoration.md §1.
// Mints a named hidden rule for each distinct field-enum member set directly
// into the rules bag here, at enrich time, so BOTH runtimes (tree-sitter's
// CLI and sittir's evaluate()) see the same name and tree-sitter issues it a
// real symbol.
//
// `compiler/evaluate.ts`'s post-pass version of this same mechanism is
// DELETED, not still running as a verification pass over it (spec
// docs/superpowers/specs/2026-07-30-kindid-invariant-restoration.md §1 calls
// for the post-pass to become assertion-only; that follow-up hasn't landed
// yet). Concretely: `enrich(base)` runs before `wire()` applies overrides
// (see e.g. `packages/typescript/grammar.sittir.ts`), so a field-enum shape
// introduced only by an override is invisible to this pass and nothing
// synthesizes it — a known, currently-unexercised coverage gap, not a
// silently-caught case.
//
// Ported from evaluate.ts's post-pass version of the same name; differs only
// in operating on the enrich-time `Rule` shape (dual-runtime, pre-link) and
// dropping evaluate's `EvaluateCtx`/provenance bookkeeping and its
// multi-generation `purgeSupersededEnumRules` cleanup — enrich runs exactly
// once per grammar load, so neither applies here.

function synthesizeFieldEnumRules(rules: Record<string, Rule>): void {
	const fieldOccurrences = collectFieldEnumOccurrences(rules);
	const conflictingSites = collectConflictingFieldEnumSites(fieldOccurrences);
	const memberKeyToCanonicalName = buildCanonicalEnumNames(fieldOccurrences, rules);

	const rewrites = new Map<string, Rule>();
	const newRules = new Map<string, Rule>();
	const sweep: FieldEnumSweepState = { rules, newRules, memberKeyToCanonicalName, conflictingSites };
	for (const [parentKind, rule] of Object.entries(rules)) {
		const rewritten = rewriteFieldEnums(rule, parentKind, sweep);
		if (rewritten !== rule) rewrites.set(parentKind, rewritten);
	}

	for (const [kind, newRule] of rewrites) {
		rules[kind] = newRule;
	}
	for (const [kindName, enumRule] of newRules) {
		if (!rules[kindName]) {
			rules[kindName] = enumRule;
		}
	}
}

interface FieldEnumOccurrence {
	readonly parentKind: string;
	readonly fieldName: string;
	readonly memberKey: string;
	readonly members: StringRule[];
}

function collectFieldEnumOccurrences(rules: Record<string, Rule>): FieldEnumOccurrence[] {
	const occurrences: FieldEnumOccurrence[] = [];
	for (const [parentKind, rule] of Object.entries(rules)) {
		walkFieldEnums(rule, rules, parentKind, occurrences);
	}
	return occurrences;
}

function walkFieldEnums(rule: Rule, rules: Record<string, Rule>, parentKind: string, out: FieldEnumOccurrence[]): void {
	switch (rule.type as string) {
		case 'FIELD': {
			const fieldRule = rule as unknown as { name: string; content: Rule };
			// Peel one level of repeat/repeat1 wrapper so that
			// `field(name, repeat(choice('a','b')))` is treated the same as
			// `field(name, choice('a','b'))` for occurrence collection purposes.
			// The repeat wrapper is preserved in the rewrite pass below.
			const enumContent = peelRepeatWrapper(fieldRule.content);
			const members = resolveToEnumMembers(enumContent, rules);
			if (members !== null && members.length > 0) {
				const memberKey = buildEnumMemberKey(members);
				out.push({ parentKind, fieldName: fieldRule.name, memberKey, members });
			}
			// Always recurse into content — a field can nest other fields.
			walkFieldEnums(fieldRule.content, rules, parentKind, out);
			return;
		}
		case 'SEQ':
		case 'CHOICE':
			for (const m of (rule as unknown as { members: Rule[] }).members) walkFieldEnums(m, rules, parentKind, out);
			return;
		case 'OPTIONAL':
		case 'REPEAT':
		case 'REPEAT1':
		case 'VARIANT':
		case 'GROUP':
		case 'TOKEN':
			walkFieldEnums((rule as unknown as { content: Rule }).content, rules, parentKind, out);
			return;
		default:
			return;
	}
}

function buildCanonicalEnumNames(occurrences: FieldEnumOccurrence[], rules: Record<string, Rule>): Map<string, string> {
	// Group occurrences by memberKey.
	const byKey = new Map<string, FieldEnumOccurrence[]>();
	for (const occ of occurrences) {
		let group = byKey.get(occ.memberKey);
		if (!group) {
			group = [];
			byKey.set(occ.memberKey, group);
		}
		group.push(occ);
	}

	// One O(rules) pass building memberKey → existing rule name, rather than
	// rescanning every rule for every distinct occurrence group below.
	// Candidates are collected per key, then resolved to the lexicographically
	// smallest name — NOT first-registration-wins over `Object.entries`
	// iteration order, which is insertion-order-dependent and therefore not
	// guaranteed identical between sittir's own runtime and tree-sitter's CLI
	// (the same live hazard `project_grammar_js_nondeterministic_reorder`
	// documents for python's `grammar.js`). A pick that depends on host
	// iteration order can choose DIFFERENT existing names under the two
	// runtimes for the same member set — minting the exact class of
	// runtime-divergent phantom this pass exists to eliminate.
	const existingNameCandidatesByMemberKey = new Map<string, string[]>();
	for (const [name, rule] of Object.entries(rules)) {
		const resolved = resolveToEnumMembersOneLevelDeep(rule);
		if (resolved === null) continue;
		const key = buildEnumMemberKey(resolved);
		let candidates = existingNameCandidatesByMemberKey.get(key);
		if (!candidates) {
			candidates = [];
			existingNameCandidatesByMemberKey.set(key, candidates);
		}
		candidates.push(name);
	}
	const existingRuleNameByMemberKey = new Map<string, string>();
	for (const [key, candidates] of existingNameCandidatesByMemberKey) {
		existingRuleNameByMemberKey.set(key, candidates.sort()[0]!);
	}

	const result = new Map<string, string>();
	const groups = Array.from(byKey.entries()).map(([memberKey, group], index) => {
		const first = group[0]!;
		const candidate = deriveCandidateName(group, existingRuleNameByMemberKey, first);
		return { memberKey, group, first, index, ...candidate };
	});

	groups.sort((a, b) => a.priority - b.priority || a.index - b.index);

	const claimedNames = new Set<string>();
	for (const group of groups) {
		const chosenName = claimUniqueEnumName(group.name, rules, group.memberKey, claimedNames);
		claimedNames.add(chosenName);
		result.set(group.memberKey, chosenName);
	}

	return result;
}

function fallbackName(occ: FieldEnumOccurrence): string {
	return `_${occ.parentKind}_${occ.fieldName}`;
}

function fieldEnumSiteKey(parentKind: string, fieldName: string): string {
	return `${parentKind} ${fieldName}`;
}

function collectConflictingFieldEnumSites(occurrences: readonly FieldEnumOccurrence[]): ReadonlySet<string> {
	const memberKeysBySite = new Map<string, Set<string>>();
	for (const occ of occurrences) {
		const siteKey = fieldEnumSiteKey(occ.parentKind, occ.fieldName);
		let keys = memberKeysBySite.get(siteKey);
		if (!keys) {
			keys = new Set<string>();
			memberKeysBySite.set(siteKey, keys);
		}
		keys.add(occ.memberKey);
	}
	const conflicting = new Set<string>();
	for (const [siteKey, keys] of memberKeysBySite) {
		if (keys.size > 1) conflicting.add(siteKey);
	}
	return conflicting;
}

function claimUniqueEnumName(
	baseName: string,
	rules: Record<string, Rule>,
	memberKey: string,
	claimedNames: ReadonlySet<string>
): string {
	if (!claimedNames.has(baseName) && canReuseExistingEnumName(baseName, rules, memberKey)) {
		return baseName;
	}
	const slug = enumMemberKeySlug(memberKey);
	let candidate = `${baseName}__${slug}`;
	let attempt = 2;
	while (
		claimedNames.has(candidate) ||
		(!canReuseExistingEnumName(candidate, rules, memberKey) && Object.prototype.hasOwnProperty.call(rules, candidate))
	) {
		candidate = `${baseName}__${slug}_${attempt}`;
		attempt++;
	}
	return candidate;
}

function canReuseExistingEnumName(name: string, rules: Record<string, Rule>, memberKey: string): boolean {
	const existing = rules[name];
	if (existing === undefined) return true;
	const members = resolveToEnumMembersOneLevelDeep(existing);
	if (members === null) return false;
	return buildEnumMemberKey(members) === memberKey;
}

function buildEnumMemberKey(members: readonly StringRule[]): string {
	return [...members]
		.map((m) => m.value)
		.sort()
		.join(',');
}

function enumMemberKeySlug(memberKey: string): string {
	return memberKey
		.split(',')
		.map((member) => {
			const encoded = Array.from(member)
				.map((ch) => (/[A-Za-z0-9]/.test(ch) ? ch.toLowerCase() : `x${ch.codePointAt(0)!.toString(16)}`))
				.join('');
			return encoded.length > 0 ? encoded : 'empty';
		})
		.join('__');
}

function deriveCandidateName(
	group: FieldEnumOccurrence[],
	existingRuleNameByMemberKey: ReadonlyMap<string, string>,
	first: FieldEnumOccurrence
): { name: string; priority: number } {
	// Priority 0: some existing rule, anywhere in the grammar, already has
	// this exact member set — reuse ITS name verbatim (whatever it is,
	// visible or hidden), regardless of whether this occurrence's field
	// happens to share that name. Two rules with identical string-choice
	// bodies are the same production to tree-sitter; minting a second one
	// creates a real, separately-symbolized duplicate the LR table
	// generator then has to disambiguate against the original (e.g.
	// `_accessibility_modifier` vs the pre-existing `accessibility_modifier`).
	const existingName = existingRuleNameByMemberKey.get(first.memberKey);
	if (existingName !== undefined) {
		if (existingName !== first.fieldName && !process.env.SITTIR_QUIET) {
			process.stderr.write(
				`enrich: field '${first.fieldName}' on '${first.parentKind}' reuses existing rule '${existingName}' (identical member set) instead of minting a new one\n`
			);
		}
		return { name: existingName, priority: 0 };
	}

	const allSameFieldName = group.every((o) => o.fieldName === first.fieldName);
	if (allSameFieldName) {
		// Priority 2: shared field name across ≥2 distinct parent kinds.
		const distinctParents = new Set(group.map((o) => o.parentKind)).size;
		if (distinctParents >= 2) {
			return { name: `_${first.fieldName}`, priority: 2 };
		}
	}

	// Priority 3: fallback — first parent + field name.
	return { name: fallbackName(first), priority: 3 };
}

interface FieldEnumSweepState {
	readonly rules: Record<string, Rule>;
	readonly newRules: Map<string, Rule>;
	readonly memberKeyToCanonicalName: Map<string, string>;
	readonly conflictingSites: ReadonlySet<string>;
}

function rewriteFieldEnums(rule: Rule, parentKind: string, sweep: FieldEnumSweepState): Rule {
	const { rules, newRules, memberKeyToCanonicalName, conflictingSites } = sweep;
	const recurse = (r: Rule): Rule => rewriteFieldEnums(r, parentKind, sweep);

	switch (rule.type as string) {
		case 'FIELD': {
			const fieldRule = rule as unknown as { name: string; content: Rule; metadata?: unknown };
			const synthesized = conflictingSites.has(fieldEnumSiteKey(parentKind, fieldRule.name))
				? null
				: tryExtractFieldEnum(fieldRule.content, rules, memberKeyToCanonicalName);
			if (synthesized !== null) {
				const { enumKindName, synthesizedRule, replacementContent } = synthesized;
				if (!newRules.has(enumKindName)) {
					newRules.set(enumKindName, synthesizedRule);
				}
				// Replace the field's inline content with the replacement content rule.
				// For bare enum: symbol(enumKindName).
				// For repeat/repeat1(enum): repeat/repeat1(symbol(enumKindName)).
				return {
					type: 'FIELD',
					name: fieldRule.name,
					content: replacementContent,
					metadata: fieldRule.metadata
				} as unknown as Rule;
			}
			// Content isn't an enum candidate — recurse to find nested fields.
			const newContent = recurse(fieldRule.content);
			if (newContent === fieldRule.content) return rule;
			return { ...rule, content: newContent } as unknown as Rule;
		}
		case 'SEQ':
		case 'CHOICE': {
			const members = (rule as unknown as { members: Rule[] }).members;
			const newMembers = members.map(recurse);
			if (newMembers.every((m, i) => m === members[i])) return rule;
			return { ...rule, members: newMembers } as unknown as Rule;
		}
		case 'OPTIONAL':
		case 'REPEAT':
		case 'REPEAT1':
		case 'VARIANT':
		case 'GROUP':
		case 'TOKEN': {
			const content = (rule as unknown as { content: Rule }).content;
			const newContent = recurse(content);
			if (newContent === content) return rule;
			return { ...rule, content: newContent } as unknown as Rule;
		}
		default:
			return rule;
	}
}

function tryExtractFieldEnum(
	content: Rule,
	rules: Record<string, Rule>,
	memberKeyToCanonicalName: Map<string, string>
): { enumKindName: string; synthesizedRule: Rule; replacementContent: Rule } | null {
	// Peel one level of repeat/repeat1 wrapper so `field(name, repeat(enum))`
	// is handled alongside `field(name, enum)`. The wrapper type is remembered
	// so the rewrite can restore it around the synthesized symbol reference.
	const contentType = content.type as string;
	const repeatWrapperType = contentType === 'REPEAT' || contentType === 'REPEAT1' ? contentType : null;
	const innerContent = repeatWrapperType !== null ? (content as unknown as { content: Rule }).content : content;

	const members = resolveToEnumMembers(innerContent, rules);
	if (members === null || members.length === 0) return null;

	const memberKey = buildEnumMemberKey(members);
	const enumKindName = memberKeyToCanonicalName.get(memberKey);
	if (enumKindName === undefined) return null;

	// Low precedence so this newly-real rule defers to whatever else the
	// same literal can start, without a `conflicts:` entry per occurrence.
	// `author: 'enrich'` — this CHOICE body is minted by this pass, not
	// authored directly in the grammar (`'grammar'` would misattribute it).
	const synthesizedRule = {
		type: 'PREC',
		content: normalizeEnumMembers(members, { author: 'enrich' }),
		value: -1
	} as unknown as Rule;

	// Already the canonical reference — nothing to rewrite. Without this,
	// every occurrence gets rebuilt through the branch below even when it's
	// already correct, and since that branch hand-built its SYMBOL rather
	// than routing through the shared constructor (see below), the rebuild
	// alone used to leak a spurious `hidden` field into tree-sitter-side
	// grammar.json for zero semantic effect.
	if (innerContent.type === 'SYMBOL' && (innerContent as unknown as { name: string }).name === enumKindName) {
		return null;
	}

	// Route through the shared `makeSymbol` constructor so the ref carries
	// the SAME construction stamps (`hidden`, `inline = name.startsWith('_')`)
	// as every other ref under sittir's runtime — hand-building
	// `{ type: 'SYMBOL', ... }` here skipped `inline`, which normalize's fold
	// treats as authoritative.
	const symRule = makeSymbol(enumKindName);
	const replacementContent: Rule =
		repeatWrapperType === null ? symRule : ({ ...(content as object), content: symRule } as unknown as Rule);

	return { enumKindName, synthesizedRule, replacementContent };
}

function peelRepeatWrapper(rule: Rule): Rule {
	const ruleType = rule.type as string;
	if (ruleType === 'REPEAT' || ruleType === 'REPEAT1') return (rule as unknown as { content: Rule }).content;
	return rule;
}

function resolveToEnumMembers(rule: Rule, rules: Record<string, Rule>): StringRule[] | null {
	switch (rule.type as string) {
		case 'CHOICE': {
			// `isEnumChoiceRule` also accepts a literal-carrying SYMBOL arm, but
			// `.literal` is a link-phase stamp that doesn't exist yet at enrich
			// time, so at this phase the predicate reduces to the same
			// all-STRING check this function always needed — one canonical
			// "what counts as an enum-shaped choice" instead of a second copy.
			return isEnumChoiceRule(rule as AnyRule)
				? ((rule as unknown as { members: Rule[] }).members as unknown as StringRule[])
				: null;
		}
		// A bare single STRING is never a field-enum candidate — that's exactly
		// the class of hidden single-literal rules (e.g. `_kw_<name>`) already
		// minted by an earlier enrich pass. A genuine field-enum is inherently a
		// CHOICE of ≥2 alternatives; unlike evaluate.ts's post-pass, this
		// enrich-time pass runs against those very hidden rules, so it must not
		// match STRING here or one level through SYMBOL (below) — doing so once
		// hijacked `_kw_async`'s reference into a spurious re-synthesized name.
		case 'SYMBOL': {
			// Follow one level of symbol indirection.
			const name = (rule as unknown as { name: string }).name;
			const target = rules[name];
			if (target === undefined) return null;
			return resolveToEnumMembersOneLevelDeep(target);
		}
		default:
			return null;
	}
}

function resolveToEnumMembersOneLevelDeep(target: Rule): StringRule[] | null {
	// A synthesized field-enum's own body is `prec(-1, …)`-wrapped; peel it so
	// it still resolves as a reusable CHOICE/STRING enum. `isPrecWrapper`
	// (not a bare `type === 'PREC'` check) so a user-authored rule wrapped in
	// `prec.left`/`prec.right`/`prec.dynamic` around a choice-of-strings is
	// just as reusable as one wrapped in plain `prec`.
	const unwrapped = isPrecWrapper(target as { type: string })
		? (target as unknown as { content: Rule }).content
		: target;
	switch (unwrapped.type as string) {
		case 'CHOICE':
			return isEnumChoiceRule(unwrapped as AnyRule)
				? ((unwrapped as unknown as { members: Rule[] }).members as unknown as StringRule[])
				: null;
		default:
			return null;
	}
}
