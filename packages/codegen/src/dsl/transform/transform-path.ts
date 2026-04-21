/**
 * dsl/transform-path.ts — path addressing for transform() patches.
 *
 * Path strings use forward-slash delimiters with numeric segments and
 * `*` wildcards:
 *
 *   '0'        → first position of the top-level seq
 *   '0/0'      → first position of the nested structure at position 0
 *   '0/*\/1'   → position 1 of every branch at level 1 under position 0
 *   '*'        → every top-level position
 *
 * Rules:
 * - No leading slash (`/0` is invalid).
 * - No trailing slash.
 * - `*` matches a single level only — not recursive.
 * - Out-of-bounds paths and zero-match wildcards are hard errors at
 *   apply time (with the path + actual rule shape in the message).
 */

import { isPrecWrapper as isPrecWrapperShape, isContainerType, isWrapperType, isSeqType, isChoiceType, isFieldType, type RuntimeRule } from '../runtime-shapes.ts'

// ---------------------------------------------------------------------------
// Native DSL accessors — we call the runtime-injected DSL functions
// (sittir's grammarFn-injected globals OR tree-sitter CLI's native
// globals) instead of reconstructing rule objects directly. This keeps
// the rule shape consistent with whichever runtime is processing the
// transform call, and runs whatever normalization the runtime does.
// ---------------------------------------------------------------------------

interface RuntimeDsl {
    seq?: (...members: RuntimeRule[]) => RuntimeRule
    choice?: (...members: RuntimeRule[]) => RuntimeRule
    optional?: (content: RuntimeRule) => RuntimeRule
    repeat?: (content: RuntimeRule) => RuntimeRule
    repeat1?: (content: RuntimeRule) => RuntimeRule
    field?: (name: string, content: RuntimeRule) => RuntimeRule
    prec?: ((value: number, content: RuntimeRule) => RuntimeRule) & {
        left?: (value: number, content: RuntimeRule) => RuntimeRule
        right?: (value: number, content: RuntimeRule) => RuntimeRule
        dynamic?: (value: number, content: RuntimeRule) => RuntimeRule
    }
}

function dsl(): RuntimeDsl {
    return globalThis as unknown as RuntimeDsl
}

function nativeRequired<K extends keyof RuntimeDsl>(name: K): NonNullable<RuntimeDsl[K]> {
    const fn = dsl()[name]
    if (typeof fn !== 'function') {
        throw new Error(`transform: no global ${String(name)}() found — must be called inside a runtime that injects ${String(name)}() (sittir evaluate.ts or tree-sitter CLI)`)
    }
    return fn as NonNullable<RuntimeDsl[K]>
}

export type PathSegment =
    | { kind: 'index'; value: number }
    | { kind: 'wildcard' }
    | {
        /**
         * Kind-based descent: match every symbol occurrence of `name`
         * in the current subtree. Skips occurrences already wrapped in
         * a named `field()` (reusing a target kind is almost always
         * unintended — the semi form's `field('length', _expression)`
         * must survive when the list form's `_expression` is patched).
         */
        kind: 'kind-match'
        name: string
    }

/**
 * Tagged error thrown by path-descent failure points (out-of-bounds
 * index, "cannot descend into primitive" etc). Wildcards catch only
 * this class — every other exception (TypeError, missing-global
 * errors from nativeRequired, bugs in reconstruction helpers, throws
 * from user-supplied patch functions) propagates so real bugs aren't
 * masked as "wildcard matched zero".
 */
export class ApplyPathSkip extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ApplyPathSkip'
    }
}

/**
 * Parse a path string into segments. Throws on malformed input.
 *
 * Segment forms:
 *   - `N`       — positional index (0-based)
 *   - `-N`      — reverse index from the end (`-1` = last member)
 *   - `*`       — wildcard, matches every sibling at this level
 *   - `<kind>`  — kind-based match: finds every occurrence of the
 *                 symbol named `<kind>` in the current subtree,
 *                 skipping occurrences already inside a named field.
 *                 Must start with a letter or underscore.
 */
