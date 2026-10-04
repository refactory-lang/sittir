import type { AnyUntypedNode, Cond, QueryPlan, QuerySlots, Recorder, SlotRef, SlotRoutes } from '@sittir/types';
import { inTreeEngine } from './engine-scope.ts';
import type { TreeHandle } from './readUntypedNode.ts';
import { treeOf, treeTokenOf } from './tree-token.ts';
import { nodeAddressOf, type NodeAddress } from './utils.ts';

export interface DescendantWalk {
	readonly from: NodeAddress;
	readonly kinds?: readonly number[];
	readonly plan?: QueryPlan;
	readonly resume?: readonly number[];
	readonly limit: number;
	readonly depth?: number;
}

export interface DescendantBatch {
	readonly stubs: readonly AnyUntypedNode[];
	readonly resume: readonly number[] | null;
	readonly origin: number;
}

export interface TreeQuery {
	descendants(walk: DescendantWalk): DescendantBatch;
	planHolds(addresses: readonly NodeAddress[], plan: QueryPlan): readonly boolean[];
}

export interface QueryHooks {
	readonly querySlots: QuerySlots;
	readonly kindName: (kind: number) => string | undefined;
	readonly wrap: (data: unknown, tree: unknown) => unknown;
}

export const BATCH_LIMITS: readonly number[] = [1, 4, 16, 64, 256];

const NO_TREE =
	'query: this node holds no parsed tree (a built node, a $with draft, or a copy that lost its tree); $commit() it, then $query()';

export function queryFacet(node: object, hooks: QueryHooks): object {
	const tree = treeOf(node);
	const from = nodeAddressOf(node as AnyUntypedNode);
	if (treeTokenOf(node) === undefined || tree?.query === undefined || from === undefined) throw new Error(NO_TREE);
	const kind = (node as AnyUntypedNode).$type;
	const context: Context = { tree, query: tree.query, hooks };
	return new Proxy<Facet>({ node, kind: typeof kind === 'number' ? kind : -1, from, context }, FACET);
}

interface Context {
	readonly tree: TreeHandle;
	readonly query: TreeQuery;
	readonly hooks: QueryHooks;
}

interface Facet {
	readonly node: object;
	readonly kind: number;
	readonly from: NodeAddress;
	readonly context: Context;
}

const FACET_NAMES = ['$children', '$descendants'] as const;

function facetNames(facet: Facet): readonly string[] {
	return [...FACET_NAMES, ...slotsOf(facet.context.hooks.querySlots, facet.kind).keys()];
}

function refuse(message: string): never {
	throw new TypeError(message);
}

const FACET: ProxyHandler<Facet> = {
	get(facet, key) {
		if (typeof key !== 'string') return undefined;
		if (key === '$children') return walkView(facet, 1);
		if (key === '$descendants') return walkView(facet, undefined);
		if (slotsOf(facet.context.hooks.querySlots, facet.kind).has(key))
			return view(facet.context, { slot: key, node: facet.node }, []);
		if (key === 'then') return undefined;
		return refuse(`query: ${kindLabel(facet.context, facet.kind)} has no slot '${key}'`);
	},
	has: (facet, key) => typeof key === 'string' && facetNames(facet).includes(key),
	ownKeys: (facet) => [...facetNames(facet)],
	getOwnPropertyDescriptor: (facet, key) =>
		typeof key === 'string' && facetNames(facet).includes(key)
			? { configurable: true, enumerable: true, value: FACET.get!(facet, key, facet) }
			: undefined,
	set: () => refuse('query: a facet is read-only'),
	defineProperty: () => refuse('query: a facet is read-only'),
	deleteProperty: () => refuse('query: a facet is read-only'),
	setPrototypeOf: () => refuse('query: a facet is read-only')
};

function walkView(facet: Facet, depth: number | undefined): QueryView {
	return view(facet.context, { from: facet.from, depth }, []);
}

