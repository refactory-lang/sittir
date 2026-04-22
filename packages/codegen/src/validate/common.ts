/**
 * validate/common.ts — shared infrastructure across the three
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

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import type { Mode } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readNode as readNodeFn } from '@sittir/core'
import type * as TS from 'web-tree-sitter';
import type { SgNode, Pos, Range } from '@ast-grep/wasm'


import type { AnyTreeNode } from '@sittir/types'
import type { TreeHandle } from '@sittir/core'

// ---------------------------------------------------------------------------
// Corpus parser — tree-sitter test corpus format
// ---------------------------------------------------------------------------

export interface CorpusEntry {
    name: string
    source: string
}

export type TSNode = TS.Node;
export type TSTree = TS.Tree;

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

const FIXTURES_DIR = fileURLToPath(new URL('../../fixtures', import.meta.url))

export function loadCorpusEntries(grammar: string): CorpusEntry[] {
    const entries: CorpusEntry[] = []
    const files = readdirSync(FIXTURES_DIR).filter(f => f.startsWith(`${grammar}-`) && f.endsWith('.txt'))
    for (const file of files) {
        const content = readFileSync(join(FIXTURES_DIR, file), 'utf-8')
        entries.push(...parseCorpus(content))
    }
    return entries
}

/**
 * Dynamic import of web-tree-sitter. The package ships CommonJS with
 * ambiguous default-export shape depending on bundler, so we try the
 * two common locations and throw if neither carries `Parser` + `Language`.
 */
export async function loadWebTreeSitter(): Promise<{ Parser: typeof TS.Parser; Language: typeof TS.Language }> {
    const mod = await import('web-tree-sitter');
    const Parser = mod.Parser ?? (mod.default && 'Parser' in mod.default ? mod.default.Parser : undefined)
    const Language = mod.Language ?? (mod.default && 'Language' in mod.default ? mod.default.Language : undefined)
    if (!Parser || !Language) {
        throw new Error("web-tree-sitter: could not locate `Parser` or `Language` export")
    }
    await Parser.init()
    return { Parser, Language }
}

export function adaptNode(node: TS.Node) : AnyTreeNode {
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
        children(): AnyTreeNode[] {
            return node.children.map(adaptNode)
        },
        range: () => ({
            start: { index: node.startIndex, line: node.startPosition.row, column: node.startPosition.column},
            end: { index: node.endIndex, line: node.endPosition.row, column: node.endPosition.column },
        } as unknown as Range),
    }
}

