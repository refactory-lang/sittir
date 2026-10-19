import type { PortableCondition, PortableReadEntry, PortableRows, QuerySubject, SlotSubject } from '@sittir/types';
import { anchored, holds, slotItems } from '../query-holds.ts';
import { spanSlicer, type ByteSpan } from '../span.ts';
import { treeOf } from '../tree-token.ts';
import { spanOf } from '../node-data.ts';

type Node = { readonly $type: number; readonly $text?: string };

/** Reads a node or a bare kind id of a bound grammar as the vocabulary path of its kind's first read entry that holds, if any. */
export type PortableClassifier = <T extends Node>(value: T | number) => string | undefined;

/** Whether a value is an object with a numeric kind id, the shape a classifier reads. */
export const hasKind = (value: unknown): value is Node =>
	typeof value === 'object' && value !== null && typeof (value as Node).$type === 'number';

const unplaced = (entry: PortableReadEntry): boolean =>
	entry.within.length === 0 && entry.test.every((condition) => condition.up === 0);

const classifiers = new WeakMap<PortableRows, PortableClassifier>();

/**
 * The classifier of a bound grammar's portable rows, built once per rows object.
 *
 * @param rows - The rows a bound grammar's engine carries.
 * @returns A function reading a node, or a bare kind id, as the path of its kind's first read entry that holds. An entry that
 * depends on where the value sits (a placement, or a condition on an enclosing node) is skipped, so the value reads as its next
 * entry. A kind id reads its own text from the fixed texts and holds no slot.
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
					? (item.$text ?? sliceOf(item))
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
	return (value) =>
		table.entries[typeof value === 'number' ? value : value.$type]?.find(
			(entry) => unplaced(entry) && entry.test.every((condition) => conditionHolds(condition, value))
		)?.path;
}
