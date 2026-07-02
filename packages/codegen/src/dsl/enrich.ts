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

import type { Rule } from '../types/rule.ts';
import { sym } from '../types/rule.ts';
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
	isPrecWrapper
} from '../types/runtime-shapes.ts';
import type { RuntimeRule } from '../types/runtime-shapes.ts';
import { detectRepeatSeparator } from './list-patterns.ts';
import { setGroupLiftRuleMap } from './transform/transform-path.ts';
import { ruleMatchesEmpty, isInlineSafe } from './group-classify.ts';
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

/**
 * Type-level mirror of what `enrich()` does to the rules at runtime: each rule
 * is replaced by its post-enrich shape (`EnrichRule`). Applied to a flat
 * grammar-shape schema (`{ rules: {…} }`); other inputs (e.g. the internal
 * `GrammarResult` wrapper) pass through unchanged.
 */
export type EnrichedGrammar<B> = B extends GrammarJson
	? { readonly [K in keyof B]: K extends 'rules' ? { readonly [R in keyof B['rules']]: EnrichRule<B['rules'][R]> } : B[K] }
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
	const enrichedRules: Record<string, Rule> = {};
	for (const name of Object.keys(rulesBag)) {
		const rule = rulesBag[name];
		enrichedRules[name] = rule
			? applyEnrichPasses(name, rule, kwRules, supertypeNames, rulesBag, clauseGroupRules, clauseDedupeMap, groupDedupeMap, visibleGroupHiddenNames, wordMatcher)
			: rule!;
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
	const clauseGroupNames = new Set(
		Object.keys(clauseGroupRules).filter((n) => !visibleGroupHiddenNames.has(n))
	);
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
	return result as unknown as EnrichedGrammar<B>;
}

/**
 * Well-known non-enumerable key attached by `enrich()` to the grammar result
 * when clause-hoist synthesized any hidden group rules. Wire.ts reads this to
 * register the hoisted names in `WireContext.syntheticInline` so they end up
 * in the grammar's `inline:` list (required to prevent tree-sitter LR
 * conflicts from the newly-injected hidden rules).
 */
export const ENRICH_CLAUSE_GROUPS_KEY = '__enrichedClauseGroups__' as const;

/**
 * Extract the set of enrich-hoisted clause-group names from an enriched grammar
 * result. Returns an empty set when the grammar was not enriched or no clause
 * groups were synthesized.
 */
export function getEnrichClauseGroups(grammar: unknown): ReadonlySet<string> {
	if (!grammar || typeof grammar !== 'object') return new Set();
	const names = (grammar as Record<string, unknown>)[ENRICH_CLAUSE_GROUPS_KEY];
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
	wordMatcher: RegExp | undefined
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
		// Bare leading-keyword pass intentionally omitted — the docstring
		// above explains why: wrapping bare leading literals as FIELD(SYM)
		// adds `_kw_<name>` hidden rules that shift tree-sitter's parser-
		// generator tables, breaking unrelated rules' reparse (rust corpus
		// regresses by ~47/136 with this pass on).
		r = applyOptionalKeyword(ruleName, r, kwRules, wordMatcher);
		if (r === before) { converged = true; break; }
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
	const clauseHoistCounter = { opt: 0, grp: 0 };
	r = applyClauseHoist(ruleName, r, rulesBag, clauseGroupRules, clauseDedupeMap, clauseHoistCounter, groupDedupeMap, visibleGroupHiddenNames);
	return r;
}

/**
 * @internal — pull the declared-supertype name set out of the base
 * grammar. Handles both the `{ grammar: { supertypes: $ => [...] } }`
 * wrapped form and the bare `{ supertypes: $ => [...] }` form. Returns
 * names WITH their leading underscore so callers can test
 * `supertypeNames.has('_expression')` and still strip the prefix when
 * composing the field name.
 */
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

/**
 * @internal — extract supertype names from a result array. Accepts both
 * `[{name:'_expr'}, ...]` (SYMBOL-shaped) and `['_expr', ...]` (plain
 * strings). Returns names WITH the leading underscore so callers can
 * test membership and still strip the prefix when composing the field
 * name.
 */
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

