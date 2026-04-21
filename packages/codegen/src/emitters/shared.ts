/**
 * Shared helpers used across emitters. Kept small — the goal is to dedupe
 * patterns that copy-paste across 3+ emitters, not to become a grab-bag.
 */

import type { NodeMap } from '../compiler/types.ts'
import type { AssembledField } from '../compiler/node-map.ts'
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
