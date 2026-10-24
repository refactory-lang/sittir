import { describe, expect, it } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { compileGrammar } from '../../compiler/compile.ts';
import { grammarPackage } from '../../grammars.ts';
import { buildNodeModel } from '../node-model.ts';
import { valueNameOf } from '../node-model-read.ts';

describe('a hoisted group whose builder forwards to another kind\'s builder', () => {
	it('is seated on its parent as an arm mounted under the slot name, wherever the parent takes it', async () => {
		const { nodeMap, generatedIdTables } = await compileGrammar({ package: grammarPackage('regex') });
		const model = buildNodeModel(nodeMap, generatedIdTables);
		const seatsOf = (group: string): unknown[] =>
			model.nodes.flatMap((node) =>
				'slots' in node ? node.slots.flatMap((slot) => slot.values.filter((value) => valueNameOf(value) === group).map((value) => value.seat)) : []
			);
		const mounts = { count_quantifier_group: 'countQuantifierGroup', unicode_property_value_expression_group: 'unicodePropertyValueExpressionGroup' };
		for (const [group, mount] of Object.entries(mounts)) {
			expect(seatsOf(group)).not.toEqual([]);
			for (const seat of seatsOf(group)) expect(seat).toEqual({ kind: group, shape: 'arm', mount, seated: true });
		}
	}, FULL_PIPELINE_TIMEOUT);
});
