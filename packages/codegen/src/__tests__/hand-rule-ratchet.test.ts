import { describe, expect, it } from 'vitest';
import { unverifiedRuleNames } from '../compiler/diagnostics/rule-causes.ts';
import { evaluatePackage } from '../dsl/evaluate-package.ts';
import { grammarPackage } from '../grammars.ts';

const CEILINGS: Record<string, number> = { typescript: 5, rust: 7, python: 13, scm: 0, regex: 0 };

describe('hand-written rule ratchet', () => {
	for (const [grammar, ceiling] of Object.entries(CEILINGS)) {
		it(`${grammar}: rules: entries that stand for something sittir cannot yet derive stay at or below ${ceiling}`, async () => {
			const raw = await evaluatePackage(grammarPackage(grammar));
			const names = unverifiedRuleNames(raw);
			expect(new Set(names).size, 'a rule name appears in both declared and undeclared').toBe(names.length);
			expect(
				names.length,
				`${grammar} hand-written rules (${names.length} > ${ceiling}):\n${names.join('\n')}`
			).toBeLessThanOrEqual(ceiling);
		}, 60_000);
	}
});
