import type { PortableCondition, PortableFact, PortableStep, QueryPlan, QuerySubject, SlotSubject } from '@sittir/types';
import { WILDCARD, type CaptureSite, type PredicateFact, type SlotModel } from '../../../bindings/facts.ts';
import { Delimiter } from '@sittir/common/delimiter';
import { aliasContentSlot, comparesOwnText, heldSteps, listItems, slotAnchor, type ChildTest, type HeldStep, type ReadEntry } from '../../../bindings/routes.ts';
import type { NodeMap } from '../../../compiler/types.ts';
import { nodeSlotNumbers } from '../../render-module.ts';
import { keywordPresenceValue } from '../../shared.ts';

export type SlotSubjectOf = (kind: string, slot: string) => SlotSubject | undefined;

export type PresenceKeywordOf = (kind: string, slot: string) => string | undefined;

export type TypeOf = (kind: string) => number | undefined;

export const slotSubjectOf =
	(nodeMap: NodeMap): SlotSubjectOf =>
	(kind, name) => {
		const node = nodeMap.nodes.get(kind);
		const slot = node?.slots.find((s) => s.name === name);
		const number = node === undefined || slot === undefined ? undefined : nodeSlotNumbers(node, nodeMap).get(slot.storageName);
		return node?.kindId === undefined || number === undefined ? undefined : { slots: { [node.kindId]: number } };
	};

export const presenceKeywordOf =
	(nodeMap: NodeMap): PresenceKeywordOf =>
	(kind, name) => {
		const slot = nodeMap.nodes.get(kind)?.slots.find((s) => s.name === name);
		return slot === undefined ? undefined : keywordPresenceValue(slot, nodeMap);
	};

interface Steps {
	readonly steps: PortableStep[];
	readonly kind: string | undefined;
}

function stepsOf(entry: ReadEntry, site: CaptureSite, model: SlotModel, subjectOf: SlotSubjectOf): Steps | string {
	let holder = site.up === 0 ? entry.kind : entry.claim.within[site.up - 1];
	const steps: PortableStep[] = [];
	for (const selector of site.down) {
		if (holder === undefined || holder === WILDCARD) return 'its capture sits under a wildcard';
		const held = heldSteps(model, holder, selector);
		const subjects = held?.map((step) => subjectOf(step.holder, step.slot.name));
		if (held === undefined || subjects === undefined || subjects.some((subject) => subject === undefined)) return `no slot of ${holder} holds ${JSON.stringify(selector)}`;
		const anchor = slotAnchor(model, held.at(-1)!.holder, selector);
		steps.push(...subjects.map((subject, i) => (anchor === null || i < subjects.length - 1 ? subject! : { ...subject!, anchor })));
		holder = selector.kind ?? undefined;
	}
	return { steps, kind: holder };
}

function heldSubjects(held: readonly HeldStep[], subjectOf: SlotSubjectOf): SlotSubject[] | undefined {
	const subjects = held.map((step) => subjectOf(step.holder, step.slot.name));
	return subjects.every((subject) => subject !== undefined) ? (subjects as SlotSubject[]) : undefined;
}

function aliasContent(model: SlotModel, kind: string | undefined, subjectOf: SlotSubjectOf): { readonly subject: SlotSubject; readonly kind: string | undefined } | undefined {
	const content = kind === undefined ? undefined : aliasContentSlot(model.get(kind));
	if (content === undefined || kind === undefined) return undefined;
	const subject = subjectOf(kind, content.name);
	return subject === undefined ? undefined : { subject, kind: content.kinds.length === 1 ? content.kinds[0] : undefined };
}

type PlanOn = (subject: QuerySubject) => QueryPlan<QuerySubject>;

const comparesText = (predicate: PredicateFact): boolean => predicate.operator === 'eq' || predicate.operator === 'match';

const readAs = (model: SlotModel, kind: string): readonly string[] => [kind, ...(model.get(kind)?.enumMembers ?? []).map((member) => member.kind)];

function comparisonOf(predicate: PredicateFact, model: SlotModel, typeOf: TypeOf): PlanOn | string {
	const { operator } = predicate;
	if (operator !== 'eq' && operator !== 'match' && operator !== 'kind-eq' && operator !== 'not-kind-eq') return `operator ${operator}`;
	const texts = predicate.arguments.flatMap((a) => ('text' in a ? [a.text] : []));
	const single = comparesText(predicate);
	if (predicate.subject === null || texts.length === 0 || texts.length < predicate.arguments.length || (single && texts.length > 1))
		return `${operator} does not compare one capture with ${single ? 'one text' : 'kind names'}`;
	const [text] = texts as [string];
	if (operator === 'eq') return (subject) => ({ op: 'eq', text, ...subject });
	if (operator === 'match') return (subject) => ({ op: 'match', pattern: text, ...subject });
	const kinds = [...new Set(texts.flatMap((kind) => readAs(model, kind)))];
	const untyped = kinds.filter((kind) => typeOf(kind) === undefined);
	if (untyped.length > 0) return `${operator} names ${untyped.join(', ')}, which has no type`;
	const types = kinds.flatMap((kind) => typeOf(kind) ?? []);
	const is: PlanOn = (subject) => ({ op: 'is', types, ...subject });
	return operator === 'kind-eq' ? is : (subject) => ({ op: 'not', of: is(subject) });
}

