/**
 * compiler/common.ts — utilities shared across multiple pipeline
 * phases and downstream emitters.
 *
 * Anything exported here is consumed by two or more sibling modules
 * from different layers (compiler phase + emitter, or two distinct
 * phases).  A helper that is only used by one other file stays in
 * that file; a helper that is used everywhere lives here.
 */
import type { Rule } from './rule.ts';
/**
 * Compile the grammar's `word` rule into a full-match RegExp so
 * emitters can check whether an arbitrary string matches the
 * grammar's identifier shape (e.g. "does `match` look like an
 * identifier under python's soft-keyword rules?").
 *
 * Returns `undefined` when:
 * - `word` is null / missing / not a known rule name.
 * - The rule's tree references shapes the walker doesn't
 *   understand (e.g. a symbol ref into another rule). Callers
 *   fall back to a generic `/^\w+$/` heuristic in that case.
 *
 * @remarks
 *   First tries the `u` flag (needed for `\p{...}` property
 *   escapes); if that fails, retries flag-less so older grammars
 *   keep working.
 */
export declare function compileWordMatcher(word: string | null | undefined, rules: Record<string, Rule>): RegExp | undefined;
//# sourceMappingURL=common.d.ts.map