/**
 * Dump per-kind validator failures for a grammar.
 * Usage: npx tsx packages/codegen/src/scripts/diff-failures.ts <grammar> [which]
 *   which: from|rt|cov|factory (default: all)
 */

import { resolve } from 'node:path'
import { validateFactoryRoundTrip } from '../validate/factory-roundtrip.ts'
import { validateFrom } from '../validate/from.ts'
import { validateRoundTrip } from '../validate/roundtrip.ts'
import { validateTemplateCoverage } from '../validate/template-coverage.ts'

const [grammar, which = 'all'] = process.argv.slice(2)
if (!grammar) {
    console.error('Usage: diff-failures.ts <grammar> [from|rt|cov|factory|all]')
    process.exit(1)
}
const tp = resolve(new URL('../../../..', import.meta.url).pathname, `packages/${grammar}/templates`)

if (which === 'all' || which === 'from') {
    const r = await validateFrom(grammar)
    console.log(`\n=== FROM (${r.pass}/${r.total}) ===`)
    for (const e of r.errors) console.log(`  ${e.severity === 'error' ? 'E' : 'W'} ${e.kind}: ${e.message}`)
}
if (which === 'all' || which === 'rt') {
    const r = await validateRoundTrip(grammar, tp)
    console.log(`\n=== RT (${r.pass}/${r.total}, ast=${r.astMatchPass}) ===`)
    for (const e of r.errors) console.log(`  E ${e.name}: ${e.message}`)
    console.log(`-- AST mismatches --`)
    for (const e of r.astMismatches) console.log(`  M ${e.name}: ${e.message}`)
}
if (which === 'all' || which === 'cov') {
    const r = validateTemplateCoverage(grammar, tp)
    console.log(`\n=== COV (${r.pass}/${r.total}) ===`)
    for (const i of r.issues) console.log(`  ${i.type === 'literal-leak' ? 'W' : 'E'} ${i.kind}: ${i.message}`)
}
if (which === 'all' || which === 'factory') {
    const r = await validateFactoryRoundTrip(grammar, tp)
    console.log(`\n=== FACTORY (${r.pass}/${r.total}, ast=${r.astMatchPass}) ===`)
    for (const e of r.errors) console.log(`  E ${e.kind}: ${e.message}`)
}
