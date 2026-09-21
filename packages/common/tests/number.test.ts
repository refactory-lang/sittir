import { describe, it, expect } from 'vitest';
import { numberText } from '../src/number.ts';

describe('numberText', () => {
	it('writes an integer in the base of the slot with its prefix', () => {
		expect(numberText(16, '0x', 255)).toBe('0xff');
		expect(numberText(8, '0o', 8)).toBe('0o10');
		expect(numberText(2, '0b', 5)).toBe('0b101');
		expect(numberText(10, '', 255)).toBe('255');
	});
	it('writes a float as its own text', () => {
		expect(numberText('float', '', 1.5)).toBe('1.5');
		expect(numberText('float', '', 1e21)).toBe('1e+21');
	});
	it('leaves text and undefined untouched', () => {
		expect(numberText(16, '0x', 'ff')).toBe('ff');
		expect(numberText(16, '0x', undefined)).toBeUndefined();
	});
	it('leaves a value the base cannot write as its plain text, for the slot guard to reject', () => {
		expect(numberText(16, '0x', -1)).toBe('-1');
		expect(numberText(16, '0x', 1.5)).toBe('1.5');
	});
});
