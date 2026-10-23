import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';

const upstream = {
	extras: '/\\s/',
	rules: "list: ($) => seq('(', repeat(seq(optional($.attr), choice($.word, $.num, $.str))), ')'), attr: () => /@[a-z]+/, num: () => /[0-9]+/, str: () => /\"[a-z]*\"/"
};

describe('a kind wire creates carries the variant labels enrich gives a kind it mints', () => {
	it('labels the arms of a groups: pattern from the new kind name', async () => {
		const raw = await evaluateTempGrammar(upstream, 'groups: { attributed: ($) => seq(optional($.attr), choice($.word, $.num, $.str)) }');
		const group = raw.rules['_attributed'] as { members: { type: string; members?: { name?: string; annotations?: { variant?: string; variantOf?: string } }[] }[] };
		const arms = group.members.find((member) => member.type === 'CHOICE')!.members!;
		expect(arms.map((arm) => arm.annotations)).toEqual([
			{ variant: 'word', variantOf: '_attributed' },
			{ variant: 'num', variantOf: '_attributed' },
			{ variant: 'str', variantOf: '_attributed' }
		]);
	});
});
