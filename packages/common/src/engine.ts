import { writeFileSync } from 'node:fs';
import type {
	AnyUntypedNode,
	ByteSpan,
	EngineDiagnostics,
	IndentOption,
	LanguageAPI,
	NativeEngineOptions,
	NativeLanguageEngine,
	NativeParseResult,
	ParsedRead,
	ParsedRoot,
	ParseOptions,
	Rendered
} from '@sittir/types';
import { decodeTree, readObject, type ChunkWords, type RecordReader, type Siblings, type TreeHandle, type TriviaSideName } from './read.ts';
import { holdReadTree, rootEdges, sourceHandleOf, toNodeData, type KindView } from './node-data.ts';
import { mintTreeToken, registerTree } from './tree-token.ts';
import type { RecordPosition } from './handle.ts';
import type { DescendantBatch } from './query.ts';
import { cellFormatOf, chunkOf, wordOf, type CellFormat } from './record-cell.ts';
import { recordOf, recordStub } from './record-view.ts';
import { readEntries, readUnits, type BuiltRecords, type WritableWords } from './built-arena.ts';
import { builtRefOf } from './built-ref.ts';
import { nodeStorageOf } from './engine-scope.ts';
import { leafWireSides } from './utils.ts';

/** The options object a grammar package types as its `Options`. */
export type RenderOptionValues = Readonly<Record<string, unknown>>;

export interface RenderOptions<O extends object = RenderOptionValues> {
	/** Per-call options, resolved over the engine's own. */
	readonly options?: O;
}

export function createRenderHandle(renderText: () => string, saveImpl?: (path: string) => boolean): Rendered {
	let cached: string | undefined;
	let disposed = false;
	function live(): void {
		if (disposed) throw new Error('rendered text disposed');
	}
	function getText(): string {
		live();
		if (cached === undefined) cached = renderText();
		return cached;
	}
	return {
		save(path: string): void {
			live();
			if (saveImpl?.(path) === true) return;
			writeFileSync(path, getText(), 'utf8');
		},
		toString(): string {
			return getText();
		},
		print(): string {
			const text = getText();
			process.stdout.write(text);
			return text;
		},
		[Symbol.dispose](): void {
			disposed = true;
			cached = undefined;
		}
	};
}

function renderTreeOf(node: object): number | undefined {
	const handle = sourceHandleOf(node);
	return handle === undefined ? undefined : decodeTree(handle);
}

/** The level count a read takes: one by default. */
function depthOf(options: ParseOptions | undefined): number {
	return options?.depth ?? 1;
}

/**
 * A run of whitespace between two tokens or entries that a side takes, by its bytes, the node and
 * side that take it, and the line breaks the tree's baseline writes there, absent where nothing the
 * baseline wrote is anchored.
 */
export interface StoredLayout {
	readonly deviations: number;
	readonly slots: number;
	readonly separators: number;
}

/** The work a tree's layout reads have done so far (`NativeEngineLike.layoutWork`). */
export interface LayoutWork {
	readonly regionNodes: number;
	readonly siblingItems: number;
}

export interface BaselineRun {
	readonly start: number;
	readonly end: number;
	readonly index: number;
	readonly side: TriviaSideName;
	readonly breaks?: number;
	readonly spaces?: number;
	readonly tabs?: number;
}

