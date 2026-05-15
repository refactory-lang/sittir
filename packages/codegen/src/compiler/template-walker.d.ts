/**
 * compiler/template-walker.ts — turn a Rule subtree into a template
 * string plus any clause sub-templates.
 *
 * Consumed by both:
 * - `compiler/node-map.ts` — `AssembledBranch.renderTemplate()` and
 *   sibling helpers call {@link renderRuleTemplate} to produce the
 *   `{ template, clauses, joinByField }` triple stored on the node model.
 * - `emitters/templates.ts` — the YAML emitter reads the same triple
 *   when serialising per-rule entries into `templates directory`.
 *
 * The walker only consumes the Rule model — it has no coupling to
 * AssembledNode. That keeps the template surface pure-rule-driven:
 * change how a rule is classified, the template stays; change how
 * a rule is shaped, the template follows.
 *
 * Notable hooks callers rely on:
 * - {@link WalkResult.clauses} — sub-templates keyed by
 *   `<fieldName>_clause`; render drops the whole clause when the
 *   referenced field is absent (e.g. python `return_type_clause:
 *   -> $RETURN_TYPE`).
 * - {@link WalkResult.joinByField} — per-field separator captured
 *   from `field('x', repeat(y, separator=','))` so a rule with
 *   multiple multi-valued fields can use different separators
 *   (rust tuple_expression joins `attributes` by `\n` and `rest`
 *   by `,`).
 * - {@link findRepeatSeparator} / {@link findRepeatFlag} — cheap
 *   predicates the templates emitter uses to attach rule-level
 *   `joinBy` / `joinByTrailing` / `joinByLeading` metadata.
 */
import type { Rule } from './rule.ts';
interface WalkResult {
    template: string;
    clauses: Record<string, string>;
    /**
     * Per-field-name separator captured from `field('x', repeat(y, separator=','))`
     * patterns. The template emitter merges these into the rule entry as
     * `joinByField: { x: ',' }` so the renderer can pick the right join
     * for each `$$$X` slot when a single rule has multiple multi-valued
     * fields with different separators (e.g. rust's tuple_expression has
     * `attributes` joined by newline and `rest` joined by comma).
     */
    joinByField: Record<string, string>;
    /** True when the walk emitted the aggregate `$$$CHILDREN` placeholder. */
    usesChildren: boolean;
    /** Named slot usage derived directly from the rule walk output. */
    slots: readonly WalkSlotUse[];
}
export interface WalkSlotUse {
    readonly name: string;
    readonly view: 'scalar' | 'list' | 'field';
    readonly guarded: boolean;
}
export declare function renderRuleTemplate(rule: Rule, inRepeat?: boolean, rules?: Record<string, Rule>, wordMatcher?: RegExp, optionalFields?: ReadonlySet<string>): WalkResult;
export declare function deriveWalkSlots(template: string): readonly WalkSlotUse[];
/**
 * Walk a rule tree looking for the first repeat-with-separator. Used by
 * structural nodes to propagate tree-sitter's `sepBy` / `repSeq`
 * separator hints onto their joinBy slot so `$$$CHILDREN` renders
 * with the right glue.
 */
export declare function findRepeatSeparator(rule: Rule): string | undefined;
/**
 * Does `rule` contain a repeat/repeat1 that declares the given flag?
 *
 * `trailing: true` marks `sepBy` shapes where the final separator is
 * optional (e.g. rust's `{ a, b, }`). `leading: true` marks the
 * mirror shape `sep, x, (sep x)*` (rust's or_pattern `| a | b`, if
 * written as a single repeat). Evaluate's `liftCommaSep` captures
 * both from their canonical seq patterns. Render reads each flag via
 * the `joinByTrailing` / `joinByLeading` template hints to know
 * whether to probe for a flanking anon-separator token when emitting
 * `$$$CHILDREN`.
 *
 * Walks the same transparent-wrapper set as `findRepeatSeparator`
 * (seq / choice / optional / variant / clause / group / field).
 */
export declare function findRepeatFlag(rule: Rule, flag: 'trailing' | 'leading'): boolean;
/**
 * Collect the names of named fields whose content contains a `repeat` /
 * `repeat1` with the given flag (`trailing` or `leading`). Returns a
 * `Set<string>` of field names — empty when no such field is found.
 *
 * Used by the template emitter to build a per-field trailing-separator
 * set so `filterForFlanks` can restrict `joinWithTrailing` to the
 * specific fields whose repeats carry the flag, rather than applying it
 * globally whenever the whole rule has any trailing repeat.
 */
export declare function findFieldsWithRepeatFlag(rule: Rule, flag: 'trailing' | 'leading'): Set<string>;
export {};
//# sourceMappingURL=template-walker.d.ts.map