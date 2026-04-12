import { describe, it } from 'vitest'
import { evaluate } from '../compiler/evaluate.ts'
import { link } from '../compiler/link.ts'
import { optimize } from '../compiler/optimize.ts'
import { classifyNode, simplifyRule } from '../compiler/assemble.ts'
import { resolveGrammarJsPath } from '../compiler/resolve-grammar.ts'

const pythonGrammar = resolveGrammarJsPath('python')

// The key disagreements to investigate
const DISAGREE = [
    { kind: 'case_pattern', old: 'container', new_: 'branch' },
    { kind: 'expression_statement', old: 'container', new_: 'branch' },
    { kind: 'type', old: 'container', new_: 'branch' },
    { kind: 'with_clause', old: 'container', new_: 'branch' },
    { kind: 'parenthesized_expression', old: 'container', new_: 'polymorph' },
    { kind: 'integer', old: 'leaf', new_: 'branch' },
    { kind: 'import_prefix', old: 'leaf', new_: 'container' },
    { kind: 'escape_sequence', old: 'leaf', new_: 'polymorph' },
]

describe('Debug disagreements — why classification differs', () => {
    it('shows rule shapes for disagreed kinds', async () => {
        const raw = await evaluate(pythonGrammar)
        const linked = link(raw)
        const optimized = optimize(linked)

        for (const d of DISAGREE) {
            const rule = optimized.rules[d.kind]
            if (!rule) {
                console.log(`\n${d.kind}: NO RULE FOUND (old=${d.old})`)
                continue
            }
            const simplified = simplifyRule(rule)
            const classified = classifyNode(d.kind, rule)
            console.log(`\n${d.kind}: old=${d.old}, new=${classified}`)
            console.log(`  rule.type: ${rule.type}`)
            console.log(`  simplified.type: ${simplified.type}`)
            if (simplified.type === 'seq') {
                const fieldCount = simplified.members.filter((m: any) => m.type === 'field').length
                const symbolCount = simplified.members.filter((m: any) => m.type === 'symbol').length
                console.log(`  seq members: ${simplified.members.length} (${fieldCount} fields, ${symbolCount} symbols)`)
            }
            if (rule.type === 'choice') {
                console.log(`  choice members: ${rule.members.length}`)
                const variantCount = rule.members.filter((m: any) => m.type === 'variant').length
                console.log(`  variants: ${variantCount}`)
            }
        }
    })
})
