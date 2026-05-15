/**
 * compiler/link-refine.ts — validate `refine()` metadata against the
 * linked rule tree.
 *
 * `refine(original, { formName: { 'path:': selection } })` registers
 * per-form choice selections at authoring time. At that call time the
 * rule tree may still be mid-transform (enrich may not have fired, patch
 * callbacks may not have applied), so validation is deferred to Link.
 *
 * Link-time validation verifies:
 *   1. Every path resolves to a CHOICE rule node (possibly via field()
 *      descent for `name:` segments).
 *   2. Every selection is either a valid branch index for that choice,
 *      or a string matching one of the choice's string branches.
 *
 * See refine() DSL primitive for the full design.
 */
import type { Rule, ChoiceRule, EnumRule } from './rule.ts';
import type { RefineForm } from './types.ts';
/**
 * The result of resolving a refine() path against a rule tree. Carries
 * both the containing field name (when the terminal choice lives inside
 * a field wrapper) and the choice itself so emitters can narrow the
 * field's literal values per form.
 */
export interface RefinePathResolution {
    /** The field name whose content resolves to the choice, when the
     *  path descent crossed a `field(name, ...)` wrapper. `undefined`
     *  when the choice is at the rule root or inside a non-field
     *  wrapper (refine currently only supports the field-wrapping
     *  case, but we keep this optional so future non-field refinement
     *  sites don't need a schema change). */
    readonly fieldName: string | undefined;
    /** The resolved choice rule — either a `ChoiceRule` or an `EnumRule`
     *  (the normalized choice-of-strings). Both expose `members`, so
     *  consumers that walk them uniformly work without adapting. */
    readonly choice: ChoiceRule | EnumRule;
}
/**
 * Validate every refine form's paths and selections for one kind.
 * Throws on the first failure — codegen fails loud when a refine
 * declaration is inconsistent with the rule shape.
 *
 * @param kind - Rule kind being validated (used in error messages).
 * @param rule - Post-link rule tree for `kind`.
 * @param forms - Ordered list of refine forms declared for `kind`.
 * @param rules - Optional rules map for resolving symbol references
 *   introduced by evaluate's field-enum synthesis pass. When a path
 *   terminus resolves to a `SymbolRule`, the target rule is looked up
 *   here to retrieve the underlying `EnumRule`.
 */
export declare function validateRefineForms(kind: string, rule: Rule, forms: readonly RefineForm[], rules?: Readonly<Record<string, Rule>>): void;
/**
 * Resolve a refine() path against a rule tree to the target CHOICE.
 *
 * @param kind - Rule kind being validated (used in error messages).
 * @param formName - Refine form name (used in error messages).
 * @param pathStr - The path string as declared in the refine() call.
 * @param rule - Post-link rule tree for `kind`.
 * @param rules - Optional rules map for resolving symbol references
 *   introduced by evaluate's field-enum synthesis pass.
 * @returns A {@link RefinePathResolution} carrying the choice and the
 *   enclosing field name (when the terminal step was a `name:` segment).
 * @throws When the path doesn't resolve, or resolves to a non-choice.
 */
export declare function resolveRefinePath(kind: string, formName: string, pathStr: string, rule: Rule, rules?: Readonly<Record<string, Rule>>): RefinePathResolution;
/**
 * Given a rule tree and a resolved refine form, return the field name
 * whose single literal value should be narrowed for per-form Config
 * emission, along with the narrowed literal.
 *
 * Used by the type/factory emitters to build the per-form narrowed
 * fields. Returns an array because a form may narrow multiple selections
 * (e.g. `opening` and `closing` simultaneously).
 *
 * @returns Array of `{ fieldName, literal }` tuples. `fieldName` is the
 *   enclosing field (when the selection targets a field-wrapped choice)
 *   and `literal` is the chosen string value. Entries whose selection
 *   can't be resolved to a string (e.g. numeric selection into a
 *   non-string branch) are omitted — those forms still narrow the
 *   choice shape at parse time but don't qualify for auto-stamp.
 */
export declare function narrowedFieldLiteralsForForm(rule: Rule, form: RefineForm, rules?: Readonly<Record<string, Rule>>): Array<{
    fieldName: string;
    literal: string;
}>;
/**
 * Map a selection (numeric index or string) to the terminal string
 * value it selects. Returns `undefined` when the index points at a
 * non-string branch.
 */
export declare function resolveSelectionLiteral(choice: ChoiceRule | EnumRule, selection: number | string): string | undefined;
//# sourceMappingURL=link-refine.d.ts.map