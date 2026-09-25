import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { evaluate } from '../evaluate.ts';
import { link } from '../link.ts';
import { deriveVariantChildren } from '../variant-structural.ts';
import { polymorphVisibleName } from '../../dsl/arm-names.ts';

const __dirname = new URL('.', import.meta.url).pathname;
const resolveOverrides = (grammar: string) => resolve(__dirname, `../../../../${grammar}/grammar.sittir.ts`);

/**
 * R12/decision-7 V2 Task 2: this suite formerly asserted the WIRE metadata
 * channel (`raw.polymorphVariants`, populated by `wireRegisterPolymorphVariant`
 * during evaluate). That channel is deleted — variant-adoption pairs are now
 * discovered STRUCTURALLY from the post-link rule tree
 * (`deriveVariantChildren`, compiler/variant-structural.ts). These
 * tests are the direct successor: same real-grammar e2e coverage, asserting
 * the structural derivation's output instead of the deleted wire pairs.
 */
describe('polymorph metadata — structural e2e', () => {
	it('python: assignment polymorph variants are derived structurally', async () => {
		const raw = await evaluate(resolveOverrides('python'));
		const linked = link(raw);
		const structural = deriveVariantChildren(linked.rules);
		const assignmentVariants = structural.get('assignment');
		expect(assignmentVariants).toEqual([
			{ kind: polymorphVisibleName('assignment', 'eq'), name: 'eq', definedBy: 'override' },
			{ kind: polymorphVisibleName('assignment', 'type'), name: 'type', definedBy: 'override' },
			{ kind: polymorphVisibleName('assignment', 'typed'), name: 'typed', definedBy: 'override' }
		]);
	});

	it('rust: polymorph variants derived structurally for converted rules', async () => {
		const raw = await evaluate(resolveOverrides('rust'));
		const linked = link(raw);
		const structural = deriveVariantChildren(linked.rules);

		const closureVariants = structural.get('closure_expression');
		expect(closureVariants).toEqual([
			{ kind: polymorphVisibleName('closure_expression', 'block'), name: 'block', definedBy: 'override' },
			{ kind: polymorphVisibleName('closure_expression', 'expr'), name: 'expr', definedBy: 'override' }
		]);
		const orPatternVariants = structural.get('or_pattern');
		expect(orPatternVariants).toEqual([
			{ kind: polymorphVisibleName('or_pattern', 'binary'), name: 'binary', definedBy: 'override' },
			{ kind: polymorphVisibleName('or_pattern', 'prefix'), name: 'prefix', definedBy: 'override' }
		]);
	});
});
