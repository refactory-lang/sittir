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

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { readNode as readNodeFn, dumpMetrics, metricsEnabled } from '@sittir/core';
import type * as TS from 'web-tree-sitter';
import type { SgNode as _SgNode, Range } from '@ast-grep/wasm';

import type { AnyNodeData, AnyTreeNode, NativeParseResult } from '@sittir/types';
import type { TreeHandle } from '@sittir/core';
import { assertNever, type PolymorphVariantDescriptor, type PolymorphVariantMap } from '../polymorph-variant.ts';
import type { FactoryShape } from '../emitters/factory-map.ts';

// ---------------------------------------------------------------------------
// Corpus parser — tree-sitter test corpus format
// ---------------------------------------------------------------------------

export interface CorpusEntry {
	name: string;
	source: string;
}

export type TSNode = TS.Node;
export type TSTree = TS.Tree;

/**
 * Parse a tree-sitter test corpus file.
 * Format: `====` header, test name, `====`, source, `----`, expected tree.
 */
export function parseCorpus(content: string): CorpusEntry[] {
	const entries: CorpusEntry[] = [];
	const lines = content.split('\n');
	let i = 0;

	while (i < lines.length) {
		if (!lines[i]!.startsWith('====')) {
			i++;
			continue;
		}
		i++;

		const name = lines[i]?.trim() ?? '';
		i++;

		while (i < lines.length && lines[i]!.startsWith('====')) i++;

		const sourceLines: string[] = [];
		while (i < lines.length && !lines[i]!.match(/^-{3,}$/)) {
			sourceLines.push(lines[i]!);
			i++;
		}

		while (i < lines.length && !lines[i]!.startsWith('====')) i++;

		const source = sourceLines.join('\n').trim();
		if (source) entries.push({ name, source });
	}

	return entries;
}

// ---------------------------------------------------------------------------
// Fixtures directory + loader
// ---------------------------------------------------------------------------

const FIXTURES_DIR = fileURLToPath(new URL('../../fixtures', import.meta.url));

export function loadCorpusEntries(grammar: string): CorpusEntry[] {
	const entries: CorpusEntry[] = [];
	const files = readdirSync(FIXTURES_DIR).filter((f) => f.startsWith(`${grammar}-`) && f.endsWith('.txt'));
	for (const file of files) {
		const content = readFileSync(join(FIXTURES_DIR, file), 'utf-8');
		entries.push(...parseCorpus(content));
	}
	return entries;
}

/**
 * Dynamic import of web-tree-sitter. The package ships CommonJS with
 * ambiguous default-export shape depending on bundler, so we try the
 * two common locations and throw if neither carries `Parser` + `Language`.
 */
export async function loadWebTreeSitter(): Promise<{
	Parser: typeof TS.Parser;
	Language: typeof TS.Language;
}> {
	const mod = await import('web-tree-sitter');
	const Parser = mod.Parser ?? (mod.default && 'Parser' in mod.default ? mod.default.Parser : undefined);
	const Language = mod.Language ?? (mod.default && 'Language' in mod.default ? mod.default.Language : undefined);
	if (!Parser || !Language) {
		throw new Error('web-tree-sitter: could not locate `Parser` or `Language` export');
	}
	await Parser.init();
	return { Parser, Language };
}

export function adaptNode(node: TS.Node): AnyTreeNode {
	return {
		type: node.type,
		id: () => node.id,
		text: () => node.text,
		isNamed: () => node.isNamed,
		field: (name: string) => {
			const child = node.childForFieldName(name);
			return child ? adaptNode(child) : null;
		},
		fieldChildren: (name: string) => {
			const result: AnyTreeNode[] = [];
			for (let i = 0; i < node.childCount; i++) {
				if (node.fieldNameForChild(i) === name) {
					const child = node.child(i);
					if (child) result.push(adaptNode(child));
				}
			}
			return result;
		},

		fieldNameForChild: (index: number) => node.fieldNameForChild(index),
		children(): AnyTreeNode[] {
			return node.children.map(adaptNode);
		},
		range: () =>
			({
				start: {
					index: node.startIndex,
					line: node.startPosition.row,
					column: node.startPosition.column
				},
				end: {
					index: node.endIndex,
					line: node.endPosition.row,
					column: node.endPosition.column
				}
			}) as unknown as Range
	};
}

export function treeHandle(
	tree: TS.Tree,
	source?: string,
	kindIdFromName?: (kind: string) => number | undefined
): TreeHandle {
	// ADR-0017: nodeById removed. JS-side readNode now navigates via
	// nodes[handle].children()[childIndex]. The nodes[] array is populated
	// lazily by pushNode() inside readNode as it walks the tree.
	// Phase D: kindIdFromName is required for JS-side reads (readNode emits
	// numeric $type). Supply it from the grammar's types module.
	const handle: TreeHandle = {
		rootNode: adaptNode(tree.rootNode),
		source,
		kindIdFromName
	};
	return handle;
}

/**
 * Native TreeHandle — wraps a `SittirEngine` napi instance so reads
 * (root + drill-in) all flow through napi. Used by validators /
 * probe-kind to exercise the full native pipeline end-to-end without
 * any JS-side parse or walker fallback. The engine owns the tree, and
 * the tree-sitter `Node::id()` returned in `$nodeId` is dereferenced
 * by the same engine that produced it — no cross-engine id leakage.
 */
export interface NativeEngineLike {
	parseAndRead(source: string): string;
	readNode(handle: number, childIndex: number): string;
}
export function nativeTreeHandle(engine: NativeEngineLike, source: string): TreeHandle {
	// Parse eagerly: populates engine tree cache and captures format in one call.
	// Behavioral note: prior to 017, nativeTreeHandle parsed lazily on first
	// readNode() call. Parsing is now unconditional at construction time so
	// the format record is always available before callers access tree.format.
	const parseResult = JSON.parse(engine.parseAndRead(source)) as NativeParseResult;
	if (parseResult.nodeData === undefined) {
		const keys = Object.keys(parseResult as object).join(', ');
		throw new Error(
			'nativeTreeHandle: engine.parseAndRead() returned JSON without a "nodeData" key. ' +
				'The engine binary is out of date — rebuild the matching rust/crates/sittir-<grammar>-napi crate against this version. ' +
				`Received keys: ${keys}`
		);
	}
	const rootData: AnyNodeData = parseResult.nodeData;
	const handle: TreeHandle = {
		// The native engine doesn't expose JS-side raw tree-sitter Node
		// wrappers; reads always go through `read` below. The required
		// rootNode slot throws to surface accidental fallbacks.
		get rootNode(): AnyTreeNode {
			throw new Error('nativeTreeHandle: rootNode unavailable — native handle reads via tree.read()');
		},
		source,
		read(nodeHandle?: number, childIndex?: number) {
			if (nodeHandle === undefined) {
				return rootData as unknown as ReturnType<NonNullable<TreeHandle['read']>>;
			}
			return JSON.parse(engine.readNode(nodeHandle, childIndex ?? 0)) as ReturnType<
				NonNullable<TreeHandle['read']>
			>;
		},
		...(parseResult.format !== undefined && { format: parseResult.format })
	};
	return handle;
}

