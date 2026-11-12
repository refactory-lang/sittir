import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';

const upstream = {
	extras: '/\\s/',
	rules:
		"integer: () => token(choice(seq(choice('0x', '0X'), repeat1(/_?[A-Fa-f0-9]+/), optional(/[Ll]/)), seq(repeat1(/[0-9]+_?/), choice(optional(/[Ll]/), optional(/[jJ]/)))))"
};

const decimal = "1: variant('decimal', { default: true }), '1/0': variant('long'), '1/1': variant('imaginary'), '1/2': variant('plain', { default: true })";

type Rule = { type: string; name?: string; members?: Rule[]; content?: Rule; value?: string; annotations?: Record<string, unknown> };

describe('variants authored on the arms of a token-form arm with no form alternation', () => {
	it('split it at its presence choice into named kinds, as the arms of a form alternation are', async () => {
		const raw = await evaluateTempGrammar(
			upstream,
			`edits: { integer: { 0: variant('hex'), '0/0': variant('long'), '0/1': variant('plain', { default: true }), ${decimal} } }`
		);
		const rules = raw.rules as unknown as Record<string, Rule>;
		const hex = rules.integer_hex!;
		expect(hex.members?.map((arm) => [arm.name, arm.annotations])).toEqual([
			['integer_hex_long', { variant: 'long', variantOf: 'integer_hex' }],
			['integer_hex_plain', { variant: 'plain', variantOf: 'integer_hex', default: true }]
		]);
		const tail = (kind: string) => rules[kind]!.content!.members!.at(-1)!;
		expect(tail('integer_hex_long')).toMatchObject({ type: 'PATTERN', value: '[Ll]' });
		expect(tail('integer_hex_plain')).toMatchObject({ type: 'REPEAT1' });
		expect(rules.integer_hex_long!.type).toBe('TOKEN');
		expect(rules.integer_hex_plain!.type).toBe('TOKEN');
	}, 120_000);

	it('refuse a token-form arm with no presence choice to split, naming it', async () => {
		const evaluated = evaluateTempGrammar(
			{ ...upstream, rules: upstream.rules.replace(', optional(/[Ll]/)),', '),') },
			`edits: { integer: { 0: variant('hex'), '0/0': variant('long'), '0/1': variant('plain', { default: true }), ${decimal} } }`
		);
		await expect(evaluated).rejects.toThrow(/authored variants name the arms of 'integer_arm1', which has no form alternation to split and no unfielded presence choice/);
	}, 120_000);
});
