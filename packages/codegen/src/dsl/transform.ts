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
 *
 * Types are deliberately `RuntimeRule` (not sittir's `Rule` union).
 * The `original` argument comes from tree-sitter's extension mechanism
 * at runtime — that's sittir-shaped under sittir's pipeline but
 * tree-sitter-native (uppercase types) under the CLI runtime. Typing
 * as `RuntimeRule` is honest in both directions and forces callers
 * that inspect the result to narrow via guards in `runtime-shapes.ts`.
 * Override files are `@ts-nocheck` so they're unaffected.
 */

import { parsePath, applyPath, reconstructWrapper, reconstructPrec, reconstructContainer } from './transform-path.ts'
import { isFieldPlaceholder, type FieldPlaceholder } from './field.ts'
import { isAliasPlaceholder, type AliasPlaceholder } from './alias.ts'
import { isFieldLike, isPrecWrapper, isWrapperType, type RuntimeRule } from './runtime-shapes.ts'

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
export function transform(
    original: RuntimeRule,
    patches: Record<number | string, RuntimeRule | FieldPlaceholder | AliasPlaceholder>,
): RuntimeRule {
    const usesPaths = Object.keys(patches).some(k => k.includes('/') || k.includes('*'))
    if (usesPaths) {
        return applyPathPatches(original, patches)
    }
    return applyFlatPatches(original, patches as Record<number | string, RuntimeRule>)
}

function applyPathPatches(
    original: RuntimeRule,
    patches: Record<number | string, RuntimeRule | FieldPlaceholder | AliasPlaceholder>,
): RuntimeRule {
    let rule = original
    for (const [key, value] of Object.entries(patches)) {
        const segments = parsePath(String(key))
        rule = applyPath(rule, segments, (member) => resolvePatch(value, member))
    }
    return rule
}

// Local accessors for the container/wrapper field shapes RuntimeRule
// doesn't expose structurally. Consolidated so the casts live in one
// spot rather than scattered through the function body.
const membersOf = (r: RuntimeRule): RuntimeRule[] =>
    (r as unknown as { members: RuntimeRule[] }).members
const contentOf = (r: RuntimeRule): RuntimeRule =>
    (r as unknown as { content: RuntimeRule }).content

function applyFlatPatches(
    original: RuntimeRule,
    patches: Record<number | string, RuntimeRule>,
): RuntimeRule {
    // Seq: apply patches to members by RAW position. Accepts both
    // sittir lowercase 'seq' and tree-sitter uppercase 'SEQ' so the
    // same transform call works in both runtimes. Reconstructed via
    // native dsl so the result has the runtime-correct rule shape.
    const t = original.type
    if (t === 'seq' || t === 'SEQ') {
        const members = [...membersOf(original)]
        for (const [key, patch] of Object.entries(patches)) {
            // Reject non-pure-numeric keys up front — `Number('foo')` is
            // NaN and `Number('-0')` is 0. Typos like `'1a'` or `',0'`
            // would otherwise silently no-op. Match parsePath's strict
            // `/^\d+$/` gate so flat and path modes agree on validity.
            if (!/^\d+$/.test(key)) {
                throw new Error(
                    `transform: invalid flat-positional key '${key}' — keys must be non-negative integers. Use path syntax ('0/1', '*') for nested addressing.`,
                )
            }
            const index = Number(key)
            if (index >= members.length) {
                // Out-of-bounds: throw to match path mode's behavior at
                // applyToMembers. Silently skipping was a footgun where
                // a typo looked like a no-op in sittir runtime.
                throw new Error(
                    `transform: index ${index} out of bounds in ${original.type} of length ${members.length}`,
                )
            }
            members[index] = resolvePatch(patch, members[index]!)
        }
        return reconstructContainer(original, members)
    }

    // Choice: apply transform to each member recursively. Reconstruct
    // via native dsl so the choice keeps its runtime-correct shape.
    if (t === 'choice' || t === 'CHOICE') {
        const newMembers = membersOf(original).map(m => applyFlatPatches(m, patches))
        return reconstructContainer(original, newMembers)
    }

    // Precedence wrappers — descend into content and reconstruct via
    // native prec to preserve the precedence value (critical for
    // tree-sitter's parser-generator to resolve conflicts the same way
    // as the base grammar).
    if (isPrecWrapper(original)) {
        const newContent = applyFlatPatches(contentOf(original), patches)
        return reconstructPrec(original, newContent)
    }

    // Single-content wrappers (optional/repeat/repeat1/field) — descend
    // and reconstruct via native dsl.
    if (isWrapperType(t)) {
        const newContent = applyFlatPatches(contentOf(original), patches)
        return reconstructWrapper(original, newContent)
    }

    // For other types, return as-is (patches don't apply)
    return original
}

function resolvePatch(
    patch: RuntimeRule | FieldPlaceholder,
    originalMember: RuntimeRule,
): RuntimeRule {
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
        const reconstructed = native(patch.name, content) as object
        return { ...reconstructed, source: 'override' as const } as unknown as RuntimeRule
    }
    // Two-arg field passed through directly — accept either case.
    if (isFieldLike(patch)) {
        return { ...patch, source: 'override' as const } as unknown as RuntimeRule
    }
    // Alias placeholder — alias('variant_name'): wrap the original
    // member as a named alias. Used for nested-alias polymorphs where
    // each choice branch gets wrapped to produce a named variant child
    // in the parse tree. Constructed directly to work in both sittir
    // (lowercase) and tree-sitter CLI (uppercase) runtimes.
    if (isAliasPlaceholder(patch)) {
        const isUpperCase = originalMember.type === originalMember.type.toUpperCase()
        return {
            type: isUpperCase ? 'ALIAS' : 'alias',
            content: originalMember,
            named: true,
            value: patch.name,
        } as unknown as RuntimeRule
    }
    return patch as RuntimeRule
}

/**
 * Wrap a member at a position using a wrapper function that receives
 * the original content. The wrapper's result is marked `source: 'override'`.
 *
 * Reconstructs via the runtime's native `seq()` so the result has the
 * runtime-correct rule shape (sittir lowercase vs tree-sitter
 * uppercase) — same cross-runtime contract as `transform()`.
 */
export function insert(
    original: RuntimeRule,
    position: number,
    wrapper: (content: RuntimeRule) => RuntimeRule,
): RuntimeRule {
    const t = original.type
    if (t !== 'seq' && t !== 'SEQ') {
        throw new Error(`insert() expects a seq rule, got '${original.type}'`)
    }

    const members = [...membersOf(original)]
    if (position < 0 || position >= members.length) {
        throw new Error(`insert(): position ${position} out of bounds (rule has ${members.length} members)`)
    }

    const wrapped = wrapper(members[position]!)
    members[position] = isFieldLike(wrapped)
        ? { ...wrapped, source: 'override' as const } as unknown as RuntimeRule
        : wrapped

    return reconstructContainer(original, members)
}

/**
 * Replace content at a position. Pass `null` to suppress (remove the
 * member). Reconstructs via the runtime's native `seq()`.
 */
export function replace(
    original: RuntimeRule,
    position: number,
    replacement: RuntimeRule | null,
): RuntimeRule {
    const t = original.type
    if (t !== 'seq' && t !== 'SEQ') {
        throw new Error(`replace() expects a seq rule, got '${original.type}'`)
    }

    const members = [...membersOf(original)]
    if (position < 0 || position >= members.length) {
        throw new Error(`replace(): position ${position} out of bounds (rule has ${members.length} members)`)
    }

    if (replacement === null) {
        members.splice(position, 1)
    } else {
        members[position] = replacement
    }

    return reconstructContainer(original, members)
}
