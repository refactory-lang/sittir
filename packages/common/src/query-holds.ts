import type { QueryPlan, QuerySubject, SlotSubject, StepAnchor } from '@sittir/types';

export function refuse(message: string): never {
	throw new TypeError(message);
}

export function slotItems(node: object, accessor: string): readonly unknown[] {
	const read = (node as Record<string, unknown>)[accessor];
	const value = typeof read === 'function' ? (read as () => unknown).call(node) : read;
	return Array.isArray(value) ? value : value === undefined ? [] : [value];
}

const NO_TYPES = (): never => refuse('query: an is plan tests node types, and this caller reads none');

const NO_CHILDREN = (): never => refuse('query: a child plan tests a node\'s children, and this caller reads none');

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
}

export function holds(plan: QueryPlan<QuerySubject>, subjects: PlanSubjects): boolean {
	const { texts, types = NO_TYPES, children = NO_CHILDREN } = subjects;
	switch (plan.op) {
		case 'eq':
			return texts(plan).includes(plan.text);
		case 'match': {
			const pattern = new RegExp(plan.pattern, 'u');
			return texts(plan).some((text) => pattern.test(text));
		}
		case 'present':
			return texts(plan).length > 0;
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
