import { describe, it, expect } from 'vitest';
import { classifyTokenChoice, distributeLeafEnum, distributeTokenForms, factorSharedOptional } from '../transform/token-forms.ts';
import type { RuntimeRule } from '../../types/runtime-shapes.ts';

const S = (value: string) => ({ type: 'STRING', value }) as unknown as RuntimeRule;
const P = (value: string) => ({ type: 'PATTERN', value }) as unknown as RuntimeRule;
const BLANK = { type: 'BLANK' } as unknown as RuntimeRule;
const seq = (...members: RuntimeRule[]) => ({ type: 'SEQ', members }) as unknown as RuntimeRule;
const choice = (...members: RuntimeRule[]) => ({ type: 'CHOICE', members }) as unknown as RuntimeRule;
const token = (content: RuntimeRule) => ({ type: 'TOKEN', content }) as unknown as RuntimeRule;
const immediate = (content: RuntimeRule) => ({ type: 'IMMEDIATE_TOKEN', content }) as unknown as RuntimeRule;
const prec = (value: number, content: RuntimeRule) => ({ type: 'PREC', value, content }) as unknown as RuntimeRule;
const shape = (r: RuntimeRule): unknown => JSON.parse(JSON.stringify(r));

describe('classifyTokenChoice', () => {
	it('a choice with a blank arm is presence', () => {
		expect(classifyTokenChoice(choice(seq(S('e'), P('\\d+')), BLANK))).toBe('presence');
	});
	it('a choice of string literals is spelling', () => {
		expect(classifyTokenChoice(choice(S('0x'), S('0X')))).toBe('spelling');
	});
	it('two or more non-blank arms with a non-literal among them are forms', () => {
		expect(classifyTokenChoice(choice(seq(S('0x'), P('[0-9a-f]+')), P('\\d+')))).toBe('forms');
	});
});

describe('distributeTokenForms', () => {
	it('leaves a rule alone when its body is not a token', () => {
		const rule = seq(S('a'), choice(P('x'), P('y')));
		expect(distributeTokenForms(rule, 'demo')).toBe(rule);
	});
	it('leaves a token alone when it holds only spelling and presence choices', () => {
		const rule = token(seq(choice(S('0x'), S('0X')), P('[0-9]+'), choice(S('n'), BLANK)));
		expect(distributeTokenForms(rule, 'demo')).toBe(rule);
	});
	it('hoists a top-level form alternation, one token per arm', () => {
		const hex = seq(choice(S('0x'), S('0X')), P('[0-9a-f]+'));
		const point = seq(P('\\d+'), S('.'), P('\\d+'));
		const digits = P('\\d+');
		const rule = token(choice(hex, choice(point, digits)));
		expect(shape(distributeTokenForms(rule, 'number'))).toEqual(shape(choice(token(hex), token(point), token(digits))));
	});
	it('distributes the enclosing seq over an alternation at an inner position and keeps the wrapper kind', () => {
		const rule = immediate(seq(S('\\'), choice(P('u[0-9a-f]{4}'), P('x[0-9a-f]{2}'))));
		expect(shape(distributeTokenForms(rule, 'escape'))).toEqual(
			shape(choice(immediate(seq(S('\\'), P('u[0-9a-f]{4}'))), immediate(seq(S('\\'), P('x[0-9a-f]{2}')))))
		);
	});
	it('a form alternation under a presence choice hoists with the blank as an arm', () => {
		const rule = token(seq(S("'"), choice(choice(seq(S('\\'), P('.')), P("[^']")), BLANK), S("'")));
		expect(shape(distributeTokenForms(rule, 'char'))).toEqual(
			shape(
				choice(
					token(seq(S("'"), seq(S('\\'), P('.')), S("'"))),
					token(seq(S("'"), P("[^']"), S("'"))),
					token(seq(S("'"), S("'")))
				)
			)
		);
	});
	it('an OPTIONAL wrapping a form alternation hoists exactly as the choice-with-blank spelling does', () => {
		const forms = choice(seq(S('\\'), P('[a-z]')), P("[^']"));
		const viaChoice = distributeTokenForms(token(seq(S("'"), choice(forms, BLANK), S("'"))), 'c');
		const viaOptional = distributeTokenForms(token(seq(S("'"), { type: 'OPTIONAL', content: forms } as unknown as RuntimeRule, S("'"))), 'c');
		expect(shape(viaOptional)).toEqual(shape(viaChoice));
	});
	it('flattens an arm that is itself a form alternation into the parent, one token per form', () => {
		const point = seq(P('\\d+'), S('.'));
		const dec = choice(point, P('\\d+'));
		const out = distributeTokenForms(token(choice(P('[a-z]+'), dec)), 'demo') as unknown as { members: RuntimeRule[] };
		expect(out.members.map(shape)).toEqual([token(P('[a-z]+')), token(point), token(P('\\d+'))].map(shape));
	});
	it('keeps a nested choice of spellings as one arm', () => {
		const out = distributeTokenForms(token(choice(P('[a-z]+'), choice(S('x'), S('y')))), 'demo') as unknown as {
			members: RuntimeRule[];
		};
		expect(out.members).toHaveLength(2);
	});
	it('keeps the prec stack around the distributed choice', () => {
		const rule = prec(3, token(choice(P('a+'), seq(S('b'), P('c+')))));
		const out = distributeTokenForms(rule, 'demo') as unknown as { type: string; value: number; content: { type: string } };
		expect(out.type).toBe('PREC');
		expect(out.value).toBe(3);
		expect(out.content.type).toBe('CHOICE');
	});
	it('throws when an arm would match the empty string', () => {
		expect(() => distributeTokenForms(token(choice(P('a*'), seq(S('b'), P('c')))), 'demo')).toThrow(
			/token forms: arm 0 of 'demo' matches the empty string/
		);
	});
	it('throws when two arms are identical', () => {
		const arm = seq(S('0x'), P('[0-9a-f]+'));
		expect(() => distributeTokenForms(token(choice(arm, seq(S('0x'), P('[0-9a-f]+')))), 'demo')).toThrow(
			/token forms: arms 0 and 1 of 'demo' are identical/
		);
	});
});

