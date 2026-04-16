import { describe, it, expect } from 'vitest'
import { emitConsts } from '../emitters/consts.ts'
import type { NodeMap, AssembledBranch, AssembledLeaf, AssembledKeyword, AssembledToken, AssembledEnum } from '../compiler/rule.ts'

function makeNodeMap(nodes: [string, any][]): NodeMap {
    return {
        name: 'test',
        nodes: new Map(nodes),
        signatures: { signatures: new Map() },
        projections: { projections: new Map() },
        derivations: { inferredFields: [], promotedRules: [], repeatedShapes: [] },
        polymorphFormKinds: new Set(),
    }
}

describe('emitConsts', () => {
    it('emits NODE_KINDS for branch nodes', () => {
        const nodeMap = makeNodeMap([
            ['function_item', { kind: 'function_item', typeName: 'FunctionItem', factoryName: 'functionItem', modelType: 'branch', fields: [] } as unknown as AssembledBranch],
        ])
        const output = emitConsts({ grammar: 'test', nodeMap })
        expect(output).toContain("'function_item'")
        expect(output).toContain('NODE_KINDS')
    })

    it('emits LEAF_KINDS for leaf and keyword nodes', () => {
        const nodeMap = makeNodeMap([
            ['identifier', { kind: 'identifier', typeName: 'Identifier', factoryName: 'identifier', modelType: 'leaf' } as unknown as AssembledLeaf],
            ['true', { kind: 'true', typeName: 'True', factoryName: 'true_', modelType: 'keyword', text: 'true' } as unknown as AssembledKeyword],
        ])
        const output = emitConsts({ grammar: 'test', nodeMap })
        expect(output).toContain('LEAF_KINDS')
        expect(output).toContain("'identifier'")
        expect(output).toContain("'true'")
    })

    it('emits KEYWORDS and OPERATORS from token nodes', () => {
        const nodeMap = makeNodeMap([
            ['fn', { kind: 'fn', typeName: 'Fn', modelType: 'keyword', text: 'fn' } as unknown as AssembledKeyword],
            ['+', { kind: '+', typeName: 'Plus', modelType: 'token' } as unknown as AssembledToken],
        ])
        const output = emitConsts({ grammar: 'test', nodeMap })
        expect(output).toContain('KEYWORDS')
        expect(output).toContain("'fn'")
        expect(output).toContain('OPERATORS')
        // Operators are JSON-stringified to safely escape special chars,
        // so single chars use double quotes.
        expect(output).toContain('"+"')
    })

    it('emits FIELD_MAP for branch nodes', () => {
        const nodeMap = makeNodeMap([
            ['function_item', {
                kind: 'function_item', typeName: 'FunctionItem', factoryName: 'functionItem',
                modelType: 'branch',
                fields: [
                    { name: 'name', propertyName: 'name', paramName: 'name', required: true, multiple: false, contentTypes: ['identifier'], source: 'grammar', projection: { typeName: '', kinds: [] } },
                    { name: 'body', propertyName: 'body', paramName: 'body', required: true, multiple: false, contentTypes: ['block'], source: 'grammar', projection: { typeName: '', kinds: [] } },
                ],
            } as unknown as AssembledBranch],
        ])
        const output = emitConsts({ grammar: 'test', nodeMap })
        expect(output).toContain('FIELD_MAP')
        expect(output).toContain("name: 'name'")
        expect(output).toContain("name: 'body'")
    })

    it('emits enum values', () => {
        const nodeMap = makeNodeMap([
            ['visibility', { kind: 'visibility', typeName: 'Visibility', modelType: 'enum', values: ['pub', 'crate'] } as unknown as AssembledEnum],
        ])
        const output = emitConsts({ grammar: 'test', nodeMap })
        expect(output).toContain("'pub'")
        expect(output).toContain("'crate'")
    })
})
