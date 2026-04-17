/**
 * Emits is.ts — per-grammar type guards.
 *
 * Three surfaces per grammar:
 *   - `is`     — per-kind guards keyed by camelCase kind name, a generic
 *                inverse `is.kind(v, k)`, and supertype guards
 *                (narrow the `type` discriminant).
 *   - `isTree` / `isNode` — shape guards with overloaded signatures that
 *                narrow through NamespaceMap when the kind is known or
 *                fall back to AnyTreeNode / AnyNodeData when it isn't.
 *   - `assert` — mirror of `is` with `asserts v is T` signatures, throws
 *                TypeError on mismatch. Runtime wraps `is` — no
 *                duplicated kind-check logic.
 *
 * Composition: `is.kind × shape = concrete type`. Inside
 * `if (is.functionItem(v) && isTree(v))`, `v` narrows to
 * `NamespaceMap['function_item']['Tree']` = `FunctionItem.Tree`.
 *
 * See `specs/008-factory-ergonomic-cleanup/contracts/is-guards.md`
 * for the full contract.
 */

import type { NodeMap, AssembledSupertype } from '../compiler/rule.ts'

export interface EmitIsConfig {
    grammar: string
    nodeMap: NodeMap
}

function toCamelCase(kind: string): string {
    return kind.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

/** JS reserved words that need a trailing `_` when used as a guard key. */
const RESERVED = new Set([
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
    'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false',
    'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new',
    'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try',
    'typeof', 'var', 'void', 'while', 'with', 'yield', 'let', 'static',
    'implements', 'interface', 'package', 'private', 'protected', 'public',
    // Also reserve `is` method names so kind keys don't shadow them
    'kind',
])

/** Methods on the `is` / `assert` namespaces beyond per-kind entries. */
const RESERVED_GUARD_NAMES = new Set(['kind'])

function safeGuardKey(camel: string): string {
    return RESERVED.has(camel) ? `${camel}_` : camel
}

export function emitIs(config: EmitIsConfig): string {
    const { nodeMap } = config

    // Collect structural kinds with data interfaces (those that emitTypes
    // emits NodeNs entries for). These are the kinds that get per-kind
    // is.<camel> guards.
    const structuralKinds: Array<{ kind: string; typeName: string; guardKey: string }> = []
    const usedCamelKeys = new Set<string>()

    for (const [kind, node] of nodeMap.nodes) {
        switch (node.modelType) {
            case 'branch':
            case 'container':
            case 'polymorph': {
                const camel = toCamelCase(kind)
                const guardKey = safeGuardKey(camel)
                // Collision detection — mirrors types emitter FR-017.
                if (usedCamelKeys.has(guardKey) || RESERVED_GUARD_NAMES.has(camel)) {
                    throw new Error(
                        `is emitter: camelCase kind '${camel}' collides with reserved guard key ` +
                        `or another kind. Rename '${kind}' before proceeding (spec 008 FR-017).`,
                    )
                }
                usedCamelKeys.add(guardKey)
                structuralKinds.push({ kind, typeName: node.typeName, guardKey })
                break
            }
        }
    }

    // Collect supertypes. Each supertype becomes `is.<name>` (narrow to the
    // union) and `assert.<name>` (throws on mismatch).
    const supertypes: Array<{ kind: string; typeName: string; guardKey: string; memberKinds: string[] }> = []
    for (const [kind, node] of nodeMap.nodes) {
        if (node.modelType !== 'supertype') continue
        const st = node as AssembledSupertype
        const cleanName = kind.replace(/^_/, '')
        const typeName = node.typeName
        const camel = toCamelCase(cleanName)
        const guardKey = safeGuardKey(camel)
        // Resolve subtypes to concrete kinds (skip if missing — supertype
        // might reference hidden rules that didn't produce a data
        // interface; those aren't narrowable).
        const memberKinds: string[] = []
        for (const sub of st.subtypes) {
            const subNode = nodeMap.nodes.get(sub)
            if (!subNode) continue
            memberKinds.push(sub)
        }
        if (memberKinds.length === 0) continue
        // Supertype name collision with per-kind guard is possible (e.g.
        // a kind named exactly `expression`). Skip the supertype entry if
        // it would shadow — the per-kind takes precedence.
        if (usedCamelKeys.has(guardKey)) continue
        usedCamelKeys.add(guardKey)
        supertypes.push({ kind, typeName, guardKey, memberKinds })
    }

    // Type imports — every structural kind + supertype contributes.
    const typeImports = new Set<string>()
    for (const s of structuralKinds) typeImports.add(s.typeName)
    for (const s of supertypes) typeImports.add(s.typeName)

    const lines: string[] = []
    lines.push('// Auto-generated by @sittir/codegen — do not edit')
    lines.push('// Per-grammar type guards: is / assert / isTree / isNode.')
    lines.push('// Composition: kind × shape = concrete type via NamespaceMap.')
    lines.push('')
    lines.push("import type { AnyNodeData, AnyTreeNodeOf as AnyTreeNode } from '@sittir/types';")
    const typeImportList = [...typeImports].sort()
    if (typeImportList.length > 0) {
        lines.push('import type {')
        lines.push('    NamespaceMap,')
        for (const t of typeImportList) lines.push(`    ${t},`)
        lines.push("} from './types.js';")
    } else {
        lines.push("import type { NamespaceMap } from './types.js';")
    }
    lines.push('')

    // IsGuards mapped type — per-kind entries narrow the `type` discriminant
    // to the kind literal; supertype entries narrow to the supertype union.
    lines.push('// IsGuards — per-kind + supertype type-narrowing guards.')
    lines.push('export interface IsGuards {')
    for (const s of structuralKinds) {
        lines.push(`    ${s.guardKey}<T extends { readonly type: string }>(v: T): v is T & { readonly type: '${s.kind}' };`)
    }
    lines.push(`    kind<K extends keyof NamespaceMap>(v: { readonly type: string }, kind: K): v is { readonly type: K & string };`)
    for (const s of supertypes) {
        lines.push(`    ${s.guardKey}(v: { readonly type: string }): v is ${s.typeName};`)
    }
    lines.push('}')
    lines.push('')

    // AssertGuards — same shape as IsGuards but with `asserts v is T`.
    lines.push('// AssertGuards — assertion form of IsGuards; throws TypeError on mismatch.')
    lines.push('export interface AssertGuards {')
    for (const s of structuralKinds) {
        lines.push(`    ${s.guardKey}(v: { readonly type: string }): asserts v is { readonly type: '${s.kind}' };`)
    }
    lines.push(`    kind<K extends keyof NamespaceMap>(v: { readonly type: string }, kind: K): asserts v is { readonly type: K & string };`)
    for (const s of supertypes) {
        lines.push(`    ${s.guardKey}(v: { readonly type: string }): asserts v is ${s.typeName};`)
    }
    lines.push('}')
    lines.push('')

    // Runtime construction.
    lines.push('// Runtime: kind guards = string equality; supertype guards = Set.has.')
    lines.push('// Building from literal string arrays keeps the runtime footprint minimal.')
    lines.push('function _g(k: string): (v: { readonly type: string }) => boolean {')
    lines.push('    return (v) => v.type === k;')
    lines.push('}')
    lines.push('function _sg(ks: ReadonlySet<string>): (v: { readonly type: string }) => boolean {')
    lines.push('    return (v) => ks.has(v.type);')
    lines.push('}')
    lines.push('')

    // Per-supertype Sets, one per supertype. Declared before `is` so the
    // object-literal construction can reference them.
    for (const s of supertypes) {
        const members = s.memberKinds.map(k => JSON.stringify(k)).join(', ')
        lines.push(`const _supertype_${s.guardKey} = new Set<string>([${members}]);`)
    }
    if (supertypes.length > 0) lines.push('')

    // The is const — per-kind, kind(), supertype methods.
    lines.push('export const is = {')
    for (const s of structuralKinds) {
        lines.push(`    ${s.guardKey}: _g(${JSON.stringify(s.kind)}),`)
    }
    lines.push(`    kind: (v: { readonly type: string }, k: string): boolean => v.type === k,`)
    for (const s of supertypes) {
        lines.push(`    ${s.guardKey}: _sg(_supertype_${s.guardKey}),`)
    }
    lines.push('} as unknown as IsGuards;')
    lines.push('')

    // The assert const — wraps each `is` entry with a throwing semantics.
    lines.push('// assert — reuses `is` runtime logic via closure; TypeError on mismatch.')
    lines.push('type _AnyGuard = (...args: unknown[]) => boolean;')
    lines.push('function _makeAssert(name: string, guard: _AnyGuard) {')
    lines.push('    return (...args: unknown[]): void => {')
    lines.push('        if (!guard(...args)) {')
    lines.push(`            const v = args[0] as { type?: unknown } | null;`)
    lines.push(`            const actual = v?.type ?? '(none)';`)
    lines.push(`            throw new TypeError(\`assert.\${name}: expected type '\${name}', got '\${String(actual)}'\`);`)
    lines.push('        }')
    lines.push('    };')
    lines.push('}')
    lines.push('')
    lines.push('export const assert = {')
    // Build assert entries by wrapping each is entry. Keys must match
    // is's exactly.
    for (const s of structuralKinds) {
        lines.push(`    ${s.guardKey}: _makeAssert('${s.guardKey}', is.${s.guardKey} as _AnyGuard),`)
    }
    lines.push(`    kind: _makeAssert('kind', is.kind as _AnyGuard),`)
    for (const s of supertypes) {
        lines.push(`    ${s.guardKey}: _makeAssert('${s.guardKey}', is.${s.guardKey} as _AnyGuard),`)
    }
    lines.push('} as unknown as AssertGuards;')
    lines.push('')

    // Shape guards — isTree / isNode — overloaded signatures.
    lines.push('// Shape guards — narrow through NamespaceMap when kind is already known.')
    lines.push('// Overload 1: typed input whose type is a NamespaceMap key → narrow to Tree/Node projection.')
    lines.push('// Overload 2: generic unknown → fall back to AnyTreeNode / AnyNodeData.')
    lines.push('')
    lines.push('export function isTree<T extends { readonly type: K }, K extends keyof NamespaceMap & string>(')
    lines.push('    v: T,')
    lines.push(`): v is T & NamespaceMap[K]['Tree'];`)
    lines.push('export function isTree(v: { readonly type: string }): v is AnyTreeNode;')
    lines.push('export function isTree(v: { readonly type: string }): boolean {')
    lines.push(`    return typeof (v as { range?: unknown }).range === 'function';`)
    lines.push('}')
    lines.push('')
    lines.push('export function isNode<T extends { readonly type: K }, K extends keyof NamespaceMap & string>(')
    lines.push('    v: T,')
    lines.push(`): v is T & NamespaceMap[K]['Node'];`)
    lines.push('export function isNode(v: { readonly type: string }): v is AnyNodeData;')
    lines.push('export function isNode(v: { readonly type: string }): boolean {')
    lines.push('    const o = v as { fields?: unknown; text?: unknown };')
    lines.push(`    return (o.fields !== undefined && typeof o.fields === 'object') || typeof o.text === 'string';`)
    lines.push('}')
    lines.push('')

    return lines.join('\n')
}
