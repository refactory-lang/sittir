/**
 * validate-readnode-roundtrip — pure structural check on readNode output.
 *
 * The other round-trip validators render the NodeData and reparse it to
 * catch template bugs. This one is upstream of that: it verifies that
 * readNode's projection of a tree-sitter parse tree into NodeData is
 * itself well-formed, without ever touching templates.
 *
 * For every named node kind that appears in the corpus fixtures, we:
 *
 *   1. Parse the corpus source with tree-sitter.
 *   2. Walk to the first instance of the kind.
 *   3. readNode it.
 *   4. Compare against tree-sitter's own view:
 *      - `.type` matches the node kind.
 *      - Every tree-sitter field name is represented in NodeData (either
 *        under `.fields` or — when routing promoted it — still under
 *        `.fields` with the override name).
 *      - Named children that are NOT tree-sitter fields (and not promoted
 *        via overrides) show up in `.children`.
 *      - Child counts agree after the field/override projection.
 *
 * A pass means: no field or named child went missing between the parse
 * tree and the NodeData. A fail means readNode (or the routing map) is
 * silently dropping content, and every downstream consumer (factory
 * round-trip, from(), render) will be working on a corrupted view.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { readNode } from '@sittir/core'
import type { AnyNodeData } from '@sittir/types'
import { loadRawEntries } from './validators/node-types.ts'
import {
    loadLanguageForGrammar,
    treeHandle,
    findFirst,
    collectKinds,
    type TSNode,
    type TSTree,
} from './validators/common.ts'


// Tree-sitter adapter + tree walkers imported from validators/common.ts.
// See that file for the canonical TSNode/TSTree shapes (backed by web-tree-sitter's
// published TS.Node / TS.Tree types).

// ---------------------------------------------------------------------------
// Corpus parser — shared shape
// ---------------------------------------------------------------------------

interface CorpusEntry { name: string; source: string }

function parseCorpus(content: string): CorpusEntry[] {
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
        while (i < lines.length && !lines[i]!.match(/^-{3,}$/)) { sourceLines.push(lines[i]!); i++ }
        while (i < lines.length && !lines[i]!.startsWith('====')) i++
        const source = sourceLines.join('\n').trim()
        if (source) entries.push({ name, source })
    }
    return entries
}


const FIXTURES_DIR = new URL('../fixtures', import.meta.url).pathname

function loadCorpusEntries(grammar: string): CorpusEntry[] {
    const entries: CorpusEntry[] = []
    const files = readdirSync(FIXTURES_DIR).filter(f => f.startsWith(`${grammar}-`) && f.endsWith('.txt'))
    for (const file of files) {
        entries.push(...parseCorpus(readFileSync(join(FIXTURES_DIR, file), 'utf-8')))
    }
    return entries
}

// ---------------------------------------------------------------------------
// node-types.json → field name set per kind
// ---------------------------------------------------------------------------

/**
 * Build `kind → Set<fieldName>` from node-types.json. Used as the ground
 * truth for "what fields should readNode surface for this kind".
 */
function buildKindFieldMap(
    rawEntries: { type: string; named: boolean; fields?: Record<string, unknown> }[],
): Map<string, Set<string>> {
    const result = new Map<string, Set<string>>()
    for (const entry of rawEntries) {
        if (!entry.named) continue
        const fields = entry.fields ?? {}
        result.set(entry.type, new Set(Object.keys(fields)))
    }
    return result
}

// ---------------------------------------------------------------------------
// Per-instance structural check
// ---------------------------------------------------------------------------

interface NodeIssue {
    kind: string
    instance: string // corpus entry name
    message: string
}

