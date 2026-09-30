import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { Delimiter } from '@sittir/common/utils';
import rust from '../src/index.ts';

const rs = await createEngine(rust);
const fnOf = (src: string) => rs.parse(src).statements()[0] as any;

describe('a list owner', () => {
	it('iterates the stored elements of a parsed list', () => {
		const ps = fnOf('fn f(#[cfg(test)] a: u8, b: u16) {}\n').parameters();
		const items = [...ps];
		expect(items.map((p: any) => p.$type)).toEqual([rs.kinds.AttributedParameter, rs.kinds.AttributedParameter]);
		expect(items[0].attributeItem()).toBeDefined();
		expect(ps.length).toBe(2);
		expect(ps.at(1).$render()).toBe('b: u16');
	});
	it('reads a parsed trailing comma as its delimiter', () => {
		expect(fnOf('fn f(a: u8,) {}\n').parameters().delimiter).toBe(Delimiter.Trailing);
		expect(fnOf('fn f(a: u8) {}\n').parameters().delimiter).toBe(Delimiter.None);
	});
	it('an absent list iterates nothing', () => {
		const ps = fnOf('fn f() {}\n').parameters();
		expect([...ps]).toEqual([]);
		expect(ps.length).toBe(0);
		expect(ps.at(0)).toBeUndefined();
		expect(ps.delimiter).toBe(Delimiter.None);
	});
	it('a built owner iterates what it was built from', () => {
		const p = rs.build.parameter({ name: 'a', type: 'u8' });
		const ps = rs.build.parameters.strict({ delimiter: Delimiter.Trailing }, p) as any;
		expect([...ps]).toHaveLength(1);
		expect(ps.delimiter).toBe(Delimiter.Trailing);
	});
	it('spreads and serialises as before: the list-owner members are not enumerable', () => {
		const ps = fnOf('fn f(a: u8) {}\n').parameters();
		expect(Object.keys(ps)).not.toContain('length');
		expect(Object.keys(ps)).not.toContain('delimiter');
		expect(Object.getOwnPropertySymbols({ ...ps })).not.toContain(Symbol.iterator);
	});
});
