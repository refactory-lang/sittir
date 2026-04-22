/**
 * Emits factory-map.json5 — validator-only factory metadata.
 *
 * Three maps consumed by `validate-factory-roundtrip` / `validate-from` /
 * `nodeToConfig` to dispatch factories correctly against readNode
 * output. They live in JSON5 (and not inside `factories.ts`) because:
 *
 *   1. They're pure data — no function references or type dependencies.
 *   2. Users constructing AST via factories never need them; only the
 *      validator harness does.
 *   3. Keeping them out of `factories.ts` tightens the user-facing
 *      surface and lets the emitter stay focused on factory emission.
 *
 * The function-valued `_factoryMap` stays in `factories.ts` — it can't
 * round-trip through JSON.
 */

import type { NodeMap } from '../compiler/types.ts'
import type { AssembledNode, AssembledGroup } from '../compiler/node-map.ts'
import type { PolymorphVariantDescriptor, PolymorphVariantMap } from '../polymorph-variant.ts'

export interface EmitFactoryMapConfig {
    grammar: string
    nodeMap: NodeMap
}

export interface FactoryMapData {
    readonly factoryShapes: Readonly<Record<string, 'config' | 'children' | 'text'>>
    readonly fieldAliasMap: Readonly<Record<string, Readonly<Record<string, string>>>>
    readonly factoryFields: Readonly<Record<string, readonly string[]>>
    /**
     * Polymorph variant discriminators. For each polymorph parent kind a
     * descriptor telling `nodeToConfig` how to stamp `$variant` on the
     * derived config.
     *
     *   source='override' — variant inferred from the first named child's
     *     kind. The `childKind` map is `<parent_childKind>: <variantName>`.
     *   source='promoted' — variant inferred from field-presence. The
     *     `fields` map is `<variantName>: [<fieldPropertyName>...]`
     *     (match if every listed field is present on the config).
     *
     * The dispatcher's switch on `config.$variant` expects the tag to be
     * present; validators and legacy readNode→factory paths use this map
     * to derive it from the parsed tree.
     */
    readonly polymorphVariants: PolymorphVariantMap
}

export function buildFactoryMap(nodeMap: NodeMap): FactoryMapData {
    const aliasSet = collectAliasSourceKinds(nodeMap)

    const factoryShapes: Record<string, 'config' | 'children' | 'text'> = {}
    for (const [kind, node] of nodeMap.nodes) {
        if (kind.startsWith('_') && !aliasSet.has(kind)) continue
        if (nodeMap.polymorphFormKinds.has(kind)) continue
        const shape = shapeOf(node, nodeMap)
        if (shape) factoryShapes[kind] = shape
    }

    const fieldAliasMap: Record<string, Record<string, string>> = {}
    for (const [kind, node] of nodeMap.nodes) {
        if (node.modelType !== 'branch' && node.modelType !== 'polymorph' && node.modelType !== 'group') continue
        const fields = node.modelType === 'polymorph'
            ? node.allFormFields
            : node.fields
        for (const f of fields) {
            if (!f.aliasSources) continue
            const pairs = Object.entries(f.aliasSources).filter(([t, s]) => t !== s)
            if (pairs.length === 0) continue
            fieldAliasMap[`${kind}.${f.name}`] = Object.fromEntries(pairs)
        }
    }

    const factoryFields: Record<string, readonly string[]> = {}
    for (const [kind, node] of nodeMap.nodes) {
        if (kind.startsWith('_') && !aliasSet.has(kind)) continue
        if (node.modelType === 'branch' || node.modelType === 'group') {
            if (node.fields.length === 0) continue
            if (node.children && node.children.length > 0) continue
            factoryFields[kind] = node.fields.map(f => f.name)
        } else if (node.modelType === 'polymorph') {
            const unique = [...new Set(node.allFormFields.map(f => f.name))]
            if (unique.length === 0) continue
            const hasChildrenInAnyForm = node.forms.some((f: AssembledGroup) => f.children && f.children.length > 0)
            if (hasChildrenInAnyForm) continue
            factoryFields[kind] = unique
        }
    }

    const polymorphVariants: Record<string, PolymorphVariantDescriptor> = {}
    for (const [kind, node] of nodeMap.nodes) {
        if (node.modelType !== 'polymorph') continue
        if (kind.startsWith('_') && !aliasSet.has(kind)) continue
        if (node.source === 'override') {
            const childKind: Record<string, string> = {}
            for (const form of node.forms) {
                childKind[`${kind}_${form.name}`] = form.name
            }
            polymorphVariants[kind] = { source: 'override', childKind }
        } else {
            const fields: Record<string, readonly string[]> = {}
            const seenSignatures = new Map<string, string>()
            for (const form of node.forms) {
                const fieldNames = form.fields.map(f => f.propertyName)
                const signature = [...fieldNames].sort().join(',')
                const prior = seenSignatures.get(signature)
                if (prior !== undefined) {
                    // Two forms with identical field-key sets can't be
                    // disambiguated by field-presence at runtime. We warn
                    // (not throw) because the grammar may legitimately
                    // have shape-identical variants whose semantic
                    // difference is anonymous-token positions (e.g. TS's
                    // `export_statement` / `variable_declarator`) and
                    // `.from()` callers for those go through declaration
                    // order — first-match-wins, stable-by-spec. Callers
                    // who need the second form pass `$variant` explicitly.
                    console.warn(
                        `[factory-map] polymorph '${kind}': forms '${prior}' and '${form.name}' share field signature [${signature || '(empty)'}]. ` +
                        `.from() without $variant will dispatch to '${prior}' by declaration order.`,
                    )
                }
                seenSignatures.set(signature, form.name)
                fields[form.name] = fieldNames
            }
            polymorphVariants[kind] = { source: 'promoted', fields }
        }
    }

    return { factoryShapes, fieldAliasMap, factoryFields, polymorphVariants }
}

export function emitFactoryMap(config: EmitFactoryMapConfig): string {
    const data = buildFactoryMap(config.nodeMap)
    const header = [
        '// Auto-generated by @sittir/codegen — do not edit.',
        '//',
        '// Validator-only factory metadata.',
        '// See emitters/factory-map.ts for semantics of each map.',
        '',
    ].join('\n')
    return header + JSON.stringify(data, null, 2) + '\n'
}

function shapeOf(node: AssembledNode, nodeMap: NodeMap): 'config' | 'children' | 'text' | null {
    if (node.isTextTemplate(nodeMap.externals)) return 'text'
    switch (node.modelType) {
        case 'leaf':
        case 'enum':
        case 'keyword':
            return 'text'
        case 'container':
            return 'children'
        case 'branch':
        case 'polymorph':
        case 'group':
            return 'config'
        default:
            return null
    }
}

function collectAliasSourceKinds(nodeMap: NodeMap): Set<string> {
    const out = new Set<string>()
    for (const [, n] of nodeMap.nodes) {
        const fs = n.modelType === 'polymorph' ? n.allFormFields
            : (n.modelType === 'branch' || n.modelType === 'group') ? n.fields : []
        for (const f of fs) {
            if (!f.aliasSources) continue
            for (const source of Object.values(f.aliasSources)) out.add(source)
        }
    }
    return out
}
