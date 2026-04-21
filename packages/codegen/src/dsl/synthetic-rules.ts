/**
 * dsl/synthetic-rules.ts — accumulator for transform-generated hidden rules.
 *
 * When transform sees an `alias('variant_name')` placeholder, it:
 *   1. Captures the original content at the patch target
 *   2. Registers a hidden rule `_variant_name` with that content here
 *   3. Returns `alias($._variant_name, $.variant_name)` as the replacement
 *
 * All registration now routes through the wire context. No module-level
 * accumulator state remains — functions that previously used module state
 * have been deleted (ADR-0009 phase 3).
 */

import { isChoiceType, isSeqType, isOptionalType, isStringType, isBlankType, isPlainRepeatType, type RuntimeRule } from './runtime-shapes.ts'
import {
    wireRegisterSyntheticRule,
    wireRegisterPolymorphVariant,
    wireRegisterConflict,
    wireGetCurrentRuleKind,
} from './wire.ts'

export function getCurrentRuleKind(): string | null {
    return wireGetCurrentRuleKind()
}

export function registerSyntheticRule(name: string, content: RuntimeRule): void {
    if (!wireRegisterSyntheticRule(name, content)) {
        throw new Error(
            `registerSyntheticRule('${name}'): called outside a wire() context. ` +
            `Wrap your grammar() opts in wire({...}) so synthetic rules route through it.`,
        )
    }
}

/**
 * Shared `FIELD(name, bare-STRING)` → `FIELD(name, SYMBOL(_kw_<name>))`
 * transformation. Synthesizes a hidden `_kw_<name>: prec.left(1, 'kw')`
 * rule via registerSyntheticRule and returns a SYMBOL reference
 * matching the runtime's case. Callers receive the symbol to pass as
 * the FIELD's content — tree-sitter's normalizer preserves FIELD
 * around SYMBOL (unlike FIELD around bare STRING).
 *
 * Used by:
 *   - transform.ts resolvePatch (one-arg field() placeholder path)
 *   - dsl/field.ts two-arg field(name, 'literal') path
 *
 * Optional `wrapSyntheticBody` lets callers apply an extra wrap
 * (e.g., transform's accumulated prec stack) around the synthetic
 * rule's body before registration. Returns the content unchanged
 * when it isn't a bare STRING.
 */
export function maybeKeywordSymbol(
    fieldName: string,
    content: unknown,
    wrapSyntheticBody?: (body: RuntimeRule) => RuntimeRule,
): unknown {
    const c = content as { type?: string; value?: string }
    if (!c || typeof c.type !== 'string') return content
    if (!isStringType(c.type)) return content
    const isUpperCase = c.type === 'STRING'
    const hiddenName = `_kw_${fieldName}`
    const nativePrec = (globalThis as {
        prec?: { left?: (v: number, c: unknown) => unknown }
    }).prec
    let precBody: RuntimeRule = (typeof nativePrec?.left === 'function'
        ? nativePrec.left(1, content)
        : content) as RuntimeRule
    if (wrapSyntheticBody) precBody = wrapSyntheticBody(precBody)
    registerSyntheticRule(hiddenName, precBody)
    return {
        type: isUpperCase ? 'SYMBOL' : 'symbol',
        name: hiddenName,
    }
}

export function registerPolymorphVariant(parentKind: string, childSuffix: string): void {
    if (!wireRegisterPolymorphVariant(parentKind, childSuffix)) {
        throw new Error(
            `registerPolymorphVariant('${parentKind}'/'${childSuffix}'): called outside a wire() context. ` +
            `variant()/alias() must be resolved inside a rule callback that runs under wire().`,
        )
    }
}

/**
 * Register a tree-sitter conflict group. Each call adds one entry to
 * the grammar's `conflicts: [[...]]` list. Used by auto-hoist to tell
 * tree-sitter that a newly-synthesized rule may structurally overlap
 * with an auto-generated internal helper (e.g. shared `_repeat1`
 * factorings) — without this, the parser-generator's static analysis
 * refuses to resolve the conflict and fails grammar compilation.
 */
export function registerConflict(names: readonly string[]): void {
    if (names.length === 0) return
    if (!wireRegisterConflict(names)) {
        throw new Error(
            `registerConflict(${JSON.stringify(names)}): called outside a wire() context.`,
        )
    }
}

// ---------------------------------------------------------------------------
// Aliased-variant synthesis — shared between variant() and alias()
// placeholders in transform.ts. Handles the mechanics of "extract an
// arbitrary sub-rule into a hidden named rule, return an alias node
// that points at it, wrap in prec where needed, and factor out empty-
// matching content tree-sitter won't accept as a syntactic rule."
// ---------------------------------------------------------------------------

/**
 * Wrap `content` in the accumulated prec stack collected during path
 * descent. Each entry in `precStack` is the original prec wrapper the
 * path crossed; we reapply them inner-first so the outer-most prec is
 * the outermost in the result.
 */
export function wrapInPrecStack(
    content: RuntimeRule,
    precStack: readonly RuntimeRule[] | undefined,
    reconstructPrec: (wrapper: RuntimeRule, newContent: RuntimeRule) => RuntimeRule,
): RuntimeRule {
    if (!precStack?.length) return content
    let result = content
    for (let i = precStack.length - 1; i >= 0; i--) {
        result = reconstructPrec(precStack[i]!, result)
    }
    return result
}

