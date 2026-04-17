/**
 * Global vitest setup — ensure every grammar's override parser is
 * compiled before any test runs.
 *
 * `.sittir/parser.wasm` is gitignored and regenerated on demand. On a
 * fresh checkout (or in CI) the file doesn't exist, and validators
 * that call `loadLanguageForGrammar` silently fall back to the base
 * WASM — which lacks override fields, which drops corpus-validation
 * ceilings below their floors, which fails the test.
 *
 * compileParser() is mtime-aware: if the WASM is newer than
 * grammar.js it's a no-op. Local developer runs skip the compile
 * step entirely. CI pays the compile cost (~5-10s per grammar) once
 * at the start of the test run.
 */

import { compileParser } from './packages/codegen/src/transpile/compile-parser.ts'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const GRAMMARS = ['rust', 'typescript', 'python'] as const

export async function setup() {
    for (const grammar of GRAMMARS) {
        const grammarDir = join(import.meta.dirname, 'packages', grammar)
        const grammarJs = join(grammarDir, '.sittir', 'grammar.js')
        if (!existsSync(grammarJs)) {
            console.warn(`[vitest-setup] no .sittir/grammar.js for ${grammar} — skip`)
            continue
        }
        try {
            const t0 = Date.now()
            const wasm = await compileParser(grammarDir)
            console.log(`[vitest-setup] ${grammar}: ${wasm} (${Date.now() - t0}ms)`)
        } catch (e) {
            console.error(`[vitest-setup] compileParser(${grammar}) failed:`, (e as Error).message?.slice(0, 200))
            throw e
        }
    }
}
