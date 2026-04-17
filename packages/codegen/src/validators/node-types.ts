/**
 * validators/node-types.ts — thin loader for tree-sitter node-types.json.
 *
 * The pipeline only needs the raw entry array for validation (FR-010
 * permits node-types.json as a validation source, not a primary data
 * source). Consumers pass the
 * grammar name; the loader resolves to the npm package path and returns
 * the parsed array. No caches, no mutable state (FR-022).
 *
 * If a consumer needs to point at a non-standard file (e.g. test
 * fixtures), they pass the resolved path directly via the `explicitPath`
 * argument — there is no module-level path registry.
 */

import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const require = createRequire(import.meta.url)
const packagesDir = new URL('../../../', import.meta.url).pathname

export interface RawFieldEntry {
    required: boolean
    multiple: boolean
    types: Array<{ type: string; named: boolean }>
}

export interface RawNodeEntry {
    type: string
    named: boolean
    fields?: Record<string, RawFieldEntry>
    children?: RawFieldEntry
    subtypes?: Array<{ type: string; named: boolean }>
}

/**
 * Non-standard node-types.json locations. Most grammars follow the
 * `tree-sitter-{name}/src/node-types.json` convention; this table
 * lists the exceptions (typescript ships two grammars per package).
 */
const GRAMMAR_PATHS: Readonly<Record<string, string>> = {
    typescript: 'tree-sitter-typescript/typescript/src/node-types.json',
    tsx: 'tree-sitter-typescript/tsx/src/node-types.json',
}

export function loadRawEntries(
    grammar: string,
    explicitPath?: string,
): RawNodeEntry[] {
    if (explicitPath) return require(explicitPath)

    const overridePath = join(packagesDir, grammar, '.sittir', 'src', 'node-types.json')
    if (existsSync(overridePath)) return require(overridePath)

    const modulePath = GRAMMAR_PATHS[grammar] ?? `tree-sitter-${grammar}/src/node-types.json`
    return require(require.resolve(modulePath))
}
