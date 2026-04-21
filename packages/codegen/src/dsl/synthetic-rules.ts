/**
 * dsl/synthetic-rules.ts — accumulator for transform-generated hidden rules.
 *
 * When transform sees an `alias('variant_name')` placeholder, it:
 *   1. Captures the original content at the patch target
 *   2. Registers a hidden rule `_variant_name` with that content here
 *   3. Returns `alias($._variant_name, $.variant_name)` as the replacement
 *
 * The accumulated rules are injected into the grammar after all rule
 * callbacks have run. Same scoping pattern as `role()` in role.ts.
 */

import { isChoiceType, isSeqType, isOptionalType, isStringType, isBlankType, isPlainRepeatType, type RuntimeRule } from './runtime-shapes.ts'
import type { PolymorphVariant } from '../compiler/types.ts'
import {
    getCurrentWireContext,
    wireRegisterSyntheticRule,
    wireRegisterPolymorphVariant,
    wireRegisterConflict,
    wireGetCurrentRuleKind,
} from './wire.ts'

let currentSyntheticRules: Map<string, RuntimeRule> | null = null
let currentRuleKind: string | null = null
let currentOptsRules: Record<string, unknown> | null = null
let currentBlankFn: (() => unknown) | null = null

let currentPolymorphVariants: PolymorphVariant[] = []

export function setCurrentRuleKind(kind: string | null): void {
    // When a wire context is active, the rule-fn wrapper owns
    // currentRuleKind — don't mutate module state. Legacy callers
    // (installGrammarWrapper pass 2) still write to module state when
    // wire is inactive.
    if (getCurrentWireContext()) return
    currentRuleKind = kind
}

export function getCurrentRuleKind(): string | null {
    const fromWire = wireGetCurrentRuleKind()
    if (fromWire !== null) return fromWire
    return currentRuleKind
}

export function registerSyntheticRule(name: string, content: RuntimeRule): void {
    // Route to the active wire context when one exists — its closure
    // absorbs deposits. We still run the legacy blank-placeholder
    // injection below (when `currentOptsRules` is set by
    // installGrammarWrapper pass 2) so tree-sitter's ruleMap snapshot
    // picks up the synthetic name even when wire isn't declaring the
    // polymorph explicitly yet. Once every grammar uses wire() with
    // declarative polymorphs, the legacy injection path becomes dead
    // code and is removed with installGrammarWrapper.
    wireRegisterSyntheticRule(name, content)

    // Dual-write into the legacy accumulator too. This is what
    // installGrammarWrapper's pass-1 dry-run harvests into
    // `discoveredNames` so blank placeholders get injected into
    // opts.rules BEFORE tree-sitter's native grammar() snapshots
    // ruleMap. When wire is active the placeholders are redundant
    // (wire's deposited content resolves via its own deferred fns)
    // but harmless. After every grammar migrates to declarative
    // polymorphs, this dual-write disappears with
    // installGrammarWrapper.
    if (!currentSyntheticRules) {
        currentSyntheticRules = new Map()
    }
    currentSyntheticRules.set(name, content)
    // When the grammar wrapper is active (pass 2 of tree-sitter CLI
    // evaluation), also add a blank placeholder directly to opts.rules
    // so tree-sitter's `$` proxy resolves the new name when subsequent
    // options like `conflicts:` reference it. drainSyntheticRules swaps
    // the blank for the real body after nativeGrammar returns.
    if (currentOptsRules && !(name in currentOptsRules)) {
        const blank = currentBlankFn
        currentOptsRules[name] = () => blank ? blank() : ({ type: 'BLANK' })
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
    // Route to the active wire context when present — wire owns its
    // own polymorph-variant list (idempotent on duplicates so benign
    // re-entry from legacy wrapper pass-1 + pass-2 is absorbed).
    wireRegisterPolymorphVariant(parentKind, childSuffix)
    // Legacy accumulator — used by sittir's evaluate() drain path.
    // Keeps the hard duplicate throw: T029a catches two `variant('x')`
    // calls within the same transform() patch (authoring error), and
    // the wrapper's pass-1/pass-2 flow resets this accumulator via
    // drainPolymorphVariants() between passes so the second pass
    // starts fresh.
    const dup = currentPolymorphVariants.find(v => v.parent === parentKind && v.child === childSuffix)
    if (dup) {
        throw new Error(
            `variant('${childSuffix}'): duplicate variant name on rule '${parentKind}'. ` +
            `Each variant() within a rule must have a unique name — change one or merge the patches.`,
        )
    }
    currentPolymorphVariants.push({ parent: parentKind, child: childSuffix })
}

export function drainPolymorphVariants(): PolymorphVariant[] {
    const variants = currentPolymorphVariants
    currentPolymorphVariants = []
    return variants
}

/**
 * Remove every entry in the legacy polymorph-variant accumulator whose
 * `parent` matches `ruleKind`. Called by wire's rule-fn wrapper before
 * invoking the user's rule body so that re-entry (legacy wrapper pass-1
 * plus pass-2, repeated unit-test invocations, nested grammar extension
 * evaluation) doesn't trip the hard duplicate-throw above. Wire's own
 * accumulator stays intact — this only touches the legacy list that
 * sittir's evaluate() drains.
 */
export function forgetPolymorphVariantsFor(ruleKind: string): void {
    currentPolymorphVariants = currentPolymorphVariants.filter(v => v.parent !== ruleKind)
}

export function drainSyntheticRules(): Map<string, RuntimeRule> {
    const rules = currentSyntheticRules ?? new Map()
    currentSyntheticRules = null
    return rules
}

let currentConflicts: string[][] = []

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
    // Dual-write: wire absorbs (idempotent) + legacy accumulator for
    // installGrammarWrapper's post-grammar append path and any other
    // non-wire consumers of drainConflicts().
    wireRegisterConflict(names)
    const key = names.join('\u0000')
    const exists = currentConflicts.some(g => g.join('\u0000') === key)
    if (!exists) {
        currentConflicts.push([...names])
    }
}

export function drainConflicts(): string[][] {
    const conflicts = currentConflicts
    currentConflicts = []
    return conflicts
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

export function withSyntheticRuleScope<T>(fn: () => T): { result: T; syntheticRules: Map<string, RuntimeRule> } {
    const prev = currentSyntheticRules
    currentSyntheticRules = new Map()
    try {
        const result = fn()
        const syntheticRules = currentSyntheticRules
        return { result, syntheticRules }
    } finally {
        currentSyntheticRules = prev
    }
}
