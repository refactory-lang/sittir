import type { GrammarRule } from '../../../grammar-shapes/grammar-json.ts';
import {
	ENTRY,
	type Entries,
	isRef,
	refScope,
	type Seam,
	type SeamWalk,
	type Sighting,
	stronglyConnected
} from './walk.ts';
import { NONE } from './witnesses.ts';

const START_STATE = 1;
export const NO_ENTRY = -1;

export class ConcreteSighting {
	private built = NONE;

	constructor(
		readonly scope: number,
		readonly cont: number,
		readonly entry: number,
		readonly cost: number,
		private readonly walk: SeamWalk,
		private readonly head: number | Lead,
		private readonly tail?: Lead,
		private readonly join: typeof prepend = prepend
	) {}

	witness(): number {
		if (this.built === NONE) {
			const head = typeof this.head === 'number' ? this.head : this.head.witness();
			this.built = this.tail === undefined ? head : this.join(this.walk, head, this.tail.witness());
		}
		return this.built;
	}
}

export interface ConcreteSeam {
	readonly key: string;
	readonly node: GrammarRule;
	readonly lexed: ReadonlySet<number>;
	readonly pairs: ReadonlySet<number>;
	sightings(pair: number): readonly ConcreteSighting[];
}

class StepTable {
	private costs = new Float64Array(64);
	private vias = new Int32Array(64);
	private bases = new Int32Array(64);
	private readonly seeds = new Map<number, () => number>();
	private count = 0;

	add(cost: number, via: number, base: number, seed?: () => number): number {
		if (this.count === this.costs.length) this.grow();
		const slot = this.count++;
		this.set(slot, cost, via, base, seed);
		return slot;
	}

	set(slot: number, cost: number, via: number, base: number, seed?: () => number): void {
		this.costs[slot] = cost;
		this.vias[slot] = via;
		this.bases[slot] = base;
		if (seed === undefined) this.seeds.delete(slot);
		else this.seeds.set(slot, seed);
	}

	cost(slot: number): number {
		return this.costs[slot]!;
	}

	via(slot: number): number {
		return this.vias[slot]!;
	}

	base(slot: number): number {
		return this.bases[slot]!;
	}

	seed(slot: number): (() => number) | undefined {
		return this.seeds.get(slot);
	}

	private grow(): void {
		const size = this.costs.length * 2;
		const costs = new Float64Array(size);
		const vias = new Int32Array(size);
		const bases = new Int32Array(size);
		costs.set(this.costs);
		vias.set(this.vias);
		bases.set(this.bases);
		this.costs = costs;
		this.vias = vias;
		this.bases = bases;
	}
}

interface PrevSteps {
	readonly table: StepTable;
	readonly slots: Map<number, number>;
}

interface LexSteps {
	readonly table: StepTable;
	readonly slots: Map<number, Map<number, number>>;
}

interface Lead {
	readonly cost: number;
	witness(): number;
}

class MinHeap {
	private readonly costs: number[] = [];
	private readonly items: number[] = [];

	get size(): number {
		return this.items.length;
	}

	get topCost(): number {
		return this.costs[0]!;
	}

	push(cost: number, item: number): void {
		let at = this.items.length;
		this.costs.push(cost);
		this.items.push(item);
		while (at > 0) {
			const parent = (at - 1) >> 1;
			if (this.costs[parent]! <= cost) break;
			this.costs[at] = this.costs[parent]!;
			this.items[at] = this.items[parent]!;
			at = parent;
		}
		this.costs[at] = cost;
		this.items[at] = item;
	}

	pop(): number {
		const top = this.items[0]!;
		const lastCost = this.costs.pop()!;
		const lastItem = this.items.pop()!;
		const size = this.items.length;
		if (size > 0) {
			let at = 0;
			for (;;) {
				const left = 2 * at + 1;
				if (left >= size) break;
				const right = left + 1;
				const child = right < size && this.costs[right]! < this.costs[left]! ? right : left;
				if (this.costs[child]! >= lastCost) break;
				this.costs[at] = this.costs[child]!;
				this.items[at] = this.items[child]!;
				at = child;
			}
			this.costs[at] = lastCost;
			this.items[at] = lastItem;
		}
		return top;
	}
}

