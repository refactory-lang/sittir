import { describe, expect, it } from 'vitest';
import { compileGrammar } from '../../compile.ts';
import { grammarPackage } from '../../../grammars.ts';
import { mountCallOf, subFactoriesOf } from '../sub-factories.ts';
import type { NodeMap } from '../../types.ts';

const COMPILE_TIMEOUT = 120_000;

async function nodeMapOf(grammar: string): Promise<NodeMap> {
	return (await compileGrammar({ package: grammarPackage(grammar) })).nodeMap;
}

function routeOf(nodeMap: NodeMap, parent: string, name: string) {
	const entry = subFactoriesOf(nodeMap.nodes.get(parent)!, nodeMap).entries.find((e) => e.name === name);
	if (entry === undefined) throw new Error(`no route '${parent}.${name}'`);
	return entry;
}

describe('a route takes the parent keys that can be present beside its arm', () => {
	it('drops the keys that sit only in other members of the parent choice', async () => {
		const typescript = await nodeMapOf('typescript');
		const entry = routeOf(typescript, 'binary_expression', 'in');
		expect(entry.residual.map((slot) => slot.name)).toEqual([]);
		expect(mountCallOf(entry, typescript)).toBe('child');
	}, COMPILE_TIMEOUT);

	it('keeps the keys that share a seq with the arm', async () => {
		const python = await nodeMapOf('python');
		const entry = routeOf(python, 'keyword_pattern', 'dottedName');
		expect(entry.residual.map((slot) => slot.name)).toEqual(['name']);
		expect(entry.merges).toBe(false);
	}, COMPILE_TIMEOUT);
});
