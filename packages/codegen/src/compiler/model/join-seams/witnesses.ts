import type { GrammarRule } from '../../../grammar-shapes/grammar-json.ts';
import type { Token } from './grammar-view.ts';

export const NONE = -1;
export const EMPTY = 0;
export const NIL = -1;

const INITIAL_CAPACITY = 1 << 16;

export class Witnesses {
	private prevs = new Int32Array(INITIAL_CAPACITY);
	private items = new Int32Array(INITIAL_CAPACITY);
	private costs = new Float64Array(INITIAL_CAPACITY);
	private size = 1;
	readonly tokens: Token[] = [];

	get count(): number {
		return this.size;
	}

	cost(witness: number): number {
		return witness === NONE ? Infinity : this.costs[witness]!;
	}

	withToken(base: number, token: number, cost: number): number {
		return this.allocate(base, token, cost);
	}

	withSub(base: number, sub: number, cost: number): number {
		return sub === EMPTY ? base : base === EMPTY ? sub : this.allocate(base, -sub, cost);
	}

	withItem(base: number, item: number, cost: number): number {
		return this.allocate(base, item, cost);
	}

	prevOf(witness: number): number {
		return this.prevs[witness]!;
	}

	itemOf(witness: number): number {
		return this.items[witness]!;
	}

	flatten(witness: number, out: Token[], limit: number): boolean {
		const stack: number[] = [];
		const pushChain = (from: number): void => {
			for (let at = from; at !== EMPTY; at = this.prevs[at]!) stack.push(this.items[at]!);
		};
		pushChain(witness);
		while (stack.length > 0) {
			const item = stack.pop()!;
			if (item >= 0) {
				out.push(this.tokens[item]!);
				if (out.length > limit) return false;
			} else pushChain(-item);
		}
		return true;
	}

	private allocate(prev: number, item: number, cost: number): number {
		if (this.size === this.prevs.length) this.grow();
		const at = this.size++;
		this.prevs[at] = prev;
		this.items[at] = item;
		this.costs[at] = cost;
		return at;
	}

	private grow(): void {
		const capacity = this.prevs.length * 2;
		const prevs = new Int32Array(capacity);
		const items = new Int32Array(capacity);
		const costs = new Float64Array(capacity);
		prevs.set(this.prevs);
		items.set(this.items);
		costs.set(this.costs);
		this.prevs = prevs;
		this.items = items;
		this.costs = costs;
	}
}

export class Continuations {
	private readonly nodes: GrammarRule[] = [];
	private readonly nexts: number[] = [];
	private readonly interned = new Map<number, Map<GrammarRule, number>>();

	push(node: GrammarRule, next: number): number {
		let byNode = this.interned.get(next);
		if (byNode === undefined) this.interned.set(next, (byNode = new Map()));
		let at = byNode.get(node);
		if (at === undefined) {
			at = this.nodes.length;
			this.nodes.push(node);
			this.nexts.push(next);
			byNode.set(node, at);
		}
		return at;
	}

	nodesOf(cont: number): GrammarRule[] {
		const out: GrammarRule[] = [];
		for (let at = cont; at !== NIL; at = this.nexts[at]!) out.push(this.nodes[at]!);
		return out;
	}
}