export interface NativeEngineLike<TNode = unknown> {
	/** The handle of the engine's state its module's engine functions take. */
	readonly handle: EngineHandle;
	/**
	 * Parse `source` and keep its tree.
	 *
	 * @returns JSON `{ treeId, options, errors }`: the id {@link read} and `disposeTree` take, the
	 *   tree's layer of the render options (`NativeParseResult.options`), and the parse's error regions.
	 */
	parse(source: string): string;
	/**
	 * Read the node at descendant `index` of tree `treeId` into its native node, `depth` levels down
	 * (one when absent, `Infinity` for every level); index 0 is the root.
	 *
	 * @throws when the tree is not live, `index` is past its last node, or the grammar's model has no
	 *   route for a child, naming the kind, the child and the index.
	 */
	read(treeId: number, index: number, depth?: number): TNode;
	/**
	 * A snapshot of the node at descendant `index` of tree `treeId`: the node read at every depth into
	 * plain data that names no tree, each node with its span (`$_layout.span`) measured from the start of
	 * the native node that holds it, each placed extra with its text, and the node itself measured from the
	 * byte `holderByte`, or from its own start when absent.
	 *
	 * @throws as {@link read} does.
	 */
	snapshot(treeId: number, index: number, holderByte?: number | null): TNode;
	/**
	 * The entries of `side` of the node at descendant `index` of tree `treeId`: the ones a write gave it,
	 * else the ones the tree's trivia table assigns it. An extra is its coordinate, an `ERROR` its kind
	 * and source text, and a run of line layout its whitespace member.
	 *
	 * @throws when the tree is not live, `index` is past its last node, or `side` is none of the three.
	 */
	triviaSide(treeId: number, index: number, side: TriviaSideName): unknown[];
	/**
	 * Replaces `side` of the node at descendant `index` of tree `treeId` with `entries`.
	 *
	 * @throws as {@link triviaSide} does.
	 */
	writeTriviaSide(treeId: number, index: number, side: TriviaSideName, entries: readonly unknown[]): void;
	/**
	 * The sides of the unit children of the node at descendant `index` of tree `treeId`, which their
	 * slots store as bare kinds: each `{ slot, item, leading?, trailing?, inner? }`, by its slot's
	 * wire key and its item in that slot.
	 *
	 * @throws as {@link triviaSide} does.
	 */
	unitSides(treeId: number, index: number): unknown[];
	/**
	 * The stored layout of each list slot of the node at descendant `index` of tree `treeId` that
	 * stores any: each `{ slot, before?, after?, separator? }`, by its slot's wire key.
	 *
	 * @throws as {@link triviaSide} does.
	 */
	slotLayouts(treeId: number, index: number): unknown[];
	/**
	 * The separator the list at descendant `index` of tree `treeId` writes between its items, as a
	 * grammar id: the one its source spells where its slot stores one, else the one the read-time
	 * options render; `null` for a node that is no list.
	 *
	 * @throws as {@link triviaSide} does.
	 */
	slotSeparator(treeId: number, index: number): number | null;
	/**
	 * The separator before the node at descendant `index` of tree `treeId` as an item of its parent's
	 * list slot, as a grammar id, where its source spells another than the one the slot renders.
	 *
	 * @throws as {@link triviaSide} does.
	 */
	separatorBefore(treeId: number, index: number): number | null;
	/**
	 * Whether a write replaced a side of a node under the node at descendant `index` of tree `treeId`:
	 * of a descendant or of the node's own `inner`, and of its own leading and trailing too when
	 * `ownSides` is set.
	 *
	 * @throws when the tree is not live or `index` is past its last node.
	 */
	editedWithin(treeId: number, index: number, ownSides: boolean): boolean;
	/**
	 * Whether the node at descendant `index` of tree `treeId` is empty: no child of it has width.
	 *
	 * @throws when the tree is not live or `index` is past its last node.
	 */
	isEmpty(treeId: number, index: number): boolean;
	/**
	 * The text `span` covers in the source of tree `treeId`: one string of that span's characters, so the source itself never crosses.
	 *
	 * @throws when the tree is not live, or `span` is not a span of its source: past its end, reversed, or splitting a character.
	 */
	text(treeId: number, span: ByteSpan): string;
	/** The address of the record of the node at `index`, read `depth` levels down, `null` for a node with none. Present when the addon carries the record codec. */
	readRecord?(treeId: number, index: number, depth?: number): number | null;
	/** Materializes parsed records to `depth` (default one, Infinity for all), including children of cached parents. Returns only an address; chunk copies are requested separately. Present when the addon carries the record codec. */
	hydrateRecord?(treeId: number, index: number, depth?: number): number | null;
	/** JSON pairs of coordinates and native record addresses for the hydrated typed subtree, including nested content but no node fields or words. */
	recordCandidates?(treeId: number, index: number): string;
	/** Chunk `n` of the tree's arena over its native memory, every word of it, with no copy; disposing the tree detaches it. Present when the addon carries the record codec. */
	chunk?(treeId: number, n: number): ChunkWords;
	/** The address of the record the parsed cell at `word`, item `item`, of the record at `holder` names: on the first read through it, written `depth` levels down and the cell rewritten to name it. Present when the addon carries the record codec. */
	readCell?(treeId: number, holder: number, word: number, item: number, depth?: number): number;
	/** A new zeroed chunk of `length` words of the engine's built arena, over its native memory, its number, and its meta, where its entries' counts are kept. Present when the addon carries the record codec. */
	builtWords?(length: number): { chunk: number; data: WritableWords; meta: Uint8Array; freed: number[] };
	/** A new zeroed chunk of `length` bytes of the engine's built arena's strings, over its native memory, its number, and its meta, its cell count. Present when the addon carries the record codec. */
	builtBytes?(length: number): { chunk: number; data: Uint8Array; meta: Uint8Array; freed: number[] };
	/** One more count of the built entry at `address`, whose count saturated. Present when the addon carries the record codec. */
	builtBump?(address: number): void;
	/** Releases a count of the built entry at `address` of form `held`, the count its builder's handle holds when `owned`; answers the trees released link and side records named. Present when the addon carries the record codec. */
	releaseBuilt?(address: number, held: number, owned: boolean): number[];
	/** The bytes the built arena's chunks take, and of them its counts'. Present when the addon carries the record codec. */
	builtMemory?(): { chunks: number; counts: number };
	/** Refuses, by name, a runtime that does not allow external array buffers. Present when the addon carries the record codec. */
	externalBuffers?(): void;
	/** The kind and subtree end, as `[kind, end]`, a read of tree `treeId` names the node at `index` by. Present when the addon carries the record codec. */
	coordinate?(treeId: number, index: number): number[];
	/** The record at `address` rendered as a render root whose `leading` and `trailing` edges have no neighbour. Present when the addon carries the record codec. */
	renderRecord?(treeId: number, address: number, leading: boolean, trailing: boolean, options?: object): string;
	renderBuilt?(owner: object, address: number, leading: boolean, trailing: boolean, treeId?: number, options?: object): string;
	renderBuiltLeaf?(
		owner: object,
		kind: number,
		entry: number,
		sides: object | null,
		leading: boolean,
		trailing: boolean,
		options?: object
	): string;
	builtTriviaSide?(address: number, side: TriviaSideName): unknown[] | null;
	writeBuiltTriviaSide?(address: number, side: TriviaSideName, entries: readonly unknown[]): void;
	builtUnitSides?(address: number): unknown[];
	writeBuiltUnitSides?(address: number, units: readonly unknown[]): void;
	writeBuiltLeafSide?(sites: readonly number[], side: TriviaSideName, entries: readonly unknown[]): void;
	builtLeafSide?(holder: number, word: number, item: number, side: TriviaSideName): unknown[] | null;
	copyBuiltSites?(from: number, to: number, skip: readonly number[]): void;
	/** Renders a parsed candidate from its native record, or its recordless coordinate, excluding its outer trivia. */
	renderCandidate?(treeId: number, index: number, options?: object): string;
	/**
	 * The siblings that hold sides beside the node at descendant `index` of tree `treeId`, as JSON
	 * `Siblings`.
	 *
	 * @throws when the tree is not live or `index` is past its last node.
	 */
	siblings(treeId: number, index: number): string;
	/**
	 * Every run of whitespace a side of tree `treeId` takes, each with the line breaks the options in
	 * effect when the tree was read write at that gap: read from the record of the run's region, or
	 * from the record of the whole tree when `whole`. A diagnostic.
	 *
	 * @throws when the tree is not live, or a record's read or render refused.
	 */
	layoutBaseline(treeId: number, whole?: boolean): BaselineRun[];
	/**
	 * How much of its layout tree `treeId` stores apart from the options in effect when it was read:
	 * the runs of whitespace a side stores, the list slots that store a layout, and the items that
	 * store their own separator. A diagnostic.
	 *
	 * @throws when the tree is not live.
	 */
	storedLayout(treeId: number): StoredLayout;
	/**
	 * The work tree `treeId`'s layout reads have done so far: the nodes the region-depth walks entered
	 * and the items the sibling lookups visited. A diagnostic, so a growth test compares counts, not times.
	 *
	 * @throws when the tree is not live.
	 */
	layoutWork(treeId: number): LayoutWork;
	descendants(
		from: string,
		kinds: number[] | undefined | null,
		resume: number[] | undefined | null,
		limit: number,
		plan?: string | null,
		depth?: number | null
	): string;
	planHolds(addresses: string, plan: string): boolean[];
	render(node: TNode, treeId?: number, options?: object): string;
	renderToFile?(node: TNode, path: string, treeId?: number, options?: object): void;
	/** The binary's compile profile (`debug` | `release`); absent on a binary that predates the getter. */
	readonly buildProfile?: string;
	dispose(): void;
}

