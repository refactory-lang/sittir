import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

const comparison = () => {
	const statement = py.parse('a < b < c\n').statements()[0]!;
	if (!py.is.SimpleStatements(statement)) throw new Error('not a simple statement');
	const element = statement.elements()[0]!;
	if (!py.is.expressionStatement(element)) throw new Error('not an expression statement');
	const content = element.content();
	if (!py.is.comparisonOperator(content)) throw new Error('not a comparison');
	return content;
};

describe('an elements setter takes its elements as rest arguments', () => {
	it('rebuilds from spread elements', () => {
		const cmp = comparison();
		expect(String(py.render(cmp.$with.comparators(...cmp.comparators())))).toBe('a < b < c');
	});

	it('rejects an array with a message naming the rest form', () => {
		const cmp = comparison();
		const untyped = cmp.$with.comparators as unknown as (items: unknown) => unknown;
		expect(() => untyped(cmp.comparators())).toThrow(/\$with\.comparators takes its elements as rest arguments/);
	});
});
