import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { Delimiter } from '@sittir/common/utils';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);
const fnOf = (src: string) => ts.parse(src).statements()[0] as any;

describe('a list owner', () => {
	it('iterates the stored elements of a parsed list and reads its delimiter', () => {
		const ps = fnOf('function f(a: number, b: string,) {}\n').parameters();
		expect([...ps]).toHaveLength(2);
		expect(ps.at(0).$render()).toBe('a: number');
		expect(ps.delimiter).toBe(Delimiter.Trailing);
	});
	it('an absent list iterates nothing', () => {
		const ps = fnOf('function f() {}\n').parameters();
		expect([...ps]).toEqual([]);
		expect(ps.length).toBe(0);
	});
});
