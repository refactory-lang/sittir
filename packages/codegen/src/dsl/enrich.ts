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
    let r = rule
    r = applyKindToName(ruleName, r, supertypeNames)
    // Bare leading-keyword pass intentionally omitted — the docstring
    // above explains why: wrapping bare leading literals as FIELD(SYM)
    // adds `_kw_<name>` hidden rules that shift tree-sitter's parser-
    // generator tables, breaking unrelated rules' reparse (rust corpus
    // regresses by ~47/136 with this pass on).
    r = applyOptionalKeyword(ruleName, r, kwRules)
    r = applyOptionalSymbol(ruleName, r, supertypeNames)
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
// Pass 1: kind-to-name
// ---------------------------------------------------------------------------

function applyKindToName(ruleName: string, rule: Rule, supertypeNames: ReadonlySet<string>): Rule {
    // Peel prec wrappers so rules like rust `lifetime: prec(1, seq('\'',
    // $.identifier))` are reachable. Without this, pass 1's
    // isSeqType-only entry guard skips every prec-wrapped seq and the
    // grammar.json tree-sitter generates from .sittir/grammar.js shows
    // `fields: {}` even though sittir's own evaluate (which strips prec
    // before running enrich) sees the FIELD. Mirrors pass 3's
    // prec-peel — the prec wrapper rides back on top after rebuild.
    const precStack: Rule[] = []
    let cursor: Rule = rule
    while (isPrecWrapper(cursor as { type: string })) {
        precStack.push(cursor)
        cursor = (cursor as unknown as { content: Rule }).content
    }
    if (!isSeqType(cursor.type)) return rule
    const members = (cursor as unknown as { members: Rule[] }).members
    const kindCounts = new Map<string, number>()
    for (const m of members) {
        if (isSymbolType(m.type) && typeof (m as { name?: unknown }).name === 'string') {
            const n = (m as { name: string }).name
            kindCounts.set(n, (kindCounts.get(n) ?? 0) + 1)
        }
    }
    const existing = collectFieldNamesRuntime(cursor)
    let changed = false
    const newMembers = members.map((m) => {
        if (!isSymbolType(m.type) || typeof (m as { name?: unknown }).name !== 'string') return m
        const k = (m as { name: string }).name
        // Leading-underscore symbols are accepted only when declared
        // as a supertype — in that case the field name drops the
        // prefix (`$._expression` → `field('expression', …)`) to
        // match how the kind surfaces in `node-types.json`.
        let fieldName = k
        if (k.startsWith('_')) {
            if (!supertypeNames.has(k)) return m
            fieldName = k.slice(1)
        }
        if ((kindCounts.get(k) ?? 0) > 1) return m
        if (existing.has(fieldName)) {
            reportSkip('kind-to-name', ruleName, `field '${fieldName}' already exists`)
            return m
        }
        existing.add(fieldName)
        changed = true
        return makeField(cursor, fieldName, m)
    })
    if (!changed) return rule
    let result: Rule = { ...cursor, members: newMembers } as Rule
    for (let i = precStack.length - 1; i >= 0; i--) {
        result = { ...precStack[i]!, content: result } as Rule
    }
    return result
}

// Bare leading-keyword pass intentionally removed — wrapping bare
// leading literals as FIELD(SYM) with a hidden `_kw_<name>` rule
// shifts tree-sitter's parser-generator tables in a way that breaks
// unrelated rules' reparse (validated empirically: rust corpus goes
// from 132/136 → 84/136 with this pass enabled). The docstring at
// the top of this file documents the design intent: readNode's
// `promoteAnonymousKeyword` picks up bare leading literals at runtime
// without grammar-side wrapping.

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
    if (claimed.has(kw)) {
        reportSkip('optional-keyword-prefix', ruleName, `field '${kw}' already exists`)
        return null
    }
    claimed.add(kw)
    const symbolRef = registerKwRule(optionalRule, inner, kw, kwRules)
    const fieldNode = makeField(optionalRule, kw, symbolRef)
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

