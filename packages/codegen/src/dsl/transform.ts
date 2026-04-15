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

import type { Rule, FieldRule } from '../compiler/rule.ts'

/**
 * Apply positional patches to a rule's members.
 * Patches are keyed by numeric index. Each patch value replaces the member
 * at that position. Field patches are marked with `source: 'override'`.
 */
export function transform(original: Rule, patches: Record<number | string, Rule>): Rule {
    // For seq: apply patches to members by RAW position. The override
    // author sees the rule tree as-is, including anonymous string
    // delimiters and already-labeled field wrappers, and can wrap any
    // position with a field() — that's the whole point of the primitive
    // being "add a name to an unnamed entry." No hidden remapping.
    if (original.type === 'seq') {
        const members = [...original.members]
        for (const [key, patch] of Object.entries(patches)) {
            const index = Number(key)
            if (isNaN(index) || index < 0 || index >= members.length) {
                // Skip out-of-bounds patches — the position may have been
                // computed against a different view of the rule.
                continue
            }
            members[index] = resolvePatch(patch, members[index]!)
        }
        return { type: 'seq', members }
    }

    // For choice: apply transform to each member recursively
    if (original.type === 'choice') {
        return {
            type: 'choice',
            members: original.members.map(m => transform(m, patches)),
        }
    }

    // For prec-like wrappers that were already stripped — just apply to content
    if ('content' in original && original.content) {
        return { ...original, content: transform(original.content as Rule, patches) } as Rule
    }

    // For other types, return as-is (patches don't apply)
    return original
}

function resolvePatch(patch: Rule, originalMember: Rule): Rule {
    if (patch.type === 'field' && (patch as FieldRule & { _needsContent?: boolean })._needsContent) {
        return { type: 'field', name: patch.name, content: originalMember, source: 'override' as const }
    }
    if (patch.type === 'field') {
        return { ...patch, source: 'override' as const }
    }
    return patch
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
