import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from './_temp-grammar.ts';
import { ruleListParts } from '../../dsl/rule-patterns.ts';

const ALL = ['_tight', '_space', '_newline', '_blankline', '_double_blankline', '_indent', '_dedent'];

async function membersOf(upstreamExtras: string, config: string): Promise<readonly string[]> {
	const raw = await evaluateTempGrammar({ extras: upstreamExtras, rules: '' }, config);
	return ruleListParts(raw.externals).names;
}

describe('the whitespace vocabulary follows the extras the config makes effective', () => {
	it('admits space when the config adds a whitespace extra', async () => {
		expect(await membersOf('/\\n/', 'extras: ($, previous) => [...previous, /\\s/]')).toEqual(ALL);
	}, 60_000);

	it('admits only the tight mark when the config clears the extras', async () => {
		expect(await membersOf('/\\s/', 'extras: () => []')).toEqual(['_tight']);
	}, 60_000);
});
