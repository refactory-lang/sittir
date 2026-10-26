import type { Snapshot } from '@sittir/types';
import { decodeIndex, isCoordinate, type TreeHandle } from './read.ts';
import { coordinateOf, isDataKey, isStorageKey, mapSideEntries, mapUnitSides, nodeText, separatorOf, sidesOf, slotsOf, unitSidesOf } from './node-data.ts';
import { treeOf, treeTokenOf, type TreeToken } from './tree-token.ts';
import type { TriviaSides } from './trivia.ts';
import { readCoordinate } from './side-entries.ts';
import { copyDown, copyEntries, type Below } from './copy-down.ts';

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

interface SnapshotVisit {
	readonly value: unknown;
	readonly holderByte: number | undefined;
	readonly holderTree: SnapshotTree | undefined;
}

function snapshotIn(value: unknown, holderByte: number | undefined, holderTree: SnapshotTree | undefined): unknown {
	return copyDown<SnapshotVisit>({ value, holderByte, holderTree }, snapshotStep);
}

function snapshotStep({ value, holderByte, holderTree }: SnapshotVisit, below: Below<SnapshotVisit>): unknown {
	if (Array.isArray(value)) return copyEntries(value, below, (entry) => ({ value: entry, holderByte, holderTree }));
	if (!isRecord(value)) return value;
	const at = coordinateOf(value);
	const tree = at === undefined ? undefined : snapshotTreeOf(value, holderTree);
	if (at === undefined || tree === undefined) return copyOf(value, below);
	const read = tree.snapshot(decodeIndex(at.$treeHandle), holderByte);
	return detached(read, { tree, own: treeTokenOf(value) });
}

interface Detaching {
	readonly tree: SnapshotTree;
	readonly own: TreeToken | undefined;
}

function detached(read: unknown, from: Detaching): unknown {
	const work: unknown[] = [read];
	const visit = (entry: unknown): unknown => {
		if (isCoordinate(entry)) return snapshotIn(readCoordinate(from.tree, entry, from.own), undefined, undefined);
		work.push(entry);
		return entry;
	};
	while (work.length > 0) {
		const value = work.pop();
		if (Array.isArray(value)) {
			value.forEach((entry, index) => (value[index] = visit(entry)));
			continue;
		}
		if (!isRecord(value)) continue;
		for (const key of Object.keys(value)) {
			const held = value[key];
			if (key !== '$_layout') value[key] = visit(held);
			else if (isRecord(held)) {
				if (isRecord(held.trivia)) held.trivia = mapSideEntries(held.trivia as TriviaSides<unknown>, visit);
				if (Array.isArray(held.units)) held.units = mapUnitSides(held.units, visit);
			}
		}
	}
	return read;
}

function copyOf(value: Record<string, unknown>, below: Below<SnapshotVisit>): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const key of Object.keys(value)) {
		const raw = value[key];
		if (key === '$text') {
			out.$text = nodeText(value);
			continue;
		}
		if (!isDataKey(key) || key === '$_layout' || typeof raw === 'function') continue;
		if (isStorageKey(key)) below.at(out, key, { value: raw, holderByte: undefined, holderTree: undefined });
		else out[key] = raw;
	}
	const each = (entry: unknown) => snapshotIn(entry, undefined, undefined);
	const sides = sidesOf(value);
	const unitSides = unitSidesOf(value);
	const units = unitSides === undefined ? undefined : mapUnitSides(unitSides, each);
	const slots = slotsOf(value);
	const separator = separatorOf(value);
	const layout = {
		...(sides === undefined ? {} : { trivia: mapSideEntries(sides as TriviaSides<unknown>, each) }),
		...(units === undefined || units.length === 0 ? {} : { units }),
		...(slots === undefined || slots.length === 0 ? {} : { slots }),
		...(separator === undefined ? {} : { separator })
	};
	if (Object.keys(layout).length > 0) out.$_layout = layout;
	return out;
}
