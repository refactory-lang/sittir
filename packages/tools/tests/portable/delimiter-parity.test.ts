import { afterAll, describe, expect, it, vi } from 'vitest';
import { nodeAddressOf, treeOf } from '@sittir/common/utils';
import type { QueryPlan } from '@sittir/types';
import { requireGrammarModule } from '../../src/grammar-internals.ts';
import { createEngine } from '@sittir/common';
import { languageByName } from '../../src/languages.ts';
import { loadCorpusEntries } from '../../src/validate/common.ts';
import { releaseTrackedEngines } from '../helpers/track-engines.ts';

vi.mock('@sittir/common', async (importOriginal) => (await import('../helpers/track-engines.ts')).trackingEngines(await importOriginal<typeof import('@sittir/common')>()));
afterAll(releaseTrackedEngines);

interface Walked {
	readonly $type: number;
	readonly _delimiter?: number;
	readonly $query: () => { readonly $descendants: Iterable<Walked | number> };
	readonly [storage: string]: unknown;
}

const nodesOf = (root: Walked): readonly Walked[] => [root, ...root.$query().$descendants].filter((node): node is Walked => typeof node !== 'number');

const holdsOn = (node: Walked, plan: QueryPlan): boolean | undefined => {
	const { $tree } = node as unknown as { $tree?: { query?: { planHolds(addresses: unknown[], plan: QueryPlan): readonly boolean[] } } };
	return (treeOf(node) ?? $tree)?.query?.planHolds([nodeAddressOf(node)!], plan)[0];
};

const CASES = ['python', 'rust', 'typescript'].flatMap((grammar) => (['object', 'arena'] as const).map((nodeStorage) => [grammar, nodeStorage] as const));

describe.each(CASES)('%s, %s storage: the native delimiter and count leaves read what the read stamps', (grammar, nodeStorage) => {
	it('for every corpus node whose slot stores a list', async () => {
		const engine = await createEngine(await languageByName(grammar), { api: 'strict', nodeStorage });
		const { querySlots } = await requireGrammarModule(grammar, 'utils.ts');
		const { KIND_NAMES } = await requireGrammarModule(grammar, 'types.ts');
		const reference = nodeStorage === 'arena' ? await createEngine(await languageByName(grammar), { api: 'strict', nodeStorage: 'object' }) : undefined;
		const misses: string[] = [];
		let [lists, trailing] = [0, 0];
		for (const entry of loadCorpusEntries(grammar)) {
			let root: Walked;
			try {
				root = engine.parse(entry.source) as unknown as Walked;
			} catch {
				continue;
			}
			if (reference !== undefined) {
				const objects = nodesOf(reference.parse(entry.source) as unknown as Walked);
				const records = nodesOf(root);
				if (objects.length !== records.length) misses.push(`${entry.name}: ${records.length} nodes against ${objects.length}`);
				objects.forEach((object, at) => {
					const stamp = object._delimiter;
					if (stamp === undefined) return;
					lists += 1;
					if ((stamp & 2) !== 0) trailing += 1;
					for (const delimiter of [1, 2]) {
						const plan: QueryPlan = { op: 'delimiter', delimiter };
						if (holdsOn(records[at]!, plan) !== holdsOn(object, plan)) misses.push(`${KIND_NAMES.get(object.$type)} delimiter ${delimiter} against ${stamp}`);
					}
				});
				continue;
			}
			for (const node of nodesOf(root)) {
				const holds = (plan: QueryPlan): boolean | undefined => holdsOn(node, plan);
				const name = KIND_NAMES.get(node.$type);
				const stored = (querySlots[node.$type] ?? []).filter(([, , , storage]) => Array.isArray(node[storage]));
				if (stored.length === 0) continue;
				lists += 1;
				const stamp = node._delimiter ?? 0;
				if ((stamp & 2) !== 0) trailing += 1;
				for (const delimiter of [1, 2]) if (holds({ op: 'delimiter', delimiter }) !== ((stamp & delimiter) !== 0)) misses.push(`${name} delimiter ${delimiter} against ${stamp}`);
				for (const [accessor, slot, , storage] of stored) {
					const values = (node[storage] as readonly unknown[]).filter((item) => item !== null).length;
					const slots = { [node.$type]: slot };
					if (holds({ op: 'count', min: values, slots }) !== true || holds({ op: 'count', min: values + 1, slots }) !== false) misses.push(`${name}.${accessor} count ${values}`);
				}
			}
		}
		expect(misses, misses.slice(0, 8).join('\n')).toEqual([]);
		expect(lists).toBeGreaterThan(nodeStorage === 'arena' ? 200 : 300);
		expect(trailing).toBeGreaterThan(20);
	});
});
