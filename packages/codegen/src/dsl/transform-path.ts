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

import { isPrecWrapper as isPrecWrapperShape, isContainerType, isWrapperType, type RuntimeRule } from './runtime-shapes.ts'

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

export type PathSegment = { kind: 'index'; value: number } | { kind: 'wildcard' }

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
        } else if (/^\d+$/.test(part)) {
            segments.push({ kind: 'index', value: Number(part) })
        } else {
            throw new Error(`parsePath: invalid segment '${part}' in path '${pathStr}' — must be a numeric index or '*'`)
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

    // Precedence wrappers are TRANSPARENT to path addressing. Sittir's
    // pipeline strips them; tree-sitter's CLI preserves them. Path
    // segments target the underlying structure, not the wrapper. We
    // descend into the wrapper without consuming a segment, and
    // reconstruct it on the way back so tree-sitter still sees the
    // precedence info. Accumulated prec wrappers are passed to the
    // patch callback so alias/variant hidden rules can inherit context.
    if (isPrecWrapperShape(rule)) {
        const newStack = precStack ? [...precStack, rule] : [rule]
        const newContent = applyPath(contentOf(rule), segments, patch, newStack)
        return reconstructPrec(rule, newContent)
    }

    const [head, ...rest] = segments
    const t = rule.type

    // Containers we can descend into — predicates in runtime-shapes.ts
    // accept both sittir lowercase and tree-sitter uppercase naming.
    if (isContainerType(t)) {
        return applyToMembers(rule, head!, rest, patch, precStack)
    }
    if (isWrapperType(t)) {
        // For wrappers, position 0 is the wrapped content.
        if (head!.kind === 'wildcard' || (head!.kind === 'index' && head!.value === 0)) {
            const newContent = applyPath(contentOf(rule), rest, patch, precStack)
            return reconstructWrapper(rule, newContent)
        }
        throw new ApplyPathSkip(
            `applyPath: index ${head!.kind === 'index' ? head!.value : '*'} out of bounds — '${rule.type}' wraps a single content rule (only index 0 is valid)`,
        )
    }

    throw new ApplyPathSkip(`applyPath: cannot descend into '${rule.type}' rule (path has ${segments.length} segments left)`)
}

/**
 * Reconstruct a container rule (seq or choice) by calling the
 * runtime's native dsl function with the new members. Delegating to
 * native ensures the result has the correct rule-type case and
 * inherits any normalization the runtime applies.
 */
export function reconstructContainer(rule: RuntimeRule, members: RuntimeRule[]): RuntimeRule {
    const t = rule.type
    if (t === 'seq' || t === 'SEQ') return nativeRequired('seq')(...members)
    if (t === 'choice' || t === 'CHOICE') return nativeRequired('choice')(...members)
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
        const r = rule as { separator?: unknown; leading?: unknown; trailing?: unknown }
        if (r.separator !== undefined || r.leading !== undefined || r.trailing !== undefined) {
            throw new Error(
                `reconstructWrapper: cannot path-address under a '${rule.type}' rule with separator/leading/trailing metadata — native repeat() can't round-trip those fields. Use flat positional transform or restructure the override.`,
            )
        }
        return nativeRequired(t === 'repeat' || t === 'REPEAT' ? 'repeat' : 'repeat1')(newContent)
    }
    if (t === 'field' || t === 'FIELD') {
        const name = (rule as unknown as { name: string }).name
        return nativeRequired('field')(name, newContent)
    }
    throw new Error(
        `reconstructWrapper: no native dsl reconstruction for wrapper type '${rule.type}' — this is a bug in the path-descent logic.`,
    )
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
        if (head.value < 0 || head.value >= members.length) {
            throw new ApplyPathSkip(
                `applyPath: index ${head.value} out of bounds in ${rule.type} of length ${members.length}`,
            )
        }
        members[head.value] = applyPath(members[head.value]!, rest, patch, precStack)
        return reconstructContainer(rule, members)
    }

    // Wildcard — apply to every member that can accept the remaining
    // path. Members that can't descend throw `ApplyPathSkip` which we
    // catch and skip; every OTHER exception (TypeError, missing-global
    // error, bug in reconstruction, throw from user-supplied patch
    // function) propagates so real bugs are never masked. Zero matches
    // is itself an error — a wildcard that reaches nothing is a typo
    // magnet.
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
