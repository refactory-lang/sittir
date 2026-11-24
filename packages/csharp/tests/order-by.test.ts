import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import language from '../src/index.ts';

const engines = {
	arena: await sharedEngine(() => createEngine(language, { nodeStorage: 'arena' })),
	object: await sharedEngine(() => createEngine(language, { nodeStorage: 'object' }))
};

type Engine = (typeof engines)['arena'];
type Accessors = Record<string, () => unknown>;

const query = (clause: string): string => `var q = from x in xs ${clause} select x;`;

function rendered(engine: Engine, node: unknown): string {
	return String(engine.render(node as never)).replace(/\s+/g, ' ').trim();
}

describe.each(Object.entries(engines))('C# orderby is a list of orderings in %s storage', (_, engine) => {
	const kinds = engine.kinds as unknown as Record<string, number>;

	it.each([
		['orderby a', [['a', null]]],
		['orderby a ascending', [['a', 'ascending']]],
		['orderby a, b descending', [['a', null], ['b', 'descending']]],
		['orderby a descending, b ascending, c', [['a', 'descending'], ['b', 'ascending'], ['c', null]]]
	])('%s reads each ordering as an expression and a direction', (clause, expected) => {
		const parsed = engine.parse(query(clause));
		expect(parsed.$errors).toHaveLength(0);
		const node = [...parsed.$query().$descendants.ofType(kinds.OrderByClause as never)][0] as unknown as Accessors;
		const orderings = node.orderings!() as Accessors[];
		expect(orderings.map((ordering) => [rendered(engine, ordering.expression!()), ordering.direction!() == null ? null : rendered(engine, ordering.direction!())])).toEqual(expected);
		expect(rendered(engine, node)).toBe(clause);
	});

	it('builds each ordering with its direction, by form or by slot', () => {
		const ir = engine.build as unknown as Record<string, ((config: unknown) => unknown) & Record<string, (config: unknown) => unknown>>;
		const id = (text: string) => ir.identifier!(text);
		const tokens = (node: unknown) => rendered(engine, node).replace(/\s+/g, '');
		expect(tokens(ir.orderByClause!({ orderings: [ir.ordering!({ expression: id('a') }), ir.ordering!.descending!({ expression: id('b') })] }))).toBe('orderbya,bdescending');
		expect(tokens(ir.ordering!.ascending!({ expression: id('a') }))).toBe('aascending');
		expect(tokens(ir.ordering!({ expression: id('a'), direction: 'descending' }))).toBe('adescending');
	});
});
