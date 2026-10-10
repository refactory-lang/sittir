import { describe, expect, it } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { compileGrammar } from '../../compiler/compile.ts';
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { grammarPackage } from '../../grammars.ts';
import { buildNodeModel } from '../node-model.ts';

describe('a hoisted group whose builder forwards to another kind\'s', () => {
	it('is seated on its parent as forwarded, wherever the parent takes it', async () => {
		const { nodeMap } = await compileGrammar({ package: grammarPackage('regex'), generatedIdTables: await loadGeneratedIdTables('regex') });
		const model = buildNodeModel(nodeMap);
		const seatsOf = (group: string): unknown[] =>
			model.nodes.flatMap((node) =>
				'slots' in node ? node.slots.flatMap((slot) => slot.values.filter((value) => value.name === group).map((value) => value.seat)) : []
			);
		for (const group of ['count_quantifier_group', 'unicode_property_value_expression_group']) {
			expect(seatsOf(group)).not.toEqual([]);
			for (const seat of seatsOf(group)) expect(seat).toEqual({ kind: group, shape: 'forwarded' });
		}
	}, FULL_PIPELINE_TIMEOUT);
});
