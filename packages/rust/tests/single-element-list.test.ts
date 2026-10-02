import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { Delimiter } from '@sittir/common/utils';
import { is } from '../src/is.ts';
import rust from '../src/index.ts';

const engine = await createEngine(rust);
const { build } = engine;

const parsedValue = (expression: string) => {
	const item = engine.parse(`const A: T = ${expression};\n`).statements()[0];
	const value = item !== undefined && is.constItem(item) ? item.value() : undefined;
	if (value === undefined) throw new Error(`expected a const item with a value: ${expression}`);
	return value;
};
const parsedTuple = (expression: string) => {
	const value = parsedValue(expression);
	if (!is.tupleExpression(value)) throw new Error(`expected a tuple expression: ${expression}`);
	return value;
};
const tupleOf = (expressions: ReturnType<typeof build.expressions>) =>
	build.tupleExpression({ expressions });

describe('a tuple expression with one element', () => {
	it('renders the separator that makes it a tuple, when built', () => {
		const text = tupleOf(build.expressions(build.identifier('x'))).$render();
		expect(text).toBe('(x,)');
		expect(is.tupleExpression(parsedValue(text))).toBe(true);
	});

	it('renders it whatever the delimiter option says', () => {
		const elements = build.expressions({ delimiter: Delimiter.None }, build.identifier('x'));
		expect(tupleOf(elements).$render()).toBe('(x,)');
	});

	it('renders it when a parsed tuple of two is cut down to one', () => {
		const parsed = parsedTuple('(a, b)');
		const [first] = parsed.expressions();
		const text = parsed.$with.expressions(build.expressions(first!)).$render();
		expect(text).toBe('(a,)');
		expect(is.tupleExpression(parsedValue(text))).toBe(true);
	});
});

describe('a tuple expression with more than one element', () => {
	it('renders no trailing separator unless asked', () => {
		const two = build.expressions(build.identifier('x'), build.identifier('y'));
		expect(tupleOf(two).$render()).toBe('(x, y)');
	});

	it('renders a trailing separator when asked', () => {
		const two = build.expressions({ delimiter: Delimiter.Trailing }, build.identifier('x'), build.identifier('y'));
		expect(tupleOf(two).$render()).toBe('(x, y,)');
	});
});