export function parsePath(pathStr: string): PathSegment[] {
    if (typeof pathStr !== 'string' || pathStr.length === 0) {
        throw new Error(`parsePath: path must be a non-empty string, got ${JSON.stringify(pathStr)}`)
    }
    if (pathStr.startsWith('/') || pathStr.endsWith('/')) {
        throw new Error(`parsePath: leading/trailing slash not allowed in path '${pathStr}'`)
    }
    const parts = pathStr.split('/')
    const segments: PathSegment[] = []
    for (const part of parts) {
        if (part === '*') {
            segments.push({ kind: 'wildcard' })
        } else if (/^-?\d+$/.test(part)) {
            segments.push({ kind: 'index', value: Number(part) })
        } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(part)) {
            segments.push({ kind: 'kind-match', name: part })
        } else {
            throw new Error(`parsePath: invalid segment '${part}' in path '${pathStr}' — must be a numeric index, '*', or a kind name ([a-zA-Z_][a-zA-Z0-9_]*)`)
        }
    }
    return segments
}

/**
 * Apply a patch at one or more positions inside a rule tree, addressed
 * by a parsed path. Returns a new rule (no mutation). Wildcards expand
 * to every matching sibling at that level.
 *
 * The patch may be either a Rule (replace the target) or a function
 * `(originalMember: Rule) => Rule` for in-place wrapping.
 *
 * Throws on out-of-bounds indices or zero-match wildcards.
 */
// Local accessors for the container/wrapper field shapes RuntimeRule
// doesn't expose structurally. Consolidated so the casts live in one
// spot rather than scattered through applyPath's branches.
const membersOf = (r: RuntimeRule): RuntimeRule[] =>
    (r as unknown as { members: RuntimeRule[] }).members
const contentOf = (r: RuntimeRule): RuntimeRule =>
    (r as unknown as { content: RuntimeRule }).content

export function applyPath(
    rule: RuntimeRule,
    segments: readonly PathSegment[],
    patch: RuntimeRule | ((member: RuntimeRule, precStack?: readonly RuntimeRule[]) => RuntimeRule),
    precStack?: readonly RuntimeRule[],
): RuntimeRule {
    if (segments.length === 0) {
        // Reached the target position — apply the patch.
        return typeof patch === 'function' ? patch(rule, precStack) : patch
    }

    if (isPrecWrapperShape(rule)) {
        return descendThroughPrecWrapper(rule, segments, patch, precStack)
    }

    const [head, ...rest] = segments
    const t = rule.type

    // Kind-match is scope-agnostic — find every occurrence of the target
    // kind in the current subtree and apply the patch at each, skipping
    // occurrences already inside a named field. Runs before
    // container/wrapper dispatch because kind matching works through
    // arbitrary composition (seq / choice / wrapper chains).
    if (head!.kind === 'kind-match') {
        return applyKindMatch(rule, head!.name, rest, patch, precStack, false)
    }

    // Containers we can descend into — predicates in runtime-shapes.ts
    // accept both sittir lowercase and tree-sitter uppercase naming.
    if (isContainerType(t)) {
        return applyToMembers(rule, head!, rest, patch, precStack)
    }
    if (isWrapperType(t)) {
        return descendThroughSingleWrapper(rule, head!, rest, patch, precStack)
    }

    throw new ApplyPathSkip(`applyPath: cannot descend into '${rule.type}' rule (path has ${segments.length} segments left)`)
}

/**
 * Descend through a prec wrapper without consuming a path segment, then
 * reconstruct the wrapper on the way back.
 *
 * @remarks
 * Precedence wrappers are transparent to path addressing. Sittir's pipeline
 * strips them; tree-sitter's CLI preserves them. Path segments target the
 * underlying structure, not the wrapper. Accumulated prec wrappers are passed
 * to the patch callback so alias/variant hidden rules can inherit context.
 *
 * @param rule - The prec wrapper to descend through.
 * @param segments - Remaining path segments (not consumed by this descent).
 * @param patch - Patch value or function to apply at the addressed position.
 * @param precStack - Previously accumulated prec wrappers.
 * @returns Reconstructed prec wrapper with the patched inner content.
 */