export function treeHandle(tree: TS.Tree) {
    const nodeMap = new Map<number, TS.Node>()
    function collect(node: TS.Node) {
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

export function findFirst(node: TS.Node, kind: string): TS.Node | null {
    if (node.type === kind) return node
    for (const child of node.children) {
        const found = findFirst(child, kind)
        if (found) return found
    }
    return null
}

export function collectKinds(node: TS.Node): Set<string> {

    const kinds = new Set<string>()

    function walk(n: TS.Node) {
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
        // Kind-specific: `mut_pattern` only appears inside match arms and
        // if-let conditions — NOT in plain `let` statements (tree-sitter-rust
        // flattens `let mut x = ..` into `let_declaration` with
        // `mutable_specifier` + `identifier` siblings, no `mut_pattern` node).
        // Using match-arm wrapper forces the parser to produce a mut_pattern.
        'mut_pattern': r => `fn _f(x: i32) { match x { ${r} => () } }`,
        // `generic_type_with_turbofish` (ADR-0006 alias source): rendered
        // form includes `::` (e.g. `Bar::<X>`), only valid inside a
        // scoped_type_identifier like `Bar::<X>::Item`. Bare type position
        // (`type _X = ${r};`) rejects it. Wrap as a scoped path element.
        'generic_type_with_turbofish': r => `type _X = ${r}::Item;`,
        // `scoped_type_identifier_in_expression_position` (ADR-0006):
        // aliased to `scoped_type_identifier` only inside struct_expression's
        // name field. Needs struct-literal context to round-trip.
        'scoped_type_identifier_in_expression_position': r => `fn _f() { let _ = ${r} { val: 1 }; }`,
        // `delim_token_tree` (ADR-0006): aliased to `token_tree` at
        // attribute.arguments and macro_invocation positions. Both kinds
        // use $TEXT rendering now via isVerbatimTokenStream detection
        // (macro token content is author-declared-verbatim, mixes named
        // and anon tokens).
        'delim_token_tree': r => `fn _f() { mac! ${r} }`,
    },
    typescript: {
        // Tree-sitter-typescript exposes supertypes unprefixed (no leading
        // `_`): `declaration`, `expression`, `statement`, `type`, `pattern`.
        // The hidden-prefix form ('_expression' etc.) existed pre-regen
        // due to an older convention and silently null-wrapped every
        // TS kind — counted as auto-pass without reparse, masking real
        // factory-rt failures.
        'expression': r => `let _ = ${r};`,
        'type': r => `type _X = ${r};`,
        'pattern': r => `let ${r} = null;`,
        'declaration': r => r,
        'statement': r => r,
    },
    python: {
        // tree-sitter-python supertypes are also unprefixed.
        'expression': r => `_ = ${r}`,
        'type': r => `_: ${r} = None`,
        'pattern': r => `match _:\n  case ${r}: pass`,
        'simple_statement': r => r,
        'compound_statement': r => r,
    },
}

export interface WrapForReparseResult {
    /** The rendered fragment spliced into the supertype wrapper template. */
    readonly text: string
    /** Byte offset where the rendered fragment begins in `text`. */
    readonly offset: number
}

/**
 * Apply a wrapper template to `rendered` and compute the byte offset at which
 * the rendered fragment begins inside the resulting string.
 *
 * @param rendered - The rendered fragment to splice into the wrapper.
 * @param wrapper - A function that takes the fragment and returns a full
 *   parse-valid program snippet.
 * @returns A `WrapForReparseResult` with `text` (the spliced program) and
 *   `offset` (byte position of `rendered` inside `text`).
 */
function applyWrapperTemplate(
    rendered: string,
    wrapper: (r: string) => string,
): WrapForReparseResult {
    const text = wrapper(rendered)
    const SENTINEL = '\u0001SITTIR_SENTINEL\u0001'
    const sentinelText = wrapper(SENTINEL)
    const offset = sentinelText.indexOf(SENTINEL)
    return { text, offset: offset >= 0 ? offset : 0 }
}

/**
 * Select the highest-priority wrapper reachable from `kind` via BFS over the
 * supertype graph and apply it.
 *
 * @remarks
 * Priority order: expression > type > declaration > statement > pattern (and
 * their `_`-prefixed siblings). Some kinds (python `attribute`, `subscript`)
 * are subtypes of BOTH `primary_expression` → `expression` AND `pattern`. A
 * pattern wrapper reparses an expression-shaped rendering as `dotted_name` /
 * other pattern kinds, not the original — so prefer the expression wrapper.
 * The ordering matches how tree-sitter grammars overload syntax: a construct
 * appears as an expression first, a pattern only in match-arm contexts, which
 * is the more restricted interpretation.
 *
 * Python's `attribute` has supertype `primary_expression` which isn't in the
 * wrapper map, but `primary_expression` itself is a subtype of `expression`
 * which IS mapped. BFS up through supertype chains so any mapped ancestor
 * produces a valid wrapping context.
 *
 * @param kind - The concrete grammar kind being wrapped.
 * @param wrappers - The grammar's wrapper map.
 * @param kindToSupertypes - BFS graph: kind → list of direct supertypes.
 * @param rendered - The rendered fragment to splice.
 * @returns A `WrapForReparseResult`, or `null` if no mapped ancestor exists.
 */
function selectAndApplySupertypeWrapper(
    kind: string,
    wrappers: Record<string, (r: string) => string>,
    kindToSupertypes: Map<string, string[]>,
    rendered: string,
): WrapForReparseResult | null {
    const WRAPPER_PRIORITY = ['expression', 'type', 'declaration', 'statement', 'pattern',
        '_expression', '_type', '_declaration_statement', '_literal', '_literal_pattern',
        '_pattern', '_simple_statement', '_compound_statement']
    const reachable = new Set<string>()
    const visited = new Set<string>([kind])
    const queue = [...(kindToSupertypes.get(kind) ?? [])]
    while (queue.length > 0) {
        const st = queue.shift()!
        if (visited.has(st)) continue
        visited.add(st)
        if (wrappers[st]) reachable.add(st)
        for (const parent of kindToSupertypes.get(st) ?? []) {
            if (!visited.has(parent)) queue.push(parent)
        }
    }
    if (reachable.size === 0) return null
    for (const name of WRAPPER_PRIORITY) {
        if (reachable.has(name)) return applyWrapperTemplate(rendered, wrappers[name]!)
    }
    // Reachable but not in priority list — take the first one.
    const first = [...reachable][0]!
    return applyWrapperTemplate(rendered, wrappers[first]!)
}

export function wrapForReparse(
    rendered: string,
    kind: string,
    grammar: string,
    kindToSupertypes: Map<string, string[]>,
): WrapForReparseResult | null {
    const wrappers = REPARSE_WRAPPERS[grammar]
    if (!wrappers) return null
    // Kind-specific wrapper beats supertype wrapper — some kinds only
    // appear in contexts their supertype's generic wrapper doesn't
    // produce (e.g. rust `mut_pattern` surfaces in match/if-let but
    // NOT in plain `let` statements, which flatten it away).
    const direct = wrappers[kind]
    if (direct) return applyWrapperTemplate(rendered, direct)
    return selectAndApplySupertypeWrapper(kind, wrappers, kindToSupertypes, rendered)
}

// ---------------------------------------------------------------------------
// Well-known WASM module paths
// ---------------------------------------------------------------------------

export const WASM_PATHS: Record<string, string> = {
    rust: 'tree-sitter-rust/tree-sitter-rust.wasm',
    typescript: 'tree-sitter-typescript/tree-sitter-typescript.wasm',
    python: 'tree-sitter-python/tree-sitter-python.wasm',
}

/** Relative path from codegen/src/validators to language package wrap.ts */
export const WRAP_MODULE_PATHS: Record<string, string> = {
    rust: '../../../rust/src/wrap.ts',
    typescript: '../../../typescript/src/wrap.ts',
    python: '../../../python/src/wrap.ts',
}

/**
 * Dynamic import of a grammar's `readTreeNode` entry point. Used by
 * validators to build source-typed wrapped views (ADR-0006) — the
 * wrap layer's drillAs() rewrites `$type` at alias-declared field
 * sites so validator render dispatches through the source template.
 */
export async function loadReadTreeNode(grammar: string): Promise<((handle: TreeHandle, nodeId?: number) => unknown) | null> {
    const p = WRAP_MODULE_PATHS[grammar]
    if (!p) return null
    try {
        const mod = await import(new URL(p, import.meta.url).pathname)
        return mod.readTreeNode ?? null
    } catch (e) {
        console.error(`[validators] failed to load wrap module for ${grammar}: ${(e as Error).message}`)
        return null
    }
}

/**
 * Walk a wrapped tree via declared getters, calling `visit` on each
 * encountered wrapped node. Enumeration uses `Object.keys` + accessor
 * invocation — accessors defined via `{get foo() {}}` appear as
 * enumerable keys and fire on read, so drillAs() along the way rewrites
 * $type from alias target to source at declared-field sites.
 *
 * `$`-prefixed keys are spread NodeData metadata (not child getters)
 * and get skipped. Leaves short-circuit when accessing a getter that
 * doesn't return a wrapped-shape value.
 */
export function walkWrappedTree(root: unknown, visit: (w: WrappedNodeData) => void): void {
    const seen = new Set<number>()
    const recurse = (w: unknown): void => {
        if (!isWrappedNodeData(w)) return
        const id = w.$nodeId
        if (id != null) {
            if (seen.has(id)) return
            seen.add(id)
        }
        visit(w)
        for (const k of Object.keys(w)) {
            if (k.startsWith('$')) continue
            const v = (w as unknown as Record<string, unknown>)[k]
            if (isWrappedNodeData(v)) recurse(v)
            else if (Array.isArray(v)) for (const x of v) if (isWrappedNodeData(x)) recurse(x)
        }
    }
    recurse(root)
}

export interface WrappedNodeData {
    readonly $type: string
    readonly $nodeId?: number
    readonly [k: string]: unknown
}
function isWrappedNodeData(v: unknown): v is WrappedNodeData {
    return !!v && typeof v === 'object' && typeof (v as { $type?: unknown }).$type === 'string'
}

/**
 * Load the best available parser for a grammar: override-compiled
 * WASM if it exists, otherwise the base grammar's WASM from npm.
 *
 * The override WASM is produced by `compileParser()` and lives at
 * `packages/<grammar>/.sittir/parser.wasm`. When present, it carries
 * all field labels from transform()/enrich() patches natively.
 */
export async function loadLanguageForGrammar(grammar: string): Promise<{
    Parser: typeof TS.Parser
    Language: typeof TS.Language
    lang: TS.Language
    isOverride: boolean
}> {
    const { Parser, Language } = await loadWebTreeSitter()

    const thisDir = fileURLToPath(new URL('.', import.meta.url))
    const overrideWasm = join(
        thisDir, '..', '..', '..', grammar, '.sittir', 'parser.wasm'
    )
    if (existsSync(overrideWasm)) {
        const lang = await Language.load(overrideWasm)
        return { Parser, Language, lang, isOverride: true }
    }

    const baseWasm = fileURLToPath(import.meta.resolve(WASM_PATHS[grammar]!))
    const lang = await Language.load(baseWasm)
    return { Parser, Language, lang, isOverride: false }
}

// ---------------------------------------------------------------------------
// nodeToConfig — NodeData → factory Config-shape conversion
// ---------------------------------------------------------------------------
//
// Validators read tree-sitter output via `readNode` (snake_case $fields
// keys, $-prefixed metadata). The factory signatures take `ConfigOf<T>`:
//   - top-level keys in camelCase (snake→camel on each $fields entry)
//   - `children` in place of $children
//   - leaf values as bare strings (factory leaf signatures are `(text: string)`)
//   - branch values as NodeData produced by THAT kind's factory — when
//     `tree` + `factoryMap` are supplied, children are drilled via
//     `readNode` and reconstructed through their own factory before
//     being installed under the parent's config. This is what makes the
//     factory layer actually exercise construction instead of passing
//     data through verbatim; a declared-type mismatch (e.g. the
//     pre-ADR-0006 match_statement.body typed as Block but carrying
//     case_clauses) surfaces at construction time via the child
//     factory's ConfigOf rejecting the shape it was given.
//
// Plain shallow mode (no tree/factoryMap) still works and matches the
// older camelFields behavior so other validators can adopt this helper
// without the recursion cost.
export interface NodeToConfigOpts {
    readonly tree?: { nodeById(id: number): unknown }
    readonly factoryMap?: Record<string, (...args: unknown[]) => unknown>
    /** Per-kind factory signature hint (from the generated `_factoryShapes`
     * map). `'config'` expects a Config object; `'children'` is rest-
     * params `(...children)`; `'text'` expects a bare string. Without
     * this, recursion defaults to `'config'` which breaks children-shape
     * factories (e.g. python `argument_list`) because they'd interpret
     * the whole Config object as the single rest-param item. */
    readonly factoryShapes?: Record<string, 'config' | 'children' | 'text'>
    /** Per-field alias-source map (from the generated `_fieldAliasMap`).
     * Key format: `"parentKind.fieldName"`; value: the source kind the
     * factory expects. When a child arrives at an alias-declared slot,
     * its tree-sitter-emitted $type is the alias target; `resolveChild`
     * consults this map to dispatch the matching source-kind factory
     * instead. Without it, ADR-0006-aware fields silently dispatch the
     * wrong factory (e.g. `block` factory on a `_match_block` body). */
    readonly fieldAliasMap?: Record<string, Record<string, string>>
    /** Per-kind list of declared factory Config field names (from the
     * generated `_factoryFields`). Drives orphan-child promotion: when
     * a read node has $children but the expected field is missing from
     * $fields (tree-sitter elided the label — python `list_splat` at
     * expression-statement position is the canonical case), route
     * children into the declared fields by position. */
    readonly factoryFields?: Record<string, readonly string[]>
    /** Internal — current parent kind during field recursion. Used with
     * `fieldAliasMap` to form `${parentKind}.${fieldName}` lookups. */
    readonly _parentKind?: string
    /** Internal — current field name during field recursion. */
    readonly _fieldName?: string
    /** Internal recursion guard — set by the helper, not the caller. */
    readonly _depth?: number
}

interface ReadNodeLike {
    readonly $type?: string
    readonly $text?: string
    readonly $nodeId?: number
    readonly $fields?: Readonly<Record<string, unknown>>
    readonly $children?: readonly unknown[]
    readonly $named?: boolean
}

/**
 * Determine whether an anonymous NodeData token should pass through
 * `resolveChild` unchanged.
 *
 * @remarks
 * Anonymous tokens (separators, delimiters, keywords promoted to $fields by
 * readNode) must stay as NodeData. Render's `$named !== false` filter drops
 * them from `$$$CHILDREN`, and flankSep probes their span/text to reconstruct
 * trailing separators. Converting them to bare strings bypasses those filters
 * and double-emits (e.g. struct_pattern's trailing `,` showed up twice in the
 * rendered output).
 *
 * @param c - The candidate child NodeData.
 * @returns `true` if the child is an anonymous token and should be returned as-is.
 */
function isAnonTokenPassthrough(c: ReadNodeLike): boolean {
    return c.$named === false
}

/**
 * Guard the recursion depth and availability of tree/factory context before
 * drilling into a child node.
 *
 * @remarks
 * Depth cap: recursive construction shouldn't run away even on pathologically
 * nested corpus entries. 64 is well past real-world AST depth and stops before
 * Node's default call-stack limit.
 *
 * @param depth - Current recursion depth.
 * @param tree - Tree handle, if available.
 * @param factoryMap - Factory map, if available.
 * @returns `true` if recursion should be halted (cap exceeded or context absent).
 */
function shouldHaltRecursion(
    depth: number,
    tree: NodeToConfigOpts['tree'],
    factoryMap: NodeToConfigOpts['factoryMap'],
): boolean {
    return depth > 64 || !tree || !factoryMap
}

/**
 * Resolve the effective factory kind for a child, unaliasing the
 * tree-sitter-emitted kind when the declaring slot has an alias-source
 * registered in `fieldAliasMap`.
 *
 * @remarks
 * `fieldAliasMap` is keyed `parentKind.fieldName` → `{ targetKind: sourceKind }`.
 * Example: python `match_statement` has `body: alias($._match_block, $.block)`,
 * so `match_statement.body` maps `'block'` → `'_match_block'`. A child with
 * `$type 'block'` arriving at that slot dispatches to the `_match_block`
 * factory (whose config accepts `alternative: CaseClause[]` rather than the
 * plain block's `children: Statement[]`).
 *
 * @param rawKind - The kind as emitted by tree-sitter.
 * @param parentKind - The kind of the parent node, if known.
 * @param fieldName - The field name under which the child was found, if known.
 * @param fieldAliasMap - Per-field alias-source map.
 * @returns The source kind to dispatch, or `rawKind` when no alias applies.
 */
function resolveAliasedKind(
    rawKind: string,
    parentKind: string | undefined,
    fieldName: string | undefined,
    fieldAliasMap: NodeToConfigOpts['fieldAliasMap'],
): string {
    if (fieldAliasMap && parentKind && fieldName) {
        const key = `${parentKind}.${fieldName}`
        const targetMap = fieldAliasMap[key]
        if (targetMap && targetMap[rawKind]) return targetMap[rawKind]!
    }
    return rawKind
}

/**
 * Drill into a shallow child NodeData via the tree handle, then convert
 * recursively and route through its kind's factory. Falls back to the
 * passed-in shallow NodeData when `tree` isn't available OR the child
 * lacks a $nodeId (factory-built children don't carry one).
 */
function resolveChild(
    child: unknown,
    opts: NodeToConfigOpts,
): unknown {
    if (child == null) return child
    if (typeof child === 'string' || typeof child === 'number') return child
    if (typeof child !== 'object') return child
    const c = child as ReadNodeLike
    if (isAnonTokenPassthrough(c)) return child
    const { tree, factoryMap, factoryShapes, fieldAliasMap, _depth = 0, _parentKind, _fieldName } = opts
    if (shouldHaltRecursion(_depth, tree, factoryMap)) return child
    // Drill into the child to materialize its own $fields/$children.
    let drilled: ReadNodeLike = c
    if (c.$nodeId != null) {
        try {
            drilled = readNodeFn(tree as Parameters<typeof readNodeFn>[0], c.$nodeId) as ReadNodeLike
        } catch {
            // Tree handle lacked the node (factory-built subtree?) — fall
            // back to the shallow entry we already have.
        }
    }
    const rawKind = drilled.$type ?? c.$type
    if (!rawKind) return drilled
    const kind = resolveAliasedKind(rawKind, _parentKind, _fieldName, fieldAliasMap)
    const factory = factoryMap![kind]
    if (!factory) return drilled  // hidden / unfactoryable kind — pass through
    const shape = factoryShapes?.[kind] ?? 'config'
    // 'text' shape: leaf factory takes a bare string.
    if (shape === 'text') {
        return factory(drilled.$text ?? '')
    }
    const childConfig = nodeToConfig(drilled, { ...opts, _depth: _depth + 1 })
    // 'children' shape: rest-params signature — spread `children`.
    if (shape === 'children') {
        const kids = (childConfig.children ?? []) as unknown[]
        return factory(...kids)
    }
    return factory(childConfig)
}

/**
 * Test whether a `$fields` key is identifier-shaped and thus a valid factory
 * Config slot.
 *
 * @remarks
 * Promoted anonymous keyword / punctuation tokens use the token's raw text as
 * the `$fields` key (e.g. `,`, `:`, `(`). Factory Config types only declare
 * identifier-shaped slots; spreading punctuation keys pollutes the config
 * without ever being read by the factory.
 *
 * @param key - A raw key from `$fields`.
 * @returns `true` if the key matches `[a-zA-Z_]\w*` and should be included.
 */
function isIdentifierShapedFieldKey(key: string): boolean {
    return /^[a-zA-Z_][\w]*$/.test(key)
}

/**
 * Determine whether to promote orphan `$children` into declared factory fields
 * by position instead of routing them to `children`.
 *
 * @remarks
 * When the parent kind declares fields via `_factoryFields` but none of them
 * appear in `data.$fields`, tree-sitter likely elided the field label for this
 * GLR state (python `list_splat` at expression-statement position is the
 * canonical case). Route the named children into the declared fields by
 * position so the factory sees the expected slots instead of `children`. Fires
 * only when no declared field is already populated — otherwise children
 * genuinely belong in `$$$CHILDREN` (e.g. rust `impl_item`'s body).
 *
 * @param declaredFields - The factory's declared field names for the parent kind.
 * @param populatedOut - The config object built so far (to check if any field is already set).
 * @param namedChildren - The filtered list of named child nodes.
 * @returns `true` if the orphan-promotion path should be taken.
 */
function shouldPromoteOrphanChildren(
    declaredFields: readonly string[] | undefined,
    populatedOut: Record<string, unknown>,
    namedChildren: readonly unknown[],
): boolean {
    if (!declaredFields || namedChildren.length === 0) return false
    if (namedChildren.length > declaredFields.length) return false
    const noFieldMatched = declaredFields.every(name => {
        const camel = name.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase())
        return populatedOut[camel] === undefined
    })
    return noFieldMatched
}

/**
 * Map `$children` entries directly to `out.children` without alias resolution.
 *
 * @remarks
 * `$children` entries don't have a field name; alias resolution falls back to
 * the raw `$type` (no parent.field lookup). Only the `$fields` iteration can
 * trigger alias-source dispatch.
 *
 * @param children - The raw `$children` array from NodeData.
 * @param childOpts - Options for `resolveChild` with parent/field context cleared.
 * @param out - The config object to write `children` into.
 */
function assignChildrenToConfig(
    children: readonly unknown[],
    childOpts: NodeToConfigOpts,
    out: Record<string, unknown>,
): void {
    out.children = children.map(c => resolveChild(c, childOpts))
}

export function nodeToConfig(
    data: ReadNodeLike,
    opts: NodeToConfigOpts = {},
): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    const parentKind = data.$type
    if (data.$fields) {
        for (const [k, v] of Object.entries(data.$fields)) {
            if (v === undefined) continue
            if (!isIdentifierShapedFieldKey(k)) continue
            const camelKey = k.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase())
            const childOpts: NodeToConfigOpts = { ...opts, _parentKind: parentKind, _fieldName: k }
            out[camelKey] = Array.isArray(v)
                ? v.map(item => resolveChild(item, childOpts))
                : resolveChild(v, childOpts)
        }
    }
    if (data.$children) {
        const declaredFields = parentKind ? opts.factoryFields?.[parentKind] : undefined
        const namedChildren = data.$children.filter(c =>
            c != null && typeof c === 'object' && (c as { $named?: boolean }).$named !== false,
        )
        const childOpts: NodeToConfigOpts = { ...opts, _parentKind: undefined, _fieldName: undefined }
        if (shouldPromoteOrphanChildren(declaredFields, out, namedChildren)) {
            // Assign by position: first N named children → first N declared fields.
            namedChildren.forEach((child, i) => {
                const name = declaredFields![i]!
                const camel = name.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase())
                const resolveOpts: NodeToConfigOpts = { ...opts, _parentKind: parentKind, _fieldName: name }
                out[camel] = resolveChild(child, resolveOpts)
            })
        } else {
            assignChildrenToConfig(data.$children, childOpts, out)
        }
    }
    return out
}
