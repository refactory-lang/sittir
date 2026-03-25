// @generated-header: false (hand-written core — preserved across regeneration)
import type { NodeData, Edit, ByteRange, ReplaceTarget, AssignableNode, Renderable, KindOf, RulesRegistry, JoinByMap } from './types.ts';
import { render } from './render.ts';

export type { ReplaceTarget, AssignableNode, Renderable, KindOf };

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
 * Attach a target's byte range to a factory output, enabling no-arg `.toEdit()`.
 *
 * This is the low-level helper used by generated `edit()` functions.
 * The generated `edit(target)` creates the right factory for the target's kind,
 * then calls `bindRange()` to attach the range.
 */
export function bindRange<T extends NodeData & Renderable>(
	target: ReplaceTarget,
	factoryOutput: T,
): T & { toEdit(): Edit } {
	const range = target.range();
	// Override toEdit to use the bound range when called with no args
	(factoryOutput as any).toEdit = () => ({
		startPos: range.start.index,
		endPos: range.end.index,
		insertedText: factoryOutput.render(),
	});
	return factoryOutput as T & { toEdit(): Edit };
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
