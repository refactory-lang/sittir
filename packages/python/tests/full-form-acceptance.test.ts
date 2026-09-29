import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

describe('builders accept their kind spelled in full', () => {
	it('strips the literal delimiters around a pattern content', () => {
		expect(py.build.escapeSequence.hex('\\x41').$render()).toBe('\\x41');
		expect(py.build.escapeSequence.hex('x41').$render()).toBe('\\x41');
	});

	it('takes the typed prefix as the spelling, the default when bare, and an explicit option over both', () => {
		expect(py.build.integer.hex('0XFF').$render()).toBe('0XFF');
		expect(py.build.integer.hex('0xFF').$render()).toBe('0xFF');
		expect(py.build.integer.hex('FF').$render()).toBe('0xFF');
		expect(py.build.integer.hex('0XFF', { prefix: '0x' }).$render()).toBe('0xFF');
	});

	it('types the spelling it takes from the text', () => {
		const typed: '0X' = py.build.integer.hex('0XFF').prefix();
		const defaulted: '0x' = py.build.integer.hex('FF').prefix();
		const chosen: '0x' = py.build.integer.hex('0XFF', { prefix: '0x' }).prefix();
		const text: string = '0XFF';
		// @ts-expect-error a plain string keeps both spellings
		const unknown: '0x' = py.build.integer.hex(text).prefix();
		expect([typed, defaulted, chosen, unknown]).toEqual(['0X', '0x', '0x', '0X']);
	});

	it('takes the full form first where the delimiter can also begin the content', () => {
		expect(py.build.comment('# x').$render()).toBe('# x\n');
	});

	it('reads a delimiter that is itself a valid interior as the interior', () => {
		expect(py.build.escapeSequence.simple('\\').$render()).toBe('\\\\');
		expect(py.build.escapeSequence.simple('\\\\').$render()).toBe('\\\\');
		expect(py.build.escapeSequence.simple('n').$render()).toBe('\\n');
	});

	it('leaves a kind whose affix is separated from its content to its bare content', () => {
		expect(() => py.build.globalStatement('global x')).toThrow(/is not a identifier/);
	});
});
