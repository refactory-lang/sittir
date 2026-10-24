import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { Delimiter } from '@sittir/common/utils';
import rust from '../src/index.ts';

const rs = await createEngine(rust);
const fnOf = (src: string) => {
	const item = rs.parse(src).statements()[0]!;
	if (!rs.is.functionItem(item)) throw new Error('not a function');
	return item;
};
const listOf = (params: ReturnType<ReturnType<typeof fnOf>['parameters']>) => {
	const list = params.elements();
	if (list === undefined || !rs.is.parametersElements(list)) throw new Error('not an ordinary parameter list');
	return list;
};

describe('a list owner', () => {
	it('iterates the items of a parsed list: a decorated element stays its wrapper, a bare one reads as its content', () => {
		const ps = fnOf('fn f(#[cfg(test)] a: u8, b: u16) {}\n').parameters();
		const list = listOf(ps);
		const items = [...list];
		expect(items.map((p) => (typeof p === 'number' ? p : p.$type))).toEqual([
			rs.kinds.AttributedParameter,
			rs.kinds.Parameter
		]);
		const first = items[0]!;
		if (typeof first === 'number' || first.$type !== rs.kinds.AttributedParameter) throw new Error('not attributed');
		expect(first.attributeItem()).toBeDefined();
		expect(list.length).toBe(2);
		const second = list.at(1)!;
		expect(typeof second === 'number' ? '' : rs.render(second).toString()).toBe('b: u16');
	});
	it('reads a parsed trailing comma as its delimiter', () => {
		expect(listOf(fnOf('fn f(a: u8,) {}\n').parameters()).delimiter).toBe(Delimiter.Trailing);
		expect(listOf(fnOf('fn f(a: u8) {}\n').parameters()).delimiter).toBe(Delimiter.None);
	});
	it('an empty branch has no list', () => {
		const ps = fnOf('fn f() {}\n').parameters();
		expect(ps.elements()).toBeUndefined();
		expect(ps.$render()).toBe('()');
	});
	it('a built owner iterates what it was built from', () => {
		const p = rs.build.parameter({ name: 'a', type: 'u8' });
		const ps = rs.build.parametersElements.strict({ delimiter: Delimiter.Trailing }, p);
		expect([...ps]).toHaveLength(1);
		expect(ps.delimiter).toBe(Delimiter.Trailing);
	});
	it('carries only the options its list factory takes', () => {
		const ps = fnOf('fn f(a: u8) {}\n').parameters();
		expect('delimiter' in listOf(ps)).toBe(true);
		expect('separator' in ps).toBe(false);
	});
	it('the list slot setter on a parsed owner takes the list factory arguments', () => {
		const ps = fnOf('fn f(a: u8) {}\n').parameters();
		const q = rs.build.parameter({ name: 'q', type: 'u8' });
		expect(ps.$with.elements(rs.build.parametersElements({ delimiter: Delimiter.Trailing }, q)).$render()).toBe(
			'(q: u8,)'
		);
		expect(ps.$with.elements(rs.build.parametersElements(q)).$render()).toBe('(q: u8)');
	});
	it('the list slot setter on a built owner takes the list factory arguments', () => {
		const q = rs.build.parameter({ name: 'q', type: 'u8' });
		const ps = rs.build.parameters.strict(rs.build.parametersElements.strict(q));
		expect(ps.$with.elements(rs.build.parametersElements({ delimiter: Delimiter.Trailing }, q)).$render()).toBe(
			'(q: u8,)'
		);
	});
	it('$with on an owner is not callable: the list is set through its slot', () => {
		const ps = fnOf('fn f(a: u8) {}\n').parameters();
		expect(typeof ps.$with).toBe('object');
		expect(typeof ps.$with.elements).toBe('function');
	});
	it('writes its members as enumerable own properties; the index getters of a parsed owner stay off the keys', () => {
		const ps = fnOf('fn f(a: u8) {}\n').parameters();
		const list = listOf(ps);
		expect(Object.keys(list)).toEqual(expect.arrayContaining(['length', 'delimiter', 'map']));
		expect(Object.keys(ps)).not.toContain('0');
		expect(Object.getOwnPropertySymbols({ ...list })).toContain(Symbol.iterator);
	});
});
