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
 * @param options - Engine configuration (format, etc.)
 * @returns An engine implementing SittirEngineLike.
 */
export function createEngine(options?: EngineOptions): SittirEngineLike {
	const native = getNativeBackendEngine(options);
	if (native) return native;

	// JS fallback - note that createJsEngine from core expects a synchronous parse function
	// We'll need to handle this async initialization carefully
	let parserReady = false;
	let parseFunc: JsEngineOptions['parse'] | null = null;

	// Async parser initialization - we'll lazy-load on first use
	const initParser = async () => {
		if (parserReady) return;
		
		// Dynamic imports with proper typing
		type WebTreeSitter = {
			init(): Promise<void>;
			Language: any;
		};
		type ParserClass = {
			new(): {
				setLanguage(lang: any): void;
				parse(source: string): any;
			};
		};
		
		const wts = await import('web-tree-sitter') as any;
		const Parser: ParserClass = wts.default?.Parser ?? wts.Parser;
		const Language = wts.default?.Language ?? wts.Language;
		const treeSitterPython = (await import('tree-sitter-python')).default;
		
		// Initialize web-tree-sitter
		if (wts.default && typeof wts.default.init === 'function') {
			await wts.default.init();
		} else if (typeof wts.init === 'function') {
			await wts.init();
		}
		
		const parserInstance = new Parser();
		parserInstance.setLanguage(treeSitterPython);

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
		parserReady = true;
	};

	// Start parser initialization immediately but don't await
	initParser().catch(() => {
		// Parser initialization failure is deferred until parse() is called
	});

	// Return a JS engine with deferred parser initialization
	const jsOptions: JsEngineOptions = {
		templatesPath: join(__dirname, '..', 'templates'),
		format: options?.format,
		parse: (source: string) => {
			if (!parseFunc) {
				throw new Error(
					'Parser not yet initialized. Engine initialization is async. ' +
					'Wait a moment and retry, or use createEngine in an async context.'
				);
			}
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
