import { describe, it, expect } from 'vitest';
import { ir } from '../src/index.ts';

describe('typescript float number arms name their parts', () => {
	it('a point float takes an integer part, an optional fraction and an optional exponent group', () => {
		expect(ir.number.floatPoint.strict({ integer: '1', fraction: '5' }).$render()).toBe('1.5');
		expect(ir.number.floatPoint({ integer: '1' }).$render()).toBe('1.');
		expect(
			ir.number.floatPoint({ integer: '1', fraction: '5', sign: '-', exponent: '3' }).$render()
		).toBe('1.5e-3');
	});

	it('a leading-point float takes a fraction and an optional exponent group', () => {
		expect(ir.number.floatLeadingPoint({ fraction: '5' }).$render()).toBe('.5');
		expect(ir.number.floatLeadingPoint({ fraction: '5', exponent: '2' }, { marker: 'E' }).$render()).toBe('.5E2');
	});

	it('a scientific float takes an integer part and a marker with its exponent', () => {
		expect(ir.number.floatScientific({ integer: '1', exponent: '5' }, { marker: 'E' }).$render()).toBe('1E5');
		expect(ir.number.floatScientific({ integer: '2', sign: '+', exponent: '10' }).$render()).toBe('2e+10');
	});

	it('the marker is written only when the exponent group is, and its option chooses the case', () => {
		expect(ir.number.floatPoint({ integer: '1', fraction: '5' }).$render()).toBe('1.5');
		expect(ir.number.floatPoint({ integer: '1', exponent: '3' }, { marker: 'E' }).$render()).toBe('1.E3');
		expect(ir.number.floatPoint({ integer: '1', exponent: '3' }).$with.marker('E').$render()).toBe('1.E3');
	});

	it('the slot guards reject a part that does not fit its pattern', () => {
		expect(() => ir.number.floatPoint({ integer: 'x' })).toThrow(/does not match/);
		expect(() => ir.number.floatScientific({ integer: '1', exponent: 'q' })).toThrow(/does not match/);
	});
});
