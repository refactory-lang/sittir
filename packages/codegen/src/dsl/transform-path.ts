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

import type {
    Rule, SeqRule, ChoiceRule, OptionalRule, RepeatRule, Repeat1Rule, FieldRule,
} from '../compiler/rule.ts'

// ---------------------------------------------------------------------------
// Native DSL accessors — we call the runtime-injected DSL functions
// (sittir's grammarFn-injected globals OR tree-sitter CLI's native
// globals) instead of reconstructing rule objects directly. This keeps
// the rule shape consistent with whichever runtime is processing the
// transform call, and runs whatever normalization the runtime does.
// ---------------------------------------------------------------------------

interface RuntimeDsl {
    seq?: (...members: unknown[]) => unknown
    choice?: (...members: unknown[]) => unknown
    optional?: (content: unknown) => unknown
    repeat?: (content: unknown) => unknown
    repeat1?: (content: unknown) => unknown
    field?: (name: string, content: unknown) => unknown
    prec?: ((value: number | unknown, content?: unknown) => unknown) & {
        left?: (value: number | unknown, content?: unknown) => unknown
        right?: (value: number | unknown, content?: unknown) => unknown
        dynamic?: (value: number | unknown, content?: unknown) => unknown
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
export function applyPath(
    rule: Rule,
    segments: readonly PathSegment[],
    patch: Rule | ((member: Rule) => Rule),
): Rule {
    if (segments.length === 0) {
        // Reached the target position — apply the patch.
        return typeof patch === 'function' ? patch(rule) : patch
    }

    // Precedence wrappers are TRANSPARENT to path addressing. Sittir's
    // pipeline strips them; tree-sitter's CLI preserves them. Path
    // segments target the underlying structure, not the wrapper. We
    // descend into the wrapper without consuming a segment, and
    // reconstruct it on the way back so tree-sitter still sees the
    // precedence info. Both lowercase (sittir) and uppercase
    // (tree-sitter native) variants are handled.
    if (isPrecWrapper(rule)) {
        const newContent = applyPath(
            (rule as { content: Rule }).content,
            segments,
            patch,
        )
        return reconstructPrec(rule, newContent)
    }

    const [head, ...rest] = segments
    const t = rule.type as string

    // Containers we can descend into. Type checks accept both sittir
    // (lowercase) and tree-sitter (uppercase) naming because tree-sitter
    // CLI runtime evaluates the bundled output with uppercase rule types.
    if (t === 'seq' || t === 'SEQ' || t === 'choice' || t === 'CHOICE') {
        return applyToMembers(rule as SeqRule | ChoiceRule, head!, rest, patch)
    }
    if (t === 'optional' || t === 'repeat' || t === 'repeat1' || t === 'field'
        || t === 'REPEAT' || t === 'REPEAT1' || t === 'FIELD' || t === 'BLANK'
        || t === 'IMMEDIATE_TOKEN' || t === 'TOKEN') {
        // For wrappers, position 0 is the wrapped content.
        if (head!.kind === 'wildcard' || (head!.kind === 'index' && head!.value === 0)) {
            const newContent = applyPath((rule as { content: Rule }).content, rest, patch)
            return reconstructWrapper(rule, newContent)
        }
        throw new Error(
            `applyPath: index ${head!.kind === 'index' ? head!.value : '*'} out of bounds — '${rule.type}' wraps a single content rule (only index 0 is valid)`,
        )
    }

    throw new Error(`applyPath: cannot descend into '${rule.type}' rule (path has ${segments.length} segments left)`)
}

/**
 * Reconstruct a container rule (seq or choice) by calling the
 * runtime's native dsl function with the new members. Delegating to
 * native ensures the result has the correct rule-type case and
 * inherits any normalization the runtime applies.
 */
export function reconstructContainer(rule: SeqRule | ChoiceRule, members: Rule[]): Rule {
    const t = rule.type as string
    if (t === 'seq' || t === 'SEQ') return nativeRequired('seq')(...members) as Rule
    if (t === 'choice' || t === 'CHOICE') return nativeRequired('choice')(...members) as Rule
    throw new Error(`reconstructContainer: unknown container type '${t}'`)
}

/**
 * Reconstruct a single-content wrapper rule (optional/repeat/repeat1/field)
 * via the runtime's native dsl. Field wrappers delegate to native field
 * which handles the (name, content) signature; repeat wrappers don't
 * preserve the separator/trailing/leading metadata in the native
 * call — applyPath should not be used to patch under repeat wrappers
 * with non-default options. (No current overrides hit that case.)
 */
export function reconstructWrapper(rule: Rule, newContent: Rule): Rule {
    const t = rule.type as string
    if (t === 'optional') return nativeRequired('optional')(newContent) as Rule
    if (t === 'repeat' || t === 'REPEAT') return nativeRequired('repeat')(newContent) as Rule
    if (t === 'repeat1' || t === 'REPEAT1') return nativeRequired('repeat1')(newContent) as Rule
    if (t === 'field' || t === 'FIELD') {
        const fld = rule as FieldRule
        return nativeRequired('field')(fld.name, newContent) as Rule
    }
    // BLANK / IMMEDIATE_TOKEN / TOKEN — fall through; these don't
    // normally have user-addressable content via path, but keep the
    // shape if we somehow descended into one.
    return { ...rule, content: newContent } as Rule
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

export function reconstructPrec(rule: Rule, newContent: Rule): Rule {
    const t = (rule.type as string).toLowerCase()
    const value = (rule as { value?: number | unknown }).value
    const prec = nativeRequired('prec')
    const variant = PREC_VARIANT_MAP[t as keyof typeof PREC_VARIANT_MAP]
    if (variant) {
        const fn = prec[variant]
        if (typeof fn !== 'function') throw new Error(`transform: native prec.${variant} not available`)
        return fn(value as number, newContent) as Rule
    }
    return prec(value as number, newContent) as Rule
}

export function isPrecWrapper(rule: Rule): boolean {
    const t = rule.type as string
    return t === 'prec' || t === 'PREC'
        || t === 'PREC_LEFT' || t === 'PREC_RIGHT' || t === 'PREC_DYNAMIC'
}

export function isContainerType(t: string): boolean {
    return t === 'seq' || t === 'SEQ' || t === 'choice' || t === 'CHOICE'
}

export function isWrapperType(t: string): boolean {
    return t === 'optional'
        || t === 'repeat' || t === 'REPEAT'
        || t === 'repeat1' || t === 'REPEAT1'
        || t === 'field' || t === 'FIELD'
        || t === 'TOKEN' || t === 'IMMEDIATE_TOKEN'
        || t === 'BLANK'
}

function applyToMembers(
    rule: SeqRule | ChoiceRule,
    head: PathSegment,
    rest: readonly PathSegment[],
    patch: Rule | ((member: Rule) => Rule),
): SeqRule | ChoiceRule {
    const members = [...rule.members]

    if (head.kind === 'index') {
        if (head.value < 0 || head.value >= members.length) {
            throw new Error(
                `applyPath: index ${head.value} out of bounds in ${rule.type} of length ${members.length}`,
            )
        }
        members[head.value] = applyPath(members[head.value]!, rest, patch)
        return reconstructContainer(rule, members) as SeqRule | ChoiceRule
    }

    // Wildcard — apply to every member that successfully descends. A
    // member that fails to descend (rest is empty AND patch can replace
    // it) is allowed; a member that THROWS is the only failure case.
    // Zero matches is itself an error: a wildcard that matches nothing
    // is a typo magnet.
    if (members.length === 0) {
        throw new Error(`applyPath: wildcard matched zero members in empty ${rule.type}`)
    }
    let anyApplied = false
    for (let i = 0; i < members.length; i++) {
        try {
            members[i] = applyPath(members[i]!, rest, patch)
            anyApplied = true
        } catch {
            // Member couldn't accept the path — skip it for wildcard semantics.
        }
    }
    if (!anyApplied) {
        throw new Error(`applyPath: wildcard matched zero members successfully in ${rule.type} of length ${members.length}`)
    }
    return reconstructContainer(rule, members) as SeqRule | ChoiceRule
}
