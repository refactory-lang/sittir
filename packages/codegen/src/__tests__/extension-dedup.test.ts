import { describe, it, expect } from 'vitest'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { evaluate } from '../compiler/evaluate.ts'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const fixture = (name: string) => resolve(__dirname, 'fixtures', name)

describe('extension-point dedupe (Phase 6)', () => {
    it('collapses duplicate externals entries to a single occurrence', async () => {
        const raw = await evaluate(fixture('extension-dedup-grammar.js'))
        // Source listed `_indent` twice and `_dedent` once. After
        // appendDedup, externals should have each exactly once.
        const indentCount = raw.externals.filter((e) => e === '_indent').length
        const dedentCount = raw.externals.filter((e) => e === '_dedent').length
        expect(indentCount).toBe(1)
        expect(dedentCount).toBe(1)
    })

    it('collapses duplicate extras entries to a single occurrence', async () => {
        const raw = await evaluate(fixture('extension-dedup-grammar.js'))
        // Source listed /\s/ twice. The pattern's source string is `\\s`.
        const whitespaceCount = raw.extras.filter((e) => e === '\\s').length
        expect(whitespaceCount).toBe(1)
    })
})
