import type { PortableCondition, PortableFact, PortablePath, PortableReadEntry, PortableRows, PortableStep, QueryPlan, QuerySubject, SlotSubject } from '@sittir/types';
import { engineOf, isLive } from '../engine-scope.ts';
import { anchored, holds, slotItems, type PlanSubjects } from '../query-holds.ts';
import { spanSlicer, type ByteSpan } from '../span.ts';
import { treeOf } from '../tree-token.ts';
import { nodeText, spanOf } from '../node-data.ts';
import { portablePathHasFacts, readableEntries, unplaced } from './facts.ts';

type Node = { readonly $type: number };

class Keyword {
	constructor(
		readonly text: string,
		readonly kind: number | undefined
	) {}
}

/** Reads a node or a bare kind id of a bound grammar as the vocabulary path of its kind's first read entry that holds and that no other holding entry refines, if any. */
export type PortableClassifier = <T extends Node>(value: T | number) => string | undefined;

/** Whether a value is an object with a numeric kind id, the shape a classifier reads. */
export const hasKind = (value: unknown): value is Node =>
	typeof value === 'object' && value !== null && typeof (value as Node).$type === 'number';

const delimiterOf = (item: unknown): readonly number[] => {
	const stamped = hasKind(item) ? (item as { readonly delimiter?: unknown }).delimiter : undefined;
	return typeof stamped === 'number' ? [stamped] : [];
};

