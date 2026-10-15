import { CHOICE, STRING } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { compileGrammar } from '../../compiler/compile.ts';
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { AssembledEnum, type AssembledNode } from '../../compiler/model/node-map.ts';
import { grammarPackage } from '../../grammars.ts';
import { buildNodeModel } from '../node-model.ts';

describe('an enum in the node model', () => {
	it('records each member once, as its kind and text', async () => {
		const { nodeMap } = await compileGrammar({ package: grammarPackage('rust'), generatedIdTables: await loadGeneratedIdTables('rust') });
		const enums = buildNodeModel(nodeMap).nodes.filter((node) => node.modelType === 'enum');
		expect(enums).not.toEqual([]);
		for (const node of enums) {
			expect(node).not.toHaveProperty('values');
			expect(node).toHaveProperty('members');
		}
	}, FULL_PIPELINE_TIMEOUT);

	it('refuses an enum value no member resolves', () => {
		const nodes = new Map<string, AssembledNode>([
			['visibility', new AssembledEnum('visibility', { type: CHOICE, members: [{ type: STRING, value: 'pub' }, { type: STRING, value: 'crate' }] })]
		]);
		expect(() => buildNodeModel(makeNodeMapWith(nodes))).toThrow(/visibility.*pub/);
	});
});
