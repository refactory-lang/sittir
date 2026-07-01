/**
 * polymorph-golden-inventory.test.ts — Task 0 guard
 *
 * STATUS: RETIRED (2026-06-01). modelType:'polymorph' no longer exists at runtime.
 * The 36 polymorph kinds that this inventory tracked are now rendered as plain
 * branches. The inventory.json fixture is kept for historical reference.
 *
 * The invariant now is: 0 polymorph modelType nodes in any assembled nodeMap.
 */
import { describe, it, expect } from 'vitest';
import { evaluate } from '../compiler/evaluate.ts';
import { link } from '../compiler/link.ts';
import { normalizeGrammar } from '../compiler/normalize.ts';
import { assemble, AssembleCtx } from '../compiler/assemble.ts';
import { resolveOverridesPath } from '../compiler/resolve-grammar.ts';

const GRAMMARS = ['rust', 'typescript', 'python'] as const;

describe('polymorph golden inventory — Task 0 guard (retired)', () => {
	for (const grammar of GRAMMARS) {
		it(`${grammar}: 0 polymorph modelType nodes in assembled nodeMap (de-polymorph invariant)`, async () => {
			const overridePath = resolveOverridesPath(grammar);
			const raw = await evaluate(overridePath);
			const linked = link(raw);
			const optimized = normalizeGrammar(linked);
			const nodeMap = assemble(optimized, AssembleCtx.from(optimized));

			let polymorphCount = 0;
			for (const [, node] of nodeMap.nodes) {
				// AssembledNode union no longer includes modelType:'polymorph'.
				// Cast via unknown to check the runtime value for the invariant.
				if ((node as { modelType: string }).modelType === 'polymorph') {
					polymorphCount++;
				}
			}
			expect(polymorphCount, `${grammar}: polymorph modelType count`).toBe(0);
		});
	}
});
