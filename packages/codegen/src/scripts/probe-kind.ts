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
            'no-render': { type: 'boolean', default: false },
            'no-wrap': {
                type: 'boolean',
                default: false,
                // Skip the grammar's readTreeNode (wrap layer with
                // drillAs) and use core `readNode` directly. Matches
                // what validators currently call — useful for
                // reproducing rtPass failures.
            },
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

    const report = await probe(grammar, source, {
        noRender: values['no-render'] === true,
        noWrap: values['no-wrap'] === true,
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
    cst: CstNode
    nodeData: unknown
    rendered?: string
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
    opts: { noRender?: boolean; noWrap?: boolean } = {},
): Promise<ProbeReport> {
    const { Parser, lang } = await loadLanguageForGrammar(grammar)
    const parser = new Parser()
    parser.setLanguage(lang)
    const tree = parser.parse(source)
    if (!tree) throw new Error('probe-kind: parse returned null')

    const cst = dumpCst(tree.rootNode, null)

    const readTreeNodeFn = opts.noWrap ? null : await loadReadTreeNode(grammar)
    const handle = treeHandle(tree)
    const nodeData = readTreeNodeFn
        ? readTreeNodeFn(handle)
        : await fallbackReadNode(handle)

    let rendered: string | undefined
    let sameText: boolean | undefined
    let renderedLen: number | undefined
    if (!opts.noRender) {
        rendered = await renderNodeData(grammar, nodeData)
        renderedLen = rendered.length
        sameText = rendered === source
    }

    return {
        grammar,
        source,
        cst,
        nodeData: stripBigInts(nodeData),
        rendered,
        diff: { sourceLen: source.length, renderedLen, sameText },
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

async function fallbackReadNode(handle: ReturnType<typeof treeHandle>): Promise<unknown> {
    const { readNode } = await import('@sittir/core')
    return readNode(handle)
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
