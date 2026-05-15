/**
 * compiler/link.ts — Link phase.
 *
 * Resolves what nodes ARE.
 * After Link: no symbol, alias, token. `repeat1` is preserved — see rule.ts header.
 * Terminals (string, pattern) and structural whitespace (indent, dedent, newline) survive.
 * All field nodes enriched with provenance. Clauses detected.
 *
 * Link does NOT restructure the tree — shape identical before and after.
 * Link does NOT process overrides — already applied by Evaluate.
 */
import type { Rule, SymbolRef, ChoiceRule } from './rule.ts';
import { type GeneratedIdTables } from './generated-metadata.ts';
import type { RawGrammar, LinkedGrammar, IncludeFilter, DerivationLog } from './types.ts';
import type { PolymorphVariant } from './types.ts';
export declare function link(raw: RawGrammar, include?: IncludeFilter, generatedIdTables?: GeneratedIdTables): LinkedGrammar;
export declare function wrapVariants(choice: Rule): Rule;
export declare function deduplicateVariants(variants: Rule[]): Rule[];
export declare function nameVariant(variant: Rule, index: number, _all: Rule[]): string;
export declare function promotePolymorph(rule: Rule): Rule;
export interface VariantChoiceLocation {
    choice: ChoiceRule;
    /** Members of the outer seq that appear before the choice. */
    prefix: Rule[];
    /** Members of the outer seq that appear after the choice. */
    suffix: Rule[];
}
export declare function applyOverridePolymorphs(rules: Record<string, Rule>, variants: PolymorphVariant[], derivations: DerivationLog): void;
export declare function findVariantChoice(rule: Rule): VariantChoiceLocation | null;
/**
 * Find a polymorph-candidate choice in a rule that does NOT already have
 * `variant()` markers. Used to suggest NEW polymorphs where a grammar
 * author could reasonably apply `variant()` to each arm. The candidate is
 * strictly more permissive than `findVariantChoice` — it sees raw choices
 * inside field wrappers too, because `field(X, choice(A, B, C))` with
 * structurally-distinct branches is the textbook miss-case (e.g. python's
 * `import_from_statement`).
 *
 * The returned `prefix` / `suffix` capture members from the enclosing seq
 * that should travel with each form; the `fieldWrapper` (if set) is the
 * outer `field(...)` node the choice is nested in — callers that rewrite
 * the rule need to know to strip or repurpose that wrapper.
 */
export interface PolymorphCandidateLocation {
    choice: ChoiceRule;
    prefix: Rule[];
    suffix: Rule[];
    /** When the choice is wrapped in `field(name, choice(...))`, the outer field name. */
    fieldWrapperName?: string;
    /** Path from the rule root to the choice, expressed as seq-member indices. */
    path: string;
}
/**
 * Find every polymorph candidate in a rule. A single rule can have
 * multiple qualifying choices — e.g. python's `import_from_statement`
 * has `module_name` (relative vs dotted) AND `wildcard_import` (wildcard
 * vs list vs paren). The suggester emits one `variant()` snippet per
 * candidate; the grammar author picks which ones to promote.
 *
 * Descends through:
 *   - Nested `seq` — common after prec wrappers get stripped by
 *     `evaluate.normalize`. Rust `function_type` is the textbook case:
 *     the author writes `prec(PREC.call, seq(choice(...), field('parameters',
 *     ...)))`, the prec is stripped, and the inner seq surfaces as a
 *     member of the outer seq.
 *   - `field(X, choice(...))` wrappers — since `tagVariants` auto-wraps
 *     vs "auto-tagged" can't be recovered by inspecting the choice alone.
 *
 * Path reflects how `applyPath` in transform-path.ts consumes segments:
 * one per seq-member descent; field wrappers are consumed (their content
 * takes the next segment); prec wrappers are transparent.
 */
export declare function findAllPolymorphCandidates(rule: Rule): PolymorphCandidateLocation[];
export declare function tokenToName(token: string): string;
export declare function enrichPositions(rules: Record<string, Rule>, refs: SymbolRef[]): void;
export declare function computeParentSets(refs: SymbolRef[]): Map<string, SymbolRef[]>;
//# sourceMappingURL=link.d.ts.map