function descendThroughPrecWrapper(
    rule: RuntimeRule,
    segments: readonly PathSegment[],
    patch: RuntimeRule | ((member: RuntimeRule, precStack?: readonly RuntimeRule[]) => RuntimeRule),
    precStack: readonly RuntimeRule[] | undefined,
): RuntimeRule {
    const newStack = precStack ? [...precStack, rule] : [rule]
    const newContent = applyPath(contentOf(rule), segments, patch, newStack)
    return reconstructPrec(rule, newContent)
}

/**
 * Descend through a single-content wrapper (optional/repeat/repeat1/field),
 * treating position 0 (or -1) as the wrapped content.
 *
 * @remarks
 * For wrappers, position 0 is the wrapped content. Negative indices are clamped
 * to 0 — a wrapper has exactly one slot.
 *
 * @param rule - The wrapper rule to descend through.
 * @param head - The current path segment (index or wildcard).
 * @param rest - Remaining path segments after this descent.
 * @param patch - Patch value or function to apply at the addressed position.
 * @param precStack - Accumulated prec wrappers for the patch callback.
 * @returns Reconstructed wrapper with the patched inner content.
 * @throws {ApplyPathSkip} If the index is out of range for a single-slot wrapper.
 */
function descendThroughSingleWrapper(
    rule: RuntimeRule,
    head: PathSegment,
    rest: readonly PathSegment[],
    patch: RuntimeRule | ((member: RuntimeRule, precStack?: readonly RuntimeRule[]) => RuntimeRule),
    precStack: readonly RuntimeRule[] | undefined,
): RuntimeRule {
    const wrapperHit = head.kind === 'wildcard'
        || (head.kind === 'index' && (head.value === 0 || head.value === -1))
    if (wrapperHit) {
        const newContent = applyPath(contentOf(rule), rest, patch, precStack)
        return reconstructWrapper(rule, newContent)
    }
    throw new ApplyPathSkip(
        `applyPath: index ${head.kind === 'index' ? head.value : '*'} out of bounds — '${rule.type}' wraps a single content rule (only index 0 / -1 is valid)`,
    )
}

/**
 * Recursively descend into the subtree, applying `patch` to every
 * `symbol` reference whose name matches `targetKind`. Occurrences
 * already inside a named `field(name, ...)` wrapper are skipped —
 * re-wrapping a pre-fielded symbol is almost always unintended
 * (e.g. leaving rust's `field('length', _expression)` alone when
 * the list-form `_expression` gets `field('elements')`).
 *
 * Throws `ApplyPathSkip` when zero matches are found — a kind-match
 * that reaches nothing is a typo magnet, same as wildcard.
 */
function applyKindMatch(
    rule: RuntimeRule,
    targetKind: string,
    rest: readonly PathSegment[],
    patch: RuntimeRule | ((member: RuntimeRule, precStack?: readonly RuntimeRule[]) => RuntimeRule),
    precStack: readonly RuntimeRule[] | undefined,
    insideNamedField: boolean,
): RuntimeRule {
    // Track whether we matched anything so callers can error on zero.
    const result = walkKindMatch(rule, targetKind, rest, patch, precStack, insideNamedField)
    if (!result.matched) {
        throw new ApplyPathSkip(`applyPath: kind '${targetKind}' matched zero occurrences in this subtree`)
    }
    return result.rule
}

