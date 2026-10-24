import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';
import { Delimiter } from '@sittir/common/utils';

const rs = await createEngine(rust);
const { kinds } = rs;

const functionOf = (source: string) => {
	const item = rs.parse(source).statements()[0]!;
	if (!rs.is.functionItem(item)) throw new Error('not a function');
	return item;
};

const listOf = (params: ReturnType<ReturnType<typeof functionOf>['parameters']>) => {
	const list = params.elements();
	if (list === undefined || !rs.is.parametersElements(list)) throw new Error('not an ordinary parameter list');
	return list;
};

const texts = (items: Iterable<number | Parameters<typeof rs.render>[0]>): string[] =>
	[...items].map((item) => (typeof item === 'number' ? String(item) : rs.render(item).toString()));

describe('a parameter branch keeps its ordinary list as a ReadonlyArray of the items', () => {
	it('indexes, counts and maps the items, a bare wrapper reading as its content', () => {
		const params = listOf(functionOf('fn f(#[x] a: i32, b: i32) {}\n').parameters());
		expect(params.length).toBe(2);
		const kindOf = (item: (typeof params)[number] | undefined) => (typeof item === 'object' ? item.$type : item);
		expect(kindOf(params[0])).toBe(kinds.AttributedParameter);
		expect(kindOf(params[1])).toBe(kinds.Parameter);
		expect(params.map((param) => (typeof param === 'number' ? param : param.$type))).toEqual([
			kinds.AttributedParameter,
			kinds.Parameter
		]);
	});

	it('answers every non-mutating array method from the same items', () => {
		const params = listOf(functionOf('fn f(a: i32, b: i32, c: i32) {}\n').parameters());
		const rendered = texts(params);
		expect(texts(params.slice(1))).toEqual(rendered.slice(1));
		expect(texts(params.filter((_, index) => index !== 1))).toEqual([rendered[0], rendered[2]]);
		expect(params.findIndex((param) => typeof param !== 'number' && rs.render(param).toString() === 'b: i32')).toBe(1);
		expect(params.some((param) => typeof param === 'number')).toBe(false);
		expect(texts(params.toReversed())).toEqual([...rendered].reverse());
		expect([...params.keys()]).toEqual([0, 1, 2]);
		expect(params.includes(params[2]!)).toBe(true);
		expect(params.at(-1)).toBe(params[2]);
	});

	it('reads the list node as the same items, and the owner keeps the list options', () => {
		const params = functionOf('fn f(a: i32, b: i32,) {}\n').parameters();
		const list = listOf(params);
		expect(list.$type).toBe(kinds.ParametersElements);
		expect(list).toBe(params.elements());
		expect(texts(list)).toEqual(['a: i32', 'b: i32']);
		expect(params.$render()).toBe('(a: i32, b: i32,)');
		expect(list.delimiter).toBe(Delimiter.Trailing);
	});

	it('arrives with its list node already read, so sizing the view reads nothing more', () => {
		const list = listOf(functionOf('fn f(a: i32, b: i32) {}\n').parameters()) as unknown as Record<string, unknown>;
		expect(list).not.toHaveProperty('$parentHandle');
		expect(list._item).toHaveLength(2);
	});

	it('reads an empty parameter branch with no list', () => {
		const params = functionOf('fn f() {}\n').parameters();
		expect(params.elements()).toBeUndefined();
		expect(params.$render()).toBe('()');
	});

	it('writes the view as enumerable members, with the index getters of a parsed owner off the keys', () => {
		const params = functionOf('fn f(a: i32) {}\n').parameters();
		const list = listOf(params);
		const keys = Object.keys(list);
		for (const member of ['length', 'map', 'delimiter']) expect(keys).toContain(member);
		expect(keys).not.toContain('0');
		expect(Object.keys(params)).not.toContain('0');
	});
});

describe('a slot that holds a list takes its builder arguments', () => {
	it('sets the parameters of a function from items, options and items, or the whole node', () => {
		const item = functionOf('fn f(a: i32, b: i32) {}\n');
		const [a, b] = listOf(item.parameters());
		expect(item.$with.parameters(rs.build.parameters(rs.build.parametersElements(b!, a!))).$render()).toBe(
			'fn f(b: i32, a: i32) {}'
		);
		expect(
			item.$with
				.parameters(rs.build.parameters(rs.build.parametersElements({ delimiter: Delimiter.Trailing }, a!)))
				.$render()
		).toBe('fn f(a: i32,) {}');
		expect(item.$with.parameters(item.parameters()).$render()).toBe('fn f(a: i32, b: i32) {}');
		expect(item.$with.parameters(rs.build.parameters(rs.build.parametersElements(a!, b!))).$render()).toBe(
			'fn f(a: i32, b: i32) {}'
		);
	});

	it('sets the list slot of the owner itself the same way', () => {
		const params = functionOf('fn f(a: i32, b: i32) {}\n').parameters();
		const [a, b] = listOf(params);
		expect(params.$with.elements(rs.build.parametersElements(b!, a!)).$render()).toBe('(b: i32, a: i32)');
		expect(params.$with.elements().$render()).toBe('()');
	});
});
