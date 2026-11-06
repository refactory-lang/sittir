import { describe, expect, it } from 'vitest';
import { diagnosePredicted } from '../../__tests__/helpers/linked.ts';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';

const grammarOf = (content: string, token = 'token(/x+/)') => ({
	extras: '/\\s/',
	rules: `source: ($) => repeat(choice($.content, $.item)), item: ($) => seq('<', alias(${token}, $.content), '>'), content: ($) => ${content}, word: (_$) => /[a-z]+/`
});

const codesOf = async (content: string, token?: string) => {
	const raw = await evaluateTempGrammar(grammarOf(content, token), '');
	return diagnosePredicted(raw).diagnostics.map((d) => d.code);
};

describe('an inline-token alias whose display is an existing rule', () => {
	it('over a nonterminal rule is resolved by enrich, which drops the alias: no record reaches the emitter', async () => {
		const codes = await codesOf("seq('a', $.word)");
		expect(codes).not.toContain('alias-inline-token');
		expect(codes).not.toContain('display-union-mixed');
	}, 60_000);

	it('over a terminal rule is reported as alias-inline-token', async () => {
		const codes = await codesOf('/z+/');
		expect(codes).toContain('alias-inline-token');
	}, 60_000);

	it('over an immediate token or a token under prec resolves the same way, with no enrich throw', async () => {
		for (const token of ['token.immediate(/x+/)', 'prec(1, token.immediate(/x+/))', 'token(prec(1, /x+/))']) {
			expect(await codesOf("seq('a', $.word)", token)).not.toContain('alias-inline-token');
			expect(await codesOf('/z+/', token)).toContain('alias-inline-token');
		}
	}, 120_000);
});

