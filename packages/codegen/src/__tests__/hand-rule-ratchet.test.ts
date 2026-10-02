import { describe, expect, it } from 'vitest';
import { isWitnessVerified } from '../compiler/diagnostics/rule-causes.ts';
import { evaluatePackage } from '../compiler/evaluate-package.ts';
import { grammarPackage } from '../grammars.ts';

const CEILINGS: Record<string, number> = { typescript: 5, rust: 8, python: 14, scm: 0, regex: 0 };

describe('hand-written rule ratchet', () => {
	for (const [grammar, ceiling] of Object.entries(CEILINGS)) {
		it(`${grammar}: rules: entries that stand for something sittir cannot yet derive stay at or below ${ceiling}`, async () => {
			const raw = await evaluatePackage(grammarPackage(grammar));
			const declared = Object.entries(raw.ruleCauses ?? {})
				.filter(([, declaration]) => !isWitnessVerified(declaration))
				.map(([name]) => name);
			const undeclared = raw.undeclaredRules ?? [];
			const names = [...declared, ...undeclared].sort();
			expect(new Set(names).size, 'a rule name appears in both declared and undeclared').toBe(names.length);
			expect(names.length, `${grammar} hand-written rules (${names.length} > ${ceiling}):\n${names.join('\n')}`).toBeLessThanOrEqual(ceiling);
		}, 60_000);
	}
});
