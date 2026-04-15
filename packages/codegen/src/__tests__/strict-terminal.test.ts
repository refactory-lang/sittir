/**
 * T067 — verify leaf-factory guards.
 *
 * Pattern validation: hoisted to module-level regex consts (regex
 * literals where valid JS, `new RegExp` otherwise), checked once at
 * load time and reused per call.
 *
 * Enum validation: compile-time only via literal-union parameter type.
 * No runtime `.includes()` guard — the type system enforces it for
 * typed callers; from() resolvers use the registry `values` list.
 *
 * Word-kind keyword exclusion: always-on RESERVED_KEYWORDS check.
 */

import { describe, it, expect } from 'vitest'
import { generate } from '../compiler/generate.ts'

describe('leaf factory guards', () => {
    it('hoists leaf pattern checks to module-level regex consts', async () => {
        const result = await generate({
            grammar: 'rust',
            outputDir: '/tmp/rust-leaf-pattern',
        })
        // Identifier / metavariable / shebang all carry grammar patterns.
        // They're compiled once at load time as module-level consts
        // (regex literals or new RegExp for patterns with exotic syntax).
        expect(result.factories).toContain('_leafRe_')
        expect(result.factories).toContain('does not match pattern')
    })

    it('enum factories use compile-time literal union, no runtime includes check', async () => {
        const result = await generate({
            grammar: 'rust',
            outputDir: '/tmp/rust-enum-check',
        })
        // Literal-union parameter (e.g. `text: 'u8' | 'i8' | ...`)
        // is the only guard — no runtime .includes() emitted.
        expect(result.factories).not.toContain('.includes(text)')
    })

    it('emits keyword exclusion on the word-kind leaf factory', async () => {
        const result = await generate({
            grammar: 'rust',
            outputDir: '/tmp/rust-word-kind',
        })
        // The grammar's `word` rule (rust: `identifier`) gets a
        // `RESERVED_KEYWORDS.has(text)` check.
        expect(result.factories).toContain('RESERVED_KEYWORDS')
        expect(result.factories).toContain('is a reserved keyword')
    })
})
