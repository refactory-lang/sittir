import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';
import { assemblePredicted } from '../../__tests__/helpers/linked.ts';

const upstream = {
	extras: '/\\s/',
	rules: [
		"source: ($) => repeat($.print_statement_chevron)",
		"print_statement_chevron: ($) => seq('print', field('chevron', $.chevron), optional(choice(field('arguments', alias($._print_chevron_arguments, $.print_chevron_arguments)), field('bare_comma', ','))))",
		"chevron: ($) => seq('>>', field('expression', $.word))",
		"_print_chevron_arguments: ($) => seq(repeat1(seq(',', field('item', $.word))), optional(','))"
	].join(', ')
};

describe('an optional choice of labelled slots', () => {
	it('stays in its kind as one slot per arm, with no kind minted for the choice', async () => {
		const { nodeMap } = assemblePredicted(await evaluateTempGrammar(upstream, ''));
		const chevron = nodeMap.nodes.get('print_statement_chevron')!;
		expect(chevron.slots.map((slot) => [slot.propertyName, slot.values.map((value) => value.multiplicity)])).toEqual([
			['chevron', ['single']],
			['arguments', ['optional']],
			['bareComma', ['optional']]
		]);
		expect([...nodeMap.nodes.keys()].filter((kind) => kind.includes('_arm'))).toEqual([]);
	});
});
