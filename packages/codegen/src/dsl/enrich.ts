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
import { RuleWalker } from './rule-walker.ts';
import { makeRuleMetadata } from './rule-metadata.ts';
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
import { detectRepeatSeparator, firstStringOfChoice, rulesEqual } from './list-patterns.ts';
import {
	diagnoseParseKindCollisions,
	type ParseKindCollisionDiagnostic,
	type ParseKindCollisionValue
} from '../types/parsekind-collisions.ts';
import { setGroupLiftRuleMap } from './transform/transform-path.ts';
import { ruleMatchesEmpty, isInlineSafe, isSupertypeLike } from './group-classify.ts';
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

export function enrich<B = GrammarResult>(baseInput: B): EnrichedGrammar<B> {
	const base = baseInput as unknown as GrammarResult;
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
	for (const name of Object.keys(rulesBag)) {
		const rule = rulesBag[name];
		enrichedRules[name] = rule
			? applyEnrichPasses(
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
					wordMatcher,
					unaliasSink
				)
			: rule!;
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
		const groupUnaliasResult = applyUnaliasDistinct(groupName, groupBody, rulesBag, kwRules, clauseGroupRules);
		clauseGroupRules[groupName] = groupUnaliasResult.rule;
		for (const diagnostic of groupUnaliasResult.diagnostics) {
			recordUnaliasDiagnostic(unaliasSink, diagnostic);
		}
	}
	// Inject `_kw_<name>` hidden rules — user rules NEVER shadow them
	// (they start with `_kw_`, a reserved prefix).
	// Inject clause-group rules — user rules NEVER shadow them either
	// (they start with `_<parentKind>_optional`, a synthesized prefix).
	const mergedRules = { ...enrichedRules, ...kwRules, ...clauseGroupRules };
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

function applyEnrichPasses(
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
	wordMatcher: RegExp | undefined,
	unaliasSink: UnaliasDiagnosticSink
): Rule {
	// Fixed-point loop. The current pass set has well-defined
	// non-overlapping outputs (symbol-to-field wraps SYMBOLs as FIELD;
	// optional-keyword wraps optional(STRING) as FIELD(SYMBOL(_kw_<x>))),
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
		// Bare leading-keyword pass intentionally omitted — the docstring
		// above explains why: wrapping bare leading literals as FIELD(SYM)
		// adds `_kw_<name>` hidden rules that shift tree-sitter's parser-
		// generator tables, breaking unrelated rules' reparse (rust corpus
		// regresses by ~47/136 with this pass on).
		r = applyOptionalKeyword(ruleName, r, kwRules, wordMatcher);
		if (r === before) {
			converged = true;
			break;
		}
	}
	if (!converged && !process.env.SITTIR_QUIET) {
		process.stderr.write(`enrich: fixed-point did not converge for '${ruleName}' after ${MAX_ITERATIONS} iterations\n`);
	}
	// Clause-hoist runs AFTER the field-wrapping loop has converged — it must
	// see the enrich-inferred (`source:'enriched'`) FIELDs, because its trigger
	// is `optional(seq(…))` with `some(isString) && some(isField)`. Running it
	// first (the original placement) missed every clause whose field is added
	// by applySymbolToField (e.g. rust `abstract_type`'s
	// `for <type_parameters>`), leaving those for detectClause. One pass: once a
	// seq is hoisted its replacement is `optional(SYMBOL)`, which won't re-trigger.
	// Per-parent counter is local; dedupeMap + clauseGroupRules are shared across rules.
	const clauseHoistCounter: ClauseHoistCounter = { opt: 0, grp: 0, supertypeNames };
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
	const unaliasResult = applyUnaliasDistinct(ruleName, r, rulesBag, kwRules, clauseGroupRules);
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

function makeSymbol(name: string): Rule {
	// Both runtimes inject the symbol constructor under the SAME name `sym`
	// (sittir's `saveAndInjectDslGlobals` shadows tree-sitter's baseline `sym`).
	const symFn = nativeRuleFn<(n: string) => Rule>('sym');
	return symFn(name);
}

function registerKwRule(stringLiteral: Rule, keyword: string, kwRules: Record<string, Rule>): Rule {
	const hiddenName = `_kw_${keyword}`;
	if (!(hiddenName in kwRules)) {
		kwRules[hiddenName] = stringLiteral;
	}
	return makeSymbol(hiddenName);
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
	wordMatcher: RegExp | undefined
): Rule {
	// Peel prec wrappers so claimed-name set covers the inner seq.
	const inner = peelPrec(rule);
	const claimed = isSeqType(inner.type) ? collectFieldNamesRuntime(inner) : new Set<string>();
	return walkOptionalKeyword(ruleName, rule, claimed, kwRules, wordMatcher) ?? rule;
}

function peelPrec(rule: Rule): Rule {
	let cursor: Rule = rule;
	while (isPrecWrapper(cursor as { type: string })) {
		cursor = (cursor as unknown as { content: Rule }).content;
	}
	return cursor;
}

function walkOptionalKeyword(
	ruleName: string,
	rule: Rule,
	claimedAtSeqLevel: Set<string>,
	kwRules: Record<string, Rule>,
	wordMatcher: RegExp | undefined
): Rule | null {
	if (isSeqType(rule.type)) {
		const members = (rule as unknown as { members: Rule[] }).members;
		let changed = false;
		const newMembers = members.map((m) => {
			const out = walkOptionalKeyword(ruleName, m, claimedAtSeqLevel, kwRules, wordMatcher);
			if (out === null) return m;
			changed = true;
			return out;
		});
		return changed ? ({ ...rule, members: newMembers } as Rule) : null;
	}
	if (isChoiceType(rule.type)) {
		const members = (rule as unknown as { members: Rule[] }).members;
		let changed = false;
		const newMembers = members.map((m) => {
			const out = walkOptionalKeyword(ruleName, m, claimedAtSeqLevel, kwRules, wordMatcher);
			if (out === null) return m;
			changed = true;
			return out;
		});
		return changed ? ({ ...rule, members: newMembers } as Rule) : null;
	}
	const peeled = peelOptional(rule);
	if (peeled.isOptional) {
		const replacement = tryPromoteInnerKeyword(ruleName, rule, peeled.inner, claimedAtSeqLevel, kwRules, wordMatcher);
		if (replacement !== null) return replacement;
		const innerRewritten = walkOptionalKeyword(ruleName, peeled.inner, claimedAtSeqLevel, kwRules, wordMatcher);
		if (innerRewritten !== null) {
			return rebuildOptional(rule, innerRewritten);
		}
		return null;
	}
	if (isRepeatType(rule.type) || isFieldType(rule.type)) {
		const content = (rule as unknown as { content: Rule }).content;
		const out = walkOptionalKeyword(ruleName, content, claimedAtSeqLevel, kwRules, wordMatcher);
		if (out === null) return null;
		return { ...rule, content: out } as Rule;
	}
	// Descend through prec wrappers to reach inner seqs.
	if (isPrecWrapper(rule as { type: string })) {
		const content = (rule as unknown as { content: Rule }).content;
		const out = walkOptionalKeyword(ruleName, content, claimedAtSeqLevel, kwRules, wordMatcher);
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
	const symbolRef = registerKwRule(inner, fieldName, kwRules);
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

function canonicalStringifyClause(value: unknown): string {
	if (value === null || typeof value !== 'object') {
		return JSON.stringify(value);
	}
	if (Array.isArray(value)) {
		return '[' + value.map((v) => canonicalStringifyClause(v)).join(',') + ']';
	}
	const obj = value as Record<string, unknown>;
	const keys = Object.keys(obj).sort();
	const parts: string[] = [];
	for (const k of keys) {
		// Runtime-only provenance stamps must not leak into this dedupe key.
		// The sittir runtime's `createProxy` (compiler/evaluate.ts) stamps
		// every `$.foo` reference with `_ref: { refType: 'symbol', from:
		// currentRule, to: name }` — baking the PARENT rule's name into the
		// body used for `visibleGroupSynthName`'s dedupe hash. Tree-sitter's
		// own dsl.js runtime doesn't stamp this, so the two runtimes computed
		// DIFFERENT hashes for the SAME structural body when a group is
		// shared across parents (e.g. rust's `slice_pattern` and
		// `tuple_struct_pattern` share one group body) — the sittir side
		// would then mint a phantom per-parent duplicate the wire never
		// populates, rendering as silently empty. `id`/`_ref` are the
		// decisive keys to strip; `metadata`/`hidden`/`inline` are
		// belt-and-braces (identical for identical structures, so stripping
		// them can't change any dedupe decision). This function also keys
		// `clauseDedupeMap`, so this fix realigns clause-hoist naming too —
		// expected, not a separate concern.
		if (k === 'id' || k === '_ref' || k === 'metadata' || k === 'hidden' || k === 'inline') continue;
		const v = obj[k];
		if (typeof v === 'function' || typeof v === 'undefined') continue;
		parts.push(JSON.stringify(k) + ':' + canonicalStringifyClause(v));
	}
	return '{' + parts.join(',') + '}';
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
	ambientPrec?: Rule
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
			ambientPrec
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
			// link's `mintContentAliasKinds` resolves THROUGH the symbol to register
			// `<name> = <hidden body>` as the IR kind.
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
				ambientPrec
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
				ambientPrec
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
				ambientPrec
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
			if (out !== m) changed = true;
			return out;
		});
		return changed ? ({ ...rule, members: newMembers } as Rule) : rule;
	}

	// Descend into choice branches that are NOT optional(seq) wrappers
	// (those were handled above via peelOptionalSeq).
	if (isChoiceType(rule.type)) {
		const members = (rule as unknown as { members?: Rule[] }).members;
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
			const promoted = mintStructuredChoiceArm(
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
			const final = promoted ?? out;
			if (final !== m) changed = true;
			return final;
		});
		return changed ? ({ ...rule, members: newMembers } as Rule) : rule;
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
			innerAmbientPrec
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
			ambientPrec
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
	const clusterOf: string[] = [];
	const representatives: RuntimeRule[] = [];
	for (const value of values) {
		const existingIdx = representatives.findIndex((rep) => rulesEqual(rep, value));
		if (existingIdx === -1) {
			representatives.push(value);
			clusterOf.push(String(representatives.length - 1));
		} else {
			clusterOf.push(String(existingIdx));
		}
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
	walker: RuleWalker
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
			aliasSite: { path, content: aliasRule.content, named: aliasRule.named }
		});
		return; // do not descend into the alias's own content
	}
	if (isSymbolType(t)) {
		const name = (node as unknown as { name?: string }).name;
		if (typeof name === 'string') {
			const resolvedBody = normalizeMember(rulesBag[name] ?? node);
			out.push({ targetName: name, slotKey, storageKind: name, resolvedBody });
		}
		return;
	}
	const nextSlotKey = isFieldType(t) ? ((node as unknown as { name?: string }).name ?? slotKey) : slotKey;
	for (const { segment, child } of walker.childEdgesOf(node as unknown as AnyRule)) {
		collectUnaliasCandidates(child as unknown as Rule, [...path, ...segment], nextSlotKey, rulesBag, out, walker);
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
	clauseGroupRules: Record<string, Rule>
): { rule: Rule; diagnostics: ParseKindCollisionDiagnostic[] } {
	const candidates: UnaliasCandidate[] = [];
	collectUnaliasCandidates(rule, [], undefined, rulesBag, candidates, new RuleWalker());
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
			// keep firing at its original error severity, unchanged.
			if (anyActed) diagnostics.push({ ...diagnostic, severity: 'info' });
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
	const key = canonicalStringifyClause(seqBody);
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
	ambientPrec?: Rule
): { visibleName: string; hiddenName: string } | null {
	const key = canonicalStringifyClause(content);
	const registeredBody = ambientPrec ? ({ ...ambientPrec, content } as Rule) : content;
	const existing = groupDedupeMap[key];
	if (existing !== undefined) {
		const hiddenName = `_${existing}`;
		if (!(hiddenName in clauseGroupRules)) clauseGroupRules[hiddenName] = registeredBody;
		return { visibleName: existing, hiddenName };
	}
	counter.grp += 1;
	const visibleName = `${parentKind.replace(/^_+/, '')}_group${counter.grp}`;
	const hiddenName = `_${visibleName}`;
	if (visibleName in rulesBag || hiddenName in rulesBag) {
		process.stderr.write(
			`enrich: visible-group skipped for '${parentKind}' — rule '${visibleName}'/'${hiddenName}' already exists in base.grammar.rules\n`
		);
		return null;
	}
	groupDedupeMap[key] = visibleName;
	// Pass 1 — uniform hidden creation: register the seq body as a HIDDEN rule
	// (`_<parent>_group<N>`) so tree-sitter sees a single named symbol to alias.
	clauseGroupRules[hiddenName] = registeredBody;
	return { visibleName, hiddenName };
}

function promoteExistingHiddenRuleName(
	existingHiddenName: string,
	parentKind: string,
	groupDedupeMap: Record<string, string>,
	counter: ClauseHoistCounter,
	rulesBag: Record<string, Rule>
): { visibleName: string } | null {
	const existing = groupDedupeMap[existingHiddenName];
	if (existing !== undefined) return { visibleName: existing };
	counter.grp += 1;
	const visibleName = `${parentKind.replace(/^_+/, '')}_group${counter.grp}`;
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
	ambientPrec?: Rule
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
		const minted = mintStructuredChoiceArm(
			content,
			parentKind,
			rulesBag,
			clauseGroupRules,
			counter,
			groupDedupeMap,
			visibleGroupHiddenNames,
			clauseGroupOwners,
			collidingLeadingNames
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
		const promoted = promoteExistingHiddenRuleName(name, parentKind, groupDedupeMap, counter, rulesBag);
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
		const names = visibleGroupSynthName(
			arm,
			parentKind,
			groupDedupeMap,
			counter,
			rulesBag,
			clauseGroupRules,
			ambientPrec
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
