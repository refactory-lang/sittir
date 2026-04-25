/**
 * Emits from.ts — consumes NodeMap directly.
 *
 * Owns ALL `from()` resolver string generation. Rule.ts exposes the
 * IR; this file dispatches on `node.modelType` and emits the per-kind
 * resolver bodies plus the module-scoped helpers (_resolveOne,
 * _resolveMany, _resolveLeafString, _resolveByKind, _resolveScalar).
 */

import type { NodeMap } from '../compiler/types.ts'
import type {
    AssembledNode, AssembledField, AssembledChild, AssembledGroup,
} from '../compiler/node-map.ts'
import type { PolymorphVariant } from '../compiler/types.ts'
import {
    isAutoStampField, isAutoStampSlot, isRequired, isMultiple, isNonEmpty, slotKindNames,
    slotLiteralValues, fieldTypeComponents, isValidIdent,
    keywordPresenceKind, resolveHoistedForm,
} from './shared.ts'
import { isNodeRef, isTerminalValue, isUnresolvedRef } from '../compiler/node-map.ts'
import type { NodeOrTerminal } from '../compiler/node-map.ts'

export interface EmitFromConfig {
    grammar: string
    nodeMap: NodeMap
}

// ---------------------------------------------------------------------------
// T042i dedup helpers
// ---------------------------------------------------------------------------

/**
 * Builds a reverse-lookup map from a sorted subtype key to the named
 * supertype constant identifier for T042i dedup.
 *
 * @remarks
 * Each unique resolver kind list gets a single module-scoped constant
 * declaration; resolver call sites reference that constant instead of
 * repeating the literal array inline. Supertypes get *named* constants
 * (`_super_expression`) — when a field's content exactly matches a
 * supertype's subtype set we reuse the supertype's name as the dedup
 * identifier, making the generated code readable and aligning the physical
 * constant with the grammar's own supertype declarations. Any other list
 * falls through to numbered `_K0`, `_K1`, …
 *
 * Reverse lookup: sorted-subtypes key → supertype constant name.
 * First occurrence wins — two supertypes sharing an exact subtype set is
 * rare and the first name is as good as any.
 *
 * @param nodeMap - The assembled node map containing supertype entries.
 * @returns A map from sorted-subtypes key string to `_super_<name>` identifier.
 */
function buildSupertypeByKey(nodeMap: NodeMap): Map<string, string> {
    const supertypeByKey = new Map<string, string>()
    for (const [kind, node] of nodeMap.nodes) {
        if (node.modelType !== 'supertype') continue
        if (node.subtypes.length === 0) continue
        const key = [...node.subtypes].sort().join('\n')
        if (!supertypeByKey.has(key)) {
            const safe = kind.replace(/^_+/, '').replace(/[^\w]/g, '_')
            supertypeByKey.set(key, `_super_${safe}`)
        }
    }
    return supertypeByKey
}

/**
 * Creates a kind-list interner that deduplicates resolver kind arrays
 * into module-scoped constants for T042i.
 *
 * @remarks
 * Looks up by sorted supertype signature first — gives readable names for
 * the common case. Otherwise falls back to numbered dedup (`_K0`, `_K1`, …).
 *
 * @param supertypeByKey - Reverse lookup built by {@link buildSupertypeByKey}.
 * @param kindTableIndex - Mutable map from JSON-serialized kind list to index.
 * @param kindTableLiterals - Mutable array of JSON kind-list literals.
 * @param namedEntries - Mutable map from supertype constant name to JSON literal.
 * @returns An interner function that maps a kind list to its constant identifier.
 */
function buildKindInterner(
    supertypeByKey: Map<string, string>,
    kindTableIndex: Map<string, number>,
    kindTableLiterals: string[],
    namedEntries: Map<string, string>,
): KindInterner {
    return (kinds: readonly string[]): string => {
        const superKey = [...kinds].sort().join('\n')
        const superName = supertypeByKey.get(superKey)
        if (superName !== undefined) {
            if (!namedEntries.has(superName)) {
                namedEntries.set(superName, JSON.stringify(kinds))
            }
            return superName
        }
        const key = JSON.stringify(kinds)
        let idx = kindTableIndex.get(key)
        if (idx === undefined) {
            idx = kindTableLiterals.length
            kindTableIndex.set(key, idx)
            kindTableLiterals.push(key)
        }
        return `_K${idx}`
    }
}

// ---------------------------------------------------------------------------
// Emission helpers for the from.ts header block
// ---------------------------------------------------------------------------

/**
 * Emits the namespace import lines into the generated from.ts header.
 *
 * @remarks
 * Per spec 008 US3: factories are accessed via `F.<name>`; types via
 * `T.<Kind>.Config` / `.Loose` / `.Fluent`. Collapsing to a namespace
 * import eliminates the per-factory import wall (~3kB in rust) to a
 * single line.
 *
 * @param lines - Output lines array to push into.
 */
function emitNamespaceImports(lines: string[]): void {
    lines.push(`import * as F from './factories.js';`)
    lines.push(`import type * as T from './types.js';`)
    lines.push("import type { AnyNodeData, ConfigOf } from '@sittir/types';")
    lines.push("import { isNodeData } from './utils.js';")
    lines.push('')
}

/**
 * Emits the `_FromFieldInput` closed union type declaration into generated
 * from.ts, capturing every shape a loose-from() field value can hold.
 *
 * @remarks
 * Every loose-from() caller can hand us:
 *   - a fully-built NodeData     (passthrough path)
 *   - a primitive                (leaf-factory dispatch)
 *   - a { kind, ...rest } object (kind-tagged dispatch)
 *   - an array of any of above   (multi-field slot)
 *   - undefined / null           (absent optional field)
 *
 * `_FromFieldInput` is the minimum closed union that captures every one of
 * those shapes without leaking `unknown`. The `{ kind, ... }` arm is
 * modeled as an index signature whose values recursively match the same
 * union so `{kind, ...rest}` destructuring preserves types.
 *
 * @param lines - Output lines array to push into.
 */
function emitFromFieldInputType(lines: string[]): void {
    lines.push("/** Closed union of every shape a loose-from() field value can hold. */")
    lines.push("type _FromFieldInput =")
    lines.push("  | AnyNodeData")
    lines.push("  | string")
    lines.push("  | number")
    lines.push("  | boolean")
    lines.push("  | null")
    lines.push("  | undefined")
    lines.push("  | { readonly [key: string]: _FromFieldInput }")
    lines.push("  | readonly _FromFieldInput[];")
    lines.push("")
}

/**
 * Collects per-node from() resolver blocks by iterating all non-hidden,
 * non-polymorph-form kinds through the shared interner.
 *
 * @remarks
 * The interner is passed down so every field resolver call registers its
 * kind list through the same dedup table, ensuring T042i constant sharing
 * is effective across all per-node blocks.
 *
 * @param nodeMap - The assembled node map.
 * @param internKinds - Kind-list interner from {@link buildKindInterner}.
 * @returns Array of per-kind resolver source strings.
 */
function collectPerNodeFromBlocks(nodeMap: NodeMap, internKinds: KindInterner): string[] {
    const perNodeBlocks: string[] = []
    for (const [kind, node] of nodeMap.nodes) {
        if (kind.startsWith('_')) continue
        if (nodeMap.polymorphFormKinds.has(kind)) continue
        const source = renderFromForNode(node, nodeMap, internKinds)
        if (source === undefined) continue
        perNodeBlocks.push(source)
    }
    return perNodeBlocks
}

/**
 * Emits the `_fromMap` runtime dispatch table and `_FromMap` type alias into
 * generated from.ts.
 *
 * @remarks
 * Same pattern as `_factoryMap` in factories.ts: declared as a plain `as const`
 * object so every entry's type is inferred from the per-kind `fromX` signature.
 * `_FromMap = typeof _fromMap` gives consumers the precise per-slot type without
 * duplicating the kind→function mapping.
 *
 * Declared BEFORE the resolver helpers so `_resolveByKind<K>` can reference
 * `_FromMap[K]` / `_fromMap[kind]` in its signature — the per-kind function
 * declarations it points at are hoisted at both the TS type level and the
 * runtime level, so forward references across the per-node blocks below
 * resolve cleanly.
 *
 * @param lines - Output lines array to push into.
 * @param nodeMap - The assembled node map.
 */
function emitFromMapDeclaration(lines: string[], nodeMap: NodeMap): void {
    lines.push('export const _fromMap = {')
    for (const [kind, node] of nodeMap.nodes) {
        if (kind.startsWith('_')) continue
        if (!node.factoryName) continue
        if (node.modelType === 'token' || node.modelType === 'supertype' || node.modelType === 'group') continue
        if (!node.fromFunctionName) continue
        lines.push(`  ${JSON.stringify(kind)}: ${node.fromFunctionName},`)
    }
    lines.push('} as const;')
    lines.push('export type _FromMap = typeof _fromMap;')
    lines.push('')
}

