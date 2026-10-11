import { writeFileSync } from 'node:fs';
import type {
	AnyUntypedNode,
	EngineDiagnostics,
	IndentOption,
	LanguageAPI,
	LineGapAddress,
	LineGaps,
	NativeEngineOptions,
	NativeLanguageEngine,
	NativeParseResult,
	ParsedRead,
	ParsedRoot,
	ParseOptions,
	RenderCallOptions,
	Rendered
} from '@sittir/types';
import { readObject, type TreeHandle, type TriviaSideName } from './read.ts';
import { holdReadTree, toTransportData, type TriviaView } from './transport-data.ts';
import { readDerivedSides, readTrivia } from './utils.ts';
import { mintTreeToken, registerTree } from './tree-token.ts';
import type { DescendantBatch } from './query.ts';

/** The options object a grammar package types as its `Options`. */
export type RenderOptionValues = Readonly<Record<string, unknown>>;

export interface RenderOptions<O extends object = RenderOptionValues> extends RenderCallOptions {
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

export interface NativeEngineLike<TTransport = unknown> {
	/**
	 * Parse `source` and keep its tree.
	 *
	 * @returns JSON `{ treeId, format, errors }`: the id {@link read} and `disposeTree` take, the
	 *   format the parse detected, and the parse's error regions.
	 */
	parse(source: string): string;
	/**
	 * Read the node at descendant `index` of tree `treeId` into its transport, `depth` levels down
	 * (one when absent, `Infinity` for every level); index 0 is the root.
	 *
	 * @throws when the tree is not live, `index` is past its last node, or the grammar's model has no
	 *   route for a child, naming the kind, the child and the index.
	 */
	read(treeId: number, index: number, depth?: number): TTransport;
	/**
	 * A snapshot of the node at descendant `index` of tree `treeId`: the node read at every depth into
	 * plain data that names no tree, each node with its span (`$_layout.span`) measured from the start of
	 * the transport that holds it, each placed extra with its text, and the node itself measured from the
	 * byte `holderByte`, or from its own start when absent.
	 *
	 * @throws as {@link read} does.
	 */
	snapshot(treeId: number, index: number, holderByte?: number | null): TTransport;
	/**
	 * The spans of the byte `ranges` (start and end pairs) of tree `treeId`, measured from the byte
	 * `holderByte`, as row and column pairs, flat.
	 *
	 * @throws when the tree is not live, the list has an odd length, or a byte lies past the source or
	 *   before the holder.
	 */
	snapshotSpans(treeId: number, holderByte: number, ranges: number[]): number[];
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
	 * Whether a write replaced a side of a node under the node at descendant `index` of tree `treeId`:
	 * of a descendant or of the node's own `inner`, and of its own leading and trailing too when
	 * `ownSides` is set.
	 *
	 * @throws when the tree is not live or `index` is past its last node.
	 */
	editedWithin(treeId: number, index: number, ownSides: boolean): boolean;
	lineGapsOf(handle: number): string;
	descendants(
		from: string,
		kinds: number[] | undefined | null,
		resume: number[] | undefined | null,
		limit: number,
		plan?: string | null,
		depth?: number | null
	): string;
	planHolds(addresses: string, plan: string): boolean[];
	render(node: TTransport, treeId?: number, options?: object): string;
	renderToFile?(node: TTransport, path: string, treeId?: number, options?: object): void;
	/** The binary's compile profile (`debug` | `release`); absent on a binary that predates the getter. */
	readonly buildProfile?: string;
	dispose(): void;
}

export interface NativeModuleLike<
	TTransport = unknown,
	TEngine extends NativeEngineLike<TTransport> = NativeEngineLike<TTransport>
> {
	SittirEngine: new (options?: { format?: string; options?: object }) => TEngine;
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
	TTransport = unknown,
	TModule extends NativeModuleLike<TTransport> = NativeModuleLike<TTransport>
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
	TTransport = unknown,
	TModule extends NativeModuleLike<TTransport> = NativeModuleLike<TTransport>
>(
	config: GrammarEngineConfig<TTransport, TModule>,
	options?: NativeEngineOptions<O & IndentOption<string, IndentChar>>
): CreateNativeEngineResult<TRoot, O, IndentChar> {
	const status = config.getActiveBackend();
	if (status.name !== 'native') {
		return { engine: null, reason: status.reason ?? `active backend is '${status.name}', not 'native'` };
	}

	try {
		const nativeOptions = {
			...(options?.format ? { format: JSON.stringify(options.format) } : {}),
			...(options?.options ? { options: options.options } : {})
		};
		const engine = new status.native.SittirEngine(Object.keys(nativeOptions).length > 0 ? nativeOptions : undefined);
		const lineGapsOf = (address: LineGapAddress): LineGaps => JSON.parse(engine.lineGapsOf(address.handle)) as LineGaps;
		const triviaView: TriviaView = {
			trivia: (record) => readTrivia(record, lineGapsOf),
			derived: (record) => readDerivedSides(record, lineGapsOf),
			isWrapper: (kindId) => config.rebuildWrappers.has(kindId),
			isList: (kindId) => config.listKinds.has(kindId)
		};

		function renderNativeNode(node: AnyUntypedNode | number, opts?: RenderOptions<O>): Rendered {
			const perCall = opts?.options;
			if (opts?.ignoreFormat === true) {
				throw new Error(
					'ignoreFormat option not yet supported by native engine. ' +
						'Native is the only backend — omit ignoreFormat (or pass false) ' +
						'until Task 4 (engine-owned format state) lands.'
				);
			}
			// The projection is the one place a node's storage wins over the
			// coordinate it read in with: it crosses here, on every render
			// path, so a caller handing over raw read data cannot slice a
			// pre-edit span past a rebuilt slot.
			const transport = (typeof node === 'number' ? node : toTransportData(node, triviaView)) as TTransport;
			// The handle renders lazily, and the transport's coordinates are
			// numbers: the tokens stayed on `node`. Both closures name `node`,
			// so the handle holds the trees it will slice for as long as it
			// can still render.
			const holdsTrees = (): unknown => node;
			return createRenderHandle(
				() => {
					holdsTrees();
					return engine.render(transport, undefined, perCall);
				},
				(path) => {
					holdsTrees();
					if (engine.renderToFile) {
						engine.renderToFile(transport, path, undefined, perCall);
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
					lineGapsOf,
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
						const readAt = (index: number, depth: number): TTransport => {
							const node = engine.read(parsed.treeId, index, depth);
							holdReadTree(node, liveToken);
							return node;
						};
						// The parse's error regions ride beside the root and are stamped here.
						const root = Object.assign(readObject(readAt(0, depthOf(parseOptions)), 'the root'), { $errors: Object.freeze(parsed.errors) }) as TRoot & ParsedRoot;
						// One root per depth: the parse's own read seeds it, and a
						// root asked for at another depth is read once.
						const roots = new Map<number, unknown>([[depthOf(parseOptions), root]]);
						const tree: TreeHandle = {
							source,
							id: parsed.treeId,
							read: (index, depth = 1) => {
								if (index !== 0) return readAt(index, depth);
								let cached = roots.get(depth);
								if (cached === undefined) {
									cached = readAt(0, depth);
									roots.set(depth, cached);
								}
								return cached;
							},
							format: parsed.format,
							snapshot: (index, holderByte) => engine.snapshot(parsed.treeId, index, holderByte),
							snapshotSpans: (holderByte, ranges) => engine.snapshotSpans(parsed.treeId, holderByte, ranges),
							triviaSide: (index, side) => engine.triviaSide(parsed.treeId, index, side),
							writeTriviaSide: (index, side, entries) => engine.writeTriviaSide(parsed.treeId, index, side, entries),
							editedWithin: (index, ownSides) => engine.editedWithin(parsed.treeId, index, ownSides),
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
						return { root, tree };
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
			if (options === undefined) return engine.render(node);
			const { ignoreFormat, ...perCall } = options;
			return engine.render(node, {
				...(ignoreFormat !== undefined ? { ignoreFormat } : {}),
				...(Object.keys(perCall).length > 0 ? { options: perCall } : {})
			});
		},
		parseAndRead(source, options) {
			return engine.diagnostics.parseAndRead(source, options);
		},
		buildProfile: engine.diagnostics.buildProfile,
		lineGapsOf: (handle) => engine.diagnostics.lineGapsOf(handle),
		dispose() {
			engine.dispose();
		}
	};
}
