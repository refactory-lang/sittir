import { describe, expect, it } from 'vitest';
import { diagnosePredicted } from '../../__tests__/helpers/linked.ts';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';

const UPSTREAM = {
	extras: '/\\s/',
	externals: '$.tok_open, $.tok_close',
	rules: 'source: ($) => repeat(choice($.word, $.group)), group: ($) => seq($.tok_open, $.word, $.tok_close)'
};

const codesOf = async (config: string) => {
	const raw = await evaluateTempGrammar(UPSTREAM, config);
	return diagnosePredicted(raw).diagnostics.filter((d) => d.code === 'render-as-entry-missing');
};

describe('a visible external scanner token with no renderAs shape', () => {
	it('is one blocking record per token, all in one run, naming the renderAs entry', async () => {
		const found = await codesOf('');
		expect(found.map((d) => d.ownerKind).sort()).toEqual(['tok_close', 'tok_open']);
		for (const d of found) {
			expect(d.canProceed).toBe(false);
			expect(d.proposal).toContain('renderAs:');
		}
	}, 60_000);

	it('is silent once each token has a renderAs entry', async () => {
		expect(await codesOf("renderAs: (_$) => ({ tok_open: token.immediate('<'), tok_close: token.immediate('>') })")).toEqual([]);
	}, 60_000);
});
