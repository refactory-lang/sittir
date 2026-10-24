import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { Delimiter } from '@sittir/common/utils';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);
const fnOf = (src: string) => {
	const node = ts.parse(src).statements()[0]!;
	if (!ts.is.functionDeclaration(node)) throw new Error('not a function');
	return node;
};
const listOf = (owner: ReturnType<ReturnType<typeof fnOf>['parameters']>) => {
	const list = owner.elements();
	if (list === undefined || !ts.is.formalParametersElements(list)) throw new Error('not an ordinary list');
	return list;
};

describe('a list owner', () => {
	it('iterates the stored elements of a parsed list and reads its delimiter', () => {
		const ps = fnOf('function f(a: number, b: string,) {}\n').parameters();
		const list = listOf(ps);
		expect([...list]).toHaveLength(2);
		expect(list.at(0)!.$render()).toBe('a: number');
		expect(list.delimiter).toBe(Delimiter.Trailing);
	});
	it('an absent list iterates nothing', () => {
		const ps = fnOf('function f() {}\n').parameters();
		expect(ps.elements()).toBeUndefined();
		expect(ps.$render()).toBe('()');
	});
	it('the list slot setter takes the list factory arguments and keeps the elements it is given', () => {
		const ps = fnOf('function f(a: number, b: string) {}\n').parameters();
		expect(ps.$with.elements(ts.build.formalParametersElements(listOf(ps).at(0)!)).$render()).toBe('(a: number)');
		expect(
			ps.$with
				.elements(ts.build.formalParametersElements({ delimiter: Delimiter.Trailing }, listOf(ps).at(0)!))
				.$render()
		).toBe('(a: number,)');
	});
});
