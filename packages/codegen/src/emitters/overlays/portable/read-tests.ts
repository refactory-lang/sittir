import type { PortableCondition, QueryPlan, QuerySubject, SlotRoutes } from '@sittir/types';
import { WILDCARD, type CaptureSite, type PredicateFact, type SlotModel } from '../../../bindings/facts.ts';
import { slotFor, type ReadEntry } from '../../../bindings/routes.ts';
import type { NodeMap } from '../../../compiler/types.ts';
import { queryRoutesOf } from '../../client-utils.ts';

export type SlotRoutesOf = (kind: string, slot: string) => SlotRoutes | undefined;

export const slotRoutesOf =
	(nodeMap: NodeMap): SlotRoutesOf =>
	(kind, name) => {
		const slot = nodeMap.nodes.get(kind)?.slots.find((s) => s.name === name);
		return slot === undefined ? undefined : queryRoutesOf(slot, nodeMap);
	};

interface Steps {
	readonly steps: SlotRoutes[];
	readonly kind: string | undefined;
}

function stepsOf(entry: ReadEntry, site: CaptureSite, model: SlotModel, routesOf: SlotRoutesOf): Steps | string {
	let holder = site.up === 0 ? entry.kind : entry.claim.within[site.up - 1];
	const steps: SlotRoutes[] = [];
	for (const selector of site.down) {
		if (holder === undefined || holder === WILDCARD) return 'its capture sits under a wildcard';
		const slot = slotFor(model, model.get(holder)?.slots ?? [], selector);
		const routes = slot === undefined ? undefined : routesOf(holder, slot.name);
		if (routes === undefined) return `no slot of ${holder} holds ${JSON.stringify(selector)}`;
		steps.push(routes);
		holder = selector.kind ?? undefined;
	}
	return { steps, kind: holder };
}

function aliasContent(model: SlotModel, kind: string | undefined, routesOf: SlotRoutesOf): { readonly routes: SlotRoutes; readonly kind: string | undefined } | undefined {
	const node = kind === undefined ? undefined : model.get(kind);
	const [content, ...rest] = node?.modelType === 'alias' ? node.slots : [];
	if (content === undefined || rest.length > 0 || kind === undefined) return undefined;
	const routes = routesOf(kind, content.name);
	return routes === undefined ? undefined : { routes, kind: content.kinds.length === 1 ? content.kinds[0] : undefined };
}

function conditionOf(entry: ReadEntry, predicate: PredicateFact, model: SlotModel, routesOf: SlotRoutesOf): PortableCondition | string {
	const [argument, ...rest] = predicate.arguments;
	if (predicate.operator !== 'eq' && predicate.operator !== 'match') return `operator ${predicate.operator}`;
	if (predicate.subject === null || argument === undefined || !('text' in argument) || rest.length > 0)
		return `${predicate.operator} does not compare one capture with one text`;
	const reached = stepsOf(entry, predicate.subject, model, routesOf);
	if (typeof reached === 'string') return reached;
	const steps = [...reached.steps];
	let kind = reached.kind;
	let wrapped = false;
	for (let content = aliasContent(model, kind, routesOf); content !== undefined; content = aliasContent(model, kind, routesOf)) {
		steps.push(content.routes);
		kind = content.kind;
		wrapped = true;
	}
	const subject = (wrapped ? undefined : steps.pop()) ?? { self: true as const };
	const plan: QueryPlan<QuerySubject> =
		predicate.operator === 'eq' ? { op: 'eq', text: argument.text, ...subject } : { op: 'match', pattern: argument.text, ...subject };
	return { up: predicate.subject.up, via: steps, plan };
}

export function readTestOf(entry: ReadEntry, model: SlotModel, routesOf: SlotRoutesOf): PortableCondition[] {
	const pins = entry.pins.map((pin): PortableCondition | string => {
		const routes = routesOf(entry.kind, pin.slot);
		return routes === undefined ? `no routes for pinned slot ${pin.slot}` : { up: 0, via: [], plan: { op: 'eq', text: pin.text, ...routes } };
	});
	const conditions = [...pins, ...entry.claim.predicates.map((p) => conditionOf(entry, p, model, routesOf))];
	const refused = conditions.filter((c) => typeof c === 'string');
	if (refused.length > 0) throw new Error(`portable: cannot test ${entry.kind} as ${entry.vocab}: ${refused.join('; ')}`);
	return conditions as PortableCondition[];
}
