/**
 * Shared helpers used across emitters. Kept small — the goal is to dedupe
 * patterns that copy-paste across 3+ emitters, not to become a grab-bag.
 */

import type { NodeMap } from '../compiler/types.ts'
import type { AssembledField, AssembledChild, NodeOrTerminal } from '../compiler/node-map.ts'
import {
    AssembledKeyword, AssembledToken,
    isNodeRef, isTerminalValue, isUnresolvedRef,
    isRequired, isMultiple, isNonEmpty,
} from '../compiler/node-map.ts'

// Re-export derived helpers so emitters can import from one place.
export { isRequired, isMultiple, isNonEmpty }

/**
 * Extract the node kind names from a slot's `values` array.
 * Returns the name string for each NodeRef entry (resolved or unresolved).
 * Terminal values are excluded — they're not kinds.
 */
export function slotKindNames(slot: { values: readonly NodeOrTerminal[] }): string[] {
    const out: string[] = []
    for (const v of slot.values) {
        if (!isNodeRef(v)) continue
        const name = isUnresolvedRef(v.node) ? v.node.name : v.node.kind
        out.push(name)
    }
    return out
}

/**
 * Extract the terminal literal values from a slot's `values` array.
 */
export function slotLiteralValues(slot: { values: readonly NodeOrTerminal[] }): string[] {
    return slot.values.filter(isTerminalValue).map(v => v.value)
}

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
function identOrQuoted(name: string): string {
    return IDENT_RE.test(name) ? name : JSON.stringify(name)
}

/**
 * Resolve a field's effective single-literal value, if any.
 *
 * A field qualifies for auto-stamp when ALL of the following hold:
 *   - It is **required** — no values are `optional`.
 *   - It is **not repeated** — no values are `array` / `nonEmptyArray`.
 *   - Its *effective* resolved type is exactly one string literal.
 *
 * Two sources of "single string literal" are recognised:
 *
 * - **Source A — inline literal**: exactly one TerminalValue in `values`.
 *
 * - **Source B — referenced keyword kind**: exactly one NodeRef in `values`
 *   pointing to a hidden AssembledKeyword (a hidden rule whose body is a
 *   single word-like string, such as `_kw_async: $ => 'async'`).
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
    if (!isRequired(field)) return undefined

    // Repeated fields are never auto-stamped — they represent 0..N occurrences.
    if (isMultiple(field)) return undefined

    // Must be a single value entry to auto-stamp
    if (field.values.length !== 1) return undefined
    const v = field.values[0]!

    // Source A: inline literal (bare STRING or choice-of-one-string field)
    if (isTerminalValue(v)) return v.value

    // Source B: field references a single hidden keyword kind (`_kw_*` pattern).
    // Restricted to hidden kinds (name starts with `_`) to avoid false-positives
    // from visible keyword nodes that may appear inside mixed-choice overrides
    // (e.g. pointer_type's `choice('const', $.mutable_specifier)` where the
    // string alternative is now explicitly present in values — both entries
    // prevent single-value auto-stamp, which is the correct behavior).
    if (isNodeRef(v)) {
        const kindName = isUnresolvedRef(v.node) ? v.node.name : v.node.kind
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

/**
 * Return the literal string that a hidden single-literal keyword kind
 * produces, or `undefined` if the kind is not a hidden single-literal
 * keyword.
 *
 * @remarks
 * Hidden `_kw_<name>` rules are an implementation detail for preserving
 * FIELD wrappers around bare string tokens (tree-sitter strips FIELD
 * around anonymous STRING; routing through a SYMBOL preserves it).
 * Consumers don't care that a hidden helper rule exists — the surface
 * type should be the literal string the keyword produces. This helper
 * lets type / factory emitters inline `"&"` / `"async"` / etc. in
 * field type expressions and fluent setter signatures instead of
 * surfacing a `KwLifetime` / `KwAsync` wrapper type.
 *
 * A kind qualifies when:
 *   - The kind name starts with `_` (hidden-rule marker).
 *   - The resolved node is an {@link AssembledKeyword} — its rule body
 *     is a single `StringRule`.
 *
 * @param kindName - The kind to probe.
 * @param nodeMap - Assembled node map (needed to resolve `kindName`
 *   to its `AssembledNode` and check for a keyword shape).
 * @returns The keyword's literal text, or `undefined`.
 */