/** Fetch a runtime-injected DSL rule constructor from `globalThis`, or throw.
 *  enrich runs inside `grammar(enrich(base), …)`, which executes under an
 *  injected DSL runtime — sittir's lowercase constructors during evaluate.ts,
 *  tree-sitter's uppercase ones during CLI generation. Calling the injected fn
 *  directly produces a rule in the active runtime's case with no hand-rolled
 *  detection, and inherits the runtime's construction semantics (content
 *  normalization, `_ref.fieldName` stamping). A missing global means enrich
 *  was called outside any runtime — a unit test that forgot `installFakeDsl()`.
 *
 *  Accepts alternate names because the two runtimes don't agree on every
 *  constructor's name: the symbol constructor is `symbol` under sittir but
 *  `sym` under tree-sitter's CLI. The first name found wins. */
function nativeRuleFn<F>(...names: string[]): F {
	const g = globalThis as Record<string, unknown>;
	for (const name of names) {
		if (typeof g[name] === 'function') return g[name] as F;
	}
	throw new Error(
		`enrich: no global ${names.join('()/')}() — enrich must run inside a DSL runtime ` +
			`(sittir evaluate.ts or tree-sitter CLI; tests inject via _test-helpers.ts)`
	);
}

/** Wrap `content` in a FIELD via the injected `field()` constructor. The
 *  runtime fn normalizes the content and stamps `fieldName` on inner symbol
 *  refs (subsuming the former hand-rolled `propagateFieldName`); we add
 *  enrich's `source` marker so downstream passes recognize the promotion as
 *  enrich-originated rather than author-written. */
function makeField(name: string, content: unknown): Rule {
	const field = nativeRuleFn<(n: string, c: unknown) => Rule>('field');
	const node = field(name, content);
	(node as { source?: string }).source = 'enriched';
	return node;
}

function makeSymbol(name: string): Rule {
	// Both runtimes inject the symbol constructor under the SAME name `sym`
	// (sittir's `saveAndInjectDslGlobals` shadows tree-sitter's baseline `sym`).
	const symFn = nativeRuleFn<(n: string) => Rule>('sym');
	return symFn(name);
}

/**
 * Register a `_kw_<fieldName>` hidden rule whose body is
 * `prec.left(1, stringLiteral)`. Idempotent — multiple positions that
 * promote the same keyword register the same body once.
 *
 * Returns a SYMBOL reference (in the active runtime's case, via the injected
 * `symbol()` constructor) that the caller embeds inside the new FIELD wrapper.
 */
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

/** Collect field names that already exist on the top-level seq. */
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

/**
 * Detect `optional(content)` across both runtimes:
 * - sittir:      `{ type: 'optional', content }`
 * - tree-sitter: `{ type: 'CHOICE', members: [content, {BLANK}] }`
 */
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
			const blankIdx = members.findIndex((m) => m.type === 'BLANK' || m.type === 'blank');
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
	/** Raw symbol name (preserves any leading underscore for supertype detection). */
	readonly name: string;
	/** The SYMBOL rule itself, used as the FIELD's content. */
	readonly symbolRule: Rule;
	/** Rebuild the original seq-member rule around a freshly-built FIELD node. */
	wrap(fieldNode: Rule): Rule;
}

/**
 * @internal — true when `target` corresponds to Shape 1 (bare SYMBOL
 * at the seq position). Distinguishable by `target.symbolRule` being
 * `===` to the original `member`: bare-shape's wrap is identity, so the
 * detected symbol IS the seq-position rule itself. Used by the
 * supertype-prefixed guard in `applySymbolToField` —
 * see that function for the rationale.
 */
function isBareShapeTarget(member: Rule, target: SymbolTarget): boolean {
	return target.symbolRule === member;
}

