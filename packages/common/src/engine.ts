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
import { decodeTree, readObject, type RecordReader, type Siblings, type TreeHandle, type TriviaSideName } from './read.ts';
import { holdReadTree, rootEdges, sourceHandleOf, toNodeData, type KindView } from './node-data.ts';
import { mintTreeToken, registerTree, treeOf } from './tree-token.ts';
import { forEachTriviaList, type TriviaSides } from './trivia.ts';
import type { DescendantBatch } from './query.ts';
import { cellFormatOf, chunkOf, wordOf, type CellFormat } from './record-cell.ts';
import { recordOf, recordStub } from './record-view.ts';

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
	/** The words records fill in chunk `n` of the tree's arena, copied. Present when the addon carries the record codec. */
	chunk?(treeId: number, n: number): Uint32Array;
	/** The kind and subtree end, as `[kind, end]`, a read of tree `treeId` names the node at `index` by. Present when the addon carries the record codec. */
	coordinate?(treeId: number, index: number): number[];
	/** The record at `address` rendered as a render root whose `leading` and `trailing` edges have no neighbour. Present when the addon carries the record codec. */
	renderRecord?(treeId: number, address: number, leading: boolean, trailing: boolean, options?: object): string;
	/** Renders a parsed candidate from its native record, or its recordless coordinate, excluding its outer trivia. */
	renderCandidate?(treeId: number, index: number, address?: number, options?: object): string;
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

export interface NativeModuleLike<
	TNode = unknown,
	TEngine extends NativeEngineLike<TNode> = NativeEngineLike<TNode>
