import type { Snapshot } from '@sittir/types';
import { decodeIndex, isCoordinate, type TreeHandle } from './read.ts';
import { coordinateIndex, coordinateOf, enterPath, envelopeKindOf, isDataKey, isStorageKey, mapSideEntries, mapUnitSides, nodeText, separatorOf, sidesOf, slotsOf, unitSidesOf } from './node-data.ts';
import { treeOf, treeTokenOf, type TreeToken } from './tree-token.ts';
import type { TriviaSides } from './trivia.ts';
import { builtEntryNode, isBuiltEntry, readCoordinate } from './built-arena.ts';
import { storedSlotValues } from './record-view.ts';
import { hydrateOn } from './engine-scope.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

type SnapshotTree = TreeHandle & Required<Pick<TreeHandle, 'snapshotLayouts'>>;

function snapshotTreeOf(value: object): SnapshotTree | undefined {
	const tree = treeOf(value);
	return tree?.snapshotLayouts !== undefined ? (tree as SnapshotTree) : undefined;
}

/**
 * A snapshot of `value`, as `$snapshot()` returns it: plain data that names no tree and renders
 * from its data and its geometry. Every node is the data and slots its node surface holds.
 *
 * - A tree-backed node takes its layout from one native measure of its subtree: its span from the
 *   node that holds it, and its sides as text with spans; a built record written into one of those
 *   sides is the snapshot of its node. An alias content keeps its span alone, since its sides are
 *   its envelope's. A parsed root's `$errors` are its parse's, not its data, and are left out.
 * - A built node keeps its data with no span, and its sides (`sidesOf`): the ones it holds, else
 *   those of the node it was rebuilt from. A tree-backed node under it is measured from where it
 *   or its leading side begins, since a built node has no points.
 */
export function snapshotOf(value: object): Snapshot {
	return snapshotIn(value, undefined) as Snapshot;
}

interface Measure {
	readonly tree: SnapshotTree;
	readonly own: TreeToken | undefined;
	readonly rows: ReadonlyMap<number, Record<string, unknown>>;
}

interface Parsed {
	readonly measure: Measure;
	readonly layout: Record<string, unknown>;
}

interface SnapshotTask {
	readonly value: unknown;
	readonly measure: Measure | undefined;
	readonly holder: Record<string, unknown> | unknown[];
	readonly key: string | number;
}

interface SnapshotWalk {
	readonly work: (SnapshotTask | (() => void))[];
	readonly path: Set<object>;
}

function snapshotIn(value: unknown, measure: Measure | undefined): unknown {
	const root: Record<string, unknown> = {};
	const walk: SnapshotWalk = { work: [{ value, measure, holder: root, key: 'value' }], path: new Set() };
	while (walk.work.length > 0) {
		const task = walk.work.pop()!;
		if (typeof task === 'function') task();
		else (task.holder as Record<string | number, unknown>)[task.key] = snapshotStep(task, walk);
	}
	return root.value;
}

function snapshotStep({ value, measure }: SnapshotTask, walk: SnapshotWalk): unknown {
	const { work, path } = walk;
	if (Array.isArray(value)) {
		enterPath(path, value);
		work.push(() => path.delete(value));
		const out = value.map(() => undefined) as unknown[];
		const items: SnapshotTask[] = [];
		value.forEach((entry, index) => items.push({ value: entry, measure, holder: out, key: index }));
		for (let at = items.length - 1; at >= 0; at -= 1) work.push(items[at]!);
		return out;
	}
	if (!isRecord(value)) return value;
	const at = coordinateOf(value);
	const tree = at === undefined ? undefined : (measure?.tree ?? snapshotTreeOf(value));
	if (at === undefined || tree === undefined) return copyStep(value, walk, undefined);
	const row = coordinateIndex(at);
	const measured = measure ?? measureOf(tree, row, value);
	const layout = measured.rows.get(row);
	if (layout === undefined) throw new Error(`snapshot: the measure of a parsed subtree holds no layout for its row ${row}`);
	const node = isCoordinate(value) ? hydrateOn(tree, value) : value;
	if (!isRecord(node)) return node;
	if (isCoordinate(node)) throw new Error(`snapshot: no live engine reads the coordinate of row ${row}`);
	return copyStep(node, walk, { measure: measured, layout: envelopeKindOf(node) === undefined ? detachedLayout(layout, measured) : { span: layout.span } });
}

function measureOf(tree: SnapshotTree, row: number, value: object): Measure {
	const pairs = tree.snapshotLayouts(row) as Iterable<readonly [number, Record<string, unknown>]>;
	return { tree, own: treeTokenOf(value), rows: new Map(pairs) };
}

function detachedLayout(layout: Record<string, unknown>, { tree, own }: Measure): Record<string, unknown> {
	const visit = (entry: unknown): unknown => {
		if (isBuiltEntry(entry)) return snapshotIn(builtEntryNode(entry, tree), undefined);
		if (isCoordinate(entry)) return snapshotIn(readCoordinate(tree, entry, own), undefined);
		return entry;
	};
	if (isRecord(layout.trivia)) layout.trivia = mapSideEntries(layout.trivia as TriviaSides<unknown>, visit);
	if (Array.isArray(layout.units)) layout.units = mapUnitSides(layout.units, visit);
	return layout;
}

function copyStep(value: Record<string, unknown>, { work, path }: SnapshotWalk, parsed: Parsed | undefined): Record<string, unknown> {
	enterPath(path, value);
	const out: Record<string, unknown> = {};
	for (const key of Object.keys(value)) {
		const raw = value[key];
		if (key === '$text') {
			out.$text = nodeText(value);
			continue;
		}
		if (isStorageKey(key) || !isDataKey(key) || key === '$_layout' || typeof raw === 'function') continue;
		if (parsed !== undefined && key === '$errors') continue;
		out[key] = raw;
	}
	if (parsed !== undefined) out.$_layout = parsed.layout;
	const children: SnapshotTask[] = [];
	for (const [key, stored] of storedSlotValues(value)) {
		out[key] = undefined;
		children.push({ value: stored, measure: parsed?.measure, holder: out, key });
	}
	work.push(() => {
		if (parsed === undefined) finishCopy(value, out);
		path.delete(value);
	});
	for (let at = children.length - 1; at >= 0; at -= 1) work.push(children[at]!);
	return out;
}

function finishCopy(value: Record<string, unknown>, out: Record<string, unknown>): void {
	const each = (entry: unknown) => snapshotIn(entry, undefined);
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
}