function checkNodeData(
    kind: string,
    node: TSNode,
    data: AnyNodeData,
    expectedFields: Set<string>,
    overrideFields: Set<string>,
): string | null {
    // 1. type must match
    if (data.type !== kind) {
        return `type mismatch: expected '${kind}', got '${data.type}'`
    }

    // 2. Every tree-sitter field the parse tree surfaces must show up in
    //    NodeData. We check against the ACTUAL node's field assignments,
    //    not the static node-types declaration, because many fields are
    //    optional and only populate on some parses.
    const liveFieldNames = new Set<string>()
    for (let i = 0; i < node.childCount; i++) {
        const fname = node.fieldNameForChild(i)
        if (fname) liveFieldNames.add(fname)
    }

    const dataFields = new Set(Object.keys(data.fields ?? {}))

    for (const fname of liveFieldNames) {
        if (!dataFields.has(fname)) {
            return `missing field '${fname}' — tree-sitter surfaced it, readNode did not`
        }
    }

    // 3. Named children NOT assigned to a field by tree-sitter must
    //    land somewhere in NodeData — either data.children, or promoted
    //    into an override field. Count INSTANCES, not distinct field
    //    keys: a multiple-valued field like `except_clauses: [e1, e2]`
    //    accounts for 2 children, not 1.
    const dataChildrenCount = (data.children ?? []).filter(
        (c: any) => c?.named !== false,
    ).length

    let expectedNamedUnfielded = 0
    for (let i = 0; i < node.childCount; i++) {
        const c = node.child(i)
        if (!c || !c.isNamed) continue
        if (node.fieldNameForChild(i)) continue
        expectedNamedUnfielded++
    }

    // Count children routed into each override field. A non-array value
    // = 1 child; an array value = array.length children.
    let promotedChildCount = 0
    for (const [fname, value] of Object.entries(data.fields ?? {})) {
        if (liveFieldNames.has(fname)) continue // tree-sitter field, not override
        if (!overrideFields.has(fname)) continue // neither override nor live
        if (Array.isArray(value)) promotedChildCount += value.length
        else if (value && typeof value === 'object') promotedChildCount += 1
    }

    if (dataChildrenCount + promotedChildCount < expectedNamedUnfielded) {
        return (
            `lost ${expectedNamedUnfielded - dataChildrenCount - promotedChildCount} named children ` +
            `(${expectedNamedUnfielded} unfielded in parse, ` +
            `${dataChildrenCount} in data.children, ` +
            `${promotedChildCount} promoted via overrides)`
        )
    }

    return null
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export interface ReadNodeRoundTripResult {
    grammar: string
    total: number
    pass: number
    fail: number
    skip: number
    issues: NodeIssue[]
}

export async function validateReadNodeRoundTrip(
    grammar: string,
): Promise<ReadNodeRoundTripResult> {
    const { Parser, lang } = await loadLanguageForGrammar(grammar)
    const parser = new Parser()
    parser.setLanguage(lang)

    const rawEntries = loadRawEntries(grammar)
    const kindFields = buildKindFieldMap(rawEntries)

    const entries = loadCorpusEntries(grammar)
    const issues: NodeIssue[] = []
    const testedKinds = new Set<string>()
    let total = 0
    let pass = 0
    let skip = 0

    for (const entry of entries) {
        const tree = parser.parse(entry.source) as TSTree
        if (tree.rootNode.hasError) continue

        const kinds = collectKinds(tree.rootNode)
        for (const kind of kinds) {
            if (testedKinds.has(kind)) continue
            testedKinds.add(kind)
            total++

            const node = findFirst(tree.rootNode, kind)
            if (!node) {
                skip++
                continue
            }

            const handle = treeHandle(tree)
            let data: AnyNodeData
            try {
                data = readNode(handle, node.id)
            } catch (e) {
                issues.push({ kind, instance: entry.name, message: `readNode threw: ${(e as Error).message.slice(0, 80)}` })
                continue
            }

            const expected = kindFields.get(kind) ?? new Set()
            const error = checkNodeData(kind, node, data, expected, new Set())
            if (error) {
                issues.push({ kind, instance: entry.name, message: error })
            } else {
                pass++
            }
        }
    }

    return { grammar, total, pass, fail: total - pass - skip, skip, issues }
}

export function formatReadNodeRoundTripReport(result: ReadNodeRoundTripResult): string {
    const lines: string[] = []
    const icon = result.issues.length === 0 ? 'v' : 'x'
    lines.push(
        `  ${icon} ${result.pass}/${result.total} readNode round-trip` +
        ` (${result.skip} skipped, ${result.issues.length} issues)`,
    )
    if (result.issues.length > 0) {
        for (const issue of result.issues.slice(0, 30)) {
            lines.push(`    x ${issue.kind} [${issue.instance}]: ${issue.message}`)
        }
        if (result.issues.length > 30) {
            lines.push(`    … and ${result.issues.length - 30} more`)
        }
    }
    return lines.join('\n')
}
