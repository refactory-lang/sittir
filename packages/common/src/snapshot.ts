import type { Snapshot } from '@sittir/types';
import { decodeIndex, type TreeHandle } from './read.ts';
import { coordinateOf, isDataKey, isStorageKey, mapSideEntries, mapUnitSides, nodeText, separatorOf, sidesOf, slotsOf, unitSidesOf, withinSides } from './node-data.ts';
import { treeOf } from './tree-token.ts';
import type { TriviaSides } from './trivia.ts';

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
 *
 * @param nesting - The nesting of the side `value` is an entry of, 0 for a node outside every side.
 * @throws when a node is among its own sides, at any depth, and when a side in it nests past the addon's bound.
 */
export function snapshotOf(value: object, nesting = 0): Snapshot {
	return snapshotIn(value, undefined, undefined, new Set(), nesting) as Snapshot;
}

function snapshotIn(value: unknown, holderByte: number | undefined, holderTree: SnapshotTree | undefined, within: Set<object>, nesting: number): unknown {
	if (Array.isArray(value)) return value.map((entry) => snapshotIn(entry, holderByte, holderTree, within, nesting));
	if (!isRecord(value)) return value;
	return withinSides(value, within, () => {
		const at = coordinateOf(value);
		const tree = at === undefined ? undefined : snapshotTreeOf(value, holderTree);
		if (at === undefined || tree === undefined) return copyOf(value, within, nesting);
		return tree.snapshot(decodeIndex(at.$treeHandle), holderByte);
	});
}

function copyOf(value: Record<string, unknown>, within: Set<object>, nesting: number): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const key of Object.keys(value)) {
		const raw = value[key];
		if (key === '$text') {
			out.$text = nodeText(value);
			continue;
		}
		if (!isDataKey(key) || key === '$_layout' || typeof raw === 'function') continue;
		out[key] = isStorageKey(key) ? snapshotIn(raw, undefined, undefined, within, nesting) : raw;
	}
	const each = (entry: unknown, inside: number) => snapshotIn(entry, undefined, undefined, within, inside);
	const sides = sidesOf(value);
	const unitSides = unitSidesOf(value);
	const units = unitSides === undefined ? undefined : mapUnitSides(unitSides, nesting, each);
	const slots = slotsOf(value);
	const separator = separatorOf(value);
	const layout = {
		...(sides === undefined ? {} : { trivia: mapSideEntries(sides as TriviaSides<unknown>, nesting, each) }),
		...(units === undefined || units.length === 0 ? {} : { units }),
		...(slots === undefined || slots.length === 0 ? {} : { slots }),
		...(separator === undefined ? {} : { separator })
	};
	if (Object.keys(layout).length > 0) out.$_layout = layout;
	return out;
}
