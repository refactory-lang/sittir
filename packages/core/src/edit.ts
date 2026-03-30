// @generated-header: false (hand-written core — preserved across regeneration)
import type { AnyNodeData, Edit, ByteRange, ReplaceTarget, AnyTreeNode, Renderable, KindOf } from './types.ts';

export type { ReplaceTarget, AnyTreeNode, Renderable, KindOf };

// ---------------------------------------------------------------------------
// replace — loosely typed, any AnyNodeData
// ---------------------------------------------------------------------------

export function replace(
	target: ReplaceTarget,
	replacement: AnyNodeData & Renderable,
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
export function bindRange<T extends AnyNodeData & Renderable>(
	target: ReplaceTarget,
	factoryOutput: T,
): T & { toEdit(): Edit; replace(): Edit } {
	const range = target.range();
	const boundEdit = () => ({
		startPos: range.start.index,
		endPos: range.end.index,
		insertedText: factoryOutput.render(),
	});
	// Override toEdit and replace to use the bound range when called with no args
	(factoryOutput as any).toEdit = boundEdit;
	(factoryOutput as any).replace = boundEdit;
	return factoryOutput as T & { toEdit(): Edit; replace(): Edit };
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
	replacement: AnyNodeData & Renderable,
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
