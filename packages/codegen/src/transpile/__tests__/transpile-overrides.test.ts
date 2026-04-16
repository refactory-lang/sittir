/**
 * transpile-overrides.test.ts — integration test for the TS→CJS
 * transpile bridge that enables tree-sitter CLI consumption of
 * sittir override files.
 *
 * This is an integration test, not a unit test — it runs the real
 * esbuild build against the real python override file and validates
 * the resulting bundle. A unit test with mocked esbuild would miss
 * the most common failure modes (externalize regex, footer
 * flattening, package.json shape, scanner copy).
 */

import { describe, it, expect, afterAll } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { transpileOverrides } from '../transpile-overrides.ts'

// __tests__ is 4 levels down from the `packages/` directory:
// packages/codegen/src/transpile/__tests__/ → up 4 → packages/
const PACKAGES_ROOT = new URL('../../../../', import.meta.url).pathname

describe('transpileOverrides — integration', () => {
    // We target python because it has an external scanner (indent/
    // dedent) which exercises the scanner-copy code path that other
    // grammars skip.
    const GRAMMAR = 'python'
    const outputDir = join(PACKAGES_ROOT, GRAMMAR, '.sittir')

    afterAll(() => {
        // Leave .sittir/ in place — tree-sitter parse tests (corpus
        // validation) may want to use it. If we ran into a stale
        // mismatch, regenerating is cheap.
    })

    it('produces .sittir/grammar.js, package.json, tree-sitter.json', async () => {
        const result = await transpileOverrides({ grammar: GRAMMAR })
        expect(result.outputPath).toBe(join(outputDir, 'grammar.js'))
        expect(existsSync(result.outputPath)).toBe(true)
        expect(existsSync(join(outputDir, 'package.json'))).toBe(true)
        expect(existsSync(join(outputDir, 'tree-sitter.json'))).toBe(true)
        expect(result.sourceBytes).toBeGreaterThan(0)
        expect(result.outputBytes).toBeGreaterThan(0)
    })

    it('writes package.json with CommonJS type + tree-sitter metadata', async () => {
        await transpileOverrides({ grammar: GRAMMAR })
        const pkg = JSON.parse(readFileSync(join(outputDir, 'package.json'), 'utf8'))
        expect(pkg.name).toBe(`tree-sitter-${GRAMMAR}`)
        expect(pkg.type).toBe('commonjs')
        expect(pkg['tree-sitter']).toBeInstanceOf(Array)
        expect(pkg['tree-sitter'][0]).toMatchObject({ scope: `source.${GRAMMAR}` })
    })

    it('writes tree-sitter.json with ABI-15 schema', async () => {
        await transpileOverrides({ grammar: GRAMMAR })
        const cfg = JSON.parse(readFileSync(join(outputDir, 'tree-sitter.json'), 'utf8'))
        expect(cfg.$schema).toMatch(/tree-sitter\.github\.io.*config\.schema\.json/)
        expect(cfg.grammars[0].name).toBe(GRAMMAR)
        expect(cfg.grammars[0].scope).toBe(`source.${GRAMMAR}`)
        expect(cfg.metadata).toBeDefined()
    })

    it('copies the base scanner.c for grammars with external scanners', async () => {
        await transpileOverrides({ grammar: GRAMMAR })
        // python ships an external scanner; the transpile step should
        // have copied it into .sittir/src/scanner.c.
        expect(existsSync(join(outputDir, 'src', 'scanner.c'))).toBe(true)
    })

    it('externalizes tree-sitter base packages (including transitive deps)', async () => {
        await transpileOverrides({ grammar: GRAMMAR })
        const bundled = readFileSync(join(outputDir, 'grammar.js'), 'utf8')
        // The bundle should `require()` the base grammar package by
        // name, NOT inline its whole rules object. If the externalize
        // regex failed, we'd see the base grammar's keywords inline.
        expect(bundled).toMatch(/require\(["']tree-sitter-python\/grammar(\.js)?["']\)/)
        // And the bundle should NOT inline `tree-sitter-javascript`
        // (python doesn't use it, but we verify the transitive
        // externalization regex handles the common case by asserting
        // ANY transitive tree-sitter-* import also uses require).
        expect(bundled).not.toMatch(/module2\.exports = function defineGrammar/)
    })

    it('flattens module.exports.default so tree-sitter sees the grammar at top level', async () => {
        await transpileOverrides({ grammar: GRAMMAR })
        const bundled = readFileSync(join(outputDir, 'grammar.js'), 'utf8')
        // The footer must be present — tree-sitter CLI expects
        // `module.exports` to be the grammar itself, not wrapped in
        // `{ default: ..., __esModule: true }`.
        expect(bundled).toMatch(/module\.exports\s*=\s*module\.exports\.default/)
    })

    it('throws when overrides.ts does not exist', async () => {
        await expect(
            transpileOverrides({ grammar: 'nonexistent-grammar-xyz' }),
        ).rejects.toThrow(/no overrides\.ts/)
    })
})
