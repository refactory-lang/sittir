/**
 * diff-overrides-json — compare the derived OverridesConfig (from
 * overrides.ts via evaluate()) against the hand-maintained
 * overrides.json for a grammar. Prints a divergence report used to
 * drive overrides.ts fixes before flipping authority over.
 *
 * Usage:
 *   npx tsx packages/codegen/src/diff-overrides-json.ts rust
 *   npx tsx packages/codegen/src/diff-overrides-json.ts typescript
 *   npx tsx packages/codegen/src/diff-overrides-json.ts python
 */

import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { evaluate } from './compiler/evaluate.ts'
import { link } from './compiler/link.ts'
import {
    deriveOverridesConfig,
    type DerivedOverridesConfig,
    type DerivedFieldSpec,
} from './compiler/derive-overrides-json.ts'
import { resolveGrammarJsPath, resolveOverridesPath } from './compiler/resolve-grammar.ts'

const grammarName = process.argv[2]
if (!grammarName) {
    console.error('Usage: diff-overrides-json <grammar>')
    process.exit(1)
}

const grammarJs = resolveGrammarJsPath(grammarName)
const overridesTs = resolveOverridesPath(grammarName)
const entry = existsSync(overridesTs) ? overridesTs : grammarJs

// Evaluate (+Link for symbol resolution, which the field content walker
// relies on to see supertype expansions as `{type: 'supertype'}`).
const raw = await evaluate(entry)
const linked = link(raw, undefined)

// Determine which rule names were explicitly defined in the override
// file (not inherited from the base grammar). The raw grammar object
// exposes those names in a property set by grammarFn's internals — we
// look at which names in linked.rules have an override-provided rule by
// comparing to the base grammar's rule set (rules only in the override
// are the ones whose linked versions carry overridden content).
// Simplest proxy: anything whose rule was defined in opts.rules, which
// evaluate surfaces as `raw.overrideRuleNames` if present.
const overrideKinds: Set<string> = new Set(
    (raw as any).overrideRuleNames ?? Object.keys(raw.rules),
)

const derived = deriveOverridesConfig(linked.rules, overrideKinds)

const codegenDir = dirname(new URL(import.meta.url).pathname)
const packagesDir = dirname(dirname(codegenDir))
const handPath = join(packagesDir, grammarName, 'overrides.json')
const hand = existsSync(handPath)
    ? (JSON.parse(readFileSync(handPath, 'utf-8')) as DerivedOverridesConfig)
    : {}

// ---------------------------------------------------------------------------
// Diff
// ---------------------------------------------------------------------------

type FieldDiff =
    | { kind: 'only-in-hand'; name: string; spec: DerivedFieldSpec }
    | { kind: 'only-in-derived'; name: string; spec: DerivedFieldSpec }
    | {
          kind: 'changed'
          name: string
          hand: DerivedFieldSpec
          derived: DerivedFieldSpec
          changes: string[]
      }

type NodeDiff =
    | { kind: 'only-in-hand'; node: string }
    | { kind: 'only-in-derived'; node: string }
    | { kind: 'field-diff'; node: string; fields: FieldDiff[] }

function specChanges(a: DerivedFieldSpec, b: DerivedFieldSpec): string[] {
    const out: string[] = []
    if (a.multiple !== b.multiple) out.push(`multiple ${a.multiple}→${b.multiple}`)
    if (a.required !== b.required) out.push(`required ${a.required}→${b.required}`)
    if (a.position !== b.position) out.push(`position ${a.position}→${b.position}`)
    const aTypes = new Set(a.types.map(t => `${t.type}|${t.named}`))
    const bTypes = new Set(b.types.map(t => `${t.type}|${t.named}`))
    const only = (x: Set<string>, y: Set<string>) => [...x].filter(t => !y.has(t))
    const addedTypes = only(bTypes, aTypes)
    const removedTypes = only(aTypes, bTypes)
    if (addedTypes.length > 0) out.push(`+types [${addedTypes.join(', ')}]`)
    if (removedTypes.length > 0) out.push(`-types [${removedTypes.join(', ')}]`)
    return out
}

const allNodes = new Set([...Object.keys(hand), ...Object.keys(derived)])
const nodeDiffs: NodeDiff[] = []

for (const node of [...allNodes].sort()) {
    const h = hand[node]
    const d = derived[node]
    if (!h && d) {
        nodeDiffs.push({ kind: 'only-in-derived', node })
        continue
    }
    if (h && !d) {
        nodeDiffs.push({ kind: 'only-in-hand', node })
        continue
    }
    // Both present — compare fields.
    const hFields = h!.fields ?? {}
    const dFields = d!.fields ?? {}
    const fieldNames = new Set([...Object.keys(hFields), ...Object.keys(dFields)])
    const fieldDiffs: FieldDiff[] = []
    for (const fname of [...fieldNames].sort()) {
        const hf = hFields[fname]
        const df = dFields[fname]
        if (!hf && df) {
            fieldDiffs.push({ kind: 'only-in-derived', name: fname, spec: df })
            continue
        }
        if (hf && !df) {
            fieldDiffs.push({ kind: 'only-in-hand', name: fname, spec: hf })
            continue
        }
        const changes = specChanges(hf!, df!)
        if (changes.length > 0) {
            fieldDiffs.push({ kind: 'changed', name: fname, hand: hf!, derived: df!, changes })
        }
    }
    if (fieldDiffs.length > 0) {
        nodeDiffs.push({ kind: 'field-diff', node, fields: fieldDiffs })
    }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const handNodeCount = Object.keys(hand).length
const derivedNodeCount = Object.keys(derived).length
console.log(`${grammarName}: hand ${handNodeCount} nodes, derived ${derivedNodeCount} nodes`)

if (nodeDiffs.length === 0) {
    console.log('  ✓ overrides.ts matches overrides.json exactly')
    process.exit(0)
}

const onlyInHand = nodeDiffs.filter(d => d.kind === 'only-in-hand')
const onlyInDerived = nodeDiffs.filter(d => d.kind === 'only-in-derived')
const fieldDiffs = nodeDiffs.filter(d => d.kind === 'field-diff') as Array<
    Extract<NodeDiff, { kind: 'field-diff' }>
>

console.log(
    `  ${nodeDiffs.length} node divergence(s): ${onlyInHand.length} hand-only, ${onlyInDerived.length} derived-only, ${fieldDiffs.length} field-level`,
)

if (onlyInHand.length > 0) {
    console.log('\nNodes only in hand-maintained overrides.json (overrides.ts is missing these):')
    for (const d of onlyInHand) console.log(`  - ${d.node}`)
}

if (onlyInDerived.length > 0) {
    console.log('\nNodes only in derived config (overrides.ts has these but overrides.json does not):')
    for (const d of onlyInDerived) console.log(`  - ${d.node}`)
}

if (fieldDiffs.length > 0) {
    console.log('\nField-level divergences:')
    for (const nd of fieldDiffs) {
        console.log(`  ${nd.node}:`)
        for (const f of nd.fields) {
            if (f.kind === 'only-in-hand') {
                console.log(`    - hand-only field '${f.name}' types=[${f.spec.types.map(t => t.type).join(',')}]`)
            } else if (f.kind === 'only-in-derived') {
                console.log(`    + derived-only field '${f.name}' types=[${f.spec.types.map(t => t.type).join(',')}]`)
            } else {
                console.log(`    ~ '${f.name}': ${f.changes.join('; ')}`)
            }
        }
    }
}

process.exitCode = nodeDiffs.length > 0 ? 1 : 0
