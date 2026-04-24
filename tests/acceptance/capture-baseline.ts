/**
 * One-shot baseline capture for the US1 acceptance suite. Runs the
 * inline codemod with `SITTIR_BACKEND=typescript` forced, writing each
 * rewritten source to `fixtures/codemod-sample/baseline/<name>`. The
 * acceptance test compares fresh codemod runs (default backend, which
 * picks native when available) against these bytes.
 *
 * Run via:
 *   SITTIR_BACKEND=typescript node --experimental-strip-types \
 *     tests/acceptance/capture-baseline.ts
 *
 * Idempotent — re-running with the same corpus rewrites the same bytes.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { join, basename, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runCodemodOnDir } from './codemod-inline.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CORPUS_DIR = join(__dirname, 'fixtures', 'codemod-sample')
const BASELINE_DIR = join(CORPUS_DIR, 'baseline')

if (process.env.SITTIR_BACKEND !== 'typescript') {
    console.error(
        'capture-baseline must run with SITTIR_BACKEND=typescript so the ' +
            'baseline reflects the TS engine output, not whatever backend ' +
            'the developer happens to have built.',
    )
    process.exit(2)
}

mkdirSync(BASELINE_DIR, { recursive: true })
const results = await runCodemodOnDir(CORPUS_DIR)
let total = 0
for (const r of results) {
    const target = join(BASELINE_DIR, basename(r.path))
    writeFileSync(target, r.output, 'utf-8')
    total += r.insertions
    console.log(`${basename(r.path)}: ${r.insertions} insertion(s)`)
}
console.log(`---\ntotal insertions: ${total} across ${results.length} files`)
console.log(`baseline written to ${BASELINE_DIR}`)