// ---------------------------------------------------------------------------
// Pass 3: optional-symbol promotion
// ---------------------------------------------------------------------------
//
// Counterpart to pass 1 for the wrapped-in-optional case. Walks
// TOP-LEVEL seq members (never recurses into nested seqs / choices /
// repeats) and, for each `optional($.kind)` whose inner is a bare
// SYMBOL, wraps the inner with `field('kind', $.kind)` — producing
// `optional(field('kind', $.kind))`. Stays at a single descent level
// on purpose: deeper patterns (e.g. `optional(seq($.label, ':'))`)
// need explicit override guidance since the intent is less uniform.
//
// Guards (same as pass 1):
//   - Symbol name must not start with `_` (hidden supertype).
//   - Symbol must appear exactly once at top level across seq members.
//   - Field name must not already be claimed on the seq.
//
// Handles both runtime shapes for optional:
//   - sittir:      `{ type: 'optional', content: SYMBOL }`
//   - tree-sitter: `{ type: 'CHOICE', members: [SYMBOL, BLANK] }`
// (via the shared `peelOptional` helper).

function applyOptionalSymbol(
    ruleName: string,
    rule: Rule,
    supertypeNames: ReadonlySet<string>,
): Rule {
    // Skip hidden helper rules (leading `_`). Tree-sitter inlines their
    // bodies into each call site, so field wrappers added here propagate
    // silently to every parent — templates authored against the parent's
    // raw shape would see unexpected fields. pass 1 (kind-to-name) only
    // avoids this by its own uniqueness guard; pass 3 needs an explicit
    // skip because the inlined body can introduce the same symbol
    // across many parents at different structural positions.
    if (ruleName.startsWith('_')) return rule
    // Peel precedence wrappers transparently — `prec.left(seq(...))` and
    // friends are common wrappers around the actual structural seq
    // (e.g. rust `break_expression: prec.left(seq('break', optional($.label),
    // optional($._expression)))`). The promotion only cares about the
    // inner seq's members; the prec stays on top.
    const precStack: Rule[] = []
    let cursor = rule
    while (isPrecWrapper(cursor)) {
        precStack.push(cursor)
        cursor = (cursor as unknown as { content: Rule }).content
    }
    if (!isSeqType(cursor.type)) return rule
    const members = (cursor as unknown as { members: Rule[] }).members
    // Count bare-symbol targets at top level — including those already
    // inside `optional(...)` or inside `optional(seq(SYMBOL, anon…))` —
    // so a symbol that appears twice doesn't get promoted at one
    // position and collide at another.
    const kindCounts = new Map<string, number>()
    for (const m of members) {
        const bare = bareSymbolTarget(m)
        if (bare !== null) kindCounts.set(bare, (kindCounts.get(bare) ?? 0) + 1)
    }
    const existing = collectFieldNamesRuntime(cursor)
    let changed = false
    const newMembers = members.map((m) => {
        const peeled = peelOptional(m)
        if (!peeled.isOptional) return m
        // Case A: optional(SYMBOL) — wrap the inner symbol.
        const directSym = normalizeMember(peeled.inner)
        if (isSymbolType(directSym.type) && typeof directSym.name === 'string') {
            return tryPromote(m, peeled.inner, directSym.name, null)
        }
        // Case B: optional(seq(SYMBOL, <anonymous tokens>)) — the seq
        // has exactly one SYMBOL member, the rest are literal
        // STRING/PATTERN (anonymous terminals like ':'). Wrap the
        // SYMBOL inside the seq with a FIELD; leave the rest alone.
        if (isSeqType(directSym.type)) {
            const seqMembers = (peeled.inner as unknown as { members: Rule[] }).members
            const symIndexes: number[] = []
            let anyNonAnon = false
            for (let i = 0; i < seqMembers.length; i++) {
                const member = seqMembers[i]!
                const n = normalizeMember(member)
                if (isSymbolType(n.type) && typeof n.name === 'string') {
                    symIndexes.push(i)
                } else if (!isStringType(n.type) && n.type !== 'PATTERN' && n.type !== 'pattern') {
                    anyNonAnon = true
                    break
                }
            }
            if (!anyNonAnon && symIndexes.length === 1) {
                const symIdx = symIndexes[0]!
                const symMember = seqMembers[symIdx]!
                const n = normalizeMember(symMember)
                const name = n.name!
                return tryPromote(m, symMember, name, { kind: 'seq', seq: peeled.inner, index: symIdx })
            }
        }
        return m
    })
    if (!changed) return rule
    // Rebuild seq, then re-wrap with any peeled prec wrappers.
    let result: Rule = { ...cursor, members: newMembers } as Rule
    for (let i = precStack.length - 1; i >= 0; i--) {
        result = { ...precStack[i]!, content: result } as Rule
    }
    return result

    /** @internal — shared guard + build logic for cases A and B.
     *
     *  `name` is the raw SYMBOL target name. If it starts with `_`, it's
     *  accepted only when the symbol is a declared supertype — in which
     *  case the field name drops the underscore (e.g. `$._expression` →
     *  `field('expression', …)`). Supertypes surface in
     *  `node-types.json` as their stripped names anyway, so the field
     *  labelling matches the downstream node kind.
     */
    function tryPromote(
        optionalRule: Rule,
        innerSymbol: Rule,
        name: string,
        seqContext: { kind: 'seq'; seq: Rule; index: number } | null,
    ): Rule {
        let fieldName = name
        if (name.startsWith('_')) {
            if (!supertypeNames.has(name)) return optionalRule
            fieldName = name.slice(1)
        }
        if ((kindCounts.get(name) ?? 0) > 1) return optionalRule
        if (existing.has(fieldName)) {
            reportSkip('optional-symbol', ruleName, `field '${fieldName}' already exists`)
            return optionalRule
        }
        existing.add(fieldName)
        changed = true
        const fieldNode = makeField(optionalRule, fieldName, innerSymbol)
        if (seqContext === null) {
            return rebuildOptional(optionalRule, fieldNode)
        }
        // Rebuild the seq with FIELD replacing the symbol at its index,
        // then rebuild the optional around the new seq.
        const oldMembers = (seqContext.seq as unknown as { members: Rule[] }).members
        const newSeqMembers = oldMembers.map((mm, i) => i === seqContext.index ? fieldNode : mm)
        const newSeq = { ...seqContext.seq, members: newSeqMembers } as Rule
        return rebuildOptional(optionalRule, newSeq)
    }
}

