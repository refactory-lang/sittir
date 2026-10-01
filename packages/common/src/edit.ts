// @generated-header: false (hand-written core — preserved across regeneration)
import type { AnyUntypedNode, AnyTreeNode, StringIndexRange, Edit, FormatRecord, KindOf, Renderable, ReplaceTarget } from '@sittir/types';
import { rebaseTrivia } from './format.ts';
import { byteLength, sourceSpans } from './span.ts';

export type { ReplaceTarget, AnyTreeNode, Renderable, KindOf };

// ---------------------------------------------------------------------------
// toEditAt — an Edit that splices rendered text into a byte range
// ---------------------------------------------------------------------------

/**
 * The Edit that replaces `startOrRange` (a `StringIndexRange`, or a byte start
 * with a byte `end`) with `insertedText`. Positions are validated here, once,
 * for every caller that turns a rendered node into an edit.
 *
 * A range's `index` is a string index (UTF-16 code units, as ast-grep reports it) while an `Edit` counts bytes, so the edit lands in the wrong place when non-ASCII text precedes the range.
 */
export function toEditAt(insertedText: string, startOrRange: number | StringIndexRange, end?: number): Edit {
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
 *
 * A range's `index` is a string index (UTF-16 code units, as ast-grep reports
 * it) while an `Edit` counts bytes, so the edit lands in the wrong place when
 * non-ASCII text precedes the range.
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
 * Apply a batch of edits to `source`, returning the edited source and a
 * rebased format record (if one was supplied).
 *
 * An edit's `startPos` and `endPos` are byte offsets, the unit a read node's
 * `$span` counts in, so an edit built from a span lands on that node whatever
 * characters precede it.
 *
 * @param source - The original source string.
 * @param edits - The edits to apply, in any order. They must not overlap.
 * @param format - A format record to rebase alongside the text edits.
 * @returns The edited source and the rebased format record.
 * @throws When an edit's range lies outside the source (counted in bytes),
 * ends before it starts, or overlaps another edit.
 */
export function applyEdits(
	source: string,
	edits: readonly Edit[],
	format?: FormatRecord
): { source: string; format: FormatRecord | undefined } {
	if (edits.length === 0) return { source, format };

	const spans = sourceSpans(source);
	const ascending = [...edits].sort((a, b) => a.startPos - b.startPos);
	let result = '';
	let cursor = 0;
	for (const edit of ascending) {
		if (edit.startPos < 0 || edit.startPos > spans.byteLength)
			throw new Error(`applyEdits: startPos ${edit.startPos} out of bounds (source is ${spans.byteLength} bytes)`);
		if (edit.endPos < edit.startPos || edit.endPos > spans.byteLength)
			throw new Error(
				`applyEdits: endPos ${edit.endPos} out of bounds (startPos ${edit.startPos}, source is ${spans.byteLength} bytes)`
			);
		if (edit.startPos < cursor)
			throw new Error(`applyEdits: the edit at ${edit.startPos} overlaps the edit ending at ${cursor}`);
		result += spans.slice({ start: cursor, end: edit.startPos }) + edit.insertedText;
		cursor = edit.endPos;
	}
	result += spans.slice({ start: cursor, end: spans.byteLength });

	let fmt = format;
	for (const edit of ascending.reverse()) fmt = rebaseOneEdit(fmt, edit);

	return { source: result, format: fmt };
}

/** Rebase the format record for a single edit, returning undefined if absent. */
function rebaseOneEdit(format: FormatRecord | undefined, edit: Edit): FormatRecord | undefined {
	if (!format) return undefined;
	const delta = byteLength(edit.insertedText) - (edit.endPos - edit.startPos);
	return rebaseTrivia(format, edit.startPos, delta);
}
