import { describe, it, expect } from 'vitest';
import { ir } from '../src/index.ts';

describe('a number given to an integer or float literal is written in its base', () => {
	it('every base, strict and loose', () => {
		expect(ir.integerLiteral.decimal(255).$render()).toBe('255');
		expect(ir.integerLiteral.decimal.strict({ content: 255 }).$render()).toBe('255');
		expect(ir.integerLiteral.hex(255).$render()).toBe('0xff');
		expect(ir.integerLiteral.hex.strict({ content: 255 }).$render()).toBe('0xff');
		expect(ir.integerLiteral.hex({ content: 255, suffix: 'u8' }).$render()).toBe('0xffu8');
		expect(ir.integerLiteral.binary(5).$render()).toBe('0b101');
		expect(ir.integerLiteral.octal(8).$render()).toBe('0o10');
		expect(ir.floatLiteral(1.5).$render()).toBe('1.5');
	});
	it('a bare number picks the arm its text fits', () => {
		expect(ir.callExpression({ function: 'f', arguments: [1, 1.5, 1e21] }).$render()).toBe('f(1, 1.5, 1e+21)');
	});
});