/** The handle of a native engine's state (`NativeEngineInstance.handle`) that its module's engine functions take first. */
export type EngineHandle = object;

/** A native `SittirEngine`: its lifecycle and parse, and the handle its module's engine functions take. */
export interface NativeEngineInstance {
	readonly handle: EngineHandle;
	parse(source: string): string;
	dispose(): void;
	readonly buildProfile?: string;
}

const TREE_FUNCTIONS = [
	'read',
	'snapshot',
	'triviaSide',
	'writeTriviaSide',
	'unitSides',
	'slotLayouts',
	'slotSeparator',
	'separatorBefore',
	'editedWithin',
	'isEmpty',
	'text',
	'readRecord',
	'hydrateRecord',
	'recordCandidates',
	'chunk',
	'readCell',
	'coordinate',
	'siblings',
	'layoutBaseline',
	'storedLayout',
	'layoutWork',
	'descendants',
	'planHolds',
	'externalBuffers'
] as const satisfies readonly (keyof NativeEngineLike)[];

const ENGINE_FUNCTIONS = [
	'render',
	'renderToFile',
	'renderRecord',
	'renderBuilt',
	'renderBuiltLeaf',
	'renderCandidate',
	'builtWords',
	'builtBytes',
	'builtBump',
	'releaseBuilt',
	'builtMemory',
	'builtTriviaSide',
	'writeBuiltTriviaSide',
	'builtUnitSides',
	'writeBuiltUnitSides',
	'writeBuiltLeafSide',
	'builtLeafSide',
	'copyBuiltSites'
] as const satisfies readonly (keyof NativeEngineLike)[];

