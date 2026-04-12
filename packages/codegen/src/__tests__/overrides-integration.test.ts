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
            console.log('augmented_assignment fields:', fields.map((f: any) => f.name))
            const overrideFields = fields.filter((f: any) => f.source === 'override')
            console.log('override fields:', overrideFields.length)
        }
    })

    it('evaluates Python without overrides (base grammar only)', async () => {
        const grammarPath = resolveGrammarJsPath('python')
        const raw = await evaluate(grammarPath)
        expect(raw.name).toBe('python')

        // Without overrides, augmented_assignment should have grammar-level fields only
        const augAssign = raw.rules['augmented_assignment']
        expect(augAssign).toBeDefined()
    })
})
