import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readNode as readNodeFn, dumpMetrics, metricsEnabled, sliceSpan } from '@sittir/common';
import type * as TS from 'web-tree-sitter';
import type { SgNode as _SgNode, Range } from '@ast-grep/wasm';

import type { AnyNodeData, AnyTreeNode, NodeTrivia } from '@sittir/types';
import type { TreeHandle } from '@sittir/common';
import type { SittirEngine } from '@sittir/common/engine';
import { load } from '../codegen-surface.ts';
import type {
	CodegenSurface,
	PolymorphVariantMap,
	FactoryShape,
	FactorySlotMeta,
	OpaqueFacts
} from '../codegen-surface.ts';

const loadWebTreeSitter: CodegenSurface['engineLoader']['loadWebTreeSitter'] = (await load('engineLoader'))
	.loadWebTreeSitter;
const { opaqueFacts, readFacts } = await load('opaqueFacts');
const { assertNativeBinaryFresh, hostBinaryFreshnessFor } = await load('nativeBinaryFreshness');
const { pluralize, snakeToCamel } = await load('modelNodeMap');

type SlotArity = 'one' | 'many';
type SlotOrigin = 'field' | 'kind';
interface SlotModel {
	readonly name: string;
	readonly storageKey: string;
	readonly arity: SlotArity;
	readonly metadata: OpaqueFacts;
}
function createNamedSlotModel(name: string, arity: SlotArity): SlotModel {
	return { name, storageKey: `_${name}`, arity, metadata: opaqueFacts({ origin: 'field' satisfies SlotOrigin }) };
}
function createUnnamedChildrenSlotModel(arity: SlotArity): SlotModel {
	return {
		name: 'children',
		storageKey: '$other',
		arity,
		metadata: opaqueFacts({ origin: 'kind' satisfies SlotOrigin })
	};
}

export interface CorpusEntry {
	name: string;
	source: string;
}

export type TSNode = TS.Node;
export type TSTree = TS.Tree;

export function parseCorpus(content: string, grammar?: string): CorpusEntry[] {
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

		let declaredLanguage: string | undefined;
		while (i < lines.length) {
			const line = lines[i]!;
			if (line.startsWith('====')) {
				i++;
				continue;
			}
			const directiveMatch = line.trim().match(/^:language\((.+?)\)$/);
			if (directiveMatch) {
				declaredLanguage = directiveMatch[1];
				i++;
				continue;
			}
			break;
		}

		const sourceLines: string[] = [];
		while (i < lines.length && !lines[i]!.match(/^-{3,}$/)) {
			sourceLines.push(lines[i]!);
			i++;
		}

		while (i < lines.length && !lines[i]!.startsWith('====')) i++;

		const source = sourceLines.join('\n').trim();
		if (!source) continue;
		if (grammar !== undefined && declaredLanguage !== undefined && declaredLanguage !== grammar) {
			continue;
		}
		entries.push({ name, source });
	}

	return entries;
}

const FIXTURES_DIR = fileURLToPath(new URL('../../../codegen/fixtures', import.meta.url));

export function loadCorpusEntries(grammar: string): CorpusEntry[] {
	const entries: CorpusEntry[] = [];
	const files = readdirSync(FIXTURES_DIR).filter((f) => f.startsWith(`${grammar}-`) && f.endsWith('.txt'));
	for (const file of files) {
		const content = readFileSync(join(FIXTURES_DIR, file), 'utf-8');
		entries.push(...parseCorpus(content, grammar));
	}
	return entries;
}

export { loadWebTreeSitter };

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
	const handle: TreeHandle = {
		rootNode: adaptNode(tree.rootNode),
		source,
		kindIdFromName
	};
	return handle;
}

let _cachedNativeEngine: { grammar: string; engine: SittirEngine; binaryMtimeMs: number } | null = null;

export function boundaryModulePath(grammar: string): string {
	const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url)).replace(/\/$/, '');
	return pathToFileURL(join(repoRoot, `packages/${grammar}/src/boundary.ts`)).href;
}

export async function loadNativeEngine(grammar: string): Promise<SittirEngine> {
	const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url)).replace(/\/$/, '');
	const binaries = hostBinaryFreshnessFor(repoRoot, grammar);
	const binaryMtimeMs = binaries.length > 0 ? Math.max(...binaries.map((b) => b.binaryMtimeMs)) : 0;

	if (_cachedNativeEngine && _cachedNativeEngine.grammar === grammar) {
		if (_cachedNativeEngine.binaryMtimeMs !== binaryMtimeMs) {
			throw new Error(
				`Native engine for '${grammar}' was rebuilt after this process loaded it — ` +
					`napi modules cannot be reloaded in-process. Re-run the command in a fresh process.`
			);
		}
		return _cachedNativeEngine.engine;
	}

	assertNativeBinaryFresh(repoRoot, grammar);

	const mod = (await import(boundaryModulePath(grammar))) as { defaultEngine?: unknown };
	if (typeof mod.defaultEngine !== 'function') {
		throw new Error(`boundary module for grammar '${grammar}' does not export 'defaultEngine'`);
	}
	const engine = (mod.defaultEngine as () => SittirEngine)();

	const profile = engine.diagnostics.buildProfile;
	if (profile === 'debug' && process.env.SITTIR_ALLOW_DEBUG_VALIDATE !== '1') {
		throw new Error(
			`Native engine for '${grammar}' is a DEBUG build — debug binaries are refused for ` +
				`validation (known segfault class). Rebuild release (\`gen\` without --native-debug), ` +
				`or set SITTIR_ALLOW_DEBUG_VALIDATE=1 to override.`
		);
	}

	_cachedNativeEngine = { grammar, engine, binaryMtimeMs };
	return engine;
}

export function cachedNativeEngineProfile(grammar: string): string | undefined {
	if (_cachedNativeEngine && _cachedNativeEngine.grammar === grammar) {
		return _cachedNativeEngine.engine.diagnostics.buildProfile;
	}
	return undefined;
}

export async function buildReadHandle(
	grammar: string,
	tree: TS.Tree,
	source: string,
	backend?: 'native' | 'js',
	kindIdFromName?: (kind: string) => number | undefined
): Promise<TreeHandle> {
	const effectiveBackend = backend ?? process.env.SITTIR_BACKEND;
	if (effectiveBackend === 'native') {
		const engine = await loadNativeEngine(grammar);
		return engine.diagnostics.parseAndRead(source).tree;
	}
	return treeHandle(tree, source, kindIdFromName);
}

export function readNodeAt(handle: TreeHandle, node: AnyTreeNode, nativeCoords: NativeNodeCoords | null): AnyNodeData {
	if (nativeCoords && handle.read) {
		if (nativeCoords.embeddedData !== undefined) {
			return nativeCoords.embeddedData;
		}
		if (nativeCoords.handle === undefined) {
			return handle.read();
		}
		return handle.read(nativeCoords.handle, nativeCoords.childIndex);
	}
	const prev = handle.rootNode;
	(handle as { rootNode: AnyTreeNode }).rootNode = node;
	try {
		return readNodeFn(handle);
	} finally {
		(handle as { rootNode: AnyTreeNode }).rootNode = prev;
	}
}

export interface NativeNodeCoords {
	handle?: number;
	childIndex?: number;
	embeddedData?: AnyNodeData;
}

function childEntries(value: unknown | readonly unknown[] | undefined): readonly unknown[] {
	if (value === undefined) return [];
	return Array.isArray(value) ? value : [value];
}

function isNativeNodeData(value: unknown): value is AnyNodeData {
	return value != null && typeof value === 'object' && '$type' in value;
}

function pushNativeCandidates(value: unknown, out: AnyNodeData[]): void {
	for (const entry of childEntries(value)) {
		if (isNativeNodeData(entry)) out.push(entry);
	}
}

function collectNativeChildNodes(d: AnyNodeData): AnyNodeData[] {
	const out: AnyNodeData[] = [];
	const rec = d as unknown as Record<string, unknown>;
	for (const key of Object.keys(rec)) {
		if (key.startsWith('_')) pushNativeCandidates(rec[key], out);
	}
	const legacyFields = rec.$fields;
	if (legacyFields != null && typeof legacyFields === 'object') {
		for (const value of Object.values(legacyFields as Record<string, unknown>)) {
			pushNativeCandidates(value, out);
		}
	}
	pushNativeCandidates(d.$other, out);
	const trivia = d.$_trivia;
	if (trivia) {
		pushNativeCandidates(trivia.leading, out);
		pushNativeCandidates(trivia.trailing, out);
	}
	return out;
}

function isTriviaEntry(parent: AnyNodeData, child: AnyNodeData): boolean {
	const trivia = parent.$_trivia;
	if (!trivia) return false;
	return (trivia.leading?.includes(child) ?? false) || (trivia.trailing?.includes(child) ?? false);
}

