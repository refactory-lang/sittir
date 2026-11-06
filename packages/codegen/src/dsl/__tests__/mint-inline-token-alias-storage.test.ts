import { describe, it, expect } from 'vitest';
import { mintInlineLiteralAliasStorage } from '../rule-transforms.ts';
import type { Rule } from '../../types/rule.ts';

type R = Rule<'evaluate'>;
const S = (value: string) => ({ type: 'STRING', value }) as R;
const P = (value: string) => ({ type: 'PATTERN', value }) as R;
const sym = (name: string) => ({ type: 'SYMBOL', name }) as R;
const alias = (content: R, value: string) => ({ type: 'ALIAS', named: true, value, content }) as R;
const choice = (...members: R[]) => ({ type: 'CHOICE', members }) as R;
const seq = (...members: R[]) => ({ type: 'SEQ', members }) as R;
const immediate = (content: R) => ({ type: 'IMMEDIATE_TOKEN', content }) as R;
const token = (content: R) => ({ type: 'TOKEN', content }) as R;
const prec = (value: number, content: R) => ({ type: 'PREC', value, content }) as R;
const mint = (rules: Record<string, R>) => mintInlineLiteralAliasStorage(rules, { word: undefined });

const body = immediate(prec(1, P('[^"\\n\\\\]+')));

describe('mintInlineLiteralAliasStorage over an inline token', () => {
	it('a choice-arm alias over a token becomes an alias of a minted hidden rule', () => {
		const out = mint({ string: seq(S('"'), choice(alias(body, 'string_content'), sym('escape')), S('"')), escape: P('\\\\.') });
		expect(out.storageNames).toEqual(['_string_content']);
		expect(out.rules._string_content).toEqual(body);
		expect(JSON.stringify(out.rules.string)).toContain(JSON.stringify(alias(sym('_string_content'), 'string_content')));
	});

	it('a sole-slot alias over a token is minted the same way', () => {
		const raw = token(prec(-1, P('[^`]*')));
		const out = mint({ raw: seq(S('`'), alias(raw, 'raw_content'), S('`')) });
		expect(out.storageNames).toEqual(['_raw_content']);
		expect(out.rules._raw_content).toEqual(raw);
		expect(out.rules.raw).toEqual(seq(S('`'), alias(sym('_raw_content'), 'raw_content'), S('`')));
	});

	it('two sites of one display over the same body share one rule', () => {
		const out = mint({ a: alias(body, 'content'), b: alias(body, 'content') });
		expect(out.storageNames).toEqual(['_content']);
		expect(out.rules.a).toEqual(alias(sym('_content'), 'content'));
		expect(out.rules.b).toEqual(alias(sym('_content'), 'content'));
	});

	it('an existing rule with the identical body is reused, not minted again', () => {
		const out = mint({ a: alias(body, 'content'), _content: body });
		expect(out.storageNames).toEqual([]);
		expect(out.rules.a).toEqual(alias(sym('_content'), 'content'));
		expect(out.rules._content).toEqual(body);
	});

	it('an existing rule with a different body leaves the site inline', () => {
		const rules = { a: alias(body, 'content'), _content: P('x') };
		const out = mint(rules);
		expect(out.storageNames).toEqual([]);
		expect(out.rules.a).toEqual(alias(body, 'content'));
	});

	it('sites of one display over different bodies stay inline', () => {
		const rules = { a: alias(body, 'content'), b: alias(token(P('y')), 'content') };
		const out = mint(rules);
		expect(out.storageNames).toEqual([]);
		expect(out.rules.a).toEqual(alias(body, 'content'));
	});

	it('an alias over a bare literal is not an inline token and stays inline', () => {
		const rules = { a: alias(S('?'), 'lazy') };
		const out = mint(rules);
		expect(out.storageNames).toEqual([]);
		expect(out.rules.a).toEqual(alias(S('?'), 'lazy'));
	});
});
