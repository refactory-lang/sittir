/**
 * dsl/transform.ts — sittir override primitives for rule patching.
 *
 * These are NOT tree-sitter baseline DSL. They are sittir-specific
 * extensions that operate on the `original` rule passed by tree-sitter's
 * `grammar(base)` mechanism to each rule callback.
 *
 * Override files import these explicitly:
 *
 *     import { transform, insert, replace } from '@sittir/codegen/dsl'
 *
 * The baseline shadow functions (`grammar`, `seq`, `choice`, `field`, ...)
 * are still injected as globals by `evaluate.ts` — don't import those.
 */

import type { Rule, FieldRule, SeqRule, ChoiceRule } from '../compiler/rule.ts'
import { parsePath, applyPath, reconstructWrapper, reconstructPrec, reconstructContainer, isPrecWrapper, isContainerType, isWrapperType } from './transform-path.ts'
import { isFieldPlaceholder, type FieldPlaceholder } from './field.ts'

type FieldLike = { type: 'field' | 'FIELD'; name: string; content: unknown; source?: string }
function isFieldLike(v: unknown): v is FieldLike {
    if (!v || typeof v !== 'object') return false
    const t = (v as { type?: unknown }).type
    return (t === 'field' || t === 'FIELD') && typeof (v as { name?: unknown }).name === 'string'
}

/**
 * Apply patches to a rule. Patches are an object with path-string keys
 * and Rule (or one-arg field placeholder) values:
 *
 *     transform(original, {
 *         0:       field('name'),       // flat numeric — single-segment path
 *         '0/1':   field('inner'),      // nested path
 *         '0/*\/0': field('items'),     // wildcard
 *     })
 *
 * Two evaluation modes, auto-detected by key shape:
 *
 * 1. **Flat positional** — every key is a pure numeric string. Patches
 *    apply to seq members at that position, recursively descending
 *    through choice alternatives and content wrappers (preserves
 *    legacy override behavior on rules where the original is a choice
 *    of equal-shape alternatives).
 *
 * 2. **Path-addressed** — at least one key contains `/` or `*`. Each
 *    key is parsed as a path and applied to exactly the position(s) it
 *    addresses. Precedence wrappers (prec/PREC_LEFT/...) are
 *    transparent so the same paths work in both sittir and tree-sitter
 *    runtimes.
 *
 * Field patches are marked `source: 'override'` so derive-overrides-json
 * recognizes them. One-arg `field('name')` placeholders are filled in
 * from the original member at the target position; an enrich-inferred
 * field wrapper on the original is unwrapped before re-wrapping to
 * avoid nested fields.
 */
export function transform(original: Rule, patches: Record<number | string, Rule | FieldPlaceholder>): Rule {
    const usesPaths = Object.keys(patches).some(k => k.includes('/') || k.includes('*'))
    if (usesPaths) {
        return applyPathPatches(original, patches)
    }
    return applyFlatPatches(original, patches as Record<number | string, Rule>)
}

function applyPathPatches(original: Rule, patches: Record<number | string, Rule | FieldPlaceholder>): Rule {
    let rule = original
    for (const [key, value] of Object.entries(patches)) {
        const segments = parsePath(String(key))
        rule = applyPath(rule, segments, (member) => resolvePatch(value, member))
    }
    return rule
}

