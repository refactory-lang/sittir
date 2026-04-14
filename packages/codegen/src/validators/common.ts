/**
 * validators/common.ts — shared infrastructure across the three
 * corpus validators (`validate-roundtrip`, `validate-factory-roundtrip`,
 * `validate-from`). C15.
 *
 * Everything in here used to be duplicated three times:
 *   - Tree-sitter adapter: `adaptNode`, `treeHandle`, `findFirst`,
 *     `collectKinds`.
 *   - Corpus parser: `parseCorpus`, `loadCorpusEntries`.
 *   - Reparse wrapping: `buildKindToSupertypes`, `wrapForReparse`.
 *
 * Per-validator logic (per-kind assertions, reporting) stays in its
 * own file and imports whatever it needs from here.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { AnyTreeNode } from '@sittir/types'

// ---------------------------------------------------------------------------
// Corpus parser — tree-sitter test corpus format
// ---------------------------------------------------------------------------

export interface CorpusEntry {
    name: string
    source: string
}

/**
 * Parse a tree-sitter test corpus file.
 * Format: `====` header, test name, `====`, source, `----`, expected tree.
 */
export function parseCorpus(content: string): CorpusEntry[] {
    const entries: CorpusEntry[] = []
    const lines = content.split('\n')
    let i = 0

    while (i < lines.length) {
        if (!lines[i]!.startsWith('====')) { i++; continue }
        i++

        const name = lines[i]?.trim() ?? ''
        i++

        while (i < lines.length && lines[i]!.startsWith('====')) i++

        const sourceLines: string[] = []
        while (i < lines.length && !lines[i]!.match(/^-{3,}$/)) {
            sourceLines.push(lines[i]!)
            i++
        }

        while (i < lines.length && !lines[i]!.startsWith('====')) i++

        const source = sourceLines.join('\n').trim()
        if (source) entries.push({ name, source })
    }

    return entries
}

// ---------------------------------------------------------------------------
// Fixtures directory + loader
// ---------------------------------------------------------------------------

const FIXTURES_DIR = new URL('../../fixtures', import.meta.url).pathname

export function loadCorpusEntries(grammar: string): CorpusEntry[] {
    const entries: CorpusEntry[] = []
    const files = readdirSync(FIXTURES_DIR).filter(f => f.startsWith(`${grammar}-`) && f.endsWith('.txt'))
    for (const file of files) {
        const content = readFileSync(join(FIXTURES_DIR, file), 'utf-8')
        entries.push(...parseCorpus(content))
    }
    return entries
}

// ---------------------------------------------------------------------------
// Tree-sitter → AnyTreeNode adapter
// ---------------------------------------------------------------------------

export interface TSNode {
    type: string
    text: string
    startIndex: number
    endIndex: number
    isNamed: boolean
    childCount: number
    namedChildCount: number
    children: TSNode[]
    child(index: number): TSNode | null
    fieldNameForChild(index: number): string | null
    childForFieldName(fieldName: string): TSNode | null
    id: number
    hasError: boolean
}

export interface TSTree {
    rootNode: TSNode
}

// ---------------------------------------------------------------------------
// web-tree-sitter loader — shared typed import
// ---------------------------------------------------------------------------

export interface TSParser {
    parse(source: string): TSTree
    setLanguage(lang: unknown): void
}

export interface TSParserCtor {
    new (): TSParser
    init(): Promise<void>
}

export interface TSLanguageCtor {
    load(path: string): Promise<unknown>
}

export interface WebTreeSitterModule {
    Parser?: TSParserCtor
    Language?: TSLanguageCtor
    default?: { Parser?: TSParserCtor; Language?: TSLanguageCtor } | TSParserCtor
}

/**
 * Dynamic import of web-tree-sitter. The package ships CommonJS with
 * ambiguous default-export shape depending on bundler, so we try the
 * two common locations and throw if neither carries `Parser` + `Language`.
 */
export async function loadWebTreeSitter(): Promise<{ Parser: TSParserCtor; Language: TSLanguageCtor }> {
    const mod = await import('web-tree-sitter') as WebTreeSitterModule
    const Parser = mod.Parser ?? (mod.default && 'Parser' in mod.default ? mod.default.Parser : undefined)
    const Language = mod.Language ?? (mod.default && 'Language' in mod.default ? mod.default.Language : undefined)
    if (!Parser || !Language) {
        throw new Error("web-tree-sitter: could not locate `Parser` or `Language` export")
    }
    await Parser.init()
    return { Parser, Language }
}

