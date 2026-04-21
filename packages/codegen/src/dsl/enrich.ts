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
 *      `field('kind', $.kind)` with `source: 'inferred'`.
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
 * All passes collision-aware: skip (stderr notification) when the
 * promotion would shadow an existing field name. Strictly local — no
 * cross-rule analysis, no thresholds. All enrich-added FIELDs carry
 * `source: 'inferred'` so downstream passes distinguish them from
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
    // Per-enrich hidden-rule bag. Passes that wrap keywords populate it
    // via `registerKwRule` below; the final rule map merges it with the
    // enriched user rules.
    const kwRules: Record<string, Rule> = {}
    const enrichedRules: Record<string, Rule> = {}
    for (const name of Object.keys(rulesBag)) {
        const rule = rulesBag[name]
        enrichedRules[name] = rule ? applyEnrichPasses(name, rule, kwRules) : rule!
    }
    // Inject `_kw_<name>` hidden rules — user rules NEVER shadow them
    // (they start with `_kw_`, a reserved prefix).
    const mergedRules = { ...enrichedRules, ...kwRules }
    if (hasWrapper) {
        return { ...base, grammar: { ...base.grammar, rules: mergedRules } }
    }
    return { ...(base as unknown as object), rules: mergedRules } as unknown as GrammarResult
}

function applyEnrichPasses(ruleName: string, rule: Rule, kwRules: Record<string, Rule>): Rule {
    let r = rule
    r = applyKindToName(ruleName, r)
    // Bare leading-keyword pass intentionally omitted — the docstring
    // above explains why: wrapping bare leading literals as FIELD(SYM)
    // adds `_kw_<name>` hidden rules that shift tree-sitter's parser-
    // generator tables, breaking unrelated rules' reparse (rust corpus
    // regresses by ~47/136 with this pass on).
    r = applyOptionalKeyword(ruleName, r, kwRules)
    return r
}

// ---------------------------------------------------------------------------
// Direct-mutation builders
// ---------------------------------------------------------------------------

function detectCase(referenceRule: unknown): 'upper' | 'lower' {
    const t = (referenceRule as { type?: string })?.type ?? ''
    return t.length > 0 && t === t.toUpperCase() ? 'upper' : 'lower'
}

function makeField(referenceRule: unknown, name: string, content: unknown): Rule {
    return {
        type: detectCase(referenceRule) === 'upper' ? 'FIELD' : 'field',
        name,
        content,
        source: 'inferred',
    } as unknown as Rule
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

function applyKindToName(ruleName: string, rule: Rule): Rule {
    if (!isSeqType(rule.type)) return rule
    const members = (rule as unknown as { members: Rule[] }).members
    const kindCounts = new Map<string, number>()
    for (const m of members) {
        if (isSymbolType(m.type) && typeof (m as { name?: unknown }).name === 'string') {
            const n = (m as { name: string }).name
            kindCounts.set(n, (kindCounts.get(n) ?? 0) + 1)
        }
    }
    const existing = collectFieldNamesRuntime(rule)
    let changed = false
    const newMembers = members.map((m) => {
        if (!isSymbolType(m.type) || typeof (m as { name?: unknown }).name !== 'string') return m
        const k = (m as { name: string }).name
        if (k.startsWith('_')) return m
        if ((kindCounts.get(k) ?? 0) > 1) return m
        if (existing.has(k)) {
            reportSkip('kind-to-name', ruleName, `field '${k}' already exists`)
            return m
        }
        existing.add(k)
        changed = true
        return makeField(rule, k, m)
    })
    if (!changed) return rule
    return { ...rule, members: newMembers } as Rule
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
