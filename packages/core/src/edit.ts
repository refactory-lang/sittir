// @generated-header: false (hand-written core — preserved across regeneration)
import type { NodeData, Edit, ByteRange } from './types.ts';
import type { RulesRegistry, JoinByMap } from './render.ts';
import { render } from './render.ts';

// ---------------------------------------------------------------------------
// toEdit — overloaded for raw offsets and Range objects
// ---------------------------------------------------------------------------

export function toEdit(node: NodeData, registry: RulesRegistry, start: number, end: number, joinBy?: JoinByMap): Edit;
export function toEdit(node: NodeData, registry: RulesRegistry, range: ByteRange, joinBy?: JoinByMap): Edit;
export function toEdit(
	node: NodeData,
	registry: RulesRegistry,
	startOrRange: number | ByteRange,
	endOrJoinBy?: number | JoinByMap,
	joinBy?: JoinByMap,
): Edit {
	const insertedText = render(node, registry, typeof endOrJoinBy === 'object' ? endOrJoinBy : joinBy);

	if (typeof startOrRange === 'number') {
		if (typeof endOrJoinBy !== 'number') {
			throw new Error('endPos is required when startPos is a number');
		}
		if (startOrRange < 0 || endOrJoinBy < 0) {
			throw new Error(`Edit positions must be non-negative (got start=${startOrRange}, end=${endOrJoinBy})`);
		}
		if (startOrRange > endOrJoinBy) {
			throw new Error(`Edit startPos (${startOrRange}) must not exceed endPos (${endOrJoinBy})`);
		}
		return { startPos: startOrRange, endPos: endOrJoinBy, insertedText };
	}

	return {
		startPos: startOrRange.start.index,
		endPos: startOrRange.end.index,
		insertedText,
	};
}

// ---------------------------------------------------------------------------
// ReplaceTarget — structural type for ast-grep SgNode compatibility
// ---------------------------------------------------------------------------

export interface ReplaceTarget<T extends string = string> {
	readonly type: T;
	range(): ByteRange;
}

// ---------------------------------------------------------------------------
// Renderable — factory outputs that can render themselves
// ---------------------------------------------------------------------------

export interface Renderable {
	render(): string;
}

// ---------------------------------------------------------------------------
// KindOf — extract type string(s) from a navigation node type
// ---------------------------------------------------------------------------

export type KindOf<T> = T extends { readonly type: infer K extends string } ? K : never;

// ---------------------------------------------------------------------------
// replace — loosely typed, any NodeData
// ---------------------------------------------------------------------------

export function replace(
	target: ReplaceTarget,
	replacement: NodeData & Renderable,
): Edit {
	const range = target.range();
	return {
		startPos: range.start.index,
		endPos: range.end.index,
		insertedText: replacement.render(),
	};
}

// ---------------------------------------------------------------------------
// edit() — wrap a target node to get a pre-positioned editor
// ---------------------------------------------------------------------------

/**
 * Wrap a target node to create an editor pre-loaded with the node's byte range.
 *
 * Returns the replacement NodeData with `.toEdit()` (no args) and `.update()`
 * methods that use the target's range automatically.
 *
 * @example
 * ```ts
 * const e = edit(matchedNode, ir.identifier('newName'));
 * const editObj = e.toEdit();  // range from matchedNode, text from replacement
 *
 * // Or build replacement inline:
 * const editObj = edit(matchedNode, ir.function(ir.identifier('newName'))
 *   .parameters(ir.parameters())
 *   .body(ir.block())
 * ).toEdit();
 * ```
 */
export function edit<T extends string>(
	target: ReplaceTarget<T>,
	replacement: NodeData & Renderable,
): NodeData & Renderable & {
	/** Produce an Edit using the target's range. No args needed. */
	toEdit(): Edit;
} {
	const range = target.range();
	const result = Object.create(replacement);
	result.toEdit = () => ({
		startPos: range.start.index,
		endPos: range.end.index,
		insertedText: replacement.render(),
	});
	return result;
}

// ---------------------------------------------------------------------------
// replaceField — type-safe field replacement via selector lambda
// ---------------------------------------------------------------------------

export function replaceField<
	TNode extends { readonly type: string },
	TField extends ReplaceTarget,
>(
	target: TNode,
	selector: (node: TNode) => TField | undefined,
	replacement: NodeData<KindOf<TField>> & Renderable,
): Edit {
	const fieldNode = selector(target);
	if (!fieldNode) {
		throw new Error(
			`Cannot replace undefined field on '${target.type}' — field is not present on the target node`
		);
	}
	const range = fieldNode.range();
	return {
		startPos: range.start.index,
		endPos: range.end.index,
		insertedText: replacement.render(),
	};
}
