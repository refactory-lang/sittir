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
	Rendered,
	SlotLayoutWire,
	UnitSidesWire,
	WireNode
} from '@sittir/types';
import { decodeIndex, decodeTree, readObject, type TreeHandle, type TriviaSideName } from './read.ts';
import { coordinateIndex, coordinateOf, holdReadTree, rootEdges, toNodeData, type KindView, type ReadOutput } from './node-data.ts';
import { mintTreeToken, registerTree, treeOf } from './tree-token.ts';
import type { DescendantBatch, TreeQuery } from './query.ts';
import { cellFormatOf, type CellFormat } from './record-cell.ts';
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

/** The level count a read takes: one by default. */
function depthOf(options: ParseOptions | undefined): number {
	return options?.depth ?? 1;
}

/** How much of a parsed tree's layout it stores apart from its read-time options (`NativeEngineLike.storedLayout`). */
export interface StoredLayout {
	readonly slots: number;
}

/** Whether the records a read of a source leaves answer its nodes as its tree does (`NativeEngineLike.backerParity`). */
export interface BackerParity {
	readonly nodes: number;
	readonly differing: number;
	readonly first?: number;
}

/** The work a tree's layout reads have done so far (`NativeEngineLike.layoutWork`), each count as the addon's `LayoutWork` names it. */
export interface LayoutWork {
	readonly cursorClimbs: number;
	readonly siblingSteps: number;
	readonly rootDescents: number;
	readonly depthNodes: number;
	readonly treeReads: number;
}

