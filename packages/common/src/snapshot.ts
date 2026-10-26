import type { Snapshot } from '@sittir/types';
import { decodeIndex, isCoordinate, type TreeHandle } from './read.ts';
import { coordinateOf, isDataKey, isStorageKey, mapSideEntries, mapUnitSides, nodeText, separatorOf, sidesOf, slotsOf, unitSidesOf, withinSides } from './node-data.ts';
import { treeOf, treeTokenOf, type TreeToken } from './tree-token.ts';
import type { TriviaSides } from './trivia.ts';
import { readCoordinate } from './side-entries.ts';

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
 * @throws when a node is among its own sides, at any depth, and when a side in it nests past the addon's bound.
 */
export function snapshotOf(value: object): Snapshot {
	return snapshotIn(value, undefined, undefined, new Set(), 0) as Snapshot;
}

export function entrySnapshotOf(entry: object): Snapshot {
	return snapshotIn(entry, undefined, undefined, new Set(), 1) as Snapshot;
}

function snapshotIn(value: unknown, holderByte: number | undefined, holderTree: SnapshotTree | undefined, within: Set<object>, nesting: number): unknown {
	if (Array.isArray(value)) return value.map((entry) => snapshotIn(entry, holderByte, holderTree, within, nesting));
	if (!isRecord(value)) return value;
	return withinSides(value, within, () => {
		const at = coordinateOf(value);
		const tree = at === undefined ? undefined : snapshotTreeOf(value, holderTree);
		if (at === undefined || tree === undefined) return copyOf(value, within, nesting);
		const read = tree.snapshot(decodeIndex(at.$treeHandle), holderByte);
		return detached(read, { tree, own: treeTokenOf(value), within }, nesting);
	});
}

interface Detaching {
	readonly tree: SnapshotTree;
	readonly own: TreeToken | undefined;
	readonly within: Set<object>;
}

function detached(read: unknown, from: Detaching, nesting: number): unknown {
	const work: [unknown, number][] = [[read, nesting]];
	const visit = (entry: unknown, inside: number): unknown => {
		if (isCoordinate(entry)) return snapshotIn(readCoordinate(from.tree, entry, from.own), undefined, undefined, from.within, inside);
		work.push([entry, inside]);
		return entry;
	};
	for (let next = work.pop(); next !== undefined; next = work.pop()) {
		const [value, holder] = next;
		if (Array.isArray(value)) {
			value.forEach((entry, index) => (value[index] = visit(entry, holder)));
			continue;
		}
		if (!isRecord(value)) continue;
		for (const key of Object.keys(value)) {
			const held = value[key];
			if (key !== '$_layout') value[key] = visit(held, holder);
			else if (isRecord(held)) {
				if (isRecord(held.trivia)) held.trivia = mapSideEntries(held.trivia as TriviaSides<unknown>, holder, visit);
				if (Array.isArray(held.units)) held.units = mapUnitSides(held.units, holder, visit);
			}
		}
	}
	return read;
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
