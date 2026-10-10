import { editedWithin } from './identity.ts';
import { decodeIndex, isCoordinate, type TreeHandle } from './read.ts';
import { spanSlicer } from './span.ts';
import { coordinateOf, isDataKey, isStorageKey, type PointSpanData } from './transport-data.ts';
import { treeOf } from './tree-token.ts';
import type { TriviaSides } from './trivia.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** The flat row and column pairs `snapshotSpans` returns, as spans. */
function spansOf(flat: readonly number[]): PointSpanData[] {
	const spans: PointSpanData[] = [];
	for (let at = 0; at + 3 < flat.length; at += 4) {
		spans.push({ start: { row: flat[at]!, column: flat[at + 1]! }, end: { row: flat[at + 2]!, column: flat[at + 3]! } });
	}
	return spans;
}

/** A tree that can take snapshots: a live tree a parse read. */
type SnapshotTree = TreeHandle & Required<Pick<TreeHandle, 'snapshot' | 'snapshotSpans' | 'source'>>;

function snapshotTreeOf(value: object, fallback: SnapshotTree | undefined): SnapshotTree | undefined {
	const tree = treeOf(value) ?? fallback;
	return tree?.snapshot !== undefined && tree.snapshotSpans !== undefined && tree.source !== undefined ? (tree as SnapshotTree) : undefined;
}

/**
 * A snapshot of `value`, as `$snapshot()` returns it: plain data that names no tree and renders
 * from its data and its geometry.
 *
 * - A tree-backed node with no edit in its subtree, its own outside trivia included, is one native
 *   read of its subtree.
 * - An edited parsed node keeps its own data, with its span measured from its holder, and its slots
 *   are snapshotted in turn.
 * - A built node keeps its data with no span. A tree-backed node under it is measured from its own
 *   start, since a built node has no points.
 */
export function snapshotOf(value: unknown): unknown {
	return snapshotIn(value, undefined, undefined);
}

function snapshotIn(value: unknown, holderByte: number | undefined, holderTree: SnapshotTree | undefined): unknown {
	if (Array.isArray(value)) return value.map((entry) => snapshotIn(entry, holderByte, holderTree));
	if (!isRecord(value)) return value;
	const at = coordinateOf(value);
	const tree = at === undefined ? undefined : snapshotTreeOf(value, holderTree);
	if (at === undefined || tree === undefined) return copyIn(value, undefined, undefined, undefined, undefined);
	const index = decodeIndex(at.$treeHandle);
	const end = at.$end ?? index + 1;
	if (isCoordinate(value) || !editedWithin(tree, index, end, false)) return tree.snapshot(index, holderByte);
	const [span] = spansOf(tree.snapshotSpans(holderByte ?? at.$span.start, [at.$span.start, at.$span.end]));
	return copyIn(value, tree, holderByte ?? at.$span.start, at.$span.start, span);
}

/**
 * A node's own data, with every key that names a tree removed: its storage snapshotted under its own
 * start (`own`), its trivia's coordinate entries turned into text measured from its holder (`outer`),
 * inner-gap entries measured from its own start, and its span set when it has one.
 */
function copyIn(
	value: Record<string, unknown>,
	tree: SnapshotTree | undefined,
	outer: number | undefined,
	own: number | undefined,
	span: PointSpanData | undefined
): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const key of Object.keys(value)) {
		const raw = value[key];
		if (!isDataKey(key) || key === '$_layout' || typeof raw === 'function') continue;
		out[key] = isStorageKey(key) ? snapshotIn(raw, own, tree) : raw;
	}
	const layout = value.$_layout as { readonly trivia?: TriviaSides<unknown> } | undefined;
	const trivia = layout?.trivia === undefined ? undefined : snapshotTrivia(layout.trivia, tree, outer, own);
	if (trivia !== undefined || span !== undefined) out.$_layout = { ...(trivia && { trivia }), ...(span && { span }) };
	return out;
}

/**
 * Trivia sides whose coordinate entries become `{ $type, $text, span }`, each measured from `outer`,
 * or from `own` in an inner gap; a written entry is copied as a built node is.
 */
function snapshotTrivia(
	trivia: TriviaSides<unknown>,
	tree: SnapshotTree | undefined,
	outer: number | undefined,
	own: number | undefined
): TriviaSides<unknown> {
	const entries = (list: readonly unknown[], from: number | undefined): unknown[] => {
		const coords = list.filter((entry): entry is Record<string, unknown> & { $span: { start: number; end: number } } => isRecord(entry) && isCoordinate(entry));
		if (tree === undefined || from === undefined || coords.length === 0) return list.map((entry) => snapshotIn(entry, from, tree));
		const slice = spanSlicer(tree.source);
		const spans = spansOf(tree.snapshotSpans(from, coords.flatMap((entry) => [entry.$span.start, entry.$span.end])));
		let next = 0;
		return list.map((entry) => {
			if (!isRecord(entry) || !isCoordinate(entry)) return snapshotIn(entry, from, tree);
			const { $treeHandle: _tree, $span, $end: _end, ...rest } = entry as Record<string, unknown> & { $span: { start: number; end: number } };
			return { ...rest, $text: slice($span), span: spans[next++] };
		});
	};
	const { leading, trailing, inner } = trivia;
	return {
		...(leading && { leading: entries(leading, outer) }),
		...(trailing && { trailing: entries(trailing, outer) }),
		...(inner && { inner: Object.fromEntries(Object.entries(inner).map(([gap, list]) => [gap, list && entries(list, own)])) })
	};
}
