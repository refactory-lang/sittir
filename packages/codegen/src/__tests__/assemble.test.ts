import { describe, it, expect } from 'vitest'
import { assemble, classifyNode, simplifyRule, extractFields, nameNode, nameField } from '../compiler/assemble.ts'
import type { Rule, OptimizedGrammar, NodeMap, AssembledNode } from '../compiler/rule.ts'

function makeOptimized(rules: Record<string, Rule>, overrides?: Partial<OptimizedGrammar>): OptimizedGrammar {
    return {
        name: 'test',
        rules,
        supertypes: new Set(),
        word: null,
        ...overrides,
    }
}

describe('Assemble — simplifyRule', () => {
    it('strips non-alphanumeric string nodes and collapses single-member seq', () => {
        const rule: Rule = {
            type: 'seq',
            members: [
                { type: 'string', value: '{' },
                { type: 'field', name: 'body', content: { type: 'symbol', name: 'block' } },
                { type: 'string', value: '}' },
            ],
        }
        const simplified = simplifyRule(rule)
        // After stripping { and }, only the field remains → single-member seq collapses to the field
        expect(simplified.type).toBe('field')
        expect((simplified as any).name).toBe('body')
    })

    it('collapses single-member seq to its content', () => {
        const rule: Rule = {
            type: 'seq',
            members: [{ type: 'field', name: 'x', content: { type: 'symbol', name: 'y' } }],
        }
        const simplified = simplifyRule(rule)
        expect(simplified.type).toBe('field')
    })

    it('keeps alphanumeric strings', () => {
        const rule: Rule = { type: 'string', value: 'pub' }
        const simplified = simplifyRule(rule)
        expect(simplified).toEqual({ type: 'string', value: 'pub' })
    })
})

describe('Assemble — classifyNode', () => {
    it('classifies visible seq with fields as branch', () => {
        const rule: Rule = {
            type: 'seq',
            members: [
                { type: 'string', value: 'fn' },
                { type: 'field', name: 'name', content: { type: 'symbol', name: 'identifier' } },
                { type: 'string', value: '(' },
                { type: 'string', value: ')' },
                { type: 'field', name: 'body', content: { type: 'symbol', name: 'block' } },
            ],
        }
        expect(classifyNode('function_item', rule)).toBe('branch')
    })

    it('classifies visible repeat as container', () => {
        const rule: Rule = { type: 'repeat', content: { type: 'symbol', name: 'item' } }
        expect(classifyNode('items', rule)).toBe('container')
    })

    it('classifies visible choice with different field sets as polymorph', () => {
        const rule: Rule = {
            type: 'choice',
            members: [
                { type: 'variant', name: 'if', content: { type: 'seq', members: [
                    { type: 'string', value: 'if' },
                    { type: 'field', name: 'condition', content: { type: 'symbol', name: 'expr' } },
                ] } },
                { type: 'variant', name: 'while', content: { type: 'seq', members: [
                    { type: 'string', value: 'while' },
                    { type: 'field', name: 'body', content: { type: 'symbol', name: 'block' } },
                ] } },
            ],
        }
        expect(classifyNode('statement', rule)).toBe('polymorph')
    })

    it('classifies visible choice with same field set as branch', () => {
        const rule: Rule = {
            type: 'choice',
            members: [
                { type: 'variant', name: 'plus', content: { type: 'seq', members: [
                    { type: 'field', name: 'left', content: { type: 'symbol', name: 'expr' } },
                    { type: 'string', value: '+' },
                    { type: 'field', name: 'right', content: { type: 'symbol', name: 'expr' } },
                ] } },
                { type: 'variant', name: 'minus', content: { type: 'seq', members: [
                    { type: 'field', name: 'left', content: { type: 'symbol', name: 'expr' } },
                    { type: 'string', value: '-' },
                    { type: 'field', name: 'right', content: { type: 'symbol', name: 'expr' } },
                ] } },
            ],
        }
        expect(classifyNode('binary_op', rule)).toBe('branch')
    })

    it('classifies visible pattern as leaf', () => {
        const rule: Rule = { type: 'pattern', value: '[a-z]+' }
        expect(classifyNode('identifier', rule)).toBe('leaf')
    })

    it('classifies visible single alphanumeric string as keyword', () => {
        const rule: Rule = { type: 'string', value: 'true' }
        expect(classifyNode('true', rule)).toBe('keyword')
    })

    it('classifies visible non-alphanumeric string as token (T027b)', () => {
        const rule: Rule = { type: 'string', value: '->' }
        expect(classifyNode('arrow', rule)).toBe('token')
    })

    it('classifies enum as enum', () => {
        const rule: Rule = { type: 'enum', values: ['pub', 'crate'] }
        expect(classifyNode('visibility', rule)).toBe('enum')
    })

    it('classifies hidden choice as supertype', () => {
        const rule: Rule = {
            type: 'supertype', name: '_expression',
            subtypes: ['binary_expression', 'identifier'], source: 'grammar',
        }
        expect(classifyNode('_expression', rule)).toBe('supertype')
    })

    it('classifies hidden seq with fields as group', () => {
        const rule: Rule = {
            type: 'group', name: '_sig',
            content: { type: 'seq', members: [{ type: 'field', name: 'params', content: { type: 'symbol', name: 'parameters' } }] },
        }
        expect(classifyNode('_sig', rule)).toBe('group')
    })
})

