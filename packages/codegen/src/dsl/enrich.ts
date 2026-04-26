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

import type { Rule } from '../compiler/rule.ts'
import {
    isSeqType,
    isStringType,
    isSymbolType,
    isFieldType,
    isOptionalType,
    isChoiceType,
    isRepeatType,
    isPrecWrapper,
} from './runtime-shapes.ts'

// Shape of the tree-sitter grammar result that our grammarFn produces.
// The outer wrapper is `{ grammar: {...} }` because tree-sitter's
// top-level `grammar()` call wraps its result; we preserve that shape.
export interface GrammarResult {
    grammar: {
        name: string
        rules: Record<string, Rule>
        [other: string]: unknown
    }
}

export function enrich(base: GrammarResult): GrammarResult {
    if (!base || typeof base !== 'object') {
        throw new Error('enrich(): expected a grammar object, got ' + typeof base)
    }
    const hasWrapper = 'grammar' in base
    const rulesBag = (hasWrapper
        ? base.grammar?.rules
        : (base as unknown as { rules?: unknown }).rules) as Record<string, Rule> | undefined
    if (!rulesBag) return base
    // Extract declared supertype names so pass 3 can treat `_prefix`-
    // stripped labels as valid field names (e.g. `optional($._expression)`
    // → `field('expression', $._expression)`). `supertypes` is a
    // `$ => [...]` callback on the base grammar; we invoke it with a
    // trivial symbol-shaped proxy so enrich can extract the names
    // without waiting for tree-sitter to run the real grammar pipeline.
    const supertypeNames = extractSupertypeNames(base, hasWrapper)
    // Per-enrich hidden-rule bag. Passes that wrap keywords populate it
    // via `registerKwRule` below; the final rule map merges it with the
    // enriched user rules.
    const kwRules: Record<string, Rule> = {}
    const enrichedRules: Record<string, Rule> = {}
    for (const name of Object.keys(rulesBag)) {
        const rule = rulesBag[name]
        enrichedRules[name] = rule ? applyEnrichPasses(name, rule, kwRules, supertypeNames) : rule!
    }
    // Inject `_kw_<name>` hidden rules — user rules NEVER shadow them
    // (they start with `_kw_`, a reserved prefix).
    const mergedRules = { ...enrichedRules, ...kwRules }
    if (hasWrapper) {
        return { ...base, grammar: { ...base.grammar, rules: mergedRules } }
    }
    return { ...(base as unknown as object), rules: mergedRules } as unknown as GrammarResult
}

function applyEnrichPasses(
    ruleName: string,
    rule: Rule,
    kwRules: Record<string, Rule>,
    supertypeNames: ReadonlySet<string>,
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
    const MAX_ITERATIONS = 8
    let r = rule
    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const before = r
        r = applySymbolToField(ruleName, r, supertypeNames)
        // Bare leading-keyword pass intentionally omitted — the docstring
        // above explains why: wrapping bare leading literals as FIELD(SYM)
        // adds `_kw_<name>` hidden rules that shift tree-sitter's parser-
        // generator tables, breaking unrelated rules' reparse (rust corpus
        // regresses by ~47/136 with this pass on).
        r = applyOptionalKeyword(ruleName, r, kwRules)
        if (r === before) return r
    }
    if (!process.env.SITTIR_QUIET) {
        process.stderr.write(`enrich: fixed-point did not converge for '${ruleName}' after ${MAX_ITERATIONS} iterations\n`)
    }
    return r
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
    const root = hasWrapper ? (base as { grammar?: Record<string, unknown> }).grammar : (base as Record<string, unknown>)
    const fn = root?.supertypes
    if (typeof fn !== 'function') return new Set()
    // Proxy that returns a SYMBOL-shaped object for any property access —
    // matches tree-sitter's grammar-authoring protocol where `$.foo`
    // produces a SYMBOL reference named 'foo'. Enough to let the
    // callback return its array; any `.field()` / `.optional()` calls
    // inside would miss but no grammars we've seen do that in
    // supertypes:.
    const dollar = new Proxy({}, {
        get(_t, prop) {
            if (typeof prop === 'string') return { type: 'SYMBOL', name: prop }
            return undefined
        },
    })
    let result: unknown
    try {
        result = (fn as (proxy: unknown) => unknown)(dollar)
    } catch {
        return new Set()
    }
    if (!Array.isArray(result)) return new Set()
    const names = new Set<string>()
    for (const r of result) {
        const n = (r as { name?: unknown })?.name
        if (typeof n === 'string') names.add(n)
    }
    return names
}

