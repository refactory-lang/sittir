import type { PortableCondition, PortableStep, QueryPlan, QuerySubject, SlotSubject, StepAnchor } from '@sittir/types';
import { slotReader } from './record-view.ts';

export function refuse(message: string): never {
	throw new TypeError(message);
}

export function slotItems(node: object, accessor: string): readonly unknown[] {
	const read = slotReader(node, accessor);
	const value = typeof read === 'function' ? (read as () => unknown).call(node) : read;
	return Array.isArray(value) ? value : value === undefined ? [] : [value];
}

const NO_TYPES = (): never => refuse('query: an is plan tests node types, and this caller reads none');

const NO_CHILDREN = (): never => refuse('query: a child plan tests a node\'s children, and this caller reads none');

const NO_COUNT = (): never => refuse('query: a count plan counts a slot\'s values, and this caller reads none');

const NO_DELIMITERS = (): never => refuse('query: a delimiter plan tests a list\'s delimiter flags, and this caller reads none');

export function anchored<T>(items: readonly T[], anchor: StepAnchor | undefined): readonly T[] {
	if (anchor === undefined) return items;
	if (anchor === 'first') return items.slice(0, 1);
	if (anchor === 'last') return items.slice(-1);
	return items.length === 1 ? items : [];
}

export interface PlanSubjects {
	readonly texts: (subject: QuerySubject) => readonly string[];
	readonly types?: (subject: QuerySubject) => readonly number[];
	readonly children?: (subject: SlotSubject) => readonly PlanSubjects[];
	readonly count?: (subject: SlotSubject) => number;
	readonly delimiters?: () => readonly number[];
}

export function holds(plan: QueryPlan<QuerySubject>, subjects: PlanSubjects): boolean {
	const { texts, types = NO_TYPES, children = NO_CHILDREN, count = NO_COUNT, delimiters = NO_DELIMITERS } = subjects;
	switch (plan.op) {
		case 'eq':
			return texts(plan).includes(plan.text);
		case 'match': {
			const pattern = new RegExp(plan.pattern, 'u');
			return texts(plan).some((text) => pattern.test(text));
		}
		case 'present':
			return texts(plan).length > 0;
		case 'count':
			return count(plan) >= plan.min;
		case 'delimiter':
			return delimiters().some((stamped) => (stamped & plan.delimiter) !== 0);
		case 'is':
			return types(plan).some((type) => plan.types.includes(type));
		case 'child':
			return anchored(children(plan), plan.anchor).some((child) => holds(plan.of, child));
		case 'not':
			return !holds(plan.of, subjects);
		case 'and':
			return plan.of.every((p) => holds(p, subjects));
		case 'or':
			return plan.of.some((p) => holds(p, subjects));
	}
}

export interface PlanItems<N> {
	readonly isNode: (item: unknown) => item is N;
	readonly itemsIn: (node: N, subject: SlotSubject) => readonly unknown[];
	readonly textOf: (item: unknown) => string | undefined;
	readonly typeOf: (item: unknown) => readonly number[];
	readonly delimiterOf: (item: unknown) => readonly number[];
}

export function reachedBy<N>(from: readonly unknown[], steps: readonly PortableStep[], { isNode, itemsIn }: PlanItems<N>): readonly unknown[] {
	return steps.reduce<readonly unknown[]>((reached, step) => reached.filter(isNode).flatMap((node) => anchored(itemsIn(node, step), step.anchor)), from);
}

export function planSubjects<N>(reached: readonly unknown[], items: PlanItems<N>): PlanSubjects {
	const { isNode, itemsIn, textOf, typeOf, delimiterOf } = items;
	const subjects = (subject: QuerySubject): readonly unknown[] =>
		reached.flatMap((item) => ('self' in subject ? [item] : isNode(item) ? itemsIn(item, subject) : []));
	return {
		texts: (subject) => subjects(subject).flatMap((item) => textOf(item) ?? []),
		types: (subject) => subjects(subject).flatMap(typeOf),
		children: (subject) => subjects(subject).filter(isNode).map((child) => planSubjects([child], items)),
		count: (subject) => subjects(subject).length,
		delimiters: () => reached.flatMap(delimiterOf)
	};
}

export function conditionHolds<N>(condition: PortableCondition, value: unknown, items: PlanItems<N>): boolean {
	return holds(condition.plan, planSubjects(reachedBy([value], condition.via, items), items));
}
