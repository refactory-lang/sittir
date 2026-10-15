import type { PortableCondition, QueryPlan, QuerySubject, SlotSubject } from '@sittir/types';
import type { MemberRoute, SlotStep } from '../../../bindings/routes.ts';
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
		if (placed || test.some((condition) => condition.up > 0) || !lowered.every(isNative)) contextual.add(flag);
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
