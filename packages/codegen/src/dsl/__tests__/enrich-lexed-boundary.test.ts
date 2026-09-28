import { PATTERN, REPEAT, SEQ, STRING, TOKEN } from '../../types/rule-types.ts'; // @rule-type-consts
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { enrich } from '../enrich.ts';
import type { AnyRule } from '../../types/rule.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

const digits = (): AnyRule => ({ type: PATTERN, value: '[0-9]+' }) as AnyRule;
const separatedDigits = (): AnyRule =>
	({
		type: SEQ,
		members: [digits(), { type: REPEAT, content: { type: SEQ, members: [{ type: STRING, value: "'" }, digits()] } }]
	}) as AnyRule;

function enrichedRules(rules: Record<string, AnyRule>): Record<string, AnyRule> {
	return (enrich({ grammar: { name: 'test', rules } }) as unknown as { grammar: { rules: Record<string, AnyRule> } }).grammar.rules;
}

describe('enrich never mints inside a lexed interior', () => {
	beforeAll(() => installFakeDsl());
	afterAll(() => restoreFakeDsl());

	it('fields a separated list in the syntactic layer but not the same list inside a token', () => {
		const rules = enrichedRules({
			source: { type: SEQ, members: [{ type: 'SYMBOL', name: 'list' }, { type: 'SYMBOL', name: 'number' }] } as AnyRule,
			list: separatedDigits(),
			number: { type: TOKEN, immediate: false, content: separatedDigits() } as AnyRule
		});
		expect(JSON.stringify(rules['list'])).toContain('"FIELD"');
		expect(JSON.stringify(rules['number'])).not.toContain('"FIELD"');
	});
});
