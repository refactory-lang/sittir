// A number builder takes a JavaScript number or bigint and writes the literal
// text its slot's radix and spelling call for; values with no literal
// spelling are refused.
import { describe, expect, it } from 'vitest';
import { ir } from '../src/ir.js';

describe('rust number input', () => {
	it('spells a whole float the way the float literal takes it', () => {
		expect(ir.floatLiteral(1).$render()).toBe('1.0');
		expect(ir.floatLiteral(1.5).$render()).toBe('1.5');
	});
	it('writes an integer in the radix its sub-factory names, from a number or a bigint', () => {
		expect(ir.integerLiteral(255n).$render()).toBe('255');
		expect(ir.integerLiteral.hex(255).$render()).toBe('0xff');
	});
	it('refuses a negative value and an integer past the safe range', () => {
		expect(() => ir.integerLiteral(-1)).toThrow(/a negative number is a unary minus applied to a positive literal/);
		expect(() => ir.integerLiteral(2 ** 53)).toThrow(/pass it as a bigint/);
	});
	it('refuses a bigint for a float literal', () => {
		expect(() => ir.floatLiteral(1n as never)).toThrow(/cannot spell a float literal/);
	});
});
