import type { AnyUntypedNode, Cond, QueryPlan, QuerySlots, Recorder, SlotRef } from '@sittir/types';
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
			return new View(facet.context, { slot: key, node: facet.node }, []);
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

function walkView(facet: Facet, depth: number | undefined): View<unknown> {
	return new View(facet.context, { from: facet.from, depth }, []);
}

function kindLabel(context: Context, kind: number): string {
	return context.hooks.kindName(kind) ?? `kind ${kind}`;
}

const slotTables = new WeakMap<QuerySlots, Map<number, ReadonlyMap<string, string>>>();
const NO_SLOTS: ReadonlyMap<string, string> = new Map();

function slotsOf(table: QuerySlots, kind: number): ReadonlyMap<string, string> {
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
		else if ((step.op === 'ofType' || step.op === 'where') && late.every((held) => held.op === 'filter'))
			early.push(step);
		else late.push(step);
	}
	return { early, late };
}

interface Entry {
	readonly kind: number | undefined;
	readonly address: NodeAddress | undefined;
	readonly hydrate: () => unknown;
}

class View<T> implements Iterable<T> {
	readonly #context: Context;
	readonly #source: Source;
	readonly #steps: readonly Step[];

	constructor(context: Context, source: Source, steps: readonly Step[]) {
		this.#context = context;
		this.#source = source;
		this.#steps = steps;
	}

	#with(step: Step): View<never> {
		return new View(this.#context, this.#source, [...this.#steps, step]);
	}

	filter(fn: (node: T, index: number) => unknown): View<T> {
		return this.#with({ op: 'filter', fn: fn as (node: unknown, index: number) => unknown });
	}

	map<U>(fn: (node: T, index: number) => U): View<U> {
		return this.#with({ op: 'map', fn: fn as (node: unknown, index: number) => unknown });
	}

	flatMap<U>(fn: (node: T, index: number) => U | readonly U[]): View<U> {
		return this.#with({ op: 'flatMap', fn: fn as (node: unknown, index: number) => unknown });
	}

	slice(start = 0, end?: number): View<T> {
		return this.#with({ op: 'slice', start, end });
	}

	ofType(kind: number): View<T> {
		if (typeof kind !== 'number') refuse('query: ofType takes a kind id');
		return this.#with({ op: 'ofType', kind });
	}

