/**
 * Emit the grammar-level resolver helper block. These functions live
 * at module scope and are called by per-kind from() functions to turn
 * loose developer input into factory output.
 *
 *   _leafRegistry        — kind → { values?, pattern?, factory }
 *   _resolveLeafString   — string + leaf-kinds → leaf NodeData
 *   _resolveByKind       — kind + rest → _fromMap[kind](rest)
 *   _resolveScalar       — boolean/number → leaf factory (primitive coercion)
 *   _resolveOne          — single-field resolver (the workhorse)
 *   _resolveMany         — array variant (maps over elements)
 *
 * Per-field call sites are emitted by `resolveFieldFromView` in rule.ts
 * as `_resolveOne(f.field, [leaves], [branches])` etc.
 */
function emitResolverHelpers(lines: string[], nodeMap: import('../compiler/rule.ts').NodeMap): void {
    // Build the leaf registry from NodeMap leaves/keywords/enums.
    // Each entry knows: the factory function name, optional value list
    // (for leaves with a closed value set — e.g. boolean_literal: ['true','false']),
    // and optional pattern (for leaves with a regex match — e.g. char_literal).
    const registryEntries: string[] = []
    for (const [kind, node] of nodeMap.nodes) {
        if (!node.rawFactoryName) continue
        const factory = node.rawFactoryName
        if (node.modelType === 'enum') {
            const values = node.values.map(v => JSON.stringify(v)).join(', ')
            registryEntries.push(`  ${JSON.stringify(kind)}: { values: [${values}], factory: ${factory} },`)
        } else if (node.modelType === 'keyword') {
            // Keyword factories take no args; baked-in text. The registry
            // entry uses a thunk so the surrounding dispatch can call
            // `entry.factory(text)` uniformly.
            registryEntries.push(`  ${JSON.stringify(kind)}: { values: [${JSON.stringify(node.text)}], factory: () => ${factory}() },`)
        } else if (node.modelType === 'leaf') {
            // Pattern-based leaves don't carry a regex on AssembledLeaf
            // (only the raw pattern string), and we don't try to compile
            // it here — fall back to "any string accepted".
            registryEntries.push(`  ${JSON.stringify(kind)}: { factory: ${factory} },`)
        }
    }

    lines.push('// --- Loose-input resolver helpers (see C6-prereq) ---')
    lines.push('interface _LeafEntry { values?: readonly string[]; pattern?: RegExp; factory: (text: string) => unknown }')
    lines.push('const _leafRegistry: Record<string, _LeafEntry> = {')
    for (const entry of registryEntries) lines.push(entry)
    lines.push('};')
    lines.push('')

    // _resolveLeafString — given a loose string and a list of candidate
    // leaf kinds, pick the right leaf factory by checking value lists
    // first, then pattern, then falling back to the first registered
    // leaf with no value/pattern constraint.
    lines.push('function _resolveLeafString(v: string, kinds: readonly string[]): unknown {')
    lines.push('  for (const kind of kinds) {')
    lines.push('    const entry = _leafRegistry[kind];')
    lines.push('    if (!entry) continue;')
    lines.push('    if (entry.values && entry.values.includes(v)) return entry.factory(v);')
    lines.push('    if (entry.pattern && entry.pattern.test(v)) return entry.factory(v);')
    lines.push('  }')
    lines.push('  // Fallback: any leaf without value/pattern constraint accepts any string.')
    lines.push('  for (const kind of kinds) {')
    lines.push('    const entry = _leafRegistry[kind];')
    lines.push('    if (entry && !entry.values && !entry.pattern) return entry.factory(v);')
    lines.push('  }')
    lines.push('  return undefined;')
    lines.push('}')
    lines.push('')

    // _resolveByKind — dispatch a kind-tagged object to the matching
    // from() function. Used for branch/supertype field resolution when
    // the loose input carries a `kind` discriminator.
    lines.push('function _resolveByKind(kind: string, rest: unknown): unknown {')
    lines.push('  const fn = (_fromMap as Record<string, (input?: any) => unknown>)[kind];')
    lines.push('  if (fn) return fn(rest);')
    lines.push('  return rest;')
    lines.push('}')
    lines.push('')

    // _resolveScalar — turn a JS primitive into a leaf factory call when
    // the grammar has a matching leaf kind. Skipped silently when the
    // grammar lacks the corresponding kind (e.g. python's `True`/`False`
    // are keywords, not boolean_literal).
    const hasBool = nodeMap.nodes.has('boolean_literal')
    const hasInt = nodeMap.nodes.has('integer_literal') || nodeMap.nodes.has('integer')
    const hasFloat = nodeMap.nodes.has('float_literal') || nodeMap.nodes.has('float')
    lines.push('function _resolveScalar(v: unknown): unknown {')
    if (hasBool) {
        lines.push('  if (typeof v === "boolean") {')
        lines.push('    const e = _leafRegistry["boolean_literal"]; return e?.factory(v ? "true" : "false");')
        lines.push('  }')
    }
    if (hasInt || hasFloat) {
        lines.push('  if (typeof v === "number") {')
        if (hasInt) {
            const intKind = nodeMap.nodes.has('integer_literal') ? 'integer_literal' : 'integer'
            lines.push(`    if (Number.isInteger(v)) { const e = _leafRegistry[${JSON.stringify(intKind)}]; return e?.factory(String(v)); }`)
        }
        if (hasFloat) {
            const floatKind = nodeMap.nodes.has('float_literal') ? 'float_literal' : 'float'
            lines.push(`    const e = _leafRegistry[${JSON.stringify(floatKind)}]; return e?.factory(String(v));`)
        }
        lines.push('  }')
    }
    lines.push('  return undefined;')
    lines.push('}')
    lines.push('')

    // _resolveOne — single-element loose resolver. Tries in order:
    //   1. NodeData passthrough
    //   2. JS primitive coercion (boolean/number → leaf)
    //   3. String + matching leaf kind → leaf factory
    //   4. Object with `kind` discriminator → _resolveByKind
    //   5. Single-branch passthrough (the loose object IS already shaped right)
    //   6. Otherwise undefined
    lines.push('function _resolveOne(v: unknown, leafKinds: readonly string[], branchKinds: readonly string[]): unknown {')
    lines.push('  if (v === undefined || v === null) return v;')
    lines.push('  if (isNodeData(v)) return v;')
    lines.push('  if (typeof v === "boolean" || typeof v === "number") {')
    lines.push('    const scalar = _resolveScalar(v);')
    lines.push('    if (scalar !== undefined) return scalar;')
    lines.push('  }')
    lines.push('  if (typeof v === "string" && leafKinds.length > 0) {')
    lines.push('    const leaf = _resolveLeafString(v, leafKinds);')
    lines.push('    if (leaf !== undefined) return leaf;')
    lines.push('  }')
    lines.push('  if (typeof v === "object" && v !== null && "kind" in (v as any)) {')
    lines.push('    const { kind, ...rest } = v as any;')
    lines.push('    return _resolveByKind(kind, rest);')
    lines.push('  }')
    lines.push('  // Single-branch passthrough — the loose object IS the branch.')
    lines.push('  if (branchKinds.length === 1 && typeof v === "object") {')
    lines.push('    return _resolveByKind(branchKinds[0]!, v);')
    lines.push('  }')
    lines.push('  return v;')
    lines.push('}')
    lines.push('')

    // _resolveMany — array variant. Wraps each element through _resolveOne.
    lines.push('function _resolveMany(v: unknown, leafKinds: readonly string[], branchKinds: readonly string[]): unknown[] {')
    lines.push('  if (v === undefined || v === null) return [];')
    lines.push('  const arr = Array.isArray(v) ? v : [v];')
    lines.push('  return arr.map(e => _resolveOne(e, leafKinds, branchKinds));')
    lines.push('}')
}