type TreeFunction = (typeof TREE_FUNCTIONS)[number];
type EngineFunction = (typeof ENGINE_FUNCTIONS)[number];
type OnHandle<F> = F extends (...args: infer A) => infer R ? { call(handle: EngineHandle, ...args: A): R }['call'] : never;

export type NativeModuleLike<TNode = unknown, TEngine extends NativeEngineInstance = NativeEngineInstance> = {
	SittirEngine: new (options?: { options?: object }) => TEngine;
	/** Release one parsed tree of this language. Driven by GC — see `treeDisposalRegistry`. An id that names no tree is ignored. */
	disposeTree(treeId: number): void;
	/** Trees of this language still held on this thread. Diagnostics only. */
	liveTreeCount(): number;
} & Pick<NativeEngineLike<TNode>, TreeFunction> & { readonly [F in EngineFunction]?: OnHandle<NonNullable<NativeEngineLike<TNode>[F]>> };

/**
 * A new engine of `native`, as {@link NativeEngineLike}: its module's tree functions as they are, and its engine
 * functions bound to the engine's handle.
 */
export function nativeEngineOf<TNode, TEngine extends NativeEngineInstance>(native: NativeModuleLike<TNode, TEngine>, options?: { options?: object }): NativeEngineLike<TNode> {
	const instance = new native.SittirEngine(options);
	const { handle } = instance;
	const engine: Record<string, unknown> = {
		handle,
		buildProfile: instance.buildProfile,
		parse: (source: string) => instance.parse(source),
		dispose: () => instance.dispose()
	};
	for (const name of TREE_FUNCTIONS) engine[name] = native[name];
	for (const name of ENGINE_FUNCTIONS) engine[name] = (native[name] as ((...args: unknown[]) => unknown) | undefined)?.bind(undefined, handle);
	return engine as unknown as NativeEngineLike<TNode>;
}

export type NativeBackendStatusLike<TModule extends NativeModuleLike = NativeModuleLike> = {
	readonly name: 'native';
	readonly native: TModule;
	readonly hashMatch?: true;
};

export type JsBackendStatusLike = {
	readonly name: 'js';
	readonly reason?: string;
	readonly hashMatch?: false;
};

export type BackendStatusLike<TModule extends NativeModuleLike = NativeModuleLike> =
	| NativeBackendStatusLike<TModule>
	| JsBackendStatusLike;

export interface GrammarEngineConfig<
	TNode = unknown,
	TModule extends NativeModuleLike<TNode> = NativeModuleLike<TNode>
> {
	templatesPath: string;
	kindNames: ReadonlyMap<number, string>;
	rebuildWrappers: ReadonlySet<number>;
	listKinds: ReadonlySet<number>;
	getActiveBackend: () => BackendStatusLike<TModule>;
}