	where(condition: (slots: Recorder<T>) => Cond): View<T> {
		const where = condition as Where;
		const kinds = knownKinds(this.#steps);
		if (kinds === undefined) planOf(where(recorder(this.#context, undefined)));
		else for (const kind of kinds) compileFor(this.#context, where, kind);
		return this.#with({ op: 'where', condition: where });
	}

	*[Symbol.iterator](): Iterator<T> {
		const { early, late } = splitPlan(this.#steps);
		const entries =
			'slot' in this.#source ? this.#slotEntries(this.#source, early) : this.#walkEntries(this.#source, early);
		let items: Iterable<unknown> = hydrated(entries);
		for (const step of late) items = applyStep(step, items, this.#context);
		yield* items as Iterable<T>;
	}

	*#slotEntries(
		source: { readonly slot: string; readonly node: object },
		early: readonly Declarative[]
	): Iterable<readonly Entry[]> {
		const read = (source.node as Record<string, unknown>)[source.slot];
		const value = typeof read === 'function' ? (read as () => unknown).call(source.node) : read;
		const items = Array.isArray(value) ? value : value === undefined ? [] : [value];
		yield* declarativeSteps([items.map(entryOfItem)], early, this.#context);
	}

	*#walkEntries(
		source: { readonly from: NodeAddress; readonly depth: number | undefined },
		early: readonly Declarative[]
	): Iterable<readonly Entry[]> {
		const pushed = this.#pushdown(early);
		if (pushed === 'none') return;
		yield* declarativeSteps(this.#batches(source, pushed.kinds, pushed.plan), early.slice(pushed.count), this.#context);
	}

	#pushdown(
		early: readonly Declarative[]
	): { kinds: readonly number[]; plan: QueryPlan | undefined; count: number } | 'none' {
		let kinds: readonly number[] | undefined;
		const plans: QueryPlan[] = [];
		let count = 0;
		for (const step of early) {
			if (step.op === 'ofType') {
				kinds = kinds === undefined ? [step.kind] : kinds.filter((kind) => kind === step.kind);
				if (kinds.length === 0) return 'none';
			} else if (step.op === 'where') {
				const plan = kinds === undefined ? undefined : sharedPlan(this.#context, step.condition, kinds);
				if (plan === undefined) break;
				plans.push(plan);
			} else break;
			count++;
		}
		return {
			kinds: kinds ?? [],
			plan: plans.length === 0 ? undefined : plans.length === 1 ? plans[0] : { op: 'and', of: plans },
			count
		};
	}

	*#batches(
		source: { readonly from: NodeAddress; readonly depth: number | undefined },
		kinds: readonly number[],
		plan: QueryPlan | undefined
	): Iterable<readonly Entry[]> {
		const { query, tree, hooks } = this.#context;
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

	find(predicate?: (node: T, index: number) => unknown): T | undefined {
		let index = 0;
		for (const node of this) if (predicate === undefined || predicate(node, index++)) return node;
		return undefined;
	}

	findIndex(predicate: (node: T, index: number) => unknown): number {
		let index = 0;
		for (const node of this) {
			if (predicate(node, index)) return index;
			index++;
		}
		return -1;
	}

	some(predicate: (node: T, index: number) => unknown): boolean {
		return this.findIndex(predicate) >= 0;
	}

	every(predicate: (node: T, index: number) => unknown): boolean {
		return this.findIndex((node, index) => !predicate(node, index)) < 0;
	}

	includes(node: T): boolean {
		return this.findIndex((candidate) => sameOccurrence(candidate, node)) >= 0;
	}

	reduce<U>(fn: (accumulated: U, node: T, index: number) => U, ...initial: [U?]): U {
		let index = 0;
		let started = initial.length > 0;
		let accumulated = initial[0] as U;
		for (const node of this) {
			if (started) accumulated = fn(accumulated, node, index);
			else {
				accumulated = node as unknown as U;
				started = true;
			}
			index++;
		}
		if (!started) refuse('query: reduce of an empty view with no initial value');
		return accumulated;
	}

	forEach(fn: (node: T, index: number) => void): void {
		let index = 0;
		for (const node of this) fn(node, index++);
	}

	at(index: number): T | undefined {
		if (!Number.isInteger(index)) refuse('query: at takes an integer');
		if (index < 0) return [...this].at(index);
		let position = 0;
		for (const node of this) if (position++ === index) return node;
		return undefined;
	}
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

function slotRef(slot: string): SlotRef {
	return Object.freeze({
		eq(text: string) {
			if (typeof text !== 'string') refuse(`query: ${slot}.eq takes the text to compare`);
			return cond({ op: 'eq', slot, text });
		},
		match(pattern: RegExp) {
			if (!(pattern instanceof RegExp)) refuse(`query: ${slot}.match takes a RegExp`);
			if (pattern.flags.replace(/u/g, '') !== '')
				refuse(`query: ${slot}.match: flags ${pattern.flags} have no native equivalent`);
			return cond({ op: 'match', slot, pattern: pattern.source });
		}
	});
}

function recorder(context: Context, kind: number | undefined): Recorder<unknown> {
	const table = context.hooks.querySlots;
	const slots: ReadonlyMap<string, string> =
		kind === undefined ? new Map([...everyAccessor(table)].map((a) => [a, a])) : slotsOf(table, kind);
	const owner = kind === undefined ? 'this grammar' : kindLabel(context, kind);
	const refuseRecorder = (what: string): never =>
		refuse(`query: ${what}; a condition reads slots and compares them (c.slot.eq / .match)`);
	return new Proxy(Object.create(null) as Recorder<unknown>, {
		get(_, key) {
			if (typeof key === 'string') {
				const slot = slots.get(key);
				if (slot !== undefined) return slotRef(slot);
			}
			return refuseRecorder(`${String(key)} is not a slot of ${owner}`);
		},
		set: () => refuseRecorder('a condition cannot assign'),
		has: (_, key) => typeof key === 'string' && slots.has(key),
		ownKeys: () => [...slots.keys()],
		getOwnPropertyDescriptor: (_, key) =>
			typeof key === 'string' && slots.has(key)
				? { configurable: true, enumerable: true, value: slotRef(slots.get(key)!) }
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

export function holds(plan: QueryPlan, texts: (slot: string) => readonly string[]): boolean {
	switch (plan.op) {
		case 'eq':
			return texts(plan.slot).includes(plan.text);
		case 'match': {
			const pattern = new RegExp(plan.pattern, 'u');
			return texts(plan.slot).some((text) => pattern.test(text));
		}
		case 'not':
			return !holds(plan.of, texts);
		case 'and':
			return plan.of.every((p) => holds(p, texts));
		case 'or':
			return plan.of.some((p) => holds(p, texts));
	}
}
