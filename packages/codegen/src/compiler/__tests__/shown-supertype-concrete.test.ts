import { describe, expect, it } from 'vitest';
import { compileGrammar } from '../compile.ts';
import { loadPackageIdTables } from '../generated-metadata.ts';
import { AssembledSupertype } from '../model/node-map.ts';
import { grammarPackage } from '../../grammars.ts';

describe('a declared supertype the parser shows as a visible node', () => {
	it('stays a concrete kind', async () => {
		const pkg = grammarPackage('python');
		const { nodeMap } = await compileGrammar({ package: pkg, generatedIdTables: await loadPackageIdTables(pkg) });
		const matchBlock = nodeMap.nodes.get('match_block');
		expect(matchBlock).toBeDefined();
		expect(matchBlock).not.toBeInstanceOf(AssembledSupertype);
		expect(nodeMap.nodes.get('_suite') ?? nodeMap.nodes.get('suite')).toBeInstanceOf(AssembledSupertype);
	}, 180_000);
});
