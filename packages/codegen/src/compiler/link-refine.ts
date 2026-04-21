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
 * See ADR-0010 phase 2 for the full design.
 */

import type { Rule, ChoiceRule, FieldRule } from './rule.ts'
import { isChoice, isField, isString, isSeq, isOptional, isRepeat, isRepeat1 } from './rule.ts'
import type { RefineForm } from './types.ts'
import { parsePath, type PathSegment } from '../dsl/transform/transform-path.ts'

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
    readonly fieldName: string | undefined
    /** The resolved choice rule. */
    readonly choice: ChoiceRule
}

/**
 * Validate every refine form's paths and selections for one kind.
 * Throws on the first failure — codegen fails loud when a refine
 * declaration is inconsistent with the rule shape.
 *
 * @param kind - Rule kind being validated (used in error messages).
 * @param rule - Post-link rule tree for `kind`.
 * @param forms - Ordered list of refine forms declared for `kind`.
 */
export function validateRefineForms(
    kind: string,
    rule: Rule,
    forms: readonly RefineForm[],
): void {
    for (const form of forms) {
        for (const [pathStr, selection] of Object.entries(form.selections)) {
            const resolution = resolveRefinePath(kind, form.name, pathStr, rule)
            validateSelection(kind, form.name, pathStr, resolution.choice, selection)
        }
    }
}

/**
 * Resolve a refine() path against a rule tree to the target CHOICE.
 *
 * @param kind - Rule kind being validated (used in error messages).
 * @param formName - Refine form name (used in error messages).
 * @param pathStr - The path string as declared in the refine() call.
 * @param rule - Post-link rule tree for `kind`.
 * @returns A {@link RefinePathResolution} carrying the choice and the
 *   enclosing field name (when the terminal step was a `name:` segment).
 * @throws When the path doesn't resolve, or resolves to a non-choice.
 */
export function resolveRefinePath(
    kind: string,
    formName: string,
    pathStr: string,
    rule: Rule,
): RefinePathResolution {
    const segments = parsePath(pathStr)
    if (segments.length === 0) {
        throw new Error(
            `refine(${kind}) form '${formName}': path '${pathStr}' is empty`,
        )
    }
    let cur: Rule = rule
    let fieldName: string | undefined
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i]!
        const res = stepPath(cur, seg, kind, formName, pathStr)
        cur = res.next
        if (seg.kind === 'fieldName') fieldName = seg.name
    }
    const final = unwrapToChoice(cur)
    if (!final) {
        throw new Error(
            `refine(${kind}) form '${formName}': path '${pathStr}' does not resolve to a choice (got '${cur.type}')`,
        )
    }
    return { fieldName, choice: final }
}

/**
 * Advance one path segment. Handles positional index, wildcard (treated
 * as "the single wrapped content" for wrappers and the first member for
 * containers — refine paths should be deterministic, so wildcard isn't
 * really meaningful here but we accept it for symmetry), kind-match is
 * unsupported for refine paths, and `fieldName` descends through a
 * `field(name, ...)` wrapper.
 */
function stepPath(
    rule: Rule,
    seg: PathSegment,
    kind: string,
    formName: string,
    pathStr: string,
): { next: Rule } {
    switch (seg.kind) {
        case 'fieldName': {
            const target = findFieldByName(rule, seg.name)
            if (!target) {
                throw new Error(
                    `refine(${kind}) form '${formName}': path '${pathStr}' segment '${seg.name}:' does not match any field in rule (type '${rule.type}')`,
                )
            }
            return { next: target.content }
        }
        case 'index': {
            const members = membersOf(rule)
            if (!members) {
                throw new Error(
                    `refine(${kind}) form '${formName}': path '${pathStr}' segment '${seg.value}' cannot descend into '${rule.type}'`,
                )
            }
            const idx = seg.value < 0 ? members.length + seg.value : seg.value
            if (idx < 0 || idx >= members.length) {
                throw new Error(
                    `refine(${kind}) form '${formName}': path '${pathStr}' segment '${seg.value}' out of bounds for ${rule.type} (length ${members.length})`,
                )
            }
            return { next: members[idx]! }
        }
        case 'wildcard': {
            const members = membersOf(rule)
            if (members && members.length > 0) {
                return { next: members[0]! }
            }
            const content = singleContentOf(rule)
            if (content) return { next: content }
            throw new Error(
                `refine(${kind}) form '${formName}': path '${pathStr}' wildcard cannot descend into '${rule.type}'`,
            )
        }
        case 'kind-match':
            throw new Error(
                `refine(${kind}) form '${formName}': path '${pathStr}' uses kind-match '(${seg.name})' — refine paths only support positional indices and 'name:' field traversal`,
            )
    }
}