describe('factorSharedOptional', () => {
	const optional = (content: RuntimeRule) => choice(content, BLANK);

	it('factors a choice whose every member is optional into one optional choice', () => {
		const rule = choice(optional(P('[Ll]')), optional(P('[jJ]')));
		expect(shape(factorSharedOptional(rule))).toEqual(shape(optional(choice(P('[Ll]'), P('[jJ]')))));
	});
	it('is idempotent', () => {
		const once = factorSharedOptional(token(seq(P('[0-9]+'), choice(optional(P('[Ll]')), optional(P('[jJ]'))))));
		expect(factorSharedOptional(once)).toBe(once);
	});
	it('recurses into a choice nested in a choice, innermost first', () => {
		const rule = choice(choice(optional(S('a')), optional(S('b'))), optional(S('c')));
		expect(shape(factorSharedOptional(rule))).toEqual(shape(optional(choice(choice(S('a'), S('b')), S('c')))));
	});
	it('leaves a mixed choice alone when one member is not optional', () => {
		const rule = choice(optional(S('a')), S('b'));
		expect(factorSharedOptional(rule)).toBe(rule);
	});
	it('leaves a single optional alone', () => {
		const rule = optional(S('a'));
		expect(factorSharedOptional(rule)).toBe(rule);
	});
	it('gives the token-form hoist disjoint arms with the blank case as its own arm', () => {
		const digits = P('[0-9]+');
		const rule = token(seq(digits, choice(optional(P('[Ll]')), optional(P('[jJ]')))));
		const out = distributeTokenForms(factorSharedOptional(rule), 'integer') as unknown as { members: RuntimeRule[] };
		expect(out.members.map(shape)).toEqual([token(seq(digits, P('[Ll]'))), token(seq(digits, P('[jJ]'))), token(seq(digits))].map(shape));
	});
});

describe('distributeLeafEnum', () => {
	it('turns a token over a spelling choice into a choice of tokens', () => {
		const out = distributeLeafEnum(immediate(choice(S('?'), S('!'))));
		expect(shape(out)).toEqual(shape(choice(immediate(S('?')), immediate(S('!')))));
	});
	it('keeps a precedence wrapper around the choice, as the token-forms hoist does', () => {
		const out = distributeLeafEnum(prec(2, token(choice(S('a'), S('b')))));
		expect(shape(out)).toEqual(shape(prec(2, choice(token(S('a')), token(S('b'))))));
	});
	it('leaves a token over forms, and a spelling choice inside a larger token, as written', () => {
		const forms = token(choice(seq(S('0x'), P('[0-9a-f]+')), P('\\d+')));
		const nested = token(seq(choice(S('a'), S('b')), P('x')));
		expect(distributeLeafEnum(forms)).toBe(forms);
		expect(distributeLeafEnum(nested)).toBe(nested);
	});
});