const readsItself = (plan: QueryPlan<QuerySubject>): boolean => {
	switch (plan.op) {
		case 'eq':
		case 'match':
		case 'is':
			return 'self' in plan;
		case 'present':
		case 'count':
		case 'delimiter':
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

/** A fact a node's container spells that holds for the node: the fact, the index of its item among the container's items, and the item's spelling as read. */
export interface HoldingFact {
	readonly fact: PortableFact;
	readonly index: number;
	readonly spelling?: string;
}

interface RowsReader {
	readonly classify: PortableClassifier;
	readonly factsOf: (node: Node, container: Node) => readonly HoldingFact[];
	readonly spellingOf: (kind: number, fact: string, item: unknown) => string | undefined;
	readonly slotsOf: (node: Node) => readonly (readonly [accessor: string, items: readonly unknown[]])[];
	readonly readSlots: (node: Node, path: string, flags: readonly string[]) => ReadonlySet<string>;
	readonly otherTested: (node: Node, path: string) => ReadonlySet<string>;
	readonly flagHolds: (value: Node | number, flag: string) => boolean;
	readonly builtReadsAs: (path: string, node: Node) => boolean;
	readonly textOf: (value: unknown) => string | undefined;
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

/**
 * The facts `container` spells for `node`, in the order the grammar's bindings declare them: each the first of the container's items its
 * test holds on that no earlier fact took, and one per fact name.
 */
export function factsOf(rows: PortableRows, node: Node, container: Node): readonly HoldingFact[] {
	return readerOf(rows).factsOf(node, container);
}

/** The spelling of a fact a kind's container spells, read from an item of that container: the text of the item's slot the fact spells. */
export function spellingOf(rows: PortableRows, kind: number, fact: string, item: unknown): string | undefined {
	return readerOf(rows).spellingOf(kind, fact, item);
}

export function slotsOf(rows: PortableRows, node: Node): readonly (readonly [accessor: string, items: readonly unknown[]])[] {
	return readerOf(rows).slotsOf(node);
}

export function readSlots(rows: PortableRows, node: Node, path: string, flags: readonly string[]): ReadonlySet<string> {
	return readerOf(rows).readSlots(node, path, flags);
}

export function otherTested(rows: PortableRows, node: Node, path: string): ReadonlySet<string> {
	return readerOf(rows).otherTested(node, path);
}

export function builtReadsAs(rows: PortableRows, path: string, node: Node): boolean {
	return readerOf(rows).builtReadsAs(path, node);
}

export function portableTextOf(rows: PortableRows, value: unknown): string | undefined {
	return readerOf(rows).textOf(value);
}

function rowsReader({ table, querySlots, flags }: PortableRows): RowsReader {
	const itemsIn = (node: Node, subject: SlotSubject): readonly unknown[] => {
		const number = subject.slots[node.$type];
		const slot = number === undefined ? undefined : querySlots[node.$type]?.find(([, n]) => n === number);
		if (slot === undefined) return [];
		const [accessor, , keyword, , keywordKind] = slot;
		const items = slotItems(node, accessor).filter((item) => item !== null);
		if (keyword === undefined) return items;
		const present = new Keyword(keyword, keywordKind);
		return items.flatMap((item) => (item === true ? [present] : []));
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
	const rendered = new WeakMap<object, string>();
	const renderedText = (node: Node): string | undefined => {
		if (treeOf(node) !== undefined) return undefined;
		const engine = engineOf(node);
		if (engine === undefined || !isLive(engine)) return undefined;
		let text = rendered.get(node);
		if (text === undefined) {
			const output = engine.render(node);
			try {
				rendered.set(node, (text = output.toString()));
			} finally {
				output[Symbol.dispose]();
			}
		}
		return text;
	};
	const textOf = (item: unknown): string | undefined => {
		if (item instanceof Keyword || typeof item === 'string') return typeof item === 'string' ? item : item.text;
		if (typeof item === 'number') return table.fixedText[item];
		return hasKind(item) ? (nodeText(item) ?? sliceOf(item) ?? renderedText(item)) : undefined;
	};
	const typeOf = (item: unknown): readonly number[] =>
		item instanceof Keyword ? (item.kind === undefined ? [] : [item.kind]) : typeof item === 'number' ? [item] : hasKind(item) ? [item.$type] : [];
	const subjectsOf = (reached: readonly unknown[]): PlanSubjects => {
		const subjects = (subject: QuerySubject): readonly unknown[] =>
			reached.flatMap((item) => ('self' in subject ? [item] : hasKind(item) ? itemsIn(item, subject) : []));
		return {
			texts: (subject) => subjects(subject).flatMap((item) => textOf(item) ?? []),
			types: (subject) => subjects(subject).flatMap(typeOf),
			children: (subject) => subjects(subject).filter(hasKind).map((child) => subjectsOf([child])),
			count: (subject) => subjects(subject).length,
			delimiters: () => reached.flatMap(delimiterOf)
		};
	};
	const conditionHolds = (condition: PortableCondition, value: Node | number): boolean => {
		let reached: readonly unknown[] = [value];
		for (const step of condition.via)
			reached = reached.filter(hasKind).flatMap((n) => anchored(itemsIn(n, step), step.anchor));
		return holds(condition.plan, subjectsOf(reached));
	};
	const entriesWhere = (keep: (entry: PortableReadEntry) => boolean): ReadonlyMap<number, readonly PortableReadEntry[]> =>
		new Map(Object.entries(table.entries).map(([kind, entries]) => [Number(kind), readableEntries(entries).filter(keep)]));
	const nodeEntries = entriesWhere(() => true);
	const kindIdEntries = entriesWhere(decidesKindId);
	const classify: PortableClassifier = (value) => {
		const holding = ((typeof value === 'number' ? kindIdEntries.get(value) : nodeEntries.get(value.$type)) ?? []).filter((entry) =>
			entry.test.every((condition) => conditionHolds(condition, value))
		);
		return holding.find((entry) => !holding.some((other) => other.path !== entry.path && portablePathHasFacts(entry.path, other.path)))?.path;
	};
	const textsAt = (node: Node, steps: readonly PortableStep[]): readonly string[] =>
		steps
			.reduce<readonly unknown[]>((reached, step) => reached.filter(hasKind).flatMap((n) => anchored(itemsIn(n, step), step.anchor)), [node])
			.flatMap((item) => textOf(item) ?? []);
	const sameText = (a: readonly string[], b: readonly string[]): boolean => a.length === 1 && b.length === 1 && a[0] === b[0];
	const factsOf = (node: Node, container: Node): readonly HoldingFact[] => {
		const facts = (table.facts?.[node.$type] ?? []).filter((fact) => fact.container === container.$type);
		const holding: HoldingFact[] = [];
		const taken = new Set<number>();
		for (const fact of facts) {
			if (holding.some((held) => held.fact.name === fact.name)) continue;
			const items = itemsIn(container, fact.items);
			const index = items.findIndex(
				(item, i) =>
					!taken.has(i) &&
					hasKind(item) &&
					holds(fact.test, subjectsOf([item])) &&
					(fact.same === undefined || sameText(textsAt(item, fact.same.item), textsAt(node, fact.same.node)))
			);
			if (index < 0) continue;
			taken.add(index);
			const spelled = fact.spelled === undefined || fact.same !== undefined ? undefined : textsAt(items[index] as Node, [fact.spelled]);
			holding.push({ fact, index, ...(spelled?.length === 1 ? { spelling: spelled[0]! } : {}) });
		}
		return holding;
	};
	const spellingOf = (kind: number, name: string, item: unknown): string | undefined => {
		const spelled = (table.facts?.[kind] ?? []).find((fact) => fact.name === name && fact.spelled !== undefined)?.spelled;
		const texts = spelled === undefined || !hasKind(item) ? [] : textsAt(item, [spelled]);
		return texts.length === 1 ? texts[0] : undefined;
	};
	const flagHolds = (value: Node | number, flag: string): boolean => {
		const plan = flags[typeof value === 'number' ? value : value.$type]?.[flag];
		return plan !== undefined && plan !== null && holds(plan, subjectsOf([value]));
	};
	const slotsOf = (node: Node): readonly (readonly [string, readonly unknown[]])[] =>
		(querySlots[node.$type] ?? []).map(([accessor]) => [accessor, slotItems(node, accessor)] as const);
	const numbersIn = (value: unknown, kind: number, into: Set<number>): void => {
		if (Array.isArray(value)) for (const item of value) numbersIn(item, kind, into);
		else if (typeof value === 'object' && value !== null)
			for (const [key, held] of Object.entries(value)) {
				if (key === 'slots' && typeof held === 'object' && held !== null) {
					const number = (held as Readonly<Record<number, number>>)[kind];
					if (number !== undefined) into.add(number);
				} else numbersIn(held, kind, into);
			}
	};
	const readSlots = (node: Node, path: string, flagNames: readonly string[]): ReadonlySet<string> => {
		const kind = node.$type;
		const numbers = new Set<number>();
		for (const entry of table.entries[kind] ?? []) if (entry.path === path) numbersIn(entry.test, kind, numbers);
		for (const flag of flagNames) numbersIn(flags[kind]?.[flag], kind, numbers);
		return new Set((querySlots[kind] ?? []).flatMap(([accessor, number]) => (numbers.has(number) ? [accessor] : [])));
	};
	const NONE: ReadonlySet<string> = new Set();
	const tested = new Map<number, ReadonlyMap<string, ReadonlySet<string>>>();
	const testedBy = (kind: number): ReadonlyMap<string, ReadonlySet<string>> => {
		const known = tested.get(kind);
		if (known !== undefined) return known;
		const entries = table.entries[kind] ?? [];
		const paths = [...new Set(entries.map((entry) => entry.path))];
		const slotsAt = (path: string): Set<number> => {
			const numbers = new Set<number>();
			for (const entry of entries) if (entry.path === path) numbersIn(entry.test, kind, numbers);
			return numbers;
		};
		const own = new Map(paths.map((path) => [path, slotsAt(path)] as const));
		const others = new Map<string, ReadonlySet<string>>();
		for (const path of paths) {
			const numbers = new Set(paths.flatMap((other) => (other === path ? [] : [...own.get(other)!].filter((number) => !own.get(path)!.has(number)))));
			if (numbers.size > 0) others.set(path, new Set((querySlots[kind] ?? []).flatMap(([accessor, number]) => (numbers.has(number) ? [accessor] : []))));
		}
		tested.set(kind, others);
		return others;
	};
	const otherTested = (node: Node, path: string): ReadonlySet<string> => testedBy(node.$type).get(path) ?? NONE;
	const builtReadsAs = (path: string, node: Node): boolean => {
		const entries = (table.entries[node.$type] ?? []).filter((entry) => portablePathHasFacts(path, entry.path));
		if (entries.length === 0 || !entries.every(unplaced)) return true;
		return entries.some((entry) => entry.test.every((condition) => conditionHolds(condition, node)));
	};
	return { classify, factsOf, spellingOf, slotsOf, readSlots, otherTested, flagHolds, builtReadsAs, textOf };
}
