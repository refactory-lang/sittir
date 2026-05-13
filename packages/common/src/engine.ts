import { writeFileSync } from 'node:fs';
import type { AnyNodeData, Edit, FormatRecord } from '@sittir/types';
import type { TreeHandle } from './readNode.ts';
import { assertRenderableNodeData } from './native-boundary.ts';

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
	parseAndRead(source: string): string;
	readNode(handle: number, childIndex: number): string;
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

export type NativeRenderTransportProjector<TTransport = unknown> = (node: AnyNodeData) => TTransport;

export interface GrammarEngineConfig<
	TTransport = unknown,
	TModule extends NativeModuleLike<TTransport> = NativeModuleLike<TTransport>
> {
	templatesPath: string;
	kindNames: ReadonlyMap<number, string>;
	toNativeRenderTransport: NativeRenderTransportProjector<TTransport>;
	getActiveBackend: () => BackendStatusLike<TModule>;
}

export interface SittirEngineReader {
	parseAndRead(source: string): ParseAndReadResult;
	readNode(handle: number, childIndex?: number): AnyNodeData;
}

export interface SittirEngineLike {
	render(node: AnyNodeData, options?: { ignoreFormat?: boolean }): RenderHandle;
	applyEdits(source: string, edits: readonly Edit[]): string;
	dispose(): void;
	readonly reader?: SittirEngineReader;
}

export interface ParseAndReadResult {
	root: AnyNodeData;
	tree: TreeHandle;
}

interface NativeParseResultShape {
	readonly nodeData: AnyNodeData;
	readonly format?: FormatRecord;
}

export function createNativeEngine<
	TTransport = unknown,
	TModule extends NativeModuleLike<TTransport> = NativeModuleLike<TTransport>
>(config: GrammarEngineConfig<TTransport, TModule>, options?: EngineOptions): SittirEngineLike | null {
	const status = config.getActiveBackend();
	if (status.name !== 'native') return null;

	try {
		const nativeOptions = options?.format ? { format: JSON.stringify(options.format) } : undefined;
		const engine = new status.native.SittirEngine(nativeOptions);

		function renderNativeNode(
			node: Parameters<SittirEngineLike['render']>[0],
			opts?: Parameters<SittirEngineLike['render']>[1]
		): RenderHandle {
			assertRenderableNodeData(node);
			if (opts?.ignoreFormat === true) {
				throw new Error(
					'ignoreFormat option not yet supported by native engine. ' +
						'Use JS engine or wait for Task 4 (engine-owned format state).'
				);
			}
			const transport = config.toNativeRenderTransport(node);
			return createRenderHandle(
				() => engine.render(transport),
				(path) => {
					if (engine.renderToFile) {
						engine.renderToFile(transport, path);
						return true;
					}
					return false;
				}
			);
		}

		return {
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

			reader: {
				parseAndRead(source: string) {
					const json = engine.parseAndRead(source);
					const parsed = JSON.parse(json) as NativeParseResultShape;
					const root = parsed.nodeData;
					return {
						root,
						tree: {
							get rootNode(): never {
								throw new Error('rootNode unavailable on native engine handle; use tree.read()');
							},
							source,
							read: (handle, childIndex) => {
								if (handle === undefined) return root;
								const nodeJson = engine.readNode(handle, childIndex ?? 0);
								return JSON.parse(nodeJson) as AnyNodeData;
							},
							render: (handle, opts) => {
								const node = handle === undefined ? root : (JSON.parse(engine.readNode(handle, 0)) as AnyNodeData);
								return renderNativeNode(node, opts).toString();
							},
							format: parsed.format
						} satisfies TreeHandle
					};
				},

				readNode(handle: number, childIndex = 0) {
					const json = engine.readNode(handle, childIndex);
					return JSON.parse(json) as AnyNodeData;
				}
			}
		};
	} catch {
		return null;
	}
}