function kindLabel(context: Context, kind: number): string {
	return context.hooks.kindName(kind) ?? `kind ${kind}`;
}

const slotTables = new WeakMap<QuerySlots, Map<number, ReadonlyMap<string, SlotRoutes>>>();
const NO_SLOTS: ReadonlyMap<string, SlotRoutes> = new Map();

function slotsOf(table: QuerySlots, kind: number): ReadonlyMap<string, SlotRoutes> {
	let byKind = slotTables.get(table);
	if (byKind === undefined) slotTables.set(table, (byKind = new Map()));
	let slots = byKind.get(kind);
	if (slots === undefined) byKind.set(kind, (slots = table[kind] === undefined ? NO_SLOTS : new Map(table[kind])));
	return slots;
}

function everyAccessor(table: QuerySlots): ReadonlySet<string> {
	return new Set(Object.values(table).flatMap((row) => row.map(([accessor]) => accessor)));
}

type Source =
	| { readonly slot: string; readonly node: object }
	| { readonly from: NodeAddress; readonly depth: number | undefined };

type Where = (slots: Recorder<unknown>) => Cond;

type Step =
	| { readonly op: 'ofType'; readonly kind: number }
	| { readonly op: 'where'; readonly condition: Where }
	| { readonly op: 'slice'; readonly start: number; readonly end: number | undefined }
	| { readonly op: 'filter'; readonly fn: (node: unknown, index: number) => unknown }
	| { readonly op: 'map'; readonly fn: (node: unknown, index: number) => unknown }
	| { readonly op: 'flatMap'; readonly fn: (node: unknown, index: number) => unknown };

type Declarative = Extract<Step, { readonly op: 'ofType' | 'where' | 'slice' }>;

function isDeclarative(step: Step): step is Declarative {
	return step.op === 'ofType' || step.op === 'where' || step.op === 'slice';
}

export function splitPlan(steps: readonly Step[]): {
	readonly early: readonly Declarative[];
	readonly late: readonly Step[];
} {
	const early: Declarative[] = [];
	const late: Step[] = [];
	for (const step of steps) {
		if (late.length === 0 && isDeclarative(step)) early.push(step);
		else late.push(step);
	}
	return { early, late };
}

interface Entry {
	readonly kind: number | undefined;
	readonly address: NodeAddress | undefined;
	readonly hydrate: () => unknown;
}

type Fn = (node: unknown, index: number) => unknown;

interface QueryView extends Iterable<unknown> {
	filter(fn: Fn): QueryView;
	map(fn: Fn): QueryView;
	flatMap(fn: Fn): QueryView;
	slice(start?: number, end?: number): QueryView;
	ofType(kind: number): QueryView;
	where(condition: Where): QueryView;
	find(predicate?: Fn): unknown;
	findIndex(predicate: Fn): number;
	some(predicate: Fn): boolean;
	every(predicate: Fn): boolean;
	includes(node: unknown): boolean;
	reduce(fn: (accumulated: unknown, node: unknown, index: number) => unknown, ...initial: [unknown?]): unknown;
	forEach(fn: (node: unknown, index: number) => void): void;
	at(index: number): unknown;
}

function view(context: Context, source: Source, steps: readonly Step[]): QueryView {
	const next = (step: Step): QueryView => view(context, source, [...steps, step]);
	const items = (): Iterable<unknown> => run(context, source, steps);
	return {
		filter: (fn) => next({ op: 'filter', fn }),
		map: (fn) => next({ op: 'map', fn }),
		flatMap: (fn) => next({ op: 'flatMap', fn }),
		slice: (start, end) => next(sliceStep(start, end)),
		ofType: (kind) => next(ofTypeStep(kind)),
		where: (condition) => next(whereStep(context, steps, condition)),
		find: (predicate) => find(items(), predicate),
		findIndex: (predicate) => findIndex(items(), predicate),
		some: (predicate) => findIndex(items(), predicate) >= 0,
		every: (predicate) => findIndex(items(), (node, index) => !predicate(node, index)) < 0,
		includes: (node) => findIndex(items(), (candidate) => sameOccurrence(candidate, node)) >= 0,
		reduce: (fn, ...initial) => reduce(items(), fn, initial),
		forEach: (fn) => forEach(items(), fn),
		at: (index) => at(items(), index),
		[Symbol.iterator]: () => items()[Symbol.iterator]()
	};
}

