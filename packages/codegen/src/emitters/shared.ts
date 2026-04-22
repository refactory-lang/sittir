/**
 * Shared helpers used across emitters. Kept small — the goal is to dedupe
 * patterns that copy-paste across 3+ emitters, not to become a grab-bag.
 */

import type { NodeMap } from '../compiler/types.ts'
import type {
    AssembledField, AssembledChild, NodeOrTerminal, AssembledNode,
} from '../compiler/node-map.ts'
import {
    AssembledKeyword, AssembledToken, AssembledEnum,
    AssembledBranch, AssembledContainer, AssembledGroup,
    isNodeRef, isTerminalValue, isUnresolvedRef,
    isRequired, isMultiple, isNonEmpty,
} from '../compiler/node-map.ts'

// Re-export derived helpers so emitters can import from one place.
export { isRequired, isMultiple, isNonEmpty }

/**
 * Compute the set of kind names referenced by any structural node in the
 * NodeMap — walked once, consumed by multiple emitters.
 *
 * A kind is "referenced" when it appears in:
 *   - A structural node's `fields[*].values` (node-ref kind names).
 *   - A structural node's `children[*].values` (node-ref kind names).
 *   - A polymorph form's fields / children (same, per form).
 *   - A supertype's `subtypes` list.
 *
 * Emitters that decide which terminal aliases / Tree interfaces to emit
 * use this to skip unreferenced terminals whose only consumer is a missing
 * factory binding. Previously duplicated in `types.ts::computeReferencedKinds`,
 * `type-test.ts` (inline walker), and `types.ts::collectAndEmitTokenTypeAliases`
 * (inline walker) — one walk, three derivations that had to stay in sync.
 *
 * @param nodeMap - The assembled node map to walk.
 * @returns The set of referenced kind strings.
 */
export function referencedKinds(nodeMap: NodeMap): Set<string> {
    const referenced = new Set<string>()
    for (const [, node] of nodeMap.nodes) {
        switch (node.modelType) {
            case 'branch':
            case 'group':
                for (const f of node.fields) for (const t of slotKindNames(f)) referenced.add(t)
                for (const c of (node.children ?? [])) for (const t of slotKindNames(c)) referenced.add(t)
                break
            case 'container':
                for (const c of node.children) for (const t of slotKindNames(c)) referenced.add(t)
                break
            case 'polymorph':
                for (const form of node.forms) {
                    for (const f of form.fields) for (const t of slotKindNames(f)) referenced.add(t)
                    for (const c of form.children) for (const t of slotKindNames(c)) referenced.add(t)
                }
                break
            case 'supertype':
                for (const t of node.subtypes) referenced.add(t)
                break
        }
    }
    return referenced
}

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

// ---------------------------------------------------------------------------
// Field / child type-expression projection (shared by types.ts + factories.ts)
// ---------------------------------------------------------------------------

/**
 * One component of a field or child type expression. Callers assemble a
 * final TS type expression by formatting these (adding / omitting a `T.`
 * prefix, wrapping literals in `JSON.stringify`, routing `missing` to a
 * fallback stub, etc.).
 *
 * Three shapes:
 *
 * - **`nodeKind`** — a resolved node kind in the NodeMap. `value` is the
 *   kind's computed `typeName` (already PascalCase, always a valid TS
 *   identifier when emitted unquoted; callers that need a quoted form
 *   when `typeName` is not ident-shaped should branch on
 *   {@link isValidIdent}). `rawKind` is the original kind string — used
 *   as the indexed-access key when falling back to `"kind-string"` under
 *   unquoted-alias conditions.
 * - **`literal`** — an inline string literal from a terminal value.
 *   `value` is the raw string; callers typically `JSON.stringify` it.
 * - **`missing`** — a kind referenced in the slot's values that isn't in
 *   the NodeMap. `value` is a PascalCase fallback identifier; `rawKind`
 *   is the raw kind. types.ts registers this for stub emission;
 *   factories.ts prefixes with `T.`.
 *
 * `fieldTypeComponents` pre-inlines hidden single-literal keywords (the
 * `_kw_*` pattern) as `literal` components so consumer emitters don't
 * surface helper wrapper types. The alias-source projection
 * (ADR-0006) is also applied here once — callers don't rebuild the
 * resolver twice.
 */
