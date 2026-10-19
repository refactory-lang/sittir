import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const engine = await createEngine(python);
const is = python.is.portable;

const comparison = (source: string) => [...engine.parse(source).$query().$descendants.ofType(python.kinds.ComparisonOperator)][0]!;

describe("python's portable guards given a comparison", () => {
	it('read a parsed comparison by its operators', () => {
		expect([is.expression.binary.comparison(comparison('a < b\n')), is.expression.binary.comparison.chain(comparison('a < b\n'))]).toEqual([true, false]);
		expect([is.expression.binary.membership(comparison('a in b\n')), is.expression.binary.comparison.chain(comparison('a in b\n'))]).toEqual([true, false]);
		expect(is.expression.binary.comparison.chain(comparison('a < b < c\n'))).toBe(true);
	});

	it('read the bare kind id by no reading its operators decide: it is a binary expression, and no chain', () => {
		expect(is.expression.binary(python.kinds.ComparisonOperator)).toBe(true);
		expect(is.expression.binary.comparison.chain(python.kinds.ComparisonOperator)).toBe(false);
		expect(is.expression.binary.comparison(python.kinds.ComparisonOperator)).toBe(false);
	});
});
