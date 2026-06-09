/**
 * polymorph-forms-chartest.test.ts — PR-M characterization test
 *
 * PURPOSE: Previously guarded byte-neutrality of AssembledPolymorph.forms across
 * the AssembledPolymorph→AssembledBranch subclass move (PR-M Task 2).
 *
 * STATUS: RETIRED (2026-06-01). modelType:'polymorph' no longer exists at runtime
 * (de-polymorph pass completed). derivePolymorphForms and isPolymorph were removed
 * from assemble.ts and rule.ts respectively. The guard invariant (0 polymorph kinds
 * in every grammar) is tested by the suite below.
 */
import { describe, it, expect } from 'vitest';
import { evaluate } from '../compiler/evaluate.ts';
import { link } from '../compiler/link.ts';
import { normalizeGrammar } from '../compiler/normalize.ts';
import { assemble } from '../compiler/assemble.ts';
import { resolveOverridesPath } from '../compiler/resolve-grammar.ts';

const GRAMMARS = ['rust', 'typescript', 'python'] as const;

describe('polymorph forms characterization — PR-M guard (retired)', () => {
	for (const grammar of GRAMMARS) {
		it(`${grammar}: 0 polymorph modelType nodes in assembled nodeMap (de-polymorph invariant)`, async () => {
			const overridePath = resolveOverridesPath(grammar);
			const raw = await evaluate(overridePath);
			const linked = link(raw);
			const optimized = normalizeGrammar(linked);
			const nodeMap = assemble(optimized);

			let polymorphCount = 0;
			for (const [, node] of nodeMap.nodes) {
				// AssembledNode union no longer includes modelType:'polymorph'.
				// This cast is safe: we're just checking a runtime string property
				// to verify the invariant holds on whatever nodes actually exist.
				if ((node as { modelType: string }).modelType === 'polymorph') {
					polymorphCount++;
				}
			}
			expect(polymorphCount, `${grammar}: polymorph modelType count`).toBe(0);
		});
	}
});