export function adaptNode(node: TSNode): AnyTreeNode {
    return {
        type: node.type,
        id: () => node.id,
        text: () => node.text,
        isNamed: () => node.isNamed,
        field: (name: string) => {
            const child = node.childForFieldName(name)
            return child ? adaptNode(child) : null
        },
        fieldChildren: (name: string) => {
            const result: AnyTreeNode[] = []
            for (let i = 0; i < node.childCount; i++) {
                if (node.fieldNameForChild(i) === name) {
                    const child = node.child(i)
                    if (child) result.push(adaptNode(child))
                }
            }
            return result
        },
        fieldNameForChild: (index: number) => node.fieldNameForChild(index),
        children: () => node.children.map(adaptNode),
        range: () => ({
            start: { index: node.startIndex },
            end: { index: node.endIndex },
        }),
    }
}

export function treeHandle(tree: TSTree) {
    const nodeMap = new Map<number, TSNode>()
    function collect(node: TSNode) {
        nodeMap.set(node.id, node)
        for (const child of node.children) collect(child)
    }
    collect(tree.rootNode)

    return {
        rootNode: adaptNode(tree.rootNode),
        nodeById: (id: number) => {
            const node = nodeMap.get(id)
            if (!node) throw new Error(`Node ${id} not found`)
            return adaptNode(node)
        },
    }
}

export function findFirst(node: TSNode, kind: string): TSNode | null {
    if (node.type === kind) return node
    for (const child of node.children) {
        const found = findFirst(child, kind)
        if (found) return found
    }
    return null
}

export function collectKinds(node: TSNode): Set<string> {
    const kinds = new Set<string>()
    function walk(n: TSNode) {
        if (n.isNamed) kinds.add(n.type)
        for (const child of n.children) walk(child)
    }
    walk(node)
    return kinds
}

// ---------------------------------------------------------------------------
// Supertype-based reparse wrapping
// ---------------------------------------------------------------------------

export function buildKindToSupertypes(
    rawEntries: { type: string; named: boolean; subtypes?: { type: string }[] }[],
): Map<string, string[]> {
    const result = new Map<string, string[]>()
    for (const entry of rawEntries) {
        if (!entry.subtypes) continue
        for (const sub of entry.subtypes) {
            const existing = result.get(sub.type) ?? []
            existing.push(entry.type)
            result.set(sub.type, existing)
        }
    }
    return result
}

const REPARSE_WRAPPERS: Record<string, Record<string, (r: string) => string>> = {
    rust: {
        '_expression': r => `fn _f() { let _ = ${r}; }`,
        '_type': r => `type _X = ${r};`,
        '_pattern': r => `fn _f() { let ${r} = (); }`,
        '_declaration_statement': r => r,
        '_literal': r => `fn _f() { let _ = ${r}; }`,
        '_literal_pattern': r => `fn _f() { let ${r} = (); }`,
    },
    typescript: {
        '_expression': r => `let _ = ${r};`,
        '_type': r => `type _X = ${r};`,
        '_pattern': r => `let ${r} = null;`,
        '_declaration': r => r,
        '_statement': r => r,
    },
    python: {
        '_expression': r => `_ = ${r}`,
        '_type': r => `_: ${r} = None`,
        '_pattern': r => `match _:\n  case ${r}: pass`,
        '_simple_statement': r => r,
        '_compound_statement': r => r,
    },
}

export function wrapForReparse(
    rendered: string,
    kind: string,
    grammar: string,
    kindToSupertypes: Map<string, string[]>,
): string | null {
    const supertypes = kindToSupertypes.get(kind)
    if (!supertypes || supertypes.length === 0) return null
    const wrappers = REPARSE_WRAPPERS[grammar]
    if (!wrappers) return null
    for (const st of supertypes) {
        const wrapper = wrappers[st]
        if (wrapper) return wrapper(rendered)
    }
    return null
}

// ---------------------------------------------------------------------------
// Well-known WASM module paths
// ---------------------------------------------------------------------------

export const WASM_PATHS: Record<string, string> = {
    rust: 'tree-sitter-rust/tree-sitter-rust.wasm',
    typescript: 'tree-sitter-typescript/tree-sitter-typescript.wasm',
    python: 'tree-sitter-python/tree-sitter-python.wasm',
}