export interface NativeEngineLike<TNode = unknown> {
	/** The handle of the engine's state its module's engine functions take. */
	readonly handle: EngineHandle;
	/**
	 * Parse `source` and keep its tree, adopting its style as the engine's options under `options.adoptStyle`.
	 *
	 * @returns JSON `{ treeId, errors }`: the id {@link read} and `disposeTree` take, and the parse's error regions.
	 */
	parse(source: string, options?: ParseOptions): string;
	/**
	 * Read the node at descendant `index` of tree `treeId` into its native node, `depth` levels down
	 * (one when absent, `Infinity` for every level); index 0 is the root.
	 *
	 * @throws when the tree is not live, `index` is past its last node, or the grammar's model has no
	 *   route for a child, naming the kind, the child and the index.
	 */
	read(treeId: number, index: number, depth?: number): WireNode<TNode & ReadOutput>;
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
	triviaSide(treeId: number, index: number, side: TriviaSideName): WireNode<ReadOutput>[];
	/**
	 * Replaces `side` of the node at descendant `index` of tree `treeId` with `entries`.
	 *
	 * @throws as {@link triviaSide} does.
	 */
	writeTriviaSide(treeId: number, index: number, side: TriviaSideName, entries: readonly WireNode[]): void;
	/**
	 * The sides of the unit children of the node at descendant `index` of tree `treeId`, which their
	 * slots store as bare kinds: each `{ slot, item, leading?, trailing?, inner? }`, by its slot's
	 * wire key and its item in that slot.
	 *
	 * @throws as {@link triviaSide} does.
	 */
	unitSides(treeId: number, index: number): UnitSidesWire<ReadOutput>[];
	/**
	 * Replaces each side `units` gives of a unit child of the node at descendant `index` of tree
	 * `treeId`, the unit named by its slot's wire key and its item there; the unit sides `units`
	 * does not give stay.
	 *
	 * @throws as {@link writeTriviaSide} does, and for a unit no child of the node is.
	 */
	writeUnitSides(treeId: number, index: number, units: readonly UnitSidesWire[]): void;
	/**
	 * The stored layout of each list slot of the node at descendant `index` of tree `treeId` that
	 * stores any: each `{ slot, before?, after?, separator? }`, by its slot's wire key.
	 *
	 * @throws as {@link triviaSide} does.
	 */
	slotLayouts(treeId: number, index: number): SlotLayoutWire[];
	/**
	 * The separator the list at descendant `index` of tree `treeId` writes between its items, as a
	 * grammar id: the one its source spells where its slot stores one, else the one the read-time
	 * options render; `null` for a node that is no list.
	 *
	 * @throws as {@link triviaSide} does.
	 */
	slotSeparator(treeId: number, index: number): number | null;
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
	/** A new zeroed chunk of `length` words of the engine's built arena, over its native memory, its number, and its meta, where its entries' counts are kept, with the chunk it sealed and that chunk's meta, now sized for its entries. Present when the addon carries the record codec. */
	builtWords?(length: number): { chunk: number; data: WritableWords; meta: Uint8Array; freed: number[]; sealed?: { chunk: number; meta: Uint8Array } };
	/** A new zeroed chunk of `length` bytes of the engine's built arena's strings, over its native memory, its number, and its meta, its cell count. Present when the addon carries the record codec. */
	builtBytes?(least: number): { chunk: number; data: Uint8Array; meta: Uint8Array; freed: number[] };
	/** `more` counts more of the built entry at `address`, whose count saturated. Present when the addon carries the record codec. */
	builtBump?(address: number, more: number): void;
	/** One more count of the built entry at `address`, whose count saturated, told to native before the next engine function runs. Present when the addon carries the record codec. */
	holdSaturated?(address: number): void;
	/** Releases a count of the entry at `address` of form `held`, a builder's or a read's, whose count the caller already dropped to zero when `held` carries the format's `dropped` tag. The releases cross to native in one call before the next engine function runs, at the end of the microtask, or when the engine is disposed, whichever comes first, and a refusal surfaces on that engine function or on dispose. Present when the addon carries the record codec. */
	releaseBuilt?(address: number, held: number): void;
	/** Crosses the releases and the holds past a saturated count waiting in JavaScript to native now, as the next engine function would, throwing a refusal one of them met. Present when the addon carries the record codec. */
	crossReleases?(): void;
	/** Parses `source` and keeps no tree, adopting its style as the engine's options under `options.adoptStyle`: as JSON `{ root, source, errors }`, the address of the root's record in the built arena, null when its reader writes none, the address of the source's entry, and its error regions. Present when the addon carries the record codec. */
	parseRecords?(source: string, options?: ParseOptions): string;
	/** Chunk `chunk` of the built arena, which a read wrote, over its native memory with no copy, with its meta: `data` for a chunk of its records, `bytes` for a chunk of its sources; null for a chunk no read wrote. Present when the addon carries the record codec. */
	readWords?(chunk: number): { data: WritableWords; meta: Uint8Array } | { bytes: Uint8Array; meta: Uint8Array } | null;
	/** `renderAt` for the node a read left in the built arena that the key `node` names, from the arena alone. Present when the addon carries the record codec. */
	readRenderAt?(node: number, leading: boolean, trailing: boolean, options?: object, templates?: boolean): string;
	/** `descendants` for a node a read left records of in the built arena: `from` and the batch name nodes as `{ $node, $site? }`. Present when the addon carries the record codec. */
	readDescendants?: NativeEngineLike['descendants'];
	/** `planHolds` for nodes a read left records of in the built arena, named as `{ $node, $site? }`. Present when the addon carries the record codec. */
	readPlanHolds?: NativeEngineLike['planHolds'];
	/** `snapshotLayouts` for the node a read left in the built arena that the key `node` names, each pair's node by its key. Present when the addon carries the record codec. */
	readSnapshotLayouts?(node: number, holderByte?: number): [number, object][];
	/** `triviaSide` for the node a read left in the built arena that the key `node` names. Present when the addon carries the record codec. */
	readTriviaSide?(node: number, side: string): WireNode<ReadOutput>[];
	/** `writeTriviaSide` for the node a read left in the built arena that the key `node` names. Present when the addon carries the record codec. */
	writeReadTriviaSide?(node: number, side: string, entries: readonly WireNode[]): void;
	/** `unitSides` for the node a read left in the built arena that the key `node` names. Present when the addon carries the record codec. */
	readUnitSides?(node: number): UnitSidesWire<ReadOutput>[];
	/** The three trivia sides of the node a read left in the built arena that the key `node` names, from one read of its source's records. Present when the addon carries the record codec. */
	readSides?(node: number): { leading: WireNode<ReadOutput>[]; trailing: WireNode<ReadOutput>[]; inner: WireNode<ReadOutput>[] };
	/** `slotLayouts` for the node a read left in the built arena that the key `node` names. Present when the addon carries the record codec. */
	readSlotLayouts?(node: number): SlotLayoutWire[];
	/** `slotSeparator` for the node a read left in the built arena that the key `node` names. Present when the addon carries the record codec. */
	readSlotSeparator?(node: number): number | null;
	/** `isEmpty` for the node a read left in the built arena that the key `node` names. Present when the addon carries the record codec. */
	readIsEmpty?(node: number): boolean;
	/** The bytes the built arena's chunks take, and of them its counts'. Present when the addon carries the record codec. */
	builtMemory?(): { chunks: number; counts: number; live: number };
	/** Refuses, by name, a runtime that does not allow external array buffers. Present when the addon carries the record codec. */
	externalBuffers?(): void;
	renderBuilt?(owner: object, address: number, leading: boolean, trailing: boolean, options?: object): string;
	/** {@link renderBuilt}'s text, and for a record a read left what {@link readSides} answers for it, from the same read of its source's records; `sides` is absent for a built record. Present when the addon carries the record codec. */
	renderBuiltSides?(owner: object, address: number, leading: boolean, trailing: boolean, options?: object): { text: string; sides?: ReturnType<NonNullable<NativeEngineLike['readSides']>> };
	renderBuiltLeaf?(
		owner: object,
		kind: number,
		entry: number,
		sides: object | null,
		leading: boolean,
		trailing: boolean,
		options?: object
	): string;
	/** {@link renderBuilt}'s text written to `path`, answering whether it wrote. Present when the addon carries the record codec. */
	renderBuiltToFile?(owner: object, address: number, leading: boolean, trailing: boolean, path: string, create: boolean, options?: object): boolean;
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
	writeBuiltTriviaSide?(address: number, side: TriviaSideName, entries: readonly WireNode[]): void;
	writeBuiltUnitSides?(address: number, units: readonly UnitSidesWire[]): void;
	writeBuiltLeafSide?(sites: readonly number[], side: TriviaSideName, entries: readonly WireNode[]): void;
	copyBuiltSites?(from: number, to: number, skip: readonly number[]): void;
	/**
	 * How much of its layout tree `treeId` stores apart from the options in effect when it was read:
	 * the list slots that store a layout, and the items that store their own separator. A diagnostic.
	 *
	 * @throws when the tree is not live.
	 */
	storedLayout(treeId: number): StoredLayout;
	/**
	 * The work tree `treeId`'s layout reads have done so far: the items its sibling lookups visited, the levels
	 * its lookup cursors climbed and the siblings they stepped across, the moves its trivia placement made down
	 * from its cursor's node, the nodes its depth moves walked, and the times a call was handed its tree. A
	 * diagnostic, so a growth test compares counts, not times.
	 *
	 * @throws when the tree is not live.
	 */
	layoutWork(treeId: number): LayoutWork;
	/**
	 * Parses `source` as a tree and as the records a read of it leaves, then compares each node of the tree with
	 * the node the records answer in its place: the nodes compared, how many differ, and the first that does. The
	 * read's records stay in the engine's arena. A diagnostic. Present when the addon carries the record codec.
	 *
	 * @throws when the engine is in use or disposed, or the read is refused.
	 */
	backerParity?(source: string): BackerParity;
	/**
	 * What the records of the read holding the node keyed `node` store of their layout apart from its read-time
	 * options, as `storedLayout` answers for a tree. A diagnostic. Present when the addon carries the record codec.
	 *
	 * @throws when the engine is disposed, or no read's record holds `node`.
	 */
	readStoredLayout?(node: number): StoredLayout;
	descendants(
		from: string,
		kinds: number[] | undefined | null,
		resume: number[] | undefined | null,
		limit: number,
		plan?: string | null,
		depth?: number | null
	): string;
	planHolds(addresses: string, plan: string): boolean[];
	render(node: WireNode, options?: object): string;
	/** The node at descendant `index` of tree `treeId` rendered as a render root whose `leading` and `trailing` edges have no neighbour, as {@link render} renders the node a read of it gives; `templates` renders it and every node under it that has a record from its template, each leaf and unit as its source. */
	renderAt(treeId: number, index: number, leading: boolean, trailing: boolean, options?: object, templates?: boolean): string;
	/** {@link render}'s text written to `path`: a new file when `create`, refusing a file at the path, and otherwise a replacement that leaves a file already holding the text untouched. Answers whether it wrote. */
	renderToFile(node: WireNode, path: string, create: boolean, options?: object): boolean;
	/** `text` written to `path` as {@link renderToFile} writes a render's text, answering whether it wrote. */
	writeText(path: string, text: string, create: boolean): boolean;
	/** The profile build-native built the binary with; `undefined` for a binary build-native didn't build. */
	readonly buildProfile?: EngineDiagnostics['buildProfile'];
	dispose(): void;
}

