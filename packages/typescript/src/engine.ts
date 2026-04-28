/**
 * Grammar-specific engine factory for @sittir/typescript.
 *
 * Combines native backend selection (getNativeBackendEngine) with JS fallback
 * (createJsEngine from @sittir/core). Provides a unified engine surface that
 * abstracts over the native/JS dispatch.
 */

import { createJsEngine, type SittirEngineLike, type JsEngineOptions, assertNativeNodeData } from '@sittir/core';
import type { FormatRecord } from '@sittir/types';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getActiveBackend } from './backend.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface EngineOptions {
	readonly format?: FormatRecord;
}

/**
 * Try to construct a native engine if the backend is active and supports
 * the new engine API (constructor with options + dispose method).
 */
function getNativeBackendEngine(options?: EngineOptions): SittirEngineLike | null {
	const status = getActiveBackend();
	if (status.name !== 'native') return null;

	try {
		const nativeOptions = options?.format 
? { format: JSON.stringify(options.format) } 
: undefined; 
const engine = new status.native.SittirEngine(nativeOptions);
		// Wrap the native engine to match SittirEngineLike interface
		return {
			render(node, opts) {
				assertNativeNodeData(node);
				// Native engine does not yet support ignoreFormat option (Task 4).
				// Until engine-owned format state is implemented, throw explicitly.
				if (opts?.ignoreFormat === true) {
					throw new Error(
						'ignoreFormat option not yet supported by native engine. ' +
						'Use JS engine or wait for Task 4 (engine-owned format state).'
					);
				}
				const json = JSON.stringify(node);
				return engine.render(json);
			},

			applyEdits(source, edits) {
				return engine.applyEdits(source, edits.map(e => ({ ...e })));
			},

			dispose() {
				engine.dispose();
			},

			reader: {
				parseAndRead(source: string) {
					const json = engine.parseAndRead(source);
					const parsed = JSON.parse(json);
					// Native parseAndRead returns { nodeData, format? }
					return {
						root: parsed.nodeData,
						tree: {
							rootNode: null as any, // Native handle doesn't expose raw nodes
							nodeById: () => {
								throw new Error('nodeById unavailable on native engine handle');
							},
							source,
							read: (nodeId) => {
								if (nodeId === undefined) return parsed.nodeData;
								const nodeJson = engine.readNode(nodeId);
								return JSON.parse(nodeJson);
							},
							render: (nodeId, opts) => {
								const node = nodeId === undefined 
									? parsed.nodeData 
									: JSON.parse(engine.readNode(nodeId));
								return engine.render(JSON.stringify(node));
							},
							format: parsed.format
						}
					};
				},

				readNode(nodeId) {
					const json = engine.readNode(nodeId);
					return JSON.parse(json);
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
 * engine (Nunjucks renderer) otherwise. The JS engine returns a synchronous
 * renderer-only interface (no reader) to avoid async initialization races.
 *
 * @param options - Engine configuration (format, etc.)
 * @returns An engine implementing SittirEngineLike.
 */
export function createEngine(options?: EngineOptions): SittirEngineLike {
	const native = getNativeBackendEngine(options);
	if (native) return native;

	// JS fallback - synchronous renderer only (no parser/reader)
	const jsOptions: JsEngineOptions = {
		templatesPath: join(__dirname, '..', 'templates'),
		format: options?.format,
		parse: (_source: string) => {
			throw new Error(
				'JS fallback engine does not support parsing. ' +
				'Use native engine or construct reader separately.'
			);
		}
	};

	return createJsEngine(jsOptions);
}
