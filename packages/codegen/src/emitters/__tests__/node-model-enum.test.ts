import { CHOICE, STRING } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { makeNodeMapWith, withGeneratedIdTables } from '../../__tests__/helpers/node-map-fixtures.ts';
import { compileGrammar } from '../../compiler/compile.ts';
import { AssembledEnum, type AssembledNode } from '../../compiler/model/node-map.ts';
import { grammarPackage } from '../../grammars.ts';
import { buildNodeModel } from '../node-model.ts';

describe('an enum in the node model', () => {
	it('records each member once, as its kind and text', async () => {
		const { nodeMap, generatedIdTables } = await compileGrammar({ package: grammarPackage('rust') });
		const enums = buildNodeModel(nodeMap, generatedIdTables).nodes.filter((node) => node.modelType === 'enum');
		expect(enums).not.toEqual([]);
		for (const node of enums) {
			expect(node).not.toHaveProperty('values');
			expect(node).toHaveProperty('members');
		}
	}, FULL_PIPELINE_TIMEOUT);

	it('refuses an enum value no member resolves', () => {
		const { nodeMap, generatedIdTables } = withGeneratedIdTables((kindEntries) =>
			makeNodeMapWith(
				new Map<string, AssembledNode>([
					['visibility', new AssembledEnum('visibility', { type: CHOICE, members: [{ type: STRING, value: 'pub' }, { type: STRING, value: 'crate' }] }, { kindEntries })]
				])
			)
		);
		expect(() => buildNodeModel(nodeMap, generatedIdTables)).toThrow(/visibility.*pub/);
	});
});
