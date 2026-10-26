import type { EngineIdentity, NodeCoordinate } from '@sittir/types';
import { engineOf, sameLanguage } from './engine-scope.ts';
import { coordinateOf, holdReadTree, isRead, isRebuilt } from './node-data.ts';
import { decodeTree, isCoordinate } from './read.ts';
import { treeTokenOf, type TreeToken } from './tree-token.ts';
import { forEachTriviaList, type TriviaSides } from './trivia.ts';

const sideHolds = new WeakMap<object, Map<string, readonly TreeToken[]>>();

export function readCoordinateOf(entry: object): NodeCoordinate | undefined {
	return isRead(entry) && !isRebuilt(entry) ? coordinateOf(entry) : undefined;
}

export function refuseForeignEntry(entry: object, holder: EngineIdentity | undefined): void {
	const engine = engineOf(entry);
	if (engine === undefined || holder === undefined || sameLanguage(engine, holder)) return;
	throw new Error(`cannot write a ${engine.language.name} node into a side of a ${holder.language.name} node`);
}

export function holdSideEntries(table: object, place: string, entries: readonly unknown[]): void {
	const trees = new Set<TreeToken>();
	for (const entry of entries) {
		if (typeof entry !== 'object' || entry === null || readCoordinateOf(entry) === undefined) continue;
		const tree = treeTokenOf(entry);
		if (tree !== undefined) trees.add(tree);
	}
	let held = sideHolds.get(table);
	if (held === undefined) sideHolds.set(table, (held = new Map()));
	if (trees.size === 0) held.delete(place);
	else held.set(place, [...trees]);
}

export function readEntries<Entries extends readonly unknown[]>(table: object, entries: Entries, own?: TreeToken): Entries {
	for (const entry of entries) {
		if (isCoordinate(entry)) readCoordinate(table, entry, own);
		else if (own !== undefined) holdReadTree(entry, own);
	}
	return entries;
}

export function readCoordinate(table: object, coordinate: NodeCoordinate, own?: TreeToken): NodeCoordinate {
	const token = heldTree(table, decodeTree(coordinate.$treeHandle), own);
	if (token !== undefined) holdReadTree(coordinate, token);
	return coordinate;
}

export function readUnits<Units extends readonly unknown[]>(table: object, units: Units, own?: TreeToken): Units {
	for (const unit of units) forEachTriviaList(unit as TriviaSides<unknown>, (entries) => readEntries(table, entries, own));
	return units;
}

function heldTree(table: object, treeId: number, own: TreeToken | undefined): TreeToken | undefined {
	if (own?.treeId === treeId) return own;
	for (const trees of sideHolds.get(table)?.values() ?? []) {
		const token = trees.find((tree) => tree.treeId === treeId);
		if (token !== undefined) return token;
	}
	return undefined;
}
