/**
 * inspect-suggestions.ts — dump LinkedGrammar.suggestedOverrides for
 * a grammar so we can eyeball the diagnostic derivations.
 *
 * Usage: tsx packages/codegen/scripts/inspect-suggestions.ts <grammar>
 */

import { evaluate } from '../src/compiler/evaluate.ts'
import { link } from '../src/compiler/link.ts'
import { resolveGrammarJsPath, resolveOverridesPath } from '../src/compiler/resolve-grammar.ts'
import { existsSync } from 'node:fs'

const grammar = process.argv[2] ?? 'python'
const useOverrides = process.argv[3] !== '--base'
const overridesPath = resolveOverridesPath(grammar)
const entryPath = (useOverrides && existsSync(overridesPath))
    ? overridesPath
    : resolveGrammarJsPath(grammar)
console.log(`entry: ${entryPath}`)

const raw = await evaluate(entryPath)
console.log(`raw.references: ${raw.references.length}`)
const named = raw.references.filter(r => r.fieldName !== undefined)
console.log(`  with fieldName: ${named.length}`)
const samples = raw.references.slice(0, 5)
console.log('  first 5:')
for (const r of samples) console.log('   ', JSON.stringify(r))

const linked = link(raw)
const sug = linked.suggestedOverrides ?? []

console.log(`${grammar}: ${sug.length} suggestions`)
const byKind: Record<string, number> = {}
for (const s of sug) {
    const tag = s.derivation.split(':')[0]
    byKind[tag] = (byKind[tag] ?? 0) + 1
}
console.log('By derivation:', byKind)
console.log()

const groups: Array<[string, string]> = [
    ['field-name-inference', 'field-name-inference'],
    ['global-optionality', 'global-optionality'],
    ['naming-consistency', 'naming-consistency'],
]
for (const [tag, label] of groups) {
    console.log(`--- ${label} (first 5) ---`)
    let n = 0
    for (const s of sug) {
        if (n >= 5) break
        if (!s.derivation.startsWith(tag)) continue
        console.log(' ', s.kind, JSON.stringify(s.path), '-', s.confidence)
        console.log('     ', s.derivation)
        n++
    }
    console.log()
}