// ---------------------------------------------------------------------------
// Direct-mutation builders
// ---------------------------------------------------------------------------

function detectCase(referenceRule: unknown): 'upper' | 'lower' {
    const t = (referenceRule as { type?: string })?.type ?? ''
    return t.length > 0 && t === t.toUpperCase() ? 'upper' : 'lower'
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
    propagateFieldName(content, name)
    return {
        type: detectCase(referenceRule) === 'upper' ? 'FIELD' : 'field',
        name,
        content,
        source: 'enriched',
    } as unknown as Rule
}

/** @internal — walk symbol refs inside `content` and stamp `fieldName`
 *  on each ref whose fieldName is unset. Mirrors evaluate.ts's
 *  `walkRefs` traversal: descends through seq/choice/optional/repeat/
 *  repeat1/prec wrappers; stops at nested field/alias boundaries
 *  (those own their own field name). No-op when `_ref` is absent
 *  (e.g. enrich running before evaluate has annotated refs). */
function propagateFieldName(rule: unknown, fieldName: string): void {
    if (!rule || typeof rule !== 'object') return
    const r = rule as { type?: string; _ref?: { fieldName?: string }; content?: unknown; members?: unknown[] }
    if (r._ref && r._ref.fieldName === undefined) {
        r._ref.fieldName = fieldName
    }
    const t = r.type
    if (t === 'seq' || t === 'SEQ' || t === 'choice' || t === 'CHOICE') {
        if (Array.isArray(r.members)) for (const m of r.members) propagateFieldName(m, fieldName)
        return
    }
    if (
        t === 'optional' || t === 'OPTIONAL'
        || t === 'repeat' || t === 'REPEAT'
        || t === 'repeat1' || t === 'REPEAT1'
        || t === 'prec' || t === 'PREC'
        || t === 'prec_left' || t === 'PREC_LEFT'
        || t === 'prec_right' || t === 'PREC_RIGHT'
        || t === 'prec_dynamic' || t === 'PREC_DYNAMIC'
    ) {
        if (r.content !== undefined) propagateFieldName(r.content, fieldName)
        return
    }
    // field / alias / token / symbol / string / pattern / blank — stop.
}

function makeSymbol(referenceRule: unknown, name: string): Rule {
    return {
        type: detectCase(referenceRule) === 'upper' ? 'SYMBOL' : 'symbol',
        name,
    } as unknown as Rule
}

/**
 * Register a `_kw_<fieldName>` hidden rule whose body is
 * `prec.left(1, stringLiteral)`. Idempotent — multiple positions that
 * promote the same keyword register the same body once.
 *
 * Returns a SYMBOL reference (matching the host rule's case) that the
 * caller embeds inside the new FIELD wrapper.
 */
