import { describe, expect, it, vi } from 'vitest';
import { FIELD, REPEAT, SEQ, SYMBOL, PATTERN } from '../../types/rule-types.ts'; // @rule-type-consts
import { predictedRawGrammarOf, rawIdTablesOf } from '../../__tests__/helpers/linked.ts';

vi.mock('../normalize.ts', async (original) => ({
	...(await original<typeof import('../normalize.ts')>()),
	normalizeGrammar: () => {
		throw new Error('normalize broke');
	}
}));

describe('a compile phase that throws after an earlier phase reported', () => {
	it('keeps the earlier diagnostics beside the failure, and only the failure blocks', async () => {
		const { diagnoseGrammar } = await import('../compile.ts');
		const evaluated = predictedRawGrammarOf({
			root: { type: REPEAT, content: { type: SEQ, members: [{ type: FIELD, name: 'left', content: { type: SYMBOL, name: 'word' } }, { type: FIELD, name: 'right', content: { type: SYMBOL, name: 'word' } }] } },
			word: { type: PATTERN, value: '[a-z]+' }
		});
		const diagnosis = diagnoseGrammar({ grammar: 'synth', evaluated, generatedIdTables: rawIdTablesOf(evaluated) });
		expect(diagnosis.passed).toBe(false);
		expect(diagnosis.blocked.map((record) => record.code)).toEqual(['compile-phase-failed']);
		expect(diagnosis.grammarDiagnostics.map((record) => record.code)).toEqual(expect.arrayContaining(['multi-slot-nested-seq', 'compile-phase-failed']));
	});
});
