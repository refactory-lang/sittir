/**
 * dsl/primitives/refine.ts — declare correlated choice selections
 * across non-adjacent positions as named forms.
 *
 * Authoring-only primitive: produces codegen metadata via the active
 * wire context; the rule tree is unchanged. Tree-sitter parses using
 * the original shape.
 *
 * Use case: a rule whose choice positions are correlated — picking one
 * alternative in position A implies picking a specific alternative in
 * position B. TypeScript's `interface_body` is the motivating example:
 *
 *     interface_body: ($, original) => refine(original, {
 *         curly: { 'opening:': '{',  'closing:': '}'  },
 *         flow:  { 'opening:': '{|', 'closing:': '|}' },
 *     }),
 *
 * Read as: "`curly` form selects `{` at the `opening` field and `}` at
 * the `closing` field; `flow` form selects `{|` and `|}`." Each outer
 * key names a form; each inner key is a path to a choice node; each
 * inner value picks one branch (numeric index or literal-matching
 * string).
 *
 * Codegen emits per-form namespace-keyed factories — `ir.interfaceBody
 * .curly(config)`, `ir.interfaceBody.flow(config)` — with narrowed
 * Config types for the refined positions. Phase 1's auto-stamp rule
 * then collapses the now-single-literal fields to absent Config keys,
 * so callers don't restate the literals that were implied by the form.
 *
 * The bare call `ir.interfaceBody(config)` routes to the
 * **first-declared** form. Authors order entries so the common case
 * comes first.
 *
 * Round-trip: readNode output and refine-factory output produce
 * identical NodeData shapes — no `$variant` tag, no discriminator.
 * Consumers that need "which form is this?" inspect
 * `$fields.opening` (or any refined position) directly. See ADR-0010.
 *
 * @see packages/codegen/src/dsl/wire/wire.ts — WireContext.refineForms
 */

import type { RuntimeRule } from '../runtime-shapes.ts'
import { wireGetCurrentRuleKind, wireRegisterRefineForms, type RefineForm } from '../wire/wire.ts'

/** `{ formName → { path → branchIndex | literal } }`. */
export type FormMap = Record<string, Record<string, number | string>>

/**
 * Declare per-form choice selections for the current rule.
 *
 * Returns the rule unchanged structurally — the codegen metadata is
 * deposited into the active wire context. Validation (path resolves
 * to a choice, selection picks a valid arm) runs at codegen time, not
 * here: authoring-time paths may address positions that enrich or
 * transform will still modify before codegen reads them.
 *
 * @throws {Error} If called outside a wire() context.
 * @throws {Error} If a form name is duplicated within the same call.
 */
export function refine(original: RuntimeRule, forms: FormMap): RuntimeRule {
    const kind = wireGetCurrentRuleKind()
    if (!kind) {
        throw new Error(
            'refine(): no active wire context — refine() must run inside a rule callback under wire()',
        )
    }
    const formList: RefineForm[] = []
    for (const [name, selections] of Object.entries(forms)) {
        if (formList.some(f => f.name === name)) {
            throw new Error(`refine(): duplicate form name '${name}' on rule '${kind}'`)
        }
        formList.push({ name, selections: { ...selections } })
    }
    if (!wireRegisterRefineForms(kind, formList)) {
        throw new Error('refine(): wire context rejected registration — unexpected')
    }
    return original
}
