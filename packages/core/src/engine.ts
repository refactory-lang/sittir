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
	 * Resolver for numeric `$type` values produced by Phase A/B factory/wrap output.
	 * Forwarded to `RulesConfig.kindNameFromId` so the Nunjucks render path can map
	 * a numeric TSKindId back to a string kind name for template file lookup.
	 *
	 * Required when the engine will render factory-built NodeData (numeric `$type`).
	 * Omit for read-only / WASM-backed paths where `readNode` still emits string types.
	 */
	kindNameFromId?: (id: number) => string | undefined;
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
	const { templatesPath, format: engineFormat, parse, kindNameFromId } = options;
	const renderer = createRenderer(templatesPath, { kindNameFromId });

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
