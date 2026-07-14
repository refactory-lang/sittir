// @generated-header: false (hand-written core — preserved across regeneration)
import type { AnyNodeData, CSTNode, Position } from '@sittir/types';

/**
 * @forFutureUse ADR-0018 (docs/adr/0018-dehoist-nodedata-surface.md) —
 * $toEdit/CST rendering. Not yet wired into generated output; scaffolding only.
 */
export interface CstRenderer {
	render(node: AnyNodeData): string;
}

function offsetToPosition(offset: number, fullText: string, baseOffset: number): Position {
	const textUpTo = fullText.slice(0, offset - baseOffset);
	const lines = textUpTo.split('\n');
	return {
		row: lines.length - 1,
		column: lines[lines.length - 1]?.length ?? 0
	};
}

/**
 * @forFutureUse ADR-0018 (docs/adr/0018-dehoist-nodedata-surface.md) —
 * $toEdit/CST rendering. Not yet wired into generated output; scaffolding only.
 *
 * Build a lightweight CST node tree with byte offsets.
 *
 * @param kindNameFromId - Optional resolver for numeric `$type` values to string
 *   kind names (for the `CSTNode.type` display field). When absent, falls back
 *   to `String(node.$type)` — the numeric id as a string. Callers with access
 *   to a grammar's `kindNameFromId` function should pass it here for readable output.
 */
export function toCst(
	node: AnyNodeData,
	renderer: CstRenderer,
	offset = 0,
	kindNameFromId?: (id: number) => string | undefined
): CSTNode {
	// When `$text` is set (leaf node) use it directly for both the
	// returned `text` field AND the position-calc basis. Previously we
	// rendered the node and used the rendered string for positions while
	// returning `$text` verbatim, which misaligned whenever render output
	// differed from $text (e.g. `$TEXT` slot templates vs plain leaves).
	const text = node.$text !== undefined ? node.$text : renderer.render(node);

	return {
		type: typeof node.$type === 'string' ? node.$type : (kindNameFromId?.(node.$type) ?? String(node.$type)),
		text,
		children: [],
		isNamed: true,
		startIndex: offset,
		endIndex: offset + text.length,
		startPosition: offsetToPosition(offset, text, offset),
		endPosition: offsetToPosition(offset + text.length, text, offset)
	};
}
