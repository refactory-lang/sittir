import { describe, expect, it } from 'vitest';
import { SeamClosure } from '../join-seams/closure.ts';
import { ENTRY, SeamWalk } from '../join-seams/walk.ts';

const STATES = 16;
const SYMBOLS = 4;

interface Through {
	readonly from: number;
	readonly callee: number;
	readonly context?: ReadonlyMap<number, number>;
}

function closureOf(prev: Readonly<Record<number, readonly (readonly [number, number])[]>>, throughs: readonly Through[], seamCallee: number) {
	const walk = Object.create(SeamWalk.prototype) as SeamWalk;
	Object.assign(walk, { stateCount: STATES, symbolCount: SYMBOLS });
	const pair = (source: number, symbol: number): number => walk.pairKey(source, symbol);
	const scopes = [0, ...Object.keys(prev).map(Number)];
	const summaries = new Map(scopes.map((scope) => [scope, { lex: new Map(), prev: new Map<number, number>(), through: new Map<number, number>() }]));
	for (const [scope, pairs] of Object.entries(prev)) for (const [source, symbol] of pairs) summaries.get(Number(scope))!.prev.set(pair(source, symbol), 0);
	const edges = [{ callee: seamCallee, context: new Map() }, ...throughs.map(({ callee, context }) => ({ callee, context: context ?? new Map() }))];
	throughs.forEach(({ from }, k) => summaries.get(from)!.through.set(k + 1, 0));
	const sighting = { scope: 0, cont: 0, witness: 0 };
	Object.assign(walk, {
		walked: scopes,
		rootScope: 0,
		calls: new Map(),
		summaries,
		throughs: edges,
		view: { tables: { isValid: () => true } },
		seams: new Map([['seam', { node: 'holder', lexed: [], prev: new Map(), entry: new Map(), through: new Map([[0, sighting]]) }]])
	});
	return { closure: new SeamClosure(walk), pair };
}

describe('the end-prev of a cycle of through edges', () => {
	it('holds every pair the cycle reaches, and a pair an edge resolves from its callee entry', () => {
		const { closure, pair } = closureOf(
			{ 1: [[4, 0]], 2: [[5, 0]], 3: [[ENTRY, 2], [7, 1]] },
			[
				{ from: 1, callee: 2 },
				{ from: 2, callee: 1 },
				{ from: 2, callee: 3, context: new Map([[9, 0]]) }
			],
			1
		);
		const reached = [pair(4, 0), pair(5, 0), pair(7, 1), pair(9, 2)];
		const [seam] = closure.concreteSeams();
		expect(new Set(seam!.pairs)).toEqual(new Set(reached));
		expect(new Set(closure.endPrev(1))).toEqual(new Set(reached));
		expect(new Set(closure.endPrev(2))).toEqual(new Set(reached));
		expect(new Set(closure.endPrev(3))).toEqual(new Set([pair(ENTRY, 2), pair(7, 1)]));
	});
});
