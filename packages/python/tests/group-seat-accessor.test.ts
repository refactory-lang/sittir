import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

const contentOf = (source: string) => {
	const statement = py.parse(source).statements()[0]!;
	if (!py.is.SimpleStatements(statement)) throw new Error('not a simple statement');
	const element = statement.simpleStatementsElements()[0]!;
	if (!py.is.expressionStatement(element)) throw new Error('not an expression statement');
	return element.content();
};

const sliceOf = (source: string) => {
	const subscript = contentOf(source);
	if (!py.is.subscript(subscript)) throw new Error('not a subscript');
	const [slice] = subscript.subscripts();
	if (slice === undefined || typeof slice === 'number' || !py.is.slice(slice)) throw new Error('not a slice');
	return slice;
};

const present = <V>(value: V | undefined): V => {
	if (value === undefined) throw new Error('absent');
	return value;
};

describe('a group seat flattens its group fields onto the parent', () => {
	it('reads the slice group expression through the flattened accessor', () => {
		expect(String(py.render(present(sliceOf('a[1:2:3]\n').expression())))).toBe('3');
	});

	it('takes the flattened expression key through $with', () => {
		const rebuilt = sliceOf('a[1:2:3]\n').$with.expression(py.build.integer('9'));
		expect(String(py.render(present(rebuilt.expression())))).toBe('9');
		expect(String(py.render(present(rebuilt.stop())))).toBe('2');
	});
});

describe('an elements seat takes the group config objects its config surface takes', () => {
	const comparisonOf = (source: string) => {
		const comparison = contentOf(source);
		if (!py.is.comparisonOperator(comparison)) throw new Error('not a comparison');
		return comparison;
	};
	const config = () => ({ operators: '>' as const, primaryExpression: py.build.identifier('z') });

	it('builds a comparator from a config object through $with', () => {
		const rebuilt = comparisonOf('a < b\n').$with.comparators(config());
		expect(String(py.render(rebuilt)).replace(/\s+/g, '')).toBe('a>z');
		expect(rebuilt.comparators()).toHaveLength(1);
	});

	it('mixes built comparators and config objects', () => {
		const parsed = comparisonOf('a < b\n');
		const rebuilt = parsed.$with.comparators(parsed.comparators()[0], config());
		expect(rebuilt.comparators()).toHaveLength(2);
	});
});
