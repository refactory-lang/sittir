/**
 * dsl/transform-path.ts — path addressing for transform() patches.
 *
 * Path strings use forward-slash delimiters. Segment forms:
 *
 *   'N'         → positional index (0-based)
 *   '-N'        → reverse index from the end (-1 = last member)
 *   '_'         → wildcard — matches every sibling at this level
 *   '(name)'    → kind-match — finds every occurrence of symbol `name`
 *                 in the current subtree, skipping pre-fielded ones
 *   'name:'     → field traversal — descends through a field('name', ...)
 *                 wrapper at the current position (hard-errors on mismatch)
 *
 * Examples:
 *   '0'              → first position of the top-level seq
 *   '0/1/2'          → nested descent by positional indices
 *   '0/_/1'          → position 1 of every branch at level 1 under pos 0
 *   '(_expression)'  → every `_expression` symbol in the subtree
 *   '2/elements:'    → descend into field('elements', ...) at position 2
 *
 * Migration notes:
 *   '*' → '_'         (wildcard)
 *   'name' → '(name)' (kind-match)
 *
 * Rules:
 * - No leading slash (`/0` is invalid).
 * - No trailing slash.
 * - `_` wildcard matches a single level only — not recursive.
 * - Out-of-bounds paths and zero-match wildcards are hard errors at
 *   apply time (with the path + actual rule shape in the message).
 */
import { isPrecWrapper as isPrecWrapperShape, isContainerType, isWrapperType } from '../runtime-shapes.ts';
import type { RuntimeRule } from '../runtime-shapes.ts';
export type PathSegment = {
    kind: 'index';
    value: number;
} | {
    kind: 'wildcard';
} | {
    /**
     * Kind-based descent: match every symbol occurrence of `name`
     * in the current subtree. Skips occurrences already wrapped in
     * a named `field()` (reusing a target kind is almost always
     * unintended — the semi form's `field('length', _expression)`
     * must survive when the list form's `_expression` is patched).
     *
     * Syntax: `(name)` — parentheses are required.
     */
    kind: 'kind-match';
    name: string;
} | {
    /**
     * Field traversal: descend through a field('name', ...) wrapper
     * at the current rule position. Hard-errors if the current rule
     * is not a field wrapper or if the field name doesn't match.
     *
     * Syntax: `name:` — colon suffix.
     */
    kind: 'fieldName';
    name: string;
};
/**
 * Tagged error thrown by path-descent failure points (out-of-bounds
 * index, "cannot descend into primitive" etc). Wildcards catch only
 * this class — every other exception (TypeError, missing-global
 * errors from nativeRequired, bugs in reconstruction helpers, throws
 * from user-supplied patch functions) propagates so real bugs aren't
 * masked as "wildcard matched zero".
 */
export declare class ApplyPathSkip extends Error {
    constructor(message: string);
}
/**
 * Parse a path string into segments. Throws on malformed input.
 *
 * Segment forms:
 *   - `N`       — positional index (0-based)
 *   - `-N`      — reverse index from the end (`-1` = last member)
 *   - `_`       — wildcard: matches every sibling at this level
 *   - `(name)`  — kind-match: finds every occurrence of symbol `name`
 *                 in the current subtree, skipping pre-fielded ones.
 *                 Parentheses are required.
 *   - `name:`   — field traversal: descend through field('name', ...)
 *                 at the current position. Hard-errors on mismatch.
 *
 * Migration errors:
 *   - `*`       — use `_` instead
 *   - bare kind name — use `(name)` instead
 */
export declare function parsePath(pathStr: string): PathSegment[];
export declare function applyPath(rule: RuntimeRule, segments: readonly PathSegment[], patch: RuntimeRule | ((member: RuntimeRule, precStack?: readonly RuntimeRule[]) => RuntimeRule), precStack?: readonly RuntimeRule[]): RuntimeRule;
/**
 * Reconstruct a container rule (seq or choice) by calling the
 * runtime's native dsl function with the new members. Delegating to
 * native ensures the result has the correct rule-type case and
 * inherits any normalization the runtime applies.
 */
export declare function reconstructContainer(rule: RuntimeRule, members: RuntimeRule[]): RuntimeRule;
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
export declare function reconstructWrapper(rule: RuntimeRule, newContent: RuntimeRule): RuntimeRule;
export declare function reconstructPrec(rule: RuntimeRule, newContent: RuntimeRule): RuntimeRule;
/**
 * Wrap `content` in the accumulated prec stack collected during path
 * descent. Each entry in `precStack` is the original prec wrapper the
 * path crossed; we reapply them inner-first so the outer-most prec is
 * the outermost in the result.
 */
export declare function wrapInPrecStack(content: RuntimeRule, precStack: readonly RuntimeRule[] | undefined, reconstructPrec: (wrapper: RuntimeRule, newContent: RuntimeRule) => RuntimeRule): RuntimeRule;
export { isContainerType, isWrapperType, isPrecWrapperShape as isPrecWrapper };
//# sourceMappingURL=transform-path.d.ts.map