function walkKindMatch(
    rule: RuntimeRule,
    targetKind: string,
    rest: readonly PathSegment[],
    patch: RuntimeRule | ((member: RuntimeRule, precStack?: readonly RuntimeRule[]) => RuntimeRule),
    precStack: readonly RuntimeRule[] | undefined,
    insideNamedField: boolean,
): { rule: RuntimeRule; matched: boolean } {
    if (!isWalkableNode(rule)) {
        return { rule, matched: false }
    }
    const t = rule.type

    // Prec wrappers are transparent.
    if (isPrecWrapperShape(rule)) {
        const stack = precStack ? [...precStack, rule] : [rule]
        const inner = walkKindMatch(contentOf(rule), targetKind, rest, patch, stack, insideNamedField)
        return { rule: inner.matched ? reconstructPrec(rule, inner.rule) : rule, matched: inner.matched }
    }

    // Symbol match — the terminal case. Apply the remaining path (if any) or
    // the patch directly. Skip when inside a named field wrapper (except when
    // the remaining path explicitly asks to descend into a field's content).
    if (t === 'symbol' || t === 'SYMBOL') {
        const name = (rule as unknown as { name: string }).name
        if (name !== targetKind) return { rule, matched: false }
        if (insideNamedField) return { rule, matched: false }
        const patched = rest.length === 0
            ? (typeof patch === 'function' ? patch(rule, precStack) : patch)
            : applyPath(rule, rest, patch, precStack)
        return { rule: patched, matched: true }
    }

    // Field: descend into content but mark insideNamedField=true so nested
    // `_expression` references inside already-fielded symbols don't get
    // re-wrapped.
    if (t === 'field' || t === 'FIELD') {
        const inner = walkKindMatch(contentOf(rule), targetKind, rest, patch, precStack, true)
        return { rule: inner.matched ? reconstructWrapper(rule, inner.rule) : rule, matched: inner.matched }
    }

    // Other wrappers — descend transparently.
    if (isWrapperType(t)) {
        const inner = walkKindMatch(contentOf(rule), targetKind, rest, patch, precStack, insideNamedField)
        return { rule: inner.matched ? reconstructWrapper(rule, inner.rule) : rule, matched: inner.matched }
    }

    // Containers — descend into every member.
    if (isContainerType(t)) {
        const members = [...membersOf(rule)]
        let anyMatched = false
        for (let i = 0; i < members.length; i++) {
            const inner = walkKindMatch(members[i]!, targetKind, rest, patch, precStack, insideNamedField)
            if (inner.matched) {
                members[i] = inner.rule
                anyMatched = true
            }
        }
        return { rule: anyMatched ? reconstructContainer(rule, members) : rule, matched: anyMatched }
    }

    // Leaf types we don't descend into (string, pattern, blank, etc.).
    return { rule, matched: false }
}

/**
 * Guard that rejects null, undefined, and non-object values before descent in
 * walkKindMatch.
 *
 * @remarks
 * Leaf nodes like `BLANK` come through the tree-sitter CLI runtime without a
 * `content` field, and some deeply nested positions hand back `undefined` /
 * primitives. Either way, kind-match has nothing to descend into — treat as a
 * leaf.
 *
 * @param rule - The value to test.
 * @returns `true` if `rule` is a non-null object with a string `type` property.
 */
function isWalkableNode(rule: unknown): rule is RuntimeRule {
    return rule !== null
        && rule !== undefined
        && typeof rule === 'object'
        && typeof (rule as { type?: unknown }).type === 'string'
}

/**
 * Reconstruct a container rule (seq or choice) by calling the
 * runtime's native dsl function with the new members. Delegating to
 * native ensures the result has the correct rule-type case and
 * inherits any normalization the runtime applies.
 */
export function reconstructContainer(rule: RuntimeRule, members: RuntimeRule[]): RuntimeRule {
    const t = rule.type
    if (isSeqType(t)) return nativeRequired('seq')(...members)
    if (isChoiceType(t)) return nativeRequired('choice')(...members)
    throw new Error(`reconstructContainer: unknown container type '${t}'`)
}