/**
 * Build the read-side TreeHandle for the corpus validators. Selects
 * between the wasm/JS handle (default) and a native-engine handle
 * (when `SITTIR_BACKEND=native` is set AND the grammar-owned native
 * module loads). Native handles route every read — root + drill-in +
 * drillAs — through `engine.readNode(id)` so the suite exercises the
 * full native pipeline end-to-end.
 *
 * The wasm `tree` is still required: validators use it for kind
 * navigation (`findFirst`, `collectKinds`) — that traversal needs a
 * raw tree-sitter tree the JS side can walk. The native engine owns
 * its own internal tree for reads; the two coexist within one probe.
 *
 * Cached per process: the napi engine instance is reused across all
 * invocations to amortize the (small) per-engine init. Each call
 * still parses fresh — the engine internally replaces its tree.
 */
let _cachedNativeEngine: { grammar: string; engine: NativeEngineLike } | null = null;
const nativePackages: Record<string, string> = {
	rust: 'sittir-rust',
	typescript: 'sittir-typescript',
	python: 'sittir-python'
};
function loadNativeEngineForGrammar(grammar: string): NativeEngineLike | null {
	if (_cachedNativeEngine && _cachedNativeEngine.grammar === grammar) {
		return _cachedNativeEngine.engine;
	}
	try {
		// Match probe-kind's loader — try the package name, then fall
		// back to the workspace-local grammar crate directory.
		const req = createRequire(import.meta.url);
		const pkg = nativePackages[grammar];
		if (!pkg) return null;
		const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url)).replace(/\/$/, '');
		const localCratePath = `${repoRoot}/rust/crates/sittir-${grammar}`;
		let mod: { SittirEngine: new () => NativeEngineLike };
		try {
			mod = req(pkg) as typeof mod;
		} catch {
			mod = req(localCratePath) as typeof mod;
		}
		const engine = new mod.SittirEngine();
		_cachedNativeEngine = { grammar, engine };
		return engine;
	} catch {
		return null;
	}
}

export function buildReadHandle(
	grammar: string,
	tree: TS.Tree,
	source: string,
	backend?: 'native' | 'typescript',
	kindIdFromName?: (kind: string) => number | undefined
): TreeHandle {
	const effectiveBackend = backend ?? process.env.SITTIR_BACKEND;
	if (effectiveBackend === 'native') {
		const engine = loadNativeEngineForGrammar(grammar);
		if (!engine) {
			throw new Error(`SITTIR_BACKEND=native but no native engine is available for grammar '${grammar}'`);
		}
		return nativeTreeHandle(engine, source);
	}
	return treeHandle(tree, source, kindIdFromName);
}

/**
 * Read a specific tree-sitter node via its adapted AnyTreeNode reference.
 *
 * ADR-0017: readNode no longer accepts a nodeId. For the WASM/JS path,
 * validators use this helper to push the target node into the handle's
 * nodes[] array and call readNode with the resulting handle + childIndex=0.
 * For native handles (handle.read present), uses the native coords from
 * findNativeNodeId.
 */
export function readNodeAt(handle: TreeHandle, node: AnyTreeNode, nativeCoords: NativeNodeCoords | null): AnyNodeData {
	if (nativeCoords && handle.read) {
		return readNodeFn(handle, nativeCoords.handle, nativeCoords.childIndex);
	}
	// WASM/JS path: temporarily set rootNode to the target node and read
	// with no navigation coords (readNode reads rootNode when handle is undefined).
	const prev = handle.rootNode;
	(handle as { rootNode: AnyTreeNode }).rootNode = node;
	try {
		return readNodeFn(handle);
	} finally {
		(handle as { rootNode: AnyTreeNode }).rootNode = prev;
	}
}

/**
 * ADR-0017: navigation coordinates for a native drill-in.
 * `handle` is the parent's index in the tree's nodes[], `childIndex` is
 * the position in parent's child array.
 */
export interface NativeNodeCoords {
	handle: number;
	childIndex: number;
}

/**
 * For a native TreeHandle (`handle.read` is present), walk the native
 * NodeData tree to find the parent-handle + child-index pair for the
 * first node whose `$type` equals `kind`. Native engine handles and
 * WASM/JS engine handles occupy different navigation spaces, so WASM
 * coordinates must never be passed to a native handle's
 * `readNode(handle, childIndex)`.
 *
 * Returns null when `handle` is a WASM handle (no `handle.read`) —
 * callers fall back to the JS tree's `node.id` in that case.
 *
 * ADR-0017: returns { handle, childIndex } instead of NodeId.
 */
export function findNativeNodeId(
	handle: TreeHandle,
	kind: string,
	kindNameFromId?: (id: number) => string | undefined
): NativeNodeCoords | null {
	if (!handle.read) return null;
	const read = handle.read;
	const root = handle.read();

	function pushCandidates(value: unknown, out: AnyNodeData[]): void {
		const candidates = Array.isArray(value) ? value : [value];
		for (const candidate of candidates) {
			if (candidate != null && typeof candidate === 'object' && '$type' in candidate) {
				out.push(candidate as AnyNodeData);
			}
		}
	}

	function collectNativeChildNodes(d: AnyNodeData): AnyNodeData[] {
		const out: AnyNodeData[] = [];
		const rec = d as unknown as Record<string, unknown>;
		for (const key of Object.keys(rec)) {
			if (key.startsWith('_')) pushCandidates(rec[key], out);
		}
		const legacyFields = rec.$fields;
		if (legacyFields != null && typeof legacyFields === 'object') {
			for (const value of Object.values(legacyFields as Record<string, unknown>)) {
				pushCandidates(value, out);
			}
		}
		const children = d.$children;
		if (children) {
			pushCandidates(children, out);
		}
		return out;
	}

	function kindOf(d: AnyNodeData): string {
		return typeof d.$type === 'number' ? (kindNameFromId?.(d.$type) ?? String(d.$type)) : d.$type;
	}

	function walk(d: AnyNodeData): NativeNodeCoords | null {
		for (const child of collectNativeChildNodes(d)) {
			if (kindOf(child) === kind && d.$nodeHandle !== undefined && child.$childIndex !== undefined) {
				return { handle: d.$nodeHandle, childIndex: child.$childIndex };
			}
			let drilled = child;
			if (drilled.$nodeHandle === undefined && d.$nodeHandle !== undefined && drilled.$childIndex !== undefined) {
				drilled = read(d.$nodeHandle, drilled.$childIndex) as AnyNodeData;
			}
			const found = walk(drilled);
			if (found !== null) return found;
		}
		return null;
	}

	return walk(root);
}