export type { ParseOptions };

/**
 * Raw reader access — the un-wrapped node data behind the product API.
 * `parse()` on a grammar engine returns a wrapped root; this surface hands
 * back the reader's own output (data plus the owning tree handle) for
 * probes, validators, and anything that inspects the wire shape itself.
 */
/**
 * Engine internals, reached through the `diagnostics` property rather than
 * the engine's own surface because they are NOT public API. These return raw
 * node DATA with reader stubs for children; the public entry point is
 * `ParseEngine.parse`, which wraps what these produce. Reach for these only
 * from inside the wrap layer or from validator/diagnostic tooling.
 */
export interface NativeEngineDiagnostics<TRoot extends AnyUntypedNode = AnyUntypedNode>
	extends EngineDiagnostics<TRoot & ParsedRoot, TreeHandle> {}

/**
 * The render half of the public surface: turning node DATA back into source,
 * and the lifecycle that owns the native handle. Deliberately separate from
 * `ParseEngine` so a consumer that only renders can say so in its types —
 * notably each grammar's `boundary.ts`, which node construction reaches
 * through `utils.ts`. Depending on the narrower contract there is what keeps
 * rendering from dragging in the parse surface, and the module graph acyclic.
 */
export interface RenderEngine<O extends object = RenderOptionValues, IndentChar extends string = never> {
	render<const I extends string = string>(node: AnyUntypedNode | number, options?: RenderOptions<O & IndentOption<I, IndentChar>>): Rendered;
	/**
	 * Releases `node`, as its `[Symbol.dispose]` does: the record of a node this engine's builders returned and has not
	 * been placed since, and with it each record only it held. Any other node is left as it is.
	 *
	 * @param node - A node this engine built, read, or neither.
	 * @throws For a node another engine built.
	 */
	release(node: object): void;
	dispose(): void;
}

/**
 * The parse half of the public surface: source in, a WRAPPED tree out.
 * `TTree` is the grammar's own root surface, so this is implemented per
 * grammar rather than by the shared native binding — the wrapping is what
 * makes it public, and what makes it need `wrap.ts`.
 */
export interface ParseEngine<TTree> {
	parse(source: string, options?: ParseOptions): TTree;
}

/**
 * The shared engine the native binding supplies: rendering, plus the
 * internals under `diagnostics`. A grammar's own engine composes this with
 * `ParseEngine<TTree>` to add the public `parse`.
 */
export interface SittirEngine<
	TRoot extends AnyUntypedNode = AnyUntypedNode,
	O extends object = RenderOptionValues,
	IndentChar extends string = never
> extends RenderEngine<O, IndentChar> {
	readonly diagnostics: NativeEngineDiagnostics<TRoot>;
	readonly builtRecords?: BuiltRecords;
}

export type { ParsedRoot };

export type ParseAndReadResult<TRoot extends AnyUntypedNode = AnyUntypedNode> = ParsedRead<TRoot & ParsedRoot, TreeHandle>;

/**
 * Frees a native tree once JavaScript can no longer read from it.
 *
 * Reads are lazy, so a tree has to outlive the call that parsed it: every
 * unhydrated child holds a handle the native side must still be able to
 * answer. Nothing on the JS side knows when the last of those handles is
 * gone — but the garbage collector does. Each tree gets a token that its
 * `read` closure captures and that every parsed object a read returns holds
 * (`holdTree`), so the token stays reachable exactly as long as the tree
 * handle or any object naming the tree; when the token is collected, the
 * tree is dropped.
 *
 * No engine is held, weakly or strongly. The live trees of a language belong
 * to its addon, so the entry carries the addon's release function: a tree is
 * released whether the engine that parsed it is alive, disposed or collected.
 */
const treeDisposalRegistry = new FinalizationRegistry<{
	readonly release: (treeId: number) => void;
	readonly treeId: number;
}>(({ release, treeId }) => release(treeId));

