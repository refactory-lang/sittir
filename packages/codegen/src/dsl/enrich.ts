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

import { createHash } from 'node:crypto';
import type { Rule } from '../compiler/rule.ts';
import {
	isSeqType,
	isStringType,
	isSymbolType,
	isFieldType,
	isOptionalType,
	isChoiceType,
	isRepeatType,
	isPrecWrapper
} from './runtime-shapes.ts';

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

export function enrich(base: GrammarResult): GrammarResult {
	if (!base || typeof base !== 'object') {
		throw new Error('enrich(): expected a grammar object, got ' + typeof base);
	}
	const hasWrapper = 'grammar' in base;
	const rulesBag = (hasWrapper ? base.grammar?.rules : (base as unknown as { rules?: unknown }).rules) as
		| Record<string, Rule>
		| undefined;
	if (!rulesBag) return base;
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
	const enrichedRules: Record<string, Rule> = {};
	for (const name of Object.keys(rulesBag)) {
		const rule = rulesBag[name];
		enrichedRules[name] = rule ? applyEnrichPasses(name, rule, kwRules, supertypeNames) : rule!;
	}
	// Inject `_kw_<name>` hidden rules — user rules NEVER shadow them
	// (they start with `_kw_`, a reserved prefix).
	const mergedRules = { ...enrichedRules, ...kwRules };
	if (hasWrapper) {
		return { ...base, grammar: { ...base.grammar, rules: mergedRules } };
	}
	return {
		...(base as unknown as object),
		rules: mergedRules
	} as unknown as GrammarResult;
}