/**
 * Reconstruct a single-content wrapper rule (optional/repeat/repeat1/field)
 * via the runtime's native dsl. Field wrappers delegate to native field
 * which handles the (name, content) signature.
 *
 * Throws on:
 *   - Repeat wrappers with `separator`/`leading`/`trailing` metadata —
 *     the native `repeat()` call can't round-trip those, so silently
 *     dropping them would corrupt the rule. Path-addressing under a
 *     delimited repeat is an authoring mistake; surface it loudly.
 *   - Unknown wrapper types — safer to throw than silently emit a
 *     hand-rolled shape that may be wrong-case in tree-sitter runtime.
 */
export function reconstructWrapper(rule: RuntimeRule, newContent: RuntimeRule): RuntimeRule {
    const t = rule.type
    if (t === 'optional') return nativeRequired('optional')(newContent)
    if (t === 'repeat' || t === 'REPEAT' || t === 'repeat1' || t === 'REPEAT1') {
        return reconstructRepeatWithMetadata(rule, newContent)
    }
    if (isFieldType(t)) {
        const name = (rule as unknown as { name: string }).name
        return nativeRequired('field')(name, newContent)
    }
    throw new Error(
        `reconstructWrapper: no native dsl reconstruction for wrapper type '${rule.type}' — this is a bug in the path-descent logic.`,
    )
}

/**
 * Reconstruct a repeat/repeat1 wrapper, preserving any sittir-specific
 * separator/leading/trailing metadata that the native repeat() call cannot
 * round-trip through its parameters.
 *
 * @remarks
 * Sittir's `repeat()` helper collapses the common `seq(x, optional(sep))`
 * pattern into a single repeat node with separator/leading/trailing metadata.
 * The native runtime function doesn't accept those fields as parameters, so they
 * are preserved by spreading onto the reconstructed node directly. Tree-sitter
 * CLI never produces metadata-bearing repeats (it keeps the raw seq shape), so
 * in that runtime the metadata branch is simply never taken.
 *
 * @param rule - The original repeat or repeat1 rule (may carry metadata).
 * @param newContent - The replacement content for the repeat body.
 * @returns Reconstructed repeat rule with metadata fields restored if present.
 */
function reconstructRepeatWithMetadata(rule: RuntimeRule, newContent: RuntimeRule): RuntimeRule {
    const r = rule as { type: string; separator?: unknown; leading?: unknown; trailing?: unknown }
    const t = r.type
    const baseNode = nativeRequired(t === 'repeat' || t === 'REPEAT' ? 'repeat' : 'repeat1')(newContent) as Record<string, unknown>
    if (r.separator !== undefined) baseNode.separator = r.separator
    if (r.leading !== undefined) baseNode.leading = r.leading
    if (r.trailing !== undefined) baseNode.trailing = r.trailing
    return baseNode as unknown as RuntimeRule
}

/**
 * Reconstruct a precedence wrapper via the runtime's native prec.left/
 * prec.right/prec.dynamic/prec function. Preserves the precedence
 * value so tree-sitter's parser-generator can resolve conflicts the
 * same way as the base grammar.
 */
const PREC_VARIANT_MAP = {
    prec_left: 'left',
    prec_right: 'right',
    prec_dynamic: 'dynamic',
} as const

export function reconstructPrec(rule: RuntimeRule, newContent: RuntimeRule): RuntimeRule {
    const t = rule.type.toLowerCase()
    const value = (rule as { value?: number }).value ?? 0
    const prec = nativeRequired('prec')
    const variant = PREC_VARIANT_MAP[t as keyof typeof PREC_VARIANT_MAP]
    if (variant) {
        const fn = prec[variant]
        if (typeof fn !== 'function') throw new Error(`transform: native prec.${variant} not available`)
        return fn(value, newContent)
    }
    return prec(value, newContent)
}

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

// Re-export so transform.ts's `applyFlatPatches` can reach the
// shared predicates through the canonical path-related module.
export { isContainerType, isWrapperType, isPrecWrapperShape as isPrecWrapper }

