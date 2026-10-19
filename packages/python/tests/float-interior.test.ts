import { describe, it, expect } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

describe('python float arms name their parts', () => {
	it('a point float takes an integer part, an optional fraction, an optional exponent group and an optional imaginary suffix', () => {
		expect(py.build.float.point({ integer: '1', fraction: '5' }).$render()).toBe('1.5');
		expect(py.build.float.point({ integer: '1' }).$render()).toBe('1.');
		expect(py.build.float.point({ integer: '1_0', fraction: '5', sign: '-', exponent: '3', imaginary: 'j' }).$render()).toBe('1_0.5e-3j');
	});

	it('a leading-point float takes a fraction and optional integer, exponent and imaginary parts', () => {
		expect(py.build.float.leadingPoint({ fraction: '5' }).$render()).toBe('.5');
		expect(py.build.float.leadingPoint({ fraction: '5', exponent: '2' }, { marker: 'E' }).$render()).toBe('.5E2');
	});

	it('a scientific float takes an integer part, a marker with its exponent and an optional imaginary suffix', () => {
		expect(py.build.float.scientific({ integer: '1', sign: '+', exponent: '3_4', imaginary: 'J' }).$render()).toBe('1e+3_4J');
	});

	it('the slot guards reject a part that does not fit its pattern', () => {
		expect(() => py.build.float.scientific({ integer: '1', exponent: 'q' })).toThrow(/does not match/);
	});

	it('the marker option chooses the exponent case and defaults to lower case', () => {
		expect(py.build.float.scientific({ integer: '1', exponent: '3' }).$render()).toBe('1e3');
		expect(py.build.float.scientific({ integer: '1', exponent: '3' }, { marker: 'E' }).$render()).toBe('1E3');
		expect(py.build.float.point({ integer: '1', sign: '-', exponent: '3' }, { marker: 'E' }).$render()).toBe('1.E-3');
		expect(py.build.float.scientific({ integer: '1', exponent: '3' }).$with.marker('E').$render()).toBe('1E3');
	});

	it('a parsed float keeps the marker it was written with', () => {
		for (const source of ['1E3\n', '1e3\n', '1.5E-3\n', '.5e+2j\n']) expect(py.parse(source).$render()).toBe(source);
	});
});
