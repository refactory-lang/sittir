/**
 * T067 — verify strict-mode leaf pattern validation.
 *
 * The emitter gates leaf-pattern runtime checks behind
 * `GenerateConfigV2.strict`. Default-off keeps hot-path callers
 * and auto-generated tests happy; opt-in adds a regex guard to
 * every pattern-bearing leaf factory.
 */

import { describe, it, expect } from 'vitest'
import { generateV2 } from '../compiler/generate.ts'

describe('T067 strict-mode leaf pattern validation', () => {
    it('default (strict=false) emits no regex guard', async () => {
        const result = await generateV2({
            grammar: 'rust',
            outputDir: '/tmp/rust-nostrict',
        })
        // No guard → no RegExp construction per factory call.
        expect(result.factories).not.toContain('new RegExp')
    })

    it('strict=true emits a RegExp guard on leaves with a pattern', async () => {
        const result = await generateV2({
            grammar: 'rust',
            outputDir: '/tmp/rust-strict',
            strict: true,
        })
        // Identifier / metavariable / shebang all carry grammar
        // patterns, so strict mode must compile them and guard the
        // factory entry point.
        expect(result.factories).toContain('new RegExp')
        expect(result.factories).toContain('does not match pattern')
    })

    it('enum validation is always on, regardless of strict flag', async () => {
        const result = await generateV2({
            grammar: 'rust',
            outputDir: '/tmp/rust-enum-check',
        })
        // Every enum factory includes the .includes() guard,
        // independent of strict.
        expect(result.factories).toContain('.includes(text)')
        expect(result.factories).toContain('is not one of')
    })
})
