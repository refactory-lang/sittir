import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createEngine } from '@sittir/common';
import { allGrammars } from '@sittir/codegen/grammars';
import { AbstractAssembledCompound } from '../../codegen/src/compiler/model/node-map.ts';
import { buildNodeMap } from '../src/codegen-surface.ts';

const root = resolve(import.meta.dirname, '../../..');

const unbuildable = async (grammar: string): Promise<{ covered: number; failures: string[] }> => {
	const nodeMap = await buildNodeMap(grammar);
	const raw = (await import(pathToFileURL(resolve(root, `packages/${grammar}/src/factories/raw.ts`)).href)) as Record<string, () => unknown>;
	const language = (await import(pathToFileURL(resolve(root, `packages/${grammar}/src/index.ts`)).href)).default;
	const engine = (await createEngine(language)) as unknown as { parse(text: string): unknown; render(node: unknown): { toString(): string } };
	let covered = 0;
	const failures: string[] = [];
	for (const node of nodeMap.nodes.values()) {
		if (node.rawFactoryName === undefined || !(node instanceof AbstractAssembledCompound) || node.configSlots.length === 0) continue;
		if (!node.argumentOptional(nodeMap)) continue;
		const build = raw[node.rawFactoryName];
		if (build === undefined) continue;
		covered++;
		try {
			const text = engine.render(build()).toString();
			if (engine.render(engine.parse(text)).toString() !== text) failures.push(`${node.kind}: ${JSON.stringify(text)} does not round-trip`);
		} catch (error) {
			failures.push(`${node.kind}: ${(error as Error).message.slice(0, 100)}`);
		}
	}
	return { covered, failures };
};

describe.each(allGrammars())('%s: a kind that can be built with no argument builds, renders and re-parses', (grammar) => {
	it('every argument-optional kind with slots', async () => {
		const result = await unbuildable(grammar);
		expect(result.covered).toBeGreaterThan(0);
		expect(result.failures).toEqual([]);
	}, 240000);
});
