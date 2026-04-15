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

    const [head, ...rest] = segments

    // Containers we can descend into. Each has a `members` array
    // (seq/choice) or a `content` rule (optional/repeat/repeat1/field).
    if (rule.type === 'seq' || rule.type === 'choice') {
        return applyToMembers(rule, head!, rest, patch)
    }
    if (rule.type === 'optional' || rule.type === 'repeat' || rule.type === 'repeat1' || rule.type === 'field') {
        // For wrappers, position 0 is the wrapped content.
        if (head!.kind === 'wildcard' || (head!.kind === 'index' && head!.value === 0)) {
            const newContent = applyPath((rule as { content: Rule }).content, rest, patch)
            return { ...rule, content: newContent } as Rule
        }
        throw new Error(
            `applyPath: index ${head!.kind === 'index' ? head!.value : '*'} out of bounds — '${rule.type}' wraps a single content rule (only index 0 is valid)`,
        )
    }

    throw new Error(`applyPath: cannot descend into '${rule.type}' rule (path has ${segments.length} segments left)`)
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
        return { type: rule.type, members } as SeqRule | ChoiceRule
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
    return { type: rule.type, members } as SeqRule | ChoiceRule
}
