import { describe, it, expect } from 'vitest';
import { numberText } from '../src/number.ts';

describe('numberText', () => {
	it('writes an integer in the base of the slot with its prefix', () => {
		expect(numberText(16, '0x', 255)).toBe('0xff');
		expect(numberText(8, '0o', 8)).toBe('0o10');
		expect(numberText(2, '0b', 5)).toBe('0b101');
		expect(numberText(10, '', 255)).toBe('255');
	});
	it('writes a bigint as plain digits in the base of the slot', () => {
		expect(numberText(10, '', 12345678901234567890n)).toBe('12345678901234567890');
		expect(numberText(16, '0x', 255n)).toBe('0xff');
	});
	it('writes a float as its own text, and a whole number with the spelling the float literal takes', () => {
		expect(numberText('float', '.0', 1.5)).toBe('1.5');
		expect(numberText('float', '.0', 1)).toBe('1.0');
		expect(numberText('float', 'e0', 1)).toBe('1e0');
		expect(numberText('float', '.0', 1e21)).toBe('1e+21');
	});
	it('leaves text and undefined untouched', () => {
		expect(numberText(16, '0x', 'ff')).toBe('ff');
		expect(numberText(16, '0x', undefined)).toBeUndefined();
	});
	it('leaves a fraction in an integer base as its plain text, for the slot guard to reject', () => {
		expect(numberText(16, '0x', 1.5)).toBe('1.5');
	});
	it('refuses a negative value: a negative number is a unary minus applied to a positive literal', () => {
		expect(() => numberText(16, '0x', -1)).toThrow(/a negative number is a unary minus applied to a positive literal; build the literal from its absolute value/);
		expect(() => numberText(10, '', -1n)).toThrow(/unary minus/);
		expect(() => numberText('float', '.0', -1.5)).toThrow(/unary minus/);
		expect(() => numberText(10, '', -0)).toThrow(/numberText: -0: a negative number is a unary minus/);
		expect(() => numberText('float', '.0', -0)).toThrow(/numberText: -0: a negative number is a unary minus/);
	});
	it('refuses a number with no literal spelling', () => {
		expect(() => numberText('float', '.0', Number.NaN)).toThrow(/no literal spelling/);
		expect(() => numberText(10, '', Number.POSITIVE_INFINITY)).toThrow(/no literal spelling/);
	});
	it('refuses an integer past the safe range: it has already lost precision', () => {
		expect(() => numberText(10, '', 2 ** 53)).toThrow(/pass it as a bigint/);
		expect(numberText(10, '', Number.MAX_SAFE_INTEGER)).toBe('9007199254740991');
	});
	it('refuses a bigint for a float literal', () => {
		expect(() => numberText('float', '.0', 1n)).toThrow(/cannot spell a float literal/);
	});
});
