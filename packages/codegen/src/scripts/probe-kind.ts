/**
 * probe-kind — structured diagnostics for one parse → readNode → render cycle.
 *
 * ## Usage
 *
 * ```sh
 * npx tsx packages/codegen/src/scripts/probe-kind.ts \
 *     --grammar typescript --source 'break;'
 * ```
 *
 * ## Output
 *
 * JSON to stdout with four stages:
 *
 * - `cst`:       tree-sitter parse result as a structured tree (type / named /
 *                text / field-name / children). Shows EXACTLY what tree-sitter
 *                emits, including anonymous tokens and field assignments.
 * - `nodeData`:  output of `readTreeNode(root)` — sittir's NodeData view.
 *                Shows `$fields` / `$children` / `$type` identity after
 *                drillAs remapping.
 * - `rendered`:  output of `render(nodeData)` — the text re-emitted by the
 *                render pipeline.
 * - `diff`:      trivial comparison: source length, rendered length,
 *                same-text flag.
 *
 * ## Why this exists
 *
 * Debugging RT failures repeatedly required writing one-off `/tmp/probe-X.ts`
 * scripts that rebuild the parse+wrap+render pipeline. See memory note
 * `feedback_promote_scratch_scripts.md` — the agent should run this script
 * instead of re-writing the probe. If a needed flag is missing, extend this
 * file; don't fork a new throwaway.
 *
 * ## Extending
 *
 * Flags to add as needs surface:
 *   - `--kind <k>`: only dump CST / nodeData subtrees for nodes with this type
 *   - `--field <f>`: drill into a specific field on the root
 *   - `--reparse`: render → re-parse and include the reparsed CST
 *   - `--ast-diff`: structural diff of source CST vs rendered CST
 */

import { parseArgs } from 'node:util'
import { loadLanguageForGrammar, treeHandle, adaptNode } from '../validate/common.ts'
import { loadReadTreeNode } from '../validate/common.ts'
import type { AnyTreeNode } from '@sittir/core'

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
    const { values } = parseArgs({
        options: {
            grammar: { type: 'string', short: 'g' },
            source: { type: 'string', short: 's' },
            stdin: { type: 'boolean', default: false },
            kind: { type: 'string', short: 'k' },
            range: { type: 'string' },
            'no-render': { type: 'boolean', default: false },
            'no-wrap': {
                type: 'boolean',
                default: false,
                // Skip the grammar's readTreeNode (wrap layer with
                // drillAs) and use core `readNode` directly. Matches
                // what validators currently call — useful for
                // reproducing rtPass failures.
            },
            reparse: { type: 'boolean', default: false },
            pretty: { type: 'boolean', default: false },
        },
    })
    if (!values.grammar) {
        console.error('probe-kind: --grammar <rust|typescript|python> required')
        process.exit(2)
    }
    const grammar = values.grammar as string
    const source = values.stdin
        ? await readStdin()
        : (values.source as string | undefined)
    if (source === undefined) {
        console.error('probe-kind: --source <text> or --stdin required')
        process.exit(2)
    }

    const parsedRange = values.range ? parseRange(values.range as string) : undefined
    const report = await probe(grammar, source, {
        noRender: values['no-render'] === true,
        noWrap: values['no-wrap'] === true,
        kind: values.kind as string | undefined,
        range: parsedRange,
        reparse: values.reparse === true,
    })
    const indent = values.pretty ? 2 : undefined
    process.stdout.write(JSON.stringify(report, null, indent) + '\n')
}

// ---------------------------------------------------------------------------
// Core probe
// ---------------------------------------------------------------------------

export interface ProbeReport {
    grammar: string
    source: string
    /** Source sub-range probed (absent when probing the full source). */
    probeRange?: { start: number; end: number; kind?: string; text: string }
    cst: CstNode
    nodeData: unknown
    rendered?: string
    /** Reparse pass when `--reparse` set: rendered output re-parsed and dumped. */
    reparsedCst?: CstNode
    /** Structural diff summary between original and reparsed CST. */
    astDiff?: { childCountMatch: boolean; originalShape: string; reparsedShape: string }
    diff: { sourceLen: number; renderedLen?: number; sameText?: boolean }
}

export interface CstNode {
    type: string
    named: boolean
    text?: string
    field?: string
    children: CstNode[]
}

