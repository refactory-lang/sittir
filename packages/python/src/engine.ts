/**
 * Grammar-specific engine factory for @sittir/python.
 *
 * Combines native backend selection (getNativeBackendEngine) with JS fallback
 * (createJsEngine from @sittir/core/engine). Provides a unified engine surface
 * that abstracts over the native/JS dispatch.
 */

import {
	createJsEngine,
	type SittirEngineLike,
	type JsEngineOptions
} from '@sittir/core/engine';
import type { TreeHandle } from '@sittir/core';
import type { AnyNodeData, AnyTreeNode, FormatRecord } from '@sittir/types';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getActiveBackend } from './backend.js';
import { toNativeRenderTransport } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface NativeParseResult {
	readonly nodeData: AnyNodeData;
	readonly format?: FormatRecord;
}

export interface EngineOptions {
	readonly format?: FormatRecord;
}

/**
 * Try to construct a native engine if the backend is active and supports
 * the new engine API (constructor with options + dispose method).
 */
function getNativeBackendEngine(
	options?: EngineOptions
): SittirEngineLike | null {
	const status = getActiveBackend();
	if (status.name !== 'native') return null;

	try {
		const nativeOptions = options?.format
			? { format: JSON.stringify(options.format) }
			: undefined;
		const engine = new status.native.SittirEngine(nativeOptions);

		function renderNativeNode(
			node: Parameters<SittirEngineLike['render']>[0],
			opts?: Parameters<SittirEngineLike['render']>[1]
		): string {
			const transport = toNativeRenderTransport(node);
			// Native engine does not yet support ignoreFormat option (Task 4).
			// Until engine-owned format state is implemented, throw explicitly.
			if (opts?.ignoreFormat === true) {
				throw new Error(
					'ignoreFormat option not yet supported by native engine. ' +
					'Use JS engine or wait for Task 4 (engine-owned format state).'
				);
			}
			return engine.render(transport);
		}

		// Wrap the native engine to match SittirEngineLike interface
		return {
			render(node, opts) {
				return renderNativeNode(node, opts);
			},

			applyEdits(source, edits) {
				return engine.applyEdits(
					source,
					edits.map((e) => ({ ...e }))
				);
			},

			dispose() {
				engine.dispose();
			},

			reader: {
				parseAndRead(source: string) {
					const json = engine.parseAndRead(source);
					const parsed = JSON.parse(json) as NativeParseResult;
					// Native parseAndRead returns { nodeData, format? }
					return {
						root: parsed.nodeData,
						tree: {
							get rootNode(): AnyTreeNode {
								throw new Error(
									'rootNode unavailable on native engine handle; use tree.read()'
								);
							},
							nodeById: () => {
								throw new Error('nodeById unavailable on native engine handle');
							},
							source,
							read: (nodeId) => {
								if (nodeId === undefined) return parsed.nodeData;
								const nodeJson = engine.readNode(nodeId);
								return JSON.parse(nodeJson) as AnyNodeData;
							},
							render: (nodeId, opts) => {
								const node =
									nodeId === undefined
										? parsed.nodeData
										: (JSON.parse(engine.readNode(nodeId)) as AnyNodeData);
								return renderNativeNode(node, opts);
							},
							format: parsed.format
						} satisfies TreeHandle
					};
				},

				readNode(nodeId) {
					const json = engine.readNode(nodeId);
					return JSON.parse(json) as AnyNodeData;
				}
			}
		};
	} catch (error) {
		// If native engine construction fails, fall back to JS
		return null;
	}
}

/**
 * Create a grammar-specific engine instance.
 *
 * Attempts to use the native backend if available; falls back to the JS
 * engine (Nunjucks renderer) otherwise. The JS fallback is renderer-only
 * (no reader) because this package doesn't provide a synchronous JS reader.
 *
 * @param options - Engine configuration (format, etc.)
 * @returns An engine implementing SittirEngineLike.
 */
export function createEngine(options?: EngineOptions): SittirEngineLike {
	const native = getNativeBackendEngine(options);
	if (native) return native;

	// JS fallback - renderer only (no reader)
	const jsOptions: JsEngineOptions = {
		templatesPath: join(__dirname, '..', 'templates'),
		format: options?.format
		// parse omitted: no synchronous JS reader available
	};

	return createJsEngine(jsOptions);
}
