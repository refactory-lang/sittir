import { describe, expect, it } from 'vitest';
import { compileGrammar } from '../../compile.ts';
import { grammarPackage } from '../../../grammars.ts';
import { leadEffectsOf } from '../../../dsl/verbs/effects.ts';
import { accessorClassClashes } from '../accessor-classes.ts';

const COMPILE_TIMEOUT = 120_000;

describe('accessor value classes', () => {
	it.each([
		['rust', 'parameters_elements_receiver', ['elements', 'parameters']],
		['typescript', 'formal_parameters_elements_receiver', ['elements']]
	])(
		'%s: a name holds a single beside a list only when the single side is a container, a receiver form by its lead',
		async (grammar, receiver, unledClashes) => {
			const { nodeMap, raw } = await compileGrammar({ package: grammarPackage(grammar) });
			const leads = leadEffectsOf(raw.bindingEffects);

			expect(leads.map((lead) => lead.receiver)).toEqual([receiver]);
			expect(accessorClassClashes(nodeMap, leads)).toEqual([]);
			expect(accessorClassClashes(nodeMap).map((clash) => clash.name).sort()).toEqual(unledClashes);
		},
		COMPILE_TIMEOUT
	);
});
