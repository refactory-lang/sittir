import { describe, it, expect } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

describe('a bare number resolves to the number arm its text fits', () => {
	it('an integer, a point float, a leading-point float and a scientific float', () => {
		const list = ts.build.array({ elements: [1, 1.5, 0.5, 1e21] });
		expect(list.$render()).toBe('[1, 1.5, 0.5, 1e+21]');
	});
});

describe('a number given to a number arm is written in the arm base', () => {
	it('strict and loose alike', () => {
		expect(ts.build.number.decimal.strict(255).$render()).toBe('255');
		expect(ts.build.number.decimal(255).$render()).toBe('255');
		expect(ts.build.number.hex.strict(255).$render()).toBe('0xff');
		expect(ts.build.number.hex(255).$render()).toBe('0xff');
		expect(ts.build.number.octal(8).$render()).toBe('0o10');
		expect(ts.build.number.binary(5).$render()).toBe('0b101');
	});
});
