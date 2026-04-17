import { describe, it, expect, beforeAll } from 'vitest'
import { join } from 'node:path'
import { existsSync, statSync, utimesSync } from 'node:fs'
import { compileParser } from '../transpile/compile-parser.ts'

const packagesRoot = join(__dirname, '../../../')
const pythonDir = join(packagesRoot, 'python')
const grammarJs = join(pythonDir, '.sittir', 'grammar.js')

describe('compileParser', () => {
    it.skipIf(!existsSync(grammarJs))('produces parser.wasm from .sittir/grammar.js', async () => {
        const wasmPath = await compileParser(pythonDir, { force: true })
        expect(wasmPath).toContain('parser.wasm')
        expect(existsSync(wasmPath)).toBe(true)
        const stat = statSync(wasmPath)
        expect(stat.size).toBeGreaterThan(100_000)
    }, 60_000)

    it.skipIf(!existsSync(grammarJs))('reuses cached WASM when grammar.js is unchanged', async () => {
        const wasmPath1 = await compileParser(pythonDir)
        const mtime1 = statSync(wasmPath1).mtimeMs
        const wasmPath2 = await compileParser(pythonDir)
        const mtime2 = statSync(wasmPath2).mtimeMs
        expect(mtime1).toBe(mtime2)
    }, 60_000)

    it.skipIf(!existsSync(grammarJs))('recompiles when grammar.js is newer than cached WASM', async () => {
        const wasmPath = await compileParser(pythonDir)
        const mtime1 = statSync(wasmPath).mtimeMs

        // Touch grammar.js to make it newer
        const now = new Date()
        utimesSync(grammarJs, now, now)

        const wasmPath2 = await compileParser(pythonDir)
        const mtime2 = statSync(wasmPath2).mtimeMs
        expect(mtime2).toBeGreaterThan(mtime1)
    }, 60_000)

    it('throws when .sittir/grammar.js is missing', async () => {
        const fakeDir = join(packagesRoot, 'nonexistent')
        await expect(compileParser(fakeDir)).rejects.toThrow(/grammar\.js/)
    })

    it.skipIf(!existsSync(grammarJs))('produces node-types.json alongside parser.wasm', async () => {
        await compileParser(pythonDir)
        const nodeTypes = join(pythonDir, '.sittir', 'src', 'node-types.json')
        expect(existsSync(nodeTypes)).toBe(true)
    }, 60_000)

    it.skipIf(!existsSync(grammarJs))('warm-cache path completes in <500ms', async () => {
        await compileParser(pythonDir)
        const start = performance.now()
        await compileParser(pythonDir)
        const elapsed = performance.now() - start
        expect(elapsed).toBeLessThan(500)
    }, 60_000)
})
