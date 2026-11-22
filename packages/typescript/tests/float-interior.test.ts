import { describe, it, expect } from 'vitest';
import type * as T from '../src/types.ts';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);
const tsStrict = await createEngine(typescript, { api: 'strict' });

const hasExponent = (node: T.NumberFloatPoint.Bound): node is Extract<T.NumberFloatPoint.Bound, { readonly _exponent: string }> =>
	node.exponent() !== undefined;

describe('typescript float number arms name their parts', () => {
	it('a point float takes an integer part, an optional fraction and an optional exponent group', () => {
		expect(tsStrict.build.number.floatPoint({ integer: '1', fraction: '5' }).$render()).toBe('1.5');
		expect(ts.build.number.floatPoint({ integer: '1' }).$render()).toBe('1.');
		expect(
			ts.build.number.floatPoint({ integer: '1', fraction: '5', exponentSign: '-', exponent: '3' }).$render()
		).toBe('1.5e-3');
	});

	it('a leading-point float takes a fraction and an optional exponent group', () => {
		expect(ts.build.number.floatLeadingPoint({ fraction: '5' }).$render()).toBe('.5');
		expect(ts.build.number.floatLeadingPoint({ fraction: '5', exponent: '2' }, { marker: 'E' }).$render()).toBe('.5E2');
	});

	it('a scientific float takes an integer part and a marker with its exponent', () => {
		expect(ts.build.number.floatScientific({ integer: '1', exponent: '5' }, { marker: 'E' }).$render()).toBe('1E5');
		expect(ts.build.number.floatScientific({ integer: '2', exponentSign: '+', exponent: '10' }).$render()).toBe('2e+10');
	});

	it('the marker is written only when the exponent group is, and its option chooses the case', () => {
		expect(ts.build.number.floatPoint({ integer: '1', fraction: '5' }).$render()).toBe('1.5');
		expect(ts.build.number.floatPoint({ integer: '1', exponent: '3' }, { marker: 'E' }).$render()).toBe('1.E3');
		const built = ts.build.number.floatPoint({ integer: '1', exponent: '3' });
		if (!hasExponent(built)) throw new Error('a float built with an exponent reads it');
		expect(built.$with.marker('E').$render()).toBe('1.E3');
	});

	it('the slot guards reject a part that does not fit its pattern', () => {
		expect(() => ts.build.number.floatPoint({ integer: 'x' })).toThrow(/does not match/);
		expect(() => ts.build.number.floatScientific({ integer: '1', exponent: 'q' })).toThrow(/does not match/);
	});
});
