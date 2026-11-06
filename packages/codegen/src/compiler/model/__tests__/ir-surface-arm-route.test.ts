import { describe, expect, it } from 'vitest';
import { assemblePredicted } from '../../../__tests__/helpers/linked.ts';
import { evaluateTempGrammar } from '../../../__tests__/helpers/temp-grammar.ts';
import { seatedFormKinds } from '../ir-surface.ts';

describe('a builder path through an arm route', () => {
	it('is reached by the walk that validates it', async () => {
		const raw = await evaluateTempGrammar(
			{
				extras: '/\\s/',
				rules:
					"source: ($) => repeat($.each), each: ($) => seq($._head, field('body', $.word)), _head: ($) => seq('each', '(', choice(seq(field('type', $.word), field('left', choice($.word, $.pair))), field('left', $.pair)), 'in', field('right', $.word), ')'), pair: ($) => seq($.word, ',', $.word)"
			},
			''
		);
		const { nodeMap } = assemblePredicted(raw);
		expect(nodeMap.nodes.get('head_arm')?.builderPath).toEqual(['each', 'arm']);
		expect(() => seatedFormKinds(nodeMap)).not.toThrow();
	}, 60_000);
});