/** @internal — detect which of the three shapes (bare / optional /
 *  optional-seq) the seq member is, and return a SymbolTarget that
 *  knows how to rebuild it once the inner SYMBOL is FIELD-wrapped.
 *  Returns null for any other shape (including multi-symbol seqs,
 *  optional(seq) with non-anon members, or non-symbol leaves). */
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
		} else if (!isStringType(sn.type) && sn.type !== 'PATTERN' && sn.type !== 'pattern') {
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

/**
 * @internal Count symbols inside repeat/repeat1 wrappers. Used to
 * disqualify bare symbols whose kind also appears under a repeat.
 * Stops at field/alias boundaries.
 */
function countSymbolsInRepeat(
	node: Rule | undefined | null,
	kindCounts: Map<string, number>,
	inRepeat: boolean = false
): void {
	if (!node) return;
	const t = (node as { type?: string }).type;
	if (!t) return;
	if (isFieldType(t)) return;
	if (t === 'ALIAS' || t === 'alias') return;
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

/**
 * @internal — iterate outer-seq members and descend into any that are
 * `repeat(seq(...))` / `repeat1(seq(...))` (possibly prec-wrapped).
 * Applies the same field-promotion logic to bare symbols in the inner
 * seq. Returns the original array unchanged when no promotions fire.
 *
 * @param ruleName       - the parent rule name (for diagnostics)
 * @param members        - the outer seq's (possibly already-enriched) members
 * @param supertypeNames - declared supertype names for `_prefix` handling
 * @param existing       - mutable set of field names already claimed on
 *                         the parent seq (checked to prevent collisions)
 * @returns the same `members` array if nothing changed, or a new array
 *   with rebuilt repeat members
 */
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

/**
 * @internal — given a single outer-seq member, check whether it is a
 * `repeat`/`repeat1` (possibly prec-wrapped) whose content is a `seq`.
 * If so, apply field-promotion to the inner seq's bare symbols.
 *
 * @returns the rebuilt member if any promotions fired, or `null` if
 *   the member was left unchanged.
 */
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

/**
 * @internal — handle `repeat(seq(...))` / `repeat1(seq(...))` patterns
 * (possibly prec-wrapped) when the top-level rule is NOT itself a seq.
 *
 * Descends into the repeat's content, peeling any prec wrappers on
 * the inner rule. If the inner content is a seq, applies the same
 * per-member field-promotion logic as the top-level seq path:
 * `detectSymbolTarget` + uniqueness via `kindCounts` + claimed-name
 * via `collectFieldNamesRuntime` + `countSymbolsInRepeat` for further
 * nested repeats.
 *
 * @returns The rebuilt rule if any promotions fired; the original rule
 *   unchanged otherwise.
 */
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
// `applyWrapperDeletion` (optimize) from the OPTIONAL/REPEAT/REPEAT1/FIELD
// wrapper structure, the single source of truth. Stamping them in enrich was
// premature (nothing reads them before wrapper-deletion) and polluted the
// `nonterminal` slot signal — enrich marked bare `optional(',')` delimiters
// `nonterminal:true`, which wrapper-deletion deliberately does not (a bare
// optional terminal is render-only, not a slot).

// ---------------------------------------------------------------------------
// Pass 2: optional keyword-prefix
// ---------------------------------------------------------------------------

function applyOptionalKeyword(ruleName: string, rule: Rule, kwRules: Record<string, Rule>, wordMatcher: RegExp | undefined): Rule {
	// Peel prec wrappers so claimed-name set covers the inner seq.
	const inner = peelPrec(rule);
	const claimed = isSeqType(inner.type) ? collectFieldNamesRuntime(inner) : new Set<string>();
	return walkOptionalKeyword(ruleName, rule, claimed, kwRules, wordMatcher) ?? rule;
}

/** @internal — strip any number of prec/prec.left/prec.right/prec.dynamic
 *  wrappers and return the innermost rule. Returns the input unchanged
 *  when no prec wrapper is present. */
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
		return t === 'BLANK' || t === 'blank' ? m : newInner;
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
}

/**
 * @internal — canonical JSON stringify with sorted object keys. Ensures
 * that two structurally-equal rule bodies stringify identically even
 * when property insertion order differs between rule construction paths.
 * Mirrors the helper in auto-groups.ts (kept in sync, not shared yet —
 * DRY extraction is scheduled for Task 2.1).
 */
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
		const v = obj[k];
		if (typeof v === 'function' || typeof v === 'undefined') continue;
		parts.push(JSON.stringify(k) + ':' + canonicalStringifyClause(v));
	}
	return '{' + parts.join(',') + '}';
}