export class SeamClosure {
	private readonly words: number;
	private readonly lexComponent = new Map<number, number>();
	private readonly lexBits: Int32Array[] = [];
	private readonly localPrev = new Map<number, Set<number>>();
	private readonly entryPrev = new Map<number, Set<number>>();
	private readonly prevSets = new Map<number, ReadonlySet<number>>();
	private readonly entryBits = new Map<number, Int32Array>();
	private readonly refsInto = new Map<number, { readonly scope: number; readonly base: number }[]>();
	private readonly throughsInto = new Map<
		number,
		{ readonly scope: number; readonly base: number; readonly context: Entries }[]
	>();
	private lexSteps: LexSteps | undefined;
	private readonly prevSteps = new Map<number, PrevSteps>();
	private readonly producers = new Map<number, Set<number>>();
	private readonly prevIndex = new Map<number, Map<number, [number, number][]>>();
	private readonly resolved = new Map<Entries, Map<number, number[]>>();

	constructor(readonly walk: SeamWalk) {
		this.words = (walk.stateCount + 31) >>> 5;
		this.solveLex();
		this.indexEdges();
		this.solvePrev();
		this.solveEntries();
		this.indexProducers();
	}

	private indexProducers(): void {
		const { walk } = this;
		const add = (symbol: number, scope: number): void => {
			let set = this.producers.get(symbol);
			if (set === undefined) this.producers.set(symbol, (set = new Set()));
			set.add(scope);
		};
		for (const scope of walk.walked) {
			const summary = walk.summaries.get(scope)!;
			for (const pair of summary.prev.keys()) add(walk.symbolOfPair(pair), scope);
			for (const key of summary.through.keys()) {
				for (const pair of this.entryPrev.get(walk.throughs[key]!.callee) ?? EMPTY_SET) add(walk.symbolOfPair(pair), scope);
			}
		}
	}

	endLex(scope: number): Int32Array {
		return this.lexBits[this.lexComponent.get(scope)!]!;
	}

	hasLex(scope: number, state: number): boolean {
		return hasBit(this.endLex(scope), state);
	}

	endPrev(scope: number): ReadonlySet<number> {
		const known = this.prevSets.get(scope);
		if (known !== undefined) return known;
		const pairs = new Set(this.entryPrev.get(scope));
		this.reachedPrev([scope], pairs);
		this.prevSets.set(scope, pairs);
		return pairs;
	}

	private reachedPrev(scopes: Iterable<number>, pairs: Set<number>): void {
		const { walk } = this;
		const seen = new Set<number>();
		const stack = [...scopes];
		while (stack.length > 0) {
			const at = stack.pop()!;
			if (seen.has(at)) continue;
			seen.add(at);
			for (const pair of this.localPrev.get(at) ?? EMPTY_SET) pairs.add(pair);
			for (const key of walk.summaries.get(at)?.through.keys() ?? []) stack.push(walk.throughs[key]!.callee);
		}
	}

	private hasEntryPrev(scope: number, pair: number): boolean {
		return this.entryPrev.get(scope)?.has(pair) === true;
	}

	entryLex(scope: number): Int32Array | undefined {
		return this.entryBits.get(scope);
	}

	sourceStates(source: number): Iterable<number> {
		if (source === ENTRY) return [];
		if (isRef(source)) return bitsOf(this.endLex(refScope(source)));
		return [source];
	}

	private solveLex(): void {
		const { walk } = this;
		const refs = (scope: number): number[] => {
			const out: number[] = [];
			for (const source of walk.summaries.get(scope)!.lex.keys()) if (isRef(source)) out.push(refScope(source));
			return out;
		};
		for (const component of stronglyConnected(walk.walked, refs)) {
			const index = this.lexBits.length;
			const bits = new Int32Array(this.words);
			for (const member of component) this.lexComponent.set(member, index);
			for (const member of component) {
				for (const source of walk.summaries.get(member)!.lex.keys()) {
					if (!isRef(source)) setBit(bits, source);
					else {
						const target = this.lexComponent.get(refScope(source))!;
						if (target !== index) orInto(bits, this.lexBits[target]!);
					}
				}
			}
			this.lexBits.push(bits);
		}
	}

