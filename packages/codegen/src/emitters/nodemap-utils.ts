/**
 * nodemap-utils.ts — NodeMap-based replacements for emitter utils.
 *
 * Provides the same helper functions as utils.ts but operating on
 * NodeMap/AssembledNode instead of HydratedNodeModel. Emitters can
 * switch from utils.ts to nodemap-utils.ts without changing their
 * internal logic.
 */

import type {
    NodeMap, AssembledNode, AssembledField, AssembledChild,
    AssembledBranch, AssembledContainer, AssembledPolymorph,
    AssembledLeaf, AssembledKeyword, AssembledEnum, AssembledSupertype,
} from '../compiler/rule.ts'

// ---------------------------------------------------------------------------
// Structural node iteration
// ---------------------------------------------------------------------------

export type StructuralNode = AssembledBranch | AssembledContainer | AssembledPolymorph

export function structuralNodes(nodeMap: NodeMap): StructuralNode[] {
    const result: StructuralNode[] = []
    for (const [, node] of nodeMap.nodes) {
        if (node.modelType === 'branch' || node.modelType === 'container' || node.modelType === 'polymorph') {
            result.push(node as StructuralNode)
        }
    }
    return result
}

// ---------------------------------------------------------------------------
// Field access
// ---------------------------------------------------------------------------

export function fieldsOf(node: AssembledNode): readonly AssembledField[] {
    switch (node.modelType) {
        case 'branch': return node.fields
        case 'polymorph': {
            // Union of all form fields
            const seen = new Set<string>()
            const fields: AssembledField[] = []
            for (const form of node.forms) {
                for (const f of form.fields) {
                    if (!seen.has(f.name)) {
                        seen.add(f.name)
                        fields.push(f)
                    }
                }
            }
            return fields
        }
        default: return []
    }
}

// ---------------------------------------------------------------------------
// Kind filters
// ---------------------------------------------------------------------------

export function leafKindsOf(nodeMap: NodeMap): string[] {
    const kinds: string[] = []
    for (const [kind, node] of nodeMap.nodes) {
        if (node.modelType === 'leaf' || node.modelType === 'keyword' || node.modelType === 'enum') {
            kinds.push(kind)
        }
    }
    return kinds
}

export function keywordKindsOf(nodeMap: NodeMap): Map<string, string> {
    const map = new Map<string, string>()
    for (const [kind, node] of nodeMap.nodes) {
        if (node.modelType === 'keyword') {
            map.set(kind, node.text)
        }
    }
    return map
}

export function keywordTokensOf(nodeMap: NodeMap): string[] {
    const tokens: string[] = []
    for (const [kind, node] of nodeMap.nodes) {
        if (node.modelType === 'keyword') tokens.push(kind)
        else if (node.modelType === 'token' && /^[a-z_]+$/i.test(kind)) tokens.push(kind)
    }
    return tokens.sort()
}

export function operatorTokensOf(nodeMap: NodeMap): string[] {
    const tokens: string[] = []
    for (const [kind, node] of nodeMap.nodes) {
        if (node.modelType === 'token' && !/^[a-z_]+$/i.test(kind)) tokens.push(kind)
    }
    return tokens.sort()
}

export function enumKindsOf(nodeMap: NodeMap): { kind: string; values: string[] }[] {
    const result: { kind: string; values: string[] }[] = []
    for (const [kind, node] of nodeMap.nodes) {
        if (node.modelType === 'enum') {
            result.push({ kind, values: node.values })
        }
    }
    return result
}

export function supertypeEntriesOf(nodeMap: NodeMap): { kind: string; subtypes: string[] }[] {
    const result: { kind: string; subtypes: string[] }[] = []
    for (const [kind, node] of nodeMap.nodes) {
        if (node.modelType === 'supertype') {
            result.push({ kind, subtypes: node.subtypes })
        }
    }
    return result
}

// ---------------------------------------------------------------------------
// Leaf values (enum values for leaf kinds)
// ---------------------------------------------------------------------------

export function leafValuesOf(nodeMap: NodeMap): Map<string, string[]> {
    const map = new Map<string, string[]>()
    for (const [kind, node] of nodeMap.nodes) {
        if (node.modelType === 'enum') {
            map.set(kind, node.values)
        }
    }
    return map
}

// ---------------------------------------------------------------------------
// Children access
// ---------------------------------------------------------------------------

export function childrenOf(node: AssembledNode): readonly AssembledChild[] {
    switch (node.modelType) {
        case 'branch': return node.children ?? []
        case 'container': return node.children
        default: return []
    }
}

// ---------------------------------------------------------------------------
// String helpers
// ---------------------------------------------------------------------------

export function escapeString(s: string): string {
    return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')
}