function applyFlatPatches(original: Rule, patches: Record<number | string, Rule>): Rule {
    // Seq: apply patches to members by RAW position. Accepts both
    // sittir lowercase 'seq' and tree-sitter uppercase 'SEQ' so the
    // same transform call works in both runtimes. Reconstructed via
    // native dsl so the result has the runtime-correct rule shape.
    const t = original.type as string
    if (t === 'seq' || t === 'SEQ') {
        const members = [...(original as SeqRule).members]
        for (const [key, patch] of Object.entries(patches)) {
            const index = Number(key)
            if (isNaN(index) || index < 0 || index >= members.length) {
                // Skip out-of-bounds patches — the position may have been
                // computed against a different view of the rule.
                continue
            }
            members[index] = resolvePatch(patch, members[index]!)
        }
        return reconstructContainer(original as SeqRule, members)
    }

    // Choice: apply transform to each member recursively. Reconstruct
    // via native dsl so the choice keeps its runtime-correct shape.
    if (t === 'choice' || t === 'CHOICE') {
        const newMembers = (original as ChoiceRule).members.map(m => applyFlatPatches(m, patches))
        return reconstructContainer(original as ChoiceRule, newMembers)
    }

    // Precedence wrappers — descend into content and reconstruct via
    // native prec to preserve the precedence value (critical for
    // tree-sitter's parser-generator to resolve conflicts the same way
    // as the base grammar).
    if (isPrecWrapper(original)) {
        const newContent = applyFlatPatches((original as { content: Rule }).content, patches)
        return reconstructPrec(original, newContent)
    }

    // Single-content wrappers (optional/repeat/repeat1/field) — descend
    // and reconstruct via native dsl.
    if (isWrapperType(t)) {
        const newContent = applyFlatPatches((original as { content: Rule }).content, patches)
        return reconstructWrapper(original, newContent)
    }

    // For other types, return as-is (patches don't apply)
    return original
}

function resolvePatch(patch: Rule | FieldPlaceholder, originalMember: Rule): Rule {
    // One-arg `field('name')` placeholder — wrap the original member
    // using the runtime's native field() so the resulting rule's type
    // case matches whatever runtime is loading us (sittir lowercase
    // 'field' vs tree-sitter uppercase 'FIELD').
    if (isFieldPlaceholder(patch)) {
        // Unwrap an enrich-inferred field on the original member to
        // avoid nested field('override', field('inferred', inner)).
        let content: unknown = originalMember
        if (isFieldLike(content) && content.source === 'inferred') {
            content = content.content
        }
        const native = (globalThis as { field?: (n: string, c: unknown) => unknown }).field
        if (typeof native !== 'function') {
            throw new Error('transform: no global field() found — patches that use the one-arg field() form require a runtime that injects field() (sittir evaluate.ts or tree-sitter CLI)')
        }
        // Mark as override so derive-overrides-json sees it. Spread to
        // preserve whatever shape (lowercase/uppercase) the native produced.
        return { ...(native(patch.name, content) as object), source: 'override' as const } as Rule
    }
    // Two-arg field passed through directly — accept either case.
    if (isFieldLike(patch)) {
        return { ...patch, source: 'override' as const } as unknown as Rule
    }
    return patch as Rule
}

/**
 * Wrap a member at a position using a wrapper function that receives
 * the original content. The wrapper's result is marked `source: 'override'`.
 */
export function insert(original: Rule, position: number, wrapper: (content: Rule) => Rule): Rule {
    if (original.type !== 'seq') {
        throw new Error(`insert() expects a seq rule, got '${original.type}'`)
    }

    const members = [...original.members]
    if (position < 0 || position >= members.length) {
        throw new Error(`insert(): position ${position} out of bounds (rule has ${members.length} members)`)
    }

    const wrapped = wrapper(members[position]!)
    members[position] = wrapped.type === 'field'
        ? { ...wrapped, source: 'override' as const }
        : wrapped

    return { type: 'seq', members }
}

/**
 * Replace content at a position. Pass `null` to suppress (remove the member).
 */
export function replace(original: Rule, position: number, replacement: Rule | null): Rule {
    if (original.type !== 'seq') {
        throw new Error(`replace() expects a seq rule, got '${original.type}'`)
    }

    const members = [...original.members]
    if (position < 0 || position >= members.length) {
        throw new Error(`replace(): position ${position} out of bounds (rule has ${members.length} members)`)
    }

    if (replacement === null) {
        members.splice(position, 1)
    } else {
        members[position] = replacement
    }

    return { type: 'seq', members }
}