> {
	SittirEngine: new (options?: { options?: object }) => TEngine;
	/** Release one parsed tree of this language. Driven by GC — see `treeDisposalRegistry`. An id that names no tree is ignored. */
	disposeTree(treeId: number): void;
	/** Trees of this language still held on this thread. Diagnostics only. */
	liveTreeCount(): number;
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
 * A tree's record reader over `engine`'s record entry points. Each chunk's copy is kept, and fetched again when a record
 * sought lies past it: a read that appends to a chunk leaves the copy JavaScript holds as it was.
 */
function recordReader<TNode>(engine: NativeEngineLike<TNode>, treeId: number, format: CellFormat, readObjectAt: (index: number, depth: number) => TNode): RecordReader {
	const { readRecord, chunk, renderRecord, coordinate } = engine;
	if (readRecord === undefined || chunk === undefined || renderRecord === undefined || coordinate === undefined) {
		throw new Error('arena node storage needs an addon built with the `arena` feature');
	}
	const copies = new Map<number, Uint32Array>();
	const coordinates = new Map<number, { readonly kind: number; readonly end: number }>();
	return {
		format,
		record: (index, depth) => readRecord.call(engine, treeId, index, depth) ?? undefined,
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
		renderCandidate(index, address) {
			if (engine.renderCandidate === undefined)
				throw new Error('native candidate rendering needs an addon with renderCandidate');
			return engine.renderCandidate(treeId, index, address);
		},
		render: (address, leading, trailing) => renderRecord.call(engine, treeId, address, leading, trailing),
		object: (index, depth = 1) => readObjectAt(index, depth),
		words(address, length) {
			const n = chunkOf(address, format);
			const end = wordOf(address, format) + length;
			let copy = copies.get(n);
			if (copy === undefined || copy.length < end) {
				copy = chunk.call(engine, treeId, n);
				copies.set(n, copy);
			}
			if (copy.length < end) throw new Error(`tree ${treeId}'s chunk ${n} holds ${copy.length} words, short of a record that ends at word ${end}`);
			return copy;
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

	const cellFormat = options?.nodeStorage === 'arena' ? cellFormatOf(status.native) : undefined;
	if (options?.nodeStorage === 'arena' && cellFormat === undefined) {
		return { engine: null, reason: 'arena node storage needs an addon built with the `arena` feature' };
	}

	try {
		const engine = new status.native.SittirEngine(options?.options === undefined ? undefined : { options: options.options });
		const kindView: KindView = {
			isWrapper: (kindId) => config.rebuildWrappers.has(kindId)
		};

		function renderNativeNode(node: AnyUntypedNode | number, opts?: RenderOptions<O>): Rendered {
			const perCall = opts?.options;
			const holdsTrees = (): unknown => node;
			// A view is never edited (a write goes through its row and returns
			// an object node), so it renders as the record it reads.
			const record = typeof node === 'number' ? undefined : recordOf(node);
			if (record !== undefined) {
				const tree = treeOf(node as object);
				const treeId = tree?.id;
				if (tree?.records === undefined || treeId === undefined)
					throw new Error('a record view renders through the tree it was read from, which is gone');
				const renderRecord = engine.renderRecord;
				if (renderRecord === undefined)
					throw new Error('arena node storage needs an addon built with the `arena` feature');
				const changed = rootEdges(node as object);
				return createRenderHandle(() => {
					holdsTrees();
					return renderRecord.call(engine, treeId, record, changed.leading, changed.trailing, perCall);
				});
			}
			// The projection is the one place a node's storage wins over the
			// coordinate it read in with: it crosses here, on every render
			// path, so a caller handing over raw read data cannot slice a
			// pre-edit span past a rebuilt slot.
			const data = (typeof node === 'number' ? node : toNodeData(node, kindView)) as TNode;
			// The tree the node was read from, or rebuilt from, is the layer of
			// options its source inferred; a built node has none.
			const handle = typeof node === 'number' ? undefined : sourceHandleOf(node);
			const treeId = handle === undefined ? undefined : decodeTree(handle);
			// The handle renders lazily, and the data's coordinates are
			// numbers: the tokens stayed on `node`. Both closures name `node`,
			// so the handle holds the trees it will slice for as long as it
			// can still render.
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
				render(node, opts) {
					return renderNativeNode(node, opts);
				},

				dispose() {
					engine.dispose();
				},

				diagnostics: {
					buildProfile: engine.buildProfile,
					parseAndRead(source: string, parseOptions?: ParseOptions) {
						const parsed = JSON.parse(engine.parse(source)) as NativeParseResult;
						// Held by `read` below and by every parsed object a read
						// returns, so it stays reachable exactly as long as
						// something can still read from this tree or names it.
						// Its collection is what releases the tree.
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
						// Under arena storage a node with a record reads as its
						// record's stub, which the wrap table makes a view; a
						// leaf or an ERROR node has none and reads as an object.
						const readAt = (index: number, depth: number): TNode => {
							const at = records?.record(index, depth);
							if (at === undefined) return readObjectAt(index, depth);
							const stub = recordStub(tree, at);
							holdReadTree(stub, liveToken);
							return stub as TNode;
						};
						// One root per depth: the first root read seeds it, and a
						// root asked for at another depth is read once.
						const roots = new Map<number, unknown>();
						const tree: TreeHandle = {
							id: parsed.treeId,
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
							triviaSide: (index, side) => {
								const entries = engine.triviaSide(parsed.treeId, index, side);
								holdReadTree(entries, liveToken);
								return entries;
							},
							writeTriviaSide: (index, side, entries) => engine.writeTriviaSide(parsed.treeId, index, side, entries),
							unitSides: (index) => {
								const units = engine.unitSides(parsed.treeId, index);
								for (const unit of units) forEachTriviaList(unit as TriviaSides<unknown>, (entries) => holdReadTree(entries, liveToken));
								return units;
							},
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
						// The parse's error regions ride beside the root and are stamped here.
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

export function nativeLanguageEngine<API extends LanguageAPI, IndentChar extends string = never>(
	engine: SittirEngine<AnyUntypedNode, API['options'], IndentChar>
): NativeLanguageEngine<API> {
	return {
		render(node, options) {
			return options === undefined || Object.keys(options).length === 0 ? engine.render(node) : engine.render(node, { options });
		},
		parseAndRead(source, options) {
			return engine.diagnostics.parseAndRead(source, options);
		},
		buildProfile: engine.diagnostics.buildProfile,
		dispose() {
			engine.dispose();
		}
	};
}