/**
 * Emits from.ts — thin dispatch over AssembledNode.emitFromFunction().
 *
 * Every node subclass owns its own `from()` emission as a class method.
 * This file is preamble (factory imports, type imports, isNodeData
 * helper) + loop over the NodeMap + the _fromMap dispatch table.
 */

import type { NodeMap } from '../compiler/rule.ts'

export interface EmitFromNodeMapConfig {
    grammar: string
    nodeMap: NodeMap
}

export function emitFromNodeMap(config: EmitFromNodeMapConfig): string {
    const { nodeMap } = config

    const lines: string[] = [
        '// Auto-generated by @sittir/codegen — do not edit',
        '',
    ]

    // Collect imports — factories + types for every node that will emit
    // a from() binding. Polymorph forms contribute their own factories/
    // types because they're inlined by the parent polymorph's emission.
    const factoryImports = new Set<string>()
    const typeImports = new Set<string>()

    for (const [, node] of nodeMap.nodes) {
        if (!node.factoryName) continue
        if (node.modelType === 'branch' || node.modelType === 'container' || node.modelType === 'polymorph') {
            factoryImports.add(node.rawFactoryName!)
            typeImports.add(node.typeName)
            typeImports.add(node.configTypeName)
            typeImports.add(node.fromInputTypeName)
            if (node.modelType === 'polymorph') {
                for (const form of node.forms) {
                    factoryImports.add(form.rawFactoryName!)
                    typeImports.add(form.typeName)
                }
            }
        }
        if (node.modelType === 'leaf' || node.modelType === 'keyword' || node.modelType === 'enum') {
            factoryImports.add(node.rawFactoryName!)
            typeImports.add(node.typeName)
        }
    }

    lines.push(`import { ${[...factoryImports].sort().join(', ')} } from './factories.js';`)
    lines.push(`import type { ${[...typeImports].sort().join(', ')} } from './types.js';`)
    lines.push("import type { AnyNodeData, ConfigOf, FromInputOf } from '@sittir/types';")
    lines.push('')

    // isNodeData helper — referenced by the emitted per-kind bodies.
    lines.push("function isNodeData(v: unknown): v is AnyNodeData {")
    lines.push("  if (v === null || typeof v !== 'object') return false;")
    lines.push("  const o = v as Record<string, unknown>;")
    lines.push("  return typeof o['type'] === 'string' && (typeof o['fields'] === 'object' || typeof o['text'] === 'string');")
    lines.push('}')
    lines.push('')

    // Loose-input resolver scaffolding — see C6-prereq in 005 tasks.md.
    // These helpers let field-level resolvers turn loose developer input
    // (strings, primitives, kind-tagged objects) into the proper factory
    // result without each per-kind from() function reinventing the dispatch.
    emitResolverHelpers(lines, nodeMap)
    lines.push('')

    // Per-node from emission via class method. Polymorph forms are
    // inlined by their parent polymorph's emitFromFunction, so we skip
    // them at the top level — same pattern as emitFactory.
    for (const [, node] of nodeMap.nodes) {
        const source = node.emitFromFunction(nodeMap)
        if (source === undefined) continue
        lines.push(source)
        lines.push('')
    }

    // _fromMap — runtime entry for validators and dynamic dispatch.
    lines.push('export const _fromMap: Record<string, (input?: any) => unknown> = {')
    for (const [kind, node] of nodeMap.nodes) {
        if (!node.factoryName) continue
        if (node.modelType === 'token' || node.modelType === 'supertype' || node.modelType === 'group') continue
        if (!node.fromFunctionName) continue
        lines.push(`  ${JSON.stringify(kind)}: ${node.fromFunctionName} as (input?: any) => unknown,`)
    }
    lines.push('};')
    lines.push('')

    return lines.join('\n')
}