export function findFirst(node: TS.Node, kind: string): TS.Node | null {
	// Cluster H (016): match only named nodes — the kind set comes from
	// `collectKinds` which is named-only, but tree-sitter exposes both
	// named and anonymous nodes that can share a `type` string (ts has a
	// named `string` kind for `'…'`/`"…"` literals AND an anonymous
	// `string` keyword inside `predefined_type` choice). Without the
	// named filter, `findFirst` resolves to the anonymous keyword node
	// when scanning a class with `: string` annotations and the rt
	// probe tries to round-trip the bare keyword.
	if (node.type === kind && node.isNamed) return node;
	for (const child of node.children) {
		const found = findFirst(child, kind);
		if (found) return found;
	}
	return null;
}

export function collectKinds(node: TS.Node): Set<string> {
	const kinds = new Set<string>();

	function walk(n: TS.Node) {
		if (n.isNamed) kinds.add(n.type);
		for (const child of n.children) walk(child);
	}
	walk(node);
	return kinds;
}

// ---------------------------------------------------------------------------
// Supertype-based reparse wrapping
// ---------------------------------------------------------------------------

export function buildKindToSupertypes(
	rawEntries: { type: string; named: boolean; subtypes?: { type: string }[] }[]
): Map<string, string[]> {
	const result = new Map<string, string[]>();
	for (const entry of rawEntries) {
		if (!entry.subtypes) continue;
		for (const sub of entry.subtypes) {
			const existing = result.get(sub.type) ?? [];
			existing.push(entry.type);
			result.set(sub.type, existing);
		}
	}
	return result;
}

const REPARSE_WRAPPERS: Record<string, Record<string, (r: string) => string>> = {
	rust: {
		_expression: (r) => `fn _f() { let _ = ${r}; }`,
		_type: (r) => `type _X = ${r};`,
		_pattern: (r) => `fn _f() { let ${r} = (); }`,
		_declaration_statement: (r) => r,
		_literal: (r) => `fn _f() { let _ = ${r}; }`,
		_literal_pattern: (r) => `fn _f() { let ${r} = (); }`,
		// Kind-specific: `mut_pattern` only appears inside match arms and
		// if-let conditions — NOT in plain `let` statements (tree-sitter-rust
		// flattens `let mut x = ..` into `let_declaration` with
		// `mutable_specifier` + `identifier` siblings, no `mut_pattern` node).
		// Using match-arm wrapper forces the parser to produce a mut_pattern.
		mut_pattern: (r) => `fn _f(x: i32) { match x { ${r} => () } }`,
		// `generic_type_with_turbofish` (ADR-0006 alias source): rendered
		// form includes `::` (e.g. `Bar::<X>`), only valid inside a
		// scoped_type_identifier like `Bar::<X>::Item`. Bare type position
		// (`type _X = ${r};`) rejects it. Wrap as a scoped path element.
		generic_type_with_turbofish: (r) => `type _X = ${r}::Item;`,
		// `scoped_type_identifier_in_expression_position` (ADR-0006):
		// aliased to `scoped_type_identifier` only inside struct_expression's
		// name field. Needs struct-literal context to round-trip.
		scoped_type_identifier_in_expression_position: (r) => `fn _f() { let _ = ${r} { val: 1 }; }`,
		// `delim_token_tree` (ADR-0006): aliased to `token_tree` at
		// attribute.arguments and macro_invocation positions. Both kinds
		// use structural rendering (macro token content is
		// author-declared-verbatim, mixes named and anon tokens).
		delim_token_tree: (r) => `fn _f() { mac! ${r} }`,
		// visibility_modifier is a declaration-position prefix — has no
		// supertype it fits under. Only fires when variant() adoption
		// has been applied (see `wrapForReparse` — wrappers whose kind
		// isn't in `deepReadKinds` are skipped so the wrapper doesn't
		// expose the baseline `{% if variant %}` fall-through).
		visibility_modifier: (r) => `${r} fn _f() {}`
	},
	typescript: {
		// Tree-sitter-typescript exposes supertypes unprefixed (no leading
		// `_`): `declaration`, `expression`, `statement`, `type`, `pattern`.
		// The hidden-prefix form ('_expression' etc.) existed pre-regen
		// due to an older convention and silently null-wrapped every
		// TS kind — counted as auto-pass without reparse, masking real
		// factory-rt failures.
		expression: (r) => `let _ = ${r};`,
		type: (r) => `type _X = ${r};`,
		pattern: (r) => `let ${r} = null;`,
		declaration: (r) => r,
		statement: (r) => r,
		// Alias-target-specific wrappers: tree-sitter aliases are
		// position-dependent. `interface_body` is `alias($.object_type,
		// $.interface_body)` inside `interface_declaration.body`.
		// Reparsing the rendered content inside the generic `type _X
		// = ${r};` wrapper produces `object_type` (no alias), but the
		// original was `interface_body`. Wrap in an interface
		// declaration so the alias re-fires and reparse produces
		// interface_body for AST-match parity.
		interface_body: (r) => `interface _I ${r}`,
		// Kind-specific: `rest_pattern` (`...x`) appears in array
		// destructuring, tuple types (TS), and parameter lists. The
		// generic `pattern` wrapper `let ${r} = null;` produces a
		// parse error — `let ...x = null` is invalid. Wrap in an
		// array destructuring target so the rest-pattern surfaces.
		rest_pattern: (r) => `let [${r}] = [];`
	},
	python: {
		// tree-sitter-python supertypes are also unprefixed.
		expression: (r) => `_ = ${r}`,
		type: (r) => `_: ${r} = None`,
		pattern: (r) => `match _:\n  case ${r}: pass`,
		simple_statement: (r) => r,
		compound_statement: (r) => r,
		// Kind-specific: `list_splat` (`*args`) only appears inside
		// argument lists, list/tuple/set literals, and expression
		// lists. Generic expression wrapper `_ = *()` is syntactically
		// invalid. Argument-list context accepts it.
		list_splat: (r) => `_f(${r})`,
		// Kind-specific: `list_splat_pattern` (`*rest`) appears inside
		// assignment patterns (`a, *rest = xs`) and function parameter
		// lists. Wrap in an assignment-target position.
		list_splat_pattern: (r) => `${r} = (1,)`,
		// Kind-specific: `attribute` (`a.b`) and `subscript` (`a[b]`)
		// — tree-sitter-python parses `*a.b` and `*a[b]` as an
		// attribute / subscript whose object is a list_splat (the
		// `Lists` corpus exercises this through `[*a.b]` / `[*a[b].c]`).
		// The generic `expression` wrapper `_ = ${r}` rejects
		// `_ = *a.b` standalone. List-literal context accepts both
		// the splat-prefix form AND plain accesses (`[obj.attr]`,
		// `[*a.b]`, `[obj[k]]`, `[*a[b]]`). (016 Cluster I.)
		attribute: (r) => `[${r}]`,
		subscript: (r) => `[${r}]`,
		// Kind-specific: `parenthesized_expression` (`(expr)`) — the
		// `Function definitions` corpus exercises `(*a)` from
		// `j(((*a)))`. The generic `expression` wrapper `_ = (*a)`
		// reparses as `tuple` (since bare `*a` is only valid inside
		// a collection). Wrap as a single-arg call so the inner
		// parens stay parenthesized_expression: `f((*a))` keeps the
		// outer `(...)` as the argument list and the inner `(*a)`
		// as a parenthesized_expression. (016 Cluster I.)
		parenthesized_expression: (r) => `f(${r})`
	}
};