function conditionOf(entry: ReadEntry, predicate: PredicateFact, model: SlotModel, subjectOf: SlotSubjectOf, typeOf: TypeOf): PortableCondition | string {
	const planOn = comparisonOf(predicate, model, typeOf);
	if (typeof planOn === 'string' || predicate.subject === null) return planOn as string;
	const reached = stepsOf(entry, predicate.subject, model, subjectOf);
	if (typeof reached === 'string') return reached;
	const steps = [...reached.steps];
	let kind = reached.kind;
	let wrapped = false;
	for (let content = comparesText(predicate) ? aliasContent(model, kind, subjectOf) : undefined; content !== undefined; content = aliasContent(model, kind, subjectOf)) {
		steps.push(content.subject);
		kind = content.kind;
		wrapped = true;
	}
	const last = steps.at(-1);
	const subject: QuerySubject = wrapped || last === undefined || last.anchor !== undefined ? { self: true } : steps.pop()!;
	return { up: predicate.subject.up, via: steps, plan: planOn(subject) };
}

function childPredicate(child: ChildTest): PredicateFact | string {
	if ('text' in child) return { operator: 'eq', capture: null, arguments: [{ text: child.text }], subject: child.subject };
	if ('excludes' in child) return { operator: 'not-kind-eq', capture: null, arguments: child.excludes.map((text) => ({ text })), subject: child.subject };
	if (child.kinds.length === 0) return 'a child test reaches a slot that holds no node kind';
	return { operator: 'kind-eq', capture: null, arguments: child.kinds.map((text) => ({ text })), subject: child.subject };
}

export function keywordTestOf(owner: string, slot: string, text: string, subjectOf: SlotSubjectOf, presenceOf: PresenceKeywordOf): QueryPlan | string {
	const subject = subjectOf(owner, slot);
	if (subject === undefined) return `no number for ${owner}'s slot ${slot}`;
	const keyword = presenceOf(owner, slot);
	if (keyword === undefined) return { op: 'eq', text, ...subject };
	if (text !== keyword) return `${JSON.stringify(text)} in ${owner}'s ${slot}, a boolean slot that holds only the keyword '${keyword}'`;
	return { op: 'present', ...subject };
}

function slotConditionOf(entry: ReadEntry, model: SlotModel, subjectOf: SlotSubjectOf, slot: string, planOf: (holder: string, slot: string) => QueryPlan | string): PortableCondition | string {
	const held = heldSteps(model, entry.kind, { field: slot, kind: null, after: null, anchor: null });
	const last = held?.at(-1);
	const via = held === undefined ? undefined : heldSubjects(held.slice(0, -1), subjectOf);
	if (last === undefined || via === undefined) return `no slot of ${entry.kind} holds the tested ${slot}`;
	const plan = planOf(last.holder, last.slot.name);
	return typeof plan === 'string' ? plan : { up: 0, via, plan };
}

function absenceTestOf(owner: string, slot: string, subjectOf: SlotSubjectOf): QueryPlan | string {
	const subject = subjectOf(owner, slot);
	return subject === undefined ? `no number for ${owner}'s slot ${slot}` : { op: 'not', of: { op: 'present', ...subject } };
}

function separatedTestOf(entry: ReadEntry, model: SlotModel, subjectOf: SlotSubjectOf): PortableCondition | string {
	const items = listItems(model.get(entry.kind));
	const subject = items === undefined ? undefined : subjectOf(entry.kind, items.name);
	if (subject === undefined) return `${entry.kind}'s claim tests its separator, and no numbered slot holds its items`;
	return { up: 0, via: [], plan: { op: 'or', of: [{ op: 'count', min: 2, ...subject }, { op: 'delimiter', delimiter: Delimiter.Trailing }] } };
}

export const loweredPlan = (via: readonly PortableStep[], plan: QueryPlan<QuerySubject>): QueryPlan<QuerySubject> =>
	via.reduceRight<QueryPlan<QuerySubject>>((of, step) => ({ op: 'child', slots: step.slots, ...(step.anchor === undefined ? {} : { anchor: step.anchor }), of }), plan);

const comparesCaptures = (entry: ReadEntry, predicate: PredicateFact): boolean =>
	entry.claim.within.length > 0 && predicate.arguments.some((argument) => 'capture' in argument);