function sliceStep(start: number | undefined, end: number | undefined): Step {
	return { op: 'slice', start: toIntegerOrInfinity(start), end: end === undefined ? undefined : toIntegerOrInfinity(end) };
}

function ofTypeStep(kind: number): Step {
	if (typeof kind !== 'number') refuse('query: ofType takes a kind id');
	return { op: 'ofType', kind };
}

function whereStep(context: Context, steps: readonly Step[], condition: Where): Step {
	const kinds = knownKinds(steps);
	if (kinds === undefined) planOf(condition(recorder(context, undefined)));
	else for (const kind of kinds) compileFor(context, condition, kind);
	return { op: 'where', condition };
}

function* run(context: Context, source: Source, steps: readonly Step[]): Iterable<unknown> {
	const { early, late } = splitPlan(steps);
	const entries = 'slot' in source ? slotEntries(context, source, early) : walkEntries(context, source, early);
	let items: Iterable<unknown> = hydrated(entries);
	for (const step of late) items = applyStep(step, items, context);
	yield* items;
}

function* slotEntries(context: Context, source: { readonly slot: string; readonly node: object }, early: readonly Declarative[]): Iterable<readonly Entry[]> {
	const read = (source.node as Record<string, unknown>)[source.slot];
	const value = typeof read === 'function' ? (read as () => unknown).call(source.node) : read;
	const items = Array.isArray(value) ? value : value === undefined ? [] : [value];
	yield* declarativeSteps([items.map(entryOfItem)], early, context);
}

function* walkEntries(context: Context, source: { readonly from: NodeAddress; readonly depth: number | undefined }, early: readonly Declarative[]): Iterable<readonly Entry[]> {
	const pushed = pushdown(context, early);
	if (pushed === 'none') return;
	yield* declarativeSteps(batches(context, source, pushed.kinds, pushed.plan), early.slice(pushed.count), context);
}

function pushdown(context: Context, early: readonly Declarative[]): { kinds: readonly number[]; plan: QueryPlan | undefined; count: number } | 'none' {
	let kinds: readonly number[] | undefined;
	const plans: QueryPlan[] = [];
	let count = 0;
	for (const step of early) {
		if (step.op === 'ofType') {
			kinds = kinds === undefined ? [step.kind] : kinds.filter((kind) => kind === step.kind);
			if (kinds.length === 0) return 'none';
		} else if (step.op === 'where') {
			const plan = kinds === undefined ? undefined : sharedPlan(context, step.condition, kinds);
			if (plan === undefined) break;
			plans.push(plan);
		} else break;
		count++;
	}
	return { kinds: kinds ?? [], plan: plans.length === 0 ? undefined : plans.length === 1 ? plans[0] : { op: 'and', of: plans }, count };
}

function* batches(context: Context, source: { readonly from: NodeAddress; readonly depth: number | undefined }, kinds: readonly number[], plan: QueryPlan | undefined): Iterable<readonly Entry[]> {
	const { query, tree, hooks } = context;
	let from = source.from;
	let resume: readonly number[] | undefined;
	for (let call = 0; ; call++) {
		const limit = BATCH_LIMITS[Math.min(call, BATCH_LIMITS.length - 1)]!;
		const batch = query.descendants({
			from,
			limit,
			...(kinds.length > 0 ? { kinds } : {}),
			...(plan === undefined ? {} : { plan }),
			...(resume === undefined ? {} : { resume }),
			...(source.depth === undefined ? {} : { depth: source.depth })
		});
		yield batch.stubs.map((stub) => entryOfStub(stub, tree, hooks));
		if (batch.resume === null) return;
		from = { handle: batch.origin };
		resume = batch.resume;
	}
}