function recordReader<TNode>(engine: NativeEngineLike<TNode>, treeId: number, format: CellFormat, readObjectAt: (index: number, depth: number) => TNode): RecordReader {
	const { readRecord, readCell, chunk, renderRecord, coordinate } = engine;
	if (readRecord === undefined || readCell === undefined || chunk === undefined || renderRecord === undefined || coordinate === undefined) {
		throw new Error('arena node storage needs an addon built with the `arena` feature');
	}
	const chunks: ChunkWords[] = [];
	const coordinates = new Map<number, { readonly kind: number; readonly end: number }>();
	return {
		format,
		record: (at, depth) => readRecord.call(engine, treeId, at, depth) ?? undefined,
		cell: (holder, word, item, depth) => readCell.call(engine, treeId, holder, word, item, depth),
		hydrate(index, depth) {
			if (engine.hydrateRecord === undefined)
				throw new Error('native record hydration needs an addon with hydrateRecord');
			return engine.hydrateRecord(treeId, index, depth) ?? undefined;
		},
		candidates(index) {
			if (engine.recordCandidates === undefined)
				throw new Error('native candidate enumeration needs an addon with recordCandidates');
			return JSON.parse(engine.recordCandidates(treeId, index));
		},
		renderCandidate(index) {
			if (engine.renderCandidate === undefined)
				throw new Error('native candidate rendering needs an addon with renderCandidate');
			return engine.renderCandidate(treeId, index);
		},
		render: (address, leading, trailing) => renderRecord.call(engine, treeId, address, leading, trailing),
		object: (index, depth = 1) => readObjectAt(index, depth),
		words(address, length) {
			const n = chunkOf(address, format);
			const end = wordOf(address, format) + length;
			let words = chunks[n];
			if (words === undefined || words.length < end) words = chunks[n] = chunk.call(engine, treeId, n);
			if (words.length < end) throw new Error(`tree ${treeId}'s chunk ${n} holds ${words.length} words, short of a record that ends at word ${end}`);
			return words;
		},
		coordinate(index) {
			let at = coordinates.get(index);
			if (at === undefined) {
				const [kind, end] = coordinate.call(engine, treeId, index);
				if (kind === undefined || end === undefined) throw new Error(`tree ${treeId}'s coordinate of node ${index} is not a kind and an end`);
				at = { kind, end };
				coordinates.set(index, at);
			}
			return at;
		}
	};
}

/**
 * Tagged-union result for `createNativeEngine` — mirrors the
 * `loadNativeEngineForGrammar` pattern in
 * `packages/tools/src/validate/common.ts`: `engine: null` always carries a
 * `reason` string (the real failure cause) instead of discarding it.
 */
export type CreateNativeEngineResult<
	TRoot extends AnyUntypedNode = AnyUntypedNode,
	O extends object = RenderOptionValues,
	IndentChar extends string = never
> =
	| { readonly engine: SittirEngine<TRoot, O, IndentChar>; readonly reason?: undefined }
	| { readonly engine: null; readonly reason: string };

export function createNativeEngine<
	TRoot extends AnyUntypedNode = AnyUntypedNode,
	O extends object = RenderOptionValues,
	IndentChar extends string = never,
	TNode = unknown,
	TModule extends NativeModuleLike<TNode> = NativeModuleLike<TNode>
