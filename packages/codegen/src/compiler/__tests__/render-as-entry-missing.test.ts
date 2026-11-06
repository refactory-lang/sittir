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

describe('an upstream-aliased external scanner token with no renderAs shape', () => {
	const ALIASED = {
		extras: '/\\s/',
		externals: '$.interp_content',
		rules: "source: ($) => repeat(choice($.word, $.str)), str: ($) => seq('\"', repeat(alias($.interp_content, $.string_content)), '\"')"
	};
	const diagnose = async (config: string) => {
		const raw = await evaluateTempGrammar(ALIASED, config);
		return diagnosePredicted(raw).diagnostics.filter((d) => d.code === 'render-as-entry-missing' || d.code === 'render-only-not-external');
	};

	it('names the external rule, not the node it is aliased to', async () => {
		const found = await diagnose('');
		expect(found.map((d) => d.ownerKind)).toEqual(['interp_content']);
		expect(found[0]!.proposal).toContain('interp_content:');
		expect(found[0]!.proposal).not.toContain('string_content:');
	}, 60_000);

	it('is cleared by the proposed key, and render-only-not-external does not fire', async () => {
		expect(await diagnose("renderAs: (_$) => ({ interp_content: token.immediate(/[^\"]+/) })")).toEqual([]);
	}, 60_000);
});
