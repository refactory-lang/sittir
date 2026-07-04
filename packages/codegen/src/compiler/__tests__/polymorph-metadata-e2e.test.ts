import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { evaluate } from '../evaluate.ts';
import { link } from '../link.ts';
import { deriveStructuralVariantChildren, polymorphVisibleName } from '../variant-structural.ts';

const __dirname = new URL('.', import.meta.url).pathname;
const resolveOverrides = (grammar: string) => resolve(__dirname, `../../../../${grammar}/overrides.ts`);

/**
 * R12/decision-7 V2 Task 2: this suite formerly asserted the WIRE metadata
 * channel (`raw.polymorphVariants`, populated by `wireRegisterPolymorphVariant`
 * during evaluate). That channel is deleted — variant-adoption pairs are now
 * discovered STRUCTURALLY from the post-link rule tree
 * (`deriveStructuralVariantChildren`, compiler/variant-structural.ts). These
 * tests are the direct successor: same real-grammar e2e coverage, asserting
 * the structural derivation's output instead of the deleted wire pairs.
 */
describe('polymorph metadata — structural e2e', () => {
	it('python: assignment polymorph variants are derived structurally', async () => {
		const raw = await evaluate(resolveOverrides('python'));
		const linked = link(raw);
		const structural = deriveStructuralVariantChildren(linked.rules);
		const assignmentVariants = structural.get('assignment');
		expect(assignmentVariants).toEqual([
			polymorphVisibleName('assignment', 'eq'),
			polymorphVisibleName('assignment', 'type'),
			polymorphVisibleName('assignment', 'typed')
		]);
	});

	it('rust: polymorph variants derived structurally for converted rules', async () => {
		const raw = await evaluate(resolveOverrides('rust'));
		const linked = link(raw);
		const structural = deriveStructuralVariantChildren(linked.rules);

		const closureVariants = structural.get('closure_expression');
		expect(closureVariants).toEqual([
			polymorphVisibleName('closure_expression', 'block'),
			polymorphVisibleName('closure_expression', 'expr')
		]);
		const orPatternVariants = structural.get('or_pattern');
		expect(orPatternVariants).toEqual([
			polymorphVisibleName('or_pattern', 'binary'),
			polymorphVisibleName('or_pattern', 'prefix')
		]);
	});
});