function find(items: Iterable<unknown>, predicate: Fn | undefined): unknown {
	let index = 0;
	for (const node of items) if (predicate === undefined || predicate(node, index++)) return node;
	return undefined;
}

function findIndex(items: Iterable<unknown>, predicate: Fn): number {
	let index = 0;
	for (const node of items) {
		if (predicate(node, index)) return index;
		index++;
	}
	return -1;
}

function reduce(items: Iterable<unknown>, fn: (accumulated: unknown, node: unknown, index: number) => unknown, initial: readonly unknown[]): unknown {
	let index = 0;
	let started = initial.length > 0;
	let accumulated = initial[0];
	for (const node of items) {
		if (started) accumulated = fn(accumulated, node, index);
		else {
			accumulated = node;
			started = true;
		}
		index++;
	}
	if (!started) refuse('query: reduce of an empty view with no initial value');
	return accumulated;
}

function forEach(items: Iterable<unknown>, fn: (node: unknown, index: number) => void): void {
	let index = 0;
	for (const node of items) fn(node, index++);
}

function at(items: Iterable<unknown>, at: number): unknown {
	const index = toIntegerOrInfinity(at);
	if (index < 0) return [...items].at(index);
	let position = 0;
	for (const node of items) if (position++ === index) return node;
	return undefined;
}

function toIntegerOrInfinity(value: number | undefined): number {
	const number = Number(value);
	return Number.isNaN(number) ? 0 : Math.trunc(number);
}

function entryOfItem(item: unknown): Entry {
	const node = item !== null && typeof item === 'object' ? (item as AnyUntypedNode) : undefined;
	return {
		kind: typeof node?.$type === 'number' ? node.$type : undefined,
		address: node === undefined ? undefined : nodeAddressOf(node),
		hydrate: () => item
	};
}

function entryOfStub(stub: AnyUntypedNode, tree: TreeHandle, hooks: QueryHooks): Entry {
	const record = stub as unknown as { readonly $parentHandle: number; readonly $childIndex: number };
	return {
		kind: stub.$type as number,
		address: { parent: record.$parentHandle, index: record.$childIndex },
		hydrate: () => inTreeEngine(tree, () => hooks.wrap(tree.read!(record.$parentHandle, record.$childIndex), tree))
	};
}

function* hydrated(batches: Iterable<readonly Entry[]>): Iterable<unknown> {
	for (const batch of batches) for (const entry of batch) yield entry.hydrate();
}

function* declarativeSteps(
	batches: Iterable<readonly Entry[]>,
	steps: readonly Declarative[],
	context: Context
): Iterable<readonly Entry[]> {
	let stream = batches;
	for (const step of steps) stream = declarativeStep(step, stream, context);
	yield* stream;
}

function declarativeStep(
	step: Declarative,
	batches: Iterable<readonly Entry[]>,
	context: Context
): Iterable<readonly Entry[]> {
	switch (step.op) {
		case 'ofType':
			return mapBatches(batches, (batch) => batch.filter((entry) => entry.kind === step.kind));
		case 'where':
			return mapBatches(batches, (batch) => whereHolds(batch, step.condition, context));
		case 'slice':
			return sliceBatches(batches, step.start, step.end);
	}
}

function* mapBatches(
	batches: Iterable<readonly Entry[]>,
	fn: (batch: readonly Entry[]) => readonly Entry[]
): Iterable<readonly Entry[]> {
	for (const batch of batches) {
		const kept = fn(batch);
		if (kept.length > 0) yield kept;
	}
}

