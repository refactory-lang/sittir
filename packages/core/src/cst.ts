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
	const text = renderer.render(node);

	if (node.text !== undefined) {
		return {
			type: node.type,
			text: node.text,
			children: [],
			isNamed: true,
			startIndex: offset,
			endIndex: offset + node.text.length,
			startPosition: offsetToPosition(offset, text, offset),
			endPosition: offsetToPosition(offset + node.text.length, text, offset),
		};
	}

	return {
		type: node.type,
		text,
		children: [],
		isNamed: true,
		startIndex: offset,
		endIndex: offset + text.length,
		startPosition: offsetToPosition(offset, text, offset),
		endPosition: offsetToPosition(offset + text.length, text, offset),
	};
}