function hasEmbeddedNativeChildren(d: AnyNodeData): boolean {
	if (d.$other !== undefined) return true;
	const rec = d as unknown as Record<string, unknown>;
	for (const key of Object.keys(rec)) {
		if (key.startsWith('_')) return true;
	}
	const legacyFields = rec.$fields;
	if (legacyFields != null && typeof legacyFields === 'object') {
		return Object.keys(legacyFields as Record<string, unknown>).length > 0;
	}
	return false;
}

export function findNativeNodeId(
	handle: TreeHandle,
	kind: string,
	kindNameFromId?: (id: number) => string | undefined
): NativeNodeCoords | null {
	if (!handle.read) return null;
	const read = handle.read;
	const root = handle.read();

	function kindOf(d: AnyNodeData): string {
		return typeof d.$type === 'number' ? (kindNameFromId?.(d.$type) ?? String(d.$type)) : d.$type;
	}

	if (kindOf(root) === kind) {
		return {};
	}

	function walk(d: AnyNodeData): NativeNodeCoords | null {
		for (const child of collectNativeChildNodes(d)) {
			if (kindOf(child) === kind && isTriviaEntry(d, child)) {
				return { embeddedData: child };
			}
			const handleForChild = child.$nodeHandle ?? d.$nodeHandle;
			if (kindOf(child) === kind && handleForChild !== undefined && child.$childIndex !== undefined) {
				return { handle: handleForChild, childIndex: child.$childIndex };
			}
			let drilled = child;
			if (!hasEmbeddedNativeChildren(drilled) && handleForChild !== undefined && drilled.$childIndex !== undefined) {
				drilled = read(handleForChild, drilled.$childIndex) as AnyNodeData;
			}
			const found = walk(drilled);
			if (found !== null) return found;
		}
		return null;
	}

	return walk(root);
}

export interface NativeCandidateCoords {
	coords: NativeNodeCoords;
	span: { start: number; end: number } | undefined;
}

export function walkNativeForKind(
	handle: TreeHandle,
	kind: string,
	kindNameFromId?: (id: number) => string | undefined
): NativeCandidateCoords[] {
	if (!handle.read) return [];
	const read = handle.read;
	const root = read();
	const results: NativeCandidateCoords[] = [];

	function kindOf(d: AnyNodeData): string {
		return typeof d.$type === 'number' ? (kindNameFromId?.(d.$type) ?? String(d.$type)) : d.$type;
	}

	function spanOf(d: AnyNodeData): { start: number; end: number } | undefined {
		return (d as unknown as Record<string, unknown>).$span as { start: number; end: number } | undefined;
	}

	if (kindOf(root) === kind) {
		results.push({ coords: {}, span: spanOf(root) });
	}

	function walk(d: AnyNodeData): void {
		for (const child of collectNativeChildNodes(d)) {
			const handleForChild = child.$nodeHandle ?? d.$nodeHandle;
			if (kindOf(child) === kind && handleForChild !== undefined && child.$childIndex !== undefined) {
				results.push({
					coords: { handle: handleForChild, childIndex: child.$childIndex },
					span: spanOf(child)
				});
			}
			let drilled = child;
			if (!hasEmbeddedNativeChildren(drilled) && handleForChild !== undefined && drilled.$childIndex !== undefined) {
				drilled = read(handleForChild, drilled.$childIndex) as AnyNodeData;
			}
			walk(drilled);
		}
	}

	walk(root);
	return results;
}

export function findFirst(node: TS.Node, kind: string): TS.Node | null {
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
		source_file: (r) => r,
		_expression: (r) => `fn _f() { let _ = ${r}; }`,
		_type: (r) => `type _X = ${r};`,
		_pattern: (r) => `fn _f() { let ${r} = (); }`,
		_declaration_statement: (r) => r,
		_literal: (r) => `fn _f() { let _ = ${r}; }`,
		_literal_pattern: (r) => `fn _f() { let ${r} = (); }`,
		parameters: (r) => `fn _f${r} {}`,
		parameter: (r) => `fn _f(${r}) {}`,
		arguments: (r) => `f${r};`,
		type_parameters: (r) => `fn _f${r}() {}`,
		type_parameter: (r) => `fn _f<${r}>() {}`,
		mut_pattern: (r) => `fn _f(x: i32) { match x { ${r} => () } }`,
		generic_type_with_turbofish: (r) => `type _X = ${r}::Item;`,
		scoped_type_identifier_in_expression_position: (r) => `fn _f() { let _ = ${r} { val: 1 }; }`,
		delim_token_tree: (r) => `fn _f() { mac! ${r} }`,
		token_tree: (r) => `macro_rules! _m { () => ${r} }`,
		visibility_modifier: (r) => `${r} fn _f() {}`
	},
	typescript: {
		program: (r) => r,
		expression: (r) => `let _ = ${r};`,
		type: (r) => `type _X = ${r};`,
		pattern: (r) => `let ${r} = null;`,
		declaration: (r) => r,
		statement: (r) => r,
		formal_parameters: (r) => `function _f${r} {}`,
		required_parameter: (r) => `function _f(${r}) {}`,
		arguments: (r) => `_f${r};`,
		type_parameters: (r) => `function _f${r}() {}`,
		variable_declarator: (r) => `let ${r};`,
		type_annotation: (r) => `let _${r};`,
		class_body: (r) => `class _C ${r}`,
		property_signature: (r) => `interface _I { ${r} }`,
		index_signature: (r) => `type _T = { ${r} }`,
		interface_body: (r) => `interface _I ${r}`,
		decorator_member_expression: (r) => `@${r}\nclass _W {}`,
		decorator_call_expression: (r) => `@${r}\nclass _W {}`,
		decorator_parenthesized_expression: (r) => `@${r}\nclass _W {}`,
		rest_pattern: (r) => `const [${r}] = [];`
	},
	python: {
		module: (r) => r,
		expression: (r) => `_ = ${r}`,
		type: (r) => `_: ${r} = None`,
		pattern: (r) => `for ${r} in _: pass`,
		simple_statement: (r) => r,
		compound_statement: (r) => r,
		expression_statement: (r) => r,
		assignment: (r) => r,
		function_definition: (r) => r,
		parameters: (r) => `def _f${r}:\n    pass`,
		_parameters: (r) => `def _f(${r}):\n    pass`,
		argument_list: (r) => `_f${r}`,
		dotted_name: (r) => `import ${r}`,
		list_splat: (r) => `_f(${r})`,
		list_splat_pattern: (r) => `${r} = (1,)`,
		attribute: (r) => `[${r}]`,
		subscript: (r) => `[${r}]`,
		parenthesized_expression: (r) => `f(${r})`
	}
};

export interface WrapForReparseResult {
	readonly text: string;
	readonly offset: number;
}

function applyWrapperTemplate(rendered: string, wrapper: (r: string) => string): WrapForReparseResult {
	const text = wrapper(rendered);
	const SENTINEL = '\u0001SITTIR_SENTINEL\u0001';
	const sentinelText = wrapper(SENTINEL);
	const offset = sentinelText.indexOf(SENTINEL);
	return { text, offset: offset >= 0 ? offset : 0 };
}

function selectAndApplySupertypeWrapper(
	kind: string,
	wrappers: Record<string, (r: string) => string>,
	kindToSupertypes: Map<string, string[]>,
	rendered: string
): WrapForReparseResult | null {
	const WRAPPER_PRIORITY = [
		'declaration',
		'statement',
		'_declaration_statement',
		'_simple_statement',
		'_compound_statement',
		'expression',
		'type',
		'pattern',
		'_expression',
		'_type',
		'_literal',
		'_literal_pattern',
		'_pattern'
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
	const first = [...reachable][0]!;
	return applyWrapperTemplate(rendered, wrappers[first]!);
}

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
	const visibleKind = wrappers[kind] !== undefined ? kind : (opts?.targetKind ?? kind);
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
	if (opts?.targetKind && opts.targetKind !== kind) {
		const targetWrapper = wrappers[opts.targetKind];
		if (targetWrapper) return applyWrapperTemplate(rendered, targetWrapper);
	}
	const bySource = selectAndApplySupertypeWrapper(visibleKind, wrappers, kindToSupertypes, rendered);
	if (bySource !== null) return bySource;
	if (opts?.targetKind && opts.targetKind !== visibleKind) {
		return selectAndApplySupertypeWrapper(opts.targetKind, wrappers, kindToSupertypes, rendered);
	}
	return null;
}

export const WASM_PATHS: Record<string, string> = {
	rust: 'tree-sitter-rust/tree-sitter-rust.wasm',
	typescript: 'tree-sitter-typescript/tree-sitter-typescript.wasm',
	python: 'tree-sitter-python/tree-sitter-python.wasm'
};

