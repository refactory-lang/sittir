import { describe, expect, it } from 'vitest';
import { compileGrammar } from '../compiler/compile.ts';
import { joinSeamsOf, unprovenArms } from '../compiler/model/join-seams/index.ts';
import { grammarPackage } from '../grammars.ts';
import { FULL_PIPELINE_TIMEOUT } from './helpers/timeouts.ts';

const CEILINGS: Record<
	string,
	{ readonly previous: number; readonly next: number; readonly pairs: number; readonly decisive: number }
> = {
	rust: { previous: 1, next: 2, pairs: 1, decisive: 85 },
	python: { previous: 4, next: 2, pairs: 4, decisive: 107 },
	typescript: { previous: 2, next: 7, pairs: 2, decisive: 17 },
	regex: { previous: 0, next: 0, pairs: 0, decisive: 0 },
	scm: { previous: 0, next: 0, pairs: 0, decisive: 0 }
};

describe('join seam ratchet', () => {
	for (const [grammar, ceiling] of Object.entries(CEILINGS)) {
		it(
			`${grammar}: arms kept only by an unbuildable check, and the checks behind them, stay at or below their ceilings`,
			async () => {
				const { nodeMap, evaluated, generatedIdTables } = await compileGrammar({ package: grammarPackage(grammar) });
				if (generatedIdTables.parser === null) throw new Error(`${grammar} has no built parser`);
				const seams = joinSeamsOf(nodeMap, evaluated.rules, generatedIdTables.parser);
				const unproven = unprovenArms(seams);
				const reasons = [...new Set(unproven.decisive.map((check) => check.reason))].join('; ');
				expect(unproven.previous.length, `${grammar} previous: ${unproven.previous.join(', ')}`).toBeLessThanOrEqual(
					ceiling.previous
				);
				expect(unproven.next.length, `${grammar} next: ${unproven.next.join(', ')}`).toBeLessThanOrEqual(ceiling.next);
				expect(unproven.pairs.length, `${grammar} pairs: ${unproven.pairs.join(' ')}`).toBeLessThanOrEqual(
					ceiling.pairs
				);
				expect(unproven.decisive.length, `${grammar} decisive checks: ${reasons}`).toBeLessThanOrEqual(
					ceiling.decisive
				);
			},
			FULL_PIPELINE_TIMEOUT
		);
	}
});
