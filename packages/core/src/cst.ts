// @generated-header: false (hand-written core — preserved across regeneration)
import type { AnyNodeData, CSTNode, Position, RulesConfig } from './types.ts';
import type { BoundRenderer } from './render.ts';

function offsetToPosition(offset: number, fullText: string, baseOffset: number): Position {
	const textUpTo = fullText.slice(0, offset - baseOffset);
	const lines = textUpTo.split('\n');
	return {
		row: lines.length - 1,
		column: lines[lines.length - 1]?.length ?? 0,
	};
}

/**
 * Build a lightweight CST node tree with byte offsets.
 */
export function toCst(
	node: AnyNodeData,
	renderer: BoundRenderer,
	offset = 0,
): CSTNode {
	// When `$text` is set (leaf node) use it directly for both the
	// returned `text` field AND the position-calc basis. Previously we
	// rendered the node and used the rendered string for positions while
	// returning `$text` verbatim, which misaligned whenever render output
	// differed from $text (e.g. `$TEXT` slot templates vs plain leaves).
	const text = node.$text !== undefined ? node.$text : renderer.render(node);

	return {
		type: node.$type,
		text,
		children: [],
		isNamed: true,
		startIndex: offset,
		endIndex: offset + text.length,
		startPosition: offsetToPosition(offset, text, offset),
		endPosition: offsetToPosition(offset + text.length, text, offset),
	};
}
