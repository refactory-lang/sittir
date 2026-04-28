/**
 * Grammar-specific engine factory for @sittir/python.
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
			},

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
 * engine (tree-sitter wasm + Nunjucks renderer) otherwise.
 *
 * For the JS fallback, uses the pre-compiled parser from .sittir/parser.wasm
 * (generated from overrides). Parser initialization happens asynchronously,
 * but methods block until ready to avoid race conditions.
 *
 * @param options - Engine configuration (format, etc.)
 * @returns An engine implementing SittirEngineLike.
 */
export function createEngine(options?: EngineOptions): SittirEngineLike {
	const native = getNativeBackendEngine(options);
	if (native) return native;

	// JS fallback - use pre-compiled .sittir/parser.wasm
	let parseFunc: JsEngineOptions['parse'] | null = null;
	let initError: Error | null = null;
	let initComplete = false;
	
	// Start parser initialization immediately in the background
	const initPromise = (async () => {
		try {
			type ParserClass = {
				new(): {
					setLanguage(lang: any): void;
					parse(source: string): any;
				};
			};
			type LanguageClass = {
				load(wasmPath: string): Promise<any>;
			};
			
			const wts = await import('web-tree-sitter') as any;
			const Parser: ParserClass = wts.default?.Parser ?? wts.Parser;
			const Language: LanguageClass = wts.default?.Language ?? wts.Language;
			
			// Initialize web-tree-sitter
			if (wts.default && typeof wts.default.init === 'function') {
				await wts.default.init();
			} else if (typeof wts.init === 'function') {
				await wts.init();
			}
			
			const parserInstance = new Parser();
			// Use the pre-compiled parser WASM from .sittir/
			const wasmPath = join(__dirname, '..', '.sittir', 'parser.wasm');
			const lang = await Language.load(wasmPath);
			parserInstance.setLanguage(lang);

			// Build TreeHandle adapter
			parseFunc = (source: string) => {
				const tree = parserInstance.parse(source);
				const nodeMap = new Map<number, any>();
				
				function collect(node: any) {
					nodeMap.set(node.id, node);
					for (const child of node.children) collect(child);
				}
				collect(tree.rootNode);

				return {
					rootNode: adaptNode(tree.rootNode),
					nodeById: (id) => {
						const node = nodeMap.get(id);
						if (!node) throw new Error(`Node ${id} not found`);
						return adaptNode(node);
					},
					source
				};
			};
			initComplete = true;
		} catch (error) {
			initError = error instanceof Error ? error : new Error(String(error));
			initComplete = true;
		}
	})();

	const jsOptions: JsEngineOptions = {
		templatesPath: join(__dirname, '..', 'templates'),
		format: options?.format,
		parse: (source: string) => {
			// Block until initialization completes
			if (!initComplete) {
				throw new Error(
					'Parser is still initializing. This is a race condition bug. ' +
					'The parser should be ready before parseAndRead() is called. ' +
					'Please report this issue.'
				);
			}
			if (initError) throw initError;
			if (!parseFunc) throw new Error('Parser initialization failed unexpectedly');
			return parseFunc(source);
		}
	};

	return createJsEngine(jsOptions);
}

/**
 * Adapt a tree-sitter Node to the AnyTreeNode interface expected by readNode.
 */
function adaptNode(node: any): any {
	return {
		type: node.type,
		id: () => node.id,
		text: () => node.text,
		isNamed: () => node.isNamed,
		field: (name: string) => {
			const child = node.childForFieldName(name);
			return child ? adaptNode(child) : null;
		},
		fieldChildren: (name: string) => {
			const result: any[] = [];
			for (let i = 0; i < node.childCount; i++) {
				if (node.fieldNameForChild(i) === name) {
					const child = node.child(i);
					if (child) result.push(adaptNode(child));
				}
			}
			return result;
		},
		fieldNameForChild: (index: number) => node.fieldNameForChild(index),
		children: () => node.children.map(adaptNode),
		range: () => ({
			start: {
				index: node.startIndex,
				line: node.startPosition.row,
				column: node.startPosition.column
			},
			end: {
				index: node.endIndex,
				line: node.endPosition.row,
				column: node.endPosition.column
			}
		})
	};
}
