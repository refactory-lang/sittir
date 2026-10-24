import { expect, it } from 'vitest';
import { compileGrammar } from '../../compiler/compile.ts';
import { grammarPackage } from '../../grammars.ts';
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { tupleSeatOf } from '../../compiler/model/sub-factories.ts';

it('seats a hidden forwarded receiver group on its config parent through the existing tuple adapter', async () => {
	const { nodeMap } = await compileGrammar({ package: grammarPackage('rust'), generatedIdTables: await loadGeneratedIdTables('rust') });
	const receiver = nodeMap.nodes.get('parameters_elements_receiver');
	if (receiver === undefined) throw new Error('missing receiver form');
	expect(tupleSeatOf(receiver, nodeMap).map(({ group }) => group.kind)).toContain('parameters_elements_receiver_group');
}, 120000);
