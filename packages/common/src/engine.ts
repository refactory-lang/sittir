import type {
	AnyUntypedNode,
	ByteSpan,
	EngineDiagnostics,
	IndentOption,
	LanguageAPI,
	NativeEngineOptions,
	NativeLanguageEngine,
	NativeParseResult,
	NodeCoordinate,
	ParsedRead,
	ParsedRoot,
	ParseOptions,
	Rendered
} from '@sittir/types';
import { decodeIndex, decodeTree, readObject, type ChunkWords, type RecordReader, type TreeHandle, type TriviaSideName } from './read.ts';
import { coordinateIndex, coordinateOf, holdReadTree, keyName, placeOf, rootEdges, sourceHandleOf, toNodeData, type KindView, type ReadOutput } from './node-data.ts';
import { mintTreeToken, registerTree, treeOfToken } from './tree-token.ts';
import type { RecordPosition } from './handle.ts';
import type { DescendantBatch, TreeQuery } from './query.ts';
import { cellFormatOf, chunkOf, wordOf, type CellFormat } from './record-cell.ts';
import { leafData, readStub, recordOf } from './record-view.ts';
import { readOwnEntries, readOwnUnits, type BuiltRecords, type ParsedRecords, type WritableWords } from './built-arena.ts';
import { builtRefOf, handleArenaOf } from './built-ref.ts';
import { nodeStorageOf } from './engine-scope.ts';
import { leafWireSides, type NodeAddress } from './utils.ts';

export const ARENA_FEATURE_REFUSED = 'arena node storage needs an addon built with the `arena` feature';

/** The options object a grammar package types as its `Options`. */
export type RenderOptionValues = Readonly<Record<string, unknown>>;

export interface RenderOptions<O extends object = RenderOptionValues> {
	/** Per-call options, resolved over the engine's own. */
	readonly options?: O;
}

export type RenderSaver = (path: string, create: boolean) => boolean;

export type TextWriter = (path: string, text: string, create: boolean) => boolean;

const savers = new WeakMap<Rendered, RenderSaver>();

export function createRenderHandle(renderText: () => string, save: RenderSaver, writeText: TextWriter, release?: () => void): Rendered {
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
	const saver: RenderSaver = (path, create) => {
		live();
		return cached === undefined ? save(path, create) : writeText(path, cached, create);
	};
	const rendered: Rendered = {
		save(path: string): void {
			saver(path, false);
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
			if (disposed) return;
			disposed = true;
			cached = undefined;
			release?.();
		}
	};
	savers.set(rendered, saver);
	return rendered;
}

export function saverOf(rendered: Rendered): RenderSaver {
	const saver = savers.get(rendered);
	if (saver === undefined) throw new Error('saverOf: not a render an engine returned');
	return saver;
}

function recordTreeOf(view: RecordPosition): number {
	const tree = view.$tree;
	if (tree.records === undefined || tree.id === undefined) throw new Error('a record view renders through the tree it was read from, which is gone');
	return tree.id;
}