describe('Assemble — T027a empty seq after stripping', () => {
    it('handles rule that simplifies to empty seq', () => {
        const rule: Rule = {
            type: 'seq',
            members: [
                { type: 'string', value: '{' },
                { type: 'string', value: '}' },
            ],
        }
        // After stripping anon tokens, this becomes an empty seq
        // classifyNode should handle gracefully
        const modelType = classifyNode('braces', rule)
        expect(modelType).toBe('token') // pure punctuation → token
    })
})

describe('Assemble — extractFields', () => {
    it('extracts fields from a seq rule', () => {
        const rule: Rule = {
            type: 'seq',
            members: [
                { type: 'string', value: 'fn' },
                { type: 'field', name: 'name', content: { type: 'symbol', name: 'identifier' } },
                { type: 'field', name: 'body', content: { type: 'symbol', name: 'block' } },
            ],
        }
        const fields = extractFields(rule)
        expect(fields).toHaveLength(2)
        expect(fields[0].name).toBe('name')
        expect(fields[1].name).toBe('body')
    })

    it('derives required=true for non-optional fields', () => {
        const rule: Rule = {
            type: 'seq',
            members: [
                { type: 'field', name: 'x', content: { type: 'symbol', name: 'y' } },
            ],
        }
        const fields = extractFields(rule)
        expect(fields[0].required).toBe(true)
    })

    it('derives required=false for optional fields', () => {
        const rule: Rule = {
            type: 'optional',
            content: { type: 'field', name: 'x', content: { type: 'symbol', name: 'y' } },
        }
        const fields = extractFields(rule)
        expect(fields[0].required).toBe(false)
    })

    it('derives multiple=true for repeated fields', () => {
        const rule: Rule = {
            type: 'repeat',
            content: { type: 'field', name: 'items', content: { type: 'symbol', name: 'item' } },
        }
        const fields = extractFields(rule)
        expect(fields[0].multiple).toBe(true)
    })
})

describe('Assemble — naming', () => {
    it('nameNode converts snake_case kind to PascalCase typeName', () => {
        const result = nameNode('function_item')
        expect(result.typeName).toBe('FunctionItem')
    })

    it('nameNode generates camelCase factoryName', () => {
        const result = nameNode('function_item')
        expect(result.factoryName).toBe('functionItem')
    })

    it('nameField converts snake_case to camelCase', () => {
        const result = nameField('return_type')
        expect(result.propertyName).toBe('returnType')
        expect(result.paramName).toBe('returnType')
    })
})

describe('Assemble — assemble()', () => {
    it('produces a NodeMap with classified nodes', () => {
        const optimized = makeOptimized({
            function_item: {
                type: 'seq',
                members: [
                    { type: 'string', value: 'fn' },
                    { type: 'field', name: 'name', content: { type: 'symbol', name: 'identifier' } },
                ],
            },
            identifier: { type: 'pattern', value: '[a-z]+' },
        })
        const nodeMap = assemble(optimized)
        expect(nodeMap.name).toBe('test')
        expect(nodeMap.nodes.get('function_item')?.modelType).toBe('branch')
        expect(nodeMap.nodes.get('identifier')?.modelType).toBe('leaf')
    })

    it('assigns typeName and factoryName to nodes', () => {
        const optimized = makeOptimized({
            function_item: {
                type: 'seq',
                members: [
                    { type: 'field', name: 'name', content: { type: 'symbol', name: 'id' } },
                ],
            },
            id: { type: 'pattern', value: '[a-z]+' },
        })
        const nodeMap = assemble(optimized)
        const fnNode = nodeMap.nodes.get('function_item')!
        expect(fnNode.typeName).toBe('FunctionItem')
        expect(fnNode.factoryName).toBe('functionItem')
    })
})

describe('Assemble — T029a identical detect tokens', () => {
    it('collapses polymorph forms with same detect token but different fields', () => {
        const optimized = makeOptimized({
            decl: {
                type: 'choice',
                members: [
                    { type: 'variant', name: 'pub_item', content: { type: 'seq', members: [
                        { type: 'string', value: 'pub' },
                        { type: 'field', name: 'item', content: { type: 'symbol', name: 'x' } },
                    ]}},
                    { type: 'variant', name: 'pub_alias', content: { type: 'seq', members: [
                        { type: 'string', value: 'pub' },
                        { type: 'field', name: 'alias', content: { type: 'symbol', name: 'y' } },
                    ]}},
                ],
            },
            x: { type: 'pattern', value: 'x' },
            y: { type: 'pattern', value: 'y' },
        })
        const nodeMap = assemble(optimized)
        const decl = nodeMap.nodes.get('decl')
        // Different field sets → polymorph, even though detect token is same
        expect(decl?.modelType).toBe('polymorph')
    })
})
