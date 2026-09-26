import { describe, it, expect } from 'vitest';
import { CHOICE, OPTIONAL, PATTERN, REPEAT1, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import type { Rule } from '../../types/rule.ts';
import { composeTokenText } from '../rule-patterns.ts';

const str = (value: string): Rule<'link'> => ({ type: STRING, value }) as Rule<'link'>;
const pat = (value: string): Rule<'link'> => ({ type: PATTERN, value }) as Rule<'link'>;
const seq = (...members: Rule<'link'>[]): Rule<'link'> => ({ type: SEQ, members }) as Rule<'link'>;
const choice = (...members: Rule<'link'>[]): Rule<'link'> => ({ type: CHOICE, members }) as Rule<'link'>;
const whole = (source: string | undefined): RegExp => new RegExp(`^(?:${source})$`, 'u');

describe('composeTokenText', () => {
	it('escapes strings and keeps patterns verbatim', () => {
		const re = whole(composeTokenText(seq(str('/*'), pat('[^*]*'), str('*/'))));
		expect(re.test('/* x */')).toBe(true);
		expect(re.test('x')).toBe(false);
	});

	it('turns an optional string into an optional group and a blank choice arm into an optional one', () => {
		const re = whole(composeTokenText(seq({ type: OPTIONAL, content: str('b') } as Rule<'link'>, str("'"), choice(pat('[a-z]'), seq()), str("'"))));
		expect(re.test("b'a'")).toBe(true);
		expect(re.test("''")).toBe(true);
		expect(re.test('a')).toBe(false);
	});

	it('alternates a choice and repeats a repeat1', () => {
		const re = whole(composeTokenText({ type: REPEAT1, content: choice(str('.'), str('_')) } as Rule<'link'>));
		expect(re.test('._.')).toBe(true);
		expect(re.test('')).toBe(false);
	});

	it('escapes control characters so the emitted source stays printable', () => {
		expect(composeTokenText(str('\0'))).toBe('\\0');
		expect(composeTokenText(str('\x01'))).toBe('\\x01');
	});

	it('spells control characters as letter escapes where one exists, with the same meaning', () => {
		const source = composeTokenText(seq(str('\r\n'), str('\0'), str('\t\v\f'), str('\0'), pat('[0-9]')));
		expect(source).toBe('\\r\\n\\0\\t\\v\\f\\0(?:[0-9])');
		expect(whole(source).test('\r\n\0\t\v\f\x005')).toBe(true);
		expect(whole(source).test('\r\n\t')).toBe(false);
	});

	it('follows a symbol through the lookup and refuses a cycle', () => {
		const rules: Record<string, Rule<'link'>> = { a: pat('x+'), loop: { type: SYMBOL, name: 'loop' } as Rule<'link'> };
		const sym = (name: string): Rule<'link'> => ({ type: SYMBOL, name }) as Rule<'link'>;
		expect(composeTokenText(sym('a'), (n) => rules[n])).toBe('(?:x+)');
		expect(composeTokenText(sym('loop'), (n) => rules[n])).toBeUndefined();
		expect(composeTokenText(sym('a'))).toBeUndefined();
	});

	it('derives nothing for a token with an empty interior', () => {
		expect(composeTokenText(pat(''))).toBeUndefined();
		expect(composeTokenText(seq(str('a'), pat('')))).toBeUndefined();
	});
});
