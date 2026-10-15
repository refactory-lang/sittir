import type { PortableCondition, PortableStep, QueryPlan, QuerySubject, SlotSubject } from '@sittir/types';
import { WILDCARD, type CaptureSite, type PredicateFact, type SlotModel } from '../../../bindings/facts.ts';
import { comparesOwnText, slotAnchor, slotFor, type ChildTest, type ReadEntry } from '../../../bindings/routes.ts';
import type { NodeMap } from '../../../compiler/types.ts';
import { transportSlotNumbers } from '../../render-module.ts';
import { keywordPresenceValue } from '../../shared.ts';

export type SlotSubjectOf = (kind: string, slot: string) => SlotSubject | undefined;

export type PresenceKeywordOf = (kind: string, slot: string) => string | undefined;

export type TypeOf = (kind: string) => number | undefined;

export const slotSubjectOf =
	(nodeMap: NodeMap): SlotSubjectOf =>
	(kind, name) => {
		const node = nodeMap.nodes.get(kind);
		const slot = node?.slots.find((s) => s.name === name);
		const number = node === undefined || slot === undefined ? undefined : transportSlotNumbers(node, nodeMap).get(slot.storageName);
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
		const slot = slotFor(model, model.get(holder)?.slots ?? [], selector);
		const subject = slot === undefined ? undefined : subjectOf(holder, slot.name);
		if (subject === undefined) return `no slot of ${holder} holds ${JSON.stringify(selector)}`;
		const anchor = slotAnchor(model, holder, selector);
		steps.push(anchor === null ? subject : { ...subject, anchor });
		holder = selector.kind ?? undefined;
	}
	return { steps, kind: holder };
}

function aliasContent(model: SlotModel, kind: string | undefined, subjectOf: SlotSubjectOf): { readonly subject: SlotSubject; readonly kind: string | undefined } | undefined {
	const node = kind === undefined ? undefined : model.get(kind);
	const [content, ...rest] = node?.modelType === 'alias' ? node.slots : [];
	if (content === undefined || rest.length > 0 || kind === undefined) return undefined;
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

export function readTestOf(entry: ReadEntry, model: SlotModel, subjectOf: SlotSubjectOf, presenceOf: PresenceKeywordOf, typeOf: TypeOf): PortableCondition[] {
	const pins = entry.pins.map((pin): PortableCondition | string => {
		const plan = keywordTestOf(entry.kind, pin.slot, pin.text, subjectOf, presenceOf);
		return typeof plan === 'string' ? plan : { up: 0, via: [], plan };
	});
	const predicates = [...entry.claim.predicates.filter((p) => entry.spelled !== true || !comparesOwnText(p)), ...entry.children.map(childPredicate)];
	const conditions = [...pins, ...predicates.map((p) => (typeof p === 'string' ? p : conditionOf(entry, p, model, subjectOf, typeOf)))];
	const refused = conditions.filter((c) => typeof c === 'string');
	if (refused.length > 0) throw new Error(`portable: cannot test ${entry.kind} as ${entry.vocab}: ${refused.join('; ')}`);
	const unique = new Map((conditions as PortableCondition[]).map((condition) => [JSON.stringify(condition), condition]));
	return [...unique.values()];
}
