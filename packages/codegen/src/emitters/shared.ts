/**
 * Shared helpers used across emitters. Kept small — the goal is to dedupe
 * patterns that copy-paste across 3+ emitters, not to become a grab-bag.
 */

import type { NodeMap } from '../compiler/types.ts'
import type { AssembledField, AssembledChild } from '../compiler/node-map.ts'
import { AssembledKeyword } from '../compiler/node-map.ts'

/** TypeScript identifier pattern — starts with letter/underscore/dollar,
 * continues with word chars or dollar. Used by emitters to decide whether
 * a kind name can be emitted as a bare identifier vs. a quoted literal. */
const IDENT_RE = /^[A-Za-z_$][\w$]*$/

/** True when `s` is a valid unquoted TypeScript identifier. */
export function isValidIdent(s: string): boolean {
    return IDENT_RE.test(s)
}

/** If `name` is a valid identifier, return `name`. Otherwise return its
 * JSON-quoted form — suitable for emission inside union / indexed-access
 * type positions where a non-identifier key would otherwise be a syntax
 * error. */
export function identOrQuoted(name: string): string {
    return IDENT_RE.test(name) ? name : JSON.stringify(name)
}

/**
 * Resolve a field's effective single-literal value, if any.
 *
 * A field qualifies for auto-stamp when ALL of the following hold:
 *   - It is **required** (`required: true`) — optional fields may be
 *     absent from a given parse and must remain user-controllable.
 *   - It is **not repeated** (`multiple: false`) — repeated fields
 *     represent 0..N occurrences with variable cardinality.
 *   - Its *effective* resolved type is exactly one string literal.
 *
 * Two sources of "single string literal" are recognised:
 *
 * - **Source A — inline literal**: `field.literalValues.length === 1`.
 *   The field's assembled content is a bare STRING or a choice-of-one-
 *   string. The literal value is the single entry in `literalValues`.
 *
 * - **Source B — referenced keyword kind**: `field.contentTypes.length === 1`
 *   and the referenced kind is an `AssembledKeyword` (a hidden rule whose
 *   body is a single word-like string, such as `_kw_async: $ => 'async'`).
 *   The literal value comes from `AssembledKeyword.text`.
 *
 * Returns `undefined` when the field is optional, is repeated, has
 * multiple possible values, or the referenced kind is not a single-
 * literal terminal.
 *
 * @remarks
 * Phase 1 (ADR-0010): omit auto-stamp-eligible fields from Config input
 * and stamp the constant directly in factory output.  The field stays in
 * the `$fields` block of the concrete TypeScript interface so NodeData
 * output shape is unchanged and round-trips with readNode remain identical.
 */
export function resolveEffectiveLiteral(
    field: AssembledField,
    nodeMap: NodeMap,
): string | undefined {
    // Only required fields are auto-stamped — optional fields control
    // whether a keyword is present at all, which must remain user choice.
    if (!field.required) return undefined

    // Repeated fields are never auto-stamped — they represent 0..N occurrences.
    if (field.multiple) return undefined

    // Source A: inline literal (choice-of-one-string or bare STRING field)
    if (field.literalValues?.length === 1) return field.literalValues[0]

    // Source B: field references a single hidden keyword kind (`_kw_*` pattern).
    // Restricted to hidden kinds (name starts with `_`) to avoid false-positives
    // from visible keyword nodes that may appear inside mixed-choice overrides
    // (e.g. pointer_type's `choice('const', $.mutable_specifier)` where the
    // string alternative is silently dropped from contentTypes).
    if (field.contentTypes.length === 1) {
        const kindName = field.contentTypes[0]!
        if (kindName.startsWith('_')) {
            const ref = nodeMap.nodes.get(kindName)
            if (ref instanceof AssembledKeyword) return ref.text
        }
    }

    return undefined
}

/**
 * Returns `true` when `resolveEffectiveLiteral` would return a value —
 * i.e., the field is auto-stamp-eligible per ADR-0010 phase 1.
 */
export function isAutoStampField(field: AssembledField, nodeMap: NodeMap): boolean {
    return resolveEffectiveLiteral(field, nodeMap) !== undefined
}

// ---------------------------------------------------------------------------
// Generic slot helpers (ADR-0010 Task 1.5) — work on AssembledChild (the base
// shared by both AssembledField and the plain child slot descriptors).
// ---------------------------------------------------------------------------

