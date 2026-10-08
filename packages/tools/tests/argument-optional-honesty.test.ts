import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { isNode } from '@sittir/common/utils';
import { allGrammars } from '@sittir/codegen/grammars';
import { compileNodeMap, load } from '../src/codegen-surface.ts';
import { requireGrammarModule } from '../src/grammar-internals.ts';
import { languageByName } from '../src/languages.ts';

const unbuildable = async (grammar: string): Promise<{ covered: number; failures: string[] }> => {
	const { AbstractAssembledCompound } = await load('modelNodeMap');
	const nodeMap = await compileNodeMap(grammar);
	const raw = await requireGrammarModule(grammar, 'factories/raw.ts');
	const engine = await createEngine(await languageByName(grammar));
	let covered = 0;
	const failures: string[] = [];
	for (const node of nodeMap.nodes.values()) {
		if (
			node.rawFactoryName === undefined ||
			!(node instanceof AbstractAssembledCompound) ||
			node.configSlots.length === 0
		)
			continue;
		if (!node.argumentOptional(nodeMap)) continue;
		const build = raw[node.rawFactoryName];
		covered++;
		if (typeof build !== 'function') {
			failures.push(`${node.kind}: raw.ts does not export ${node.rawFactoryName}`);
			continue;
		}
		try {
			const built: unknown = build();
			if (!isNode(built)) throw new Error(`Invalid raw factory node for ${node.kind}`);
			const text = engine.render(built).toString();
			if (engine.render(engine.parse(text)).toString() !== text)
				failures.push(`${node.kind}: ${JSON.stringify(text)} does not round-trip`);
		} catch (error) {
			failures.push(`${node.kind}: ${(error as Error).message.slice(0, 100)}`);
		}
	}
	return { covered, failures };
};

describe.each(allGrammars())(
	'%s: a kind that can be built with no argument builds, renders and re-parses',
	(grammar) => {
		it('every argument-optional kind with slots', async () => {
			const result = await unbuildable(grammar);
			expect(result.covered).toBeGreaterThan(0);
			expect(result.failures).toEqual([]);
		}, 240000);
	}
);
