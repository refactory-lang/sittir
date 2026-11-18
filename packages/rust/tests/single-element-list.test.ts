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
const tupleOf = (expressions: ReturnType<typeof build.tupleExpressionElements>) =>
	build.tupleExpression({ elements: expressions });

describe('a tuple expression with one element', () => {
	it('renders the separator that makes it a tuple, when built', () => {
		const text = tupleOf(build.tupleExpressionElements(build.identifier('x'))).$render();
		expect(text).toBe('(x,)');
		expect(is.tupleExpression(parsedValue(text))).toBe(true);
	});

	it('refuses a delimiter that drops the separator one element always spells', () => {
		expect(() => build.tupleExpressionElements({ delimiter: Delimiter.None }, build.identifier('x'))).toThrow(
			'tuple_expression_elements: one element always spells its trailing separator, so its delimiter is never None'
		);
	});

	it('renders it when a parsed tuple of two is cut down to one', () => {
		const parsed = parsedTuple('(a, b)');
		const [first] = parsed.elements();
		const text = parsed.$with.elements(first!).$render();
		expect(text).toBe('(a,)');
		expect(is.tupleExpression(parsedValue(text))).toBe(true);
	});
});

describe('a list-form setter', () => {
	it('refuses a list node, naming the setter and saying it takes the items', () => {
		const parsed = parsedTuple('(a, b)');
		const [first] = parsed.elements();
		expect(() => parsed.$with.elements(build.tupleExpressionElements(first!) as never)).toThrow(
			'$with.elements takes the items'
		);
	});
});

describe('a tuple expression with more than one element', () => {
	it('renders no trailing separator unless asked', () => {
		const two = build.tupleExpressionElements(build.identifier('x'), build.identifier('y'));
		expect(tupleOf(two).$render()).toBe('(x, y)');
	});

	it('renders a trailing separator when asked', () => {
		const two = build.tupleExpressionElements({ delimiter: Delimiter.Trailing }, build.identifier('x'), build.identifier('y'));
		expect(tupleOf(two).$render()).toBe('(x, y,)');
	});
});

describe('a tuple type or pattern with one element', () => {
	const parsedType = (text: string) => {
		const item = engine.parse(`const A: ${text} = x;\n`).statements()[0];
		const type = item !== undefined && is.constItem(item) ? item.type() : undefined;
		if (type === undefined || !is.tupleType(type)) throw new Error(`expected a tuple type: ${text}`);
		return type;
	};

	it('renders the separator when the delimiter asks for it, for a type', () => {
		const text = build.tupleType({ types: build.types({ delimiter: Delimiter.Trailing }, parsedType('(u8, u16)').types()[0]!) }).$render();
		expect(text).toBe('(u8,)');
		expect(is.tupleType(parsedType(text))).toBe(true);
	});

	it('renders the separator when the delimiter asks for it, for a pattern', () => {
		const text = build.tuplePattern({ elements: build.tuplePatternElements({ delimiter: Delimiter.Trailing }, build.identifier('a')) }).$render();
		expect(text).toBe('(a,)');
	});

	it('renders the parenthesised spelling without the delimiter', () => {
		const parsed = parsedType('(u8, u16)');
		expect(parsed.$with.types(parsed.types()[0]!).$render()).toBe('(u8)');
	});
});
