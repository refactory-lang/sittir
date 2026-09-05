import { writeFileSync } from 'node:fs';
import type { AnyNodeData, Edit, FormatRecord } from '@sittir/types';
import type { TreeHandle } from './readNode.ts';

/** The options object a grammar package types as its `Options`. */
export type RenderOptionValues = Readonly<Record<string, unknown>>;

export interface EngineOptions<O extends object = RenderOptionValues> {
	readonly format?: FormatRecord;
	/** Render options, resolved once by the native engine against the grammar's site table. */
	readonly options?: O;
}

export interface RenderOptions<O extends object = RenderOptionValues> {
	readonly ignoreFormat?: boolean;
	/** Per-call options, resolved over the engine's own. */
	readonly options?: O;
}

export interface RenderHandle {
	save(path: string): void;
	toString(): string;
	print(): string;
}

export function createRenderHandle(renderText: () => string, saveImpl?: (path: string) => boolean): RenderHandle {
	let cached: string | undefined;
	function getText(): string {
		if (cached === undefined) cached = renderText();
		return cached;
	}
	return {
		save(path: string): void {
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
		}
	};
}

export interface NativeEngineLike<TTransport = unknown> {
	parseAndRead(source: string, deep?: boolean): string;
	readNode(handle: number, childIndex: number, deep?: boolean): string;
	render(node: TTransport, treeId?: number, options?: string): string;
	renderToFile?(node: TTransport, path: string, treeId?: number, options?: string): void;
	applyEdits(source: string, edits: { startPos: number; endPos: number; insertedText: string }[]): string;
	/** Drop one parsed tree. Driven by GC — see `treeDisposalRegistry`. */
	disposeTree(treeId: number): void;
	/** Trees the native engine still holds. Diagnostics only. */
	readonly liveTreeCount: number;
	dispose(): void;
}

export interface NativeModuleLike<
	TTransport = unknown,
	TEngine extends NativeEngineLike<TTransport> = NativeEngineLike<TTransport>
> {
	SittirEngine: new (options?: { format?: string; options?: string }) => TEngine;
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
	getActiveBackend: () => BackendStatusLike<TModule>;
}

/**
 * How far one read expands.
 *
 * The default is lazy: a read returns one level, and a child with
 * substructure comes back as a stub the accessors expand on demand.
 * `deep` expands the whole subtree in one pass instead — one crossing
 * instead of one per level, at the cost of reading what you may not touch.
 */
export interface ParseOptions {
	readonly deep?: boolean;
}

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
export interface EngineDiagnostics<TRoot extends AnyNodeData = AnyNodeData> {
	parseAndRead(source: string, options?: ParseOptions): ParseAndReadResult<TRoot>;
	readNode(handle: number, childIndex?: number, options?: ParseOptions): AnyNodeData;
}

/**
 * The render half of the public surface: turning node DATA back into source,
 * and the lifecycle that owns the native handle. Deliberately separate from
 * `ParseEngine` so a consumer that only renders can say so in its types —
 * notably each grammar's `boundary.ts`, which node construction reaches
 * through `utils.ts`. Depending on the narrower contract there is what keeps
 * rendering from dragging in the parse surface, and the module graph acyclic.
 */