	private indexEdges(): void {
		const { walk } = this;
		for (const scope of walk.walked) {
			const summary = walk.summaries.get(scope)!;
			for (const [source, base] of summary.lex) {
				if (!isRef(source)) continue;
				const target = refScope(source);
				let list = this.refsInto.get(target);
				if (list === undefined) this.refsInto.set(target, (list = []));
				list.push({ scope, base });
			}
			for (const [key, base] of summary.through) {
				const { callee, context } = walk.throughs[key]!;
				let list = this.throughsInto.get(callee);
				if (list === undefined) this.throughsInto.set(callee, (list = []));
				list.push({ scope, base, context });
			}
		}
	}

	resolveEntry(context: Entries, symbol: number): readonly number[] {
		let bySymbol = this.resolved.get(context);
		if (bySymbol === undefined) this.resolved.set(context, (bySymbol = new Map()));
		let out = bySymbol.get(symbol);
		if (out === undefined) {
			const found = new Set<number>();
			const { walk } = this;
			const { tables } = walk.view;
			for (const source of context.keys()) {
				if (source === ENTRY) found.add(walk.pairKey(ENTRY, symbol));
				else
					for (const state of this.sourceStates(source))
						if (tables.isValid(state, symbol)) found.add(walk.pairKey(state, symbol));
			}
			out = [...found];
			bySymbol.set(symbol, out);
		}
		return out;
	}

	private refPairs(callee: number, symbol: number, emit: (pair: number, state: number) => void): void {
		const { walk } = this;
		const { tables } = walk.view;
		for (const state of bitsOf(this.endLex(callee)))
			if (tables.isValid(state, symbol)) emit(walk.pairKey(state, symbol), state);
	}

	private solvePrev(): void {
		const { walk } = this;
		const queue: number[] = [];
		const add = (scope: number, pair: number): void => {
			if (walk.sourceOfPair(pair) !== ENTRY) {
				addTo(this.localPrev, scope, pair);
				return;
			}
			if (addTo(this.entryPrev, scope, pair)) queue.push(scope, pair);
		};
		for (const scope of walk.walked) {
			for (const pair of walk.summaries.get(scope)!.prev.keys()) {
				const source = walk.sourceOfPair(pair);
				if (isRef(source)) this.refPairs(refScope(source), walk.symbolOfPair(pair), (concrete) => add(scope, concrete));
				else add(scope, pair);
			}
		}
		for (let head = 0; head < queue.length; head += 2) {
			const callee = queue[head]!;
			const symbol = walk.symbolOfPair(queue[head + 1]!);
			for (const edge of this.throughsInto.get(callee) ?? [])
				for (const resolved of this.resolveEntry(edge.context, symbol)) add(edge.scope, resolved);
		}
	}

	private solveEntries(): void {
		const { walk } = this;
		const inherits = new Map<number, number[]>();
		const scopes = new Set<number>([walk.rootScope, ...walk.calls.keys()]);
		for (const [callee, byCaller] of walk.calls) {
			for (const [caller, call] of byCaller) {
				if (!call.lex.has(ENTRY)) continue;
				push(inherits, callee, caller);
				scopes.add(caller);
			}
		}
		for (const members of stronglyConnected(scopes, (scope) => inherits.get(scope) ?? [])) {
			const bits = new Int32Array(this.words);
			const own = new Set(members);
			for (const member of members) {
				if (member === walk.rootScope) setBit(bits, START_STATE);
				for (const call of walk.calls.get(member)?.values() ?? []) {
					for (const source of call.lex.keys()) for (const state of this.sourceStates(source)) setBit(bits, state);
				}
				for (const caller of inherits.get(member) ?? [])
					if (!own.has(caller)) orInto(bits, this.entryBits.get(caller)!);
			}
			for (const member of members) this.entryBits.set(member, bits);
		}
	}

	lexLead(scope: number, state: number): Lead | undefined {
		this.lexSteps ??= this.solveLexCosts();
		const { table, slots } = this.lexSteps;
		const slot = slots.get(scope)?.get(state);
		return slot === undefined ? undefined : leadOf(this.walk, table, slot, (via) => slots.get(via)!.get(state)!);
	}