>(
	config: GrammarEngineConfig<TNode, TModule>,
	options?: NativeEngineOptions<O & IndentOption<string, IndentChar>>
): CreateNativeEngineResult<TRoot, O, IndentChar> {
	const status = config.getActiveBackend();
	if (status.name !== 'native') {
		return { engine: null, reason: status.reason ?? `active backend is '${status.name}', not 'native'` };
	}

	const { nodeStorage } = nodeStorageOf(options);
	const cellFormat = nodeStorage === 'arena' ? cellFormatOf(status.native) : undefined;
	if (nodeStorage === 'arena' && cellFormat === undefined) {
		return { engine: null, reason: 'arena node storage needs an addon built with the `arena` feature' };
	}

	try {
		const engine = nativeEngineOf(status.native, options?.options === undefined ? undefined : { options: options.options });
		if (nodeStorage === 'arena') {
			if (engine.externalBuffers === undefined) throw new Error('arena node storage needs an addon built with the `arena` feature');
			engine.externalBuffers();
		}
		const kindView: KindView = {
			isWrapper: (kindId) => config.rebuildWrappers.has(kindId)
		};

		function renderNativeNode(node: AnyUntypedNode | number, opts?: RenderOptions<O>): Rendered {
			const perCall = opts?.options;
			const holdsTrees = (): unknown => node;
			const built = typeof node === 'number' ? undefined : builtRefOf(node);
			if (built !== undefined) {
				const changed = rootEdges(node as object);
				const { renderBuilt, renderBuiltLeaf } = engine;
				if (renderBuilt === undefined || renderBuiltLeaf === undefined) throw new Error('arena node storage needs an addon built with the `arena` feature');
				if (built.at !== undefined) return createRenderHandle(() => renderBuilt.call(engine, built.arena.owner, built.at, changed.leading, changed.trailing, renderTreeOf(node as object), perCall));
				const kind = (node as AnyUntypedNode).$type as number;
				return createRenderHandle(() => renderBuiltLeaf.call(engine, built.arena.owner, kind, built.arena.placeEntry(node as object, kind, built.text).at, leafWireSides(node as object) ?? null, changed.leading, changed.trailing, perCall));
			}
			const record = typeof node === 'number' ? undefined : recordOf(node);
			if (record !== undefined) {
				const changed = rootEdges(node as object);
				const tree = (node as RecordPosition).$tree;
				const treeId = tree.id;
				if (tree.records === undefined || treeId === undefined)
					throw new Error('a record view renders through the tree it was read from, which is gone');
				const renderRecord = engine.renderRecord;
				if (renderRecord === undefined)
					throw new Error('arena node storage needs an addon built with the `arena` feature');
				return createRenderHandle(() => {
					holdsTrees();
					return renderRecord.call(engine, treeId, record, changed.leading, changed.trailing, perCall);
				});
			}
			const data = (typeof node === 'number' ? node : toNodeData(node, kindView)) as TNode;
			const treeId = typeof node === 'number' ? undefined : renderTreeOf(node);
			return createRenderHandle(
				() => {
					holdsTrees();
					return engine.render(data, treeId, perCall);
				},
				(path) => {
					holdsTrees();
					if (engine.renderToFile) {
						engine.renderToFile(data, path, treeId, perCall);
						return true;
					}
					return false;
				}
			);
		}

		return {
			engine: {
				builtRecords: cellFormat === undefined ? undefined : builtRecordsOf(engine, cellFormat, kindView),
				render(node, opts) {
					return renderNativeNode(node, opts);
				},

				release(node) {
					const built = builtRefOf(node);
					if (built?.at === undefined) return;
					if (built.arena.owner !== engine.handle) throw new Error('an engine releases only the nodes its own builders returned');
					built.arena.release(built.at);
				},

				dispose() {
					engine.dispose();
				},

				diagnostics: {
					buildProfile: engine.buildProfile,
					builtMemory: () => (cellFormat === undefined ? undefined : engine.builtMemory?.()),
					parseAndRead(source: string, parseOptions?: ParseOptions) {
						const parsed = JSON.parse(engine.parse(source)) as NativeParseResult;
						const liveToken = mintTreeToken(parsed.treeId);
						treeDisposalRegistry.register(liveToken, {
							release: status.native.disposeTree,
							treeId: parsed.treeId
						});
						const readObjectAt = (index: number, depth: number): TNode => {
							const node = engine.read(parsed.treeId, index, depth);
							holdReadTree(node, liveToken);
							return node;
						};
						const records = cellFormat === undefined ? undefined : recordReader(engine, parsed.treeId, cellFormat, readObjectAt);
						const readAt = (index: number, depth: number): TNode => {
							const at = records?.record(index, depth);
							if (at === undefined) return readObjectAt(index, depth);
							const stub = recordStub(tree, at);
							holdReadTree(stub, liveToken);
							return stub as TNode;
						};
						const roots = new Map<number, unknown>();
						const tree: TreeHandle = {
							id: parsed.treeId,
							token: liveToken,
							text: (span) => engine.text(parsed.treeId, span),
							...(records === undefined ? {} : { records }),
							read: (index, depth = 1) => {
								if (index !== 0) return readAt(index, depth);
								let cached = roots.get(depth);
								if (cached === undefined) {
									cached = Object.assign(readObject(readAt(0, depth), 'the root'), {
										$errors: Object.freeze(parsed.errors)
									});
									roots.set(depth, cached);
								}
								return cached;
							},
							options: parsed.options,
							snapshot: (index, holderByte) => engine.snapshot(parsed.treeId, index, holderByte),
							triviaSide: (index, side) => readEntries(tree, engine.triviaSide(parsed.treeId, index, side), liveToken),
							writeTriviaSide: (index, side, entries) => engine.writeTriviaSide(parsed.treeId, index, side, entries),
							unitSides: (index) => readUnits(tree, engine.unitSides(parsed.treeId, index), liveToken),
							slotLayouts: (index) => engine.slotLayouts(parsed.treeId, index),
							slotSeparator: (index) => engine.slotSeparator(parsed.treeId, index) ?? undefined,
							separatorBefore: (index) => engine.separatorBefore(parsed.treeId, index) ?? undefined,
							editedWithin: (index, ownSides) => engine.editedWithin(parsed.treeId, index, ownSides),
							isEmpty: (index) => engine.isEmpty(parsed.treeId, index),
							siblings: (index) => JSON.parse(engine.siblings(parsed.treeId, index)) as Siblings,
							query: {
								descendants: (walk) =>
									JSON.parse(
										engine.descendants(
											JSON.stringify(walk.from),
											walk.kinds === undefined ? undefined : [...walk.kinds],
											walk.resume === undefined ? undefined : [...walk.resume],
											walk.limit,
											walk.plan === undefined ? undefined : JSON.stringify(walk.plan),
											walk.depth
										)
									) as DescendantBatch,
								planHolds: (addresses, plan) => engine.planHolds(JSON.stringify(addresses), JSON.stringify(plan))
							}
						};
						registerTree(liveToken, tree);
						return {
							get root() {
								return tree.read!(0, depthOf(parseOptions)) as TRoot & ParsedRoot;
							},
							tree
						};
					}
				}
			}
		};
	} catch (e) {
		return { engine: null, reason: e instanceof Error ? e.message : String(e) };
	}
}

