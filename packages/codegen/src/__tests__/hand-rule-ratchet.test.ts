import { describe, expect, it } from 'vitest';
import { evaluatePackage } from '../compiler/evaluate-package.ts';
import { grammarPackage } from '../grammars.ts';

const CEILINGS: Record<string, number> = { typescript: 5, rust: 12, python: 13, scm: 0, regex: 0 };

describe('hand-written rule ratchet', () => {
	for (const [grammar, ceiling] of Object.entries(CEILINGS)) {
		it(`${grammar}: rules: entries stay at or below ${ceiling}`, async () => {
			const raw = await evaluatePackage(grammarPackage(grammar));
			const declared = Object.keys(raw.ruleCauses ?? {});
			const undeclared = raw.undeclaredRules ?? [];
			const names = [...declared, ...undeclared].sort();
			expect(new Set(names).size, 'a rule name appears in both declared and undeclared').toBe(names.length);
			expect(names.length, `${grammar} hand-written rules (${names.length} > ${ceiling}):\n${names.join('\n')}`).toBeLessThanOrEqual(ceiling);
		}, 60_000);
	}
});
