import { describe, expect, it } from 'vitest';
import { ir } from '../src/ir.ts';

describe('builders accept their kind spelled in full', () => {
	it('strips the literal delimiters around a pattern content', () => {
		expect(ir.escapeSequence.hex('\\x41').$render()).toBe('\\x41');
		expect(ir.escapeSequence.hex('x41').$render()).toBe('\\x41');
	});

	it('takes the typed prefix as the spelling, the default when bare, and an explicit option over both', () => {
		expect(ir.integer.hex('0XFF').$render()).toBe('0XFF');
		expect(ir.integer.hex('0xFF').$render()).toBe('0xFF');
		expect(ir.integer.hex('FF').$render()).toBe('0xFF');
		expect(ir.integer.hex('0XFF', { prefix: '0x' }).$render()).toBe('0xFF');
	});

	it('types the spelling it takes from the text', () => {
		const typed: '0X' = ir.integer.hex('0XFF').prefix();
		const defaulted: '0x' = ir.integer.hex('FF').prefix();
		const chosen: '0x' = ir.integer.hex('0XFF', { prefix: '0x' }).prefix();
		const text: string = '0XFF';
		// @ts-expect-error a plain string keeps both spellings
		const unknown: '0x' = ir.integer.hex(text).prefix();
		expect([typed, defaulted, chosen, unknown]).toEqual(['0X', '0x', '0x', '0X']);
	});

	it('takes the full form first where the delimiter can also begin the content', () => {
		expect(ir.comment('# x').$render()).toBe('# x');
	});

	it('leaves a kind whose affix is separated from its content to its bare content', () => {
		expect(() => ir.globalStatement('global x')).toThrow(/is not a identifier/);
	});
});