function applyToMembers(
    rule: RuntimeRule,
    head: PathSegment,
    rest: readonly PathSegment[],
    patch: RuntimeRule | ((member: RuntimeRule, precStack?: readonly RuntimeRule[]) => RuntimeRule),
    precStack?: readonly RuntimeRule[],
): RuntimeRule {
    const members = [...membersOf(rule)]

    if (head.kind === 'index') {
        return applyToIndexedMember(rule, members, head.value, rest, patch, precStack)
    }

    return applyWildcardToMembers(rule, members, rest, patch, precStack)
}

/**
 * Apply a patch to a single member of a container rule at a resolved index.
 *
 * @remarks
 * Negative indices count from the end: `-1` is the last member, `-2` the
 * second-to-last. Handy for trailing structural tokens (e.g. a unit struct's
 * `;`) whose position depends on optional earlier members.
 *
 * @param rule - The container rule (for error messages and reconstruction).
 * @param members - Mutable copy of the container's members.
 * @param indexValue - The raw index value (may be negative).
 * @param rest - Remaining path segments after this step.
 * @param patch - Patch value or function.
 * @param precStack - Accumulated prec wrappers.
 * @returns Reconstructed container with the patched member.
 * @throws {ApplyPathSkip} If the resolved index is out of bounds.
 */
function applyToIndexedMember(
    rule: RuntimeRule,
    members: RuntimeRule[],
    indexValue: number,
    rest: readonly PathSegment[],
    patch: RuntimeRule | ((member: RuntimeRule, precStack?: readonly RuntimeRule[]) => RuntimeRule),
    precStack: readonly RuntimeRule[] | undefined,
): RuntimeRule {
    const idx = indexValue < 0 ? members.length + indexValue : indexValue
    if (idx < 0 || idx >= members.length) {
        throw new ApplyPathSkip(
            `applyPath: index ${indexValue} out of bounds in ${rule.type} of length ${members.length}`,
        )
    }
    members[idx] = applyPath(members[idx]!, rest, patch, precStack)
    return reconstructContainer(rule, members)
}

/**
 * Apply a patch to every member of a container rule that can accept the
 * remaining path, skipping members that throw ApplyPathSkip.
 *
 * @remarks
 * Members that can't descend throw `ApplyPathSkip`, which is caught and skipped;
 * every other exception (TypeError, missing-global error, bug in reconstruction,
 * throw from user-supplied patch function) propagates so real bugs are never
 * masked. Zero matches is itself an error — a wildcard that reaches nothing is a
 * typo magnet.
 *
 * @param rule - The container rule (for error messages and reconstruction).
 * @param members - Mutable copy of the container's members.
 * @param rest - Remaining path segments after the wildcard step.
 * @param patch - Patch value or function.
 * @param precStack - Accumulated prec wrappers.
 * @returns Reconstructed container with all matching members patched.
 * @throws {ApplyPathSkip} If the container is empty or no member accepted the patch.
 */
function applyWildcardToMembers(
    rule: RuntimeRule,
    members: RuntimeRule[],
    rest: readonly PathSegment[],
    patch: RuntimeRule | ((member: RuntimeRule, precStack?: readonly RuntimeRule[]) => RuntimeRule),
    precStack: readonly RuntimeRule[] | undefined,
): RuntimeRule {
    if (members.length === 0) {
        throw new ApplyPathSkip(`applyPath: wildcard matched zero members in empty ${rule.type}`)
    }
    let anyApplied = false
    for (let i = 0; i < members.length; i++) {
        try {
            members[i] = applyPath(members[i]!, rest, patch, precStack)
            anyApplied = true
        } catch (e) {
            if (e instanceof ApplyPathSkip) continue
            throw e
        }
    }
    if (!anyApplied) {
        throw new ApplyPathSkip(`applyPath: wildcard matched zero members successfully in ${rule.type} of length ${members.length}`)
    }
    return reconstructContainer(rule, members)
}
