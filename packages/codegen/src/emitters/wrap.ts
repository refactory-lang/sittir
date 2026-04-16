/**
 * Emits wrap.ts — read-only lazy view layer over readNode output.
 *
 * Mirrors the factory emitter (factories.ts) one-for-one, except
 * each field accessor is a `get` returning `drillIn(data.fields[raw], tree)`
 * instead of a fluent getter/setter method. Nodes returned from `wrap*`
 * are read-only — there are no setters and no render/toEdit/replace
 * surface. To edit a wrapped node, clone it via `ir.${kind}({ ... })`.
 *
 * This emitter consumes NodeMap directly. It reconstructs the
 * OverridesConfig and supertype-expansion map from NodeMap so
 * `buildRoutingMap` can be called once at module load — readNode
 * then does override-field promotion itself, which is why this
 * emitter no longer needs the `promote*` preamble that v1 wrap.ts
 * required.
 */

import type {
    NodeMap, AssembledField, AssembledChild, AssembledNode,
} from '../compiler/rule.ts'
import type { PolymorphVariant } from '../dsl/synthetic-rules.ts'
import type { DerivedOverridesConfig } from '../compiler/derive-overrides-json.ts'

export interface EmitWrapConfig {
    grammar: string
    nodeMap: NodeMap
    /**
     * Pre-derived runtime OverridesConfig (same shape as the legacy
     * `overrides.json`) produced by `deriveOverridesConfig` against the
     * post-Link rule tree. Inlined into the generated `_overrides` so
     * `readNode` sees exactly the routing the compiler computed —
     * including full-replacement override rules and kind-projected
     * (`position: -1`) entries that the narrow `f.source === 'override'`
     * filter would miss. Optional for back-compat; when absent the
     * emitter falls back to the AssembledField-based extraction.
     */
    derivedOverrides?: DerivedOverridesConfig
}

/**
 * Emit `const NAME = { "key1": <value>, "key2": <value>, … }` with one
 * key per line so PR diffs only highlight the changed entry. The
 * value is JSON-stringified compactly — entries are typically routing
 * shape data, so per-key compaction is fine.
 */
function emitObjectPerLine(
    name: string,
    obj: Record<string, unknown>,
    suffix: string = '',
): string[] {
    const keys = Object.keys(obj)
    if (keys.length === 0) return [`const ${name} = {}${suffix};`]
    const lines: string[] = [`const ${name} = {`]
    for (const key of keys) {
        lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(obj[key])},`)
    }
    lines.push(`}${suffix};`)
    return lines
}

/**
 * Same per-line layout for a `Map`-shaped const built via
 * `Object.entries({...})`.
 */
function emitMapPerLine(name: string, obj: Record<string, unknown>): string[] {
    const keys = Object.keys(obj)
    if (keys.length === 0) {
        return [`const ${name} = new Map<string, readonly string[]>();`]
    }
    const lines: string[] = [
        `const ${name} = new Map<string, readonly string[]>(Object.entries({`,
    ]
    for (const key of keys) {
        lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(obj[key])},`)
    }
    lines.push('}));')
    return lines
}