export function resolveHiddenKeywordLiteral(
    kindName: string,
    nodeMap: NodeMap,
): string | undefined {
    if (!kindName.startsWith('_')) return undefined
    const node = nodeMap.nodes.get(kindName)
    if (node instanceof AssembledKeyword) return node.text
    // Tokens with StringRule bodies are anonymous-string literals that
    // the classifier routed through `token()` / `prec()` wrappers (the
    // evaluator strips prec but token shape survives). They're
    // functionally identical to keywords for inlining purposes — a
    // single literal text the field accepts.
    if (node instanceof AssembledToken) return node.text
    return undefined
}

// ---------------------------------------------------------------------------
// Generic slot helpers — work on AssembledChild (the base shared by both
// AssembledField and the plain child slot descriptors).
// ---------------------------------------------------------------------------

/**
 * Returns `true` when `slot` is auto-stamp-eligible.
 *
 * A slot is eligible when:
 * - Optional (`isRequired(slot) === false`) — user can omit it; it does not
 *   block parameterless classification of the parent compound.
 * - Required, non-repeated, and its content is fixed:
 *   (a) Inline literal: exactly one TerminalValue in values.
 *   (b) Single NodeRef that is itself marked `isParameterless` on its
 *       AssembledNode (populated by the `markParameterlessKinds` pass in
 *       `assemble.ts`).
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
    if (!isRequired(slot)) return true    // optional → does not block
    if (isMultiple(slot)) return false   // required repeated → user must supply

    // Must be single-value to auto-stamp
    if (slot.values.length !== 1) return false
    const v = slot.values[0]!

    // Source A: inline literal
    if (isTerminalValue(v)) return true

    // Source B/C: single NodeRef — check if the referenced kind is parameterless
    if (isNodeRef(v)) {
        const kindName = isUnresolvedRef(v.node) ? v.node.name : v.node.kind
        const ref = nodeMap.nodes.get(kindName)

        // Source C: parameterless compound (set by fixpoint pass)
        if (ref?.isParameterless) return true

        // Legacy Source B fallback: hidden keyword kind
        if (kindName.startsWith('_') && ref instanceof AssembledKeyword) return true
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
 * - **Inline literal** (TerminalValue): `JSON.stringify(value) + " as const"`
 * - **Referenced keyword** (hidden AssembledKeyword NodeRef): NodeData object literal
 *   `{ $type: '...', $text: '...', $source: 'factory' as const, $named: true as const }`
 * - **Referenced parameterless compound**: factory call expression from
 *   `ref.stampExpression` — e.g. `"breakExpression()"`.
 *
 * @remarks
 * This function replaces the field-only `autoStampExpression()` inside factories.ts
 * for the general case. The factories.ts private function is kept as-is for backwards
 * compat; this helper is the authoritative version for emitters that need to handle
 * children slots too.
 */
export function stampExpressionFor(slot: AssembledChild, nodeMap: NodeMap): string | undefined {
    if (!isRequired(slot)) return undefined  // optional — no stamp
    if (isMultiple(slot)) return undefined   // repeated — no stamp

    // Must be single-value to stamp
    if (slot.values.length !== 1) return undefined
    const v = slot.values[0]!

    // Source A: inline literal
    if (isTerminalValue(v)) {
        return `${JSON.stringify(v.value)} as const`
    }

    // Source B/C: single NodeRef
    if (isNodeRef(v)) {
        const kindName = isUnresolvedRef(v.node) ? v.node.name : v.node.kind
        const ref = nodeMap.nodes.get(kindName)

        // Source C: parameterless compound — use its stampExpression directly
        if (ref?.isParameterless && ref.stampExpression !== undefined) {
            if (ref.modelType === 'keyword') {
                const kind = JSON.stringify(ref.kind)
                const text = JSON.stringify(ref.text)
                return `{ $type: ${kind} as const, $text: ${text} as const, $source: 'factory' as const, $named: true as const }`
            }
            return ref.stampExpression
        }

        // Legacy Source B: hidden keyword kind (backwards compat)
        if (kindName.startsWith('_') && ref instanceof AssembledKeyword) {
            const kind = JSON.stringify(ref.kind)
            const text = JSON.stringify(ref.text)
            return `{ $type: ${kind} as const, $text: ${text} as const, $source: 'factory' as const, $named: true as const }`
        }
    }

    return undefined
}
