/**
 * convert-overrides.ts — one-shot script to convert overrides.json → overrides.ts
 *
 * Usage: npx tsx packages/codegen/src/compiler/convert-overrides.ts <grammar-name> <grammar-js-path>
 *
 * Reads packages/<grammar>/overrides.json, produces packages/<grammar>/overrides.ts
 * as a grammar extension with transform() calls.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, relative } from 'node:path'

interface OverrideField {
    types: { type: string; named: boolean }[]
    multiple: boolean
    required: boolean
    position: number
}

interface OverrideEntry {
    fields: Record<string, OverrideField>
}

const grammarName = process.argv[2]
const grammarJsPath = process.argv[3]

if (!grammarName || !grammarJsPath) {
    console.error('Usage: npx tsx convert-overrides.ts <grammar-name> <grammar-js-path>')
    process.exit(1)
}

const repoRoot = resolve(import.meta.dirname!, '../../../../')
const overridesJsonPath = resolve(repoRoot, `packages/${grammarName}/overrides.json`)
const overridesTsPath = resolve(repoRoot, `packages/${grammarName}/overrides.ts`)

const overrides: Record<string, OverrideEntry> = JSON.parse(readFileSync(overridesJsonPath, 'utf-8'))

// Compute relative path from packages/<grammar>/ to the grammar.js
const grammarRelPath = relative(resolve(repoRoot, `packages/${grammarName}`), grammarJsPath)

const lines: string[] = [
    `/**`,
    ` * overrides.ts — Grammar extension for ${grammarName}`,
    ` *`,
    ` * Converted from overrides.json. Each entry wraps an unnamed child`,
    ` * at a positional index with a named field.`,
    ` *`,
    ` * @generated from overrides.json — review before committing`,
    ` */`,
    ``,
    `// @ts-nocheck — grammar.js is untyped`,
    `import base from '${grammarRelPath}'`,
    ``,
    `export default grammar(base, {`,
    `    name: '${grammarName}',`,
    `    rules: {`,
]

for (const [kind, entry] of Object.entries(overrides)) {
    const fields = entry.fields
    if (!fields || Object.keys(fields).length === 0) continue

    // Build the patches object: { position: field(name) }
    const patches: string[] = []
    for (const [fieldName, info] of Object.entries(fields)) {
        // Skip position -1 (anonymous-only overrides — these match tokens, not positional children)
        if (info.position < 0) continue
        const comment = info.types.map(t => t.type).join(' | ')
        patches.push(`            ${info.position}: field('${fieldName}'), // ${comment}`)
    }

    lines.push(`        // ${kind}: ${Object.keys(fields).length} field(s)`)
    lines.push(`        ${kind}: ($, original) => transform(original, {`)
    lines.push(...patches)
    lines.push(`        }),`)
    lines.push(``)
}

lines.push(`    },`)
lines.push(`})`)
lines.push(``)

writeFileSync(overridesTsPath, lines.join('\n'))
console.log(`Wrote ${overridesTsPath} (${Object.keys(overrides).length} kinds, ${Object.values(overrides).reduce((n, e) => n + Object.keys(e.fields ?? {}).length, 0)} fields)`)
