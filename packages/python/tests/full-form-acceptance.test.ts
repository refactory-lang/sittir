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

	it('takes the full form first where the delimiter can also begin the content', () => {
		expect(ir.comment('# x').$render()).toBe('# x');
	});

	it('leaves a kind whose affix is separated from its content to its bare content', () => {
		expect(() => ir.globalStatement('global x')).toThrow(/is not a identifier/);
	});
});
