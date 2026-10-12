import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const engine = await createEngine(python);
const typeOf = (node: unknown): number => (node as { readonly $type: number }).$type;

describe('ofType and is.* share one membership test', () => {
	const SOURCE = 'with a:\n  pass\nwith (a, b):\n  f(a)\n';
	const cases: readonly (readonly [string, number, (node: never) => boolean])[] = [
		['a supertype', engine.kinds.PrimaryExpression, engine.is.primaryExpression],
		['a polymorph', engine.kinds.WithClause, engine.is.withClause],
		['an arm', engine.kinds.WithClauseParen, engine.is.withClauseParen],
		['a concrete kind', engine.kinds.Call, engine.is.call]
	];

	it.each(cases)('ofType(%s) yields exactly the descendants is.* accepts', (_, kind, guard) => {
		const root = engine.parse(SOURCE, { depth: 1 });
		const accepted = [...root.$query().$descendants].filter((node) => guard(node as never));
		const selected = [...root.$query().$descendants.ofType(kind as never)];
		expect(selected.length).toBeGreaterThan(0);
		expect(selected.length).toBe(accepted.length);
		expect(selected.every((node, index) => node === accepted[index])).toBe(true);
		expect(selected.every((node) => engine.is.kind(node as never, kind as never))).toBe(true);
	});

	it('a polymorph yields its arm nodes, and an arm only itself', () => {
		const root = engine.parse(SOURCE, { depth: 1 });
		const typesOf = (kind: number) => [...root.$query().$descendants.ofType(kind as never)].map(typeOf);
		expect(typesOf(engine.kinds.WithClause)).toEqual([engine.kinds.WithClauseBare, engine.kinds.WithClauseParen]);
		expect(typesOf(engine.kinds.WithClauseParen)).toEqual([engine.kinds.WithClauseParen]);
	});
});

describe('a coordinate stamps the grammar id at an alias the grammar does not claim', () => {
	it('a simple statement read under its parser alias', () => {
		const root = engine.parse('a = 1\nb = 2\n', { depth: 1 });
		const at = (node: unknown) => (node as { readonly $_layout?: { readonly at?: { readonly $type: number } } }).$_layout?.at?.$type;
		expect(root.statements().map(at)).toEqual([engine.kinds.SimpleStatements, engine.kinds.SimpleStatements]);
	});
});
