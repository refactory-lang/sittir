/**
 * validate-template-coverage — every tree-sitter field declared on a kind
 * must be referenced somewhere in that kind's render template.
 *
 * Closes the gap between `validate-renderable` (which only checks that a
 * rule *exists*) and `validate-roundtrip` (which catches missing fields
 * indirectly, and only when the corpus happens to exercise the
 * field-bearing variant). This validator is a pure structural check:
 *
 *   For every kind K with declared fields [f1, f2, ...]:
 *     For every field fi:
 *       template(K) must contain `$FI` OR `$$$FI` OR
 *       must contain `$FI_CLAUSE` and rule(K) must define `fi_clause`
 *
 * Supertype kinds are skipped (no direct render path). Pure-leaf kinds
 * are skipped (no template). Kinds without a declared field set are
 * skipped. Variant-bearing rules are checked per-variant — a field
 * declared on the kind must appear in *every* variant template (or be
 * absorbed by that variant's clause keys).
 *
 * Literal-leak heuristic: a template containing doubled punctuation
 * runs like `////`, `&&&&`, `||||`, `;;;;` is almost always a walker
 * concat bug (the walker emitted two literal copies of a separator
 * because it recursed into both sides of a choice). These are flagged
 * as warnings — they don't block, but they surface the defect near
 * its source.
 */
export interface TemplateCoverageResult {
    grammar: string;
    total: number;
    /** Kinds where every declared field is reachable in the template. */
    pass: number;
    /** Kinds with at least one unreferenced field. */
    fail: number;
    issues: CoverageIssue[];
}
export interface CoverageIssue {
    kind: string;
    /** 'missing-field' (field declared, not referenced) or 'literal-leak' (doubled separator). */
    type: 'missing-field' | 'literal-leak';
    /** Human-readable description. */
    message: string;
}
export declare function validateTemplateCoverage(grammar: string, templatesPath: string): TemplateCoverageResult;
//# sourceMappingURL=template-coverage.d.ts.map