export type TypeComponent =
    | { kind: 'nodeKind'; value: string; rawKind: string }
    | { kind: 'literal'; value: string }
    | { kind: 'missing'; value: string; rawKind: string }

/**
 * Compute the shared {@link TypeComponent} list for a field slot.
 *
 * Pure derivation over the slot's `values` + `aliasSources`. Applies:
 *   1. Alias-source rewrite (ADR-0006): if a content kind is the TARGET
 *      of `alias($.source, $.target)`, rewrite to `source` when `source`
 *      exists in the NodeMap.
 *   2. Hidden-keyword inlining: `_kw_async` → literal `"async"`.
 *   3. NodeMap lookup: resolved kind → `nodeKind`; missing → `missing`
 *      (with a PascalCase fallback name for consumers that need one).
 *
 * Used by `types.ts::fieldTypeExpr` and `factories.ts::fieldElementType`
 * — previously two parallel walkers with near-identical logic, differing
 * only in prefix choice and missing-kind handling.
 *
 * @param field - The field whose slot values drive the projection.
 * @param nodeMap - The assembled node map for kind resolution.
 * @returns Ordered components (in the order the kinds / literals appear
 *   in `field.values`). Callers deduplicate at emission time.
 */
export function fieldTypeComponents(
    field: AssembledField,
    nodeMap: NodeMap,
): TypeComponent[] {
    const out: TypeComponent[] = []
    const resolveAliased = (t: string): string => {
        const source = field.aliasSources?.[t]
        if (!source) return t
        return nodeMap.nodes.get(source) ? source : t
    }
    for (const v of field.values) {
        if (isTerminalValue(v)) {
            out.push({ kind: 'literal', value: v.value })
            continue
        }
        if (!isNodeRef(v)) continue
        const rawName = isUnresolvedRef(v.node) ? v.node.name : v.node.kind
        const t = resolveAliased(rawName)
        const lit = resolveHiddenKeywordLiteral(t, nodeMap)
        if (lit !== undefined) {
            out.push({ kind: 'literal', value: lit })
            continue
        }
        const node = nodeMap.nodes.get(t)
        if (!node) {
            const fallback = t.replace(/(?:^|_)([a-z])/g, (_, c: string) => c.toUpperCase())
            out.push({ kind: 'missing', value: fallback, rawKind: t })
            continue
        }
        out.push({ kind: 'nodeKind', value: node.typeName, rawKind: t })
    }
    return out
}

// ---------------------------------------------------------------------------
// Polymorph UForm Config hoisting
// ---------------------------------------------------------------------------

/**
 * Describes a single-required-child polymorph form whose inner child's
 * `$fields` should be hoisted up into the form's Config surface.
 *
 * @remarks
 * Many polymorph forms (e.g. rust's `range_expression__form_binary`) have
 * `$fields: []` at the form level and a single required structural child
 * that itself carries the real fields (e.g. `RangeExpressionBinary` with
 * `start / operator / end`). Forcing callers to construct the inner child
 * manually (`rangeExpression({ $variant: 'binary', children: [rangeExpressionBinary({...})] })`)
 * is clunky. Hoisting flattens the inner child's fields into the form's
 * Config so callers can write
 * `rangeExpression({ $variant: 'binary', start, operator, end })`.
 *
 * The NodeData output shape is unchanged — the factory reconstructs the
 * inner child from the hoisted fields before emitting `$children: [inner]`.
 */
export interface HoistedForm {
    readonly innerKind: string
    readonly innerNode: AssembledNode
    readonly innerTypeName: string
    readonly innerFactoryName: string
    readonly innerFields: readonly AssembledField[]
}

