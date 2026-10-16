import type { PortableCondition, QueryPlan, QuerySubject, SlotFlagRefusal, SlotSubject } from '@sittir/types';
import type { MemberRoute, SlotStep } from '../../../bindings/routes.ts';
import type { AssembledNode, AssembledNonterminal } from '../../../compiler/model/node-map.ts';
import { keywordTestOf, type PresenceKeywordOf, type SlotSubjectOf } from './read-tests.ts';

export interface ClaimFlag {
	readonly flag: string;
	readonly test: readonly PortableCondition[];
	readonly placed: boolean;
}

export interface FlagPlansInput {
	readonly kind: string;
	readonly members: readonly MemberRoute[];
	readonly claimFlags: readonly ClaimFlag[];
	readonly subjectOf: SlotSubjectOf;
	readonly presenceOf: PresenceKeywordOf;
	readonly typesOf: (kind: string) => readonly number[];
}

const ALWAYS: QueryPlan = { op: 'and', of: [] };

const isNative = (plan: QueryPlan<QuerySubject>): plan is QueryPlan => {
	switch (plan.op) {
		case 'eq':
		case 'match':
		case 'is':
			return !('self' in plan);
		case 'present':
			return true;
		case 'child':
		case 'not':
			return isNative(plan.of);
		case 'and':
		case 'or':
			return plan.of.every(isNative);
	}
};

export function flagPlansOf(input: FlagPlansInput): Map<string, QueryPlan | null> {
	const { kind, subjectOf, presenceOf, typesOf } = input;
	const refuse = (flag: string, why: string): never => {
		throw new Error(`portable: cannot test ${kind}'s flag ${flag}: ${why}`);
	};
	const subjectAt = (flag: string, step: SlotStep): SlotSubject => subjectOf(step.owner, step.slot) ?? refuse(flag, `no number for ${step.owner}'s slot ${step.slot}`);
	const leafOf = (route: MemberRoute, last: SlotStep): QueryPlan => {
		switch (route.route) {
			case 'slot':
				return { op: 'present', ...subjectAt(route.name, last) };
			case 'presence': {
				const plan = keywordTestOf(last.owner, last.slot, route.token, subjectOf, presenceOf);
				return typeof plan === 'string' ? refuse(route.name, plan) : plan;
			}
			case 'kind':
				return { op: 'is', types: typesOf(route.kind), ...subjectAt(route.name, last) };
			case 'nested': {
				const captured = route.selector.kind;
				return captured === null || captured === '_' ? { op: 'present', ...subjectAt(route.name, last) } : { op: 'is', types: typesOf(captured), ...subjectAt(route.name, last) };
			}
		}
	};
	const planOf = (route: MemberRoute): QueryPlan => {
		if (route.spelled === true) return ALWAYS;
		if (route.path === undefined) return refuse(route.name, 'its route reaches no slot');
		const last = route.path.at(-1) ?? refuse(route.name, 'its route has no step');
		return route.path.slice(0, -1).reduceRight<QueryPlan>((of, step) => ({ op: 'child', ...subjectAt(route.name, step), ...(step.anchor === undefined ? {} : { anchor: step.anchor }), of }), leafOf(route, last));
	};
	const conditionPlan = (condition: PortableCondition): QueryPlan<QuerySubject> =>
		condition.via.reduceRight<QueryPlan<QuerySubject>>((of, step) => ({ op: 'child', slots: step.slots, ...(step.anchor === undefined ? {} : { anchor: step.anchor }), of }), condition.plan);
	const alternatives = new Map<string, QueryPlan[]>();
	const add = (flag: string, plan: QueryPlan): void => {
		const known = alternatives.get(flag) ?? alternatives.set(flag, []).get(flag)!;
		if (!known.some((other) => JSON.stringify(other) === JSON.stringify(plan))) known.push(plan);
	};
	for (const route of input.members) if (route.flag === true) add(route.name, planOf(route));
	const contextual = new Set<string>();
	for (const { flag, test, placed } of input.claimFlags) {
		const lowered = test.map(conditionPlan);
		if (placed || test.some((condition) => condition.up > 0)) contextual.add(flag);
		else if (!lowered.every(isNative)) refuse(flag, 'its claim compares the node\'s own text, which only a kind with fixed text decides');
		else add(flag, lowered.length === 1 ? lowered[0]! : { op: 'and', of: lowered });
	}
	const plans = new Map<string, QueryPlan | null>();
	for (const [flag, known] of alternatives) {
		if (contextual.has(flag)) refuse(flag, 'it is declared both on the node and by a claim that depends on its context');
		plans.set(flag, known.length === 1 ? known[0]! : { op: 'or', of: known });
	}
	for (const flag of contextual) plans.set(flag, null);
	return plans;
}

export type SlotFlag = readonly number[] | SlotFlagRefusal;

export interface SlotFlagsInput {
	readonly nodes: Iterable<AssembledNode>;
	readonly kindsOf: (slot: AssembledNonterminal) => readonly string[];
	readonly plans: ReadonlyMap<string, ReadonlyMap<string, QueryPlan | null>>;
	readonly typeOf: (kind: string) => number | undefined;
	readonly typesOf: (kind: string) => readonly number[];
}

const isAlways = (plan: QueryPlan): boolean => plan.op === 'and' && plan.of.length === 0;

export interface SlotFlagsRow {
	readonly node: AssembledNode;
	readonly slots: ReadonlyMap<string, ReadonlyMap<string, SlotFlag>>;
}

export function slotFlagsOf({ nodes, kindsOf, plans, typeOf, typesOf }: SlotFlagsInput): Map<number, SlotFlagsRow> {
	const rows = new Map<number, SlotFlagsRow>();
	for (const node of nodes) {
		if (node.kindId === undefined || node.slots.length === 0) continue;
		const slots = new Map<string, Map<string, SlotFlag>>();
		for (const slot of node.slots) {
			const flags = new Map<string, SlotFlag>();
			for (const kind of kindsOf(slot)) {
				for (const [flag, plan] of plans.get(kind) ?? []) {
					const held = flags.get(flag);
					if (held !== undefined && !Array.isArray(held)) continue;
					if (plan === null || !isAlways(plan)) {
						const id = typeOf(kind);
						if (id !== undefined) flags.set(flag, { kind: id, context: plan === null });
						continue;
					}
					flags.set(flag, [...new Set([...((held as readonly number[] | undefined) ?? []), ...typesOf(kind)])].sort((a, b) => a - b));
				}
			}
			if (flags.size > 0) slots.set(slot.propertyName, new Map([...flags].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))));
		}
		if (slots.size === 0) continue;
		const claimed = rows.get(node.kindId);
		if (claimed !== undefined && JSON.stringify([...claimed.slots].map(([k, v]) => [k, [...v]])) !== JSON.stringify([...slots].map(([k, v]) => [k, [...v]])))
			throw new Error(`portable: kind id ${node.kindId} ('${node.kind}') has two slot flag tables`);
		rows.set(node.kindId, { node, slots });
	}
	return new Map([...rows].sort(([a], [b]) => a - b));
}