	private solveLexCosts(): LexSteps {
		const { walk } = this;
		const { witnesses, stateCount } = walk;
		const table = new StepTable();
		const slots = new Map<number, Map<number, number>>();
		const heap = new MinHeap();
		const offer = (scope: number, state: number, cost: number, via: number, base: number, seed?: () => number): void => {
			let byState = slots.get(scope);
			if (byState === undefined) slots.set(scope, (byState = new Map()));
			const known = byState.get(state);
			if (known === undefined) byState.set(state, table.add(cost, via, base, seed));
			else if (table.cost(known) <= cost) return;
			else table.set(known, cost, via, base, seed);
			heap.push(cost, scope * stateCount + state);
		};
		for (const scope of walk.walked) {
			for (const [source, witness] of walk.summaries.get(scope)!.lex) {
				if (!isRef(source)) offer(scope, source, witnesses.cost(witness), NONE, NONE, () => witness);
			}
		}
		while (heap.size > 0) {
			const cost = heap.topCost;
			const item = heap.pop();
			const scope = Math.floor(item / stateCount);
			const state = item % stateCount;
			if (table.cost(slots.get(scope)!.get(state)!) !== cost) continue;
			for (const edge of this.refsInto.get(scope) ?? [])
				offer(edge.scope, state, cost + witnesses.cost(edge.base), scope, edge.base);
		}
		return { table, slots };
	}

	prevLead(scope: number, pair: number): Lead | undefined {
		let steps = this.prevSteps.get(pair);
		if (steps === undefined) {
			steps = this.solvePrevCosts(pair);
			this.prevSteps.set(pair, steps);
		}
		const { table, slots } = steps;
		const slot = slots.get(scope);
		return slot === undefined ? undefined : leadOf(this.walk, table, slot, (via) => slots.get(via)!);
	}

	private solvePrevCosts(pair: number): PrevSteps {
		const { walk } = this;
		const { witnesses } = walk;
		const { tables } = walk.view;
		const source = walk.sourceOfPair(pair);
		const symbol = walk.symbolOfPair(pair);
		const entryPair = walk.pairKey(ENTRY, symbol);
		const table = new StepTable();
		const slots = new Map<number, number>();
		const heap = new MinHeap();
		const offer = (scope: number, cost: number, via: number, base: number, seed?: () => number): void => {
			const known = slots.get(scope);
			if (known === undefined) slots.set(scope, table.add(cost, via, base, seed));
			else if (table.cost(known) <= cost) return;
			else table.set(known, cost, via, base, seed);
			heap.push(cost, scope);
		};
		const seed = (scope: number, cost: number, witness: () => number): void => offer(scope, cost, NONE, NONE, witness);
		for (const scope of this.producers.get(symbol) ?? []) {
			for (const [symbolic, witness] of this.prevBySymbol(scope).get(symbol) ?? []) {
				const from = walk.sourceOfPair(symbolic);
				if (symbolic === pair) seed(scope, witnesses.cost(witness), () => witness);
				else if (isRef(from) && source >= 0 && this.hasLex(refScope(from), source)) {
					const inner = this.lexLead(refScope(from), source);
					if (inner !== undefined)
						seed(scope, witnesses.cost(witness) + inner.cost, () => insertBeforeLast(walk, witness, inner.witness()));
				}
			}
			if (source === ENTRY || !tables.isValid(source, symbol)) continue;
			for (const key of walk.summaries.get(scope)!.through.keys()) {
				const { callee, context } = walk.throughs[key]!;
				if (!this.hasEntryPrev(callee, entryPair)) continue;
				const head = this.contextLead(context, source);
				const tail = head === undefined ? undefined : this.prevLead(callee, entryPair);
				if (head !== undefined && tail !== undefined)
					seed(scope, head.cost + tail.cost, () => prepend(walk, head.witness(), tail.witness()));
			}
		}
		while (heap.size > 0) {
			const cost = heap.topCost;
			const scope = heap.pop();
			if (table.cost(slots.get(scope)!) !== cost) continue;
			for (const edge of this.throughsInto.get(scope) ?? []) {
				const base = source === ENTRY ? edge.context.get(ENTRY) : edge.base;
				if (base !== undefined) offer(edge.scope, cost + witnesses.cost(base), scope, base);
			}
		}
		return { table, slots };
	}