/**
 * Returns `true` when `slot` is auto-stamp-eligible.
 *
 * A slot is eligible when:
 * - Optional (`required: false`) — user can omit it; it does not block
 *   parameterless classification of the parent compound.
 * - Required, non-repeated, and its content is fixed:
 *   (a) Inline literal: `(slot as AssembledField).literalValues.length === 1`
 *   (b) Single content-type that is itself marked `isParameterless` on its
 *       `AssembledNode` (populated by the `markParameterlessKinds` pass in
 *       `assemble.ts`). The legacy Source B (hidden-keyword kind check) is
 *       superseded by this: keywords are the first nodes marked by the pass.
 *
 * Required repeated slots are never auto-stamp-eligible — their cardinality
 * is user-determined.
 *
 * @remarks
 * This function works on any `AssembledChild` (base type), meaning it
 * applies equally to fields and children. The `isParameterless` property
 * on `AssembledNodeBase` must already be populated before calling this.
 */
export function isAutoStampSlot(slot: AssembledChild, nodeMap: NodeMap): boolean {
    if (!slot.required) return true     // optional → does not block
    if (slot.multiple) return false    // required repeated → user must supply

    // Source A: inline literal (AssembledField only, but safe to check on any slot)
    const asField = slot as AssembledField
    if (asField.literalValues?.length === 1) return true

    // Source B/C: single content-type that is parameterless (set by fixpoint pass)
    if (slot.contentTypes.length === 1) {
        const ref = nodeMap.nodes.get(slot.contentTypes[0]!)
        if (ref?.isParameterless) return true
    }

    // Legacy Source B fallback: hidden keyword kind (preserves pre-fixpoint behaviour
    // for cases where the fixpoint was not yet run or the slot is a bare field reference
    // to a hidden `_kw_*` kind that predates `isParameterless`).
    if (slot.contentTypes.length === 1) {
        const kindName = slot.contentTypes[0]!
        if (kindName.startsWith('_')) {
            const ref = nodeMap.nodes.get(kindName)
            if (ref instanceof AssembledKeyword) return true
        }
    }

    return false
}

/**
 * Build the TypeScript stamp expression for an auto-stamp-eligible REQUIRED slot.
 *
 * Returns `undefined` when:
 * - The slot is optional (no stamp needed — omit the key from the factory call).
 * - The slot is not auto-stamp-eligible.
 *
 * Two expression shapes:
 * - **Inline literal** (`literalValues.length === 1`): `JSON.stringify(value) + " as const"`
 * - **Referenced keyword** (legacy Source B, `AssembledKeyword`): NodeData object literal
 *   `{ $type: '...', $text: '...', $source: 'factory' as const, $named: true as const }`
 * - **Referenced parameterless compound** (Source C): factory call expression from
 *   `ref.stampExpression` — e.g. `"breakExpression()"`.
 *
 * @remarks
 * This function replaces the field-only `autoStampExpression()` inside factories.ts
 * for the general case. The factories.ts private function is kept as-is for backwards
 * compat; this helper is the authoritative version for emitters that need to handle
 * children slots too.
 */
export function stampExpressionFor(slot: AssembledChild, nodeMap: NodeMap): string | undefined {
    if (!slot.required) return undefined  // optional — no stamp

    if (slot.multiple) return undefined   // repeated — no stamp

    // Source A: inline literal
    const asField = slot as AssembledField
    if (asField.literalValues?.length === 1) {
        return `${JSON.stringify(asField.literalValues[0])} as const`
    }

    // Source B/C: single referenced kind
    if (slot.contentTypes.length === 1) {
        const kindName = slot.contentTypes[0]!
        const ref = nodeMap.nodes.get(kindName)

        // Source C: parameterless compound — use its stampExpression directly
        if (ref?.isParameterless && ref.stampExpression !== undefined) {
            // Compounds stamp as factory call; keywords stamp as NodeData literal
            if (ref.modelType === 'keyword') {
                // Keywords: emit NodeData object literal (same as legacy Source B)
                const kind = JSON.stringify(ref.kind)
                const text = JSON.stringify(ref.text)
                return `{ $type: ${kind} as const, $text: ${text} as const, $source: 'factory' as const, $named: true as const }`
            }
            // Compound: the stampExpression is `factoryName()` — wrap in a factory import ref
            // so the emitted code resolves correctly.
            // We emit the factory call directly; the factory is imported via `import * as F from './factories.js'`
            // but shared.ts doesn't know whether we're emitting from factories.ts or from.ts.
            // Return the raw expression and let callers prefix `F.` if needed.
            return ref.stampExpression
        }

        // Legacy Source B: hidden keyword kind (backwards compat for fields)
        if (kindName.startsWith('_')) {
            if (ref instanceof AssembledKeyword) {
                const kind = JSON.stringify(ref.kind)
                const text = JSON.stringify(ref.text)
                return `{ $type: ${kind} as const, $text: ${text} as const, $source: 'factory' as const, $named: true as const }`
            }
        }
    }

    return undefined
}
