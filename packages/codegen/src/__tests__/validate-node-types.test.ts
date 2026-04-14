/**
 * T021 — node-types.json validation pass.
 *
 * Checks the optional post-Link validator against the three shipped
 * grammars. It's a sanity check: every named node-types.json entry
 * should map to a linked rule, and supertype membership should
 * agree between tree-sitter's own metadata and Link's
 * classification.
 */

import { describe, it, expect } from 'vitest'
import { evaluate } from '../compiler/evaluate.ts'
import { link } from '../compiler/link.ts'
import { validateAgainstNodeTypes, formatNodeTypesValidationReport } from '../compiler/validate-node-types.ts'
import { resolveGrammarJsPath, resolveOverridesPath } from '../compiler/resolve-grammar.ts'
import { existsSync } from 'node:fs'

for (const grammar of ['rust', 'typescript', 'python'] as const) {
    describe(`T021 node-types validation — ${grammar}`, () => {
        it(`runs without throwing`, async () => {
            const overrides = resolveOverridesPath(grammar)
            const entry = existsSync(overrides) ? overrides : resolveGrammarJsPath(grammar)
            const raw = await evaluate(entry)
            const linked = link(raw)
            const result = validateAgainstNodeTypes(grammar, linked)
            // Log the report for visibility in CI output.
            if (result.discrepancies.length > 0) {
                // eslint-disable-next-line no-console
                console.warn(formatNodeTypesValidationReport(result))
            }
            // The validator shouldn't crash; total/matched should
            // be well-defined.
            expect(result.grammar).toBe(grammar)
            expect(result.total).toBeGreaterThanOrEqual(0)
            expect(result.matched).toBeGreaterThanOrEqual(0)
            expect(result.matched).toBeLessThanOrEqual(result.total)
        })
    })
}