export function emitWrap(config: EmitWrapConfig): string {
    const { nodeMap, derivedOverrides } = config

    // ------------------------------------------------------------------
    // Reconstruct routing inputs from NodeMap
    // ------------------------------------------------------------------
    // Prefer the pre-derived OverridesConfig produced via the shared
    // `deriveOverridesConfig` walker — it captures full-replacement
    // override rules, kind-projected (position: -1) entries, and
    // merged-across-variants field specs that the naive
    // `f.source === 'override'` filter below cannot see. Fall back to
    // the AssembledField extraction when no derived config is provided
    // (older callers; direct unit tests).
    const overrides: Record<string, { fields: Record<string, OverrideFieldSpec> }> = {}
    if (derivedOverrides) {
        for (const [kind, spec] of Object.entries(derivedOverrides)) {
            const overrideFields: Record<string, OverrideFieldSpec> = {}
            for (const [fieldName, fs] of Object.entries(spec.fields)) {
                overrideFields[fieldName] = {
                    types: [...fs.types],
                    multiple: fs.multiple,
                    required: fs.required,
                    position: fs.position,
                }
            }
            if (Object.keys(overrideFields).length > 0) {
                overrides[kind] = { fields: overrideFields }
            }
        }
    } else {
        for (const [kind, node] of nodeMap.nodes) {
            const fields = getNodeFields(node)
            if (fields.length === 0) continue
            const overrideFields: Record<string, OverrideFieldSpec> = {}
            fields.forEach((f, idx) => {
                if (f.source !== 'override') return
                overrideFields[f.name] = {
                    types: f.contentTypes.map(t => ({
                        type: t,
                        named: isNamedKind(t, nodeMap),
                    })),
                    multiple: f.multiple,
                    required: f.required,
                    position: idx,
                }
            })
            if (Object.keys(overrideFields).length > 0) {
                overrides[kind] = { fields: overrideFields }
            }
        }
    }

    // Supertype expansion from NodeMap. `assemble()` resolves hidden
    // rule references (`_type_identifier` → `type_identifier`) and
    // alias targets while building each supertype's subtype list, so
    // the names recorded here already match what tree-sitter reports
    // at parse time. No node-types.json needed.
    const supertypeExpansion: Record<string, string[]> = {}
    for (const [kind, node] of nodeMap.nodes) {
        if (node.modelType !== 'supertype') continue
        if (node.subtypes.length > 0) {
            supertypeExpansion[kind] = [...node.subtypes]
        }
    }

    // Collect type imports for `WrappedNode<T>` return annotations —
    // every kind that gets a `wrap${TypeName}` function contributes
    // its concrete interface.
    const isValidIdent = (s: string) => /^[A-Za-z_$][\w$]*$/.test(s)
    const typeImports = new Set<string>()
    for (const [, node] of nodeMap.nodes) {
        if (!node.rawFactoryName) continue
        if (node.modelType !== 'branch' &&
            node.modelType !== 'container' &&
            node.modelType !== 'polymorph') continue
        if (!isValidIdent(node.typeName)) continue
        typeImports.add(node.typeName)
    }
    // Multi-line import for readability — see factories.ts.
    const typeImportLine = typeImports.size > 0
        ? [
            'import type {',
            ...[...typeImports].sort().map(name => `  ${name},`),
            "} from './types.js';",
        ].join('\n')
        : undefined

    // ------------------------------------------------------------------
    // Preamble
    // ------------------------------------------------------------------
    const lines: string[] = [
        '// Auto-generated by @sittir/codegen — do not edit',
        '// Read-only lazy view layer over readNode output.',
        '',
        "// Minimal structural shape for parsed tree data. Kept local",
        "// to avoid a runtime import of @sittir/types's _NodeData —",
        "// every grammar package is self-contained at the type level.",
        "interface _NodeData {",
        "  readonly type: string;",
        "  readonly fields?: Record<string, unknown>;",
        "  readonly children?: readonly unknown[];",
        "  readonly text?: string;",
        "  readonly nodeId?: number;",
        "}",
        "import { readNode, buildRoutingMap, type TreeHandle } from '@sittir/core';",
        "import type { WrappedNode } from '@sittir/types';",
        ...(typeImportLine ? [typeImportLine] : []),
        '',
        '// Routing data — overrides + supertype expansion reconstructed at',
        '// codegen time from NodeMap, then handed to readNode at module load.',
        '// Emitted one entry per line so PR diffs show only the changed kind.',
        ...emitObjectPerLine('_overrides', overrides as Record<string, unknown>, ' as const'),
        'export { _overrides };',
        ...emitMapPerLine('_supertypeExpansion', supertypeExpansion as Record<string, unknown>),
        'export { _supertypeExpansion };',
        '// Exported so validators / runtime consumers can use the same',
        '// routing the generated wrap/readNode path uses, instead of',
        "// re-reading the legacy `overrides.json` file.",
        'export const _routing = buildRoutingMap(_overrides, _supertypeExpansion);',
        '',
        '// Drill-in helpers — pass _routing to readNode so override field',
        '// promotion happens during hydration, not as a wrap-time fix-up.',
        'function drillIn(entry: unknown, tree: TreeHandle): unknown {',
        '  if (!entry) return undefined;',
        '  const e = entry as _NodeData;',
        '  if (e.nodeId != null) {',
        '    return wrapNode(readNode(tree, e.nodeId, _routing), tree);',
        '  }',
        '  return entry;',
        '}',
        'function drillInAll(entries: unknown, tree: TreeHandle): unknown[] {',
        '  if (!entries) return [];',
        '  const arr = Array.isArray(entries) ? entries : [entries];',
        '  return arr.map(e => drillIn(e, tree));',
        '}',
        '',
    ]

    // ------------------------------------------------------------------
    // Per-kind wrap functions — local dispatch on modelType.
    // ------------------------------------------------------------------
    for (const [, node] of nodeMap.nodes) {
        const source = renderWrapForNode(node, nodeMap)
        if (source === undefined) continue
        lines.push(source)
        lines.push('')
    }

    // ------------------------------------------------------------------
    // _wrapTable — runtime dispatch by kind
    // ------------------------------------------------------------------
    lines.push('const _wrapTable: Record<string, (data: _NodeData, tree: TreeHandle) => unknown> = {')
    for (const [kind, node] of nodeMap.nodes) {
        if (!node.factoryName) continue
        if (node.modelType === 'branch' || node.modelType === 'container' || node.modelType === 'polymorph') {
            lines.push(`  '${kind}': (d, t) => wrap${node.typeName}(d, t),`)
        } else if (node.modelType === 'leaf' || node.modelType === 'enum' || node.modelType === 'keyword') {
            // Terminal nodes have no subtree to drill into — pass through.
            lines.push(`  '${kind}': (d) => d,`)
        }
    }
    lines.push('};')
    lines.push('')

    // ------------------------------------------------------------------
    // Public entry points
    // ------------------------------------------------------------------
    lines.push('/** Wrap a NodeData into its lazy read-only view. */')
    lines.push('export function wrapNode(data: _NodeData, tree: TreeHandle): unknown {')
    lines.push('  const fn = _wrapTable[data.type];')
    lines.push('  if (!fn) return data; // unknown kind — return as-is')
    lines.push('  return fn(data, tree);')
    lines.push('}')
    lines.push('')
    lines.push('/**')
    lines.push(' * Read a parsed tree node into a lazily-wrapped NodeData.')
    lines.push(' * One level deep — getters drill into subtrees on demand.')
    lines.push(' */')
    lines.push('export function readTreeNode(tree: TreeHandle, nodeId?: number): unknown {')
    lines.push('  const data = readNode(tree, nodeId, _routing);')
    lines.push('  return wrapNode(data, tree);')
    lines.push('}')
    lines.push('')

    return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface OverrideFieldSpec {
    types: { type: string; named: boolean }[]
    multiple: boolean
    required: boolean
    position: number
}

/** Extract the field list from any node that carries fields. */
function getNodeFields(node: import('../compiler/rule.ts').AssembledNode): readonly AssembledField[] {
    if (node.modelType === 'branch' || node.modelType === 'group') return node.fields
    if (node.modelType === 'polymorph') {
        // Union the fields across forms. First occurrence wins.
        const seen = new Map<string, AssembledField>()
        for (const form of node.forms) {
            for (const f of form.fields) {
                if (!seen.has(f.name)) seen.set(f.name, f)
            }
        }
        return [...seen.values()]
    }
    return []
}

/**
 * Decide the `named` flag for an override-content kind reference.
 * Anonymous tokens (operator punctuation, hidden grammar tokens) are
 * unnamed; everything else (branches, leaves, keywords, enums,
 * supertypes) is named in tree-sitter's sense.
 */
function isNamedKind(kind: string, nodeMap: NodeMap): boolean {
    const n = nodeMap.nodes.get(kind)
    if (!n) return true // unknown kind — assume named (will route by kind)
    return n.modelType !== 'token'
}

// ---------------------------------------------------------------------------
// Per-node wrap dispatch
// ---------------------------------------------------------------------------

function renderWrapForNode(node: AssembledNode, nodeMap: NodeMap): string | undefined {
    if (!node.rawFactoryName) return undefined

    switch (node.modelType) {
        case 'branch':
            return emitFieldCarryingWrap(node, node.fields, node.children ?? [])
        case 'container':
            return emitFieldCarryingWrap(node, [], node.children)
        case 'polymorph': {
            // Polymorph wraps under the parent kind — union every form's
            // fields so the lazy view exposes any field that might be
            // populated at runtime. First-occurrence wins on duplicate
            // field names.
            const allFields = new Map<string, AssembledField>()
            for (const form of node.forms) {
                for (const f of form.fields) {
                    if (!allFields.has(f.name)) allFields.set(f.name, f)
                }
            }
            const allChildren: AssembledChild[] = []
            for (const form of node.forms) {
                for (const c of form.children) {
                    if (!allChildren.some(existing => existing.name === c.name)) {
                        allChildren.push(c)
                    }
                }
            }
            return emitFieldCarryingWrap(node, [...allFields.values()], allChildren)
        }
        default:
            return undefined
    }
}

// ---------------------------------------------------------------------------
// Nested-alias wrap — flat getters for parent + variant child fields
// ---------------------------------------------------------------------------

function emitNestedAliasWrap(
    parentNode: AssembledNode,
    polymorphVariants: PolymorphVariant[],
    nodeMap: NodeMap,
): string {
    const fn = `wrap${parentNode.typeName}`
    const parentFields = 'fields' in parentNode ? (parentNode as { fields: readonly AssembledField[] }).fields : []
    const lines: string[] = []

    lines.push(`export function ${fn}(data: _NodeData, tree: TreeHandle): WrappedNode<${parentNode.typeName}> {`)
    lines.push('  return {')
    lines.push('    ...data,')

    for (const f of parentFields) {
        const method = f.propertyName === 'type' ? 'typeField' : f.propertyName
        lines.push(`    get ${method}() { return drillIn(data.fields?.['${f.name}'], tree); },`)
    }

    // Variant field getters — drill into the first child's fields
    const seenMethods = new Set(parentFields.map(f => f.propertyName === 'type' ? 'typeField' : f.propertyName))
    for (const pv of polymorphVariants) {
        const fullName = `${pv.parent}_${pv.child}`
        const vNode = nodeMap.nodes.get(fullName)
        if (!vNode) continue
        const vFields = 'fields' in vNode ? (vNode as { fields: readonly AssembledField[] }).fields : []
        for (const vf of vFields) {
            const method = vf.propertyName === 'type' ? 'typeField' : vf.propertyName
            if (seenMethods.has(method)) continue
            seenMethods.add(method)
            lines.push(`    get ${method}() { const c = data.children?.[0]; return c && typeof c === 'object' && 'fields' in (c as Record<string, unknown>) ? drillIn((c as any).fields?.['${vf.name}'], tree) : undefined; },`)
        }
    }

    lines.push(`    get variant() { return drillIn(data.children?.[0], tree); },`)
    lines.push(`    get child() { return drillIn(data.children?.[0], tree); },`)
    lines.push(`  } as unknown as WrappedNode<${parentNode.typeName}>;`)
    lines.push('}')
    return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Field-carrying wrap — lazy drillIn projection over NodeData
// ---------------------------------------------------------------------------

interface WrapNode {
    readonly kind: string
    readonly typeName: string
}

function emitFieldCarryingWrap(
    node: WrapNode,
    fields: readonly AssembledField[],
    children: readonly AssembledChild[],
): string {
    const fn = `wrap${node.typeName}`
    const lines: string[] = []
    // `data` stays structurally typed (`_NodeData`) so the loose
    // `data.fields?.['...']` / `data.children?.[0]` access patterns
    // inside the body still compile — polymorph forms union fields
    // that no single concrete interface carries. The RETURN type
    // narrows to `WrappedNode<T>` so consumers of the wrap function
    // see the concrete camelCase field accessors.
    lines.push(`export function ${fn}(data: _NodeData, tree: TreeHandle): WrappedNode<${node.typeName}> {`)
    lines.push('  return {')
    lines.push('    ...data,')

    for (const f of fields) {
        // Avoid shadowing built-in property names on the returned view.
        const method = f.propertyName === 'type' ? 'typeField' : f.propertyName
        if (f.multiple) {
            lines.push(`    get ${method}() { return drillInAll(data.fields?.['${f.name}'], tree); },`)
        } else {
            lines.push(`    get ${method}() { return drillIn(data.fields?.['${f.name}'], tree); },`)
        }
    }

    // Children slot — always project through drillIn so nested subtrees
    // hydrate lazily. A node with a default children array always
    // exposes `children`; specialised single-child containers expose
    // `child`.
    if (children.length > 0) {
        const anyMultiple = children.some(c => c.multiple)
        if (anyMultiple) {
            lines.push(`    get children() { return (data.children ?? []).map(c => drillIn(c, tree)); },`)
        } else {
            lines.push(`    get child() { return drillIn(data.children?.[0], tree); },`)
        }
    } else {
        // Even nodes without a declared child slot may receive
        // supertype-dispatched children from tree-sitter. Expose them
        // anyway so callers can walk the full tree.
        lines.push(`    get children() { return (data.children ?? []).map(c => drillIn(c, tree)); },`)
    }

    // Cast to the concrete WrappedNode<T> — the body uses drillIn,
    // which returns `unknown` at the call site because the generic
    // readNode machinery can't narrow; the object shape is correct
    // at runtime, so the cast is the honest bridge.
    lines.push(`  } as unknown as WrappedNode<${node.typeName}>;`)
    lines.push('}')
    return lines.join('\n')
}
