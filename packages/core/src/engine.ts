// @generated-header: false (hand-written core — preserved across regeneration)
//
// JS backend implementation only.

import type { AnyNodeData, FormatRecord } from '@sittir/types';
import { applyEdits as coreApplyEdits, applyFormat, readNode } from '@sittir/common';
import { createRenderHandle } from '@sittir/common/engine';
import type {
	EngineOptions,
	ParseAndReadResult,
	RenderHandle,
	SittirEngineLike,
	SittirEngineReader
} from '@sittir/common/engine';
import type { TreeHandle } from '@sittir/common';
import { createRenderer } from './loader.ts';

export type {
	EngineOptions,
	ParseAndReadResult,
	RenderHandle,
	SittirEngineLike,
	SittirEngineReader
} from '@sittir/common/engine';

export function resolveEngineFormat(
	engineFormat: FormatRecord | undefined,
	treeFormat: FormatRecord | undefined,
	detached: boolean
): FormatRecord | undefined {
	if (engineFormat) return engineFormat;
	if (!detached) return treeFormat;
	return undefined;
}

export interface JsEngineOptions {
	templatesPath: string;
	format?: FormatRecord;
	parse?: (source: string) => TreeHandle;
	kindNames?: ReadonlyMap<number, string>;
}

export function createJsEngine(options: JsEngineOptions): SittirEngineLike {
	const { templatesPath, format: engineFormat, parse, kindNames } = options;
	const renderer = createRenderer(templatesPath, { kindNames });

	function renderNode(node: AnyNodeData, treeFormat?: FormatRecord, ignoreFormat = false): string {
		const canonical = renderer.render(node);
		if (ignoreFormat) return canonical;

		const detached = node.$source === 2;
		const effective = resolveEngineFormat(engineFormat, treeFormat, detached);
		return effective ? applyFormat(canonical, effective) : canonical;
	}

	const reader = parse
		? ({
				parseAndRead(source: string): ParseAndReadResult {
					const tree = parse(source);
					const root = readNode(tree);
					const treeWithRender: TreeHandle = {
						...tree,
						read: (handle?: number, childIndex?: number) => readNode(tree, handle, childIndex),
						render: (_handle?: number, opts?: { ignoreFormat?: boolean }) => {
							return renderNode(root, tree.format, opts?.ignoreFormat);
						}
					};

					return { root, tree: treeWithRender };
				},

				readNode(_handle: number, _childIndex = 0): AnyNodeData {
					throw new Error('readNode(handle, childIndex) requires a tree handle from parseAndRead()');
				}
			} satisfies SittirEngineReader)
		: undefined;

	return {
		render(node: AnyNodeData, options?: { ignoreFormat?: boolean }): RenderHandle {
			return createRenderHandle(() => renderNode(node, undefined, options?.ignoreFormat));
		},

		applyEdits(source, edits) {
			return coreApplyEdits(source, edits).source;
		},

		dispose(): void {},
		reader
	};
}