/** The handle of a native engine's state (`NativeEngineInstance.handle`) that its module's engine functions take first. */
export type EngineHandle = object;

/** A native `SittirEngine`: its lifecycle and parse, and the handle its module's engine functions take. */
export interface NativeEngineInstance {
	readonly handle: EngineHandle;
	parse(source: string, options?: ParseOptions): string;
	dispose(): void;
	readonly buildProfile?: EngineDiagnostics['buildProfile'];
}

const TREE_FUNCTIONS = [
	'read',
	'snapshotLayouts',
	'triviaSide',
	'writeTriviaSide',
	'unitSides',
	'writeUnitSides',
	'slotLayouts',
	'slotSeparator',
	'isEmpty',
	'text',
	'storedLayout',
	'layoutWork',
	'descendants',
	'planHolds',
	'externalBuffers',
	'writeText'
] as const satisfies readonly (keyof NativeEngineLike)[];

const ENGINE_FUNCTIONS = [
	'backerParity',
	'readStoredLayout',
	'render',
	'renderAt',
	'renderToFile',
	'renderBuilt',
	'renderBuiltSides',
	'renderBuiltToFile',
	'renderBuiltLeaf',
	'renderBuiltLeafToFile',
	'builtWords',
	'builtBytes',
	'builtBump',
	'parseRecords',
	'readWords',
	'readRenderAt',
	'readDescendants',
	'readPlanHolds',
	'readSnapshotLayouts',
	'readTriviaSide',
	'writeReadTriviaSide',
	'readUnitSides',
	'readSides',
	'readSlotLayouts',
	'readSlotSeparator',
	'readIsEmpty',
	'builtMemory',
	'writeBuiltTriviaSide',
	'writeBuiltUnitSides',
	'writeBuiltLeafSide',
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
	engineStamp(): { readonly stamp: string; readonly path?: string };
} & Pick<NativeEngineLike<TNode>, TreeFunction> & { readonly [F in EngineFunction]?: OnHandle<NonNullable<NativeEngineLike<TNode>[F]>> } & {
	/** Releases each entry `batch` names, as pairs of its address and its form, the form carrying the format's `dropped` tag for an entry whose count the caller already dropped to zero. Every entry is released and the first refusal is thrown. Present when the addon carries the record codec. */
	readonly releaseBuilt?: (handle: EngineHandle, batch: Float64Array) => void;
};

