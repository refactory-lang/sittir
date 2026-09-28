import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluate } from '../evaluate.ts';
import { diagnoseEvaluationStage } from '../stage.ts';
import { resolveOverridesPath } from '../resolve-grammar.ts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const fixture = (name: string) => resolve(__dirname, '../../__tests__/fixtures', name);

describe('evaluation stages', () => {
	it('a wired grammar with rules: carries its base evaluated with no wire config, raw and enriched', async () => {
		const raw = await evaluate(fixture('rule-cause-grammar.ts'));
		expect(raw.stages).toBeDefined();
		for (const stage of [raw.stages!.raw, raw.stages!.enriched]) {
			const diagnosis = diagnoseEvaluationStage(stage);
			expect([...diagnosis.ruleNames].sort()).toEqual(['a', 'b', 'c']);
			expect(Array.isArray(diagnosis.diagnostics)).toBe(true);
		}
	});

	it('the raw stage is the base before enrich, the enriched stage the base after it', async () => {
		const raw = await evaluate(resolveOverridesPath('typescript'));
		const { raw: before, enriched: after } = raw.stages!;
		expect(before.ruleNames).not.toContain('export_statement_arm5');
		expect(after.ruleNames).toContain('export_statement_arm5');
	}, 60_000);

	it('the rule names are every name the base declares, including ones the catalog prunes as unreachable', async () => {
		const raw = await evaluate(resolveOverridesPath('typescript'));
		const evaluation = raw.stages!.enriched;
		expect(Object.keys(evaluation.grammar.rules)).not.toContain('_reserved_identifier');
		expect(diagnoseEvaluationStage(evaluation).ruleNames.has('_reserved_identifier')).toBe(true);
	}, 60_000);

	it('a grammar with no wire config has no stages', async () => {
		const raw = await evaluate(fixture('test-grammar.js'));
		expect(raw.stages).toBeUndefined();
	});
});
