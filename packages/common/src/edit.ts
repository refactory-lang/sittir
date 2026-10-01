// @generated-header: false (hand-written core — preserved across regeneration)
import type { AnyUntypedNode, AnyTreeNode, ByteRange, Edit, FormatRecord, KindOf, Renderable, ReplaceTarget } from '@sittir/types';
import { rebaseTrivia } from './format.ts';

export type { ReplaceTarget, AnyTreeNode, Renderable, KindOf };

// ---------------------------------------------------------------------------
// toEditAt — an Edit that splices rendered text into a byte range
// ---------------------------------------------------------------------------

/**
 * The Edit that replaces `startOrRange` (a `ByteRange`, or a start with
 * `end`) with `insertedText`. Positions are validated here, once, for every
 * caller that turns a rendered node into an edit.
 */
export function toEditAt(insertedText: string, startOrRange: number | ByteRange, end?: number): Edit {
	if (typeof startOrRange === 'number') {
		if (typeof end !== 'number') {
			throw new Error('endPos is required when startPos is a number');
		}
		if (startOrRange < 0 || end < 0) {
			throw new Error(`Edit positions must be non-negative (got start=${startOrRange}, end=${end})`);
		}
		if (startOrRange > end) {
			throw new Error(`Edit startPos (${startOrRange}) must not exceed endPos (${end})`);
		}
		return { startPos: startOrRange, endPos: end, insertedText };
	}
	return {
		startPos: startOrRange.start.index,
		endPos: startOrRange.end.index,
		insertedText
	};
}

// ---------------------------------------------------------------------------
// replace — loosely typed, any AnyUntypedNode
// ---------------------------------------------------------------------------

/**
 * @forFutureUse ADR-0018 (docs/adr/0018-dehoist-nodedata-surface.md) —
 * $replace method. Not yet wired into generated output; scaffolding only.
 */
export function replace(target: ReplaceTarget, replacement: AnyUntypedNode & Renderable): Edit {
	const range = target.range();
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
		throw new Error(`applyEdits: startPos ${edit.startPos} out of bounds (source length ${source.length})`);
	if (edit.endPos < edit.startPos || edit.endPos > source.length)
		throw new Error(
			`applyEdits: endPos ${edit.endPos} out of bounds (startPos ${edit.startPos}, source length ${source.length})`
		);
	return source.slice(0, edit.startPos) + edit.insertedText + source.slice(edit.endPos);
}

/** Rebase the format record for a single edit, returning undefined if absent. */
function rebaseOneEdit(format: FormatRecord | undefined, edit: Edit): FormatRecord | undefined {
	if (!format) return undefined;
	const delta = edit.insertedText.length - (edit.endPos - edit.startPos);
	return rebaseTrivia(format, edit.startPos, delta);
}
