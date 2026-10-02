import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { is } from '../src/is.ts';
import python from '../src/index.ts';

const py = await createEngine(python);
const x = py.build.identifier('x');
const y = py.build.identifier('y');

const parsedExpression = (expression: string) => {
	const statements = py.parse(`${expression}\n`).statements()[0];
	const statement = typeof statements === 'object' && 'simpleStatementsElements' in statements ? statements[0] : undefined;
	const content = statement !== undefined && is.expressionStatement(statement) ? statement.content() : undefined;
	if (content === undefined) throw new Error(`expected an expression statement: ${expression}`);
	return content;
};
const parsedTuple = (expression: string) => {
	const content = parsedExpression(expression);
	if (!is.tuple(content)) throw new Error(`expected a tuple: ${expression}`);
	return content;
};

describe('a tuple with one element', () => {
	it('renders the comma that makes it a tuple, when built', () => {
		const text = py.build.tuple(x).$render();
		expect(text).toBe('(x,)');
		expect(is.tuple(parsedExpression(text))).toBe(true);
	});

	it('renders it when a parsed tuple of two is cut down to one', () => {
		const [first] = parsedTuple('(a, b)');
		const text = py.build.tuple(first!).$render();
		expect(text).toBe('(a,)');
		expect(is.tuple(parsedExpression(text))).toBe(true);
	});

	it('is what a tuple holding one tuple is', () => {
		expect(py.build.tuple(py.build.tuple(x, y)).$render()).toBe('((x, y),)');
	});
});

describe('the forms beside it', () => {
	it('a parenthesized expression is not a tuple', () => {
		expect(is.parenthesizedExpression(parsedExpression('(a)'))).toBe(true);
	});

	it('an empty tuple renders no comma', () => {
		expect(py.build.tuple().$render()).toBe('()');
		expect(is.tuple(parsedExpression('()'))).toBe(true);
	});

	it('a tuple of two renders no trailing comma', () => {
		expect(py.build.tuple(x, y).$render()).toBe('(x, y)');
	});

	it('parsed tuples keep their kind and their text', () => {
		for (const source of ['(a,)', '(a, b)', '(a, b,)']) expect(parsedTuple(source).$render()).toBe(source);
	});

	it('a list of one element takes no comma', () => {
		expect(py.build.list(x).$render()).toBe('[x]');
	});
});
