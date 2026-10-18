import { beforeAll, describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluate } from '../evaluate.ts';
import { diagnoseEvaluationStage } from '../stage.ts';
import { NO_FILE_TYPES } from '../upstream-file-types.ts';
import { evaluatePackage } from '../evaluate-package.ts';
import { grammarPackage } from '../../grammars.ts';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const fixture = (name: string) => resolve(__dirname, '../../__tests__/fixtures', name);

describe('evaluation stages', () => {
	it('a wired grammar with rules: carries its base evaluated with no wire config, raw and enriched', async () => {
		const raw = await evaluate(fixture('rule-cause-grammar.ts'), NO_FILE_TYPES);
		expect(raw.stages).toBeDefined();
		for (const [stage, ruleNames] of [
			[raw.stages!.raw, ['a', 'b', 'c']],
			[raw.stages!.enriched, ['_layout', 'a', 'b', 'c']]
		] as const) {
			const diagnosis = diagnoseEvaluationStage(stage);
			expect([...diagnosis.ruleNames].sort()).toEqual(ruleNames);
			expect(Array.isArray(diagnosis.diagnostics)).toBe(true);
		}
	});

	describe('typescript', () => {
		let typescript: Awaited<ReturnType<typeof evaluatePackage>>;

		beforeAll(async () => {
			typescript = await evaluatePackage(grammarPackage('typescript'));
		}, FULL_PIPELINE_TIMEOUT);

		it('the raw stage is the base before enrich, the enriched stage the base after it', () => {
			const { raw: before, enriched: after } = typescript.stages!;
			expect(before.ruleNames).not.toContain('export_statement_arm5');
			expect(after.ruleNames).toContain('export_statement_arm5');
		});

		it('the rule names are every name the base declares, including ones the catalog prunes as unreachable', () => {
			const evaluation = typescript.stages!.enriched;
			expect(Object.keys(evaluation.grammar.rules)).not.toContain('_reserved_identifier');
			expect(diagnoseEvaluationStage(evaluation).ruleNames.has('_reserved_identifier')).toBe(true);
		});
	});

	it('a grammar with no wire config has no stages', async () => {
		const raw = await evaluate(fixture('test-grammar.js'), NO_FILE_TYPES);
		expect(raw.stages).toBeUndefined();
	});
});