/**
 * Build the `alias($._hidden, $.visible)` node AND register the
 * hidden rule's body. Shared between variant() and alias() placeholders
 * because both need the same empty-match / prec handling.
 *
 * Tree-sitter refuses to compile a named syntactic rule whose body
 * matches the empty string (it can't decide which copy-count to choose
 * while parsing). A raw variant extraction can easily produce such a
 * body — e.g. rust's `array_expression` list form is
 * `repeat(elem, sep=',')` which matches zero or more, including zero.
 *
 * When the content is empty-matchable AND we can factor out a non-empty
 * core, extract the core and wrap the call-site alias in `optional()`.
 * The language is preserved (`optional(repeat1(X))` = `repeat(X)`) and
 * the hidden rule is guaranteed non-empty so tree-sitter accepts it.
 *
 * Patterns handled:
 *   - `repeat(X)`     → register `repeat1(X)`, alias wrapped in optional
 *   - `optional(X)`   → register X, alias wrapped in optional
 *   - `choice(X, BLANK)` or `choice(BLANK, X)` with X non-empty
 *                     → register X, alias wrapped in optional
 *   - `seq(A, B, ...)` with all members empty-matchable — rewrite the
 *                     first factorable member; still wrap in optional
 */
export function registerAliasedVariant(
    hiddenName: string,
    aliasValue: string,
    originalMember: RuntimeRule,
    bodyWrapper: (body: RuntimeRule) => RuntimeRule,
): RuntimeRule {
    const isUpperCase = originalMember.type === originalMember.type.toUpperCase()
    const wasEmpty = matchesEmpty(originalMember)
    const factored = factorOutEmptiness(originalMember)
    if (wasEmpty && !factored) {
        throw new Error(
            `variant()/alias(): can't extract '${hiddenName}' — its content matches the empty string and no non-empty core could be factored out. ` +
            `Tree-sitter rejects syntactic rules that match empty. Restructure the parent rule (e.g. lift the empty case outside the choice) before splitting.`,
        )
    }
    const body = factored ? factored.nonEmpty : originalMember
    registerSyntheticRule(hiddenName, bodyWrapper(body as RuntimeRule))
    const aliasNode = {
        type: isUpperCase ? 'ALIAS' : 'alias',
        content: { type: isUpperCase ? 'SYMBOL' : 'symbol', name: hiddenName },
        named: true,
        value: aliasValue,
    } as unknown as RuntimeRule
    if (factored) {
        const optional = (globalThis as { optional?: (c: unknown) => unknown }).optional
        if (typeof optional !== 'function') {
            throw new Error('synthetic-rules: no global optional() found — variant()/alias() on empty-matching content needs runtime optional()')
        }
        return optional(aliasNode) as RuntimeRule
    }
    return aliasNode
}

/**
 * If `rule` matches the empty string but has a factorable non-empty
 * core, return `{ nonEmpty }` — the caller wraps the call site in
 * `optional()` so the language stays the same. Returns null when the
 * rule is either non-empty already or can't be factored.
 */
function factorOutEmptiness(rule: RuntimeRule): { nonEmpty: unknown } | null {
    if (!matchesEmpty(rule)) return null
    return extractNonEmpty(rule)
}

/**
 * Recursively strip empty-matching branches from transparent
 * composition nodes (SEQ / CHOICE / OPTIONAL / REPEAT) until the
 * result is guaranteed non-empty. Returns null when the whole rule
 * is unconditionally empty or the shape is too pathological to
 * factor cleanly — caller surfaces the limitation upstream.
 */
function extractNonEmpty(rule: RuntimeRule): { nonEmpty: unknown } | null {
    const t = rule.type
    // repeat(X, ...) → repeat1(X, ...) — preserves sep / trailing /
    // leading metadata by direct spread (native repeat1() can't take
    // those as arguments).
    if (isPlainRepeatType(t)) {
        const r = rule as unknown as Record<string, unknown>
        const nonEmpty: Record<string, unknown> = { ...r, type: t === 'REPEAT' ? 'REPEAT1' : 'repeat1' }
        return { nonEmpty }
    }
    if (isOptionalType(t)) {
        const inner = (rule as unknown as { content: RuntimeRule }).content
        return matchesEmpty(inner) ? extractNonEmpty(inner) : { nonEmpty: inner }
    }
    if (isChoiceType(t)) {
        const members = (rule as unknown as { members: RuntimeRule[] }).members
        const nonEmpty = members.filter(m => !matchesEmpty(m))
        if (nonEmpty.length === 0) return null
        if (nonEmpty.length === 1) return { nonEmpty: nonEmpty[0] }
        return { nonEmpty: { type: t, members: nonEmpty } }
    }
    if (isSeqType(t)) {
        // A SEQ matches empty only when EVERY member does. Replacing
        // any one member with its non-empty core makes the whole SEQ
        // non-empty; we rewrite members one at a time from the first
        // factorable position. The outer `optional()` at the call
        // site restores the original empty-path semantics.
        const members = [...(rule as unknown as { members: RuntimeRule[] }).members]
        for (let i = 0; i < members.length; i++) {
            const factored = extractNonEmpty(members[i]!)
            if (factored) {
                members[i] = factored.nonEmpty as RuntimeRule
                return { nonEmpty: { type: t, members } }
            }
        }
        return null
    }
    return null
}

/**
 * Conservative empty-match detector. Returns true when `rule` can
 * produce a zero-length match. Used only to decide whether the
 * factored non-empty core is actually non-empty — errs on the side of
 * saying "true" for unknown shapes so callers don't wrongly claim a
 * body is non-empty.
 */
export function matchesEmpty(rule: RuntimeRule): boolean {
    const t = rule.type
    if (isBlankType(t)) return true
    if (isOptionalType(t)) return true
    if (isPlainRepeatType(t)) return true
    if (isChoiceType(t)) {
        const members = (rule as unknown as { members: RuntimeRule[] }).members
        return members.some(m => matchesEmpty(m))
    }
    if (isSeqType(t)) {
        const members = (rule as unknown as { members: RuntimeRule[] }).members
        return members.every(m => matchesEmpty(m))
    }
    return false
}