export function readTestOf(entry: ReadEntry, model: SlotModel, subjectOf: SlotSubjectOf, presenceOf: PresenceKeywordOf, typeOf: TypeOf): PortableCondition[] {
	const pins = entry.pins.map((pin) => slotConditionOf(entry, model, subjectOf, pin.slot, (holder, slot) => keywordTestOf(holder, slot, pin.text, subjectOf, presenceOf)));
	const absent = entry.absent.map((field) => slotConditionOf(entry, model, subjectOf, field, (holder, slot) => absenceTestOf(holder, slot, subjectOf)));
	const predicates =
		entry.decided === true
			? []
			: [...entry.claim.predicates.filter((p) => (entry.spelled !== true || !comparesOwnText(p)) && !comparesCaptures(entry, p)), ...entry.children.map(childPredicate)];
	const separated = entry.separated === true ? [separatedTestOf(entry, model, subjectOf)] : [];
	const conditions = [...pins, ...absent, ...separated, ...predicates.map((p) => (typeof p === 'string' ? p : conditionOf(entry, p, model, subjectOf, typeOf)))];
	const refused = conditions.filter((c) => typeof c === 'string');
	if (refused.length > 0) throw new Error(`portable: cannot test ${entry.kind} as ${entry.vocab}: ${refused.join('; ')}`);
	const unique = new Map((conditions as PortableCondition[]).map((condition) => [JSON.stringify(condition), condition]));
	return [...unique.values()];
}

export type PortableFactRecord = Omit<PortableFact, 'container'> & { readonly container: string };

const sameJson = (values: readonly unknown[]): boolean => values.every((value) => JSON.stringify(value) === JSON.stringify(values[0]));

function enteredSlot(condition: PortableCondition): SlotSubject | undefined {
	const step = condition.via[1];
	if (step !== undefined) return { slots: step.slots };
	return 'slots' in condition.plan && condition.via.length === 1 ? { slots: (condition.plan as SlotSubject).slots } : undefined;
}

export function portableFactOf(
	entry: ReadEntry,
	test: readonly PortableCondition[],
	model: SlotModel,
	subjectOf: SlotSubjectOf,
	memberAt: (container: string, slot: string) => string | undefined
): PortableFactRecord | undefined {
	const placed = test.filter((condition) => condition.up > 0);
	if (placed.length === 0) return undefined;
	const refuse = (why: string): never => {
		throw new Error(`portable: ${entry.kind} as ${entry.vocab} is a fact its container spells, but ${why}`);
	};
	const [container] = entry.claim.within;
	if (container === undefined || container === WILDCARD) return refuse('its claim names no container');
	if (placed.some((condition) => condition.up !== 1) || placed.length !== test.length) return refuse('its tests reach past its container or test the node itself');
	if (!sameJson(placed.map((condition) => condition.via[0]))) return refuse('its tests reach more than one slot of its container');
	const site = entry.claim.predicates.find((predicate) => predicate.subject?.up === 1)?.subject?.down[0];
	const held = site === undefined ? undefined : heldSteps(model, container, site);
	const member = held === undefined ? undefined : memberAt(container, held[0]!.slot.name);
	if (member === undefined) return refuse(`no member of ${container} holds the items it tests`);
	const plans = placed.map((condition) => loweredPlan(condition.via.slice(1), condition.plan));
	const entered = placed.map(enteredSlot);
	const compared = entry.claim.predicates.filter((predicate) => comparesCaptures(entry, predicate));
	if (compared.length > 1) return refuse('it compares more than one pair of captures');
	const same = compared.map((predicate) => {
		const argument = predicate.arguments.find((a) => 'capture' in a);
		const item = predicate.subject === null ? undefined : stepsOf(entry, predicate.subject, model, subjectOf);
		const node = argument === undefined || !('capture' in argument) || argument.site == null ? undefined : stepsOf(entry, argument.site, model, subjectOf);
		if (predicate.operator !== 'eq' || item === undefined || typeof item === 'string' || node === undefined || typeof node === 'string' || predicate.subject?.up !== 1 || argument === undefined || !('capture' in argument) || argument.site?.up !== 0)
			return refuse('a capture it compares is not one of its container\'s items beside one of the node\'s own');
		return { item: item.steps.slice(1), node: node.steps };
	})[0];
	return {
		name: entry.claim.flag ?? entry.vocab.slice(entry.vocab.lastIndexOf('.') + 1),
		...(entry.claim.flag === undefined ? { path: entry.vocab } : { flag: entry.claim.flag }),
		container,
		member,
		items: { slots: placed[0]!.via[0]!.slots },
		test: plans.length === 1 ? plans[0]! : { op: 'and', of: plans },
		...(entered.every((slot) => slot !== undefined) && sameJson(entered) ? { spelled: entered[0]! } : {}),
		...(same === undefined ? {} : { same })
	};
}
