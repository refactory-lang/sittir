import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

const sliceOf = (source: string) => {
	const statement: any = py.parse(source).statements()[0];
	const subscript: any = statement.simpleStatementsElements()[0].content();
	return subscript.subscripts()[0];
};

describe('a group seat flattens its group fields onto the parent', () => {
	it('reads the slice group expression through the flattened accessor', () => {
		expect(String(py.render(sliceOf('a[1:2:3]\n').expression()))).toBe('3');
	});

	it('takes the flattened expression key through $with', () => {
		const rebuilt = sliceOf('a[1:2:3]\n').$with.expression(py.build.integer('9'));
		expect(String(py.render(rebuilt.expression()))).toBe('9');
		expect(String(py.render(rebuilt.stop()))).toBe('2');
	});
});

describe('an elements seat takes the group config objects its config surface takes', () => {
	const comparisonOf = (source: string) => {
		const statement: any = py.parse(source).statements()[0];
		return statement.simpleStatementsElements()[0].content();
	};
	const config = () => ({ operators: '>', primaryExpression: py.build.identifier('z') });

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
