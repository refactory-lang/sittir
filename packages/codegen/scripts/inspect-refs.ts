/**
 * inspect-refs.ts — dump every reference TO a given symbol so we can see
 * which parents name it and which don't.
 *
 * Usage: tsx inspect-refs.ts <grammar> <symbolName>
 */
import { evaluate } from '../src/compiler/evaluate.ts'
import { resolveGrammarJsPath, resolveOverridesPath } from '../src/compiler/resolve-grammar.ts'
import { existsSync } from 'node:fs'

const grammar = process.argv[2] ?? 'rust'
const symbol = process.argv[3] ?? '_type_identifier'

const overridesPath = resolveOverridesPath(grammar)
const entryPath = existsSync(overridesPath) ? overridesPath : resolveGrammarJsPath(grammar)
const raw = await evaluate(entryPath)

const refs = raw.references.filter(r => r.to === symbol)
console.log(`${refs.length} references to ${symbol}:`)
const named = refs.filter(r => r.fieldName !== undefined)
const unnamed = refs.filter(r => r.fieldName === undefined)
console.log(`  named:   ${named.length}`)
console.log(`  unnamed: ${unnamed.length}`)
console.log()
console.log('Named references (parent → fieldName):')
for (const r of named) {
    console.log(`  ${r.from} → field('${r.fieldName}')${r.optional ? ' [optional]' : ''}${r.repeated ? ' [repeated]' : ''}`)
}
console.log()
console.log('Unnamed references (parent only):')
for (const r of unnamed) {
    console.log(`  ${r.from}${r.optional ? ' [optional]' : ''}${r.repeated ? ' [repeated]' : ''}`)
}
