import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { nodeAddressOf, treeOf } from '@sittir/common/utils';
import type { QueryPlan } from '@sittir/types';
import python from '../src/index.ts';
import { hooks } from '../src/api.ts';
import { queryFlags } from '../src/portable.ts';
import { TSKindId } from '../src/types.ts';
import { querySlots } from '../src/utils.ts';

const py = await createEngine(python);

type Spanned = { readonly $_layout: { readonly at: { readonly $span: { readonly start: number; readonly end: number } } } };
const textIn = (source: string) => (node: unknown): string => {
	const { start, end } = (node as Spanned).$_layout.at.$span;
	return source.slice(start, end);
};

type Listed = { readonly _delimiter?: number; readonly length: number };
const readsTrailing = (node: unknown): boolean => (((node as Listed)._delimiter ?? 0) & 2) !== 0 && (node as Listed).length >= 2;

describe('c.is(\'trailingComma\') on a bare tuple in a where condition', () => {
	const selects = (source: string, all: readonly unknown[], native: readonly unknown[], negated: readonly unknown[], trailing: readonly string[]) => {
		const text = textIn(source);
		expect(native.map(text)).toEqual(trailing);
		expect(native.map(text)).toEqual(all.filter(readsTrailing).map(text));
		expect(negated.map(text)).toEqual(all.filter((node) => !readsTrailing(node)).map(text));
	};

	it('selects natively the expression lists the read stamps Trailing with two items or more', () => {
		const source = 'x = 1, 2,\ny = 3, 4\nz = 5,\n';
		const lists = () => py.parse(source).$query().$descendants.ofType(py.kinds.ExpressionList);
		selects(source, [...lists()], [...lists().where((c) => c.is('trailingComma'))], [...lists().where((c) => c.is('trailingComma').not())], ['1, 2,']);
	});

	it('selects natively the pattern lists the read stamps Trailing with two items or more', () => {
		const source = 'a, b, = c\nd, e = f\ng, = h\n';
		const lists = () => py.parse(source).$query().$descendants.ofType(py.kinds.PatternList);
		selects(source, [...lists()], [...lists().where((c) => c.is('trailingComma'))], [...lists().where((c) => c.is('trailingComma').not())], ['a, b,']);
	});

	it('selects natively the case pattern lists the read stamps Trailing with two items or more', () => {
		const source = 'match x:\n    case a, b,:\n        pass\n    case c, d:\n        pass\n    case e,:\n        pass\n';
		const lists = () => py.parse(source).$query().$descendants.ofType(py.kinds.CasePatternList);
		selects(source, [...lists()], [...lists().where((c) => c.is('trailingComma'))], [...lists().where((c) => c.is('trailingComma').not())], ['a, b,']);
	});

	it('pushes the flag\'s plan down with the kind', () => {
		const { root: data, tree: native } = py.diagnostics.parseAndRead('x = 1, 2,\ny = 3, 4\n');
		const steps: { kinds?: readonly number[]; plan?: unknown }[] = [];
		const query = (native as { query?: { descendants(step: { kinds?: readonly number[]; plan?: unknown }): unknown } }).query!;
		const walk = query.descendants;
		query.descendants = (step) => {
			steps.push(step);
			return walk(step);
		};
		expect([...hooks.wrap(data, native).$query().$descendants.ofType(py.kinds.ExpressionList).where((c) => c.is('trailingComma'))]).toHaveLength(1);
		expect(steps).toContainEqual(expect.objectContaining({ kinds: [TSKindId.ExpressionList], plan: queryFlags[TSKindId.ExpressionList]!['trailingComma'] }));
	});
});

describe('the separator and trailing-comma plans, natively, on 1, 1 + trailing, 2 and 2 + trailing items', () => {
	const SOURCE = 'f(a)\nf(a,)\nf(a, b)\nf(a, b,)\n';
	const id = TSKindId.ArgumentListElements;
	const items = { slots: { [id]: querySlots[id]![0]![1] } };
	const separated: QueryPlan = { op: 'or', of: [{ op: 'count', min: 2, ...items }, { op: 'delimiter', delimiter: 2 }] };
	const trailingComma: QueryPlan = { op: 'and', of: [{ op: 'delimiter', delimiter: 2 }, { op: 'count', min: 2, ...items }] };
	const lists = [...py.parse(SOURCE).$query().$descendants.ofType(py.kinds.ArgumentListElements)];
	const holds = (plan: QueryPlan) => lists.map((node) => treeOf(node)!.query!.planHolds([nodeAddressOf(node)!], plan)[0]);

	it('reads the four lists', () => {
		expect(lists.map(textIn(SOURCE))).toEqual(['a', 'a,', 'a, b', 'a, b,']);
	});

	it('holds the separator plan where the list has a comma', () => {
		expect(holds(separated)).toEqual([false, true, true, true]);
	});

	it('holds the trailing-comma plan only on two items and a trailing comma', () => {
		expect(holds(trailingComma)).toEqual([false, false, false, true]);
	});

	it('holds the delimiter leaf on a trailing comma at any count', () => {
		expect(holds({ op: 'delimiter', delimiter: 2 })).toEqual([false, true, false, true]);
	});
});