/**
 * Unwrap common single-content wrappers (optional, repeat, repeat1) to
 * reach an inner `choice`, returning `undefined` if the eventual node
 * isn't a choice. Refine's target is always a choice — the wrappers in
 * between are structurally transparent for selection purposes.
 */
function unwrapToChoice(rule: Rule): ChoiceRule | undefined {
    let cur = rule
    for (;;) {
        if (isChoice(cur)) return cur
        if (isOptional(cur) || isRepeat(cur) || isRepeat1(cur)) {
            cur = cur.content
            continue
        }
        return undefined
    }
}

/**
 * Walk a rule looking for a direct `field(fieldName, ...)` wrapper.
 * Descends through seq / optional / repeat / repeat1 to find the
 * field. Returns the first match (refine paths target one field per
 * segment; duplicate field names at the same level aren't meaningful).
 */
function findFieldByName(rule: Rule, fieldName: string): FieldRule | undefined {
    if (isField(rule)) return rule.name === fieldName ? rule : undefined
    if (isSeq(rule)) {
        for (const m of rule.members) {
            const hit = findFieldByName(m, fieldName)
            if (hit) return hit
        }
        return undefined
    }
    if (isOptional(rule) || isRepeat(rule) || isRepeat1(rule)) {
        return findFieldByName(rule.content, fieldName)
    }
    return undefined
}

/**
 * Validate one selection value against the target choice.
 *
 * @param kind - Rule kind (error-message context).
 * @param formName - Refine form name (error-message context).
 * @param pathStr - Path string (error-message context).
 * @param choice - The resolved choice rule.
 * @param selection - Declared selection: numeric branch index or string
 *   matching one of the choice's string branches.
 */
function validateSelection(
    kind: string,
    formName: string,
    pathStr: string,
    choice: ChoiceRule,
    selection: number | string,
): void {
    const arms = choice.members
    if (typeof selection === 'number') {
        if (selection < 0 || selection >= arms.length) {
            throw new Error(
                `refine(${kind}) form '${formName}': path '${pathStr}' selection index ${selection} out of range (choice has ${arms.length} branches)`,
            )
        }
        return
    }
    const stringValues = arms.filter(isString).map(s => s.value)
    if (!stringValues.includes(selection)) {
        throw new Error(
            `refine(${kind}) form '${formName}': path '${pathStr}' selection '${selection}' does not match any string branch of the choice (available: ${stringValues.map(v => `'${v}'`).join(', ') || '<none>'})`,
        )
    }
}

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
export function narrowedFieldLiteralsForForm(
    rule: Rule,
    form: RefineForm,
): Array<{ fieldName: string; literal: string }> {
    const out: Array<{ fieldName: string; literal: string }> = []
    for (const [pathStr, selection] of Object.entries(form.selections)) {
        let resolution: RefinePathResolution
        try {
            resolution = resolveRefinePath('<emit>', form.name, pathStr, rule)
        } catch {
            continue
        }
        if (!resolution.fieldName) continue
        const literal = resolveSelectionLiteral(resolution.choice, selection)
        if (literal === undefined) continue
        out.push({ fieldName: resolution.fieldName, literal })
    }
    return out
}

/**
 * Map a selection (numeric index or string) to the terminal string
 * value it selects. Returns `undefined` when the index points at a
 * non-string branch.
 */
export function resolveSelectionLiteral(
    choice: ChoiceRule,
    selection: number | string,
): string | undefined {
    if (typeof selection === 'string') return selection
    const arm = choice.members[selection]
    if (arm && isString(arm)) return arm.value
    return undefined
}

// ---------------------------------------------------------------------------
// Rule-shape helpers (localized — we don't want link-refine to grow into
// a general rule-walking utility; it's path-resolution only)
// ---------------------------------------------------------------------------

function membersOf(rule: Rule): Rule[] | undefined {
    if (rule.type === 'seq' || rule.type === 'choice') return rule.members
    return undefined
}

function singleContentOf(rule: Rule): Rule | undefined {
    switch (rule.type) {
        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'field':
        case 'variant':
        case 'clause':
        case 'group':
        case 'terminal':
            return rule.content
        default:
            return undefined
    }
}
