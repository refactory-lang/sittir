import { describe, expect, it } from 'vitest';
import { diagnoseEvaluationStages } from '../../stage.ts';
import { diagnoseRuleCauses } from '../rule-causes.ts';
import { unexpectableExpectEntries } from '../grammar-diagnostics.ts';
import { evaluateTempGrammar } from '../../__tests__/_temp-grammar.ts';

async function collisionsOf(upstreamRules: string, config: string): Promise<{ owner: string; canProceed: boolean }[]> {
	const raw = await evaluateTempGrammar({ extras: '/\\s/', rules: upstreamRules }, config);
	const stages = raw.stages === undefined ? undefined : diagnoseEvaluationStages(raw.stages);
	return diagnoseRuleCauses({ grammar: 'demo', raw, enriched: stages?.enriched })
		.filter((d) => d.code === 'whitespace-mint-collision')
		.map((d) => ({ owner: d.ownerKind!, canProceed: d.canProceed }));
}

describe('whitespace-mint-collision', () => {
	it('blocks a visibleExternals entry that redeclares a minted member', async () => {
		expect(await collisionsOf('', "visibleExternals: () => ({ _tight: { type: 'STRING', value: '' } })")).toEqual([
			{ owner: '_tight', canProceed: false }
		]);
	}, 60_000);

	it('blocks an upstream rule that defines a minted name differently', async () => {
		expect(await collisionsOf("_whitespace: () => 'ws', _space: () => 'sp'", '')).toEqual([
			{ owner: '_whitespace', canProceed: false },
			{ owner: '_space', canProceed: false }
		]);
	}, 60_000);

	it('is unexpectable', () => {
		expect(unexpectableExpectEntries('demo', { 'whitespace-mint-collision': ['_tight'] })).toHaveLength(1);
	});
});
