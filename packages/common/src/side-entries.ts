import type { EngineIdentity, NodeCoordinate, TriviaEntry } from '@sittir/types';
import { engineOf, sameLanguage } from './engine-scope.ts';
import { heldSideData, holdReadTree, readCoordinateOf } from './node-data.ts';
import { decodeTree, isCoordinate, type TriviaSideName } from './read.ts';
import { treeOfToken, treeTokenOf, type TreeToken } from './tree-token.ts';
import { forEachTriviaList, type TriviaSides } from './trivia.ts';

const sideHolds = new WeakMap<object, Map<string, readonly TreeToken[]>>();

export interface HeldSideData {
	readonly treeId: number;
	readonly index: number;
	readonly side: TriviaSideName;
	readonly entries: readonly unknown[];
}

interface HeldSide {
	readonly index: number;
	readonly side: TriviaSideName;
	readonly entries: readonly TriviaEntry[];
}

interface HeldAddon {
	readonly disposeTree: (treeId: number) => void;
}

const heldSides = new WeakMap<TreeToken, Map<string, HeldSide>>();
const holders = new WeakMap<HeldAddon, Map<number, WeakRef<TreeToken>>>();

export function holdSide(addon: HeldAddon, token: TreeToken, index: number, side: TriviaSideName, entries: readonly TriviaEntry[]): void {
	let sides = heldSides.get(token);
	if (sides === undefined) heldSides.set(token, (sides = new Map()));
	let trees = holders.get(addon);
	if (trees === undefined) holders.set(addon, (trees = new Map()));
	if (!trees.has(token.treeId)) trees.set(token.treeId, new WeakRef(token));
	sides.set(`${index}:${side}`, { index, side, entries });
}

export function releaseSide(token: TreeToken, index: number, side: TriviaSideName): void {
	heldSides.get(token)?.delete(`${index}:${side}`);
}

export function heldSide(token: TreeToken, index: number, side: TriviaSideName): readonly TriviaEntry[] | undefined {
	return heldSides.get(token)?.get(`${index}:${side}`)?.entries;
}

export function heldProjection(addon: HeldAddon): HeldSideData[] | undefined {
	const trees = holders.get(addon);
	if (trees === undefined) return undefined;
	const held: HeldSideData[] = [];
	for (const [treeId, ref] of trees) {
		const token = ref.deref();
		if (token === undefined) {
			trees.delete(treeId);
			addon.disposeTree(treeId);
			continue;
		}
		const table = treeOfToken(token);
		for (const { index, side, entries } of heldSides.get(token)?.values() ?? []) {
			const reads = new Set<TreeToken>();
			held.push({ treeId, index, side, entries: heldSideData(entries, reads) });
			if (table !== undefined) holdTrees(table, `${index}:${side}`, reads);
		}
	}
	if (trees.size === 0) holders.delete(addon);
	return held.length === 0 ? undefined : held;
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
	holdTrees(table, place, trees);
}

function holdTrees(table: object, place: string, trees: ReadonlySet<TreeToken>): void {
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
