import type { PortableCondition, PortablePath, PortableReadEntry, PortableRows, QueryPlan, QuerySubject, SlotSubject } from '@sittir/types';
import { anchored, holds, slotItems } from '../query-holds.ts';
import { sourceTextOf } from '../node-data.ts';
import { portablePathHasFacts } from './facts.ts';

type Node = { readonly $type: number };

/** Reads a node or a bare kind id of a bound grammar as the vocabulary path of its kind's first read entry that holds, if any. */
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

const classifiers = new WeakMap<PortableRows, PortableClassifier>();

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
 * @returns A function reading a node, or a bare kind id, as the path of its kind's first read entry that holds. An entry that
 * depends on where the value sits (a placement, or a condition on an enclosing node) is skipped, so the value reads as its next
 * entry. A kind id reads its own text from the fixed texts; it shows no slot, so an entry whose test reads one is skipped for it
 * the same way.
 */
export function classifierOf(rows: PortableRows): PortableClassifier {
	let classifier = classifiers.get(rows);
	if (classifier === undefined) classifiers.set(rows, (classifier = classify(rows)));
	return classifier;
}

function classify({ table, querySlots }: PortableRows): PortableClassifier {
	const itemsIn = (node: Node, subject: SlotSubject): readonly unknown[] => {
		const number = subject.slots[node.$type];
		const slot = number === undefined ? undefined : querySlots[node.$type]?.find(([, n]) => n === number);
		if (slot === undefined) return [];
		const [accessor, , keyword] = slot;
		const items = slotItems(node, accessor);
		return keyword === undefined ? items : items.flatMap((item) => (item === true ? [keyword] : []));
	};
	const textOf = (item: unknown): string | undefined =>
		typeof item === 'string'
			? item
			: typeof item === 'number'
				? table.fixedText[item]
				: hasKind(item)
					? sourceTextOf(item)
					: undefined;
	const typeOf = (item: unknown): readonly number[] =>
		typeof item === 'number' ? [item] : hasKind(item) ? [item.$type] : [];
	const conditionHolds = (condition: PortableCondition, value: Node | number): boolean => {
		let reached: readonly unknown[] = [value];
		for (const step of condition.via)
			reached = reached.filter(hasKind).flatMap((n) => anchored(itemsIn(n, step), step.anchor));
		const subjects = (subject: QuerySubject): readonly unknown[] =>
			reached.flatMap((item) => ('self' in subject ? [item] : hasKind(item) ? itemsIn(item, subject) : []));
		return holds(condition.plan, {
			texts: (subject) => subjects(subject).flatMap((item) => textOf(item) ?? []),
			types: (subject) => subjects(subject).flatMap(typeOf)
		});
	};
	const entriesWhere = (keep: (entry: PortableReadEntry) => boolean): ReadonlyMap<number, readonly PortableReadEntry[]> =>
		new Map(Object.entries(table.entries).map(([kind, entries]) => [Number(kind), entries.filter(keep)]));
	const nodeEntries = entriesWhere(unplaced);
	const kindIdEntries = entriesWhere((entry) => unplaced(entry) && decidesKindId(entry));
	return (value) =>
		(typeof value === 'number' ? kindIdEntries.get(value) : nodeEntries.get(value.$type))?.find((entry) =>
			entry.test.every((condition) => conditionHolds(condition, value))
		)?.path;
}
