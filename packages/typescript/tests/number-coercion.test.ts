import { describe, it, expect } from 'vitest';
import { ir } from '../src/index.ts';

describe('a bare number resolves to the number arm its text fits', () => {
	it('an integer, a point float, a leading-point float and a scientific float', () => {
		const list = ir.array({ elements: [1, 1.5, 0.5, 1e21] });
		expect(list.$render()).toBe('[1, 1.5, 0.5, 1e+21]');
	});
});

describe('a number given to a number arm is written in the arm base', () => {
	it('strict and loose alike', () => {
		expect(ir.number.decimal.strict(255).$render()).toBe('255');
		expect(ir.number.decimal(255).$render()).toBe('255');
		expect(ir.number.hex.strict(255).$render()).toBe('0xff');
		expect(ir.number.hex(255).$render()).toBe('0xff');
		expect(ir.number.octal(8).$render()).toBe('0o10');
		expect(ir.number.binary(5).$render()).toBe('0b101');
	});
});