/**
 * A new engine of `native`, as {@link NativeEngineLike}: its module's tree functions as they are, and its engine
 * functions bound to the engine's handle.
 */
export function nativeEngineOf<TNode, TEngine extends NativeEngineInstance>(native: NativeModuleLike<TNode, TEngine>, options?: { options?: object }): NativeEngineLike<TNode> {
	const instance = new native.SittirEngine(options);
	const { handle } = instance;
	const { builtBump, releaseBuilt } = native;
	const heldPast = new Map<number, number>();
	let releases = new Float64Array(256);
	let released = 0;
	let crossing = false;
	let refused: { readonly error: unknown } | undefined;
	const cross = (): void => {
		for (const [address, more] of heldPast) {
			heldPast.delete(address);
			builtBump!(handle, address, more);
		}
		if (released === 0) return;
		const batch = releases.subarray(0, released);
		released = 0;
		releaseBuilt!(handle, batch);
	};
	const crossAtTheEnd = (): void => {
		crossing = false;
		try {
			cross();
		} catch (error) {
			refused ??= { error };
		}
	};
	const settled = (): void => {
		if (heldPast.size !== 0 || released !== 0) cross();
		if (refused === undefined) return;
		const { error } = refused;
		refused = undefined;
		throw error;
	};
	const release = (address: number, held: number): void => {
		if (released + 2 > releases.length) {
			const grown = new Float64Array(releases.length * 2);
			grown.set(releases);
			releases = grown;
		}
		releases[released] = address;
		releases[released + 1] = held;
		released += 2;
		if (crossing) return;
		crossing = true;
		queueMicrotask(crossAtTheEnd);
	};
	const engine: Record<string, unknown> = {
		handle,
		buildProfile: instance.buildProfile,
		parse: (source: string, options?: ParseOptions) => {
			settled();
			return instance.parse(source, options);
		},
		dispose: () => {
			try {
				if (released !== 0 || refused !== undefined) settled();
			} finally {
				heldPast.clear();
				released = 0;
				refused = undefined;
				instance.dispose();
			}
		},
		holdSaturated: builtBump && ((address: number) => void heldPast.set(address, (heldPast.get(address) ?? 0) + 1)),
		releaseBuilt: releaseBuilt && release,
		crossReleases: releaseBuilt && settled
	};
	for (const name of TREE_FUNCTIONS) engine[name] = native[name];
	for (const name of ENGINE_FUNCTIONS) {
		const call = native[name] as ((...args: unknown[]) => unknown) | undefined;
		engine[name] =
			call &&
			((...args: unknown[]) => {
				settled();
				return call(handle, ...args);
			});
	}
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

		const parseTree = (source: string, parseOptions?: ParseOptions): TreeHandle => {
			const parsed = JSON.parse(engine.parse(source, parseOptions)) as NativeParseResult;
			const liveToken = mintTreeToken(parsed.treeId);
			treeDisposalRegistry.register(liveToken, {
				release: status.native.disposeTree,
				treeId: parsed.treeId
			});
			const readObjectAt = (index: number, depth: number): WireNode<ReadOutput> => {
				const node = engine.read(parsed.treeId, index, depth);
				if (typeof node === 'object') holdReadTree(node, liveToken);
				return node;
			};
			const roots = new Map<number, unknown>();
			const errors = Object.freeze(parsed.errors);
			const tree: TreeHandle = {
				id: parsed.treeId,
				token: liveToken,
				text: (span) => engine.text(parsed.treeId, span),
				read: (index, depth = 1) => {
					if (index !== 0) return readObjectAt(index, depth);
					let cached = roots.get(depth);
					if (cached === undefined) {
						cached = Object.assign(readObject(readObjectAt(0, depth), 'the root'), { $errors: errors });
						roots.set(depth, cached);
					}
					return cached;
				},
				errors,
				snapshotLayouts: (index, holderByte) => engine.snapshotLayouts(parsed.treeId, index, holderByte),
				triviaSide: (index, side) => readOwnEntries(tree, engine.triviaSide(parsed.treeId, index, side), liveToken),
				writeTriviaSide: (index, side, entries) => engine.writeTriviaSide(parsed.treeId, index, side, entries),
				unitSides: (index) => readOwnUnits(tree, engine.unitSides(parsed.treeId, index), liveToken),
				writeUnitSides: (index, units) => engine.writeUnitSides(parsed.treeId, index, units),
				slotLayouts: (index) => engine.slotLayouts(parsed.treeId, index),
				slotSeparator: (index) => engine.slotSeparator(parsed.treeId, index) ?? undefined,
				isEmpty: (index) => engine.isEmpty(parsed.treeId, index),
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
			return readRenderAt.call(engine, coordinateIndex(named, treeOf(node)?.built?.format.nodeId), changed.leading, changed.trailing, options, templates);
		}

		function renderTemplates(node: AnyUntypedNode): string {
			const at = coordinateOf(node);
			if (at === undefined) throw new Error('renderTemplates renders a node as a read gave it, and this one was built or edited');
			const changed = rootEdges(node);
			if ('$node' in at) return readRendered(node, at, undefined, true);
			return engine.renderAt(decodeTree(at.$treeHandle), decodeIndex(at.$treeHandle), changed.leading, changed.trailing, undefined, true);
		}

		function renderNativeNode(node: AnyUntypedNode | number, opts?: RenderOptions<O>): Rendered {
			const perCall = opts?.options;
			const holdsTrees = (): unknown => node;
			const built = typeof node === 'number' ? undefined : builtRefOf(node);
			if (built !== undefined) {
				const changed = rootEdges(node as object);
				const { renderBuilt, renderBuiltSides, renderBuiltLeaf, renderBuiltToFile, renderBuiltLeafToFile } = engine;
				if (renderBuilt === undefined || renderBuiltSides === undefined || renderBuiltLeaf === undefined || renderBuiltToFile === undefined || renderBuiltLeafToFile === undefined)
					throw new Error(ARENA_FEATURE_REFUSED);
				const at = built.at;
				if (at !== undefined) {
					const settled = (): number => {
						built.arena.refuseRender(at);
						built.arena.settle();
						return at;
					};
					const text = (): string => {
						const record = settled();
						if (!built.arena.wantsSides(record)) return renderBuilt.call(engine, built.arena.owner, record, changed.leading, changed.trailing, perCall);
						const rendered = renderBuiltSides.call(engine, built.arena.owner, record, changed.leading, changed.trailing, perCall);
						if (rendered.sides !== undefined) built.arena.keepSides(record, rendered.sides);
						return rendered.text;
					};
					return createRenderHandle(
						text,
						(path, create) => renderBuiltToFile.call(engine, built.arena.owner, settled(), changed.leading, changed.trailing, path, create, perCall),
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
			const named = typeof node === 'number' ? undefined : coordinateOf(node);
			if (named !== undefined && '$node' in named) {
				const text = (): string => readRendered(node as object, named, perCall, false);
				return createRenderHandle(text, (path, create) => writeText(path, text(), create), writeText);
			}
			const data = typeof node === 'number' ? node : toNodeData(node, kindView);
			return createRenderHandle(
				() => {
					holdsTrees();
					return engine.render(data, perCall);
				},
				(path, create) => {
					holdsTrees();
					return engine.renderToFile(data, path, create, perCall);
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
					const read = treeOf(node)?.built;
					const arena = handleArenaOf(node) ?? (read?.holdsRootWithoutView(node) ? read : undefined);
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
						const tree = parseTree(source, parseOptions);
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
	const { writeBuiltTriviaSide, writeBuiltUnitSides, writeBuiltLeafSide, copyBuiltSites, builtWords, builtBytes, holdSaturated, releaseBuilt, crossReleases, parseRecords, readWords, readDescendants, readPlanHolds, readSnapshotLayouts, writeReadTriviaSide, readSides, readUnitSides, readSlotLayouts, readSlotSeparator, readIsEmpty } = engine;
	if (
		holdSaturated === undefined ||
		releaseBuilt === undefined ||
		crossReleases === undefined ||
		writeBuiltTriviaSide === undefined ||
		writeBuiltUnitSides === undefined ||
		writeBuiltLeafSide === undefined ||
		copyBuiltSites === undefined ||
		builtWords === undefined ||
		builtBytes === undefined ||
		parseRecords === undefined ||
		readWords === undefined ||
		readDescendants === undefined ||
		readPlanHolds === undefined ||
		readSnapshotLayouts === undefined ||
		writeReadTriviaSide === undefined ||
		readSides === undefined ||
		readUnitSides === undefined ||
		readSlotLayouts === undefined ||
		readSlotSeparator === undefined ||
		readIsEmpty === undefined
	)
		throw new Error(ARENA_FEATURE_REFUSED);
	return {
		format,
		owner: engine.handle,
		kinds,
		words: (length) => builtWords.call(engine, length),
		bytes: (least) => builtBytes.call(engine, least),
		bump: (at) => holdSaturated.call(engine, at),
		release: (at, held) => releaseBuilt.call(engine, at, held),
		cross: () => crossReleases.call(engine),
		read: (chunk) => readWords.call(engine, chunk) ?? undefined,
		parse: (source, options) => JSON.parse(parseRecords.call(engine, source, options)) as ParsedRecords,
		query: queryOver(readDescendants.bind(engine), readPlanHolds.bind(engine)),
		reads: {
			snapshotLayouts: (node, holderByte) => readSnapshotLayouts.call(engine, node, holderByte),
			sides: (node) => readSides.call(engine, node),
			unitSides: (node) => readUnitSides.call(engine, node),
			writeTriviaSide: (node, side, entries) => writeReadTriviaSide.call(engine, node, side, entries),
			slotLayouts: (node) => readSlotLayouts.call(engine, node),
			slotSeparator: (node) => readSlotSeparator.call(engine, node) ?? undefined,
			isEmpty: (node) => readIsEmpty.call(engine, node)
		},
		trivia: {
			writeTriviaSide: (at, side, entries) => writeBuiltTriviaSide.call(engine, at, side, entries),
			writeUnitSides: (at, units) => writeBuiltUnitSides.call(engine, at, units),
			writeLeafSide: (sites, side, entries) => writeBuiltLeafSide.call(engine, sites, side, entries),
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
		parseTree(source, options) {
			return engine.diagnostics.parseTree(source, options);
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
