import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';
import { assemblePredicted } from '../../__tests__/helpers/linked.ts';
import { widenSlotInputs } from '../factories.ts';

const upstream = {
	extras: '/\\s/',
	rules: [
		"source: ($) => repeat(choice($.wrap, $.pair, $.list))",
		"wrap: ($) => seq('(', alias($._e, $.e), ')')",
		"pair: ($) => seq(field('left', $._e), '|', field('right', $._e))",
		"list: ($) => seq('[', repeat1(field('item', $._e)), ']')",
		'_e: ($) => choice($.word, $.number)',
		'word: () => /[a-z]+/',
		'number: () => /[0-9]+/'
	].join(', ')
};

const modelOf = async () => assemblePredicted(await evaluateTempGrammar(upstream, '')).nodeMap;

describe('a slot that splices a materialized hidden rule takes its envelope', () => {
	it('stamps the spliced slots and not the alias site that holds the envelope itself', async () => {
		const nodeMap = await modelOf();
		const stamps = (kind: string) => nodeMap.nodes.get(kind)!.slots.map((slot) => [slot.propertyName, slot.splicedEnvelope]);
		expect(stamps('pair')).toEqual([
			['left', '_e'],
			['right', '_e']
		]);
		expect(stamps('list')).toEqual([['items', '_e']]);
		expect(stamps('wrap')).toEqual([['e', undefined]]);
	});

	it('widens a single slot by the envelope and a repeated slot by its elements', async () => {
		const nodeMap = await modelOf();
		expect(widenSlotInputs('C', nodeMap.nodes.get('pair')!, nodeMap)).toBe('WidenSlots<C, { "left": Admit<T.E>; "right": Admit<T.E> }>');
		expect(widenSlotInputs('C', nodeMap.nodes.get('list')!, nodeMap)).toBe('WidenSlots<C, {}, { "items": Admit<T.E> }>');
	});
});
