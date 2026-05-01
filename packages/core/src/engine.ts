// @generated-header: false (hand-written core — preserved across regeneration)
//
// Engine abstraction — shared interface for JS and native render paths.
//
// The engine combines reader + renderer into a single surface. Client-side
// `engine.render(...)` is contextless (no format unless engine-level config
// supplies one). Engine-level format is immutable after engine creation.
// Engine config wins over inferred tree format; detached NodeData must not
// borrow inferred tree format.

import type {
	AnyNodeData,
	Edit,
	NodeId,
	FormatRecord,
	NativeParseResult
} from './types.ts';
import { createRenderer } from './loader.ts';
import { applyEdits as coreApplyEdits } from './edit.ts';
import { applyFormat } from './format.ts';
import type { TreeHandle } from './readNode.ts';
import { readNode } from './readNode.ts';

// ---------------------------------------------------------------------------
// Grammar engine options — re-exported so grammar wrappers don't need to
// import from the grammar-specific engine.ts (which is generated).
// ---------------------------------------------------------------------------

/**
 * Options for a per-grammar engine instance.
 * Mirrors `JsEngineOptions.format` — the engine-level format config.
 */
export interface EngineOptions {
	readonly format?: FormatRecord;
}

// ---------------------------------------------------------------------------
// Structural types for the native backend — grammar-agnostic view.
// ---------------------------------------------------------------------------

/**
 * Minimal structural view of a live native engine instance.
 * Grammar packages expose a richer `NativeEngine` interface in backend.ts;
 * this is what `createGrammarEngine` needs and nothing more.
 */
interface NativeEngineInstance {
	parseAndRead(source: string): string;
	readNode(nodeId: NodeId): string;
	render(node: unknown): string;
	applyEdits(
		source: string,
		edits: { startPos: number; endPos: number; insertedText: string }[]
	): string;
	dispose(): void;
}

/**
 * Minimal structural view of the native-module constructor shape.
 * Only `SittirEngine` is required; grammar packages may expose more.
 */
interface NativeModuleShape {
	SittirEngine: new (options?: { format?: string }) => NativeEngineInstance;
}

/**
 * Grammar-agnostic view of the backend status discriminated union.
 * Grammar packages use a richer `BackendStatus` in backend.ts; this is
 * the structural minimum that `createGrammarEngine` branches on.
 */
type BackendStatusShape =
	| { readonly name: 'native'; readonly native: NativeModuleShape }
	| { readonly name: string };

// ---------------------------------------------------------------------------
// GrammarEngineConfig + createGrammarEngine
// ---------------------------------------------------------------------------

/**
 * Configuration for the generic per-grammar engine factory.
 *
 * Grammar packages pass grammar-specific values here so the generic
 * `createGrammarEngine` can wire the native + JS paths without importing
 * from the grammar package.
 */
export interface GrammarEngineConfig {
	/** Path to the grammar's templates directory (for JS fallback). */
	templatesPath: string;
	/** Static kind-name lookup table from the grammar's generated types. */
	kindNames: ReadonlyMap<number, string>;
	/** Transport projection function from the grammar's generated utils. */
	toNativeRenderTransport: (node: unknown) => unknown;
	/** Backend status checker from the grammar's generated backend. */
	getActiveBackend: () => BackendStatusShape;
}

/**
 * Internal intermediate type for a native parse result.
 * Mirrors the per-grammar `NativeParseResult` shape; inlined here so
 * grammar packages don't need to re-declare it.
 */
interface NativeParseResultShape {
	readonly nodeData: AnyNodeData;
	readonly format?: FormatRecord;
}

/**
 * Try to construct a native engine wrapper if the backend is active and
 * the native module exposes the `SittirEngine` constructor.
 *
 * @param config - Grammar-specific wiring (transport, backend, etc.)
 * @param options - Engine-level options (format, etc.)
 * @returns A `SittirEngineLike` backed by the native engine, or `null`
 *   when the native backend is unavailable or its constructor throws.
 *
 * @remarks
 * Mirrors the per-grammar `getNativeBackendEngine()` helper that
 * previously lived in each grammar's hand-written `engine.ts`.
 */