export const WRAP_MODULE_PATHS: Record<string, string> = {
	rust: '../../../rust/src/wrap.ts',
	typescript: '../../../typescript/src/wrap.ts',
	python: '../../../python/src/wrap.ts'
};

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

export async function loadWrapNode(
	grammar: string
): Promise<((data: AnyNodeData, tree: TreeHandle) => unknown) | null> {
	const p = WRAP_MODULE_PATHS[grammar];
	if (!p) return null;
	try {
		const mod = await import(new URL(p, import.meta.url).pathname);
		return mod.wrapNode ?? null;
	} catch (e) {
		console.error(`[validators] failed to load wrap module for ${grammar}: ${(e as Error).message}`);
		return null;
	}
}

const NODE_MODEL_PATHS: Record<string, string> = {
	rust: '../../../rust/src/node-model.json5',
	typescript: '../../../typescript/src/node-model.json5',
	python: '../../../python/src/node-model.json5'
};

export interface Seat {
	readonly kind: string;
	readonly shape: 'arm' | 'splice' | 'elements' | 'tuple';
	readonly mount?: string;
	readonly seated?: true;
}

export type SeatTable = Record<string, Record<string, Record<string, Seat>>>;

export interface LoadedNodeModel {
	readonly irKeys: Record<string, string>;
	readonly modelTypes: Record<string, string>;
	readonly leafPatterns: Record<string, RegExp>;
	readonly hoistedKinds: ReadonlySet<string>;
	readonly seats: SeatTable;
	readonly slotKinds: Record<string, Record<string, readonly string[]>>;
	readonly slotStorage: Record<string, Record<string, string>>;
	readonly factoryShapes: Record<string, FactoryShape>;
	readonly factoryFields: Record<string, readonly string[]>;
	readonly factorySlots: Record<string, Record<string, FactorySlotMeta>>;
	readonly fieldAliasMap: Record<string, Record<string, string>>;
	readonly polymorphVariants: PolymorphVariantMap;
	readonly variantRoutes: Readonly<Record<string, string>>;
	readonly subtypes: Record<string, readonly string[]>;
	readonly slotRequired: Record<string, Record<string, boolean>>;
	readonly slotMultiple: Record<string, Record<string, boolean>>;
	readonly slotDefaults: Record<string, Record<string, string>>;
	readonly bareAccepts: Record<string, readonly string[]>;
	readonly forwardsTo: Record<string, string>;
	readonly listDefaults: Record<string, string>;
	readonly listElementKinds: Record<string, readonly string[]>;
}

interface ParsedNodeModel {
	nodes?: ReadonlyArray<{
		kind: string;
		irKey?: string;
		modelType?: string;
		annotations?: { readonly hoisted?: true };
		slots?: ReadonlyArray<{
			name: string;
			propertyName: string;
			required?: boolean;
			multiple?: boolean;
			kinds?: readonly string[];
			storage?: string;
			values?: ReadonlyArray<{ seat?: Seat; name?: string; default?: true }>;
		}>;
		elementSeats?: readonly Seat[];
		elementKinds?: readonly string[];
		factoryShape?: FactoryShape;
		factoryFields?: readonly string[];
		subtypes?: readonly string[];
		bareAccepts?: readonly string[];
		forwardsTo?: string;
		defaultDelimiter?: string;
		leafPattern?: string;
	}>;
	factorySlots?: Record<string, Record<string, FactorySlotMeta>>;
	fieldAliasMap?: Record<string, Record<string, string>>;
	polymorphVariants?: PolymorphVariantMap;
	variantRoutes?: Record<string, string>;
}

const EMPTY_NODE_MODEL: LoadedNodeModel = {
	irKeys: {},
	modelTypes: {},
	leafPatterns: {},
	hoistedKinds: new Set(),
	seats: {},
	slotKinds: {},
	slotStorage: {},
	factoryShapes: {},
	factoryFields: {},
	factorySlots: {},
	fieldAliasMap: {},
	polymorphVariants: {},
	variantRoutes: {},
	subtypes: {},
	slotRequired: {},
	slotMultiple: {},
	slotDefaults: {},
	bareAccepts: {},
	forwardsTo: {},
	listDefaults: {},
	listElementKinds: {}
};

export function readNodeModelFile(grammar: string): string | undefined {
	const p = NODE_MODEL_PATHS[grammar];
	if (!p) return undefined;
	try {
		return readFileSync(new URL(p, import.meta.url).pathname, 'utf-8');
	} catch {
		return undefined;
	}
}

function regexOfLiteral(literal: string): RegExp {
	const end = literal.lastIndexOf('/');
	return new RegExp(literal.slice(1, end), literal.slice(end + 1));
}

export async function loadNodeModel(grammar: string): Promise<LoadedNodeModel> {
	const raw = readNodeModelFile(grammar);
	if (raw === undefined) return EMPTY_NODE_MODEL;
	const model = JSON.parse(raw) as ParsedNodeModel;
	const irKeys: Record<string, string> = {};
	const modelTypes: Record<string, string> = {};
	const leafPatterns: Record<string, RegExp> = {};
	const hoistedKinds = new Set<string>();
	const seats: SeatTable = {};
	const seatAt = (kind: string, slot: string, seat: Seat): void => {
		((seats[kind] ??= {})[slot] ??= {})[seat.kind] = seat;
	};
	const slotKinds: Record<string, Record<string, readonly string[]>> = {};
	const slotStorage: Record<string, Record<string, string>> = {};
	const factoryShapes: Record<string, FactoryShape> = {};
	const factoryFields: Record<string, readonly string[]> = {};
	const subtypes: Record<string, readonly string[]> = {};
	const slotRequired: Record<string, Record<string, boolean>> = {};
	const slotMultiple: Record<string, Record<string, boolean>> = {};
	const slotDefaults: Record<string, Record<string, string>> = {};
	const bareAccepts: Record<string, readonly string[]> = {};
	const forwardsTo: Record<string, string> = {};
	const listDefaults: Record<string, string> = {};
	const listElementKinds: Record<string, readonly string[]> = {};
	for (const node of model.nodes ?? []) {
		if (node.irKey !== undefined) irKeys[node.kind] = node.irKey;
		if (node.modelType !== undefined) modelTypes[node.kind] = node.modelType;
		if (node.leafPattern !== undefined) leafPatterns[node.kind] = regexOfLiteral(node.leafPattern);
		if (node.annotations?.hoisted === true) hoistedKinds.add(node.kind);
		for (const seat of node.elementSeats ?? []) seatAt(node.kind, '*', seat);
		if (node.slots !== undefined) {
			for (const slot of node.slots) {
				for (const value of slot.values ?? []) {
					if (value.seat !== undefined) seatAt(node.kind, slot.name, value.seat);
					if (value.default === true && value.name !== undefined) {
						(slotDefaults[node.kind] ??= {})[slot.propertyName] = value.name;
					}
				}
			}
			slotKinds[node.kind] = Object.fromEntries(node.slots.map((slot) => [slot.propertyName, slot.kinds ?? []]));
			slotRequired[node.kind] = Object.fromEntries(
				node.slots.map((slot) => [slot.propertyName, slot.required === true])
			);
			slotMultiple[node.kind] = Object.fromEntries(
				node.slots.map((slot) => [slot.propertyName, slot.multiple === true])
			);
			slotStorage[node.kind] = Object.fromEntries(
				node.slots.flatMap((slot) => (slot.storage === undefined ? [] : [[slot.propertyName, slot.storage]]))
			);
		}
		if (node.factoryShape !== undefined) factoryShapes[node.kind] = node.factoryShape;
		if (node.factoryFields !== undefined) factoryFields[node.kind] = node.factoryFields;
		if (node.subtypes !== undefined) subtypes[node.kind] = node.subtypes;
		if (node.bareAccepts !== undefined) bareAccepts[node.kind] = node.bareAccepts;
		if (node.forwardsTo !== undefined) forwardsTo[node.kind] = node.forwardsTo;
		if (node.defaultDelimiter !== undefined) listDefaults[node.kind] = node.defaultDelimiter;
		if (node.elementKinds !== undefined) listElementKinds[node.kind] = node.elementKinds;
	}
	return {
		irKeys,
		modelTypes,
		leafPatterns,
		hoistedKinds,
		seats,
		slotKinds,
		slotStorage,
		factoryShapes,
		factoryFields,
		factorySlots: model.factorySlots ?? {},
		fieldAliasMap: model.fieldAliasMap ?? {},
		polymorphVariants: model.polymorphVariants ?? {},
		variantRoutes: model.variantRoutes ?? {},
		subtypes,
		slotRequired,
		slotMultiple,
		slotDefaults,
		bareAccepts,
		forwardsTo,
		listDefaults,
		listElementKinds
	};
}

