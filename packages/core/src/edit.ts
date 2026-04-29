// @generated-header: false (hand-written core — preserved across regeneration)
import type {
	AnyNodeData,
	Edit,
	ReplaceTarget,
	AnyTreeNode,
	Renderable,
	KindOf,
	FormatRecord
} from './types.ts';
import { rebaseTrivia } from './format.ts';

export type { ReplaceTarget, AnyTreeNode, Renderable, KindOf };

// ---------------------------------------------------------------------------
// replace — loosely typed, any AnyNodeData
// ---------------------------------------------------------------------------

export function replace(
	target: ReplaceTarget,
	replacement: AnyNodeData & Renderable
): Edit {
	const range = target.range();
	return {
		startPos: range.start.index,
		endPos: range.end.index,
		insertedText: replacement.render()
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
export function bindRange<
	T extends { readonly type: string; render(): string }
>(
	target: ReplaceTarget,
	factoryOutput: T
): T & { toEdit(): Edit; replace(): Edit } {
	const range = target.range();
	const boundEdit = () => ({
		startPos: range.start.index,
		endPos: range.end.index,
		insertedText: factoryOutput.render()
	});
	// Override toEdit and replace to use the bound range when called with no args.
	// `factoryOutput` is typed as the caller's generic T; we're monkey-patching
	// two methods onto it, which requires writing through an indexable shape.
	const bag = factoryOutput as unknown as Record<string, () => Edit>;
	bag.toEdit = boundEdit;
	bag.replace = boundEdit;
	return factoryOutput as T & { toEdit(): Edit; replace(): Edit };
}

// ---------------------------------------------------------------------------
// replaceField — type-safe field replacement via selector lambda
// ---------------------------------------------------------------------------

export function replaceField<
	TNode extends { readonly type: string },
	TField extends ReplaceTarget
>(
	target: TNode,
	selector: (node: TNode) => TField | undefined,
	replacement: AnyNodeData & Renderable
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
		insertedText: replacement.render()
	};
}

// ---------------------------------------------------------------------------
// applyEdits — apply a batch of edits + rebase the accompanying FormatRecord
// ---------------------------------------------------------------------------

/**
 * Apply a batch of edits to `source`, returning the mutated source string
 * and a rebased format record (if one was supplied).
 *
 * @param source - The original source string.
 * @param edits - Array of edits to apply (may be empty, may be unsorted).
 * @param format - Optional FormatRecord to rebase alongside the text edits.
 * @returns `{ source: string; format: FormatRecord | undefined }`
 *
 * @remarks
 * Edits are applied in descending `startPos` order so earlier byte
 * positions are not invalidated by later insertions/deletions.
 * For each edit, `rebaseTrivia` is called with
 * `editStart = edit.startPos` and
 * `delta = edit.insertedText.length - (edit.endPos - edit.startPos)`.
 * FR-004: this is the single call-site for format rebasing after batched edits.
 *
 * **Overlapping edits produce undefined behavior.** Callers must ensure edits
 * are non-overlapping. No validation is performed at runtime; passing edits
 * whose ranges intersect may produce incorrect output or throw from the bounds
 * check in `applyOneEdit`.
 */
export function applyEdits(
	source: string,
	edits: readonly Edit[],
	format?: FormatRecord
): { source: string; format: FormatRecord | undefined } {
	if (edits.length === 0) return { source, format };

	const sorted = [...edits].sort((a, b) => b.startPos - a.startPos);
	let result = source;
	let fmt = format;

	for (const edit of sorted) {
		result = applyOneEdit(result, edit);
		fmt = rebaseOneEdit(fmt, edit);
	}

	return { source: result, format: fmt };
}

/** Splice a single edit into the source string. */
function applyOneEdit(source: string, edit: Edit): string {
	if (edit.startPos < 0 || edit.startPos > source.length)
		throw new Error(
			`applyEdits: startPos ${edit.startPos} out of bounds (source length ${source.length})`
		);
	if (edit.endPos < edit.startPos || edit.endPos > source.length)
		throw new Error(
			`applyEdits: endPos ${edit.endPos} out of bounds (startPos ${edit.startPos}, source length ${source.length})`
		);
	return (
		source.slice(0, edit.startPos) +
		edit.insertedText +
		source.slice(edit.endPos)
	);
}

/** Rebase the format record for a single edit, returning undefined if absent. */
function rebaseOneEdit(
	format: FormatRecord | undefined,
	edit: Edit
): FormatRecord | undefined {
	if (!format) return undefined;
	const delta = edit.insertedText.length - (edit.endPos - edit.startPos);
	return rebaseTrivia(format, edit.startPos, delta);
}