function registerKwRule(
    hostRule: Rule,
    stringLiteral: Rule,
    keyword: string,
    kwRules: Record<string, Rule>,
): Rule {
    const hiddenName = `_kw_${keyword}`
    if (!(hiddenName in kwRules)) {
        kwRules[hiddenName] = stringLiteral
    }
    return makeSymbol(hostRule, hiddenName)
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function normalizeMember(m: unknown): { type: string; value?: string; content?: unknown; members?: unknown[]; name?: string } {
    if (typeof m === 'string') return { type: 'STRING', value: m }
    if (m instanceof RegExp) return { type: 'PATTERN', value: m.source }
    return (m as { type: string }) ?? { type: 'UNKNOWN' }
}

/** Collect field names that already exist on the top-level seq. */
function collectFieldNamesRuntime(rule: Rule): Set<string> {
    const names = new Set<string>()
    if (!isSeqType(rule.type)) return names
    const members = (rule as unknown as { members: unknown[] }).members
    for (const raw of members) {
        const m = normalizeMember(raw)
        if (isFieldType(m.type) && typeof m.name === 'string') {
            names.add(m.name)
            continue
        }
        const peeled = peelOptional(m as unknown as Rule)
        if (peeled.isOptional) {
            const innerN = normalizeMember(peeled.inner)
            if (isFieldType(innerN.type) && typeof innerN.name === 'string') {
                names.add(innerN.name)
            }
        }
    }
    return names
}

/**
 * Detect `optional(content)` across both runtimes:
 * - sittir:      `{ type: 'optional', content }`
 * - tree-sitter: `{ type: 'CHOICE', members: [content, {BLANK}] }`
 */
function peelOptional(rule: Rule): { inner: Rule; isOptional: boolean } {
    if (isOptionalType(rule.type)) {
        return { inner: (rule as unknown as { content: Rule }).content, isOptional: true }
    }
    if (isChoiceType(rule.type)) {
        const members = (rule as unknown as { members: Array<{ type: string }> }).members
        if (members.length === 2) {
            const blankIdx = members.findIndex(m => m.type === 'BLANK' || m.type === 'blank')
            if (blankIdx !== -1) {
                const inner = members[1 - blankIdx] as unknown as Rule
                return { inner, isOptional: true }
            }
        }
    }
    return { inner: rule, isOptional: false }
}

function isIdentifierShaped(value: string): boolean {
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value)
}

function reportSkip(pass: string, ruleName: string, reason: string): void {
    if (process.env.SITTIR_QUIET) return
    process.stderr.write(`enrich: skipped ${pass} on ${ruleName} (${reason})\n`)
}

// ---------------------------------------------------------------------------
// Pass 1+3: symbol-to-field promotion
// ---------------------------------------------------------------------------
//
// Walks TOP-LEVEL seq members of every non-hidden rule (after peeling
// prec wrappers). For each member that targets exactly one SYMBOL, wraps
// the inner symbol with a `field('<symbol-name>', SYMBOL)`. Three
// member shapes are recognised:
//
//   1. bare SYMBOL                       → `field(name, SYMBOL)` replaces it
//   2. `optional(SYMBOL)`                → `optional(field(name, SYMBOL))`
//   3. `optional(seq(SYMBOL, <anon…>))`  → `optional(seq(field(name, SYMBOL), <anon…>))`
//      (the seq must contain exactly one SYMBOL; all other members must
//       be anonymous STRING / PATTERN literals)
//
// Both runtime shapes of optional are handled (sittir lowercase + tree-
// sitter normalised `CHOICE(X, BLANK)`) via `peelOptional`.
//
// Guards (uniform across all three shapes):
//   - Hidden helper rules (ruleName starts with `_`) are skipped — tree-
//     sitter inlines their bodies into every call site, so adding fields
//     here would propagate silently into multiple parents.
//   - Symbols starting with `_` are accepted ONLY when declared in
//     `supertypes:` (e.g. `$._expression`); the field name drops the
//     leading underscore to match how the kind surfaces in
//     `node-types.json`.
//   - The targeted SYMBOL must appear at most once across the top-level
//     seq members (counted across all three shapes — a bare $.foo and
//     an optional($.foo) on the same parent collide).
//   - The field name must not already be claimed on the seq (some other
//     member, override, or earlier-iteration promotion).
//
// Bare leading-keyword pass (pass 2 in earlier numbering) is
// intentionally absent — wrapping bare leading literals as FIELD(SYM)
// with a hidden `_kw_<name>` rule shifts tree-sitter's parser-
// generator tables in a way that breaks unrelated rules' reparse
// (validated empirically: rust corpus goes 132/136 → 84/136 with that
// pass on). readNode's `promoteAnonymousKeyword` picks up bare leading
// literals at runtime without grammar-side wrapping.

interface SymbolTarget {
    /** Raw symbol name (preserves any leading underscore for supertype detection). */
    readonly name: string
    /** The SYMBOL rule itself, used as the FIELD's content. */
    readonly symbolRule: Rule
    /** Rebuild the original seq-member rule around a freshly-built FIELD node. */
    wrap(fieldNode: Rule): Rule
}