/**
 * @internal — peel an optional wrapper from a rule node. Returns the inner
 * seq content if the rule is `optional(seq)` (sittir form) or
 * `CHOICE[seq, BLANK]` (tree-sitter normalized form). Returns null if the
 * rule is not an optional-wrapping-a-seq pattern.
 *
 * Also returns the seq member and the index of the seq in the members array
 * (for CHOICE form) so callers can rebuild the CHOICE with a different member.
 */
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

/**
 * @internal — extract the list separator string from an `optional(seq(...))`
 * (or `CHOICE[seq,BLANK]`) whose seq body carries a separated-list repeat.
 * Returns the separator literal (e.g. `","`) or null when the member is not an
 * optional-seq containing a repeat.
 *
 * Handles both the raw tree-sitter form `repeat(seq(STRING sep, x))` (separator
 * not yet lifted — enrich runs pre-evaluate) and an already-lifted
 * `repeat(x, separator)`.
 */
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
			if (detected) return detected.separator;
		}
	}
	return null;
}

/**
 * @internal — if `rule` is `optional(STRING)` / `CHOICE[STRING,BLANK]`, return
 * the string literal; else null. Recognizes a stranded trailing separator
 * member. Returns null for `optional(seq(...))` (inner is not a bare string),
 * so it never matches the list member itself.
 */
function optionalStringLiteral(rule: Rule): string | null {
	const peeled = peelOptional(rule);
	if (!peeled.isOptional) return null;
	const innerN = normalizeMember(peeled.inner);
	if (isStringType(innerN.type) && typeof innerN.value === 'string') return innerN.value;
	return null;
}

/**
 * @internal — fold a stranded trailing `optional(sep)` into the preceding
 * `optional(seq(...))`'s body. Appends `trailingOptional` as the last seq
 * member and rebuilds the optional wrapper (both `optional` and
 * `CHOICE[seq,BLANK]` forms, via rebuildOptional).
 */
function appendTrailingMemberToOptionalSeq(optSeqRule: Rule, trailingOptional: Rule): Rule {
	const peeled = peelOptionalSeq(optSeqRule)!;
	const seqBody = peeled.seqBody;
	const seqMembers = (seqBody as unknown as { members: Rule[] }).members;
	const newSeqBody = { ...seqBody, members: [...seqMembers, trailingOptional] } as Rule;
	return rebuildOptional(optSeqRule, newSeqBody);
}

/**
 * @internal — pre-fold a seq's member list, pulling each separated-list's
 * stranded trailing `optional(sep)` INTO the preceding `optional(seq(...
 * repeat(sep) ...))`. Returns the rewritten member array, or null when nothing
 * folds (reference-preserving when no fold applies).
 *
 * Trigger: adjacent `[ optional(seq containing repeat(sep S)) , optional(S) ]`
 * where the trailing literal `S` equals the list's own separator. The
 * separator-match guard prevents swallowing an unrelated trailing optional
 * (e.g. `optional(';')` after a comma-separated list).
 *
 * Why here: tree-sitter authors write the canonical separated-list-with-trailing
 * either as `optional(seq(list, optional(sep)))` (already one unit — handled) or
 * as `seq(optional(list), optional(sep))` (python `argument_list`). This pass
 * canonicalizes the second form into the first BEFORE the group-lift below, so
 * the whole list (head + repeat + trailing) is captured as one group. Without
 * it the trailing separator strands as a standalone member → wrapper-deletion
 * makes it a phantom `nonterminal:true` slot, and for visible (inline-unsafe)
 * groups it is permanently split from its list across the AssembledGroup
 * boundary. evaluate's `liftCommaSep` then absorbs the folded `optional(sep)`
 * into the group's `repeat1` as `trailing: true`.
 */
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

