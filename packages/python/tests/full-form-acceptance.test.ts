import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

describe('builders and their kind spelled in full', () => {
	it('takes the delimiters in the text only when told they are there', () => {
		expect(py.build.escapeSequence.hex('\\x41', false).$render()).toBe('\\x41');
		expect(py.build.escapeSequence.hex('x41').$render()).toBe('\\x41');
	});

	it('takes the typed prefix as the spelling, the default when bare, and an explicit option over both', () => {
		expect(py.build.integer.hex('0XFF').$render()).toBe('0XFF');
		expect(py.build.integer.hex('0xFF').$render()).toBe('0xFF');
		expect(py.build.integer.hex('FF').$render()).toBe('0xFF');
		expect(py.build.integer.hex('0XFF', { radixPrefix: '0x' }).$render()).toBe('0xFF');
	});

	it('types the spelling it takes from the text', () => {
		const typed: '0X' = py.build.integer.hex('0XFF').radixPrefix();
		const defaulted: '0x' = py.build.integer.hex('FF').radixPrefix();
		const chosen: '0x' = py.build.integer.hex('0XFF', { radixPrefix: '0x' }).radixPrefix();
		const text: string = '0XFF';
		// @ts-expect-error a plain string keeps both spellings
		const unknown: '0x' = py.build.integer.hex(text).radixPrefix();
		expect([typed, defaulted, chosen, unknown]).toEqual(['0X', '0x', '0x', '0X']);
	});

	it('types and builds the spelling of a passed node, else a given option, else the text', () => {
		const options: { readonly radixPrefix?: '0x' | '0X' } = { radixPrefix: '0x' };
		const optional = py.build.integer.hex('0XFF', options);
		const either: '0x' | '0X' = optional.radixPrefix();
		const optionPossible: '0x' extends typeof optional._radixPrefix ? true : false = true;
		// @ts-expect-error an option that may be absent leaves the text's spelling possible
		const narrowed: '0x' = optional.radixPrefix();
		const blank = py.build.integer.hex('0XFF', { radixPrefix: undefined });
		const kept: '0X' = blank.radixPrefix();
		const passed = py.build.integer.hex(py.build.integer.hex('0XFF'), { radixPrefix: '0x' });
		const own: '0X' = passed.radixPrefix();
		expect([either, narrowed, kept, own, optionPossible]).toEqual(['0x', '0x', '0X', '0X', true]);
		expect([blank.$render(), passed.$render()]).toEqual(['0XFF', '0XFF']);
		const dictionary: Record<string, '0X'> = {};
		const sparse = py.build.integer.hex(255n, dictionary);
		// @ts-expect-error a dictionary may lack the spelling, so the default stays possible
		const onlyIndexed: '0X' = sparse.radixPrefix();
		const defaultPossible: '0x' extends typeof sparse._radixPrefix ? true : false = true;
		expect([onlyIndexed, defaultPossible, sparse.$render()]).toEqual(['0x', true, '0xff']);
	});

	it('takes text as content when not told otherwise, where the delimiter can also begin the content', () => {
		expect(py.build.comment('# x').$render()).toBe('## x\n');
		expect(py.build.comment('# x', false).$render()).toBe('# x\n');
	});

	it('reads a delimiter that is itself a valid interior as the interior', () => {
		expect(py.build.escapeSequence.simple('\\').$render()).toBe('\\\\');
		expect(py.build.escapeSequence.simple('\\\\', false).$render()).toBe('\\\\');
		expect(py.build.escapeSequence.simple('n').$render()).toBe('\\n');
	});

	it('leaves a kind whose affix is separated from its content to its bare content', () => {
		expect(() => py.build.globalStatement('global x')).toThrow(/^identifier: text does not match pattern/);
	});
});