export function walkWrappedTree(
	root: unknown,
	visit: (w: WrappedNodeData) => void,
	onAccessorThrow?: (rec: AccessorThrowRecord) => void
): void {
	const seen = new Set<string>();
	const recurse = (w: unknown): void => {
		if (!isWrappedNodeData(w)) return;
		const handle = w.$nodeHandle;
		const childIdx = w.$childIndex;
		if (handle != null && childIdx != null) {
			const key = `${handle}:${childIdx}`;
			if (seen.has(key)) return;
			seen.add(key);
		}
		visit(w);
		for (const k of Object.keys(w)) {
			if (k !== '$other' && !k.startsWith('_')) continue;
			const v = resolveWrappedStorageValue(w, k, onAccessorThrow);
			if (isWrappedNodeData(v)) recurse(v);
			else if (Array.isArray(v)) for (const x of v) if (isWrappedNodeData(x)) recurse(x);
		}
	};
	recurse(root);
}

export function materializeWrappedNodeData(
	root: unknown,
	onAccessorThrow?: (rec: AccessorThrowRecord) => void
): AnyNodeData {
	return materializeWrappedValue(root, onAccessorThrow) as AnyNodeData;
}

export interface AccessorThrowRecord {
	readonly key: string;
	readonly accessor: string;
	readonly type: unknown;
	readonly message: string;
}

export interface ValidatorSkip {
	readonly entry: string;
	readonly reason: string;
	readonly kind?: string;
	readonly input?: string;
}

function materializeWrappedValue(value: unknown, onAccessorThrow?: (rec: AccessorThrowRecord) => void): unknown {
	if (Array.isArray(value)) {
		return value.map((entry) => materializeWrappedValue(entry, onAccessorThrow));
	}
	if (!isWrappedNodeData(value)) return value;
	const materialized: Record<string, unknown> = {};
	for (const [key, raw] of Object.entries(value)) {
		if (key === '$with' || typeof raw === 'function') continue;
		if (key === '$other') {
			const resolved = resolveWrappedStorageValue(value, key, onAccessorThrow);
			if (resolved === undefined) continue;
			materialized.$other = materializeWrappedValue(resolved, onAccessorThrow);
			continue;
		}
		if (key.startsWith('_')) {
			const resolved = resolveWrappedStorageValue(value, key, onAccessorThrow);
			if (resolved === undefined) continue;
			materialized[key] = materializeWrappedValue(resolved, onAccessorThrow);
			continue;
		}
		materialized[key] = materializeWrappedValue(raw, onAccessorThrow);
	}
	return materialized;
}

function resolveWrappedStorageValue(
	node: WrappedNodeData,
	storageKey: string,
	onAccessorThrow?: (rec: AccessorThrowRecord) => void
): unknown {
	if (storageKey !== '$other' && !storageKey.startsWith('_')) {
		return node[storageKey];
	}
	for (const accessorName of accessorCandidatesForStorageKey(storageKey)) {
		const accessor = node[accessorName];
		if (typeof accessor === 'function' && accessor.length === 0) {
			try {
				return (accessor as () => unknown).call(node);
			} catch (e) {
				const message = (e as Error).message;
				const type = (node as any).$type;
				process.stderr.write(
					`[accessor-throw] key=${storageKey} accessor=${accessorName} type=${type} err=${message}\n`
				);
				onAccessorThrow?.({ key: storageKey, accessor: accessorName, type, message });
				return node[storageKey];
			}
		}
	}
	return node[storageKey];
}