function getNativeEngine(
	config: GrammarEngineConfig,
	options?: EngineOptions
): SittirEngineLike | null {
	const status = config.getActiveBackend();
	if (status.name !== 'native') return null;

	try {
		const nativeOptions = options?.format
			? { format: JSON.stringify(options.format) }
			: undefined;
		const engine = new (status as { name: 'native'; native: NativeModuleShape }).native.SittirEngine(nativeOptions);

		function renderNativeNode(
			node: Parameters<SittirEngineLike['render']>[0],
			opts?: Parameters<SittirEngineLike['render']>[1]
		): string {
			const transport = config.toNativeRenderTransport(node);
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
					const parsed = JSON.parse(json) as NativeParseResultShape;
					// Native parseAndRead returns { nodeData, format? }
					return {
						root: parsed.nodeData,
						tree: {
							get rootNode(): never {
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

				readNode(nodeId: NodeId) {
					const json = engine.readNode(nodeId);
					return JSON.parse(json) as AnyNodeData;
				}
			}
		};
	} catch {
		// If native engine construction fails, fall back to JS
		return null;
	}
}

/**
 * Create a grammar-specific engine instance.
 *
 * Attempts to use the native backend if available; falls back to the JS
 * engine (Nunjucks renderer) otherwise. The JS fallback is renderer-only
 * (no reader) because grammar packages don't provide a synchronous JS reader.
 *
 * This is the generic implementation extracted from the per-grammar
 * hand-written `engine.ts` files. Grammar packages call this with their
 * grammar-specific wiring via `GrammarEngineConfig`.
 *
 * @param config - Grammar-specific wiring for native + JS paths.
 * @param options - Engine-level options (format, etc.)
 * @returns An engine implementing `SittirEngineLike`.
 */
export function createGrammarEngine(
	config: GrammarEngineConfig,
	options?: EngineOptions
): SittirEngineLike {
	const native = getNativeEngine(config, options);
	if (native) return native;

	// JS fallback - renderer only (no reader)
	const jsOptions: JsEngineOptions = {
		templatesPath: config.templatesPath,
		format: options?.format,
		kindNames: config.kindNames
		// parse omitted: no synchronous JS reader available
	};

	return createJsEngine(jsOptions);
}

/**
 * Reader surface — parse + read methods grouped together.
 * Available when the engine supports parsing (JS fallback provides this
 * when a parse function is configured; native engines provide it when
 * built with reader support).
 */
export interface SittirEngineReader {
	/**
	 * Parse source and read the root node into NodeData.
	 * Returns the root NodeData plus a TreeHandle for drill-in.
	 */
	parseAndRead(source: string): ParseAndReadResult;

	/**
	 * Read a specific node by ID (drill-in from a parsed tree).
	 * The nodeId must belong to the tree owned by this engine.
	 */
	readNode(nodeId: NodeId): AnyNodeData;
}

/**
 * Engine interface — renderer-first with optional reader.
 * Top-level surface is always renderer (render, applyEdits, dispose).
 * Reader methods are grouped in an optional `reader` sub-object.
 */
export interface SittirEngineLike {
	/**
	 * Render a NodeData node to a string.
	 * Applies engine-level format unless `ignoreFormat: true`.
	 */
	render(node: AnyNodeData, options?: { ignoreFormat?: boolean }): string;

	/**
	 * Apply a batch of edits to source text.
	 * Native engines may apply edits more efficiently than string splice.
	 */
	applyEdits(source: string, edits: readonly Edit[]): string;

	/**
	 * Release engine resources (if any).
	 */
	dispose(): void;

	/**
	 * Reader surface — parse + read operations.
	 * Present when the engine supports parsing. JS fallback has this only
	 * when a parse function is configured; native engines provide it when
	 * built with reader support.
	 */
	reader?: SittirEngineReader;
}

/**
 * Result from parseAndRead — root node data + tree handle for drill-in.
 */
export interface ParseAndReadResult {
	root: AnyNodeData;
	tree: TreeHandle;
}

/**
 * Resolve the effective format for a render call.
 *
 * Priority order:
 * 1. If `engineFormat` is set, use it (engine-level config wins).
 * 2. If `detached` is false and `treeFormat` exists, use `treeFormat`
 *    (inferred from the source tree).
 * 3. Otherwise, return `undefined` (no format application).
 *
 * @param engineFormat - Engine-level format config (immutable after construction).
 * @param treeFormat - Format inferred from the parse tree (via native reader).
 * @param detached - True when the node is detached (factory-built, no tree).
 * @returns The format to apply, or undefined.
 *
 * @remarks
 * Detached NodeData (factory-built, no tree association) must not borrow
 * inferred tree format. Native NodeData stays format-free until render time.
 */
export function resolveEngineFormat(
	engineFormat: FormatRecord | undefined,
	treeFormat: FormatRecord | undefined,
	detached: boolean
): FormatRecord | undefined {
	if (engineFormat) return engineFormat;
	if (!detached) return treeFormat;
	return undefined;
}

/**
 * JS fallback engine options.
 */
export interface JsEngineOptions {
	/**
	 * Path to `.jinja` templates directory.
	 * Required for the JS engine (uses Nunjucks-backed renderer).
	 */
	templatesPath: string;

	/**
	 * Engine-level format config (immutable after construction).
	 * Applied to all render calls unless `ignoreFormat: true`.
	 */
	format?: FormatRecord;

	/**
	 * Parser function — provided by the grammar package when a real reader is available.
	 * Returns a TreeHandle (compatible with tree-sitter Tree or ast-grep SgRoot).
	 * When omitted, the engine will have no reader surface (renderer-only).
	 */
	parse?: (source: string) => TreeHandle;

	/**
	 * Static lookup table: numeric KindId → kind name string. Pre-computed
	 * at codegen time from the parser symbol catalog. Used by the Nunjucks
	 * render path to resolve template filenames from numeric `$type`.
	 * Pure `Map.get()` at runtime — no function call, no throw.
	 */
	kindNames?: ReadonlyMap<number, string>;
}

/**
 * Create a JS fallback engine.
 *
 * The JS engine uses the existing tree-sitter parser wrapper (via `parse`)
 * and Nunjucks-backed renderer (via `createRenderer`). Engine-level format
 * is immutable after construction; `render()` applies format unless
 * `ignoreFormat: true`.
 *
 * @param options - Engine configuration.
 * @returns A JS engine implementing `SittirEngineLike`.
 */
export function createJsEngine(options: JsEngineOptions): SittirEngineLike {
	const { templatesPath, format: engineFormat, parse, kindNames } = options;
	const renderer = createRenderer(templatesPath, { kindNames });

	function renderNode(
		node: AnyNodeData,
		treeFormat?: FormatRecord,
		ignoreFormat = false
	): string {
		// Render the canonical template output first.
		const canonical = renderer.render(node);

		// Skip format application if ignoreFormat is set.
		if (ignoreFormat) return canonical;

		// Resolve effective format: engine config wins, then tree format (if not detached).
		const detached = node.$source === 'factory';
		const effective = resolveEngineFormat(engineFormat, treeFormat, detached);

		// Apply format if resolved.
		return effective ? applyFormat(canonical, effective) : canonical;
	}

	const engine: SittirEngineLike = {
		render(node: AnyNodeData, options?: { ignoreFormat?: boolean }): string {
			// Engine-level render: no tree association, so treeFormat is undefined.
			return renderNode(node, undefined, options?.ignoreFormat);
		},

		applyEdits(source: string, edits: readonly Edit[]): string {
			return coreApplyEdits(source, edits).source;
		},

		dispose(): void {
			// JS engine has no native resources to release.
		}
	};

	// Only attach reader when a real parse function is provided.
	if (parse) {
		engine.reader = {
			parseAndRead(source: string): ParseAndReadResult {
				const tree = parse(source);
				const root = readNode(tree);

				// Attach a render method to the tree handle so drill-in nodes can render.
				const treeWithRender: TreeHandle = {
					...tree,
					read: (nodeId?: NodeId) => readNode(tree, nodeId),
					render: (nodeId?: NodeId, opts?: { ignoreFormat?: boolean }) => {
						const node = nodeId !== undefined ? readNode(tree, nodeId) : root;
						return renderNode(node, tree.format, opts?.ignoreFormat);
					}
				};

				return { root, tree: treeWithRender };
			},

			readNode(nodeId: NodeId): AnyNodeData {
				throw new Error(
					'readNode(id) requires a tree handle from parseAndRead()'
				);
			}
		};
	}

	return engine;
}