function* sliceBatches(
	batches: Iterable<readonly Entry[]>,
	start: number,
	end: number | undefined
): Iterable<readonly Entry[]> {
	if (start < 0 || (end !== undefined && end < 0)) {
		yield [...batches].flat().slice(start, end);
		return;
	}
	let position = 0;
	for (const batch of batches) {
		if (end !== undefined && position >= end) return;
		const from = Math.max(start - position, 0);
		const to = end === undefined ? batch.length : Math.min(end - position, batch.length);
		position += batch.length;
		if (from < to) yield batch.slice(from, to);
	}
}

function whereHolds(batch: readonly Entry[], condition: Where, context: Context): readonly Entry[] {
	const byKind = new Map<number, Entry[]>();
	for (const entry of batch) {
		if (entry.kind === undefined || entry.address === undefined)
			refuse('query: where reads the slots of parsed nodes only');
		const group = byKind.get(entry.kind) ?? [];
		group.push(entry);
		byKind.set(entry.kind, group);
	}
	const kept = new Set<Entry>();
	for (const [kind, group] of byKind) {
		const holds = context.query.planHolds(
			group.map((entry) => entry.address!),
			compileFor(context, condition, kind)
		);
		group.forEach((entry, index) => holds[index] && kept.add(entry));
	}
	return batch.filter((entry) => kept.has(entry));
}

function applyStep(step: Step, items: Iterable<unknown>, context: Context): Iterable<unknown> {
	switch (step.op) {
		case 'slice':
			return sliceItems(items, step.start, step.end);
		case 'ofType':
			return filterItems(items, (item) => (item as AnyUntypedNode | undefined)?.$type === step.kind);
		case 'where':
			return filterItems(items, (item) => whereHolds([entryOfItem(item)], step.condition, context).length > 0);
		case 'filter':
			return filterItems(items, step.fn);
		case 'map':
			return mapItems(items, step.fn, false);
		case 'flatMap':
			return mapItems(items, step.fn, true);
	}
}

function* filterItems(items: Iterable<unknown>, keep: (item: unknown, index: number) => unknown): Iterable<unknown> {
	let index = 0;
	for (const item of items) if (keep(item, index++)) yield item;
}

function* mapItems(
	items: Iterable<unknown>,
	fn: (item: unknown, index: number) => unknown,
	flat: boolean
): Iterable<unknown> {
	let index = 0;
	for (const item of items) {
		const mapped = fn(item, index++);
		if (flat && Array.isArray(mapped)) yield* mapped;
		else yield mapped;
	}
}

function* sliceItems(items: Iterable<unknown>, start: number, end: number | undefined): Iterable<unknown> {
	if (start < 0 || (end !== undefined && end < 0)) {
		yield* [...items].slice(start, end);
		return;
	}
	let position = 0;
	for (const item of items) {
		if (end !== undefined && position >= end) return;
		if (position++ >= start) yield item;
	}
}

function knownKinds(steps: readonly Step[]): readonly number[] | undefined {
	let kinds: readonly number[] | undefined;
	for (const step of steps) {
		if (step.op === 'ofType') kinds = kinds === undefined ? [step.kind] : kinds.filter((kind) => kind === step.kind);
		else if (step.op === 'map' || step.op === 'flatMap') kinds = undefined;
	}
	return kinds;
}

const compiled = new WeakMap<Where, Map<number, QueryPlan>>();

function compileFor(context: Context, condition: Where, kind: number): QueryPlan {
	let byKind = compiled.get(condition);
	if (byKind === undefined) compiled.set(condition, (byKind = new Map()));
	let plan = byKind.get(kind);
	if (plan === undefined) byKind.set(kind, (plan = planOf(condition(recorder(context, kind)))));
	return plan;
}

function sharedPlan(context: Context, condition: Where, kinds: readonly number[]): QueryPlan | undefined {
	const plans = kinds.map((kind) => compileFor(context, condition, kind));
	const first = JSON.stringify(plans[0]);
	return plans.every((plan) => JSON.stringify(plan) === first) ? plans[0] : undefined;
}

const PLAN = Symbol('sittir.where');

type Recorded = Cond & { readonly [PLAN]: QueryPlan };

