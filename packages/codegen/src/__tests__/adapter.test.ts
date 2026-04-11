import { describe, it, expect } from 'vitest'
import { toHydratedModels } from '../compiler/adapter.ts'
import type { NodeMap, AssembledBranch, AssembledLeaf, AssembledContainer, AssembledEnum, AssembledSupertype, AssembledKeyword, AssembledToken } from '../compiler/rule.ts'

function makeNodeMap(nodes: [string, any][]): NodeMap {
    return {
        name: 'test',
        nodes: new Map(nodes),
        signatures: { signatures: new Map() },
        projections: { projections: new Map() },
    }
}

describe('Adapter — toHydratedModels', () => {

    it('maps a branch AssembledNode to HydratedNodeModel shape', () => {
        const branch: AssembledBranch = {
            kind: 'function_item',
            typeName: 'FunctionItem',
            factoryName: 'functionItem',
            irKey: 'functionItem',
            modelType: 'branch',
            fields: [
                {
                    name: 'name',
                    propertyName: 'name',
                    paramName: 'name',
                    required: true,
                    multiple: false,
                    contentTypes: ['identifier'],
                    source: 'grammar',
                    projection: { typeName: 'Identifier', kinds: ['identifier'] },
                },
            ],
        }
        const nodeMap = makeNodeMap([['function_item', branch]])
        const models = toHydratedModels(nodeMap)
        expect(models).toHaveLength(1)
        expect(models[0].modelType).toBe('branch')
        expect(models[0].kind).toBe('function_item')
        expect(models[0].typeName).toBe('FunctionItem')
    })

    it('maps a leaf AssembledNode', () => {
        const leaf: AssembledLeaf = {
            kind: 'identifier',
            typeName: 'Identifier',
            factoryName: 'identifier',
            irKey: 'identifier',
            modelType: 'leaf',
            pattern: '[a-z_]\\w*',
        }
        const nodeMap = makeNodeMap([['identifier', leaf]])
        const models = toHydratedModels(nodeMap)
        expect(models[0].modelType).toBe('leaf')
        expect(models[0].kind).toBe('identifier')
    })

    it('maps a container AssembledNode', () => {
        const container: AssembledContainer = {
            kind: 'items',
            typeName: 'Items',
            factoryName: 'items',
            irKey: 'items',
            modelType: 'container',
            children: [{
                name: 'item',
                propertyName: 'item',
                required: false,
                multiple: true,
                contentTypes: ['item'],
            }],
            separator: ',',
        }
        const nodeMap = makeNodeMap([['items', container]])
        const models = toHydratedModels(nodeMap)
        expect(models[0].modelType).toBe('container')
    })

    it('maps an enum AssembledNode', () => {
        const enumNode: AssembledEnum = {
            kind: '_visibility',
            typeName: 'Visibility',
            modelType: 'enum',
            values: ['pub', 'crate'],
        }
        const nodeMap = makeNodeMap([['_visibility', enumNode]])
        const models = toHydratedModels(nodeMap)
        expect(models[0].modelType).toBe('enum')
    })

    it('maps a supertype AssembledNode', () => {
        const supertype: AssembledSupertype = {
            kind: '_expression',
            typeName: 'Expression',
            modelType: 'supertype',
            subtypes: ['binary_expression', 'identifier'],
        }
        const nodeMap = makeNodeMap([['_expression', supertype]])
        const models = toHydratedModels(nodeMap)
        expect(models[0].modelType).toBe('supertype')
    })

    it('maps a keyword AssembledNode', () => {
        const keyword: AssembledKeyword = {
            kind: 'true',
            typeName: 'True',
            factoryName: 'true_',
            irKey: 'true_',
            modelType: 'keyword',
            text: 'true',
        }
        const nodeMap = makeNodeMap([['true', keyword]])
        const models = toHydratedModels(nodeMap)
        expect(models[0].modelType).toBe('keyword')
    })

    it('preserves node count', () => {
        const nodeMap = makeNodeMap([
            ['a', { kind: 'a', typeName: 'A', factoryName: 'a', irKey: 'a', modelType: 'leaf' as const }],
            ['b', { kind: 'b', typeName: 'B', factoryName: 'b', irKey: 'b', modelType: 'leaf' as const }],
        ])
        const models = toHydratedModels(nodeMap)
        expect(models).toHaveLength(2)
    })
})