/** @internal — detect which of the three shapes (bare / optional /
 *  optional-seq) the seq member is, and return a SymbolTarget that
 *  knows how to rebuild it once the inner SYMBOL is FIELD-wrapped.
 *  Returns null for any other shape (including multi-symbol seqs,
 *  optional(seq) with non-anon members, or non-symbol leaves). */
function detectSymbolTarget(member: Rule): SymbolTarget | null {
    // Shape 1: bare SYMBOL.
    if (isSymbolType(member.type) && typeof (member as { name?: unknown }).name === 'string') {
        const name = (member as { name: string }).name
        return {
            name,
            symbolRule: member,
            wrap: (fieldNode) => fieldNode,
        }
    }
    const peeled = peelOptional(member)
    if (!peeled.isOptional) return null
    const innerN = normalizeMember(peeled.inner)
    // Shape 2: optional(SYMBOL).
    if (isSymbolType(innerN.type) && typeof innerN.name === 'string') {
        return {
            name: innerN.name,
            symbolRule: peeled.inner,
            wrap: (fieldNode) => rebuildOptional(member, fieldNode),
        }
    }
    // Shape 3: optional(seq(SYMBOL, <anon…>)) — exactly one SYMBOL,
    // all other seq members anonymous (STRING / PATTERN).
    if (!isSeqType(innerN.type)) return null
    const seqMembers = (peeled.inner as unknown as { members: Rule[] }).members
    let symIdx = -1
    for (let i = 0; i < seqMembers.length; i++) {
        const sn = normalizeMember(seqMembers[i]!)
        if (isSymbolType(sn.type) && typeof sn.name === 'string') {
            if (symIdx !== -1) return null // >1 SYMBOL — too complex
            symIdx = i
        } else if (!isStringType(sn.type) && sn.type !== 'PATTERN' && sn.type !== 'pattern') {
            return null // non-anonymous, non-symbol — too complex
        }
    }
    if (symIdx === -1) return null
    const symMember = seqMembers[symIdx]!
    const sn = normalizeMember(symMember)
    if (!isSymbolType(sn.type) || typeof sn.name !== 'string') return null
    const seqRule = peeled.inner
    return {
        name: sn.name,
        symbolRule: symMember,
        wrap: (fieldNode) => {
            const newSeqMembers = seqMembers.map((mm, i) => i === symIdx ? fieldNode : mm)
            const newSeq = { ...seqRule, members: newSeqMembers } as Rule
            return rebuildOptional(member, newSeq)
        },
    }
}

/**
 * @internal — walk `node` looking for SYMBOL references nested inside
 * REPEAT/REPEAT1 wrappers, incrementing `kindCounts[name]` for each one
 * found. Used by `applySymbolToField` to disqualify bare top-level
 * symbols whose kind ALSO appears under a repeat (the repeated copies
 * surface as un-fielded `$children`, so promoting the bare one to a
 * field splits the same kind across `$fields[name]` and `$children`).
 *
 * Descent rules:
 * - SEQ / CHOICE / OPTIONAL / PREC{,_LEFT,_RIGHT,_DYNAMIC} → recurse
 * - REPEAT / REPEAT1 → mark `inRepeat=true` for descent
 * - FIELD / ALIAS → STOP (these carve out their own surface; the
 *   referenced symbol becomes a named field/alias kind, not a sibling
 *   bare child of the parent rule)
 * - SYMBOL → if `inRepeat`, increment count
 */