function isCond(value: unknown): value is Recorded {
	return typeof value === 'object' && value !== null && PLAN in value;
}

function planOf(value: unknown): QueryPlan {
	if (!isCond(value))
		refuse('query: where takes a callback returning a recorded condition (c.slot.eq(...)); use filter for a predicate');
	return value[PLAN];
}

function cond(plan: QueryPlan): Cond {
	return Object.freeze({
		[PLAN]: plan,
		and: (other: Cond) => cond({ op: 'and', of: [plan, planOf(other)] }),
		or: (other: Cond) => cond({ op: 'or', of: [plan, planOf(other)] }),
		not: () => cond({ op: 'not', of: plan })
	}) as unknown as Cond;
}

function slotRef(slot: string, routes: SlotRoutes): SlotRef {
	return Object.freeze({
		eq(text: string) {
			if (typeof text !== 'string') refuse(`query: ${slot}.eq takes the text to compare`);
			return cond({ op: 'eq', fields: routes.fields, kinds: routes.kinds, text });
		},
		match(pattern: RegExp) {
			if (!(pattern instanceof RegExp)) refuse(`query: ${slot}.match takes a RegExp`);
			if (pattern.flags.replace(/u/g, '') !== '')
				refuse(`query: ${slot}.match: flags ${pattern.flags} have no native equivalent`);
			return cond({ op: 'match', fields: routes.fields, kinds: routes.kinds, pattern: pattern.source });
		}
	});
}

const NO_ROUTES: SlotRoutes = Object.freeze({ fields: [], kinds: [] });

function recorder(context: Context, kind: number | undefined): Recorder<unknown> {
	const table = context.hooks.querySlots;
	const slots: ReadonlyMap<string, SlotRoutes> =
		kind === undefined
			? new Map([...everyAccessor(table)].map((accessor) => [accessor, NO_ROUTES]))
			: slotsOf(table, kind);
	const owner = kind === undefined ? 'this grammar' : kindLabel(context, kind);
	const refuseRecorder = (what: string): never =>
		refuse(`query: ${what}; a condition reads slots and compares them (c.slot.eq / .match)`);
	return new Proxy(Object.create(null) as Recorder<unknown>, {
		get(_, key) {
			if (typeof key === 'string') {
				const routes = slots.get(key);
				if (routes !== undefined) return slotRef(key, routes);
			}
			return refuseRecorder(`${String(key)} is not a slot of ${owner}`);
		},
		set: () => refuseRecorder('a condition cannot assign'),
		has: (_, key) => typeof key === 'string' && slots.has(key),
		ownKeys: () => [...slots.keys()],
		getOwnPropertyDescriptor: (_, key) =>
			typeof key === 'string' && slots.has(key)
				? { configurable: true, enumerable: true, value: slotRef(key, slots.get(key)!) }
				: undefined
	});
}

function sameOccurrence(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
	const tokenA = treeTokenOf(a);
	if (tokenA === undefined || tokenA !== treeTokenOf(b)) return false;
	const nodeA = a as AnyUntypedNode;
	const nodeB = b as AnyUntypedNode;
	return (
		nodeA.$type === nodeB.$type &&
		nodeA.$span !== undefined &&
		nodeB.$span !== undefined &&
		nodeA.$span.start === nodeB.$span.start &&
		nodeA.$span.end === nodeB.$span.end
	);
}

export function holds(plan: QueryPlan, texts: (routes: SlotRoutes) => readonly string[]): boolean {
	switch (plan.op) {
		case 'eq':
			return texts(plan).includes(plan.text);
		case 'match': {
			const pattern = new RegExp(plan.pattern, 'u');
			return texts(plan).some((text) => pattern.test(text));
		}
		case 'not':
			return !holds(plan.of, texts);
		case 'and':
			return plan.of.every((p) => holds(p, texts));
		case 'or':
			return plan.of.some((p) => holds(p, texts));
	}
}
