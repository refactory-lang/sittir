/**
 * convert-overrides.ts — one-shot script to convert overrides.json → overrides.ts
 *
 * Usage: npx tsx packages/codegen/scripts/convert-overrides.ts <grammar-name> <grammar-js-path>
 *
 * Reads packages/<grammar>/overrides.json, produces packages/<grammar>/overrides.ts
 * as a grammar extension with transform() calls.
 *
 * Historical: this was used once to migrate the v1 overrides.json seed
 * files (with tree-sitter structural field positions) into hand-curated
 * overrides.ts grammar extensions (with raw positions). It is preserved
 * here for reference — the overrides.ts files are now hand-edited and
 * this script should not need to run again.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import { evaluate } from '../src/compiler/evaluate.ts'
import type { Rule } from '../src/compiler/rule.ts'

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

// Load the base grammar so we can translate structural positions (the v1
// convention used when overrides.json was generated) into raw positions
// that the new transform() primitive operates on. transform() intentionally
// takes raw indices so users can add a field name to an unnamed entry.
const raw = await evaluate(grammarJsPath)

/**
 * Convert a "structural position N" — the Nth member that is neither a
 * string literal nor an already-labeled field() wrapper — into the
 * corresponding raw member index in the actual rule tree.
 */
function structuralToRaw(kind: string, structuralPos: number): number | null {
    const rule = raw.rules[kind]
    if (!rule || rule.type !== 'seq') return null
    let seen = 0
    for (let i = 0; i < rule.members.length; i++) {
        const m = rule.members[i]!
        if (m.type === 'string' || m.type === 'field') continue
        if (seen === structuralPos) return i
        seen++
    }
    return null
}

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

let skippedOutOfBounds = 0
for (const [kind, entry] of Object.entries(overrides)) {
    const fields = entry.fields
    if (!fields || Object.keys(fields).length === 0) continue

    // Build the patches object: { rawIndex: field(name) }. overrides.json
    // positions are the v1 "structural" view; translate each to a raw
    // member index against the v2 rule tree before emitting.
    const patches: string[] = []
    for (const [fieldName, info] of Object.entries(fields)) {
        // Skip position -1 (anonymous-only overrides — these match tokens,
        // not positional children).
        if (info.position < 0) continue
        const rawIndex = structuralToRaw(kind, info.position)
        if (rawIndex === null) {
            skippedOutOfBounds++
            continue
        }
        const comment = info.types.map(t => t.type).join(' | ')
        patches.push(`            ${rawIndex}: field('${fieldName}'), // ${comment} [struct=${info.position}]`)
    }

    if (patches.length === 0) continue

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