function countSymbolsInRepeat(
    node: Rule | undefined | null,
    kindCounts: Map<string, number>,
    inRepeat: boolean = false,
): void {
    if (!node) return
    const t = (node as { type?: string }).type
    if (!t) return
    if (isFieldType(t)) return
    if (t === 'ALIAS' || t === 'alias') return
    if (isSymbolType(t)) {
        if (!inRepeat) return
        const name = (node as unknown as { name?: string }).name
        if (typeof name === 'string') {
            kindCounts.set(name, (kindCounts.get(name) ?? 0) + 1)
        }
        return
    }
    if (isRepeatType(t)) {
        const content = (node as unknown as { content?: Rule }).content
        countSymbolsInRepeat(content, kindCounts, true)
        return
    }
    if (isSeqType(t) || isChoiceType(t)) {
        const members = (node as unknown as { members?: Rule[] }).members
        if (Array.isArray(members)) {
            for (const m of members) countSymbolsInRepeat(m, kindCounts, inRepeat)
        }
        return
    }
    if (isOptionalType(t) || isPrecWrapper(node as { type: string })) {
        const content = (node as unknown as { content?: Rule }).content
        countSymbolsInRepeat(content, kindCounts, inRepeat)
        return
    }
    // STRING / PATTERN / TOKEN / BLANK — leaves with no symbols.
}

function applySymbolToField(ruleName: string, rule: Rule, supertypeNames: ReadonlySet<string>): Rule {
    // Skip hidden helpers — tree-sitter inlines their bodies into each
    // call site, so field wrappers added here would propagate silently
    // to every parent. The earlier two-pass split applied this guard
    // only to pass 3; pass 1 relied on pass 1's per-symbol underscore
    // check, which doesn't catch the parent-rule-is-hidden case. Move
    // the guard up.
    if (ruleName.startsWith('_')) return rule
    // Peel prec wrappers so prec-wrapped rules (rust `lifetime: prec(1,
    // seq('\'', $.identifier))`, `break_expression: prec.left(seq(...))`)
    // are reachable. The prec stack rides back on top after rebuild.
    const precStack: Rule[] = []
    let cursor: Rule = rule
    while (isPrecWrapper(cursor as { type: string })) {
        precStack.push(cursor)
        cursor = (cursor as unknown as { content: Rule }).content
    }
    if (!isSeqType(cursor.type)) return rule
    const members = (cursor as unknown as { members: Rule[] }).members
    // Pre-scan: count target symbols across ALL three shapes so a
    // collision between (e.g.) a bare $.foo and an optional($.foo) on
    // the same parent prevents both from getting field-wrapped.
    const kindCounts = new Map<string, number>()
    const targetByIdx: Array<SymbolTarget | null> = members.map(detectSymbolTarget)
    for (const t of targetByIdx) {
        if (t) kindCounts.set(t.name, (kindCounts.get(t.name) ?? 0) + 1)
    }
    // Also count SYMBOL refs that appear inside REPEAT/REPEAT1 wrappers
    // at any depth in the parent's body (e.g. `sep1($.identifier, '.')`
    // expands to `seq($.identifier, repeat(seq('.', $.identifier)))` —
    // the bare top-level $.identifier and the repeated $.identifier are
    // the same kind, but the latter renders as an unfielded child).
    // Wrapping the bare one as field('identifier', $.identifier) would
    // make readNode produce `$fields.identifier` for the leading match
    // and `$children: [Identifier...]` for the repeated tail — a split
    // surface that the factory's `(...children: Identifier[])` shape
    // can't reconstruct (the factory has no leading-field slot). Stop
    // descent at FIELD/ALIAS boundaries since those carve out their own
    // scope.
    for (const m of members) {
        countSymbolsInRepeat(m, kindCounts)
    }
    const existing = collectFieldNamesRuntime(cursor)
    let changed = false
    const newMembers = members.map((m, i) => {
        const t = targetByIdx[i]
        if (!t) return m
        let fieldName = t.name
        if (t.name.startsWith('_')) {
            if (!supertypeNames.has(t.name)) return m
            fieldName = t.name.slice(1)
        }
        if ((kindCounts.get(t.name) ?? 0) > 1) return m
        if (existing.has(fieldName)) {
            reportSkip('symbol-to-field', ruleName, `field '${fieldName}' already exists`)
            return m
        }
        existing.add(fieldName)
        changed = true
        const fieldNode = makeField(cursor, fieldName, t.symbolRule)
        return t.wrap(fieldNode)
    })
    if (!changed) return rule
    let result: Rule = { ...cursor, members: newMembers } as Rule
    for (let i = precStack.length - 1; i >= 0; i--) {
        result = { ...precStack[i]!, content: result } as Rule
    }
    return result
}