const nativeRecords = new WeakMap<object, BuiltRecords>();

export function nativeBuiltRecords(native: object): BuiltRecords | undefined {
	return nativeRecords.get(native);
}

function builtRecordsOf(engine: NativeEngineLike, format: CellFormat, kinds: KindView): BuiltRecords {
	const { builtTriviaSide, writeBuiltTriviaSide, builtUnitSides, writeBuiltUnitSides, writeBuiltLeafSide, builtLeafSide, copyBuiltSites, builtWords, builtBytes, builtBump, releaseBuilt } = engine;
	if (
		builtBump === undefined ||
		releaseBuilt === undefined ||
		builtTriviaSide === undefined ||
		writeBuiltTriviaSide === undefined ||
		builtUnitSides === undefined ||
		writeBuiltUnitSides === undefined ||
		writeBuiltLeafSide === undefined ||
		builtLeafSide === undefined ||
		copyBuiltSites === undefined ||
		builtWords === undefined ||
		builtBytes === undefined
	)
		throw new Error('arena node storage needs an addon built with the `arena` feature');
	return {
		format,
		owner: engine.handle,
		kinds,
		words: (length) => builtWords.call(engine, length),
		bytes: (length) => builtBytes.call(engine, length),
		bump: (at) => builtBump.call(engine, at),
		release: (at, held, owned) => releaseBuilt.call(engine, at, held, owned),
		trivia: {
			triviaSide: (at, side) => builtTriviaSide.call(engine, at, side) ?? undefined,
			writeTriviaSide: (at, side, entries) => writeBuiltTriviaSide.call(engine, at, side, entries),
			unitSides: (at) => builtUnitSides.call(engine, at),
			writeUnitSides: (at, units) => writeBuiltUnitSides.call(engine, at, units),
			writeLeafSide: (sites, side, entries) => writeBuiltLeafSide.call(engine, sites, side, entries),
			leafSide: (holder, word, item, side) => builtLeafSide.call(engine, holder, word, item, side) ?? undefined,
			copySites: (from, to, skip) => copyBuiltSites.call(engine, from, to, skip)
		}
	};
}

export function nativeLanguageEngine<API extends LanguageAPI, IndentChar extends string = never>(
	engine: SittirEngine<AnyUntypedNode, API['options'], IndentChar>
): NativeLanguageEngine<API> {
	const language: NativeLanguageEngine<API> = {
		render(node, options) {
			return options === undefined || Object.keys(options).length === 0 ? engine.render(node) : engine.render(node, { options });
		},
		parseAndRead(source, options) {
			return engine.diagnostics.parseAndRead(source, options);
		},
		buildProfile: engine.diagnostics.buildProfile,
		builtMemory: engine.diagnostics.builtMemory,
		release(node) {
			engine.release(node);
		},
		dispose() {
			engine.dispose();
		}
	};
	if (engine.builtRecords !== undefined) nativeRecords.set(language, engine.builtRecords);
	return language;
}
