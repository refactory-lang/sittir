import { describe, expect, it } from 'vitest';
import { evaluate } from '../compiler/evaluate.ts';
import { resolveOverridesPath } from '../compiler/resolve-grammar.ts';

const CEILINGS: Record<string, number> = { typescript: 6, rust: 13, python: 14, scm: 1, regex: 1 };

describe('hand-written rule ratchet', () => {
	for (const [grammar, ceiling] of Object.entries(CEILINGS)) {
		it(`${grammar}: rules: entries stay at or below ${ceiling}`, async () => {
			const raw = await evaluate(resolveOverridesPath(grammar));
			const declared = Object.keys(raw.ruleCauses ?? {});
			const undeclared = raw.undeclaredRules ?? [];
			const names = [...declared, ...undeclared].sort();
			expect(new Set(names).size, 'a rule name appears in both declared and undeclared').toBe(names.length);
			expect(names.length, `${grammar} hand-written rules (${names.length} > ${ceiling}):\n${names.join('\n')}`).toBeLessThanOrEqual(ceiling);
		}, 60_000);
	}
});
