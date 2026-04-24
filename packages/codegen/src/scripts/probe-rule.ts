/**
 * probe-rule — dump the fully-simplified rule for a kind.
 * Usage: npx tsx packages/codegen/src/scripts/probe-rule.ts <grammar> <kind>
 */

import { evaluate } from '../compiler/evaluate.ts'
import { link } from '../compiler/link.ts'
import { optimize } from '../compiler/optimize.ts'
import { simplifyRule } from '../compiler/simplify.ts'
import { resolveOverridesPath } from '../compiler/resolve-grammar.ts'

const [grammar, kind] = process.argv.slice(2)
if (!grammar || !kind) {
    console.error('Usage: probe-rule.ts <grammar> <kind>')
    process.exit(1)
}

const raw = await evaluate(resolveOverridesPath(grammar))
console.log('=== POST-EVALUATE ===')
console.log(JSON.stringify(raw.rules[kind], (k, v) => k === '_ref' ? undefined : v, 2))

const linked = link(raw)
console.log('\n=== POST-LINK ===')
console.log(JSON.stringify(linked.rules[kind], (k, v) => k === '_ref' ? undefined : v, 2))

const optimized = optimize(linked)
console.log('\n=== POST-OPTIMIZE ===')
console.log(JSON.stringify(optimized.rules[kind], (k, v) => k === '_ref' ? undefined : v, 2))

const r = optimized.rules[kind]
const s = r ? simplifyRule(r) : null
if (s) {
    console.log('\n=== POST-SIMPLIFY ===')
    console.log(JSON.stringify(s, (k, v) => k === '_ref' ? undefined : v, 2))
}
if (!r) console.log('kind not found:', kind)
