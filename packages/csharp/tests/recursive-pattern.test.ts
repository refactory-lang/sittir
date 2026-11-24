import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import language from '../src/index.ts';

const engines = {
	arena: await sharedEngine(() => createEngine(language, { nodeStorage: 'arena' })),
	object: await sharedEngine(() => createEngine(language, { nodeStorage: 'object' }))
};

type Accessors = Record<string, () => unknown>;

describe.each(Object.entries(engines))('a C# recursive pattern is a type, its clauses and a designation, in %s storage', (_, engine) => {
	const kinds = engine.kinds as unknown as Record<string, number>;
	const ir = engine.build as unknown as Record<string, (config?: unknown) => unknown>;
	const tokens = (node: unknown) => String(engine.render(node as never)).replace(/\s+/g, '');

	it.each([
		['A(1) y', [true, true, false, true]],
		['(1, 2) y', [false, true, false, true]],
		['{ P: 1 } y', [false, false, true, true]],
		['int { }', [true, false, true, false]],
		['A.B(1) { P: 1 } z', [true, true, true, true]],
		['(1, 2) { P: 1 }', [false, true, true, false]]
	])('x is %s reads its type, clauses and designation', (pattern, present) => {
		const parsed = engine.parse(`var b = x is ${pattern};`);
		expect(parsed.$errors).toHaveLength(0);
		const node = [...parsed.$query().$descendants.ofType(kinds.RecursivePattern as never)][0] as unknown as Accessors;
		expect(['type', 'positionalPatternClause', 'propertyPatternClause', 'variableDesignation'].map((slot) => node[slot]!() != null)).toEqual(present);
		expect(String(engine.render(node as never))).toBe(pattern);
	});

	it('builds a property clause alone', () => {
		expect(tokens(ir.recursivePattern!({ propertyPatternClause: ir.propertyPatternClause!({}) }))).toBe('{}');
	});
});
