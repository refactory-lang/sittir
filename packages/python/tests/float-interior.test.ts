import { describe, it, expect } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

describe('python float arms name their parts', () => {
	it('a point float takes an integer part, an optional fraction, an optional exponent group and an optional imaginary suffix', () => {
		expect(py.build.float.point({ integer: '1', fraction: '5' }).$render()).toBe('1.5');
		expect(py.build.float.point({ integer: '1' }).$render()).toBe('1.');
		expect(py.build.float.point({ integer: '1_0', fraction: '5', marker: 'e-', exponent: '3', imaginary: 'j' }).$render()).toBe('1_0.5e-3j');
	});

	it('a leading-point float takes a fraction and optional integer, exponent and imaginary parts', () => {
		expect(py.build.float.leadingPoint({ fraction: '5' }).$render()).toBe('.5');
		expect(py.build.float.leadingPoint({ fraction: '5', marker: 'E', exponent: '2' }).$render()).toBe('.5E2');
	});

	it('a scientific float takes an integer part, a marker with its exponent and an optional imaginary suffix', () => {
		expect(py.build.float.scientific({ integer: '1', marker: 'e+', exponent: '3_4', imaginary: 'J' }).$render()).toBe('1e+3_4J');
	});

	it('the slot guards reject a part that does not fit its pattern', () => {
		expect(() => py.build.float.scientific({ integer: '1', marker: 'e', exponent: 'q' })).toThrow(/does not match/);
	});
});