export interface RenderEngine<O extends object = RenderOptionValues> {
	render(node: AnyNodeData, options?: RenderOptions<O>): RenderHandle;
	applyEdits(source: string, edits: readonly Edit[]): string;
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
export interface SittirEngine<TRoot extends AnyNodeData = AnyNodeData, O extends object = RenderOptionValues>
	extends RenderEngine<O> {
	readonly diagnostics: EngineDiagnostics<TRoot>;
}

/**
 * What a whole-source parse always stamps on its root and on nothing else
 * reliably: the root's span and the captured source text. Every other read
 * node carries both only optionally.
 */
export interface ParsedRoot {
	readonly $span: { start: number; end: number };
	readonly $text: string;
}

export interface ParseAndReadResult<TRoot extends AnyNodeData = AnyNodeData> {
	root: TRoot & ParsedRoot;
	tree: TreeHandle;
}

interface NativeParseResultShape {
	readonly nodeData: AnyNodeData;
	readonly format?: FormatRecord;
	readonly treeId: number;
}

/**
 * Frees a native tree once JavaScript can no longer read from it.
 *
 * Reads are lazy, so a tree has to outlive the call that parsed it: every
 * unexpanded child holds a handle the native side must still be able to
 * answer. Nothing on the JS side knows when the last of those handles is
 * gone — but the garbage collector does. Each tree gets a token that its
 * `read` closure captures, so the token stays reachable exactly as long as
 * the tree handle or any node wrapped against it; when the token is
 * collected, the tree is dropped.
 *
 * The engine is held weakly. A registry entry outlives its tree by
 * definition, and a strong reference here would keep the whole engine —
 * parser included — alive for as long as any entry remained unswept.
 */
const treeDisposalRegistry = new FinalizationRegistry<{
	readonly engineRef: WeakRef<NativeEngineLike<never>>;
	readonly treeId: number;
}>(({ engineRef, treeId }) => {
	// A collected engine has already dropped every tree it owned.
	engineRef.deref()?.disposeTree(treeId);
});

/**
 * Tagged-union result for `createNativeEngine` — mirrors the
 * `loadNativeEngineForGrammar` pattern in
 * `packages/tools/src/validate/common.ts`: `engine: null` always carries a
 * `reason` string (the real failure cause) instead of discarding it.
 */
export type CreateNativeEngineResult<
	TRoot extends AnyNodeData = AnyNodeData,
	O extends object = RenderOptionValues
> =
	| { readonly engine: SittirEngine<TRoot, O>; readonly reason?: undefined }
	| { readonly engine: null; readonly reason: string };

export function createNativeEngine<
	TRoot extends AnyNodeData = AnyNodeData,
	O extends object = RenderOptionValues,
	TTransport = unknown,
	TModule extends NativeModuleLike<TTransport> = NativeModuleLike<TTransport>
>(config: GrammarEngineConfig<TTransport, TModule>, options?: EngineOptions<O>): CreateNativeEngineResult<TRoot, O> {
	const status = config.getActiveBackend();
	if (status.name !== 'native') {
		return { engine: null, reason: status.reason ?? `active backend is '${status.name}', not 'native'` };
	}

	try {
		const nativeOptions = {
			...(options?.format ? { format: JSON.stringify(options.format) } : {}),
			...(options?.options ? { options: JSON.stringify(options.options) } : {})
		};
		const engine = new status.native.SittirEngine(Object.keys(nativeOptions).length > 0 ? nativeOptions : undefined);

		function renderNativeNode(node: AnyNodeData, opts?: RenderOptions<O>): RenderHandle {
			const perCall = opts?.options === undefined ? undefined : JSON.stringify(opts.options);
			if (opts?.ignoreFormat === true) {
				throw new Error(
					'ignoreFormat option not yet supported by native engine. ' +
						'Native is the only backend — omit ignoreFormat (or pass false) ' +
						'until Task 4 (engine-owned format state) lands.'
				);
			}
			return createRenderHandle(
				() => engine.render(node as TTransport, undefined, perCall),
				(path) => {
					if (engine.renderToFile) {
						engine.renderToFile(node as TTransport, path, undefined, perCall);
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

				applyEdits(source, edits) {
					return engine.applyEdits(
						source,
						edits.map((edit) => ({ ...edit }))
					);
				},

				dispose() {
					engine.dispose();
				},

				diagnostics: {
					parseAndRead(source: string, parseOptions?: ParseOptions) {
						const json = engine.parseAndRead(source, parseOptions?.deep);
						const parsed = JSON.parse(json) as NativeParseResultShape;
						// Boundary assertion: the native reader returns the grammar's
						// root kind for a whole-source parse, stamped with its span and
						// the captured source text.
						const root = parsed.nodeData as TRoot & ParsedRoot;
						// Captured by `read` below and by nothing else, so it stays
						// reachable exactly as long as something can still read from
						// this tree. Its collection is what releases the tree.
						const liveToken = { treeId: parsed.treeId };
						treeDisposalRegistry.register(liveToken, {
							engineRef: new WeakRef(engine as NativeEngineLike<never>),
							treeId: parsed.treeId
						});
						return {
							root,
							tree: {
								get rootNode(): never {
									throw new Error('rootNode unavailable on native engine handle; use tree.read()');
								},
								source,
								read: (handle, childIndex, deep) => {
									if (handle === undefined) return root;
									// Handles name their own tree, so this needs no tree
									// argument — but it must keep `liveToken` reachable,
									// or the tree behind those handles can be collected
									// while they are still in use.
									void liveToken;
									const nodeJson = engine.readNode(handle, childIndex ?? 0, deep);
									return JSON.parse(nodeJson) as AnyNodeData;
								},
								format: parsed.format
							} satisfies TreeHandle
						};
					},

					readNode(handle: number, childIndex = 0, parseOptions?: ParseOptions) {
						const json = engine.readNode(handle, childIndex, parseOptions?.deep);
						return JSON.parse(json) as AnyNodeData;
					}
				}
			}
		};
	} catch (e) {
		return { engine: null, reason: e instanceof Error ? e.message : String(e) };
	}
}
