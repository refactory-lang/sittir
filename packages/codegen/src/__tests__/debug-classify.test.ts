import { describe, it, expect } from 'vitest'
import { evaluate } from '../compiler/evaluate.ts'
import { link } from '../compiler/link.ts'
import { optimize } from '../compiler/optimize.ts'
import { classifyNode, simplifyRule } from '../compiler/assemble.ts'
import { resolve } from 'node:path'

const pythonGrammar = resolve(import.meta.dirname!, '../../../../node_modules/.pnpm/tree-sitter-python@0.25.0/node_modules/tree-sitter-python/grammar.js')

describe('Debug classification — disagreements', () => {
    it('shows why expression_statement is polymorph instead of container', async () => {
        const raw = await evaluate(pythonGrammar)
        const linked = link(raw)
        const optimized = optimize(linked)

        const rule = optimized.rules['expression_statement']
        console.log('expression_statement rule type:', rule?.type)
        console.log('expression_statement rule:', JSON.stringify(rule, null, 2).slice(0, 500))

        if (rule) {
            const simplified = simplifyRule(rule)
            console.log('simplified type:', simplified.type)
            const modelType = classifyNode('expression_statement', rule)
            console.log('classified as:', modelType)
        }
    })

    it('shows why parenthesized_expression is polymorph instead of container', async () => {
        const raw = await evaluate(pythonGrammar)
        const linked = link(raw)
        const optimized = optimize(linked)

        const rule = optimized.rules['parenthesized_expression']
        console.log('parenthesized_expression rule type:', rule?.type)
        console.log('parenthesized_expression:', JSON.stringify(rule, null, 2).slice(0, 500))

        if (rule) {
            const modelType = classifyNode('parenthesized_expression', rule)
            console.log('classified as:', modelType)
        }
    })

    it('shows why binary_operator is polymorph instead of branch', async () => {
        const raw = await evaluate(pythonGrammar)
        const linked = link(raw)
        const optimized = optimize(linked)

        const rule = optimized.rules['binary_operator']
        console.log('binary_operator rule type:', rule?.type)
        if (rule) {
            const simplified = simplifyRule(rule)
            console.log('simplified type:', simplified.type)
            // Check if it has fields
            if (simplified.type === 'seq') {
                const hasFields = simplified.members.some(m => m.type === 'field')
                console.log('has fields:', hasFields)
            }
            console.log('rule preview:', JSON.stringify(rule, null, 2).slice(0, 300))
        }
    })
})
