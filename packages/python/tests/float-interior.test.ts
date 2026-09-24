import { describe, it, expect } from 'vitest';
import { ir } from '../src/index.ts';

describe('python float arms name their parts', () => {
	it('a point float takes an integer part, an optional fraction, an optional exponent group and an optional imaginary suffix', () => {
		expect(ir.float.point({ integer: '1', fraction: '5' }).$render()).toBe('1.5');
		expect(ir.float.point({ integer: '1' }).$render()).toBe('1.');
		expect(ir.float.point({ integer: '1_0', fraction: '5', marker: 'e-', exponent: '3', imaginary: 'j' }).$render()).toBe('1_0.5e-3j');
	});

	it('a leading-point float takes a fraction and optional integer, exponent and imaginary parts', () => {
		expect(ir.float.leadingPoint({ fraction: '5' }).$render()).toBe('.5');
		expect(ir.float.leadingPoint({ fraction: '5', marker: 'E', exponent: '2' }).$render()).toBe('.5E2');
	});

	it('a scientific float takes an integer part, a marker with its exponent and an optional imaginary suffix', () => {
		expect(ir.float.scientific({ integer: '1', marker: 'e+', exponent: '3_4', imaginary: 'J' }).$render()).toBe('1e+3_4J');
	});

	it('the slot guards reject a part that does not fit its pattern', () => {
		expect(() => ir.float.scientific({ integer: '1', marker: 'e', exponent: 'q' })).toThrow(/does not match/);
	});
});
