import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluate } from '../../evaluate.ts';
import { diagnoseEvaluationStages } from '../../stage.ts';
import { diagnoseRuleCauses } from '../rule-causes.ts';
import { unexpectableExpectEntries } from '../grammar-diagnostics.ts';

const DSL = JSON.stringify(resolve(__dirname, '../../../dsl/index.ts'));

async function collisionsOf(upstreamRules: string, config: string): Promise<{ owner: string; canProceed: boolean }[]> {
	const dir = mkdtempSync(join(tmpdir(), 'sittir-whitespace-collision-'));
	try {
		writeFileSync(
			join(dir, 'base.js'),
			`module.exports = grammar({ name: 'demo', extras: () => [/\\s/], rules: { source: ($) => repeat($.word), word: () => /[a-z]+/, ${upstreamRules} } });\n`
		);
		writeFileSync(
			join(dir, 'grammar.sittir.ts'),
			`import base from './base.js';\nimport { sittirGrammar } from ${DSL};\nexport default sittirGrammar(base, { name: 'demo', ${config} });\n`
		);
		const raw = await evaluate(join(dir, 'grammar.sittir.ts'));
		const stages = raw.stages === undefined ? undefined : diagnoseEvaluationStages(raw.stages);
		return diagnoseRuleCauses({ grammar: 'demo', raw, enriched: stages?.enriched })
			.filter((d) => d.code === 'whitespace-mint-collision')
			.map((d) => ({ owner: d.ownerKind!, canProceed: d.canProceed }));
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
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