export interface WrapForReparseResult {
	/** The rendered fragment spliced into the supertype wrapper template. */
	readonly text: string;
	/** Byte offset where the rendered fragment begins in `text`. */
	readonly offset: number;
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
function applyWrapperTemplate(rendered: string, wrapper: (r: string) => string): WrapForReparseResult {
	const text = wrapper(rendered);
	const SENTINEL = '\u0001SITTIR_SENTINEL\u0001';
	const sentinelText = wrapper(SENTINEL);
	const offset = sentinelText.indexOf(SENTINEL);
	return { text, offset: offset >= 0 ? offset : 0 };
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
	rendered: string
): WrapForReparseResult | null {
	const WRAPPER_PRIORITY = [
		'expression',
		'type',
		'declaration',
		'statement',
		'pattern',
		'_expression',
		'_type',
		'_declaration_statement',
		'_literal',
		'_literal_pattern',
		'_pattern',
		'_simple_statement',
		'_compound_statement'
	];
	const reachable = new Set<string>();
	const visited = new Set<string>([kind]);
	const queue = [...(kindToSupertypes.get(kind) ?? [])];
	while (queue.length > 0) {
		const st = queue.shift()!;
		if (visited.has(st)) continue;
		visited.add(st);
		if (wrappers[st]) reachable.add(st);
		for (const parent of kindToSupertypes.get(st) ?? []) {
			if (!visited.has(parent)) queue.push(parent);
		}
	}
	if (reachable.size === 0) return null;
	for (const name of WRAPPER_PRIORITY) {
		if (reachable.has(name)) return applyWrapperTemplate(rendered, wrappers[name]!);
	}
	// Reachable but not in priority list — take the first one.
	const first = [...reachable][0]!;
	return applyWrapperTemplate(rendered, wrappers[first]!);
}

/**
 * Kind names whose direct `REPARSE_WRAPPERS[grammar]` entry should only
 * fire when variant() adoption is in effect for that kind. Otherwise
 * the wrapper is skipped so the baseline `{% if variant %}`
 * fall-through (a parent-template shape that only works under variant()
 * adoption) doesn't expose the kind to reparse where it'd render empty.
 */
export const VARIANT_ADOPTION_GATED_WRAPPERS: Record<string, readonly string[]> = {
	rust: ['visibility_modifier']
};

export function wrapForReparse(
	rendered: string,
	kind: string,
	grammar: string,
	kindToSupertypes: Map<string, string[]>,
	opts?: { adoptedVariantKinds?: ReadonlySet<string>; targetKind?: string }
): WrapForReparseResult | null {
	const wrappers = REPARSE_WRAPPERS[grammar];
	if (!wrappers) return null;
	// Canonical-hidden architecture (Option Y): the validator may pass
	// a canonical hidden kind (`_x`) where REPARSE_WRAPPERS and
	// `kindToSupertypes` are keyed on the visible alias-target name
	// (`x`) — tree-sitter parser only sees visible names. Pre-strip
	// for both lookups, but preserve the original `kind` for kind-
	// specific lookups (e.g. `_expression` is itself a wrapper key).
	const visibleKind = kind.startsWith('_') && !wrappers[kind] ? kind.replace(/^_+/, '') : kind;
	// Alias-target wrapper preference: when `kind` (renderedKind, the
	// alias source after drillAs) differs from `targetKind` (the
	// tree-sitter-emitted alias target), a wrapper keyed on the alias
	// target — if one exists — reproduces the original parse position
	// so reparse emits the same aliased kind. That keeps AST-match
	// parity for kinds whose alias target doesn't survive a generic
	// supertype wrapper (ts `interface_body` → `object_type` when
	// reparsed in a `type _X = …;` context).
	if (opts?.targetKind && opts.targetKind !== kind) {
		const targetWrapper = wrappers[opts.targetKind];
		if (targetWrapper) return applyWrapperTemplate(rendered, targetWrapper);
	}
	// Kind-specific wrapper beats supertype wrapper — some kinds only
	// appear in contexts their supertype's generic wrapper doesn't
	// produce (e.g. rust `mut_pattern` surfaces in match/if-let but
	// NOT in plain `let` statements, which flatten it away).
	const direct = wrappers[kind] ?? wrappers[visibleKind];
	if (direct) {
		const gateKey = wrappers[kind] ? kind : visibleKind;
		const gated = VARIANT_ADOPTION_GATED_WRAPPERS[grammar]?.includes(gateKey) ?? false;
		const adopted = opts?.adoptedVariantKinds?.has(gateKey) ?? false;
		if (gated && !adopted) {
			return selectAndApplySupertypeWrapper(visibleKind, wrappers, kindToSupertypes, rendered);
		}
		return applyWrapperTemplate(rendered, direct);
	}
	return selectAndApplySupertypeWrapper(visibleKind, wrappers, kindToSupertypes, rendered);
}

// ---------------------------------------------------------------------------
// Well-known WASM module paths
// ---------------------------------------------------------------------------

export const WASM_PATHS: Record<string, string> = {
	rust: 'tree-sitter-rust/tree-sitter-rust.wasm',
	typescript: 'tree-sitter-typescript/tree-sitter-typescript.wasm',
	python: 'tree-sitter-python/tree-sitter-python.wasm'
};

/** Relative path from codegen/src/validators to language package wrap.ts */
export const WRAP_MODULE_PATHS: Record<string, string> = {
	rust: '../../../rust/src/wrap.ts',
	typescript: '../../../typescript/src/wrap.ts',
	python: '../../../python/src/wrap.ts'
};

/**
 * Dynamic import of a grammar's `readTreeNode` entry point. Used by
 * validators to build source-typed wrapped views (ADR-0006) — the
 * wrap layer's drillAs() rewrites `$type` at alias-declared field
 * sites so validator render dispatches through the source template.
 */
export async function loadReadTreeNode(
	grammar: string
): Promise<((handle: TreeHandle, nodeHandle?: number, childIndex?: number) => unknown) | null> {
	const p = WRAP_MODULE_PATHS[grammar];
	if (!p) return null;
	try {
		const mod = await import(new URL(p, import.meta.url).pathname);
		return mod.readTreeNode ?? null;
	} catch (e) {
		console.error(`[validators] failed to load wrap module for ${grammar}: ${(e as Error).message}`);
		return null;
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
	const seen = new Set<string>();
	const recurse = (w: unknown): void => {
		if (!isWrappedNodeData(w)) return;
		// ADR-0017: use $nodeHandle + $childIndex as a composite dedup key.
		const handle = w.$nodeHandle;
		const childIdx = w.$childIndex;
		if (handle != null && childIdx != null) {
			const key = `${handle}:${childIdx}`;
			if (seen.has(key)) return;
			seen.add(key);
		}
		visit(w);
		for (const k of Object.keys(w)) {
			if (k.startsWith('$')) continue;
			const v = w[k];
			if (isWrappedNodeData(v)) recurse(v);
			else if (Array.isArray(v)) for (const x of v) if (isWrappedNodeData(x)) recurse(x);
		}
	};
	recurse(root);
}

export interface WrappedNodeData {
	readonly $type: number;
	readonly $nodeHandle?: number;
	readonly $childIndex?: number;
	readonly [k: string]: unknown;
}
function isWrappedNodeData(v: unknown): v is WrappedNodeData {
	return !!v && typeof v === 'object' && typeof (v as { $type?: unknown }).$type === 'number';
}

/** Relative path from codegen/src/validate to language package types.ts */
const TYPES_MODULE_PATHS: Record<string, string> = {
	rust: '../../../rust/src/types.ts',
	typescript: '../../../typescript/src/types.ts',
	python: '../../../python/src/types.ts'
};

/**
 * Load the grammar package's `kindNameFromId` resolver for Phase D numeric
 * `$type` support. Returns a safe wrapper that returns `undefined` on unknown
 * ids rather than throwing.
 */
/**
 * Load the static KIND_NAMES map from the grammar's generated types module.
 * Returns the Map directly for use as `RulesConfig.kindNames`.
 */
export async function loadKindNames(grammar: string): Promise<ReadonlyMap<number, string> | undefined> {
	const typesModulePath = TYPES_MODULE_PATHS[grammar];
	if (!typesModulePath) return undefined;
	try {
		const typesModule = await import(new URL(typesModulePath, import.meta.url).pathname);
		return typesModule.KIND_NAMES as ReadonlyMap<number, string> | undefined;
	} catch {
		return undefined;
	}
}

export async function loadKindNameFromId(grammar: string): Promise<((id: number) => string | undefined) | undefined> {
	const typesModulePath = TYPES_MODULE_PATHS[grammar];
	if (!typesModulePath) return undefined;
	try {
		const typesModule = await import(new URL(typesModulePath, import.meta.url).pathname);
		// Phase D: types.ts now exports KIND_NAMES (static Map) instead of
		// kindNameFromId (function). Wrap the Map in a function to keep the
		// validator's existing interface.
		const kindNames = typesModule.KIND_NAMES as ReadonlyMap<number, string> | undefined;
		if (kindNames) {
			return (id: number) => kindNames.get(id);
		}
		// Legacy fallback for pre-Phase-D generated types
		const rawFn = typesModule.kindNameFromId as ((id: number) => string) | undefined;
		if (!rawFn) return undefined;
		return (id: number) => {
			try {
				return rawFn(id);
			} catch {
				return undefined;
			}
		};
	} catch {
		return undefined;
	}
}

/**
 * Load the grammar package's `kindIdFromName` resolver for Phase D numeric
 * `$type` support. Returns the raw function (which throws on unknown names)
 * so callers can wrap it in try/catch as needed.
 */
export async function loadKindIdFromName(grammar: string): Promise<((name: string) => number) | undefined> {
	const typesModulePath = TYPES_MODULE_PATHS[grammar];
	if (!typesModulePath) return undefined;
	try {
		const typesModule = await import(new URL(typesModulePath, import.meta.url).pathname);
		return typesModule.kindIdFromName as ((name: string) => number) | undefined;
	} catch {
		return undefined;
	}
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
	Parser: typeof TS.Parser;
	Language: typeof TS.Language;
	lang: TS.Language;
	isOverride: boolean;
}> {
	const { Parser, Language } = await loadWebTreeSitter();

	const thisDir = fileURLToPath(new URL('.', import.meta.url));
	const overrideWasm = join(thisDir, '..', '..', '..', grammar, '.sittir', 'parser.wasm');
	if (existsSync(overrideWasm)) {
		const lang = await Language.load(overrideWasm);
		return { Parser, Language, lang, isOverride: true };
	}

	const baseWasm = fileURLToPath(import.meta.resolve(WASM_PATHS[grammar]!));
	const lang = await Language.load(baseWasm);
	return { Parser, Language, lang, isOverride: false };
}

// ---------------------------------------------------------------------------
// nodeToConfig — NodeData → factory Config-shape conversion
// ---------------------------------------------------------------------------
//
// Validators read tree-sitter output via `readNode` (snake_case `_<name>`
// keys, $-prefixed metadata). The factory signatures take `ConfigOf<T>`:
//   - top-level keys in camelCase (snake→camel on each `_<name>` entry)
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
	readonly tree?: TreeHandle;
	readonly factoryMap?: Record<string, (...args: unknown[]) => unknown>;
	/** Per-kind factory signature hint (from the generated `_factoryShapes`
	 * map). `'config'` expects a Config object; `'children'` is rest-
	 * params `(...children)`; `'text'` expects a bare string. Without
	 * this, recursion defaults to `'config'` which breaks children-shape
	 * factories (e.g. python `argument_list`) because they'd interpret
	 * the whole Config object as the single rest-param item. */
	readonly factoryShapes?: Record<string, FactoryShape>;
	/** Per-field alias-source map (from the generated `_fieldAliasMap`).
	 * Key format: `"parentKind.fieldName"`; value: the source kind the
	 * factory expects. When a child arrives at an alias-declared slot,
	 * its tree-sitter-emitted $type is the alias target; `resolveChild`
	 * consults this map to dispatch the matching source-kind factory
	 * instead. Without it, ADR-0006-aware fields silently dispatch the
	 * wrong factory (e.g. `block` factory on a `_match_block` body). */
	readonly fieldAliasMap?: Record<string, Record<string, string>>;
	/** Per-kind list of declared factory Config field names (from the
	 * generated `_factoryFields`). Drives orphan-child promotion: when
	 * a read node has $children but the expected field is missing from
	 * $fields (tree-sitter elided the label — python `list_splat` at
	 * expression-statement position is the canonical case), route
	 * children into the declared fields by position. */
	readonly factoryFields?: Record<string, readonly string[]>;
	/** Per-polymorph variant descriptor (from `_polymorphVariants`).
	 *  `nodeToConfig` uses this to stamp `$variant` on the returned
	 *  config when the parent kind is a polymorph. The dispatcher's
	 *  `switch (config.$variant)` requires the tag — this is the
	 *  single plumb-in for readNode-derived data that doesn't carry
	 *  it natively. */
	readonly polymorphVariants?: PolymorphVariantMap;
	/** Validator-supplied CST fallback for override polymorphs whose native
	 * read collapsed the wrapper child kind before factory dispatch. */
	readonly firstNamedChildKindHint?: string;
	/** Ordered CST named-child candidates for override polymorphs whose
	 * discriminating wrapper kind is not the first named child. */
	readonly namedChildKindHints?: readonly string[];
	/** Internal — current parent kind during field recursion. Used with
	 * `fieldAliasMap` to form `${parentKind}.${fieldName}` lookups. */
	readonly _parentKind?: string;
	/** Internal — current field name during field recursion. */
	readonly _fieldName?: string;
	/** Internal recursion guard — set by the helper, not the caller. */
	readonly _depth?: number;
	/** Phase D: resolver for numeric $type → string kind name. Required when
	 * input nodes carry numeric $type (readNode output post-Phase-D). */
	readonly kindNameFromId?: (id: number) => string | undefined;
}

interface ReadNodeLike {
	// $type is numeric (TSKindId) for parser.c-derived kinds; string for
	// hidden/synthetic kinds (e.g. "_suite") that have no parser.c entry.
	readonly $type?: string | number;
	readonly $text?: string;
	readonly $nodeHandle?: number;
	readonly $childIndex?: number;
	readonly $children?: readonly unknown[];
	readonly $named?: boolean;
}

/**
 * Determine whether an anonymous NodeData token should pass through
 * `resolveChild` unchanged.
 *
 * @remarks
 * Anonymous tokens (separators, delimiters, keywords promoted to `_<name>` by
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
	return c.$named === false;
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
	factoryMap: NodeToConfigOpts['factoryMap']
): boolean {
	return depth > 64 || !tree || !factoryMap;
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
	fieldAliasMap: NodeToConfigOpts['fieldAliasMap']
): string {
	if (fieldAliasMap && parentKind && fieldName) {
		const key = `${parentKind}.${fieldName}`;
		const targetMap = fieldAliasMap[key];
		if (targetMap && targetMap[rawKind]) return targetMap[rawKind]!;
	}
	return rawKind;
}

/**
 * Drill into a shallow child NodeData via the tree handle, then convert
 * recursively and route through its kind's factory. Falls back to the
 * passed-in shallow NodeData when `tree` isn't available OR the child
 * lacks a $nodeId (factory-built children don't carry one).
 */
function resolveChild(child: unknown, opts: NodeToConfigOpts): unknown {
	if (child == null) return child;
	if (typeof child === 'string' || typeof child === 'number') return child;
	if (typeof child !== 'object') return child;
	const c = child as ReadNodeLike;
	if (isAnonTokenPassthrough(c)) return child;
	const { tree, factoryMap, factoryShapes, fieldAliasMap, _depth = 0, _parentKind, _fieldName } = opts;
	if (shouldHaltRecursion(_depth, tree, factoryMap)) return child;
	// Drill into the child to materialize its own _<name> keys / $children.
	let drilled: ReadNodeLike = c;
	if (c.$nodeHandle != null && c.$childIndex != null && tree) {
		try {
			// Per-handle dispatch: native handles read via napi (tree.read);
			// wasm handles fall through to the JS walker. Validators stay
			// backend-agnostic.
			drilled = (
				tree.read ? tree.read(c.$nodeHandle, c.$childIndex) : readNodeFn(tree, c.$nodeHandle, c.$childIndex)
			) as ReadNodeLike;
		} catch {
			// Tree handle lacked the node (factory-built subtree?) — fall
			// back to the shallow entry we already have.
		}
	}
	// $type may be numeric (TSKindId) or string (hidden/synthetic kind).
	const rawTypeId = drilled.$type ?? c.$type;
	const rawKind =
		rawTypeId !== undefined
			? typeof rawTypeId === 'number'
				? (opts.kindNameFromId?.(rawTypeId) ?? String(rawTypeId))
				: rawTypeId
			: undefined;
	if (!rawKind) return drilled;
	let kind = resolveAliasedKind(rawKind, _parentKind, _fieldName, fieldAliasMap);
	let factory = factoryMap![kind];
	// Phase D: kindNameFromId returns the canonical form (e.g. '_type_identifier')
	// but factoryMap is keyed by the tree-sitter visible name ('type_identifier').
	// If the factory lookup fails and kind starts with '_', try the stripped form.
	if (!factory && kind.startsWith('_')) {
		const strippedKind = kind.slice(1);
		const strippedFactory = factoryMap![strippedKind];
		if (strippedFactory) {
			kind = strippedKind;
			factory = strippedFactory;
		}
	}
	if (!factory) return drilled; // hidden / unfactoryable kind — pass through
	const shape = factoryShapes?.[kind] ?? 'config';
	// 'text' shape: leaf factory takes a bare string.
	if (shape === 'text') {
		return factory(drilled.$text ?? '');
	}
	const childConfig = nodeToConfig(drilled, { ...opts, _depth: _depth + 1 });
	// 'spread' shape: rest-params signature — spread `children`.
	if (shape === 'spread') {
		const kids = (childConfig.children ?? []) as unknown[];
		return factory(...kids);
	}
	// 'direct' shape: factory takes one direct value rather than a config
	// object. Field-backed direct calls use factoryFields metadata; child-
	// backed direct calls take the first `children` element.
	if (shape === 'direct') {
		const { factoryFields } = opts;
		const fieldNames = factoryFields?.[kind];
		const rawName = fieldNames?.[0];
		const camelName = rawName?.replace(/_([a-z])/g, (_m: string, c: string) => c.toUpperCase());
		const value = camelName
			? (childConfig as Record<string, unknown>)[camelName]
			: ((childConfig.children ?? []) as unknown[])[0];
		return factory(value);
	}
	return factory(childConfig);
}

/**
 * Test whether a named-slot key is identifier-shaped and thus a valid factory
 * Config slot.
 *
 * @remarks
 * Promoted anonymous keyword / punctuation tokens use the token's raw text as
 * the storage key (e.g. `_,`, `_:`, `_(`). Factory Config types only declare
 * identifier-shaped slots; spreading punctuation keys pollutes the config
 * without ever being read by the factory.
 *
 * @param key - A raw key (without `_` prefix) from a named slot.
 * @returns `true` if the key matches `[a-zA-Z_]\w*` and should be included.
 */
function isIdentifierShapedFieldKey(key: string): boolean {
	return /^[a-zA-Z_][\w]*$/.test(key);
}

/**
 * Determine whether to promote orphan `$children` into declared factory fields
 * by position instead of routing them to `children`.
 *
 * @remarks
 * When the parent kind declares fields via `_factoryFields` but none of them
 * appear in the node's `_<name>` keys, tree-sitter likely elided the field label for this
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
	namedChildren: readonly unknown[]
): boolean {
	if (!declaredFields || namedChildren.length === 0) return false;
	if (namedChildren.length > declaredFields.length) return false;
	const noFieldMatched = declaredFields.every((name) => {
		const camel = name.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase());
		return populatedOut[camel] === undefined;
	});
	return noFieldMatched;
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
	out: Record<string, unknown>
): void {
	out.children = children.map((c) => resolveChild(c, childOpts));
}

export function nodeToConfig(data: ReadNodeLike, opts: NodeToConfigOpts = {}): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	// $type may be numeric (TSKindId) or string (hidden/synthetic kind).
	const parentKind =
		data.$type !== undefined
			? typeof data.$type === 'number'
				? (opts.kindNameFromId?.(data.$type) ?? String(data.$type))
				: data.$type
			: undefined;
	// ADR-0018 Phase 3a: named slots are stored as `_<name>` top-level keys
	// directly on the NodeData object (de-hoisted storage). Fall back to the
	// legacy `$fields` wrapper for backward compatibility with old fixtures.
	const rec = data as unknown as Record<string, unknown>;
	const namedSlotEntries: [string, unknown][] = [];
	for (const key of Object.keys(rec)) {
		if (key.startsWith('_')) {
			namedSlotEntries.push([key.slice(1), rec[key]]);
		}
	}
	for (const [k, v] of namedSlotEntries) {
		if (v === undefined) continue;
		if (!isIdentifierShapedFieldKey(k)) continue;
		const camelKey = k.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase());
		const childOpts: NodeToConfigOpts = {
			...opts,
			_parentKind: parentKind,
			_fieldName: k,
			firstNamedChildKindHint: undefined,
			namedChildKindHints: undefined
		};
		out[camelKey] = Array.isArray(v) ? v.map((item) => resolveChild(item, childOpts)) : resolveChild(v, childOpts);
	}
	if (data.$children) {
		const declaredFields = parentKind ? opts.factoryFields?.[parentKind] : undefined;
		const namedChildren = data.$children.filter(
			(c) => c != null && typeof c === 'object' && (c as { $named?: boolean }).$named !== false
		);
		const childOpts: NodeToConfigOpts = {
			...opts,
			_parentKind: undefined,
			_fieldName: undefined,
			firstNamedChildKindHint: undefined,
			namedChildKindHints: undefined
		};
		if (shouldPromoteOrphanChildren(declaredFields, out, namedChildren)) {
			// Assign by position: first N named children → first N declared fields.
			namedChildren.forEach((child, i) => {
				const name = declaredFields![i]!;
				const camel = name.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase());
				const resolveOpts: NodeToConfigOpts = {
					...opts,
					_parentKind: parentKind,
					_fieldName: name,
					firstNamedChildKindHint: undefined,
					namedChildKindHints: undefined
				};
				out[camel] = resolveChild(child, resolveOpts);
			});
		} else {
			assignChildrenToConfig(data.$children, childOpts, out);
		}
	}
	// Polymorph $variant stamping — the dispatcher's `switch
	// (config.$variant)` requires the tag. Derive it from either the
	// first child's kind (source='override') or from the property-
	// presence on the derived config (source='promoted').
	if (parentKind && opts.polymorphVariants) {
		const desc = opts.polymorphVariants[parentKind];
		if (desc && !('$variant' in out)) {
			const v = inferPolymorphVariant(
				desc,
				data,
				out,
				parentKind,
				opts.kindNameFromId,
				opts.firstNamedChildKindHint,
				opts.namedChildKindHints
			);
			if (v !== undefined) out.$variant = v;
		}
	}
	return out;
}

/**
 * Infer the `$variant` tag for a polymorph NodeData that doesn't
 * carry one natively. Mirrors the original dispatcher fallback logic
 * but lives in `nodeToConfig` so the variant is present BEFORE the
 * factory is called, not as runtime recovery inside the dispatcher.
 *
 * @param desc - Variant descriptor from factory-map.json5.
 * @param data - Raw read NodeData (used for first-child $type lookup).
 * @param derivedConfig - Already-built config (used for field-presence).
 * @param parentKind - Parent polymorph kind, used for warn attribution.
 * @returns The resolved variant name, or `undefined` if no form matched.
 */
function inferPolymorphVariant(
	desc: PolymorphVariantDescriptor,
	data: ReadNodeLike,
	derivedConfig: Record<string, unknown>,
	parentKind: string,
	kindNameFromId?: (id: number) => string | undefined,
	firstNamedChildKindHint?: string,
	namedChildKindHints?: readonly string[]
): string | undefined {
	switch (desc.source) {
		case 'override':
			return inferFromChildKind(
				desc.childKind,
				data,
				parentKind,
				kindNameFromId,
				firstNamedChildKindHint,
				namedChildKindHints
			);
		case 'promoted':
			return inferFromFieldPresence(desc.fields, derivedConfig, parentKind);
		default:
			return assertNever(desc);
	}
}

/**
 * Resolve a variant tag by looking up the first named child's kind in
 * the `childKind` map. Used for polymorphs where each form is a
 * distinct child node kind (source='override').
 */
function inferFromChildKind(
	childKind: Readonly<Record<string, string>>,
	data: ReadNodeLike,
	parentKind: string,
	kindNameFromId?: (id: number) => string | undefined,
	firstNamedChildKindHint?: string,
	namedChildKindHints?: readonly string[]
): string | undefined {
	const firstChild = data.$children?.find(
		(c) => c != null && typeof c === 'object' && (c as { $named?: boolean }).$named !== false
	) as { $type?: string | number } | undefined;
	const rawType = firstChild?.$type;
	// Phase D: $type is numeric (TSKindId) or string (hidden/synthetic kind).
	// Resolve to a kind-name string for childKind map lookup.
	let kind: string | undefined;
	if (rawType === undefined) {
		kind = undefined;
	} else if (typeof rawType === 'number') {
		kind = kindNameFromId?.(rawType) ?? String(rawType);
	} else {
		// String $type: tree-sitter reports hidden rules WITHOUT the leading
		// underscore (e.g. 'expression_statement_with_semi'), but kindNameFromId
		// may return the canonical underscore form (e.g.
		// '_expression_statement_with_semi'). Normalize to strip any leading
		// underscore for the childKind map lookup, which uses the visible name.
		kind = rawType;
	}
	const resolveVariantFromKind = (candidate: string | undefined): string | undefined => {
		if (!candidate) return undefined;
		// Try exact match first (e.g. for visible kinds or already-stripped names).
		if (candidate in childKind) return childKind[candidate];
		// Tree-sitter strips leading underscore from hidden rule names when
		// reporting node.type, but kindNameFromId may have already returned the
		// canonical form with underscore. Try stripping the leading underscore
		// as a fallback.
		const stripped = candidate.startsWith('_') ? candidate.slice(1) : undefined;
		if (stripped && stripped in childKind) return childKind[stripped];
		// Some override-polymorph children arrive under a hidden helper kind
		// whose visible variant child differs only in the prefix family
		// (`_delim_token_tree_paren` → `token_tree_paren`). Fall back to the
		// variant suffix when an exact kind-name match fails.
		let bestVariant: string | undefined;
		let bestSpecificity = -1;
		for (const [, variant] of Object.entries(childKind)) {
			const suffix = `_${variant}`;
			if (candidate.endsWith(suffix) || stripped?.endsWith(suffix)) {
				if (variant.length > bestSpecificity) {
					bestVariant = variant;
					bestSpecificity = variant.length;
				}
			}
		}
		return bestVariant;
	};
	const resolvedFromHints = (candidates: readonly (string | undefined)[]): string | undefined => {
		for (const candidate of candidates) {
			const resolved = resolveVariantFromKind(candidate);
			if (resolved !== undefined) return resolved;
		}
		return undefined;
	};
	const resolved =
		resolveVariantFromKind(kind) ??
		resolvedFromHints(namedChildKindHints ?? []) ??
		resolveVariantFromKind(firstNamedChildKindHint);
	if (resolved !== undefined) return resolved;
	const distinctHints = [...new Set((namedChildKindHints ?? []).filter((candidate) => candidate && candidate !== kind))];
	console.warn(
		`[nodeToConfig] polymorph '${parentKind}' (source=override): no variant matched first child kind '${kind ?? '<none>'}'. ` +
			(distinctHints.length > 0 ? `CST named children [${distinctHints.join(', ')}]. ` : '') +
			(firstNamedChildKindHint && firstNamedChildKindHint !== kind
				? `CST hint '${firstNamedChildKindHint}'. `
				: '') +
			`Known: [${Object.keys(childKind).join(', ')}]`
	);
	return undefined;
}

/**
 * Resolve a variant tag by testing which form's declared fields are all
 * present on the derived config. Most-specific (largest field set)
 * wins; ties broken by declaration order. A zero-field form (if any)
 * lands last by sort order and matches vacuously as a fallback.
 */
function inferFromFieldPresence(
	fieldsByForm: Readonly<Record<string, readonly string[]>>,
	derivedConfig: Record<string, unknown>,
	parentKind: string
): string | undefined {
	const entries = Object.entries(fieldsByForm).sort(([, a], [, b]) => b.length - a.length);
	for (const [formName, fields] of entries) {
		if (fields.every((f) => f in derivedConfig)) return formName;
	}
	console.warn(
		`[nodeToConfig] polymorph '${parentKind}' (source=promoted): no variant matched derived-config keys [${Object.keys(derivedConfig).join(', ')}]. ` +
			`Forms: ${entries.map(([n, f]) => `${n}=[${f.join(',')}]`).join('; ')}`
	);
	return undefined;
}

// ---------------------------------------------------------------------------
// Metrics emission helper — spec 054 FR-003
// ---------------------------------------------------------------------------

/**
 * Single shared call site for `dumpMetrics` so all four corpus validators
 * funnel through one definition (DRY: one source, one derivation). The
 * metrics accumulator is process-wide; each invocation writes the
 * cumulative state, so when vitest runs all four validators against all
 * three grammars in one process the final write contains every per-kind
 * entry observed in that run.
 *
 * Backend selection mirrors `buildReadHandle`: `SITTIR_BACKEND=native`
 * → `'native'`; anything else → `'ts'`. No-op when `SITTIR_METRICS=1`
 * is unset (the underlying `dumpMetrics` short-circuits).
 *
 * @see packages/core/src/metrics.ts for the accumulator + writer.
 */
export function emitValidatorMetrics(): void {
	if (!metricsEnabled) return;
	const backend: 'ts' | 'native' = process.env.SITTIR_BACKEND === 'native' ? 'native' : 'ts';
	dumpMetrics(backend);
}