/**
 * @internal — for the uniqueness-count pre-scan. Returns the SYMBOL
 * name for `$.kind` (bare), `optional($.kind)` / `CHOICE(kind,
 * BLANK)`, and `optional(seq($.kind, <anon…>))`; null for everything
 * else. At most one level of descent beyond the optional wrapper.
 */
function bareSymbolTarget(m: Rule): string | null {
    if (isSymbolType(m.type) && typeof (m as { name?: unknown }).name === 'string') {
        return (m as { name: string }).name
    }
    const peeled = peelOptional(m)
    if (!peeled.isOptional) return null
    const n = normalizeMember(peeled.inner)
    if (isSymbolType(n.type) && typeof n.name === 'string') return n.name
    if (isSeqType(n.type)) {
        const seqMembers = (peeled.inner as unknown as { members: Rule[] }).members
        let foundName: string | null = null
        for (const sm of seqMembers) {
            const sn = normalizeMember(sm)
            if (isSymbolType(sn.type) && typeof sn.name === 'string') {
                if (foundName !== null) return null // >1 symbol → not a unique target
                foundName = sn.name
            } else if (!isStringType(sn.type) && sn.type !== 'PATTERN' && sn.type !== 'pattern') {
                return null // non-anonymous non-symbol member → too complex
            }
        }
        return foundName
    }
    return null
}