/**
 * Emits the interned resolver kind-list constants (T042i dedup table) before
 * the per-node blocks, ensuring every `_KN` / `_super_X` identifier is
 * declared by the time it is referenced.
 *
 * @param lines - Output lines array to push into.
 * @param namedEntries - Map from supertype constant name to JSON literal.
 * @param kindTableLiterals - Array of numbered JSON kind-list literals.
 */
function emitInternedKindTable(
    lines: string[],
    namedEntries: Map<string, string>,
    kindTableLiterals: string[],
): void {
    if (kindTableLiterals.length > 0 || namedEntries.size > 0) {
        lines.push('// Interned resolver kind lists (T042i dedup)')
        for (const [name, literal] of namedEntries) {
            lines.push(`const ${name}: readonly string[] = ${literal};`)
        }
        for (let i = 0; i < kindTableLiterals.length; i++) {
            lines.push(`const _K${i}: readonly string[] = ${kindTableLiterals[i]};`)
        }
        lines.push('')
    }
}

export function emitFrom(config: EmitFromConfig): string {
    const { nodeMap } = config

    const supertypeByKey = buildSupertypeByKey(nodeMap)
    const kindTableIndex = new Map<string, number>()
    const kindTableLiterals: string[] = []
    const namedEntries = new Map<string, string>()  // name → JSON literal
    const internKinds = buildKindInterner(supertypeByKey, kindTableIndex, kindTableLiterals, namedEntries)

    const lines: string[] = [
        '// Auto-generated by @sittir/codegen — do not edit',
        '',
    ]

    emitNamespaceImports(lines)

    // ------------------------------------------------------------------
    // Shared input type for the resolver layer.
    // `isNodeData` is imported from ./utils.js (canonical definition).
    // ------------------------------------------------------------------
    emitFromFieldInputType(lines)

    const perNodeBlocks = collectPerNodeFromBlocks(nodeMap, internKinds)

    emitFromMapDeclaration(lines, nodeMap)

    // Loose-input resolver scaffolding — references `_fromMap` /
    // `_FromMap` above and every per-kind `fromX` defined below.
    emitResolverHelpers(lines, nodeMap)
    lines.push('')

    emitInternedKindTable(lines, namedEntries, kindTableLiterals)
    for (const block of perNodeBlocks) {
        lines.push(block)
        lines.push('')
    }

    return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

function renderFromForNode(node: AssembledNode, nodeMap: NodeMap, intern: KindInterner): string | undefined {
    if (!node.rawFactoryName || !node.fromFunctionName) return undefined
    switch (node.modelType) {
        case 'branch':
            // Text-template branches (e.g. rust raw_string_literal) emit a
            // factory of shape `(text: string)` per factory-map.json5, not a
            // Config object. Route them through the string-like from() so
            // the from() signature matches the factory's text-only contract.
            if (node.isTextTemplate(nodeMap.externals)) {
                return emitStringLikeFrom({
                    typeName: node.typeName,
                    rawFactoryName: node.rawFactoryName,
                    fromFunctionName: node.fromFunctionName,
                })
            }
            return emitBranchFrom(node, nodeMap, intern)
        case 'container':
            return emitContainerFrom(node)
        case 'polymorph':
            return emitPolymorphFrom(node, nodeMap, intern)
        case 'leaf':
            return emitStringLikeFrom(node)
        case 'enum':
            return emitStringLikeFrom({
                typeName: node.typeName,
                rawFactoryName: node.rawFactoryName,
                fromFunctionName: node.fromFunctionName,
                enumValues: node.values,
            })
        case 'keyword':
            return emitKeywordFrom(node)
        default:
            return undefined
    }
}

// ---------------------------------------------------------------------------
// Branch from() — loose input, field-level resolution
// ---------------------------------------------------------------------------

interface BranchLikeNode {
    readonly kind: string
    readonly typeName: string
    readonly fromInputTypeName: string
    readonly rawFactoryName?: string
    readonly fromFunctionName?: string
    readonly fields: readonly AssembledField[]
    readonly children?: readonly AssembledChild[]
}

function emitVariantFrom(
    node: AssembledNode,
    polymorphVariants: PolymorphVariant[],
    nodeMap: NodeMap,
    intern: KindInterner,
): string {
    const fn = node.fromFunctionName!
    const factory = `F.${node.rawFactoryName!}`
    const typeName = node.typeName
    const inputType = `T.${typeName}.Loose`
    // Return type unions the factory output with the bare data interface so
    // the `if (isNodeData(input)) return input;` passthrough — input narrows
    // to `T.<TypeName>` after the predicate, which lacks `$source` / `$named`
    // / fluent methods — type-checks without forcing a re-construction.
    const returnType = `ReturnType<typeof ${factory}> | T.${typeName}`
    const lines: string[] = []
    lines.push(`export function ${fn}(input: ${inputType}): ${returnType} {`)
    lines.push(`  if (isNodeData(input)) return input;`)

    const parentFields = 'fields' in node ? (node as { fields: readonly AssembledField[] }).fields : []
    const configParts: string[] = []
    for (const f of parentFields) {
        if (isAutoStampField(f, nodeMap)) continue  // factory stamps these; no Config slot
        const call = resolveFieldFromTypedInput(f, nodeMap, typeName, intern, 'input', false)
        configParts.push(`    ${f.propertyName}: ${call},`)
    }

    // Collect all variant field names for the config
    const seenProps = new Set(parentFields.map(f => f.propertyName))
    for (const pv of polymorphVariants) {
        const fullName = `${pv.parent}_${pv.child}`
        const vNode = nodeMap.nodes.get(fullName)
        if (!vNode) continue
        const vFields = 'fields' in vNode ? (vNode as { fields: readonly AssembledField[] }).fields : []
        for (const vf of vFields) {
            if (seenProps.has(vf.propertyName)) continue
            seenProps.add(vf.propertyName)
            if (isAutoStampField(vf, nodeMap)) continue  // factory stamps these; no Config slot
            const call = resolveFieldFromTypedInput(vf, nodeMap, typeName, intern, 'input', true)
            configParts.push(`    ${vf.propertyName}: ${call},`)
        }
    }

    lines.push(`  return ${factory}({`)
    lines.push(...configParts)
    lines.push('  });')
    lines.push('}')
    return lines.join('\n')
}

/**
 * Builds the `(input: T.Foo | T.Foo.Loose): ReturnType<typeof F.fooFactory>`
 * signature text for a branch from() function.
 *
 * @remarks
 * Return type is inferred from the factory call so the fluent accessor
 * methods (render, toEdit, replace, per-field getters/setters) flow through.
 * Annotating with the bare interface name `${typeName}` loses the methods and
 * fails assignability.
 *
 * Accepts either a pre-built NodeData (`T.Foo`, with snake_case `.fields`) or
 * the loose camelCase FromInput bag. The top-level `FromInputOf<T>` alias
 * itself never includes the node arm — only nested branch-slot values do via
 * WidenValue — so the union is added explicitly at the public signature.
 *
 * Per spec 008 US1: `T.<Kind>.Loose` resolves via `NamespaceMap[K]['Loose']`
 * (same type as the pre-008 Loose alias). Return type stays
 * `ReturnType<typeof F.<factory>>` — `FluentNodeOf<T>` (what `.Fluent`
 * resolves to) and the factory's concrete return shape are structurally
 * isomorphic but TS's strict function-parameter variance rejects the
 * assignment at the value position.
 *
 * @param node - The branch-like node being emitted.
 * @param factory - The `F.<factoryName>` reference string.
 * @param opt - `'?'` when all fields/children are optional, `''` otherwise.
 * @returns Object containing `inputType`, `returnType`, and `inputOptional` flag.
 */
function buildBranchSignatureParts(
    node: BranchLikeNode,
    factory: string,
    opt: string,
): { inputType: string; returnType: string; inputOptional: boolean } {
    const inputType = `T.${node.typeName}.Loose`
    // Return type unions the factory output with the bare data interface so
    // the `if (isNodeData(input)) return input;` passthrough — input narrows
    // to `T.<TypeName>` after the predicate, which lacks `$source` / `$named`
    // / fluent methods — type-checks without forcing a re-construction.
    const returnType = `ReturnType<typeof ${factory}> | T.${node.typeName}`
    const inputOptional = opt === '?'
    return { inputType, returnType, inputOptional }
}

/**
 * Emits the identity quick-return guard line for a branch from() body.
 *
 * @remarks
 * Per spec 008 US3 / FR-022: wrapped (fluent) NodeData IS the target type,
 * so it is returned unchanged. Bare readNode output (without fluent methods)
 * is an unsupported input path — callers should use readTreeNode (which wraps
 * via per-kind dispatch) before handing to .from().
 *
 * @param lines - Per-function lines array to push into.
 * @param inputOptional - Whether the input parameter is optional.
 * @param returnType - The return type annotation string for the cast.
 */
function emitBranchNodeDataPassthrough(lines: string[], inputOptional: boolean, _returnType: string): void {
    const passGuard = inputOptional ? 'input !== undefined && ' : ''
    lines.push(`  if (${passGuard}isNodeData(input)) return input;`)
}

/**
 * Emits the non-empty children hoisting block for a branch from() body.
 *
 * @remarks
 * Non-empty children hoist to a local binding so `_assertNonEmpty` can
 * narrow the resolved `readonly T[]` to `[T, ...T[]]` before the factory
 * call — same pattern as non-empty fields.
 *
 * @param lines - Per-function lines array to push into.
 * @param childSlots - The child slots for the node.
 * @param nodeMap - The assembled node map (forwarded to resolver).
 * @param typeName - Parent node's type name.
 * @param intern - Kind-list interner.
 * @param inputOptional - Whether the input parameter is optional.
 * @param kind - Grammar kind name, used in the assertion label.
 */
function emitNonEmptyChildrenHoist(
    lines: string[],
    childSlots: readonly AssembledChild[],
    nodeMap: NodeMap,
    typeName: string,
    intern: KindInterner,
    inputOptional: boolean,
    kind: string,
): void {
    const call = resolveChildrenFromTypedInput(childSlots, nodeMap, typeName, intern, 'input', inputOptional)
    // Annotate the hoist with the resolved element type so the slot
    // assignment downstream sees a `readonly T[]` (TS would otherwise
    // infer `unknown` when the `_resolveMany*<T>` call's `T` has no
    // contextual type — the result flows into a `const`, not a typed
    // slot). `_assertNonEmpty` then narrows it to the non-empty tuple.
    const elementType = childrenSlotElementType(childSlots, nodeMap)
    const annotation = elementType ? `: readonly (${elementType})[]` : ''
    lines.push(`  const _ne_children${annotation} = ${call};`)
    lines.push(`  _assertNonEmpty(_ne_children, '${kind}.children');`)
}

/**
 * Compute the element type expression for a children-slot resolver hoist.
 *
 * Produces a `T.X | T.Y | ...` union over the resolved kinds in the merged
 * children-slot values list. Mirrors the `factories.ts::childElementType`
 * walker but lives here to keep the from-emitter standalone.
 */
function childrenSlotElementType(
    childSlots: readonly AssembledChild[],
    nodeMap: NodeMap,
): string | undefined {
    const parts = new Set<string>()
    for (const c of childSlots) {
        for (const v of c.values) {
            if (isTerminalValue(v)) {
                parts.add(JSON.stringify(v.value))
                continue
            }
            if (!isNodeRef(v)) continue
            const t = isUnresolvedRef(v.node) ? v.node.name : v.node.kind
            const node = nodeMap.nodes.get(t)
            if (!node) continue
            const name = node.typeName
            parts.add(isValidIdent(name) ? `T.${name}` : JSON.stringify(t))
        }
    }
    if (parts.size === 0) return undefined
    return [...parts].join(' | ')
}

/**
 * Emits the children call inside the factory config object for a branch from().
 *
 * @remarks
 * Children coerce through the same resolver pipeline as field values —
 * `_resolveMany` turns loose strings, `{kind,...}` bags, and nested configs
 * into typed NodeData at runtime, which keeps the compile-time type
 * (`readonly [T, ...]`) honest. No sideways cast.
 *
 * @param lines - Per-function lines array to push into.
 * @param childSlots - The child slots for the node.
 * @param nodeMap - The assembled node map.
 * @param typeName - Parent node's type name.
 * @param intern - Kind-list interner.
 * @param inputOptional - Whether the input parameter is optional.
 * @param childrenNonEmpty - Whether children require at least one element.
 */
function emitBranchChildrenEntry(
    lines: string[],
    childSlots: readonly AssembledChild[],
    nodeMap: NodeMap,
    typeName: string,
    intern: KindInterner,
    inputOptional: boolean,
    childrenNonEmpty: boolean,
): void {
    if (childrenNonEmpty) {
        lines.push(`    children: _ne_children,`)
    } else {
        const call = resolveChildrenFromTypedInput(childSlots, nodeMap, typeName, intern, 'input', inputOptional)
        lines.push(`    children: ${call},`)
    }
}

function emitBranchFrom(node: BranchLikeNode, nodeMap: NodeMap, intern: KindInterner): string {
    const fn = node.fromFunctionName!
    const factory = `F.${node.rawFactoryName!}`
    const fields = node.fields
    const childSlots = node.children ?? []
    // Auto-stamp fields are always `required` but they have no slot in Config —
    // exclude them from the optionality check so the input `?` marker is correct.
    // Auto-stamp-eligible children likewise: the factory stamps them directly from
    // parameterless sub-factories, so they don't force the input to be required.
    const nonStampFields = fields.filter(f => !isAutoStampField(f, nodeMap))
    const opt =
        nonStampFields.some(f => isRequired(f)) ||
        childSlots.some(c => isRequired(c) && !isAutoStampSlot(c, nodeMap)) ? '' : '?'
    const typeName = node.typeName
    const lines: string[] = []
    const { inputType, returnType, inputOptional } = buildBranchSignatureParts(node, factory, opt)
    lines.push(`export function ${fn}(input${opt}: ${inputType}): ${returnType} {`)
    if (fields.length > 0) {
        emitBranchNodeDataPassthrough(lines, inputOptional, returnType)
        const neName = (f: AssembledField) => `_ne_${f.propertyName}`
        // Keyword-presence fields (boolean / bitflag) are NOT array-shaped on
        // the factory's Config surface — they're a `Bitflag<Const, T>` /
        // `BooleanKeyword<T>` brand. Skip the non-empty hoist for those even
        // when the underlying values are repeat1, otherwise we generate a
        // `_ne_X` array hoist + `_assertNonEmpty` call against a non-array.
        const needsNonEmptyHoist = (f: AssembledField): boolean =>
            isNonEmpty(f) && isMultiple(f) && keywordPresenceKind(f, nodeMap) === null
        for (const f of fields) {
            if (isAutoStampField(f, nodeMap)) continue  // factory stamps these; no Config slot
            if (needsNonEmptyHoist(f)) {
                const call = resolveFieldFromTypedInput(f, nodeMap, typeName, intern, 'input', inputOptional)
                lines.push(`  const ${neName(f)} = ${call};`)
                lines.push(`  _assertNonEmpty(${neName(f)}, '${node.kind}.${f.propertyName}');`)
            }
        }
        const childrenNonEmpty = childSlots.some(c => isNonEmpty(c))
        if (childSlots.length > 0 && childrenNonEmpty) {
            emitNonEmptyChildrenHoist(lines, childSlots, nodeMap, typeName, intern, inputOptional, node.kind)
        }
        lines.push(`  return ${factory}({`)
        for (const f of fields) {
            if (isAutoStampField(f, nodeMap)) continue  // factory stamps these; no Config slot
            if (needsNonEmptyHoist(f)) {
                lines.push(`    ${f.propertyName}: ${neName(f)},`)
            } else {
                lines.push(`    ${f.propertyName}: ${resolveFieldFromTypedInput(f, nodeMap, typeName, intern, 'input', inputOptional)},`)
            }
        }
        if (childSlots.length > 0) {
            emitBranchChildrenEntry(lines, childSlots, nodeMap, typeName, intern, inputOptional, childrenNonEmpty)
        }
        lines.push('  });')
    } else {
        // No fields: pass-through to the factory with a boundary cast — the
        // Loose input shape is wider than the factory's strict Config, but the
        // structural overlap (children + leaf shape) is enough at runtime.
        lines.push(`  return ${factory}(input as Parameters<typeof ${factory}>[0]);`)
    }
    lines.push('}')
    return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Container from() — accepts element args OR a self NodeData
// ---------------------------------------------------------------------------

interface ContainerFromNode {
    readonly kind: string
    readonly typeName: string
    readonly rawFactoryName?: string
    readonly fromFunctionName?: string
    readonly children: readonly { readonly values: readonly NodeOrTerminal[] }[]
}

/**
 * Emits the repeated-children variant of a container from() function, using
 * rest-parameter spread syntax.
 *
 * @remarks
 * Singular-child containers take one positional arg (`child?: T`); repeated-
 * child containers take `...children: T[]`. The from function has to match
 * the factory's signature at the call sites it forwards to.
 *
 * `data.$children` is undefined for empty collections that readNode represents
 * without a children array (e.g. python `format_specifier` for `:2` — the
 * colon gets promoted to a field, no children). Spreading `undefined` throws;
 * guard with `?? []` so the rebuilt factory call matches the empty form.
 *
 * @param fn - The `fromX` function name to emit.
 * @param factory - The `F.<factoryName>` reference string.
 * @param tName - The `T.<TypeName>` reference string.
 * @param childType - The `NonNullable<T.<TypeName>.Config['children']>` type string.
 * @param elementType - The `${childType}[number]` element type string.
 * @param kind - The grammar kind string for the self-NodeData check.
 * @returns The emitted function source string.
 */
function emitRepeatedContainerFrom(
    fn: string,
    factory: string,
    tName: string,
    _childType: string,
    elementType: string,
    kind: string,
): string {
    // The accepted-input union allows callers to hand back an existing
    // <kind> NodeData OR a flat list of element children. The single-arg
    // self-NodeData path unwraps `$children`; otherwise every item must
    // already be an element. The `as readonly ${elementType}[]` assertion
    // funnels the post-guard input into the factory's accepted shape — at
    // this point any `${tName}` element has been ruled out by structural
    // selection (the only way to land here with the union is a single
    // self-NodeData first arg, handled above). The unwrap branch's
    // `data.$children` is typed as `readonly NodeChildValue[]` (the loose
    // generic shape on `AnyNodeData`); the same boundary cast funnels it
    // into the factory's narrow children-element type.
    return [
        `export function ${fn}(...input: readonly (${elementType} | ${tName})[]) {`,
        `  if (input.length === 1 && isNodeData(input[0]) && input[0].$type === '${kind}') {`,
        `    const data = input[0];`,
        `    return ${factory}(...((data.$children ?? []) as readonly ${elementType}[]));`,
        `  }`,
        `  return ${factory}(...(input as readonly ${elementType}[]));`,
        '}',
    ].join('\n')
}

/**
 * Emits the singular-child variant of a container from() function.
 *
 * @remarks
 * Casts the extracted single child all the way to the element type — the
 * container factory requires a non-nullable element when the grammar says
 * the child is required, and we can't express "indexed access on a non-null
 * tuple" through ConfigOf without pushing casts downstream.
 *
 * Empty collections (e.g. python `()` / `[]`) have no named children —
 * readNode promotes `(` / `)` / `[` / `]` into fields and produces no
 * `children`. Calling `factory(undefined)` rebuilds the empty form;
 * indexing `children[0]` in that case throws "Cannot read properties of
 * undefined (reading '0')".
 *
 * @param fn - The `fromX` function name to emit.
 * @param factory - The `F.<factoryName>` reference string.
 * @param tName - The `T.<TypeName>` reference string.
 * @param childType - The `NonNullable<T.<TypeName>.Config['children']>` type string.
 * @param elementType - The `${childType}[number]` element type string.
 * @param kind - The grammar kind string for the self-NodeData check.
 * @returns The emitted function source string.
 */
function emitSingularContainerFrom(
    fn: string,
    factory: string,
    tName: string,
    _childType: string,
    elementType: string,
    kind: string,
): string {
    // The factory's child parameter inferred type may be required or optional
    // depending on grammar shape. Cast at the boundary funnels both shapes
    // through one assertion so the emitter doesn't have to track which form
    // each kind maps to. Runtime behaviour: required factories will throw
    // on `undefined`, matching the unwrap path's "missing children" diagnostic.
    return [
        `export function ${fn}(input?: ${elementType} | ${tName}) {`,
        `  if (isNodeData(input) && input.$type === '${kind}') {`,
        `    const data = input;`,
        `    const child = data.$children ? data.$children[0] : undefined;`,
        `    return ${factory}(child as Parameters<typeof ${factory}>[0]);`,
        `  }`,
        // Post-guard `input` is necessarily an `${elementType}` (the self-
        // NodeData branch is the only path the union's `${tName}` arm
        // could reach this function through). Narrow at the boundary.
        `  return ${factory}(input as Parameters<typeof ${factory}>[0]);`,
        '}',
    ].join('\n')
}

function emitContainerFrom(node: ContainerFromNode): string {
    const fn = node.fromFunctionName!
    const factory = `F.${node.rawFactoryName!}`
    const tName = `T.${node.typeName}`
    const childType = `NonNullable<T.${node.typeName}.Config['children']>`
    const elementType = `${childType}[number]`
    const childrenMultiple = node.children.some(c => isMultiple(c))
    if (childrenMultiple) {
        return emitRepeatedContainerFrom(fn, factory, tName, childType, elementType, node.kind)
    }
    return emitSingularContainerFrom(fn, factory, tName, childType, elementType, node.kind)
}

// ---------------------------------------------------------------------------
// Polymorph from() — dispatcher + inline per-form resolvers
// ---------------------------------------------------------------------------

interface PolymorphFromNode {
    readonly kind: string
    readonly typeName: string
    readonly fromInputTypeName: string
    readonly rawFactoryName?: string
    readonly fromFunctionName?: string
    readonly forms: AssembledGroup[]
    /** Polymorph source — drives `$variant` inference when callers pass
     *  Loose input without stamping the discriminator. */
    readonly source: 'override' | 'promoted'
    /** For `source='override'` only: the variant-child kind names, index-
     *  aligned with `forms` (via `assemble.ts`). Zipped into the
     *  generated `childKind → formName` switch in the from dispatcher. */
    readonly variantChildKinds?: readonly string[]
}

/**
 * Emits the top-level polymorph dispatcher function that accepts a loose
 * input and delegates to the factory's runtime field-presence dispatch.
 *
 * @remarks
 * The polymorph factory takes the strict config-union but `input` is a
 * FromInputOf (loose widening). The two types are structurally incompatible
 * at the type level, so the emitter declares an explicit overload — `fromX`
 * takes the loose input externally, delegates to the factory via a single
 * direct `as` (no `unknown` bridge), and lets the factory's runtime
 * field-presence check handle the dispatch. We spell the target as the
 * literal `ConfigOf<FormN> | ...` union rather than `Parameters<typeof fn>[0]`
 * because grammar kinds named `Parameters` would shadow TypeScript's
 * built-in `Parameters<T>`.
 *
 * Polymorph form configs use the legacy `<FormName>Config` alias — polymorph
 * forms don't get namespace sugar (they're synthetic kinds that aren't in the
 * top-level NamespaceMap; their data interface is emitted but not the per-kind
 * namespace block).
 *
 * @param fn - The `fromX` function name to emit.
 * @param factory - The `F.<factoryName>` reference string.
 * @param typeName - The node's type name.
 * @param forms - The polymorph form descriptors for the config union.
 * @returns The emitted dispatcher function source string.
 */
function emitPolymorphDispatcher(
    fn: string,
    factory: string,
    typeName: string,
    _forms: AssembledGroup[],
    _source: 'override' | 'promoted',
    _variantChildKinds: readonly string[] | undefined,
): string {
    const inputType = `T.${typeName}.Loose`
    // Same passthrough widening as `buildBranchSignatureParts` — see comment
    // there for rationale.
    const returnType = `ReturnType<typeof ${factory}> | T.${typeName}`
    const lines: string[] = []
    lines.push(`export function ${fn}(input?: ${inputType}): ${returnType} {`)
    lines.push(`  if (input !== undefined && isNodeData(input)) return input;`)
    // `$variant` is the authoritative discriminator. Callers must
    // supply it (ConfigOf<T.Polymorph> requires it in the type) or
    // obtain it via `readTreeNode`, which stamps it from parse-tree
    // truth. This dispatcher does NOT infer — passing Loose input
    // without `$variant` is a type error; a runtime call that
    // bypasses types hits the factory's throw.
    lines.push(`  return ${factory}(input as Parameters<typeof ${factory}>[0]);`)
    lines.push('}')
    return lines.join('\n')
}

/**
/**
 * Determines whether a polymorph form's `input` parameter should be optional
 * or required, and emits the per-form from() function.
 *
 * @remarks
 * Matches the form factory's parameter optionality: the factory declares
 * `config:` (required) when any field OR child slot is required. T063 inlining
 * can push a required child onto a form that previously had only optional
 * fields. Passing an optional `input?` where the factory wants a required arg
 * fails the type check.
 *
 * Typed direct reads — `input` is the strict form-config alias, every field
 * property is already typed correctly.
 *
 * @param form - The polymorph form descriptor.
 * @param nodeMap - The assembled node map.
 * @param intern - Kind-list interner.
 * @returns The emitted per-form from() function source string.
 */
function emitPolymorphFormFrom(
    form: AssembledGroup,
    nodeMap: NodeMap,
    intern: KindInterner,
): string {
    const formFn = `${form.typeName.charAt(0).toLowerCase()}${form.typeName.slice(1)}From`
    const formFactory = `F.${form.rawFactoryName!}`
    // Auto-stamp fields are always `required` but have no Config slot — exclude them.
    // Auto-stamp-eligible children also excluded: factory stamps them directly.
    const formNonStampFields = form.fields.filter(fd => !isAutoStampField(fd, nodeMap))
    const hoist = resolveHoistedForm(form, nodeMap)
    const hoistedNonStampFields = hoist
        ? hoist.innerFields.filter(fd => !isAutoStampField(fd, nodeMap))
        : []
    const formOpt =
        formNonStampFields.some(fd => isRequired(fd)) ||
        hoistedNonStampFields.some(fd => isRequired(fd)) ||
        form.children.some(c => isRequired(c) && !isAutoStampSlot(c, nodeMap)) ? '' : '?'
    const fLines: string[] = []
    const formInputOptional = formOpt === '?'
    // Form `.from()` input omits `$variant` — see resolveConfigType
    // in emitters/factories.ts for the rationale (forms stamp, they
    // don't accept).
    fLines.push(`export function ${formFn}(input${formOpt}: Omit<ConfigOf<T.${form.typeName}>, '$variant'>) {`)
    const hasFormFields = form.fields.length > 0
    const hasHoistedFields = hoist && hoist.innerFields.length > 0
    if (hasFormFields || hasHoistedFields) {
        fLines.push(`  return ${formFactory}({`)
        // Form-level fields (always Config keys at the form's surface).
        for (const f of form.fields) {
            if (isAutoStampField(f, nodeMap)) continue
            fLines.push(`    ${f.propertyName}: ${resolveFieldFromTypedInput(f, nodeMap, form.typeName, intern, 'input', formInputOptional, /* isPolymorphForm */ true)},`)
        }
        // Hoisted inner-child fields surface flat on the form's Config —
        // mirror what factories.ts does. Resolution uses the inner field's
        // shape so node-ref / leaf / many semantics still apply.
        if (hoist) {
            for (const f of hoist.innerFields) {
                if (isAutoStampField(f, nodeMap)) continue
                fLines.push(`    ${f.propertyName}: ${resolveFieldFromTypedInput(f, nodeMap, hoist.innerTypeName, intern, 'input', formInputOptional, /* isPolymorphForm */ true)},`)
            }
        }
        fLines.push('  });')
    } else {
        fLines.push(`  return ${formFactory}(input);`)
    }
    fLines.push('}')
    // Rename unused `input` param to `_input` for `no-unused-vars`.
    // Triggers when every form field auto-stamps — the loop body
    // emitted nothing, so the factory call is `{}` and `input` is
    // never read. The public type signature stays the same; only
    // the binding name changes.
    const header = fLines[0]!
    const body = fLines.slice(1).join('\n')
    if (!/\binput\b/.test(body)) {
        fLines[0] = header.replace(/\binput(\??:)/, '_input$1')
    }
    return fLines.join('\n')
}

function emitPolymorphFrom(node: PolymorphFromNode, nodeMap: NodeMap, intern: KindInterner): string {
    const fn = node.fromFunctionName!
    const factory = `F.${node.rawFactoryName!}`
    const dispatcher = emitPolymorphDispatcher(fn, factory, node.typeName, node.forms, node.source, node.variantChildKinds)
    const parts = [dispatcher]
    for (const form of node.forms) {
        parts.push(emitPolymorphFormFrom(form, nodeMap, intern))
    }
    return parts.join('\n\n')
}

// ---------------------------------------------------------------------------
// Leaf / enum from() — `string | NodeData` passthrough
// ---------------------------------------------------------------------------

interface LeafFromNode {
    readonly typeName: string
    readonly rawFactoryName?: string
    readonly fromFunctionName?: string
    /** Enum value list when the underlying node is an enum. */
    readonly enumValues?: readonly string[]
}

function emitStringLikeFrom(node: LeafFromNode): string {
    const fn = node.fromFunctionName!
    const factory = `F.${node.rawFactoryName!}`
    return [
        `export function ${fn}(input: string | T.${node.typeName}) {`,
        // `isNodeData` does not negative-narrow `Terminal<K, V>` out of the
        // input union (TS structural-Exclude limitation), so the
        // `typeof === 'string'` test is what funnels the post-guard branch
        // to the factory's `string` parameter.
        `  if (typeof input !== 'string') return input;`,
        // Enum-leaf factories declare a narrow string-literal union for
        // their text parameter; the from() entry point accepts arbitrary
        // strings and the factory's runtime guard catches invalid values.
        // Cast at the boundary funnels the `string` to the narrow shape.
        `  return ${factory}(input as Parameters<typeof ${factory}>[0]);`,
        '}',
    ].join('\n')
}

// ---------------------------------------------------------------------------
// Keyword from() — NodeData passthrough or zero-arg factory
// ---------------------------------------------------------------------------

function emitKeywordFrom(node: LeafFromNode): string {
    const fn = node.fromFunctionName!
    const factory = `F.${node.rawFactoryName!}`
    return [
        `export function ${fn}(input?: T.${node.typeName}) {`,
        `  if (isNodeData(input)) return input;`,
        `  return ${factory}();`,
        '}',
    ].join('\n')
}

// ---------------------------------------------------------------------------
// Field-level resolver call generation
// ---------------------------------------------------------------------------

/** Interner signature passed through the resolver emitter calls. */
type KindInterner = (kinds: readonly string[]) => string

/**
 * Build a field-resolver call that reads a single camelCase property
 * directly off a typed FromInput bag (`input?.fieldName`). Typed
 * access flows the FromInput's per-field type into the resolver's
 * generic slot — no `_f` normalize, no index-signature widening. Used
 * by branch / polymorph-form `fromX` bodies after the top-level kind
 * discriminator has already handed back any pre-built node.
 */
function resolveFieldFromTypedInput(
    field: AssembledField,
    nodeMap: NodeMap,
    parentTypeName: string,
    intern: KindInterner,
    sourceVar: string,
    inputOptional: boolean,
    /** Polymorph forms use `<TypeName>Config` legacy alias. */
    isPolymorphForm = false,
): string {
    // parentTypeName / isPolymorphForm are retained for signature stability
    // with callers; prior implementation used them to build an explicit
    // `<NonNullable<T.X.Config['y']>>` type arg on the resolver call. Those
    // type args were stripped in a follow-up to the from-cleanup pass —
    // TS now infers the slot type from parameters / call context.
    void parentTypeName
    void isPolymorphForm
    /**
     * Per spec 008 US3 / FR-023: single-access camelCase read on the bag
     * branch. After the isNodeData identity quick-return at resolver entry,
     * the resolver body runs only for loose-bag input, which carries the
     * camelCase property directly. No cast — if the typed input union
     * doesn't expose the camelCase property at this position that is a
     * real type error, not something to paper over.
     */
    const optChain = inputOptional ? '?' : ''
    const access = `${sourceVar}${optChain}.${field.propertyName}`
    return resolveFieldCall(access, field, isMultiple(field), nodeMap, intern)
}

/**
 * Build a resolver call for a branch's `children` slot. Each loose
 * child element is pushed through the same `_resolveMany` /
 * `_resolveOne` pipeline as field values — strings get factoried,
 * `{kind,...}` objects get dispatched, nested config bags get
 * reconstructed. Produces a typed `readonly T[]` that the factory
 * can accept directly, no sideways cast.
 */
function resolveChildrenFromTypedInput(
    childSlots: readonly AssembledChild[],
    nodeMap: NodeMap,
    parentTypeName: string,
    intern: KindInterner,
    sourceVar: string,
    inputOptional: boolean,
): string {
    // parentTypeName retained for signature stability with callers; prior
    // implementation used it to build an explicit
    // `<NonNullable<T.X.Config['children']>>` type arg on the resolver call.
    // Call-site type args were stripped — TS infers from parameters.
    void parentTypeName
    const seenTypes = new Set<string>()
    const mergedValues: NodeOrTerminal[] = []
    let anyMultiple = false
    for (const c of childSlots) {
        if (isMultiple(c)) anyMultiple = true
        for (const v of c.values) {
            if (!isNodeRef(v)) continue
            const kindName = isUnresolvedRef(v.node) ? v.node.name : v.node.kind
            if (!seenTypes.has(kindName)) {
                seenTypes.add(kindName)
                mergedValues.push(v)
            }
        }
    }
    /**
     * `resolveFieldCall` reads `values` and uses `isMultiple()` on the
     * passed slot shape — construct a minimal shape that satisfies that
     * contract rather than wiring a parallel children-resolver.
     */
    const pseudo = { values: mergedValues } as { values: readonly NodeOrTerminal[] }
    // Direct bag access — same pattern as field reads.
    const optChain = inputOptional ? '?' : ''
    const access = `${sourceVar}${optChain}.children`
    // ADR-0012: children slots never adopt the boolean-keyword /
    // bitflag surface — the Config key is `children`, not the keyword
    // name. Skip the short-circuit here.
    //
    // Element-type override is intentionally omitted: children slots are
    // typed as tuples `readonly [X]` or arrays `readonly X[]` at the
    // factory's Config surface, while a per-element override forces the
    // resolver's `T` to the singular `X` — TS then complains about the
    // tuple slot. Letting TS infer `T` from the assignment context
    // propagates the correct tuple/array shape through.
    return resolveFieldCall(access, pseudo, anyMultiple, nodeMap, intern, /* applyKeywordPresence */ false)
}

/**
 * Expands supertype references in a field's content types to their concrete
 * subtypes, deduplicating the result.
 *
 * @remarks
 * A content entry whose kind is a supertype in the NodeMap expands to that
 * supertype's declared subtypes — the resolver works at the concrete kind
 * layer, so dispatching through a supertype literal would never match
 * anything. Expansion also lets T042i reach for the named `_super_<name>`
 * dedup entry since the interner keys on the full subtype set.
 *
 * Deduplication is applied after expansion: contentTypes may legitimately
 * contain a supertype AND one of its concrete subtypes (e.g. `_expression`
 * and `range_expression` can both appear on the same field), and the
 * expansion would otherwise surface the concrete kind twice.
 *
 * @param contentTypes - The raw content types from the field.
 * @param nodeMap - The assembled node map (used to look up supertype subtypes).
 * @returns Deduplicated list of concrete kind strings.
 */
function expandAndDedupeContentTypes(contentTypes: readonly string[], nodeMap: NodeMap): string[] {
    const seen = new Set<string>()
    const expanded: string[] = []
    for (const t of contentTypes) {
        const n = nodeMap.nodes.get(t)
        const items = n?.modelType === 'supertype' ? n.subtypes : [t]
        for (const item of items) {
            if (seen.has(item)) continue
            seen.add(item)
            expanded.push(item)
        }
    }
    return expanded
}

/**
 * Classifies a list of concrete kind strings into leaf kinds and branch kinds
 * for resolver dispatch.
 *
 * @remarks
 * Anonymous tokens have no factory binding and are skipped. Unknown kinds
 * (not in the node map) are treated as branch kinds so they go through
 * `_resolveByKind`.
 *
 * @param expanded - Concrete kind strings (already deduplicated / supertype-expanded).
 * @param nodeMap - The assembled node map.
 * @returns Object with `leafKinds` and `branchKinds` arrays.
 */
function classifyKindsForResolver(
    expanded: string[],
    nodeMap: NodeMap,
): { leafKinds: string[]; branchKinds: string[] } {
    const leafKinds: string[] = []
    const branchKinds: string[] = []
    for (const t of expanded) {
        const n = nodeMap.nodes.get(t)
        if (!n) {
            // Unknown kind — treat as branch so it goes through _resolveByKind
            branchKinds.push(t)
            continue
        }
        switch (n.modelType) {
            case 'leaf':
            case 'enum':
            case 'keyword':
                leafKinds.push(t)
                break
            case 'token':
                // Anonymous tokens have no factory binding — skip.
                break
            case 'supertype':
            case 'branch':
            case 'container':
            case 'polymorph':
            case 'group':
                branchKinds.push(t)
                break
        }
    }
    return { leafKinds, branchKinds }
}

/**
 * Selects the single-kind fast-path resolver call when dispatch reduces to
 * exactly one possible target kind.
 *
 * @remarks
 * When there is only one possible target, skip the generic `_resolveOne` /
 * `_resolveMany` entry point (which iterates the leafKinds / branchKinds
 * arrays) and emit a direct specialized call. Removes one function-call
 * layer + array-iteration dispatch per field read at runtime.
 *
 * Call sites no longer carry an explicit `<T>` type argument — TS infers
 * the slot type from the parameter type / return context at the assignment.
 * The per-call-site `NonNullable<T.X.Config['y']>` ceremony was orphaned
 * after the earlier from-cleanup pass removed the `as X` casts it paired with.
 *
 * @param prop - The property access expression string.
 * @param leafKinds - Classified leaf kind names.
 * @param branchKinds - Classified branch kind names.
 * @param fieldMultiple - Whether the slot accepts multiple values.
 * @returns The fast-path call string, or `undefined` if there is more than one kind.
 */
function buildSingleKindFastPath(
    prop: string,
    leafKinds: string[],
    branchKinds: string[],
    fieldMultiple: boolean,
    elementType?: string,
): string | undefined {
    const total = leafKinds.length + branchKinds.length
    if (total !== 1) return undefined
    const kindName = leafKinds[0] ?? branchKinds[0]!
    const isLeaf = leafKinds.length === 1
    const specialized = fieldMultiple
        ? (isLeaf ? '_resolveManyLeaf' : '_resolveManyBranch')
        : (isLeaf ? '_resolveOneLeaf' : '_resolveOneBranch')
    const tArg = elementType ? `<${elementType}>` : ''
    return `${specialized}${tArg}(${prop}, ${JSON.stringify(kindName)})`
}

/**
 * Emits a T042i interned-array resolver call, referring to module-scoped
 * constants instead of repeating literal arrays at every call site.
 *
 * @remarks
 * Duplicated entries collapse to a single module-scoped `_KN = [...]` decl
 * or `_super_<name>` when the list matches a supertype exactly.
 *
 * Call sites no longer carry an explicit `<T>` type argument — TS infers
 * the slot type from the parameter type / return context at the assignment.
 *
 * @param prop - The property access expression string.
 * @param leafKinds - Classified leaf kind names.
 * @param branchKinds - Classified branch kind names.
 * @param fieldMultiple - Whether the slot accepts multiple values.
 * @param intern - Kind-list interner.
 * @returns The resolver call string with interned array references.
 */
function buildInternedArrayResolverCall(
    prop: string,
    leafKinds: string[],
    branchKinds: string[],
    fieldMultiple: boolean,
    intern: KindInterner,
    elementType?: string,
): string {
    const leafArr = intern(leafKinds)
    const branchArr = intern(branchKinds)
    const helper = fieldMultiple ? '_resolveMany' : '_resolveOne'
    // Explicit `<T>` type arg when an element type is known — TS does not
    // reliably infer the slot type from the assignment context for these
    // generic helpers, so call sites that have field metadata provide it.
    const tArg = elementType ? `<${elementType}>` : ''
    return `${helper}${tArg}(${prop}, ${leafArr}, ${branchArr})`
}

/**
 * Resolve an AssembledField's element type to a concrete TS type expression
 * for the from() surface — each resolved node kind is prefixed with `T.` so
 * the reference resolves against the `import * as T from './types.js'` import.
 *
 * Mirrors `factories.ts::fieldElementType` and delegates to the shared
 * {@link fieldTypeComponents} walker so node-ref / literal / alias-source
 * / hidden-keyword / missing-kind handling stays in one place.
 */
function fieldElementType(f: AssembledField, nodeMap: NodeMap): string {
    const literals = slotLiteralValues(f)
    const kindNames = slotKindNames(f)
    if (literals.length > 0 && kindNames.length === 0) {
        return literals.map(v => JSON.stringify(v)).join(' | ')
    }
    if (kindNames.length === 0 && literals.length === 0) return 'string'
    const components = fieldTypeComponents(f, nodeMap)
    const parts: string[] = []
    for (const comp of components) {
        if (comp.kind === 'literal') {
            parts.push(JSON.stringify(comp.value))
        } else if (comp.kind === 'nodeKind') {
            parts.push(isValidIdent(comp.value) ? `T.${comp.value}` : JSON.stringify(comp.rawKind))
        } else {
            parts.push(`T.${comp.value}`)
        }
    }
    return [...new Set(parts)].join(' | ')
}

function resolveFieldCall(
    prop: string,
    field: { values: readonly NodeOrTerminal[] },
    fieldMultiple: boolean,
    nodeMap: NodeMap,
    intern: KindInterner,
    /** When true, ADR-0012 keyword-presence short-circuit applies.
     * Children slots (the merged-values pseudo shape) skip it because
     * the Config surface there is `children`, not the keyword name — a
     * boolean-keyword classifier match on a children slot is coincidental
     * and should not route through _resolveBooleanKeyword. */
    applyKeywordPresence = true,
    /** Pre-computed element type expression for the explicit `<T>` type
     * argument on the resolver call. When omitted, falls back to deriving
     * from the field shape (only possible when `field` is an `AssembledField`). */
    elementTypeOverride?: string,
): string {
    // ADR-0012: short-circuit keyword-presence fields through dedicated
    // resolvers. Boolean / bitflag inputs must NOT get routed through the
    // leaf-literal registry (a `true` on a boolean-keyword field is a
    // presence marker, not a boolean_literal node).
    if (applyKeywordPresence) {
        const kwCall = keywordPresenceResolverCall(prop, field, nodeMap)
        if (kwCall !== undefined) return kwCall
    }

    const expanded = expandAndDedupeContentTypes(slotKindNames(field), nodeMap)
    const { leafKinds, branchKinds } = classifyKindsForResolver(expanded, nodeMap)

    // Pass an explicit element type when we have one — `resolveFieldCall` is
    // also invoked with merged children pseudo-fields (no AssembledField
    // shape), so prefer an override when supplied; otherwise derive from the
    // AssembledField when present.
    const elementType = elementTypeOverride
        ?? ('name' in field ? fieldElementType(field as AssembledField, nodeMap) : undefined)

    const fastPath = buildSingleKindFastPath(prop, leafKinds, branchKinds, fieldMultiple, elementType)
    if (fastPath !== undefined) return fastPath

    return buildInternedArrayResolverCall(prop, leafKinds, branchKinds, fieldMultiple, intern, elementType)
}

/**
 * Emit the resolver call string for a keyword-presence field (ADR-0012).
 *
 * Returns `undefined` when the field isn't a keyword-presence pattern
 * (caller falls through to the default resolver).
 */
function keywordPresenceResolverCall(
    prop: string,
    field: { values: readonly NodeOrTerminal[] },
    nodeMap: NodeMap,
): string | undefined {
    const kw = keywordPresenceKind(field as AssembledField, nodeMap)
    if (kw === null) return undefined
    if (kw === 'boolean') return `_resolveBooleanKeyword(${prop})`
    // bitflag — pass through; the factory handles number expansion via _bf.
    return `_resolveBitflag(${prop})`
}

// ---------------------------------------------------------------------------
// Module-scoped resolver helpers (emitted into generated from.ts)
// ---------------------------------------------------------------------------

/**
 * Builds the leaf registry entries from NodeMap leaves, keywords, and enums.
 *
 * @remarks
 * Enum factories declare their parameter as a literal union at the type
 * level but the factory's runtime guard accepts any string and throws on
 * invalid values. The registry slot declares the factory as `(text: string)`
 * so the enum's narrower signature is exposed through a thin closure — no
 * cast at the call site, runtime guard still catches invalid input.
 *
 * @param nodeMap - The assembled node map.
 * @returns Array of registry entry source strings to push into the `_leafRegistry` literal.
 */
function buildLeafRegistryEntries(nodeMap: NodeMap): string[] {
    const registryEntries: string[] = []
    for (const [kind, node] of nodeMap.nodes) {
        if (kind.startsWith('_')) continue
        if (!node.rawFactoryName) continue
        const factory = `F.${node.rawFactoryName}`
        if (node.modelType === 'enum') {
            const values = node.values.map(v => JSON.stringify(v)).join(', ')
            // Enum factories declare a narrow string-literal union for `text`,
            // but the registry slot is `(text: string)` (the runtime guard
            // catches invalid input). Cast at the boundary so the wrapper
            // signature stays uniform.
            registryEntries.push(`  ${JSON.stringify(kind)}: { values: [${values}], factory: (text: string) => ${factory}(text as Parameters<typeof ${factory}>[0]) },`)
        } else if (node.modelType === 'keyword') {
            registryEntries.push(`  ${JSON.stringify(kind)}: { values: [${JSON.stringify(node.text)}], factory: () => ${factory}() },`)
        } else if (node.modelType === 'leaf') {
            registryEntries.push(`  ${JSON.stringify(kind)}: { factory: ${factory} },`)
        }
    }
    return registryEntries
}

/**
 * Emits the `_resolveByKind` generic helper into generated from.ts.
 *
 * @remarks
 * Generic over the kind literal so the return type is the precise
 * `ReturnType<_FromMap[K]>` — each per-kind factory's output flows through,
 * not a widened `AnyNodeData` union. Callers pass a narrow kind (string-
 * literal from the field's content types or narrowed via an `in`-check
 * against `_fromMap`) to get the specific return shape back. The internal
 * sideways cast routes around per-slot parameter variance without going
 * through `unknown` / `any`.
 *
 * @param lines - Output lines array to push into.
 */
function emitResolveByKindHelper(lines: string[]): void {
    // Type guard for keyof _FromMap so `kind in _fromMap` checks elsewhere
    // narrow the string parameter without an unchecked cast.
    lines.push('function _isFromKind(k: string): k is keyof _FromMap {')
    lines.push('  return k in _fromMap;')
    lines.push('}')
    lines.push('')
    lines.push('function _resolveByKind<K extends keyof _FromMap>(')
    lines.push('  kind: K,')
    lines.push('  rest: _FromFieldInput,')
    lines.push('): ReturnType<_FromMap[K]> {')
    lines.push('  const fn = _fromMap[kind] as (rest: _FromFieldInput) => ReturnType<_FromMap[K]>;')
    lines.push('  return fn(rest);')
    lines.push('}')
    lines.push('')
}

/**
 * Determines the scalar resolver parameter name, prefixing with `_` when
 * the grammar has no scalar leaf kinds to satisfy the oxlint unused-variable
 * convention.
 *
 * @remarks
 * When the grammar declares no scalar leaf kinds the function body is empty —
 * prefixing the parameter with `_` prevents oxlint from flagging it. Callers
 * still pass arguments; the `_` is a lint convention only.
 *
 * @param hasBool - Whether the grammar has a `boolean_literal` kind.
 * @param hasInt - Whether the grammar has an integer literal kind.
 * @param hasFloat - Whether the grammar has a float literal kind.
 * @returns The parameter name string: `'v'` or `'_v'`.
 */
function resolveScalarParamName(hasBool: boolean, hasInt: boolean, hasFloat: boolean): string {
    return hasBool || hasInt || hasFloat ? 'v' : '_v'
}

/**
 * Emits the `_resolveOne` generic helper into generated from.ts.
 *
 * @remarks
 * Resolvers are emitted with a `<T>` type parameter so the call site can
 * name the expected slot shape (`_resolveOne<FunctionItem>`); no `extends`
 * constraint because the factory-emitted node interfaces don't all
 * structurally satisfy `AnyNodeData` (they omit the `named` property), and
 * adding such a constraint would force every call site to re-widen. The
 * input is the closed `_FromFieldInput` union so no caller has to cast
 * anything loose.
 *
 * @param lines - Output lines array to push into.
 */
function emitResolveOneHelper(lines: string[]): void {
    // Generic <T> reflects the caller-supplied slot shape. Body branches
    // produce either a factory output, a scalar leaf, a resolved branch,
    // or pass the input through unchanged. Each branch tail asserts to T —
    // the runtime guarantees agree with the assertion: factory outputs
    // satisfy the slot's NodeData shape; scalar/leaf factories produce
    // Terminal<kind, text> matching the leaf interface; resolveByKind
    // dispatches through `_FromMap` whose return type is the slot's
    // factory output. Single-site cast keeps the helper readable; per-call
    // assertions would clutter every consumer.
    lines.push('function _resolveOne<T>(')
    lines.push('  v: _FromFieldInput,')
    lines.push('  leafKinds: readonly string[],')
    lines.push('  branchKinds: readonly string[],')
    lines.push('): T {')
    lines.push('  if (v === undefined || v === null) return v as T;')
    lines.push('  if (isNodeData(v)) return v as T;')
    lines.push('  if (typeof v === "boolean" || typeof v === "number") {')
    lines.push('    const scalar = _resolveScalar(v);')
    lines.push('    if (scalar !== undefined) return scalar as T;')
    lines.push('  }')
    lines.push('  if (typeof v === "string" && leafKinds.length > 0) {')
    lines.push('    const leaf = _resolveLeafString(v, leafKinds);')
    lines.push('    if (leaf !== undefined) return leaf as T;')
    lines.push('  }')
    lines.push('  if (typeof v === "object" && !Array.isArray(v) && "kind" in v) {')
    lines.push('    const { kind, ...rest } = v;')
    lines.push('    if (typeof kind === "string" && _isFromKind(kind)) return _resolveByKind(kind, rest) as T;')
    lines.push('  }')
    lines.push('  if (branchKinds.length === 1 && typeof v === "object" && !Array.isArray(v)) {')
    lines.push('    const bk = branchKinds[0]!;')
    lines.push('    if (_isFromKind(bk)) return _resolveByKind(bk, v) as T;')
    lines.push('  }')
    lines.push('  return v as T;')
    lines.push('}')
    lines.push('')
}

/**
 * Emits the `_assertNonEmpty` runtime guard and static narrowing helper into
 * generated from.ts.
 *
 * @remarks
 * Runtime guard + static narrowing helper for repeat1-sourced list fields.
 * `from()` resolves a loose input to a `readonly T[]` via `_resolveMany*`,
 * but the factory's config slot is the non-empty tuple `readonly [T, ...T[]]`.
 * Calling this assertion on the resolver result narrows the static type to
 * the tuple shape AND throws at runtime if the input was empty.
 *
 * @param lines - Output lines array to push into.
 */
function emitAssertNonEmptyHelper(lines: string[]): void {
    lines.push('function _assertNonEmpty<T>(')
    lines.push('  arr: readonly T[],')
    lines.push('  label: string,')
    lines.push('): asserts arr is readonly [T, ...(readonly T[])] {')
    lines.push('  if (arr.length === 0) {')
    lines.push('    throw new Error(`${label}: requires at least one element`);')
    lines.push('  }')
    lines.push('}')
}

function emitResolverHelpers(lines: string[], nodeMap: NodeMap): void {
    const registryEntries = buildLeafRegistryEntries(nodeMap)

    lines.push('// --- Loose-input resolver helpers (see C6-prereq) ---')
    lines.push('interface _LeafEntry {')
    lines.push('  readonly values?: readonly string[];')
    lines.push('  readonly pattern?: RegExp;')
    lines.push('  readonly factory: (text: string) => AnyNodeData;')
    lines.push('}')
    lines.push('const _leafRegistry: { readonly [kind: string]: _LeafEntry } = {')
    for (const entry of registryEntries) lines.push(entry)
    lines.push('};')
    lines.push('')

    lines.push('function _resolveLeafString(v: string, kinds: readonly string[]): AnyNodeData | undefined {')
    lines.push('  for (const kind of kinds) {')
    lines.push('    const entry = _leafRegistry[kind];')
    lines.push('    if (!entry) continue;')
    lines.push('    if (entry.values && entry.values.includes(v)) return entry.factory(v);')
    lines.push('    if (entry.pattern && entry.pattern.test(v)) return entry.factory(v);')
    lines.push('  }')
    lines.push('  for (const kind of kinds) {')
    lines.push('    const entry = _leafRegistry[kind];')
    lines.push('    if (entry && !entry.values && !entry.pattern) return entry.factory(v);')
    lines.push('  }')
    lines.push('  return undefined;')
    lines.push('}')
    lines.push('')

    emitResolveByKindHelper(lines)

    const hasBool = nodeMap.nodes.has('boolean_literal')
    const hasInt = nodeMap.nodes.has('integer_literal') || nodeMap.nodes.has('integer')
    const hasFloat = nodeMap.nodes.has('float_literal') || nodeMap.nodes.has('float')
    const scalarParam = resolveScalarParamName(hasBool, hasInt, hasFloat)
    lines.push(`function _resolveScalar(${scalarParam}: boolean | number): AnyNodeData | undefined {`)
    if (hasBool) {
        lines.push('  if (typeof v === "boolean") {')
        lines.push('    const e = _leafRegistry["boolean_literal"];')
        lines.push('    return e ? e.factory(v ? "true" : "false") : undefined;')
        lines.push('  }')
    }
    if (hasInt || hasFloat) {
        lines.push('  if (typeof v === "number") {')
        if (hasInt) {
            const intKind = nodeMap.nodes.has('integer_literal') ? 'integer_literal' : 'integer'
            lines.push(`    if (Number.isInteger(v)) {`)
            lines.push(`      const e = _leafRegistry[${JSON.stringify(intKind)}];`)
            lines.push(`      return e ? e.factory(String(v)) : undefined;`)
            lines.push(`    }`)
        }
        if (hasFloat) {
            const floatKind = nodeMap.nodes.has('float_literal') ? 'float_literal' : 'float'
            lines.push(`    const e = _leafRegistry[${JSON.stringify(floatKind)}];`)
            lines.push(`    return e ? e.factory(String(v)) : undefined;`)
        }
        lines.push('  }')
    }
    lines.push('  return undefined;')
    lines.push('}')
    lines.push('')

    emitResolveOneHelper(lines)

    lines.push('function _resolveMany<T>(')
    lines.push('  v: _FromFieldInput,')
    lines.push('  leafKinds: readonly string[],')
    lines.push('  branchKinds: readonly string[],')
    lines.push('): readonly T[] {')
    lines.push('  if (v === undefined || v === null) return [];')
    lines.push('  const arr: readonly _FromFieldInput[] = Array.isArray(v) ? v : [v];')
    lines.push('  return arr.map(e => _resolveOne<T>(e, leafKinds, branchKinds));')
    lines.push('}')
    lines.push('')

    // Single-kind fast paths — resolver call sites with only one
    // possible target dispatch here directly, skipping the leafKinds
    // / branchKinds iteration in _resolveOne.
    lines.push('function _resolveOneLeaf<T>(v: _FromFieldInput, kind: string): T {')
    lines.push('  if (v === undefined || v === null) return v as T;')
    lines.push('  if (isNodeData(v)) return v as T;')
    lines.push('  if (typeof v === "boolean" || typeof v === "number") {')
    lines.push('    const scalar = _resolveScalar(v);')
    lines.push('    if (scalar !== undefined) return scalar as T;')
    lines.push('  }')
    lines.push('  if (typeof v === "string") {')
    lines.push('    const e = _leafRegistry[kind];')
    lines.push('    if (e !== undefined) return e.factory(v) as T;')
    lines.push('  }')
    lines.push('  if (typeof v === "object" && !Array.isArray(v) && "kind" in v) {')
    lines.push('    const { kind: k, ...rest } = v;')
    lines.push('    if (typeof k === "string" && _isFromKind(k)) return _resolveByKind(k, rest) as T;')
    lines.push('  }')
    lines.push('  return v as T;')
    lines.push('}')
    lines.push('')

    lines.push('function _resolveOneBranch<T>(v: _FromFieldInput, kind: string): T {')
    lines.push('  if (v === undefined || v === null) return v as T;')
    lines.push('  if (isNodeData(v)) return v as T;')
    lines.push('  if (typeof v === "object" && !Array.isArray(v)) {')
    lines.push('    if ("kind" in v) {')
    lines.push('      const { kind: k, ...rest } = v;')
    lines.push('      if (typeof k === "string" && _isFromKind(k)) return _resolveByKind(k, rest) as T;')
    lines.push('    }')
    lines.push('    if (_isFromKind(kind)) return _resolveByKind(kind, v) as T;')
    lines.push('  }')
    lines.push('  return v as T;')
    lines.push('}')
    lines.push('')

    lines.push('function _resolveManyLeaf<T>(v: _FromFieldInput, kind: string): readonly T[] {')
    lines.push('  if (v === undefined || v === null) return [];')
    lines.push('  const arr: readonly _FromFieldInput[] = Array.isArray(v) ? v : [v];')
    lines.push('  return arr.map(e => _resolveOneLeaf<T>(e, kind));')
    lines.push('}')
    lines.push('')

    lines.push('function _resolveManyBranch<T>(v: _FromFieldInput, kind: string): readonly T[] {')
    lines.push('  if (v === undefined || v === null) return [];')
    lines.push('  const arr: readonly _FromFieldInput[] = Array.isArray(v) ? v : [v];')
    lines.push('  return arr.map(e => _resolveOneBranch<T>(e, kind));')
    lines.push('}')
    lines.push('')

    // ADR-0012 keyword-presence resolvers — pass-through. For scalar /
    // repeat-of-one booleans the factory inlines
    // `config.x ? '<literal>' : undefined` (no runtime helper); for
    // bitflags the `_bf` helper stamps the NodeData container. The
    // resolver layer only has to refuse the leaf-registry path so a
    // `true` input doesn't get misrouted through `_resolveScalar` into
    // a `boolean_literal` factory call.
    lines.push('function _resolveBooleanKeyword<T>(v: _FromFieldInput): T {')
    lines.push('  if (v === undefined || v === null) return v as T;')
    lines.push('  if (v === true || v === false) return v as T;')
    lines.push('  if (isNodeData(v)) return v as T;')
    lines.push('  if (Array.isArray(v)) return v as T;')
    lines.push('  return v as T;')
    lines.push('}')
    lines.push('')
    lines.push('function _resolveBitflag<T>(v: _FromFieldInput): T {')
    lines.push('  if (v === undefined || v === null) return v as T;')
    lines.push('  if (typeof v === "number") return v as T;')
    lines.push('  if (typeof v === "string") return v as T;')
    lines.push('  if (Array.isArray(v)) return v as T;')
    lines.push('  if (isNodeData(v)) return v as T;')
    lines.push('  return v as T;')
    lines.push('}')
    lines.push('')

    emitAssertNonEmptyHelper(lines)
}