function applyEnrichPasses(
	ruleName: string,
	rule: Rule,
	kwRules: Record<string, Rule>,
	supertypeNames: ReadonlySet<string>
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
	for (let i = 0; i < MAX_ITERATIONS; i++) {
		const before = r;
		r = applySymbolToField(ruleName, r, supertypeNames);
		// Bare leading-keyword pass intentionally omitted — the docstring
		// above explains why: wrapping bare leading literals as FIELD(SYM)
		// adds `_kw_<name>` hidden rules that shift tree-sitter's parser-
		// generator tables, breaking unrelated rules' reparse (rust corpus
		// regresses by ~47/136 with this pass on).
		r = applyOptionalKeyword(ruleName, r, kwRules);
		// Order: field wrappers BEFORE multiplicity wrappers so that an
		// `optional(field(name, X))` shape first stamps fieldName on the
		// inner FIELD's content, then the outer OPTIONAL stamps
		// multiplicity onto the inner FIELD. The fixed-point loop in
		// applyEnrichPasses re-runs both until convergence, so the reverse
		// authoring shape `field(name, optional(X))` also converges to
		// the same attribute set on the leaf (verified by the
		// ordering-invariance test in enrich-multiplicity-wrappers.test.ts).
		r = enrichFieldWrappers(r);
		r = enrichMultiplicityWrappers(r);
		r = decomposeOptional(r, kwRules);
		if (r === before) return r;
	}
	if (!process.env.SITTIR_QUIET) {
		process.stderr.write(`enrich: fixed-point did not converge for '${ruleName}' after ${MAX_ITERATIONS} iterations\n`);
	}
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

function detectCase(referenceRule: unknown): 'upper' | 'lower' {
	const t = (referenceRule as { type?: string })?.type ?? '';
	return t.length > 0 && t === t.toUpperCase() ? 'upper' : 'lower';
}

function makeField(referenceRule: unknown, name: string, content: unknown): Rule {
	// Propagate `fieldName` onto inner symbol `_ref` metadata, mirroring
	// the runtime `field()` helper in evaluate.ts. Without this, an
	// enrich-promoted FIELD wraps the same SYMBOL as an override-promoted
	// FIELD but the inner symbol's `_ref.fieldName` stays unset — and
	// downstream passes (link's symbol-reference graph, factory emit,
	// from-validator's named-children comparison) treat the two
	// structurally-identical FIELDs differently. Same propagation rules:
	// skip when fieldName already set, stop at inner field/alias
	// boundaries.
	propagateFieldName(content, name);
	return {
		type: detectCase(referenceRule) === 'upper' ? 'FIELD' : 'field',
		name,
		content,
		source: 'enriched'
	} as unknown as Rule;
}

/** @internal — walk symbol refs inside `content` and stamp `fieldName`
 *  on each ref whose fieldName is unset. Mirrors evaluate.ts's
 *  `walkRefs` traversal: descends through seq/choice/optional/repeat/
 *  repeat1/prec wrappers; stops at nested field/alias boundaries
 *  (those own their own field name). No-op when `_ref` is absent
 *  (e.g. enrich running before evaluate has annotated refs). */
function propagateFieldName(rule: unknown, fieldName: string): void {
	if (!rule || typeof rule !== 'object') return;
	const r = rule as {
		type?: string;
		_ref?: { fieldName?: string };
		content?: unknown;
		members?: unknown[];
	};
	if (r._ref && r._ref.fieldName === undefined) {
		r._ref.fieldName = fieldName;
	}
	const t = r.type;
	if (t === 'seq' || t === 'SEQ' || t === 'choice' || t === 'CHOICE') {
		if (Array.isArray(r.members)) for (const m of r.members) propagateFieldName(m, fieldName);
		return;
	}
	if (
		t === 'optional' ||
		t === 'OPTIONAL' ||
		t === 'repeat' ||
		t === 'REPEAT' ||
		t === 'repeat1' ||
		t === 'REPEAT1' ||
		t === 'prec' ||
		t === 'PREC' ||
		t === 'prec_left' ||
		t === 'PREC_LEFT' ||
		t === 'prec_right' ||
		t === 'PREC_RIGHT' ||
		t === 'prec_dynamic' ||
		t === 'PREC_DYNAMIC'
	) {
		if (r.content !== undefined) propagateFieldName(r.content, fieldName);
		return;
	}
	// field / alias / token / symbol / string / pattern / blank — stop.
}

function makeSymbol(referenceRule: unknown, name: string): Rule {
	return {
		type: detectCase(referenceRule) === 'upper' ? 'SYMBOL' : 'symbol',
		name
	} as unknown as Rule;
}

/**
 * Register a `_kw_<fieldName>` hidden rule whose body is
 * `prec.left(1, stringLiteral)`. Idempotent — multiple positions that
 * promote the same keyword register the same body once.
 *
 * Returns a SYMBOL reference (matching the host rule's case) that the
 * caller embeds inside the new FIELD wrapper.
 */
function registerKwRule(hostRule: Rule, stringLiteral: Rule, keyword: string, kwRules: Record<string, Rule>): Rule {
	const hiddenName = `_kw_${keyword}`;
	if (!(hiddenName in kwRules)) {
		kwRules[hiddenName] = stringLiteral;
	}
	return makeSymbol(hostRule, hiddenName);
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

function isIdentifierShaped(value: string): boolean {
	return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
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
		const fieldNode = makeField(cursor, fieldName, t.symbolRule);
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
		const fieldNode = makeField(inner, fieldName, t.symbolRule);
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
		const fieldNode = makeField(inner, fieldName, t.symbolRule);
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

// ---------------------------------------------------------------------------
// Pass: field-wrapper attribute propagation
// ---------------------------------------------------------------------------
// For every FIELD/field node, copy the wrapper's `name` onto the wrapped
// content as `fieldName`, and set `nonterminal: true` on the content.
// Matches today's rule-catalog.ts force-promotion semantics: a
// field-wrapped child is forced to nonterminal classification even when
// the underlying rule is a terminal (string/pattern).
//
// Recursion order: post-order. Recurse into children first so nested
// field wrappers see already-enriched subtrees, then apply the
// propagation at this level if this node is itself a FIELD. Returns
// the original rule unchanged when no propagation fires, preserving
// the `r === before` convergence check in applyEnrichPasses.

function enrichFieldWrappers(rule: Rule): Rule {
	const recursed = recurseChildren(rule, enrichFieldWrappers);
	if (!isFieldType(recursed.type)) return recursed;
	const name = (recursed as unknown as { name?: unknown }).name;
	const content = (recursed as unknown as { content?: unknown }).content;
	if (typeof name !== 'string' || !content || typeof content !== 'object') return recursed;
	const existing = content as { fieldName?: unknown; nonterminal?: unknown };
	if (existing.fieldName === name && existing.nonterminal === true) return recursed;
	const newContent = { ...(content as object), fieldName: name, nonterminal: true };
	return { ...recursed, content: newContent } as unknown as Rule;
}

/** @internal — descend into structural children of `rule` and apply
 *  `visit` to each. Mirrors the shape-walk used by both
 *  `enrichFieldWrappers` and `enrichMultiplicityWrappers`
 *  (seq/choice members; optional/repeat/repeat1/prec/field/alias
 *  content). Returns the original rule reference when no descendant
 *  changes — preserves the fixed-point identity check in
 *  `applyEnrichPasses`. */
function recurseChildren(rule: Rule, visit: (r: Rule) => Rule): Rule {
	if (!rule || typeof rule !== 'object') return rule;
	const t = (rule as { type?: string }).type;
	if (!t) return rule;
	if (isSeqType(t) || isChoiceType(t)) {
		const members = (rule as unknown as { members?: Rule[] }).members;
		if (!Array.isArray(members)) return rule;
		let changed = false;
		const newMembers = members.map((m) => {
			const out = visit(m);
			if (out !== m) changed = true;
			return out;
		});
		return changed ? ({ ...rule, members: newMembers } as Rule) : rule;
	}
	if (
		isOptionalType(t) ||
		isRepeatType(t) ||
		isFieldType(t) ||
		isPrecWrapper(rule as { type: string }) ||
		t === 'alias' ||
		t === 'ALIAS' ||
		t === 'token' ||
		t === 'TOKEN' ||
		t === 'immediate_token' ||
		t === 'IMMEDIATE_TOKEN' ||
		t === 'group' ||
		t === 'variant' ||
		t === 'clause'
	) {
		const content = (rule as unknown as { content?: Rule }).content;
		if (content === undefined) return rule;
		const out = visit(content);
		if (out === content) return rule;
		return { ...rule, content: out } as Rule;
	}
	if (t === 'polymorph') {
		const forms = (rule as unknown as { forms?: Array<{ content: Rule }> }).forms;
		if (!Array.isArray(forms)) return rule;
		let changed = false;
		const newForms = forms.map((f) => {
			const out = visit(f.content);
			if (out !== f.content) changed = true;
			return changed ? { ...f, content: out } : f;
		});
		return changed ? ({ ...rule, forms: newForms } as Rule) : rule;
	}
	return rule;
}

// ---------------------------------------------------------------------------
// Pass: multiplicity-wrapper attribute propagation
// ---------------------------------------------------------------------------
// For every OPTIONAL / REPEAT / REPEAT1 wrapper, stamp the corresponding
// multiplicity ('optional' / 'array' / 'nonEmptyArray') and `nonterminal:
// true` on the wrapper node itself AND propagate down through any
// transparent wrappers (field/alias/token/prec) in the content path so
// the inner leaf carries the multiplicity too. Mirrors how
// `propagateFieldName` (used by enrich-promoted field wrappers) stamps
// fieldName on inner refs.
//
// The dual stamping (wrapper-self + inner-leaf) ensures that both
// authoring shapes converge on the same effective attribute set
// regardless of nesting order:
//
//   optional(field(name, X))   → field gets multiplicity, X gets fieldName+multiplicity
//   field(name, optional(X))   → optional gets fieldName+multiplicity, X gets multiplicity
//
// Post-order recursion via the shared `recurseChildren` helper;
// identity-preserving on no-op; idempotent (short-circuits when the
// attributes already match the wrapper's intended values). The
// fixed-point loop in `applyEnrichPasses` re-runs this and
// `enrichFieldWrappers` until convergence.

const MULTIPLICITY_BY_TYPE: Record<string, 'optional' | 'array' | 'nonEmptyArray'> = {
	optional: 'optional',
	OPTIONAL: 'optional',
	repeat: 'array',
	REPEAT: 'array',
	repeat1: 'nonEmptyArray',
	REPEAT1: 'nonEmptyArray'
};

function enrichMultiplicityWrappers(rule: Rule): Rule {
	const recursed = recurseChildren(rule, enrichMultiplicityWrappers);
	const t = (recursed as { type?: string }).type;
	const multiplicity = t ? MULTIPLICITY_BY_TYPE[t] : undefined;
	if (!multiplicity) return recursed;
	const self = recursed as unknown as { multiplicity?: unknown; nonterminal?: unknown };
	const selfNeedsStamp = self.multiplicity !== multiplicity || self.nonterminal !== true;
	const content = (recursed as unknown as { content?: unknown }).content;
	const stampedContent = content && typeof content === 'object'
		? stampMultiplicityThroughWrappers(content as object, multiplicity)
		: content;
	if (!selfNeedsStamp && stampedContent === content) return recursed;
	const next: Record<string, unknown> = { ...(recursed as unknown as Record<string, unknown>) };
	if (selfNeedsStamp) {
		next.multiplicity = multiplicity;
		next.nonterminal = true;
	}
	if (stampedContent !== content) {
		next.content = stampedContent;
	}
	return next as unknown as Rule;
}

/** @internal — stamp `multiplicity` + `nonterminal: true` on `node` and,
 *  if `node` is a transparent wrapper (field/alias/token/prec), recurse
 *  into its content so the inner leaf carries the same attributes. Stops
 *  at structural boundaries (seq/choice) and at nested multiplicity
 *  wrappers (those carry their own multiplicity). Returns the original
 *  reference when nothing changes — preserves the fixed-point identity
 *  check. */
function stampMultiplicityThroughWrappers(
	node: object,
	multiplicity: 'optional' | 'array' | 'nonEmptyArray'
): object {
	const existing = node as { multiplicity?: unknown; nonterminal?: unknown };
	const selfNeedsStamp = existing.multiplicity !== multiplicity || existing.nonterminal !== true;
	const t = (node as { type?: string }).type;
	// Transparent wrappers — descend into `content` and stamp deeper.
	const isTransparent = !!t && (
		isFieldType(t) ||
		isPrecWrapper(node as { type: string }) ||
		t === 'alias' ||
		t === 'ALIAS' ||
		t === 'token' ||
		t === 'TOKEN' ||
		t === 'immediate_token' ||
		t === 'IMMEDIATE_TOKEN'
	);
	let newContent: unknown;
	let contentChanged = false;
	if (isTransparent) {
		const content = (node as { content?: unknown }).content;
		if (content && typeof content === 'object') {
			newContent = stampMultiplicityThroughWrappers(content as object, multiplicity);
			contentChanged = newContent !== content;
		}
	}
	if (!selfNeedsStamp && !contentChanged) return node;
	const next: Record<string, unknown> = { ...(node as Record<string, unknown>) };
	if (selfNeedsStamp) {
		next.multiplicity = multiplicity;
		next.nonterminal = true;
	}
	if (contentChanged) {
		next.content = newContent;
	}
	return next;
}

// ---------------------------------------------------------------------------
// Pass 2: optional keyword-prefix
// ---------------------------------------------------------------------------

function applyOptionalKeyword(ruleName: string, rule: Rule, kwRules: Record<string, Rule>): Rule {
	// Peel prec wrappers so claimed-name set covers the inner seq.
	const inner = peelPrec(rule);
	const claimed = isSeqType(inner.type) ? collectFieldNamesRuntime(inner) : new Set<string>();
	return walkOptionalKeyword(ruleName, rule, claimed, kwRules) ?? rule;
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
	kwRules: Record<string, Rule>
): Rule | null {
	if (isSeqType(rule.type)) {
		const members = (rule as unknown as { members: Rule[] }).members;
		let changed = false;
		const newMembers = members.map((m) => {
			const out = walkOptionalKeyword(ruleName, m, claimedAtSeqLevel, kwRules);
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
			const out = walkOptionalKeyword(ruleName, m, claimedAtSeqLevel, kwRules);
			if (out === null) return m;
			changed = true;
			return out;
		});
		return changed ? ({ ...rule, members: newMembers } as Rule) : null;
	}
	const peeled = peelOptional(rule);
	if (peeled.isOptional) {
		const replacement = tryPromoteInnerKeyword(ruleName, rule, peeled.inner, claimedAtSeqLevel, kwRules);
		if (replacement !== null) return replacement;
		const innerRewritten = walkOptionalKeyword(ruleName, peeled.inner, claimedAtSeqLevel, kwRules);
		if (innerRewritten !== null) {
			return rebuildOptional(rule, innerRewritten);
		}
		return null;
	}
	if (isRepeatType(rule.type) || isFieldType(rule.type)) {
		const content = (rule as unknown as { content: Rule }).content;
		const out = walkOptionalKeyword(ruleName, content, claimedAtSeqLevel, kwRules);
		if (out === null) return null;
		return { ...rule, content: out } as Rule;
	}
	// Descend through prec wrappers to reach inner seqs.
	if (isPrecWrapper(rule as { type: string })) {
		const content = (rule as unknown as { content: Rule }).content;
		const out = walkOptionalKeyword(ruleName, content, claimedAtSeqLevel, kwRules);
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
	kwRules: Record<string, Rule>
): Rule | null {
	const innerNorm = normalizeMember(inner);
	if (!isStringType(innerNorm.type)) return null;
	const kw = innerNorm.value;
	if (typeof kw !== 'string' || !isIdentifierShaped(kw)) return null;
	// `_marker` suffix avoids JS-reserved-keyword collisions.
	const fieldName = `${kw}_marker`;
	if (claimed.has(fieldName)) {
		reportSkip('optional-keyword-prefix', ruleName, `field '${fieldName}' already exists`);
		return null;
	}
	claimed.add(fieldName);
	const symbolRef = registerKwRule(optionalRule, inner, fieldName, kwRules);
	const fieldNode = makeField(optionalRule, fieldName, symbolRef);
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
// Pass: decomposeOptional — auto-group-synthesis for non-leaf optional content
// ---------------------------------------------------------------------------
// Per Option A (spec "Universal canonical shape"): when `optional(content)`
// wraps a seq/choice with slot-bearing members, the content is lifted into
// a synthesized hidden group rule (`_opt_grp_<hex>`) and the optional's
// content is rewritten to a SymbolRule referencing the synthesized name.
//
// Synthesized rules ride the existing per-enrich `kwRules` accumulator
// (same path as `_kw_<name>` keyword helpers), so they end up merged into
// the final grammar rules map at the end of `enrich()`. The TS surface
// (wrap.ts, from.ts) already handles synthesized hidden kinds — Option A
// is implemented entirely TS-side without changing the tree-sitter parse
// shape.
//
// Three cases:
//   1. Leaf content (symbol / string / enum without slot attributes):
//      no synthesis — multiplicity already stamped by
//      `enrichMultiplicityWrappers`.
//   2. seq/choice with at least one slot-bearing member (field, symbol,
//      optional, repeat, repeat1, or nested seq/choice with slots):
//      synthesize a hidden group; replace the optional content with a
//      SymbolRule.
//   3. Pure-literal seq/choice (no fields, no symbols, no nested slots):
//      no synthesis — just an optionally-rendered text fragment.
//
// Hash-stable naming: the synthesized name is `_opt_grp_<sha1(content)[:12]>`.
// Identical content bodies dedupe to the same synthesized rule. Stability
// across runs is verified by the deterministic-name test.

function decomposeOptional(rule: Rule, kwRules: Record<string, Rule>): Rule {
	const recursed = recurseChildren(rule, (r) => decomposeOptional(r, kwRules));
	if (!isOptionalType(recursed.type)) return recursed;
	const content = (recursed as unknown as { content?: Rule }).content;
	if (!content || typeof content !== 'object') return recursed;
	const t = (content as { type?: string }).type;
	if (!isSeqType(t) && !isChoiceType(t)) return recursed;
	if (!hasSlotBearingMember(content)) return recursed;

	const synName = computeOptGroupName(content);
	if (!(synName in kwRules)) {
		kwRules[synName] = content;
	}

	const symbolRef = {
		type: detectCase(recursed) === 'upper' ? 'SYMBOL' : 'symbol',
		name: synName,
		source: 'group-lift'
	} as unknown as Rule;
	return { ...recursed, content: symbolRef } as Rule;
}

/** @internal — true when a seq/choice has at least one slot-bearing
 *  member: a field, a bare symbol reference, a multiplicity wrapper
 *  (optional/repeat/repeat1), or a nested seq/choice that itself bears
 *  slots. Pure-literal seqs (`seq('(', ')')`) return false. */
function hasSlotBearingMember(rule: unknown): boolean {
	if (!rule || typeof rule !== 'object') return false;
	const r = rule as { type?: string; members?: unknown[] };
	const t = r.type;
	if (!isSeqType(t) && !isChoiceType(t)) return false;
	const members = Array.isArray(r.members) ? r.members : [];
	for (const m of members) {
		if (!m || typeof m !== 'object') continue;
		const mt = (m as { type?: string }).type;
		if (
			isFieldType(mt) ||
			isSymbolType(mt) ||
			isOptionalType(mt) ||
			isRepeatType(mt)
		) {
			return true;
		}
		if ((isSeqType(mt) || isChoiceType(mt)) && hasSlotBearingMember(m)) {
			return true;
		}
	}
	return false;
}

/** @internal — hash-stable synthesized-group name. Pure function of the
 *  content body's structure (via canonical JSON), so identical bodies
 *  produce identical synthesized names across runs and across rule sites.
 *  sha1 truncated to 12 hex chars — collisions are vanishingly unlikely
 *  in any realistic grammar and the `_opt_grp_` prefix prevents
 *  collisions with user-authored rule names. */
function computeOptGroupName(content: Rule): string {
	const json = canonicalStringify(content);
	const hash = createHash('sha1').update(json).digest('hex').slice(0, 12);
	return `_opt_grp_${hash}`;
}

/** @internal — canonical JSON stringify with sorted object keys. Ensures
 *  that two structurally-equal rule bodies hash to the same name even
 *  when property insertion order differs between rule construction
 *  paths. Skips functions and undefined values (consistent with
 *  JSON.stringify). */
function canonicalStringify(value: unknown): string {
	if (value === null || typeof value !== 'object') {
		return JSON.stringify(value);
	}
	if (Array.isArray(value)) {
		return '[' + value.map((v) => canonicalStringify(v)).join(',') + ']';
	}
	const obj = value as Record<string, unknown>;
	const keys = Object.keys(obj).sort();
	const parts: string[] = [];
	for (const k of keys) {
		const v = obj[k];
		if (typeof v === 'function' || typeof v === 'undefined') continue;
		parts.push(JSON.stringify(k) + ':' + canonicalStringify(v));
	}
	return '{' + parts.join(',') + '}';
}
