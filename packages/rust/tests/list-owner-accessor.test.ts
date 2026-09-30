import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';
import { Delimiter } from '@sittir/common/utils';

const rs = await createEngine(rust);
const { kinds } = rs;

const nodes = <T>(items: readonly T[] | undefined): Exclude<T, number>[] =>
	(items ?? []).filter((item): item is Exclude<T, number> => typeof item !== 'number');

const parametersOf = (source: string) => {
	const item = rs.parse(source).statements()[0]!;
	if (!rs.is.functionItem(item)) throw new Error('not a function');
	return item.parameters();
};

describe('a list owner reads its hoisted list slot as the list items', () => {
	it('returns the items, with an undecorated wrapper element read as its content arm', () => {
		const items = parametersOf('fn f(#[x] a: i32, b: i32) {}\n').parametersElements();
		expect(Array.isArray(items)).toBe(true);
		expect(nodes(items).map((item) => item.$type)).toEqual([kinds.AttributedParameter, kinds.Parameter]);
	});

	it('iterates, counts and indexes the same items the accessor returns', () => {
		const params = parametersOf('fn f(#[x] a: i32, b: i32) {}\n');
		const items = params.parametersElements()!;
		const texts = (values: Iterable<unknown>): string[] =>
			nodes([...values]).map((node) => (node as { $render(): string }).$render());
		expect(texts(params)).toEqual(texts(items));
		expect(params.length).toBe(items.length);
		expect(texts([params.at(1)])).toEqual(texts([items[1]]));
	});

	it('takes the items back through $with, and the rebuilt owner reads them again', () => {
		const params = parametersOf('fn f(#[x] a: i32, b: i32) {}\n');
		const rebuilt = params.$with.parametersElements(...params.parametersElements()!);
		expect(nodes(rebuilt.parametersElements()).map((item) => item.$type)).toEqual([
			kinds.AttributedParameter,
			kinds.Parameter
		]);
		expect(rebuilt.$render()).toBe(params.$render());
	});

	it('takes the whole list node through $with as well', () => {
		const params = parametersOf('fn f(a: i32) {}\n');
		const whole = rs.build.parametersElements(...parametersOf('fn f(b: i32, c: i32) {}\n').parametersElements()!);
		const rebuilt = params.$with.parametersElements(whole);
		expect(rebuilt.parametersElements()).toHaveLength(2);
	});

	it('takes an options bag and items, as the owner factory does', () => {
		const params = parametersOf('fn f(a: i32) {}\n');
		const rebuilt = params.$with.parametersElements({ delimiter: Delimiter.Trailing }, ...params.parametersElements()!);
		expect(rebuilt.parametersElements()).toHaveLength(1);
	});
});