function accessorCandidatesForStorageKey(storageKey: string): readonly string[] {
	if (storageKey === '$other') return ['children'];
	if (!storageKey.startsWith('_')) return [];
	const base = snakeToCamel(storageKey.slice(1));
	const plural = pluralize(base);
	return plural === base ? [base] : [base, plural];
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

export const TYPES_MODULE_PATHS: Record<string, string> = {
	rust: '../../../rust/src/types.ts',
	typescript: '../../../typescript/src/types.ts',
	python: '../../../python/src/types.ts'
};

const IR_MODULE_PATHS: Record<string, string> = {
	rust: '../../../rust/src/ir.ts',
	typescript: '../../../typescript/src/ir.ts',
	python: '../../../python/src/ir.ts'
};

export type IrEntry = { readonly strict?: (...args: unknown[]) => unknown } & Record<string, unknown>;

export interface IrSurface {
	readonly entries: Record<string, IrEntry>;
	readonly seats: SeatTable;
	readonly modelTypes: Record<string, string>;
}

export async function loadIrSurface(grammar: string): Promise<IrSurface | undefined> {
	const p = IR_MODULE_PATHS[grammar];
	if (!p) return undefined;
	const model = await loadNodeModel(grammar);
	const mod = (await import(new URL(p, import.meta.url).pathname)) as { ir?: Record<string, unknown> };
	if (mod.ir === undefined) return undefined;
	const entries: Record<string, IrEntry> = {};
	for (const [kind, irKey] of Object.entries(model.irKeys)) {
		const entry = mod.ir[irKey];
		if (entry !== null && (typeof entry === 'object' || typeof entry === 'function')) entries[kind] = entry as IrEntry;
	}
	return { entries, seats: model.seats, modelTypes: model.modelTypes };
}

export async function loadKindNames(grammar: string): Promise<ReadonlyMap<number, string> | undefined> {
	const typesModulePath = TYPES_MODULE_PATHS[grammar];
	if (!typesModulePath) return undefined;
	try {
		const typesModule = await import(new URL(typesModulePath, import.meta.url).pathname);
		return typesModule.KIND_DISPLAY_NAMES as ReadonlyMap<number, string> | undefined;
	} catch {
		return undefined;
	}
}

export async function loadStorageKindNameFromId(
	grammar: string
): Promise<((id: number) => string | undefined) | undefined> {
	const typesModulePath = TYPES_MODULE_PATHS[grammar];
	if (!typesModulePath) return undefined;
	try {
		const typesModule = await import(new URL(typesModulePath, import.meta.url).pathname);
		const kindNames = typesModule.KIND_NAMES as ReadonlyMap<number, string> | undefined;
		return kindNames ? (id: number) => kindNames.get(id) : undefined;
	} catch {
		return undefined;
	}
}

export async function loadIsLeafKind(grammar: string): Promise<(kindId: number) => boolean> {
	const kindNameFromId = await loadKindNameFromId(grammar);
	const { modelTypes } = await loadNodeModel(grammar);
	return (kindId) => {
		const name = kindNameFromId?.(kindId);
		const modelType = name === undefined ? undefined : modelTypes[name];
		return modelType === 'pattern' || modelType === 'keyword' || modelType === 'punctuation' || modelType === 'enum';
	};
}

export async function loadKindNameFromId(grammar: string): Promise<((id: number) => string | undefined) | undefined> {
	const typesModulePath = TYPES_MODULE_PATHS[grammar];
	if (!typesModulePath) return undefined;
	try {
		const typesModule = await import(new URL(typesModulePath, import.meta.url).pathname);
		const kindNames = typesModule.KIND_DISPLAY_NAMES as ReadonlyMap<number, string> | undefined;
		if (kindNames) {
			return (id: number) => kindNames.get(id);
		}
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

export async function loadCanonicalKindNameFromId(
	grammar: string
): Promise<((id: number) => string | undefined) | undefined> {
	const typesModulePath = TYPES_MODULE_PATHS[grammar];
	if (!typesModulePath) return undefined;
	try {
		const typesModule = await import(new URL(typesModulePath, import.meta.url).pathname);
		const kindNames = typesModule.KIND_NAMES as ReadonlyMap<number, string> | undefined;
		if (!kindNames) return undefined;
		return (id: number) => kindNames.get(id);
	} catch {
		return undefined;
	}
}

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

export async function loadLanguageForGrammar(grammar: string): Promise<{
	Parser: typeof TS.Parser;
	Language: typeof TS.Language;
	lang: TS.Language;
	isOverride: boolean;
}> {
	const { assertGeneratedManifestsClean } = await load('generatedManifest');
	if (grammar === 'rust' || grammar === 'typescript' || grammar === 'python') {
		assertGeneratedManifestsClean([grammar]);
	}
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

export interface NodeToConfigOpts {
	readonly tree?: TreeHandle;
	readonly factoryMap?: Record<string, (...args: unknown[]) => unknown>;
	readonly factoryShapes?: Record<string, FactoryShape>;
	readonly fieldAliasMap?: Record<string, Record<string, string>>;
	readonly factoryFields?: Record<string, readonly string[]>;
	readonly factorySlots?: Record<string, Record<string, FactorySlotMeta>>;
	readonly cstNodeKindHint?: string;
	readonly firstNamedChildKindHint?: string;
	readonly namedChildKindHints?: readonly string[];
	readonly _parentKind?: string;
	readonly _fieldName?: string;
	readonly _depth?: number;
	readonly kindNameFromId?: (id: number) => string | undefined;
	readonly surface?: IrSurface;
}

interface ReadNodeLike {
	readonly $type?: string | number;
	readonly $text?: string;
	readonly $span?: { readonly start: number; readonly end: number };
	readonly $nodeHandle?: number;
	readonly $childIndex?: number;
	readonly $other?: unknown | readonly unknown[];
	readonly $named?: boolean;
	readonly $_trivia?: NodeTrivia;
}

function isAnonTokenPassthrough(c: ReadNodeLike): boolean {
	return c.$named === false;
}

function shouldHaltRecursion(
	depth: number,
	tree: NodeToConfigOpts['tree'],
	factoryMap: NodeToConfigOpts['factoryMap']
): boolean {
	return depth > 64 || !tree || !factoryMap;
}

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

function resolveChild(child: unknown, opts: NodeToConfigOpts): unknown {
	if (child == null) return child;
	if (typeof child === 'string' || typeof child === 'number') return child;
	if (typeof child !== 'object') return child;
	const c = child as ReadNodeLike;
	if (isAnonTokenPassthrough(c)) return child;
	const { tree, factoryMap, fieldAliasMap, _depth = 0, _parentKind, _fieldName } = opts;
	if (shouldHaltRecursion(_depth, tree, factoryMap)) return child;
	const drilled = drillReadNode(c, opts);
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
	if (!factory && kind.startsWith('_')) {
		const strippedKind = kind.slice(1);
		const strippedFactory = factoryMap![strippedKind];
		if (strippedFactory) {
			kind = strippedKind;
			factory = strippedFactory;
		}
	}
	if (!factory) {
		const inner = soleWrappedNode(drilled, opts);
		return inner === undefined ? drilled : resolveChild(inner, { ...opts, _depth: _depth + 1 });
	}
	return buildWithFactory(drilled, kind, factory, { ...opts, _depth: _depth + 1 });
}

function soleWrappedNode(drilled: ReadNodeLike, opts: NodeToConfigOpts): ReadNodeLike | undefined {
	const rec = drilled as unknown as Record<string, unknown>;
	const keys = Object.keys(rec).filter((k) => k.startsWith('_') && rec[k] !== undefined);
	if (keys.length !== 1) return undefined;
	const value = rec[keys[0]!];
	if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined;
	const kind = rawChildKindName(value, opts.kindNameFromId);
	if (kind === undefined) return undefined;
	const has = opts.factoryMap?.[kind] ?? (kind.startsWith('_') ? opts.factoryMap?.[kind.slice(1)] : undefined);
	return has === undefined ? undefined : (value as ReadNodeLike);
}

function readNodeText(node: ReadNodeLike, opts: NodeToConfigOpts): string {
	if (typeof node.$text === 'string') return node.$text;
	const source = opts.tree?.source;
	return node.$span !== undefined && source !== undefined ? sliceSpan(source, node.$span) : '';
}

function carriesOwnContents(c: ReadNodeLike): boolean {
	if (c.$text !== undefined || c.$other !== undefined) return true;
	const rec = c as unknown as Record<string, unknown>;
	return Object.keys(rec).some((k) => k.startsWith('_') || k === '$children');
}

function drillReadNode(c: ReadNodeLike, opts: NodeToConfigOpts): ReadNodeLike {
	const { tree } = opts;
	if (c.$nodeHandle == null || c.$childIndex == null || !tree) return c;
	if (carriesOwnContents(c)) return c;
	try {
		return (
			tree.read ? tree.read(c.$nodeHandle, c.$childIndex) : readNodeFn(tree, c.$nodeHandle, c.$childIndex)
		) as ReadNodeLike;
	} catch {
		return c;
	}
}

const ARM_ROUTE = Symbol('armRoute');
const SPLICED = Symbol('spliced');
const POSITIONAL = Symbol('positional');

interface ArmRoute {
	readonly mount: string;
	readonly args: readonly unknown[] | undefined;
}

function armRouteOf(config: Record<string, unknown>): ArmRoute | undefined {
	return (config as Record<symbol, unknown>)[ARM_ROUTE] as ArmRoute | undefined;
}

function positionalOf(config: Record<string, unknown>): readonly unknown[] | undefined {
	return (config as Record<symbol, unknown>)[POSITIONAL] as readonly unknown[] | undefined;
}

function isSpliced(config: Record<string, unknown>): boolean {
	return (config as Record<symbol, unknown>)[SPLICED] === true;
}

function readValueKind(value: unknown, opts: NodeToConfigOpts): string | undefined {
	if (typeof value === 'number') return opts.kindNameFromId?.(value);
	return rawChildKindName(value, opts.kindNameFromId);
}

function seatForSlotValue(
	parentKind: string | undefined,
	slotName: string,
	value: unknown,
	opts: NodeToConfigOpts
): Seat | undefined {
	const surface = opts.surface;
	if (surface === undefined || parentKind === undefined) return undefined;
	const table = surface.seats[parentKind]?.[slotName] ?? surface.seats[parentKind]?.['*'];
	if (table === undefined) return undefined;
	if (Array.isArray(value)) return Object.values(table).find((seat) => seat.shape === 'elements');
	if (typeof value === 'string') {
		const textArms = Object.values(table).filter(
			(seat) => seat.shape === 'arm' && surface.modelTypes[seat.kind] === 'pattern'
		);
		return textArms.length === 1 ? textArms[0] : undefined;
	}
	const kind = readValueKind(value, opts);
	return kind === undefined ? undefined : table[kind];
}

function elementsSeatOfKind(parentKind: string | undefined, opts: NodeToConfigOpts): Seat | undefined {
	const slots = parentKind === undefined ? undefined : opts.surface?.seats[parentKind];
	if (slots === undefined) return undefined;
	for (const table of Object.values(slots)) {
		const seat = Object.values(table).find((s) => s.shape === 'elements');
		if (seat !== undefined) return seat;
	}
	return undefined;
}

function childOpts(opts: NodeToConfigOpts): NodeToConfigOpts {
	return { ...opts, _depth: (opts._depth ?? 0) + 1 };
}

function projectElements(
	items: readonly unknown[],
	seat: Seat,
	parentKind: string | undefined,
	slotName: string | undefined,
	opts: NodeToConfigOpts
): unknown[] {
	return items.map((item) => {
		if (readValueKind(item, opts) !== seat.kind) {
			return resolveChild(item, memberValueOpts(opts, parentKind, slotName));
		}
		const element = drillReadNode(item as ReadNodeLike, opts);
		return carryElementTrivia(element, nodeToConfig(element, childOpts(opts)));
	});
}

function carryElementTrivia(element: ReadNodeLike, config: Record<string, unknown>): Record<string, unknown> {
	if (element.$_trivia === undefined) return config;
	const built = Object.values(config).filter((v) => v !== null && typeof v === 'object' && !Array.isArray(v));
	if (built.length === 1) carryTrivia(element, built[0]);
	return config;
}

function projectArmSlot(
	seat: Seat,
	parentKind: string,
	slot: SlotModel,
	value: unknown,
	opts: NodeToConfigOpts,
	out: Record<string, unknown>
): void {
	if (seat.mount === undefined) throw new Error(`ir surface: arm seat ${seat.kind} on ${parentKind} has no mount`);
	const key = slotConfigKey(slot);
	const setRoute = (mount: string, args: readonly unknown[] | undefined): void => {
		const existing = armRouteOf(out);
		const composed = existing === undefined ? mount : `${existing.mount}.${mount}`;
		Object.defineProperty(out, ARM_ROUTE, {
			value: { mount: composed, args } satisfies ArmRoute,
			enumerable: false,
			configurable: true
		});
	};
	const modelType = opts.surface?.modelTypes[seat.kind];
	if (typeof value === 'number' || modelType === 'keyword' || modelType === 'punctuation')
		return setRoute(seat.mount, undefined);
	const childShape = opts.factoryShapes?.[seat.kind] ?? 'config';
	if (typeof value === 'string' || modelType === 'pattern' || childShape === 'text') {
		const args = [typeof value === 'string' ? value : readNodeText(drillReadNode(value as ReadNodeLike, opts), opts)];
		out[key] = args;
		return setRoute(seat.mount, args);
	}
	const child = drillReadNode(value as ReadNodeLike, opts);
	const inner = childOpts(opts);
	const config = nodeToConfig(child, inner);
	const nested = armRouteOf(config);
	const mount = nested === undefined ? seat.mount : `${seat.mount}.${nested.mount}`;
	const parentShape = opts.factoryShapes?.[parentKind] ?? 'config';
	if (parentShape === 'config' && childShape === 'config') {
		if (seat.seated === true) out[key] = config;
		else Object.assign(out, config);
		return setRoute(mount, undefined);
	}
	const args = factoryArgs(seat.kind, childShape, config, child, inner);
	if (seat.seated === true && nested === undefined) {
		if (args.length !== 1) {
			throw new Error(
				`ir surface: seated arm ${seat.kind} on ${parentKind} takes ${args.length} arguments; a seated arm takes one`
			);
		}
		out[key] = args[0];
	} else {
		out[key] = args;
	}
	setRoute(mount, args);
}

function projectSeatedSlot(
	seat: Seat,
	parentKind: string,
	slot: SlotModel,
	value: unknown,
	opts: NodeToConfigOpts,
	out: Record<string, unknown>
): void {
	const key = slotConfigKey(slot);
	switch (seat.shape) {
		case 'splice': {
			const group = nodeToConfig(drillReadNode(value as ReadNodeLike, opts), childOpts(opts));
			const nested = armRouteOf(group);
			if (nested !== undefined) {
				throw new Error(
					`ir surface: ${seat.kind}.${nested.mount} is an arm route inside a group spliced on ${parentKind}; the splice has no spelling for it`
				);
			}
			Object.assign(out, group);
			Object.defineProperty(out, SPLICED, { value: true, enumerable: false });
			return;
		}
		case 'elements':
			out[key] = projectElements(childEntries(value), seat, parentKind, slot.name, opts);
			return;
		case 'tuple': {
			const child = drillReadNode(value as ReadNodeLike, opts);
			const inner = childOpts(opts);
			const childShape = opts.factoryShapes?.[seat.kind] ?? 'config';
			const args = factoryArgs(seat.kind, childShape, nodeToConfig(child, inner), child, inner);
			out[key] = args;
			if ((opts.factoryShapes?.[parentKind] ?? 'config') !== 'config') {
				Object.defineProperty(out, POSITIONAL, { value: args, enumerable: false });
			}
			return;
		}
		case 'arm':
			projectArmSlot(seat, parentKind, slot, value, opts, out);
			return;
	}
}

function splitRegisteredSlots(
	kind: string,
	config: Record<string, unknown>,
	factorySlots: NodeToConfigOpts['factorySlots']
): { readonly base: Record<string, unknown>; readonly registered: Record<string, unknown> | undefined } {
	const slotMeta = factorySlots?.[kind];
	if (slotMeta === undefined) return { base: config, registered: undefined };
	const registeredKeys = Object.keys(config).filter((key) => slotMeta[key]?.registered === true);
	if (registeredKeys.length === 0) return { base: config, registered: undefined };
	const base: Record<string, unknown> = { ...config };
	const registered: Record<string, unknown> = {};
	for (const key of registeredKeys) {
		registered[key] = base[key];
		delete base[key];
	}
	return { base, registered };
}

function factoryArgs(
	kind: string,
	shape: FactoryShape,
	config: Record<string, unknown>,
	referenceData: ReadNodeLike,
	opts: NodeToConfigOpts
): readonly unknown[] {
	const route = armRouteOf(config);
	if (shape === 'config') {
		const { base, registered } = splitRegisteredSlots(kind, config, opts.factorySlots);
		const listOptions = separatedListFactoryOptions(referenceData);
		const options = {
			...(listOptions?.separator !== undefined && !('separator' in base) ? { separator: listOptions.separator } : {}),
			...(listOptions?.delimiter !== undefined && !('delimiter' in base) ? { delimiter: listOptions.delimiter } : {}),
			...registered
		};
		return Object.keys(options).length > 0 ? [base, options] : [base];
	}
	if (route !== undefined) return route.args ?? [];
	const positional = positionalOf(config);
	if (positional !== undefined) return positional;
	if (shape === 'direct' || shape === 'forwarded') {
		const { base, registered } = splitRegisteredSlots(kind, config, opts.factorySlots);
		const value = isSpliced(base) ? base : directFactoryValue(kind, base, opts.factorySlots, opts.factoryFields);
		return registered === undefined ? [value] : [value, registered];
	}
	const elements = getChildFactoryArgs(kind, config, opts.factorySlots, opts.factoryFields);
	if (shape === 'elements') {
		const options = separatedListFactoryOptions(referenceData);
		return options !== undefined ? [options, ...elements] : elements;
	}
	return elements;
}

function walkMount(entry: IrEntry, mount: string): IrEntry | undefined {
	let at: IrEntry | undefined = entry;
	for (const segment of mount.split('.')) {
		if (at === undefined) return undefined;
		at = at[segment] as IrEntry | undefined;
	}
	return at;
}

function irStrictFor(
	kind: string,
	config: Record<string, unknown> | undefined,
	opts: NodeToConfigOpts
): ((...args: unknown[]) => unknown) | undefined {
	const entry = opts.surface?.entries[kind];
	if (entry === undefined) return undefined;
	const route = config === undefined ? undefined : armRouteOf(config);
	const target = route === undefined ? entry : walkMount(entry, route.mount);
	const strict = target?.strict;
	if (typeof strict === 'function') return strict;
	if (typeof target === 'function') return target as (...args: unknown[]) => unknown;
	throw new Error(`ir surface: ${kind}${route === undefined ? '' : `.${route.mount}`}.strict is not a function`);
}

function buildWithFactory(
	referenceData: ReadNodeLike,
	kind: string,
	factory: (...args: unknown[]) => unknown,
	opts: NodeToConfigOpts
): unknown {
	const shape = opts.factoryShapes?.[kind] ?? 'config';
	if (shape === 'text') {
		return carryTrivia(
			referenceData,
			(irStrictFor(kind, undefined, opts) ?? factory)(readNodeText(referenceData, opts))
		);
	}
	const config = nodeToConfig(referenceData, opts);
	const built = (irStrictFor(kind, config, opts) ?? factory)(...factoryArgs(kind, shape, config, referenceData, opts));
	return carryTrivia(referenceData, built);
}

function carryTrivia(source: ReadNodeLike, built: unknown): unknown {
	const trivia = source.$_trivia;
	if (trivia === undefined || built === null || typeof built !== 'object') return built;
	if (trivia.leading === undefined && trivia.trailing === undefined) return built;
	(built as Record<string, unknown>).$_trivia = trivia;
	return built;
}

function directFactoryValue(
	kind: string,
	config: unknown,
	factorySlots: NodeToConfigOpts['factorySlots'],
	factoryFields: NodeToConfigOpts['factoryFields']
): unknown {
	const slotNames = Object.keys(factorySlots?.[kind] ?? {});
	const rawName = slotNames.length === 1 ? slotNames[0] : factoryFields?.[kind]?.[0];
	const camelName = rawName?.replace(/_([a-z])/g, (_m: string, c: string) => c.toUpperCase());
	const record = config as Record<string, unknown>;
	if (camelName !== undefined) return record[camelName];
	return getChildFactoryArgs(kind, record, factorySlots, factoryFields)[0];
}

function isIdentifierShapedFieldKey(key: string): boolean {
	return /^[a-zA-Z_][\w]*$/.test(key);
}

function shouldPromoteOrphanChildren(
	declaredFields: readonly string[] | undefined,
	populatedOut: Record<string, unknown>,
	namedChildren: readonly unknown[]
): boolean {
	if (!declaredFields || namedChildren.length === 0) return false;
	if (namedChildren.length > declaredFields.length) return false;
	const noFieldMatched = declaredFields.every((name) => {
		const camel = snakeToCamel(name);
		return populatedOut[camel] === undefined;
	});
	return noFieldMatched;
}

function slotOrigin(slot: SlotModel): SlotOrigin {
	return readFacts<{ origin: SlotOrigin }>(slot.metadata).origin;
}

function slotConfigKey(slot: SlotModel): string {
	return slotOrigin(slot) === 'kind' ? slot.name : snakeToCamel(slot.name);
}

function memberValueOpts(
	opts: NodeToConfigOpts,
	parentKind: string | undefined,
	fieldName: string | undefined
): NodeToConfigOpts {
	return {
		...opts,
		_parentKind: parentKind,
		_fieldName: fieldName,
		firstNamedChildKindHint: undefined,
		namedChildKindHints: undefined
	};
}

function resolveMemberValue(value: readonly unknown[] | unknown, childOpts: NodeToConfigOpts): unknown {
	return Array.isArray(value) ? value.map((item) => resolveChild(item, childOpts)) : resolveChild(value, childOpts);
}

function lookupFactorySlotMeta(opts: NodeToConfigOpts, slot: SlotModel): FactorySlotMeta | undefined {
	const parentKind = opts._parentKind;
	return parentKind ? opts.factorySlots?.[parentKind]?.[slot.name] : undefined;
}

function slotModelArityFromMeta(slotMeta: FactorySlotMeta | undefined, unnamed: boolean): 'one' | 'many' {
	if (!slotMeta) return unnamed ? 'many' : 'one';
	if (unnamed && slotMeta.slotCount > 1) return 'many';
	return slotMeta.multiple ? 'many' : 'one';
}

function createNamedConfigSlotModel(
	parentKind: string | undefined,
	name: string,
	factorySlots: NodeToConfigOpts['factorySlots']
): SlotModel {
	const slotMeta = parentKind ? factorySlots?.[parentKind]?.[name] : undefined;
	return createNamedSlotModel(name, slotModelArityFromMeta(slotMeta, false));
}

function createChildrenConfigSlotModel(
	parentKind: string | undefined,
	factorySlots: NodeToConfigOpts['factorySlots']
): SlotModel {
	const slotMeta = parentKind ? factorySlots?.[parentKind]?.children : undefined;
	return createUnnamedChildrenSlotModel(slotModelArityFromMeta(slotMeta, true));
}

function declaredSlotNameForKey(parentKind: string | undefined, key: string, opts: NodeToConfigOpts): string {
	const slots = parentKind ? opts.factorySlots?.[parentKind] : undefined;
	if (!slots || key in slots) return key;
	const wireKey = `_${key}`;
	for (const [name, meta] of Object.entries(slots)) {
		if (meta.wireKeys?.includes(wireKey)) return name;
	}
	return key;
}

function hasDeclaredFactorySlot(parentKind: string | undefined, name: string, opts: NodeToConfigOpts): boolean {
	if (!parentKind) return false;
	if (opts.factorySlots?.[parentKind]?.[name] !== undefined) return true;
	return opts.factoryFields?.[parentKind]?.includes(name) ?? false;
}

function shouldNormalizeConfigSlotAsMany(slot: SlotModel, slotMeta: FactorySlotMeta | undefined): boolean {
	return slotModelArityFromMeta(slotMeta, slotOrigin(slot) === 'kind') === 'many';
}

function rawChildKindName(
	value: unknown,
	kindNameFromId: ((id: number) => string | undefined) | undefined
): string | undefined {
	if (value == null || typeof value !== 'object') return undefined;
	const rawType = (value as ReadNodeLike).$type;
	if (typeof rawType === 'string') return rawType;
	if (typeof rawType === 'number') return kindNameFromId?.(rawType);
	return undefined;
}

function narrowSingularUnnamedChildrenValue(
	slot: SlotModel,
	value: readonly unknown[] | unknown,
	childOpts: NodeToConfigOpts,
	slotMeta: FactorySlotMeta | undefined
): readonly unknown[] | unknown {
	if (
		slotOrigin(slot) !== 'kind' ||
		slot.name !== 'children' ||
		!slotMeta ||
		slotMeta.multiple ||
		slotMeta.slotCount !== 1
	) {
		return value;
	}
	if (!Array.isArray(value) || value.length <= 1) return value;
	const hintedKind =
		childOpts.namedChildKindHints?.length === 1 ? childOpts.namedChildKindHints[0] : childOpts.firstNamedChildKindHint;
	if (hintedKind) {
		const hinted = value.filter((item) => rawChildKindName(item, childOpts.kindNameFromId) === hintedKind);
		if (hinted.length === 1) return hinted[0]!;
	}
	const named = value.filter(
		(item): item is ReadNodeLike => item != null && typeof item === 'object' && (item as ReadNodeLike).$named !== false
	);
	if (named.length === 1) return named[0];
	return value;
}

function normalizeConfigSlotValue(
	slot: SlotModel,
	value: readonly unknown[] | unknown,
	childOpts: NodeToConfigOpts,
	slotMeta: FactorySlotMeta | undefined
): unknown {
	const narrowed = narrowSingularUnnamedChildrenValue(slot, value, childOpts, slotMeta);
	const resolved = resolveMemberValue(narrowed, childOpts);
	if (shouldNormalizeConfigSlotAsMany(slot, slotMeta)) {
		const items: readonly unknown[] = Array.isArray(resolved) ? resolved : resolved == null ? [] : [resolved];
		if (slotMeta?.nonEmpty && items.length === 0) {
			throw new TypeError(`nodeToConfig: repeated slot ${JSON.stringify(slot.name)} requires at least one value`);
		}
		return items;
	}
	if (Array.isArray(resolved)) {
		if (resolved.length === 0) {
			if (slotMeta?.required) {
				throw new TypeError(`nodeToConfig: singular slot ${JSON.stringify(slot.name)} requires one value`);
			}
			return undefined;
		}
		if (resolved.length !== 1) {
			throw new TypeError(
				`nodeToConfig: singular slot ${JSON.stringify(slot.name)} received ${resolved.length} values`
			);
		}
		return resolved[0];
	}
	if (resolved == null && slotMeta?.required) {
		throw new TypeError(`nodeToConfig: singular slot ${JSON.stringify(slot.name)} requires one value`);
	}
	return resolved;
}

export function getChildFactoryArgs(
	kind: string,
	childConfig: Record<string, unknown>,
	factorySlots: NodeToConfigOpts['factorySlots'],
	factoryFields?: Record<string, readonly string[]>
): readonly unknown[] {
	const declaredField = factoryFields?.[kind]?.[0];
	const configKey = declaredField ? snakeToCamel(declaredField) : 'children';
	const childrenValue = childConfig[configKey];
	const childrenMeta = factorySlots?.[kind]?.[declaredField ?? 'children'];
	if (slotModelArityFromMeta(childrenMeta, true) === 'one') {
		return childrenValue == null ? [] : [childrenValue];
	}
	if (Array.isArray(childrenValue)) return childrenValue;
	return childrenValue == null ? [] : [childrenValue];
}

function assignSlotToConfig(
	slot: SlotModel,
	value: readonly unknown[] | unknown,
	childOpts: NodeToConfigOpts,
	out: Record<string, unknown>
): void {
	const normalized = normalizeConfigSlotValue(slot, value, childOpts, lookupFactorySlotMeta(childOpts, slot));
	if (normalized !== undefined) {
		out[slotConfigKey(slot)] = normalized;
	}
}

function isAnonymousPromotableField(name: string): boolean {
	return name === 'semicolon' || name === 'opening' || name === 'closing';
}

function getMissingDeclaredFields(
	declaredFields: readonly string[] | undefined,
	out: Record<string, unknown>
): string[] {
	if (!declaredFields) return [];
	return declaredFields.filter((name) => {
		const camel = snakeToCamel(name);
		return out[camel] === undefined;
	});
}

function isAnonymousTokenNode(value: unknown): value is ReadNodeLike {
	return value != null && typeof value === 'object' && (value as ReadNodeLike).$named === false;
}

function filterStructuralChildren(children: unknown | readonly unknown[] | undefined): readonly unknown[] {
	return childEntries(children).filter(
		(child) => child != null && typeof child === 'object' && !isAnonymousTokenNode(child)
	);
}

function shouldOmitResidualScalarChildren(
	parentKind: string | undefined,
	structuralChildren: readonly unknown[],
	opts: NodeToConfigOpts,
	out: Record<string, unknown>
): boolean {
	if (!parentKind || structuralChildren.length === 0) return false;
	if (Object.keys(out).length === 0) return false;
	const slotMeta = opts.factorySlots?.[parentKind]?.children;
	if (!slotMeta || slotMeta.required || slotMeta.multiple) return false;
	return structuralChildren.every((child) => child == null || typeof child !== 'object');
}

function isOpeningDelimiter(text: string | undefined): boolean {
	return text === '{' || text === '{|' || text === '[' || text === '(' || text === '<';
}

function isClosingDelimiter(text: string | undefined): boolean {
	return text === '}' || text === '|}' || text === ']' || text === ')' || text === '>';
}

function promoteAnonymousTokenFields(
	declaredFields: readonly string[] | undefined,
	namedSlotEntries: readonly [string, unknown][],
	opts: NodeToConfigOpts,
	parentKind: string | undefined,
	out: Record<string, unknown>
): void {
	if (!declaredFields || !parentKind) return;
	const missing = new Set(getMissingDeclaredFields(declaredFields, out));
	if (missing.size === 0) return;
	const anonymousEntries = namedSlotEntries.filter(
		([key, value]) => !isIdentifierShapedFieldKey(key) && isAnonymousTokenNode(value)
	);
	const used = new Set<number>();
	const assign = (fieldName: string, entryIndex: number): void => {
		const entry = anonymousEntries[entryIndex]?.[1];
		if (!entry) return;
		assignSlotToConfig(
			createNamedSlotModel(fieldName, 'one'),
			entry,
			memberValueOpts(opts, parentKind, fieldName),
			out
		);
		missing.delete(fieldName);
		used.add(entryIndex);
	};

	if (missing.has('semicolon')) {
		const semicolonIndex = anonymousEntries.findIndex(([, value]) => (value as ReadNodeLike).$text === ';');
		if (semicolonIndex >= 0) assign('semicolon', semicolonIndex);
	}
	if (missing.has('opening')) {
		const openingIndex = anonymousEntries.findIndex(
			([, value], index) => !used.has(index) && isOpeningDelimiter((value as ReadNodeLike).$text)
		);
		if (openingIndex >= 0) assign('opening', openingIndex);
	}
	if (missing.has('closing')) {
		const closingIndex = anonymousEntries.findLastIndex(
			([, value], index) => !used.has(index) && isClosingDelimiter((value as ReadNodeLike).$text)
		);
		if (closingIndex >= 0) assign('closing', closingIndex);
	}
}

function promoteNamedChildrenToMissingFields(
	declaredFields: readonly string[] | undefined,
	parentKind: string | undefined,
	namedChildren: readonly unknown[],
	opts: NodeToConfigOpts,
	out: Record<string, unknown>
): boolean {
	if (!declaredFields || !parentKind || namedChildren.length === 0) return false;
	const missing = getMissingDeclaredFields(declaredFields, out).filter(
		(name) => name !== 'opening' && name !== 'closing' && name !== 'semicolon'
	);
	if (missing.length === 0) return false;
	if (missing.length === 1) {
		const name = missing[0]!;
		const slot = createNamedConfigSlotModel(parentKind, name, opts.factorySlots);
		if (slot.arity === 'many') {
			assignSlotToConfig(slot, namedChildren, memberValueOpts(opts, parentKind, name), out);
			return true;
		}
		if (namedChildren.length === 1) {
			assignSlotToConfig(slot, namedChildren[0]!, memberValueOpts(opts, parentKind, name), out);
			return true;
		}
		return false;
	}
	if (namedChildren.length > missing.length) return false;
	namedChildren.forEach((child, index) => {
		const name = missing[index]!;
		assignSlotToConfig(createNamedSlotModel(name, 'one'), child, memberValueOpts(opts, parentKind, name), out);
	});
	return true;
}

function assignPositionPromotedChildren(
	declaredFields: readonly string[],
	parentKind: string,
	namedChildren: readonly unknown[],
	opts: NodeToConfigOpts,
	out: Record<string, unknown>
): void {
	namedChildren.forEach((child, i) => {
		const name = declaredFields[i]!;
		assignSlotToConfig(createNamedSlotModel(name, 'one'), child, memberValueOpts(opts, parentKind, name), out);
	});
}

function promoteAnonymousChildrenToMissingFields(
	declaredFields: readonly string[] | undefined,
	parentKind: string | undefined,
	children: unknown | readonly unknown[] | undefined,
	opts: NodeToConfigOpts,
	out: Record<string, unknown>
): boolean {
	if (!declaredFields || !parentKind) return false;
	const anonymousChildren = childEntries(children).filter(
		(child): child is ReadNodeLike =>
			child != null && typeof child === 'object' && (child as ReadNodeLike).$named === false
	);
	if (anonymousChildren.length === 0) return false;
	const missingFields = declaredFields.filter((name) => {
		const camel = name.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase());
		return out[camel] === undefined && isAnonymousPromotableField(name);
	});
	if (missingFields.length === 0) return false;
	if (anonymousChildren.length !== missingFields.length) return false;
	anonymousChildren.forEach((child, index) => {
		const name = missingFields[index]!;
		assignSlotToConfig(createNamedSlotModel(name, 'one'), child, memberValueOpts(opts, parentKind, name), out);
	});
	return true;
}

export function nodeToConfig(data: ReadNodeLike, opts: NodeToConfigOpts = {}): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	const parentKind =
		data.$type !== undefined
			? typeof data.$type === 'number'
				? (opts.kindNameFromId?.(data.$type) ?? String(data.$type))
				: data.$type
			: undefined;
	const rec = data as unknown as Record<string, unknown>;
	const namedSlotEntries: [string, unknown][] = [];
	for (const key of Object.keys(rec)) {
		if (key.startsWith('_')) {
			namedSlotEntries.push([key.slice(1), rec[key]]);
		}
	}
	for (const [key, v] of namedSlotEntries) {
		if (v === undefined) continue;
		const k = declaredSlotNameForKey(parentKind, key, opts);
		if (!isIdentifierShapedFieldKey(k)) continue;
		if (!hasDeclaredFactorySlot(parentKind, k, opts)) continue;
		const slot = createNamedConfigSlotModel(parentKind, k, opts.factorySlots);
		const seat = seatForSlotValue(parentKind, k, v, opts);
		if (seat !== undefined && parentKind !== undefined) {
			projectSeatedSlot(seat, parentKind, slot, v, opts, out);
			continue;
		}
		assignSlotToConfig(slot, v, memberValueOpts(opts, parentKind, k), out);
	}
	promoteAnonymousTokenFields(
		parentKind ? opts.factoryFields?.[parentKind] : undefined,
		namedSlotEntries,
		opts,
		parentKind,
		out
	);
	if (data.$other) {
		const declaredFields = parentKind ? opts.factoryFields?.[parentKind] : undefined;
		const structuralChildren = filterStructuralChildren(data.$other);
		const namedChildren = structuralChildren.filter(
			(c) => c != null && typeof c === 'object' && (c as { $named?: boolean }).$named !== false
		);
		const childrenOpts = memberValueOpts(opts, parentKind, undefined);
		if (promoteNamedChildrenToMissingFields(declaredFields, parentKind, namedChildren, opts, out)) {
		} else if (shouldPromoteOrphanChildren(declaredFields, out, namedChildren)) {
			assignPositionPromotedChildren(declaredFields!, parentKind!, namedChildren, opts, out);
		} else if (promoteAnonymousChildrenToMissingFields(declaredFields, parentKind, data.$other, opts, out)) {
		} else if (shouldOmitResidualScalarChildren(parentKind, structuralChildren, opts, out)) {
		} else {
			const elementsSeat = elementsSeatOfKind(parentKind, opts);
			assignSlotToConfig(
				createChildrenConfigSlotModel(parentKind, opts.factorySlots),
				elementsSeat === undefined
					? structuralChildren
					: projectElements(structuralChildren, elementsSeat, parentKind, undefined, opts),
				childrenOpts,
				out
			);
		}
	}
	return out;
}

export function emitValidatorMetrics(): void {
	if (!metricsEnabled) return;
	const backend: 'ts' | 'native' = process.env.SITTIR_BACKEND === 'native' ? 'native' : 'ts';
	dumpMetrics(backend);
}

export function dedupeMismatchesByContainment<T extends { entry?: string; start: number; end: number }>(
	mismatches: readonly T[]
): T[] {
	return mismatches.filter(
		(m, i) =>
			!mismatches.some(
				(n, j) =>
					j !== i && n.entry === m.entry && n.start >= m.start && n.end <= m.end && (n.start > m.start || n.end < m.end)
			)
	);
}

export function separatedListFactoryOptions(data: unknown): { separator?: number; delimiter?: number } | undefined {
	const rec = (data ?? {}) as Record<string, unknown>;
	const delimiter = typeof rec['_delimiter'] === 'number' ? rec['_delimiter'] : undefined;
	const separator = typeof rec['_separator'] === 'number' ? rec['_separator'] : undefined;
	const options: { separator?: number; delimiter?: number } = {};
	if (separator !== undefined) options.separator = separator;
	if (delimiter !== undefined) options.delimiter = delimiter;
	return Object.keys(options).length > 0 ? options : undefined;
}

export interface FactoryDispatchArtifacts {
	readonly factoryMap: Record<string, (...args: any[]) => unknown>;
	readonly factoryShapes: Record<string, FactoryShape>;
	readonly fieldAliasMap: Record<string, Record<string, string>>;
	readonly factoryFields: Record<string, readonly string[]>;
	readonly factorySlots: Record<string, Record<string, FactorySlotMeta>>;
	readonly surface?: IrSurface;
}

export interface FactoryDispatchOpts {
	readonly cstNodeKindHint?: string;
	readonly firstNamedChildKindHint?: string;
	readonly namedChildKindHints?: readonly string[];
	readonly kindNameFromId?: (id: number) => string | undefined;
	readonly tree?: unknown;
}

export function buildFactoryNodeFromReference(
	referenceData: ReadNodeLike,
	kind: string,
	artifacts: FactoryDispatchArtifacts,
	opts: FactoryDispatchOpts = {}
): unknown | null {
	const { factoryMap, factoryShapes, fieldAliasMap, factoryFields, factorySlots, surface } = artifacts;
	const factory = factoryMap[kind];
	if (!factory) return null;
	const configOpts = {
		factoryMap,
		factoryShapes,
		fieldAliasMap,
		factoryFields,
		factorySlots,
		surface,
		cstNodeKindHint: opts.cstNodeKindHint,
		firstNamedChildKindHint: opts.firstNamedChildKindHint,
		namedChildKindHints: opts.namedChildKindHints,
		kindNameFromId: opts.kindNameFromId,
		tree: opts.tree
	} as NodeToConfigOpts;
	return buildWithFactory(referenceData, kind, factory, configOpts);
}
