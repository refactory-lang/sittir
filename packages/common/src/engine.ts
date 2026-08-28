import { writeFileSync } from 'node:fs';
import type { AnyNodeData, Edit, FormatRecord } from '@sittir/types';
import type { TreeHandle } from './readNode.ts';

export interface EngineOptions {
	readonly format?: FormatRecord;
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
	render(node: TTransport): string;
	renderToFile?(node: TTransport, path: string): void;
	applyEdits(source: string, edits: { startPos: number; endPos: number; insertedText: string }[]): string;
	dispose(): void;
}

export interface NativeModuleLike<
	TTransport = unknown,
	TEngine extends NativeEngineLike<TTransport> = NativeEngineLike<TTransport>
> {
	SittirEngine: new (options?: { format?: string }) => TEngine;
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
export interface EngineDiagnostics<TRoot extends AnyNodeData = AnyNodeData> {
	parseAndRead(source: string, options?: ParseOptions): ParseAndReadResult<TRoot>;
	readNode(handle: number, childIndex?: number, options?: ParseOptions): AnyNodeData;
}

export interface SittirEngineLike<TRoot extends AnyNodeData = AnyNodeData> {
	render(node: AnyNodeData, options?: { ignoreFormat?: boolean }): RenderHandle;
	applyEdits(source: string, edits: readonly Edit[]): string;
	dispose(): void;
	readonly diagnostics: EngineDiagnostics<TRoot>;
}

export interface ParseAndReadResult<TRoot extends AnyNodeData = AnyNodeData> {
	root: TRoot;
	tree: TreeHandle;
}

interface NativeParseResultShape {
	readonly nodeData: AnyNodeData;
	readonly format?: FormatRecord;
}

/**
 * Tagged-union result for `createNativeEngine` — mirrors the
 * `loadNativeEngineForGrammar` pattern in
 * `packages/tools/src/validate/common.ts`: `engine: null` always carries a
 * `reason` string (the real failure cause) instead of discarding it.
 */
export type CreateNativeEngineResult<TRoot extends AnyNodeData = AnyNodeData> =
	| { readonly engine: SittirEngineLike<TRoot>; readonly reason?: undefined }
	| { readonly engine: null; readonly reason: string };

export function createNativeEngine<
	TRoot extends AnyNodeData = AnyNodeData,
	TTransport = unknown,
	TModule extends NativeModuleLike<TTransport> = NativeModuleLike<TTransport>
>(config: GrammarEngineConfig<TTransport, TModule>, options?: EngineOptions): CreateNativeEngineResult<TRoot> {
	const status = config.getActiveBackend();
	if (status.name !== 'native') {
		return { engine: null, reason: status.reason ?? `active backend is '${status.name}', not 'native'` };
	}

	try {
		const nativeOptions = options?.format ? { format: JSON.stringify(options.format) } : undefined;
		const engine = new status.native.SittirEngine(nativeOptions);

		function renderNativeNode(
			node: Parameters<SittirEngineLike['render']>[0],
			opts?: Parameters<SittirEngineLike['render']>[1]
		): RenderHandle {
			if (opts?.ignoreFormat === true) {
				throw new Error(
					'ignoreFormat option not yet supported by native engine. ' +
						'Native is the only backend — omit ignoreFormat (or pass false) ' +
						'until Task 4 (engine-owned format state) lands.'
				);
			}
			return createRenderHandle(
				() => engine.render(node as TTransport),
				(path) => {
					if (engine.renderToFile) {
						engine.renderToFile(node as TTransport, path);
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
						// root kind for a whole-source parse.
						const root = parsed.nodeData as TRoot;
						return {
							root,
							tree: {
								get rootNode(): never {
									throw new Error('rootNode unavailable on native engine handle; use tree.read()');
								},
								source,
								read: (handle, childIndex, deep) => {
									if (handle === undefined) return root;
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
