import { describe, it, expect } from 'vitest'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { loadWebTreeSitter } from '../validators/common.ts'

const pythonSittirDir = join(__dirname, '../../../python/.sittir')
const wasmPath = join(pythonSittirDir, 'parser.wasm')

describe('spike: override-compiled parser', () => {
    it.skipIf(!existsSync(wasmPath))('loads override WASM and parses python', async () => {
        const { Parser, Language } = await loadWebTreeSitter()
        const lang = await Language.load(wasmPath)
        const parser = new Parser()
        parser.setLanguage(lang)

        const tree = parser.parse('a if b else c') as any
        const root = tree.rootNode

        expect(root.type).toBe('module')
        const expr = root.firstChild
        expect(expr.type).toBe('expression_statement')

        const cond = expr.firstNamedChild
        expect(cond.type).toBe('conditional_expression')

        const bodyField = cond.childForFieldName('body')
        const conditionField = cond.childForFieldName('condition')
        const alternativeField = cond.childForFieldName('alternative')

        expect(bodyField).not.toBeNull()
        expect(conditionField).not.toBeNull()
        expect(alternativeField).not.toBeNull()
        expect(bodyField!.text).toBe('a')
        expect(conditionField!.text).toBe('b')
        expect(alternativeField!.text).toBe('c')
    })
})