/**
 * @internal — walk `rule` and hoist any `optional(seq(STRING,FIELD…))` /
 * `CHOICE[seq(STRING,FIELD…),BLANK]` positions into hidden group rules.
 * Returns a (possibly rewritten) rule; never mutates the input.
 *
 * COUNTER DISCIPLINE: the `counter.opt` increments for EVERY `optional(seq)`
 * shape encountered in traversal order — both clause-seqs (which this pass
 * hoists) and non-clause-seqs (which applyAutoGroups hoists later). This
 * keeps the numbering in sync so the two passes never assign the same number
 * to different bodies within the same parent. applyAutoGroups resets its
 * own counter per-parent to 0 and counts from 1; after enrich, any position
 * where enrich hoisted is now `optional(SYMBOL)` — applyAutoGroups skips
 * those (not a seq) so its counter only increments for the non-clause
 * positions, which are the ones enrich skipped and left with their counter
 * slots intact.
 */
function applyClauseHoist(
	parentKind: string,
	rule: Rule,
	rulesBag: Record<string, Rule>,
	clauseGroupRules: Record<string, Rule>,
	dedupeMap: Record<string, string>,
	counter: ClauseHoistCounter,
	groupDedupeMap: Record<string, string>,
	visibleGroupHiddenNames: Set<string>
): Rule {
	// Check if this node is an optional(seq) or CHOICE[seq,BLANK] pattern.
	const peeled = peelOptionalSeq(rule);
	if (peeled !== null) {
		// Post-order: recurse into the seq body FIRST, then classify.
		const recursedSeqBody = applyClauseHoist(parentKind, peeled.seqBody, rulesBag, clauseGroupRules, dedupeMap, counter, groupDedupeMap, visibleGroupHiddenNames);

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
		} else if (isInlineSafe(recursedSeqBody)) {
			// Inline-safe: exactly one field/symbol slot after dropping literals.
			// Hoist into a hidden _<parent>_optionalN rule (today's clause path).
			// clauseHoistSynthName increments the counter internally.
			const name = clauseHoistSynthName(recursedSeqBody, parentKind, dedupeMap, counter, rulesBag, clauseGroupRules);
			if (name !== null) {
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
			const names = visibleGroupSynthName(recursedSeqBody, parentKind, groupDedupeMap, counter, rulesBag, clauseGroupRules);
			if (names !== null) {
				// Pass 2 tag: this hidden rule backs a VISIBLE alias → keep it OUT of
				// the `inline:` list (so tree-sitter aliases the symbol-node, not the
				// expanded seq). Classify ONCE here; read in enrich() at clauseGroupNames.
				visibleGroupHiddenNames.add(names.hiddenName);
				// Pass 1: symbol ref to the hidden rule (mirrors makeGroupLiftSymbol).
				const symbolRef = makeGroupLiftSymbol(rule, names.hiddenName);
				// Pass 2: wrap in a visible alias so the inline-unsafe group surfaces
				// as a clean CST node (`<name>`). The alias carries metadata.source so
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
			const out = applyClauseHoist(parentKind, m, rulesBag, clauseGroupRules, dedupeMap, counter, groupDedupeMap, visibleGroupHiddenNames);
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
		let changed = false;
		const newMembers = members.map((m) => {
			const out = applyClauseHoist(parentKind, m, rulesBag, clauseGroupRules, dedupeMap, counter, groupDedupeMap, visibleGroupHiddenNames);
			if (out !== m) changed = true;
			return out;
		});
		return changed ? ({ ...rule, members: newMembers } as Rule) : rule;
	}

	// Descend into repeat / repeat1 / prec wrappers.
	if (isRepeatType(rule.type) || isPrecWrapper(rule as { type: string })) {
		const content = (rule as unknown as { content?: Rule }).content;
		if (!content) return rule;
		const newContent = applyClauseHoist(parentKind, content, rulesBag, clauseGroupRules, dedupeMap, counter, groupDedupeMap, visibleGroupHiddenNames);
		if (newContent === content) return rule;
		return { ...rule, content: newContent } as Rule;
	}

	// Descend into field content (a field-wrapped optional(seq) is also a target).
	if (isFieldType(rule.type)) {
		const content = (rule as unknown as { content?: Rule }).content;
		if (!content) return rule;
		const newContent = applyClauseHoist(parentKind, content, rulesBag, clauseGroupRules, dedupeMap, counter, groupDedupeMap, visibleGroupHiddenNames);
		if (newContent === content) return rule;
		return { ...rule, content: newContent } as Rule;
	}

	return rule;
}

/**
 * @internal — get or create the synthesized hidden-rule name for a given
 * clause-seq body. Increments the per-parent counter and injects the seq
 * into `clauseGroupRules` on first encounter; dedupes across parents via
 * `dedupeMap`.
 *
 * Returns `null` when the synthesized name would collide with an existing
 * rule in `rulesBag` (already-authored rule with the same name). A stderr
 * notice is emitted in that case. The counter is incremented BEFORE the
 * collision check so the ordinal-position invariant with applyAutoGroups
 * is maintained even when a collision prevents hoisting.
 */
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

/**
 * @internal — mint the hidden-rule + visible-alias name pair for an inline-UNSAFE
 * seq body that enrich surfaces as a VISIBLE CST kind.
 *
 * Unlike the prior content-alias approach (which aliased the multi-member seq
 * DIRECTLY — `alias(SEQ(...), $.name)`, which tree-sitter DISTRIBUTES across the
 * seq's members, scattering empty leaves), this registers a HIDDEN rule whose
 * body is the seq, exactly like the inline-safe clause-hoist path
 * (`clauseHoistSynthName`). The caller then references that hidden rule via a
 * symbol and wraps the symbol in `alias($._<name>, $.<name>)` so tree-sitter has
 * a single symbol-node to rename into ONE clean CST node.
 *
 * Naming:
 *   - hidden rule  = `_<parent>_group<N>` (registered in `clauseGroupRules`)
 *   - visible alias = `<parent>_group<N>` (the same name without the `_`)
 * Per-parent 1-indexed `grp` counter; cross-parent dedupe via
 * `canonicalStringifyClause`. Returns `null` on a name collision with an existing
 * rule in `rulesBag` (caller leaves the body inline).
 *
 * The visible name must NOT carry a leading `_` (tree-sitter would classify it
 * HIDDEN → the minted kind's slot is dropped at wrap/read), so `parentKind`'s
 * own leading `_` is stripped before composing the base name.
 */
function visibleGroupSynthName(
	content: Rule,
	parentKind: string,
	groupDedupeMap: Record<string, string>,
	counter: ClauseHoistCounter,
	rulesBag: Record<string, Rule>,
	clauseGroupRules: Record<string, Rule>
): { visibleName: string; hiddenName: string } | null {
	const key = canonicalStringifyClause(content);
	const existing = groupDedupeMap[key];
	if (existing !== undefined) {
		const hiddenName = `_${existing}`;
		if (!(hiddenName in clauseGroupRules)) clauseGroupRules[hiddenName] = content;
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
	clauseGroupRules[hiddenName] = content;
	return { visibleName, hiddenName };
}

/**
 * @internal — build a SYMBOL reference for a synthesized enrich group-lift
 * (clause hoist today; all `optional(seq)`/`repeat(seq)` once the hoist
 * generalizes), case-matched to the optional/choice wrapper's type convention.
 *
 * Provenance markers:
 *   - `metadata.source: 'enrich'` — the NEW canonical marker. Path-descent
 *     (transform-path.ts) reads this to recognize an enrich-synthesized
 *     group-lift symbol and travel THROUGH it into the hoisted body, so
 *     authored `transform()`/`groups:` path patches that address into a
 *     now-hoisted seq still resolve. Lives under `metadata` because the
 *     top-level `source` tag is being retired (provenance consolidates here).
 *   - `source: 'group-lift'` — LEGACY marker (sunset target; rule.ts:349).
 *     Still read by the IR-path consumers (simplify / templates / suggested).
 *     Kept dual transitionally; deleted once those readers migrate to
 *     `metadata.source`.
 */
function makeGroupLiftSymbol(referenceRule: Rule, name: string): Rule {
	const t = (referenceRule as { type?: string }).type ?? '';
	// Upper-case wrapper (CHOICE, OPTIONAL) → SYMBOL; lower-case → symbol.
	const isUpper = t.length > 0 && t === t.toUpperCase();
	// Pure ref — NO inline body. Tree-sitter serializes any extra structural
	// field on a SYMBOL into grammar.json (a `content` here leaks the seq into
	// the parser), so the symbol stays a clean name-ref. `metadata.source` is
	// the only added marker: path-descent reads it and LOOKS UP the referenced
	// `_<parent>_<kind><N>` rule body by name to travel through (not by carrying
	// the body here). `metadata` is inert to tree-sitter's parse tables.
	// Route the lower-case (IR/render-side) ref through evaluate's `symbol()`
	// so it carries the SAME construction stamps (`hidden`, `inline =
	// name.startsWith('_')`) as every other ref — these `_<parent>_<kind>N`
	// helpers are `_`-prefixed → inline=true. Keeping one constructor (revised at
	// push-down / link) makes `inline` authoritative on the renderRules path, so
	// normalize's fold can read it. The upper-case branch is the tree-sitter raw
	// SYMBOL form (parser-side, never reaches the IR inline gate).
	const base = isUpper ? { type: 'SYMBOL' as const, name } : sym(name);
	return {
		...base,
		source: 'group-lift',
		metadata: { source: 'enrich' }
	} as unknown as Rule;
}

/**
 * @internal — wrap a SYMBOL ref to an inline-UNSAFE group's HIDDEN rule in a
 * TAGGED visible alias so the group surfaces as a single clean CST kind.
 *
 * Shape (confirmed against generated grammar.json ALIAS nodes):
 *   `{ type: 'ALIAS'|'alias', content: symbol($._<name>), named: true,
 *      value: '<name>', metadata: { source: 'enrich' } }`
 *
 * - The aliased thing is a SYMBOL ref to the hidden `_<name>` rule (NOT the raw
 *   multi-member seq). tree-sitter renames that ONE symbol-node into ONE visible
 *   CST node for `<name>` (a real kindId in parser.c). Aliasing the raw seq
 *   instead made tree-sitter DISTRIBUTE the alias name across the seq members.
 * - `metadata.source === 'enrich'` is REQUIRED: transform-path travels THROUGH
 *   it for authored path-patches, and link's `mintContentAliasKinds` keys on it
 *   to resolve THROUGH the symbol and register `<name> = <hidden body>` as the
 *   IR rule.
 * - Case is the active runtime's: built via the injected `alias()`/`symbol()`
 *   constructors, so sittir evaluate yields lowercase, tree-sitter CLI uppercase.
 */
function makeVisibleGroupAlias(symbolRef: Rule, name: string): Rule {
	const aliasFn = nativeRuleFn<(r: unknown, v: unknown) => Rule>('alias');
	const symbol = nativeRuleFn<(n: string) => Rule>('symbol', 'sym');
	// Pass a SYMBOL value so the runtime constructor sets named:true, value=name
	// (a bare-string value would yield named:false). `metadata.source: 'enrich'`
	// is REQUIRED — transform-path travels through it and link's
	// `mintContentAliasKinds` keys on it — and the runtime alias() doesn't add
	// it, so stamp it on the cased result.
	const node = aliasFn(symbolRef, symbol(name));
	(node as { metadata?: { source?: string } }).metadata = { source: 'enrich' };
	return node;
}