/**
 * Determine whether a polymorph form qualifies for inner-child field
 * hoisting into its Config surface.
 *
 * @param form - The polymorph form descriptor (AssembledGroup).
 * @param nodeMap - Assembled node map (needed to resolve the inner child
 *   kind to its AssembledNode for fields inspection).
 * @returns A {@link HoistedForm} descriptor when the form qualifies,
 *   `undefined` otherwise.
 *
 * @remarks
 * Qualification criteria:
 * - The form has `fields.length === 0` (otherwise there's nothing to hoist
 *   onto, and mixing form-level + inner fields is ambiguous).
 * - Exactly one child slot.
 * - That slot is required AND not multiple.
 * - That slot's `values` resolve to exactly one kind (no choice / union).
 * - The inner kind resolves to a field-carrying node (AssembledBranch,
 *   AssembledContainer, or AssembledGroup) whose `fields.length > 0`.
 * - The inner node has a `rawFactoryName` (we need a factory call to
 *   reconstruct the child).
 *
 * Forms that fail any criterion keep the existing `$children`-based Config
 * shape.
 */
export function resolveHoistedForm(
    form: AssembledGroup,
    nodeMap: NodeMap,
): HoistedForm | undefined {
    // Only forms without their own fields — otherwise the merged surface
    // is ambiguous and callers can't tell parent fields from inner ones.
    if (form.fields.length > 0) return undefined

    // Exactly one child slot.
    const children = form.children
    if (children.length !== 1) return undefined
    const slot = children[0]!

    // Required, non-repeated.
    if (!isRequired(slot)) return undefined
    if (isMultiple(slot)) return undefined

    // Exactly one inner kind (no choice / union).
    const kinds = slotKindNames(slot)
    if (kinds.length !== 1) return undefined
    const innerKind = kinds[0]!

    // Resolve the inner kind to a field-carrying node.
    const inner = nodeMap.nodes.get(innerKind)
    if (!inner) return undefined

    const isFieldCarrier = inner instanceof AssembledBranch
        || inner instanceof AssembledContainer
        || inner instanceof AssembledGroup
    if (!isFieldCarrier) return undefined

    const innerFields = (inner as AssembledBranch).fields ?? []
    if (!innerFields || innerFields.length === 0) return undefined

    if (!inner.rawFactoryName) return undefined

    return {
        innerKind,
        innerNode: inner,
        innerTypeName: inner.typeName,
        innerFactoryName: inner.rawFactoryName,
        innerFields,
    }
}

// ---------------------------------------------------------------------------
// Keyword-presence classifier (ADR-0012)
// ---------------------------------------------------------------------------

/**
 * Resolve a single NodeOrTerminal entry to a single literal string, or
 * `undefined` when the entry doesn't point at a single literal.
 *
 * Three sources:
 *   - TerminalValue → its `.value`.
 *   - NodeRef to a hidden `_kw_*` keyword kind (AssembledKeyword) or
 *     hidden single-string AssembledToken → the keyword/token text.
 *   - NodeRef to a single-value AssembledEnum (`members.length === 1`)
 *     → that member's value.
 *
 * Any other shape (non-literal node ref, unresolved ref) returns undefined.
 */
function resolveEntryLiteral(
    entry: NodeOrTerminal,
    nodeMap: NodeMap,
): string | undefined {
    if (isTerminalValue(entry)) return entry.value
    if (!isNodeRef(entry)) return undefined
    const kindName = isUnresolvedRef(entry.node) ? entry.node.name : entry.node.kind
    // Hidden `_kw_*` / hidden single-string token — uses the existing helper.
    const lit = resolveHiddenKeywordLiteral(kindName, nodeMap)
    if (lit !== undefined) return lit
    // Single-value enum — structurally identical to a bare literal.
    const ref = nodeMap.nodes.get(kindName)
    if (ref instanceof AssembledEnum) {
        const values = ref.values
        if (values.length === 1) return values[0]
    }
    // Hidden non-underscore keyword resolution (defensive — keeps the
    // helper symmetric with resolveHiddenKeywordLiteral, which only
    // returns for `_`-prefixed kinds).
    if (!kindName.startsWith('_')) {
        if (ref instanceof AssembledKeyword) return ref.text
        if (ref instanceof AssembledToken) return ref.text
    }
    return undefined
}

