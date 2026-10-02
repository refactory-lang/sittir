import { describe, expect, it } from 'vitest';
import { spelledFormsClash } from '../trivia.ts';

const form = (kind: string, opens: string[], closes: string[] = ['']) => ({ kind, opens, closes });

describe('the kinds a trivia position tells apart by how they open', () => {
	it('accepts openings none of which begins another', () => {
		expect(spelledFormsClash([form('block', ['/*'], ['*/']), form('line', ['//'])])).toBeUndefined();
	});

	it('accepts a kind with several fixed spellings when every one is told apart', () => {
		expect(spelledFormsClash([form('hex', ['0x', '0X']), form('octal', ['0o', '0O']), form('binary', ['0b', '0B'])])).toBeUndefined();
	});

	it('refuses an opening that begins another kind\'s', () => {
		expect(spelledFormsClash([form('escape', ['\\']), form('backreference', ['\\k<'], ['>'])])).toBe(
			"'escape' (\"\\\\\") and 'backreference' (\"\\\\k<\") are not told apart by how they open"
		);
	});

	it('refuses the same opening on two kinds, checked across every spelling', () => {
		expect(spelledFormsClash([form('a', ['#', '//']), form('b', ['//'])])).toMatch(/'a' \("\/\/"\) and 'b' \("\/\/"\)/);
	});

	it('refuses a kind that opens with nothing, since any text opens so', () => {
		expect(spelledFormsClash([form('line', ['//']), form('bigint', [''], ['n'])])).toMatch(/not told apart by how they open/);
	});
});