	private prevBySymbol(scope: number): Map<number, [number, number][]> {
		let index = this.prevIndex.get(scope);
		if (index === undefined) {
			index = new Map();
			for (const [pair, witness] of this.walk.summaries.get(scope)!.prev) {
				const symbol = this.walk.symbolOfPair(pair);
				const list = index.get(symbol);
				if (list === undefined) index.set(symbol, [[pair, witness]]);
				else list.push([pair, witness]);
			}
			this.prevIndex.set(scope, index);
		}
		return index;
	}

	contextLead(context: Entries, state: number): Lead | undefined {
		const { witnesses } = this.walk;
		let best: Lead | undefined;
		const direct = context.get(state);
		if (direct !== undefined) best = { cost: witnesses.cost(direct), witness: () => direct };
		for (const [source, base] of context) {
			if (!isRef(source) || !this.hasLex(refScope(source), state)) continue;
			const inner = this.lexLead(refScope(source), state);
			if (inner === undefined) continue;
			const cost = witnesses.cost(base) + inner.cost;
			if (best === undefined || cost < best.cost)
				best = { cost, witness: () => prepend(this.walk, base, inner.witness()) };
		}
		return best;
	}

	concreteSeams(): ConcreteSeam[] {
		return [...this.walk.seams].map(([key, seam]) => this.concrete(key, seam));
	}

	private concrete(key: string, seam: Seam): ConcreteSeam {
		const { walk } = this;
		const { tables } = walk.view;
		const lexed = new Set<number>();
		for (const source of seam.lexed) for (const state of this.sourceStates(source)) lexed.add(state);
		const pairs = new Set<number>();
		const entered = (from: Sighting, symbol: number): void => {
			const bits = this.entryLex(from.scope);
			if (bits !== undefined)
				for (const state of bitsOf(bits)) if (tables.isValid(state, symbol)) pairs.add(walk.pairKey(state, symbol));
		};
		for (const pair of seam.prev.keys()) {
			const source = walk.sourceOfPair(pair);
			if (isRef(source)) this.refPairs(refScope(source), walk.symbolOfPair(pair), (concrete) => pairs.add(concrete));
			else pairs.add(pair);
		}
		for (const [slot, from] of seam.entry) entered(from, slot % walk.symbolCount);
		this.reachedPrev(
			[...seam.through.keys()].map((through) => walk.throughs[through]!.callee),
			pairs
		);
		for (const [through, from] of seam.through) {
			const { callee, context } = walk.throughs[through]!;
			for (const pair of this.entryPrev.get(callee) ?? EMPTY_SET) {
				for (const resolved of this.resolveEntry(context, walk.symbolOfPair(pair))) {
					if (walk.sourceOfPair(resolved) === ENTRY) entered(from, walk.symbolOfPair(pair));
					else pairs.add(resolved);
				}
			}
		}
		const listed = new Map<number, readonly ConcreteSighting[]>();
		return {
			key,
			node: seam.node,
			lexed,
			pairs,
			sightings: (pair) => {
				let list = listed.get(pair);
				if (list === undefined) listed.set(pair, (list = this.sightingsOf(seam, pair)));
				return list;
			}
		};
	}

