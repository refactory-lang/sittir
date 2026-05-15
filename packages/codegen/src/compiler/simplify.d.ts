/**
 * compiler/simplify.ts — derivation-only view of a rule tree.
 *
 * Strips anonymous token delimiters, collapses single-member wrappers,
 * and normalizes idempotent nestings so downstream walkers
 * (`deriveFields`, `deriveChildren`, separator discovery) see a
 * semantic-only view of each rule. Template emission continues to
 * read the raw rule — literals still need to surface as template
 * text.
 *
 * "Keyword-shaped" string detection is driven by the grammar's own
 * `word` rule — the lexer production that tree-sitter uses to
 * recognize words at parse time. Strings whose text matches the
 * grammar's word pattern are preserved (they carry lexical identity
 * the downstream paths key on); strings that don't (punctuation,
 * operators, delimiters) are stripped. When the grammar has no
 * `word` declaration, fall back to `/^\w+$/` as a generic heuristic.
 *
 * Preserves metadata that carries derivation meaning:
 *   - `optional` wrapper around non-vanishing content (required/optional flag)
 *   - `repeat` / `repeat1` separator / leading / trailing
 *   - `field` / `group` / `variant` / `clause` names
 *
 * Elides shapes that contribute nothing to derivation:
 *   - Anonymous-string members inside seqs
 *   - Empty-seq sentinels (from collapsed optional wrappers)
 *   - `optional(anonymous-string)` hints
 *   - Single-member seqs / choices
 *
 * Runs as a dedicated pipeline stage at the end of `optimize()` and
 * produces a full `simplifiedRules` map on `OptimizedGrammar`.
 */
import type { Rule, RepeatRule, Repeat1Rule } from './rule.ts';
export declare function simplifyRule(rule: Rule, wordMatcher?: RegExp, inField?: boolean): Rule;
/**
 * Simplify every rule in an OptimizedGrammar's rules map.
 *
 * Pipeline per rule:
 *   1. `simplifyRule` — strip anon delimiters, collapse single-member
 *      wrappers (legacy behavior).
 *   2. `canonicalize` — merge structurally-equivalent choice branches
 *      so same-named fields across branches fuse into a single
 *      `field(name, choice(v1, v2, …))`. Closes the root cause of
 *      `BinaryExpression.operator: AutoStamp<"&&">`-style bugs where
 *      derivation walked an uncanonical tree and silently dropped
 *      duplicate-named field occurrences across choice branches.
 */
export declare function simplifyRules(rules: Record<string, Rule>, wordMatcher?: RegExp): Record<string, Rule>;
/**
 * Drop an outer `field('outer', ...)` wrapper when its content contains
 * an inner `field()` at exposable depth. Tree-sitter flattens nested
 * field paths, so the inner field IS a top-level field of the parent
 * kind -- keeping the outer wrapper makes the template walker miss it.
 *
 * @remarks
 * Bails when: content is a bare field (handled by hoistField...), no
 * inner field at exposable depth, or a named-symbol sibling would lose
 * its label from the outer field.
 */
export declare function hoistInnerFieldOutOfFieldWrapper(rule: Rule): Rule;
/**
 * Bottom-up inner-field hoist for template emission. Preserves all
 * literals and structure; only drops outer field wrappers with exposable
 * inner fields. Idempotent.
 */
export declare function hoistInnerFieldsForTemplate(rule: Rule): Rule;
/**
 * Inline hidden GROUP and MULTI symbol references by substituting
 * their content. Matches tree-sitter's parse-time inlining of hidden
 * seq-with-fields helpers. Cycle-safe via visited set.
 */
export declare function inlineGroupRefs(rule: Rule, rules: Readonly<Record<string, Rule>>, visited?: ReadonlySet<string>): Rule;
/**
 * Unwrap structural wrappers around a repeat / repeat1 so the caller
 * can detect `optional(repeat(...))`, `group(repeat1(...))`, etc.
 * Returns `null` for anything that isn't ultimately a repeat shape.
 */
export declare function extractRepeatShape(rule: Rule): {
    repeat: RepeatRule | Repeat1Rule;
    nonEmpty: boolean;
} | null;
//# sourceMappingURL=simplify.d.ts.map