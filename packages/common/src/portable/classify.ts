import type { PortableCondition, PortablePath, PortableReadEntry, PortableRows, QueryPlan, QuerySubject, SlotSubject } from '@sittir/types';
import { anchored, holds, slotItems, type PlanSubjects } from '../query-holds.ts';
import { spanSlicer, type ByteSpan } from '../span.ts';
import { treeOf } from '../tree-token.ts';
import { nodeText, spanOf } from '../node-data.ts';
import { portablePathHasFacts } from './facts.ts';

type Node = { readonly $type: number };

/** Reads a node or a bare kind id of a bound grammar as the vocabulary path of its kind's first read entry that holds and that no other holding entry refines, if any. */
export type PortableClassifier = <T extends Node>(value: T | number) => string | undefined;

/** Whether a value is an object with a numeric kind id, the shape a classifier reads. */
export const hasKind = (value: unknown): value is Node =>
	typeof value === 'object' && value !== null && typeof (value as Node).$type === 'number';

const unplaced = (entry: PortableReadEntry): boolean =>
	entry.within.length === 0 && entry.test.every((condition) => condition.up === 0);

const readsItself = (plan: QueryPlan<QuerySubject>): boolean => {
	switch (plan.op) {
		case 'eq':
		case 'match':
		case 'is':
			return 'self' in plan;
		case 'present':
		case 'child':
			return false;
		case 'not':
			return readsItself(plan.of);
		case 'and':
		case 'or':
			return plan.of.every(readsItself);
	}
};

const decidesKindId = (entry: PortableReadEntry): boolean =>
	entry.test.every((condition) => condition.via.length === 0 && readsItself(condition.plan));

interface RowsReader {
	readonly classify: PortableClassifier;
	readonly flagHolds: (value: Node | number, flag: string) => boolean;
}

const readers = new WeakMap<PortableRows, RowsReader>();

const readerOf = (rows: PortableRows): RowsReader => {
	let reader = readers.get(rows);
	if (reader === undefined) readers.set(rows, (reader = rowsReader(rows)));
	return reader;
};

export const portablePathOf = (rows: PortableRows, path: string): PortablePath | undefined =>
	Object.hasOwn(rows.table.paths, path) ? rows.table.paths[path] : undefined;

export const readsAs = (rows: PortableRows, path: string, value: Node | number): boolean => {
	const admitted = portablePathOf(rows, path);
	const kind = typeof value === 'number' ? value : value.$type;
	if (admitted === undefined || !admitted.ids.includes(kind)) return false;
	return admitted.exact || portablePathHasFacts(path, classifierOf(rows)(value));
};

/**
 * The classifier of a bound grammar's portable rows, built once per rows object.
 *
 * @param rows - The rows a bound grammar's engine carries.
 * @returns A function reading a node, or a bare kind id, as the path of its kind's first read entry that holds, passing over an
 * entry whose path another holding entry refines, so a refinement that holds reads over the path it refines. An entry that
 * depends on where the value sits (a placement, or a condition on an enclosing node) is skipped, so the value reads as its next
 * entry. A kind id reads its own text from the fixed texts; it shows no slot, so an entry whose test reads one is skipped for it
 * the same way.
 */
export function classifierOf(rows: PortableRows): PortableClassifier {
	return readerOf(rows).classify;
}

/**
 * Whether a node, or a bare kind id, of a bound grammar sets `flag`: its kind's flag plan in `rows` holds over it. A kind with
 * no plan for the flag, or a plan that depends on where the value sits, answers false.
 */
export function flagHolds(rows: PortableRows, value: Node | number, flag: string): boolean {
	return readerOf(rows).flagHolds(value, flag);
}

function rowsReader({ table, querySlots, flags }: PortableRows): RowsReader {
	const itemsIn = (node: Node, subject: SlotSubject): readonly unknown[] => {
		const number = subject.slots[node.$type];
		const slot = number === undefined ? undefined : querySlots[node.$type]?.find(([, n]) => n === number);
		if (slot === undefined) return [];
		const [accessor, , keyword] = slot;
		const items = slotItems(node, accessor);
		return keyword === undefined ? items : items.flatMap((item) => (item === true ? [keyword] : []));
	};
	const slicers = new WeakMap<object, (span: ByteSpan) => string>();
	const sliceOf = (node: Node): string | undefined => {
		const tree = treeOf(node);
		const span = spanOf(node);
		if (tree?.source === undefined || span === undefined) return undefined;
		let slice = slicers.get(tree);
		if (slice === undefined) slicers.set(tree, (slice = spanSlicer(tree.source)));
		return slice(span);
	};
	const textOf = (item: unknown): string | undefined =>
		typeof item === 'string'
			? item
			: typeof item === 'number'
				? table.fixedText[item]
				: hasKind(item)
					? (nodeText(item) ?? sliceOf(item))
					: undefined;
	const typeOf = (item: unknown): readonly number[] =>
		typeof item === 'number' ? [item] : hasKind(item) ? [item.$type] : [];
	const subjectsOf = (reached: readonly unknown[]): PlanSubjects => {
		const subjects = (subject: QuerySubject): readonly unknown[] =>
			reached.flatMap((item) => ('self' in subject ? [item] : hasKind(item) ? itemsIn(item, subject) : []));
		return {
			texts: (subject) => subjects(subject).flatMap((item) => textOf(item) ?? []),
			types: (subject) => subjects(subject).flatMap(typeOf),
			children: (subject) => subjects(subject).filter(hasKind).map((child) => subjectsOf([child]))
		};
	};
	const conditionHolds = (condition: PortableCondition, value: Node | number): boolean => {
		let reached: readonly unknown[] = [value];
		for (const step of condition.via)
			reached = reached.filter(hasKind).flatMap((n) => anchored(itemsIn(n, step), step.anchor));
		return holds(condition.plan, subjectsOf(reached));
	};
	const entriesWhere = (keep: (entry: PortableReadEntry) => boolean): ReadonlyMap<number, readonly PortableReadEntry[]> =>
		new Map(Object.entries(table.entries).map(([kind, entries]) => [Number(kind), entries.filter(keep)]));
	const nodeEntries = entriesWhere(unplaced);
	const kindIdEntries = entriesWhere((entry) => unplaced(entry) && decidesKindId(entry));
	const classify: PortableClassifier = (value) => {
		const holding = ((typeof value === 'number' ? kindIdEntries.get(value) : nodeEntries.get(value.$type)) ?? []).filter((entry) =>
			entry.test.every((condition) => conditionHolds(condition, value))
		);
		return holding.find((entry) => !holding.some((other) => other.path !== entry.path && portablePathHasFacts(entry.path, other.path)))?.path;
	};
	const flagHolds = (value: Node | number, flag: string): boolean => {
		const plan = flags[typeof value === 'number' ? value : value.$type]?.[flag];
		return plan !== undefined && plan !== null && holds(plan, subjectsOf([value]));
	};
	return { classify, flagHolds };
}
