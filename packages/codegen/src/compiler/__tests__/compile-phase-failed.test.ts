import { describe, expect, it } from 'vitest';
import { diagnoseGrammar } from '../compile.ts';
import { predictedRawGrammarOf, rawIdTablesOf } from '../../__tests__/helpers/linked.ts';
import { PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts

const diagnose = (allowDiagnostics?: ReadonlySet<string>) => {
	const evaluated = predictedRawGrammarOf({
		root: { type: SEQ, members: [{ type: STRING, value: 'a' }, { type: SYMBOL, name: 'inner' }] },
		inner: { type: PATTERN, value: '[a-z]+' }
	});
	const foreign = rawIdTablesOf(predictedRawGrammarOf({ root: { type: PATTERN, value: 'x' } }));
	return diagnoseGrammar({ grammar: 'synth', evaluated, generatedIdTables: foreign, allowDiagnostics });
};

describe('a compile phase that throws', () => {
	it('is reported as a blocked compile-phase-failed record instead of escaping as the raw error', () => {
		const diagnosis = diagnose();
		expect(diagnosis.passed).toBe(false);
		expect(diagnosis.blocked.map((record) => record.code)).toEqual(['compile-phase-failed']);
		expect(diagnosis.blocked[0]).toMatchObject({ canProceed: false, severity: 'error', details: { phase: expect.stringMatching(/^(link|normalize|assemble)$/) } });
		expect(diagnosis.grammarDiagnostics).toContain(diagnosis.blocked[0]);
	});

	it('cannot be allowed, so the run still fails', () => {
		const diagnosis = diagnose(new Set(['compile-phase-failed']));
		expect(diagnosis.passed).toBe(false);
	});
});