	private sightingsOf(seam: Seam, pair: number): ConcreteSighting[] {
		const { walk } = this;
		const { witnesses } = walk;
		const { tables } = walk.view;
		const state = walk.sourceOfPair(pair);
		const symbol = walk.symbolOfPair(pair);
		const entryPair = walk.pairKey(ENTRY, symbol);
		const unentered: ConcreteSighting[] = [];
		const entered: ConcreteSighting[] = [];
		const offer = (
			from: Sighting,
			entry: number,
			cost: number,
			head: number | Lead,
			tail?: Lead,
			join?: typeof prepend
		): void => {
			const sighting = new ConcreteSighting(from.scope, from.cont, entry, cost, walk, head, tail, join);
			(entry === NO_ENTRY ? unentered : entered).push(sighting);
		};
		const entersIn = (from: Sighting): boolean => {
			const bits = this.entryLex(from.scope);
			return bits !== undefined && hasBit(bits, state);
		};
		const direct = seam.prev.get(pair);
		if (direct !== undefined) offer(direct, NO_ENTRY, witnesses.cost(direct.witness), direct.witness);
		for (const [symbolic, from] of seam.prev) {
			const source = walk.sourceOfPair(symbolic);
			if (!isRef(source) || walk.symbolOfPair(symbolic) !== symbol || !this.hasLex(refScope(source), state)) continue;
			const inner = this.lexLead(refScope(source), state);
			if (inner !== undefined)
				offer(from, NO_ENTRY, witnesses.cost(from.witness) + inner.cost, from.witness, inner, insertBeforeLast);
		}
		for (const from of seam.entry.values()) {
			const slot = from.scope * walk.symbolCount + symbol;
			if (seam.entry.get(slot) === from && entersIn(from))
				offer(from, state, witnesses.cost(from.witness), from.witness);
		}
		for (const [through, from] of seam.through) {
			const { callee, context } = walk.throughs[through]!;
			const prev = this.endPrev(callee);
			if (prev.has(pair)) {
				const tail = this.prevLead(callee, pair);
				if (tail !== undefined) offer(from, NO_ENTRY, witnesses.cost(from.witness) + tail.cost, from.witness, tail);
			}
			if (!prev.has(entryPair) || !tables.isValid(state, symbol)) continue;
			const head = this.contextLead(context, state);
			const lead = context.get(ENTRY);
			if (head === undefined && (lead === undefined || !entersIn(from))) continue;
			const tail = this.prevLead(callee, entryPair);
			if (tail === undefined) continue;
			if (head !== undefined) offer(from, NO_ENTRY, head.cost + tail.cost, head, tail);
			if (lead !== undefined && entersIn(from)) offer(from, state, witnesses.cost(lead) + tail.cost, lead, tail);
		}
		const byCost = (a: ConcreteSighting, b: ConcreteSighting): number => a.cost - b.cost;
		return [...unentered.sort(byCost), ...entered.sort(byCost)];
	}
}

const EMPTY_SET: ReadonlySet<number> = new Set();

function leadOf(walk: SeamWalk, table: StepTable, slot: number, slotOfVia: (via: number) => number): Lead {
	return {
		cost: table.cost(slot),
		witness: memo(() => {
			const bases: number[] = [];
			let at = slot;
			let seed = table.seed(at);
			while (seed === undefined) {
				bases.push(table.base(at));
				at = slotOfVia(table.via(at));
				seed = table.seed(at);
			}
			let witness = seed();
			for (let k = bases.length - 1; k >= 0; k--) witness = prepend(walk, bases[k]!, witness);
			return witness;
		})
	};
}

function push(map: Map<number, number[]>, key: number, value: number): void {
	const list = map.get(key);
	if (list === undefined) map.set(key, [value]);
	else list.push(value);
}

function addTo(map: Map<number, Set<number>>, key: number, value: number): boolean {
	let set = map.get(key);
	if (set === undefined) map.set(key, (set = new Set()));
	if (set.has(value)) return false;
	set.add(value);
	return true;
}

function prepend(walk: SeamWalk, base: number, inner: number): number {
	const { witnesses } = walk;
	return witnesses.withSub(base, inner, witnesses.cost(base) + witnesses.cost(inner));
}

function insertBeforeLast(walk: SeamWalk, witness: number, inner: number): number {
	const { witnesses } = walk;
	const head = prepend(walk, witnesses.prevOf(witness), inner);
	return witnesses.withItem(head, witnesses.itemOf(witness), witnesses.cost(witness) + witnesses.cost(inner));
}

function memo(make: () => number): () => number {
	let value = NONE;
	return () => (value === NONE ? (value = make()) : value);
}

function setBit(bits: Int32Array, bit: number): void {
	bits[bit >>> 5]! |= 1 << (bit & 31);
}

export function hasBit(bits: Int32Array, bit: number): boolean {
	return (bits[bit >>> 5]! & (1 << (bit & 31))) !== 0;
}

function orInto(into: Int32Array, from: Int32Array): void {
	for (let k = 0; k < into.length; k++) into[k]! |= from[k]!;
}

export function* bitsOf(bits: Int32Array): Generator<number> {
	for (let word = 0; word < bits.length; word++) {
		let value = bits[word]!;
		while (value !== 0) {
			const low = value & -value;
			yield word * 32 + (31 - Math.clz32(low));
			value ^= low;
		}
	}
}
