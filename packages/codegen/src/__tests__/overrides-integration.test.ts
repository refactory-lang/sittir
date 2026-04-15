import { describe, it, expect } from 'vitest'
import { evaluate } from '../compiler/evaluate.ts'
import { resolveOverridesPath, resolveGrammarJsPath } from '../compiler/resolve-grammar.ts'
import { existsSync } from 'node:fs'

describe('Overrides integration', () => {
    it('evaluates Python with overrides.ts', async () => {
        const overridesPath = resolveOverridesPath('python')
        console.log('Overrides path:', overridesPath)
        console.log('Exists:', existsSync(overridesPath))

        if (!existsSync(overridesPath)) {
            console.log('SKIP: no overrides.ts')
            return
        }

        const raw = await evaluate(overridesPath)
        console.log('Name:', raw.name)
        console.log('Rule count:', Object.keys(raw.rules).length)

        // Check that override fields are present
        // Python's augmented_assignment should have field 'operator' at position
        const augAssign = raw.rules['augmented_assignment']
        expect(augAssign).toBeDefined()
        console.log('augmented_assignment type:', augAssign?.type)

        // Check for override-injected fields
        if (augAssign?.type === 'seq') {
            const fields = augAssign.members.filter((m: any) => m.type === 'field')
            console.log('augmented_assignment fields:', fields.map((f: any) => `${f.name} (source: ${f.source ?? 'grammar'})`))
        }

        // Check a rule that ONLY has override fields — e.g., 'block' which
        // the overrides.json wraps child 0 as field('block')
        const block = raw.rules['block']
        console.log('block type:', block?.type)
        if (block?.type === 'seq') {
            const fields = block.members.filter((m: any) => m.type === 'field')
            console.log('block fields:', fields.map((f: any) => `${f.name} (source: ${f.source ?? 'grammar'})`))
        }

        // Count total override fields across all rules
        let overrideCount = 0
        for (const rule of Object.values(raw.rules)) {
            countOverrideFields(rule, (n) => { overrideCount += n })
        }
        console.log('total override fields across all rules:', overrideCount)
    })

    function countOverrideFields(rule: any, cb: (n: number) => void) {
        if (rule?.type === 'field' && rule.source === 'override') cb(1)
        if (rule?.members) for (const m of rule.members) countOverrideFields(m, cb)
        if (rule?.content) countOverrideFields(rule.content, cb)
    }

    it('evaluates Python without overrides (base grammar only)', async () => {
        const grammarPath = resolveGrammarJsPath('python')
        const raw = await evaluate(grammarPath)
        expect(raw.name).toBe('python')

        // Without overrides, augmented_assignment should have grammar-level fields only
        const augAssign = raw.rules['augmented_assignment']
        expect(augAssign).toBeDefined()
    })
})
