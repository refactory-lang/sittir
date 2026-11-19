import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { Delimiter } from '@sittir/common/utils';
import python from '../src/index.ts';

const py = await createEngine(python);
const fnOf = (src: string) => py.parse(src).statements()[0] as any;
const parametersOf = (src: string) => fnOf(src).$query().$descendants.ofType(py.kinds.Parameters).at(0) as any;

describe('a list owner', () => {
	it('iterates the stored elements of a parsed list and reads its delimiter', () => {
		const ps = parametersOf('def f(a, b,):\n    pass\n');
		expect([...ps]).toHaveLength(2);
		expect(ps.length).toBe(2);
		expect(ps.delimiter).toBe(Delimiter.Trailing);
	});
	it('an absent list iterates nothing', () => {
		const ps = parametersOf('def f():\n    pass\n');
		expect([...ps]).toEqual([]);
		expect(ps.length).toBe(0);
		expect(ps.delimiter).toBeUndefined();
	});
	it('the list slot setter takes the list factory arguments and keeps the elements it is given', () => {
		const ps = parametersOf('def f(a, b):\n    pass\n');
		expect(ps.$with.elements(ps.at(0)).$render()).toBe('(a)');
		const list = ps.$query().$descendants.ofType(py.kinds.ParametersElements).at(0);
		expect(ps.$with.elements(list.$with.items(ps.at(0)).$with.delimiter(Delimiter.Trailing)).$render()).toBe('(a,)');
	});
});