function sourceRecordOf(node: object): number | undefined {
	const source = placeOf(node);
	if (source === undefined || treeOfToken(source.token)?.built === undefined) return undefined;
	return keyName(source.index).node;
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

/** Whether a tree's record backer answers its nodes as its tree backer does (`NativeEngineLike.backerParity`). */
export interface BackerParity {
	readonly nodes: number;
	readonly differing: number;
	readonly first?: number;
}

/** The work a tree's layout reads have done so far (`NativeEngineLike.layoutWork`), each count as the addon's `LayoutWork` names it. */
export interface LayoutWork {
	readonly regionNodes: number;
	readonly siblingItems: number;
	readonly regionFallbacks: number;
	readonly cursorClimbs: number;
	readonly siblingSteps: number;
	readonly rootDescents: number;
	readonly depthNodes: number;
	readonly recordNodes: number;
	readonly recordsRendered: number;
	readonly gapItems: number;
	readonly treeReads: number;
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
	read(treeId: number, index: number, depth?: number): TNode & ReadOutput;
	/**
	 * A snapshot's layout of the node at descendant `index` of tree `treeId` and of each node under it
	 * that a read gives a layout, as `[row, layout]` pairs in preorder: each layout with its span
	 * (`span`) measured from the start of the native node that holds it and each placed extra and
	 * `ERROR` as its text, the node itself measured from the byte `holderByte`, or, when absent, from
	 * where it or its leading side begins, whichever is first. When an `ERROR` holds the node, the one
	 * pair is that `ERROR`'s.
	 *
	 * @throws as {@link read} does, and when `holderByte` lies after the first byte the snapshot measures.
	 */
	snapshotLayouts(treeId: number, index: number, holderByte?: number | null): readonly (readonly [number, object])[];
	/**
	 * The entries of `side` of the node at descendant `index` of tree `treeId`: the ones a write gave it,
	 * else the ones the tree's trivia table assigns it. An extra is its coordinate, an `ERROR` its kind
	 * and source text, and a run of line layout its whitespace member.
	 *
	 * @throws when the tree is not live, `index` is past its last node, or `side` is none of the three.
	 */
	triviaSide(treeId: number, index: number, side: TriviaSideName): ReadOutput[];
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
	unitSides(treeId: number, index: number): ReadOutput[];
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
	readRecordStub?(treeId: number, index: number, depth?: number): number[] | null;
	readLeaf?(treeId: number, index: number): number[] | null;
	/** Materializes parsed records to `depth` (default one, Infinity for all), including children of cached parents. Returns only an address; chunk copies are requested separately. Present when the addon carries the record codec. */
	hydrateRecord?(treeId: number, index: number, depth?: number): number | null;
	/** Chunk `n` of the tree's arena over its native memory, every word of it, with no copy; disposing the tree detaches it. Present when the addon carries the record codec. */
	chunk?(treeId: number, n: number): ChunkWords;
	/** The address of the record the parsed cell at `word`, item `item`, of the record at `holder` names: on the first read through it, written `depth` levels down and the cell rewritten to name it. Present when the addon carries the record codec. */
	readCell?(treeId: number, holder: number, word: number, item: number, depth?: number): number;
	/** A new zeroed chunk of `length` words of the engine's built arena, over its native memory, its number, and its meta, where its entries' counts are kept, with the chunk it sealed and that chunk's meta, now sized for its entries. Present when the addon carries the record codec. */
	builtWords?(length: number): { chunk: number; data: WritableWords; meta: Uint8Array; freed: number[]; sealed?: { chunk: number; meta: Uint8Array } };
	/** A new zeroed chunk of `length` bytes of the engine's built arena's strings, over its native memory, its number, and its meta, its cell count. Present when the addon carries the record codec. */
	builtBytes?(length: number): { chunk: number; data: Uint8Array; meta: Uint8Array; freed: number[] };
	/** One more count of the built entry at `address`, whose count saturated. Present when the addon carries the record codec. */
	builtBump?(address: number): void;
	/** Releases a count of the built entry at `address` of form `held`, the count its builder's handle holds when `owned`; answers the trees released link and side records named. Present when the addon carries the record codec. */
	releaseBuilt?(address: number, held: number, owned: boolean): number[];
	/** Parses `source` and keeps no tree: as JSON `{ root, source, options, errors }`, the address of the root's record in the built arena, null when its reader writes none, the address of the source's entry, the source's layer of the render options, and its error regions. Present when the addon carries the record codec. */
	parseRecords?(source: string): string;
	/** Chunk `chunk` of the built arena, which a read wrote, over its native memory with no copy; null for a chunk no read wrote. Present when the addon carries the record codec. */
	readWords?(chunk: number): WritableWords | null;
	/** `renderAt` for the node a read left in the built arena that the key `node` names, from the arena alone. Present when the addon carries the record codec. */
	readRenderAt?(node: number, leading: boolean, trailing: boolean, options?: object, templates?: boolean): string;
	/** The text bytes `start` to `end` cover in the source the read's record at `node` of the built arena was read from. Refuses an address no read wrote and a span that is not one of the source's. Present when the addon carries the record codec. */
	readText?(node: number, start: number, end: number): string;
	/** `descendants` for a node a read left records of in the built arena: `from` and the batch name nodes as `{ $node, $site? }`. Present when the addon carries the record codec. */
	readDescendants?: NativeEngineLike['descendants'];
	/** `planHolds` for nodes a read left records of in the built arena, named as `{ $node, $site? }`. Present when the addon carries the record codec. */
	readPlanHolds?: NativeEngineLike['planHolds'];
	/** `snapshotLayouts` for the node a read left in the built arena that the key `node` names, each pair's node by its key. Present when the addon carries the record codec. */
	readSnapshotLayouts?(node: number, holderByte?: number): [number, object][];
	/** `triviaSide` for the node a read left in the built arena that the key `node` names. Present when the addon carries the record codec. */
	readTriviaSide?(node: number, side: string): unknown[];
	/** `writeTriviaSide` for the node a read left in the built arena that the key `node` names. Present when the addon carries the record codec. */
	writeReadTriviaSide?(node: number, side: string, entries: readonly unknown[]): void;
	/** `unitSides` for the node a read left in the built arena that the key `node` names. Present when the addon carries the record codec. */
	readUnitSides?(node: number): unknown[];
	/** `slotLayouts` for the node a read left in the built arena that the key `node` names. Present when the addon carries the record codec. */
	readSlotLayouts?(node: number): unknown[];
	/** `slotSeparator` for the node a read left in the built arena that the key `node` names. Present when the addon carries the record codec. */
	readSlotSeparator?(node: number): number | null;
	/** `separatorBefore` for the node a read left in the built arena that the key `node` names. Present when the addon carries the record codec. */
	readSeparatorBefore?(node: number): number | null;
	/** `editedWithin` for the node a read left in the built arena that the key `node` names. Present when the addon carries the record codec. */
	readEditedWithin?(node: number, ownSides: boolean): boolean;
	/** `isEmpty` for the node a read left in the built arena that the key `node` names. Present when the addon carries the record codec. */
	readIsEmpty?(node: number): boolean;
	/** `siblings` for the nodes reads left in the built arena that the keys `nodes` name, eight words a node, each from its own source. Present when the addon carries the record codec. */
	readSiblings?(nodes: readonly number[]): number[];
	/** The address of the source entry each node a read left in the built arena that the keys `nodes` name was read from. Present when the addon carries the record codec. */
	readSources?(nodes: readonly number[]): number[];
	/** The bytes the built arena's chunks take, and of them its counts'. Present when the addon carries the record codec. */
	builtMemory?(): { chunks: number; counts: number; live: number };
	/** Refuses, by name, a runtime that does not allow external array buffers. Present when the addon carries the record codec. */
	externalBuffers?(): void;
	/** The kind and subtree end, as `[kind, end]`, a read of tree `treeId` names the node at `index` by. Present when the addon carries the record codec. */
	coordinate?(treeId: number, index: number): number[];
	/** The record at `address` rendered as a render root whose `leading` and `trailing` edges have no neighbour; `templates` renders it and every parsed node under it that has a record from its template, each leaf and unit as its source. Present when the addon carries the record codec. */
	renderRecord?(treeId: number, address: number, leading: boolean, trailing: boolean, options?: object, templates?: boolean): string;
	renderBuilt?(owner: object, address: number, leading: boolean, trailing: boolean, source?: number, options?: object): string;
	renderBuiltLeaf?(
		owner: object,
		kind: number,
		entry: number,
		sides: object | null,
		leading: boolean,
		trailing: boolean,
		options?: object
	): string;
	/** {@link renderRecord}'s text written to `path`, answering whether it wrote. Present when the addon carries the record codec. */
	renderRecordToFile?(treeId: number, address: number, leading: boolean, trailing: boolean, path: string, create: boolean, options?: object): boolean;
	/** {@link renderBuilt}'s text written to `path`, answering whether it wrote. Present when the addon carries the record codec. */
	renderBuiltToFile?(owner: object, address: number, leading: boolean, trailing: boolean, path: string, create: boolean, source?: number, options?: object): boolean;
	/** {@link renderBuiltLeaf}'s text written to `path`, answering whether it wrote. Present when the addon carries the record codec. */
	renderBuiltLeafToFile?(
		owner: object,
		kind: number,
		entry: number,
		sides: object | null,
		leading: boolean,
		trailing: boolean,
		path: string,
		create: boolean,
		options?: object
	): boolean;
	builtTriviaSide?(address: number, side: TriviaSideName): unknown[] | null;
	writeBuiltTriviaSide?(address: number, side: TriviaSideName, entries: readonly unknown[]): void;
	builtUnitSides?(address: number): unknown[];
	writeBuiltUnitSides?(address: number, units: readonly unknown[]): void;
	writeBuiltLeafSide?(sites: readonly number[], side: TriviaSideName, entries: readonly unknown[]): void;
	builtLeafSide?(holder: number, word: number, item: number, side: TriviaSideName): unknown[] | null;
	copyBuiltSites?(from: number, to: number, skip: readonly number[]): void;
	/**
	 * The siblings that hold sides beside each node at descendant `indexes` of tree `treeId`, eight words a node: the
	 * previous sibling, then the next, each as 1, its kind, its start and its end, or as four zeros for none.
	 *
	 * @throws when the tree is not live or an index is past its last node.
	 */
	siblings(treeId: number, indexes: readonly number[]): number[];
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
	 * The work tree `treeId`'s layout reads have done so far: the nodes its region-depth walks entered, the
	 * items its sibling lookups visited, the nodes its region renders found outside their regions, the levels
	 * its lookup cursors climbed, the nodes its depth moves walked, the nodes its layout records' renders
	 * entered, and the records rendered. A diagnostic, so a growth test compares counts, not times.
	 *
	 * @throws when the tree is not live.
	 */
	layoutWork(treeId: number): LayoutWork;
	/**
	 * Reads tree `treeId` whole, then compares each node as arena storage's record backer and the tree backer
	 * answer it: the nodes compared, how many differ, and the first that does. A diagnostic.
	 *
	 * @throws when the tree is not live or its read is refused.
	 */
	backerParity(treeId: number): BackerParity;
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
	/** The node at descendant `index` of tree `treeId` rendered as a render root whose `leading` and `trailing` edges have no neighbour, as {@link render} renders the node a read of it gives; `templates` renders it and every node under it that has a record from its template, each leaf and unit as its source. */
	renderAt(treeId: number, index: number, leading: boolean, trailing: boolean, options?: object, templates?: boolean): string;
	/** {@link render}'s text written to `path`: a new file when `create`, refusing a file at the path, and otherwise a replacement that leaves a file already holding the text untouched. Answers whether it wrote. */
	renderToFile(node: TNode, path: string, create: boolean, treeId?: number, options?: object): boolean;
	/** `text` written to `path` as {@link renderToFile} writes a render's text, answering whether it wrote. */
	writeText(path: string, text: string, create: boolean): boolean;
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
	'snapshotLayouts',
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
	'readRecordStub',
	'readLeaf',
	'hydrateRecord',
	'chunk',
	'readCell',
	'coordinate',
	'siblings',
	'layoutBaseline',
	'storedLayout',
	'layoutWork',
	'backerParity',
	'descendants',
	'planHolds',
	'externalBuffers',
	'writeText'
] as const satisfies readonly (keyof NativeEngineLike)[];

const ENGINE_FUNCTIONS = [
	'render',
	'renderAt',
	'renderToFile',
	'renderRecord',
	'renderRecordToFile',
	'renderBuilt',
	'renderBuiltToFile',
	'renderBuiltLeaf',
	'renderBuiltLeafToFile',
	'builtWords',
	'builtBytes',
	'builtBump',
	'releaseBuilt',
	'parseRecords',
	'readWords',
	'readRenderAt',
	'readText',
	'readDescendants',
	'readPlanHolds',
	'readSnapshotLayouts',
	'readTriviaSide',
	'writeReadTriviaSide',
	'readUnitSides',
	'readSlotLayouts',
	'readSlotSeparator',
	'readSeparatorBefore',
	'readEditedWithin',
	'readIsEmpty',
	'readSiblings',
	'readSources',
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
	/** What this language's live trees hold natively and what their reports have told V8, in bytes. Diagnostics only. */
	treeMemory(): { readonly trees: number; readonly counted: number; readonly reported: number };
	/** The engine image this process mapped: its stamp and the file it was loaded from. Diagnostics only. */
	engineStamp(): { readonly stamp: string; readonly path?: string | null };
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
	writeText(path: string, text: string, create: boolean): boolean;
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
	const { readRecord, readRecordStub, readLeaf, readCell, chunk, renderRecord, coordinate } = engine;
	if (readRecord === undefined || readRecordStub === undefined || readLeaf === undefined || readCell === undefined || chunk === undefined || renderRecord === undefined || coordinate === undefined) {
		throw new Error(ARENA_FEATURE_REFUSED);
	}
	const chunks: ChunkWords[] = [];
	const coordinates = new Map<number, { readonly kind: number; readonly end: number }>();
	return {
		format,
		record: (at, depth) => readRecord.call(engine, treeId, at, depth) ?? undefined,
		stub: (index, depth) => readRecordStub.call(engine, treeId, index, depth) ?? undefined,
		leaf(index) {
			const leaf = readLeaf.call(engine, treeId, index);
			if (leaf === null) return undefined;
			if (leaf.length === 1) return { form: 'unit', kind: leaf[0]!, row: index };
			return { form: 'parsedLeaf', kind: leaf[0]!, span: { start: leaf[1]!, end: leaf[2]! }, row: index };
		},
		exported: (address) => chunks[chunkOf(address, format)],
		cell: (holder, word, item, depth) => readCell.call(engine, treeId, holder, word, item, depth),
		hydrate(index, depth) {
			if (engine.hydrateRecord === undefined)
				throw new Error('native record hydration needs an addon with hydrateRecord');
			return engine.hydrateRecord(treeId, index, depth) ?? undefined;
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

	const nodeStorage = nodeStorageOf(options);
	const cellFormat = nodeStorage === 'arena' ? cellFormatOf(status.native) : undefined;
	if (nodeStorage === 'arena' && cellFormat === undefined) {
		return { engine: null, reason: ARENA_FEATURE_REFUSED };
	}

	try {
		const engine = nativeEngineOf(status.native, options?.options === undefined ? undefined : { options: options.options });
		if (nodeStorage === 'arena') {
			if (engine.externalBuffers === undefined) throw new Error(ARENA_FEATURE_REFUSED);
			engine.externalBuffers();
		}
		const kindView: KindView = {
			isWrapper: (kindId) => config.rebuildWrappers.has(kindId)
		};

		const parseTree = (source: string): TreeHandle => {
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
			const readAt =
				records === undefined
					? readObjectAt
					: (index: number, depth: number): TNode => {
							const facts = records.stub(index, depth);
							if (facts !== undefined) {
								const stub = readStub(tree, facts);
								holdReadTree(stub, liveToken);
								return stub as TNode;
							}
							const leaf = records.leaf(index);
							if (leaf === undefined) return readObjectAt(index, depth);
							if (leaf.form === 'unit') return leaf.kind as TNode;
							const node = leafData(tree, leaf.kind, leaf.span, leaf.row);
							holdReadTree(node, liveToken);
							return node as TNode;
						};
			const roots = new Map<number, unknown>();
			const errors = Object.freeze(parsed.errors);
			const tree: TreeHandle = {
				id: parsed.treeId,
				token: liveToken,
				text: (span) => engine.text(parsed.treeId, span),
				...(records === undefined ? {} : { records }),
				read: (index, depth = 1) => {
					if (index !== 0) return readAt(index, depth);
					let cached = roots.get(depth);
					if (cached === undefined) {
						cached = Object.assign(readObject(readAt(0, depth), 'the root'), { $errors: errors });
						roots.set(depth, cached);
					}
					return cached;
				},
				options: parsed.options,
				errors,
				snapshotLayouts: (index, holderByte) => engine.snapshotLayouts(parsed.treeId, index, holderByte),
				triviaSide: (index, side) => readOwnEntries(tree, engine.triviaSide(parsed.treeId, index, side), liveToken),
				writeTriviaSide: (index, side, entries) => engine.writeTriviaSide(parsed.treeId, index, side, entries),
				unitSides: (index) => readOwnUnits(tree, engine.unitSides(parsed.treeId, index), liveToken),
				slotLayouts: (index) => engine.slotLayouts(parsed.treeId, index),
				slotSeparator: (index) => engine.slotSeparator(parsed.treeId, index) ?? undefined,
				separatorBefore: (index) => engine.separatorBefore(parsed.treeId, index) ?? undefined,
				editedWithin: (index, ownSides) => engine.editedWithin(parsed.treeId, index, ownSides),
				isEmpty: (index) => engine.isEmpty(parsed.treeId, index),
				siblings: (indexes) => engine.siblings(parsed.treeId, indexes),
				query: queryOver(engine.descendants, engine.planHolds)
			};
			registerTree(liveToken, tree);
			return tree;
		};

		const writeText: TextWriter = (path, text, create) => engine.writeText(path, text, create);

		function readRendered(node: object, named: NodeCoordinate, options: object | undefined, templates: boolean): string {
			const { readRenderAt } = engine;
			if (readRenderAt === undefined) throw new Error(ARENA_FEATURE_REFUSED);
			const changed = rootEdges(node);
			return readRenderAt.call(engine, coordinateIndex(named), changed.leading, changed.trailing, options, templates);
		}

		function renderTemplates(node: AnyUntypedNode): string {
			const record = builtRefOf(node) === undefined ? recordOf(node) : undefined;
			const at = record === undefined ? coordinateOf(node) : undefined;
			if (record === undefined && at === undefined) throw new Error('renderTemplates renders a node as a read gave it, and this one was built or edited');
			const changed = rootEdges(node);
			const named = coordinateOf(node);
			if (named !== undefined && '$node' in named) return readRendered(node, named, undefined, true);
			if (at !== undefined) return engine.renderAt(decodeTree(at.$treeHandle), decodeIndex(at.$treeHandle), changed.leading, changed.trailing, undefined, true);
			const { renderRecord } = engine;
			if (renderRecord === undefined) throw new Error(ARENA_FEATURE_REFUSED);
			return renderRecord.call(engine, recordTreeOf(node as unknown as RecordPosition), record!, changed.leading, changed.trailing, undefined, true);
		}

		function renderNativeNode(node: AnyUntypedNode | number, opts?: RenderOptions<O>): Rendered {
			const perCall = opts?.options;
			const holdsTrees = (): unknown => node;
			const built = typeof node === 'number' ? undefined : builtRefOf(node);
			if (built !== undefined) {
				const changed = rootEdges(node as object);
				const { renderBuilt, renderBuiltLeaf, renderBuiltToFile, renderBuiltLeafToFile } = engine;
				if (renderBuilt === undefined || renderBuiltLeaf === undefined || renderBuiltToFile === undefined || renderBuiltLeafToFile === undefined)
					throw new Error(ARENA_FEATURE_REFUSED);
				const at = built.at;
				if (at !== undefined) {
					const settled = (): number => {
						built.arena.refuseRender(at);
						built.arena.settle();
						return at;
					};
					return createRenderHandle(
						() => renderBuilt.call(engine, built.arena.owner, settled(), changed.leading, changed.trailing, sourceRecordOf(node as object), perCall),
						(path, create) => renderBuiltToFile.call(engine, built.arena.owner, settled(), changed.leading, changed.trailing, path, create, sourceRecordOf(node as object), perCall),
						writeText
					);
				}
				const kind = (node as AnyUntypedNode).$type as number;
				const entry = (): number => built.arena.placeEntry(node as object, kind, built.text).at;
				return createRenderHandle(
					() => renderBuiltLeaf.call(engine, built.arena.owner, kind, entry(), leafWireSides(node as object) ?? null, changed.leading, changed.trailing, perCall),
					(path, create) => renderBuiltLeafToFile.call(engine, built.arena.owner, kind, entry(), leafWireSides(node as object) ?? null, changed.leading, changed.trailing, path, create, perCall),
					writeText
				);
			}
			const record = typeof node === 'number' ? undefined : recordOf(node);
			if (record !== undefined) {
				const changed = rootEdges(node as object);
				const treeId = recordTreeOf(node as RecordPosition);
				const { renderRecord, renderRecordToFile } = engine;
				if (renderRecord === undefined || renderRecordToFile === undefined)
					throw new Error(ARENA_FEATURE_REFUSED);
				return createRenderHandle(
					() => {
						holdsTrees();
						return renderRecord.call(engine, treeId, record, changed.leading, changed.trailing, perCall);
					},
					(path, create) => {
						holdsTrees();
						return renderRecordToFile.call(engine, treeId, record, changed.leading, changed.trailing, path, create, perCall);
					},
					writeText
				);
			}
			const named = typeof node === 'number' ? undefined : coordinateOf(node);
			if (named !== undefined && '$node' in named) {
				const text = (): string => readRendered(node as object, named, perCall, false);
				return createRenderHandle(text, (path, create) => writeText(path, text(), create), writeText);
			}
			const data = (typeof node === 'number' ? node : toNodeData(node, kindView)) as TNode;
			const treeId = typeof node === 'number' ? undefined : renderTreeOf(node);
			return createRenderHandle(
				() => {
					holdsTrees();
					return engine.render(data, treeId, perCall);
				},
				(path, create) => {
					holdsTrees();
					return engine.renderToFile(data, path, create, treeId, perCall);
				},
				writeText
			);
		}

		return {
			engine: {
				builtRecords: cellFormat === undefined ? undefined : builtRecordsOf(engine, cellFormat, kindView),
				render(node, opts) {
					return renderNativeNode(node, opts);
				},

				writeText,

				release(node) {
					const arena = handleArenaOf(node);
					if (arena === undefined) return;
					if (arena.owner !== engine.handle) throw new Error('an engine releases only the nodes its own builders returned');
					arena.releaseHandle(node);
				},

				dispose() {
					engine.dispose();
				},

				diagnostics: {
					buildProfile: engine.buildProfile,
					builtMemory: () => (cellFormat === undefined ? undefined : engine.builtMemory?.()),
					renderTemplates,
					parseTree,
					parseAndRead(source: string, parseOptions?: ParseOptions) {
						const tree = parseTree(source);
						return { tree, root: tree.read!(0, depthOf(parseOptions)) as TRoot & ParsedRoot };
					}
				}
			}
		};
	} catch (e) {
		return { engine: null, reason: e instanceof Error ? e.message : String(e) };
	}
}

function queryOver(descendants: NativeEngineLike['descendants'], planHolds: NativeEngineLike['planHolds']): TreeQuery {
	return {
		descendants: (walk) => {
			const batch = JSON.parse(
				descendants(
					JSON.stringify(walk.from),
					walk.kinds === undefined ? undefined : [...walk.kinds],
					walk.resume === undefined ? undefined : [...walk.resume],
					walk.limit,
					walk.plan === undefined ? undefined : JSON.stringify(walk.plan),
					walk.depth
				)
			) as Omit<DescendantBatch, 'origin'> & { readonly origin: number | NodeAddress };
			return { ...batch, origin: typeof batch.origin === 'number' ? { handle: batch.origin } : batch.origin };
		},
		planHolds: (addresses, plan) => planHolds(JSON.stringify(addresses), JSON.stringify(plan))
	};
}

const nativeRecords = new WeakMap<object, BuiltRecords>();

export function nativeBuiltRecords(native: object): BuiltRecords | undefined {
	return nativeRecords.get(native);
}

function builtRecordsOf(engine: NativeEngineLike, format: CellFormat, kinds: KindView): BuiltRecords {
	const { builtTriviaSide, writeBuiltTriviaSide, builtUnitSides, writeBuiltUnitSides, writeBuiltLeafSide, builtLeafSide, copyBuiltSites, builtWords, builtBytes, builtBump, releaseBuilt, parseRecords, readWords, readText, readDescendants, readPlanHolds, readSnapshotLayouts, readTriviaSide, writeReadTriviaSide, readUnitSides, readSlotLayouts, readSlotSeparator, readSeparatorBefore, readEditedWithin, readIsEmpty, readSiblings, readSources } = engine;
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
		builtBytes === undefined ||
		parseRecords === undefined ||
		readWords === undefined ||
		readText === undefined ||
		readDescendants === undefined ||
		readPlanHolds === undefined ||
		readSnapshotLayouts === undefined ||
		readTriviaSide === undefined ||
		writeReadTriviaSide === undefined ||
		readUnitSides === undefined ||
		readSlotLayouts === undefined ||
		readSlotSeparator === undefined ||
		readSeparatorBefore === undefined ||
		readEditedWithin === undefined ||
		readIsEmpty === undefined ||
		readSiblings === undefined ||
		readSources === undefined
	)
		throw new Error(ARENA_FEATURE_REFUSED);
	return {
		format,
		owner: engine.handle,
		kinds,
		words: (length) => builtWords.call(engine, length),
		bytes: (length) => builtBytes.call(engine, length),
		bump: (at) => builtBump.call(engine, at),
		release: (at, held, owned) => releaseBuilt.call(engine, at, held, owned),
		read: (chunk) => readWords.call(engine, chunk) ?? undefined,
		parse: (source) => JSON.parse(parseRecords.call(engine, source)) as ParsedRecords,
		text: (node, start, end) => readText.call(engine, node, start, end),
		query: queryOver(readDescendants.bind(engine), readPlanHolds.bind(engine)),
		reads: {
			snapshotLayouts: (node, holderByte) => readSnapshotLayouts.call(engine, node, holderByte),
			triviaSide: (node, side) => readTriviaSide.call(engine, node, side),
			writeTriviaSide: (node, side, entries) => writeReadTriviaSide.call(engine, node, side, entries),
			unitSides: (node) => readUnitSides.call(engine, node),
			slotLayouts: (node) => readSlotLayouts.call(engine, node),
			slotSeparator: (node) => readSlotSeparator.call(engine, node) ?? undefined,
			separatorBefore: (node) => readSeparatorBefore.call(engine, node) ?? undefined,
			editedWithin: (node, ownSides) => readEditedWithin.call(engine, node, ownSides),
			isEmpty: (node) => readIsEmpty.call(engine, node),
			siblings: (nodes) => readSiblings.call(engine, nodes),
			sources: (nodes) => readSources.call(engine, nodes)
		},
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
		parseTree(source) {
			return engine.diagnostics.parseTree(source);
		},
		parseAndRead(source, options) {
			return engine.diagnostics.parseAndRead(source, options);
		},
		buildProfile: engine.diagnostics.buildProfile,
		builtMemory: engine.diagnostics.builtMemory,
		renderTemplates(node) {
			return engine.diagnostics.renderTemplates(node);
		},
		writeText(path, text, create) {
			return engine.writeText(path, text, create);
		},
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
