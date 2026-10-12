import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { treeOf } from '../../common/src/tree-token.ts';
import rust from '../src/index.ts';

const engine = await createEngine(rust);
const typeOf = (node: unknown): number => (node as { readonly $type: number }).$type;

describe('ofType and is.* share one membership test', () => {
	const SOURCE = 'fn f() { let a = 0..1; let b = 2..; let c = ..3; g(a.b, 1); }\n';
	const cases: readonly (readonly [string, number, (node: never) => boolean])[] = [
		['a supertype', engine.kinds.Expression, engine.is.expression],
		['a supertype of literals', engine.kinds.Literal, engine.is.literal],
		['a polymorph', engine.kinds.RangeExpression, engine.is.rangeExpression],
		['an arm', engine.kinds.RangeExpressionPostfix, engine.is.rangeExpressionPostfix],
		['an alias display kind', engine.kinds.FieldIdentifier, engine.is.fieldIdentifier],
		['a concrete kind', engine.kinds.LetDeclaration, engine.is.letDeclaration]
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

	it('a supertype yields its members, each with its own type', () => {
		const root = engine.parse(SOURCE, { depth: 1 });
		const types = new Set([...root.$query().$descendants.ofType(engine.kinds.Expression as never)].map(typeOf));
		expect(types.has(engine.kinds.Expression)).toBe(false);
		expect(types).toContain(engine.kinds.CallExpression);
		expect(types).toContain(engine.kinds.RangeExpressionBinary);
	});

	it('chained ofType steps intersect their memberships', () => {
		const root = engine.parse(SOURCE, { depth: 1 });
		const types = [...root.$query().$descendants.ofType(engine.kinds.Expression as never).ofType(engine.kinds.RangeExpression as never)].map(typeOf);
		expect(types).toEqual([engine.kinds.RangeExpressionBinary, engine.kinds.RangeExpressionPostfix, engine.kinds.RangeExpressionPrefix]);
	});
});

describe('ofType over a polymorph', () => {
	const RANGES = 'fn f() { let a = 0..1; let b = 2..; let c = ..3; }\n';

	it('selects every arm node by the parent kind', () => {
		const root = engine.parse(RANGES, { depth: 1 });
		const kinds = [...root.$query().$descendants.ofType(engine.kinds.RangeExpression as never)].map((node) => (node as { readonly $type: number }).$type);
		expect(kinds).toEqual([engine.kinds.RangeExpressionBinary, engine.kinds.RangeExpressionPostfix, engine.kinds.RangeExpressionPrefix]);
	});

	it('selects only that arm by an arm kind', () => {
		const root = engine.parse(RANGES, { depth: 1 });
		const kinds = [...root.$query().$descendants.ofType(engine.kinds.RangeExpressionPostfix as never)].map((node) => (node as { readonly $type: number }).$type);
		expect(kinds).toEqual([engine.kinds.RangeExpressionPostfix]);
	});
});

describe('a coordinate stamps the grammar id, or the display id at an alias envelope', () => {
	type Read = { readonly $type?: number; readonly $_layout?: { readonly at?: { readonly $type: number; readonly $treeHandle: number } } };
	const records = (value: unknown, out: Read[] = []): Read[] => {
		if (Array.isArray(value)) for (const item of value) records(item, out);
		else if (value !== null && typeof value === 'object') {
			out.push(value as Read);
			for (const [key, child] of Object.entries(value)) if (key.startsWith('_') && key !== '$_layout') records(child, out);
		}
		return out;
	};

	it('on a read node and on a query coordinate alike', () => {
		const source = 'fn f() { a.b; }\n';
		const { root } = engine.diagnostics.parseAndRead(source, { depth: Infinity }) as unknown as { root: unknown };
		const read = records(root);
		const envelope = read.find((node) => node.$type === engine.kinds.FieldIdentifier);
		const plain = read.find((node) => node.$type === engine.kinds.FieldExpression);
		expect(envelope?.$_layout?.at?.$type).toBe(engine.kinds.FieldIdentifier);
		expect(plain?.$_layout?.at?.$type).toBe(engine.kinds.FieldExpression);
		const parsed = engine.parse(source, { depth: 1 });
		const tree = treeOf(parsed);
		const handle = (parsed as unknown as Read).$_layout?.at?.$treeHandle;
		if (tree?.query === undefined || handle === undefined) throw new Error('expected a live tree');
		const kinds = tree.query.descendants({ from: { handle }, limit: 100 }).coordinates.map((coordinate) => coordinate.$type);
		expect(kinds).toContain(engine.kinds.FieldIdentifier);
		expect(kinds).toContain(engine.kinds.FieldExpression);
	});
});
