import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { Delimiter } from '@sittir/common/utils';
import python from '../src/index.ts';

const py = await createEngine(python);
const fnOf = (src: string) => py.parse(src).statements()[0] as any;

describe('a list owner', () => {
	it('iterates the stored elements of a parsed list and reads its delimiter', () => {
		const ps = fnOf('def f(a, b,):\n    pass\n').parameters();
		expect([...ps]).toHaveLength(2);
		expect(ps.length).toBe(2);
		expect(ps.delimiter).toBe(Delimiter.Trailing);
	});
	it('an absent list iterates nothing', () => {
		const ps = fnOf('def f():\n    pass\n').parameters();
		expect([...ps]).toEqual([]);
		expect(ps.length).toBe(0);
		expect(ps.delimiter).toBeUndefined();
	});
	it('the list slot setter takes the list factory arguments and keeps the elements it is given', () => {
		const ps = fnOf('def f(a, b):\n    pass\n').parameters();
		expect(ps.$with.elements(ps.at(0)).$render()).toBe('(a)');
		expect(ps.$with.elements({ delimiter: Delimiter.Trailing }, ps.at(0)).$render()).toBe('(a,)');
	});
});
