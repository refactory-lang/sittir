import { describe, expect, it } from 'vitest';
import { grammarPackage } from '../../grammars.ts';
import { compileGrammar } from '../compile.ts';
import { diagnosePredicted } from '../../__tests__/helpers/linked.ts';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';

describe('a named alias over a bare string literal whose display is a terminal rule', () => {
	it('is not reported: the literal reads as the display kind', async () => {
		const raw = await evaluateTempGrammar(
			{
				extras: '/\\s/',
				rules: "source: ($) => repeat(choice($.content, $.item)), item: ($) => seq('<', alias('a', $.content), '>'), content: ($) => /z+/, word: (_$) => /[a-z]+/"
			},
			''
		);
		expect(diagnosePredicted(raw).diagnostics.map((d) => d.code)).not.toContain('alias-inline-token');
	}, 60_000);

	it("reads as identifier in rust's generic_type, where `union` is aliased to the identifier rule", async () => {
		const { nodeMap } = await compileGrammar({ package: grammarPackage('rust') });
		const kinds = nodeMap.nodes.get('generic_type')!.slots.find((slot) => slot.name === 'type')!.values.map((value) => value.node?.kind);
		expect(kinds).toContain('identifier');
	}, 120_000);
});
