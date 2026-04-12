import { describe, it, expect } from 'vitest'
import { toHydratedModels } from '../compiler/adapter.ts'
import {
    AssembledBranch, AssembledLeaf, AssembledContainer, AssembledEnum,
    AssembledSupertype, AssembledKeyword, AssembledToken,
} from '../compiler/rule.ts'
import type { NodeMap, AssembledNode, Rule } from '../compiler/rule.ts'

function makeNodeMap(nodes: [string, AssembledNode][]): NodeMap {
    return {
        name: 'test',
        nodes: new Map(nodes),
        signatures: { signatures: new Map() },
        projections: { projections: new Map() },
    }
}

// Sample rules for class instances
const fieldRule: Rule = {
    type: 'seq',
    members: [
        { type: 'field', name: 'name', content: { type: 'symbol', name: 'identifier' } },
    ],
}

describe('Adapter — toHydratedModels', () => {

    it('maps a branch AssembledNode to HydratedNodeModel shape', () => {
        const branch = new AssembledBranch({
            kind: 'function_item',
            typeName: 'FunctionItem',
            factoryName: 'functionItem',
            irKey: 'functionItem',
            rule: fieldRule,
        })
        const nodeMap = makeNodeMap([['function_item', branch]])
        const models = toHydratedModels(nodeMap)
        expect(models).toHaveLength(1)
        expect(models[0]!.modelType).toBe('branch')
        expect(models[0]!.kind).toBe('function_item')
        expect(models[0]!.typeName).toBe('FunctionItem')
    })

    it('maps a leaf AssembledNode', () => {
        const leaf = new AssembledLeaf({
            kind: 'identifier',
            typeName: 'Identifier',
            factoryName: 'identifier',
            irKey: 'identifier',
            pattern: '[a-z_]\\w*',
        })
        const nodeMap = makeNodeMap([['identifier', leaf]])
        const models = toHydratedModels(nodeMap)
        expect(models[0]!.modelType).toBe('leaf')
        expect(models[0]!.kind).toBe('identifier')
    })

    it('maps a container AssembledNode', () => {
        const container = new AssembledContainer({
            kind: 'items',
            typeName: 'Items',
            factoryName: 'items',
            irKey: 'items',
            rule: { type: 'repeat', content: { type: 'symbol', name: 'item' }, separator: ',' },
        })
        const nodeMap = makeNodeMap([['items', container]])
        const models = toHydratedModels(nodeMap)
        expect(models[0]!.modelType).toBe('container')
    })

    it('maps an enum AssembledNode', () => {
        const enumNode = new AssembledEnum({
            kind: '_visibility',
            typeName: 'Visibility',
            values: ['pub', 'crate'],
        })
        const nodeMap = makeNodeMap([['_visibility', enumNode]])
        const models = toHydratedModels(nodeMap)
        expect(models[0]!.modelType).toBe('enum')
    })

    it('maps a supertype AssembledNode', () => {
        const supertype = new AssembledSupertype({
            kind: '_expression',
            typeName: 'Expression',
            subtypes: ['binary_expression', 'identifier'],
        })
        const nodeMap = makeNodeMap([['_expression', supertype]])
        const models = toHydratedModels(nodeMap)
        expect(models[0]!.modelType).toBe('supertype')
    })

    it('maps a keyword AssembledNode', () => {
        const keyword = new AssembledKeyword({
            kind: 'true',
            typeName: 'True',
            factoryName: 'true_',
            irKey: 'true_',
            text: 'true',
        })
        const nodeMap = makeNodeMap([['true', keyword]])
        const models = toHydratedModels(nodeMap)
        expect(models[0]!.modelType).toBe('keyword')
    })

    it('preserves node count', () => {
        const a = new AssembledLeaf({ kind: 'a', typeName: 'A', factoryName: 'a', irKey: 'a' })
        const b = new AssembledLeaf({ kind: 'b', typeName: 'B', factoryName: 'b', irKey: 'b' })
        const nodeMap = makeNodeMap([['a', a], ['b', b]])
        const models = toHydratedModels(nodeMap)
        expect(models).toHaveLength(2)
    })
})
