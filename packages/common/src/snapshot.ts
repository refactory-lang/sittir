import type { Snapshot } from '@sittir/types';
import { decodeIndex, type TreeHandle } from './read.ts';
import { coordinateOf, isDataKey, isStorageKey, separatorOf, sidesOf, slotsOf, unitSidesOf } from './node-data.ts';
import { treeOf } from './tree-token.ts';
import { mapTriviaEntries, type TriviaSides } from './trivia.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** A tree that can take snapshots: a live tree a parse read. */
type SnapshotTree = TreeHandle & Required<Pick<TreeHandle, 'snapshot'>>;

function snapshotTreeOf(value: object, fallback: SnapshotTree | undefined): SnapshotTree | undefined {
	const tree = treeOf(value) ?? fallback;
	return tree?.snapshot !== undefined ? (tree as SnapshotTree) : undefined;
}

/**
 * A snapshot of `value`, as `$snapshot()` returns it: plain data that names no tree and renders
 * from its data and its geometry.
 *
 * - A tree-backed node is one native read of its subtree, the sides its tree's trivia table gives
 *   each node (writes included) turned into text with spans.
 * - A built node keeps its data with no span, and its sides (`sidesOf`): the ones it holds, else
 *   those of the node it was rebuilt from. A tree-backed node under it is measured from its own
 *   start, since a built node has no points.
 */
export function snapshotOf(value: object): Snapshot {
	return snapshotIn(value, undefined, undefined) as Snapshot;
}

function snapshotIn(value: unknown, holderByte: number | undefined, holderTree: SnapshotTree | undefined): unknown {
	if (Array.isArray(value)) return value.map((entry) => snapshotIn(entry, holderByte, holderTree));
	if (!isRecord(value)) return value;
	const at = coordinateOf(value);
	const tree = at === undefined ? undefined : snapshotTreeOf(value, holderTree);
	if (at === undefined || tree === undefined) return copyOf(value);
	return tree.snapshot(decodeIndex(at.$treeHandle), holderByte);
}

/** A built node's own data, with every key that names a tree removed: its storage and its sides snapshotted in turn. */
function copyOf(value: Record<string, unknown>): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const key of Object.keys(value)) {
		const raw = value[key];
		if (!isDataKey(key) || key === '$_layout' || typeof raw === 'function') continue;
		out[key] = isStorageKey(key) ? snapshotIn(raw, undefined, undefined) : raw;
	}
	const snapshotted = (sides: TriviaSides<unknown>): TriviaSides<unknown> => mapTriviaEntries(sides, (entries) => entries.map((entry) => snapshotIn(entry, undefined, undefined)));
	const sides = sidesOf(value);
	const units = unitSidesOf(value)?.map((unit) => ({ ...(unit as object), ...snapshotted(unit as TriviaSides<unknown>) }));
	const slots = slotsOf(value);
	const separator = separatorOf(value);
	const layout = {
		...(sides === undefined ? {} : { trivia: snapshotted(sides as TriviaSides<unknown>) }),
		...(units === undefined || units.length === 0 ? {} : { units }),
		...(slots === undefined || slots.length === 0 ? {} : { slots }),
		...(separator === undefined ? {} : { separator })
	};
	if (Object.keys(layout).length > 0) out.$_layout = layout;
	return out;
}