// ---------------------------------------------------------------------------
// Pass 2: optional keyword-prefix
// ---------------------------------------------------------------------------

function applyOptionalKeyword(ruleName: string, rule: Rule, kwRules: Record<string, Rule>): Rule {
    const claimed = isSeqType(rule.type) ? collectFieldNamesRuntime(rule) : new Set<string>()
    return walkOptionalKeyword(ruleName, rule, claimed, kwRules) ?? rule
}

function walkOptionalKeyword(
    ruleName: string,
    rule: Rule,
    claimedAtSeqLevel: Set<string>,
    kwRules: Record<string, Rule>,
): Rule | null {
    if (isSeqType(rule.type)) {
        const members = (rule as unknown as { members: Rule[] }).members
        let changed = false
        const newMembers = members.map((m) => {
            const out = walkOptionalKeyword(ruleName, m, claimedAtSeqLevel, kwRules)
            if (out === null) return m
            changed = true
            return out
        })
        return changed ? ({ ...rule, members: newMembers } as Rule) : null
    }
    if (isChoiceType(rule.type)) {
        const members = (rule as unknown as { members: Rule[] }).members
        let changed = false
        const newMembers = members.map((m) => {
            const out = walkOptionalKeyword(ruleName, m, claimedAtSeqLevel, kwRules)
            if (out === null) return m
            changed = true
            return out
        })
        return changed ? ({ ...rule, members: newMembers } as Rule) : null
    }
    const peeled = peelOptional(rule)
    if (peeled.isOptional) {
        const replacement = tryPromoteInnerKeyword(ruleName, rule, peeled.inner, claimedAtSeqLevel, kwRules)
        if (replacement !== null) return replacement
        const innerRewritten = walkOptionalKeyword(ruleName, peeled.inner, claimedAtSeqLevel, kwRules)
        if (innerRewritten !== null) {
            return rebuildOptional(rule, innerRewritten)
        }
        return null
    }
    if (isRepeatType(rule.type) || isFieldType(rule.type)) {
        const content = (rule as unknown as { content: Rule }).content
        const out = walkOptionalKeyword(ruleName, content, claimedAtSeqLevel, kwRules)
        if (out === null) return null
        return { ...rule, content: out } as Rule
    }
    return null
}

function tryPromoteInnerKeyword(
    ruleName: string,
    optionalRule: Rule,
    inner: Rule,
    claimed: Set<string>,
    kwRules: Record<string, Rule>,
): Rule | null {
    const innerNorm = normalizeMember(inner)
    if (!isStringType(innerNorm.type)) return null
    const kw = innerNorm.value
    if (typeof kw !== 'string' || !isIdentifierShaped(kw)) return null
    // Auto-name promoted optional keywords as `<token>_marker` rather
    // than the bare token name. The semantic suffix conveys
    // "presence-indicator slot for this literal" and avoids JS-reserved-
    // keyword collisions (`async`, `static`, `const`) at the
    // factory/config surface — these names projected as bare property
    // keys would clash with reserved identifiers in some emitter
    // contexts. Manual overrides only need to fire for genuinely
    // context-specific cases (e.g. `negative` for `!`,
    // `accessor_kind`/`optionality_marker` for choice-of-strings).
    const fieldName = `${kw}_marker`
    if (claimed.has(fieldName)) {
        reportSkip('optional-keyword-prefix', ruleName, `field '${fieldName}' already exists`)
        return null
    }
    claimed.add(fieldName)
    const symbolRef = registerKwRule(optionalRule, inner, fieldName, kwRules)
    const fieldNode = makeField(optionalRule, fieldName, symbolRef)
    return rebuildOptional(optionalRule, fieldNode)
}

function rebuildOptional(optionalRule: Rule, newInner: Rule): Rule {
    if (isOptionalType(optionalRule.type)) {
        return { ...optionalRule, content: newInner } as Rule
    }
    const members = (optionalRule as unknown as { members: Rule[] }).members
    const newMembers = members.map((m) => {
        const t = (m as { type?: string }).type
        return t === 'BLANK' || t === 'blank' ? m : newInner
    })
    return { ...optionalRule, members: newMembers } as Rule
}