/**
 * Classify a field's keyword-presence intent from its slot `values` +
 * per-value multiplicity. Returns `'boolean'` for `optional(single-literal)`
 * (or the degenerate `repeat(single-literal)`), `'bitflag'` for
 * `repeat(choice-of-literals)`, and `null` when the field isn't a
 * keyword-presence pattern.
 *
 * Shape criteria:
 *
 * - **`'boolean'`** — EITHER:
 *   - exactly one `values` entry, resolves to a single literal, multiplicity
 *     is `'optional'`; OR
 *   - every entry resolves to a literal AND every entry's multiplicity is
 *     `'array'` / `'nonEmptyArray'` AND the set of distinct literals has
 *     size exactly 1 (degenerate repeat-of-one-literal).
 *
 * - **`'bitflag'`** — every entry resolves to a literal AND every entry's
 *   multiplicity is `'array'` / `'nonEmptyArray'` AND the set of distinct
 *   literal values has size >= 2.
 *
 * - **`null`** otherwise — any non-literal NodeRef (a symbol pointing at
 *   a structural kind) disqualifies, as does mixed or required-single
 *   multiplicity.
 *
 * @see ADR-0012 for the motivation and the three-row taxonomy.
 */
export function keywordPresenceKind(
    field: AssembledChild,
    nodeMap: NodeMap,
): 'boolean' | 'bitflag' | null {
    if (field.values.length === 0) return null

    // Single optional entry → boolean when the entry resolves to a literal.
    if (field.values.length === 1) {
        const v = field.values[0]!
        if (v.multiplicity === 'optional' && resolveEntryLiteral(v, nodeMap) !== undefined) {
            return 'boolean'
        }
    }

    // Every entry must resolve to a literal and be array / nonEmptyArray
    // for the repeat-of-literals cases.
    const literals: string[] = []
    for (const v of field.values) {
        if (v.multiplicity !== 'array' && v.multiplicity !== 'nonEmptyArray') return null
        const lit = resolveEntryLiteral(v, nodeMap)
        if (lit === undefined) return null
        literals.push(lit)
    }
    const distinct = new Set(literals)
    if (distinct.size === 1) return 'boolean' // degenerate repeat(single-literal)
    if (distinct.size >= 2) return 'bitflag'
    return null
}

/**
 * The single literal for a boolean-keyword field. Returns `undefined` if
 * the field is not a boolean-keyword field.
 */
export function keywordPresenceValue(
    field: AssembledChild,
    nodeMap: NodeMap,
): string | undefined {
    if (keywordPresenceKind(field, nodeMap) !== 'boolean') return undefined
    // For single-entry optional: the entry's literal. For degenerate
    // repeat(single-literal): the one distinct literal.
    for (const v of field.values) {
        const lit = resolveEntryLiteral(v, nodeMap)
        if (lit !== undefined) return lit
    }
    return undefined
}

/**
 * The ordered-unique literal set for a bitflag field. Returns an empty
 * array if the field is not a bitflag field. Order follows the order
 * the literals appear in the grammar's `values` array — that order is
 * the canonical render / enum-declaration order.
 */
export function keywordPresenceValues(
    field: AssembledChild,
    nodeMap: NodeMap,
): readonly string[] {
    if (keywordPresenceKind(field, nodeMap) !== 'bitflag') return []
    const seen = new Set<string>()
    const out: string[] = []
    for (const v of field.values) {
        const lit = resolveEntryLiteral(v, nodeMap)
        if (lit !== undefined && !seen.has(lit)) {
            seen.add(lit)
            out.push(lit)
        }
    }
    return out
}

/**
 * Returns `true` when EVERY entry in the slot's `values` has multiplicity
 * `nonEmptyArray`. Used by the consts emitter to decide whether a bitflag
 * enum needs a `None = 0` member (repeat allows zero → yes, repeat1 no).
 */
export function keywordPresenceIsNonEmptyRepeat(
    field: AssembledChild,
): boolean {
    if (field.values.length === 0) return false
    return field.values.every(v => v.multiplicity === 'nonEmptyArray')
}
