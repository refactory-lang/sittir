/**
 * polymorph-forms-chartest.test.ts — PR-M characterization test
 *
 * For every polymorph kind across all 3 real grammars, asserts that
 * AssembledPolymorph.forms is consistent with what derivePolymorphForms
 * (assemble.ts:454-466) produces for that kind's assembled rule.
 *
 * PURPOSE: Guard byte-neutrality across the AssembledPolymorph→AssembledBranch
 * subclass move (PR-M Task 2). If the constructor super() call drops or
 * reorders forms, this test catches it. It MUST call the real
 * derivePolymorphForms over the real assembled rule — not a synthetic
 * hand-built round-trip.
 *
 * EXPECTED STATE: passes before Task 2 (nothing changed yet); continues
 * to pass after Task 2 (byte-neutral subclass move).
 */
import { describe, it, expect } from 'vitest';
import { evaluate } from '../compiler/evaluate.ts';
import { link } from '../compiler/link.ts';
import { normalizeGrammar } from '../compiler/normalize.ts';
import { assemble, derivePolymorphForms } from '../compiler/assemble.ts';
import { resolveOverridesPath } from '../compiler/resolve-grammar.ts';
import type { AssembledPolymorph } from '../compiler/node-map.ts';
import { isPolymorph } from '../compiler/rule.ts';

// Polymorphs only exist in override grammars (base=0 for all three); use
// the overrides path so the 36 polymorph kinds (rust=21, ts=11, py=4) are
// covered.
const GRAMMARS = ['rust', 'typescript', 'python'] as const;

describe('polymorph forms characterization — PR-M guard', () => {
	for (const grammar of GRAMMARS) {
		it(`${grammar}: every polymorph kind's forms count + names match derivePolymorphForms`, async () => {
			const overridePath = resolveOverridesPath(grammar);
			const raw = await evaluate(overridePath);
			const linked = link(raw);
			const optimized = normalizeGrammar(linked);
			const nodeMap = assemble(optimized);

			const polymorphKinds: string[] = [];
			for (const [kind, node] of nodeMap.nodes) {
				if (node.modelType !== 'polymorph') continue;
				polymorphKinds.push(kind);
				const poly = node as AssembledPolymorph;

				// Resolve the assembly rule the same way assemble.ts does:
				// prefer topLevelAliasBodies, fall back to rules.
				const assemblyRule =
					optimized.topLevelAliasBodies?.get(kind) ?? optimized.rules[kind]!;

				// Call the real derivePolymorphForms on the real rule.
				const polyForms = derivePolymorphForms(kind, assemblyRule);

				// 1. Form count must match exactly.
				expect(poly.forms.length, `${grammar}/${kind}: form count`).toBe(polyForms.length);

				// 2. For PolymorphRule kinds, formRules == polyForms (same object).
				if (isPolymorph(assemblyRule)) {
					expect(poly.formRules, `${grammar}/${kind}: formRules deep-equals polyForms`).toEqual(
						polyForms
					);
				}

				// 3. Each assembled form has a name derived from the PolymorphForm name
				//    (possibly disambiguated). The raw base name must appear in the
				//    assembled name (e.g., 'block' in 'block', or 'expr' in 'expr2').
				for (let i = 0; i < polyForms.length; i++) {
					const rawName = polyForms[i]!.name;
					const assembledName = poly.forms[i]!.name;
					// Either equal (no disambiguation) or the assembled name
					// starts with the raw name (disambiguated with numeric suffix).
					const isConsistent =
						assembledName === rawName || assembledName.startsWith(rawName);
					expect(isConsistent, `${grammar}/${kind}[${i}]: assembled name '${assembledName}' consistent with raw '${rawName}'`).toBe(true);
				}

				// 4. slots must be non-empty (or at least present) — guards against
				//    structuralSlotRecordFromForms being skipped by super().
				expect(poly.slots, `${grammar}/${kind}: slots record present`).toBeDefined();
			}

			// Sanity: at least one polymorph kind was found in this grammar.
			expect(polymorphKinds.length, `${grammar}: expected polymorph kinds`).toBeGreaterThan(0);
		});
	}
});