export async function probe(
    grammar: string,
    source: string,
    opts: {
        noRender?: boolean
        noWrap?: boolean
        /** Find first node of this kind inside `source` and probe just that sub-tree. */
        kind?: string
        /** Probe the node at this byte range (takes precedence over `kind`). */
        range?: { start: number; end: number }
        /** Render → re-parse → include reparsed CST + structural diff. */
        reparse?: boolean
    } = {},
): Promise<ProbeReport> {
    const { Parser, lang } = await loadLanguageForGrammar(grammar)
    const parser = new Parser()
    parser.setLanguage(lang)
    const tree = parser.parse(source)
    if (!tree) throw new Error('probe-kind: parse returned null')

    // Resolve probe target: root node, or a specific sub-tree.
    let targetNode: any = tree.rootNode
    let probeRange: ProbeReport['probeRange'] | undefined
    if (opts.range) {
        targetNode = findNodeCoveringRange(tree.rootNode, opts.range.start, opts.range.end)
        if (!targetNode) throw new Error(`probe-kind: no node covers range ${opts.range.start}–${opts.range.end}`)
    } else if (opts.kind) {
        targetNode = findFirstByKind(tree.rootNode, opts.kind)
        if (!targetNode) throw new Error(`probe-kind: no node of kind '${opts.kind}' found`)
    }
    if (targetNode !== tree.rootNode) {
        probeRange = {
            start: targetNode.startIndex,
            end: targetNode.endIndex,
            kind: targetNode.type,
            text: targetNode.text,
        }
    }

    const cst = dumpCst(targetNode, null)

    const readTreeNodeFn = opts.noWrap ? null : await loadReadTreeNode(grammar)
    const handle = treeHandle(tree)
    const nodeId = targetNode === tree.rootNode ? undefined : targetNode.id
    const nodeData = readTreeNodeFn
        ? readTreeNodeFn(handle, nodeId)
        : await fallbackReadNode(handle, nodeId)

    let rendered: string | undefined
    let sameText: boolean | undefined
    let renderedLen: number | undefined
    let reparsedCst: CstNode | undefined
    let astDiff: ProbeReport['astDiff'] | undefined
    if (!opts.noRender) {
        rendered = await renderNodeData(grammar, nodeData)
        renderedLen = rendered.length
        const originalText = probeRange ? probeRange.text : source
        sameText = rendered === originalText
        if (opts.reparse) {
            const tree2 = parser.parse(rendered)
            if (tree2) {
                // Re-parse root is a whole program; drill down to the
                // same-kind node for comparison when we probed a
                // sub-tree.
                const root2 = targetNode === tree.rootNode
                    ? tree2.rootNode
                    : (findFirstByKind(tree2.rootNode, targetNode.type) ?? tree2.rootNode)
                reparsedCst = dumpCst(root2, null)
                const origShape = shapeString(cst)
                const reparsedShape = shapeString(reparsedCst)
                astDiff = {
                    childCountMatch: origShape === reparsedShape,
                    originalShape: origShape,
                    reparsedShape: reparsedShape,
                }
            }
        }
    }

    return {
        grammar,
        source,
        probeRange,
        cst,
        nodeData: stripBigInts(nodeData),
        rendered,
        reparsedCst,
        astDiff,
        diff: {
            sourceLen: (probeRange ? probeRange.text.length : source.length),
            renderedLen,
            sameText,
        },
    }
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function dumpCst(node: any, fieldName: string | null): CstNode {
    const out: CstNode = {
        type: node.type,
        named: node.isNamed,
        children: [],
    }
    if (fieldName) out.field = fieldName
    if (node.childCount === 0) {
        out.text = node.text
        return out
    }
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i)
        if (!child) continue
        const fn = typeof node.fieldNameForChild === 'function'
            ? node.fieldNameForChild(i) : null
        out.children.push(dumpCst(child, fn))
    }
    return out
}

async function fallbackReadNode(
    handle: ReturnType<typeof treeHandle>,
    nodeId?: number,
): Promise<unknown> {
    const { readNode } = await import('@sittir/core')
    return readNode(handle, nodeId)
}

/** Find the first descendant (inclusive) of kind `kind`, pre-order. */
function findFirstByKind(node: any, kind: string): any | null {
    if (node.type === kind) return node
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i)
        if (!child) continue
        const found = findFirstByKind(child, kind)
        if (found) return found
    }
    return null
}

/**
 * Find the smallest node whose byte range exactly covers `[start, end)`.
 * Falls back to any node covering the range when no exact match exists.
 */
function findNodeCoveringRange(node: any, start: number, end: number): any | null {
    if (node.startIndex > start || node.endIndex < end) return null
    // Try to narrow into a child.
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i)
        if (!child) continue
        const found = findNodeCoveringRange(child, start, end)
        if (found) return found
    }
    // This node covers the range and no child does. It's the narrowest.
    return node
}

/** Normalize a CST node to a compact shape signature for diffing. */
function shapeString(node: CstNode): string {
    const kids = node.children.length === 0
        ? ''
        : `(${node.children.map(shapeString).join(',')})`
    return `${node.type}${kids}`
}

function parseRange(spec: string): { start: number; end: number } {
    const m = /^(\d+),(\d+)$/.exec(spec.trim())
    if (!m) throw new Error(`probe-kind: --range expects 'start,end' (got '${spec}')`)
    return { start: Number(m[1]), end: Number(m[2]) }
}

async function renderNodeData(grammar: string, nodeData: unknown): Promise<string> {
    const { createRenderer } = await import('@sittir/core')
    const thisFile = import.meta.url
    const templatesPath = new URL(`../../../${grammar}/templates`, thisFile).pathname
    const bound = createRenderer(templatesPath)
    return bound.render(nodeData as Parameters<typeof bound.render>[0])
}

function stripBigInts(v: unknown): unknown {
    // NodeData carries `$nodeId` as number (or bigint on some platforms);
    // JSON.stringify chokes on bigint. Cast to Number for dump purposes.
    return JSON.parse(JSON.stringify(v, (_k, val) =>
        typeof val === 'bigint' ? Number(val) : val,
    ))
}

async function readStdin(): Promise<string> {
    const chunks: Buffer[] = []
    for await (const chunk of process.stdin) chunks.push(chunk as Buffer)
    return Buffer.concat(chunks).toString('utf-8')
}

// silence unused warnings on adaptNode / AnyTreeNode (used indirectly in treeHandle path)
void adaptNode
type _AnyTreeNode = AnyTreeNode

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
    main().catch(err => {
        console.error('probe-kind:', err instanceof Error ? err.message : err)
        process.exit(1)
    })
}
