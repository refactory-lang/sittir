import { describe, expect, it } from 'vitest';
import { fieldWrapGrammar } from '../bind.ts';

const SYM = (name: string) => ({ type: 'SYMBOL', name });
const REPEAT = (content: unknown) => ({ type: 'REPEAT', content });
const REPEAT1 = (content: unknown) => ({ type: 'REPEAT1', content });
const SEQ = (...members: unknown[]) => ({ type: 'SEQ', members });
const STRING = (value: string) => ({ type: 'STRING', value });
const OPTIONAL = (content: unknown) => ({ type: 'CHOICE', members: [content, { type: 'BLANK' }] });
const FIELD = (name: string, content: unknown) => ({ type: 'FIELD', name, content });

const wrapped = (rule: unknown, target: 'a') =>
	(fieldWrapGrammar(
		{ name: 'demo', rules: { owner: rule } } as never,
		[{ owner: 'owner', field: 'x', target: { symbol: target } }]
	).rules as Record<string, unknown>).owner;

describe('a wrap whose target is a repeat content fields the repeat (item 1)', () => {
	it('REPEAT(a) becomes field x over REPEAT(a)', () => {
		expect(wrapped(REPEAT(SYM('a')), 'a')).toEqual(FIELD('x', REPEAT(SYM('a'))));
	});

	it('REPEAT1(a) becomes field x over REPEAT1(a)', () => {
		expect(wrapped(REPEAT1(SYM('a')), 'a')).toEqual(FIELD('x', REPEAT1(SYM('a'))));
	});
});

describe('a target inside a repeated sequence is wrapped at the symbol (item 2)', () => {
	it('REPEAT(SEQ(a, ",")) keeps the repeat and fields the symbol', () => {
		expect(wrapped(REPEAT(SEQ(SYM('a'), STRING(','))), 'a')).toEqual(REPEAT(SEQ(FIELD('x', SYM('a')), STRING(','))));
	});
});

describe('an optional repeat fields the repeat (item 3)', () => {
	it('optional(REPEAT(a)) becomes optional(field x over REPEAT(a))', () => {
		expect(wrapped(OPTIONAL(REPEAT(SYM('a'))), 'a')).toEqual(OPTIONAL(FIELD('x', REPEAT(SYM('a')))));
	});
});

describe('a bare unrepeated target is wrapped at the symbol (item 4, control)', () => {
	it('SEQ(a, ",") fields the symbol', () => {
		expect(wrapped(SEQ(SYM('a'), STRING(',')), 'a')).toEqual(SEQ(FIELD('x', SYM('a')), STRING(',')));
	});
});
