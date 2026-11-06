import { describe, expect, it } from 'vitest';
import { nodeAddressOf, treeOf } from '@sittir/common/utils';
import type { QueryPlan } from '@sittir/types';
import { requireGrammarModule } from '../../src/grammar-internals.ts';
import { createStrictNativeEngine, loadCorpusEntries } from '../../src/validate/common.ts';

interface Walked {
	readonly $type: number;
	readonly _delimiter?: number;
	readonly $query: () => { readonly $descendants: Iterable<Walked | number> };
	readonly [storage: string]: unknown;
}

describe.each(['python', 'rust', 'typescript'])('%s: the native delimiter and count leaves read what the read stamps', (grammar) => {
	it('for every corpus node whose slot stores a list', async () => {
		const engine = await createStrictNativeEngine(grammar);
		const { querySlots } = await requireGrammarModule(grammar, 'utils.ts');
		const { KIND_NAMES } = await requireGrammarModule(grammar, 'types.ts');
		const misses: string[] = [];
		let [lists, trailing] = [0, 0];
		for (const entry of loadCorpusEntries(grammar)) {
			let root: Walked;
			try {
				root = engine.parse(entry.source) as unknown as Walked;
			} catch {
				continue;
			}
			for (const node of [root, ...root.$query().$descendants]) {
				if (typeof node === 'number') continue;
				const stored = (querySlots[node.$type] ?? []).filter(([, , , storage]) => Array.isArray(node[storage]));
				if (stored.length === 0) continue;
				lists += 1;
				const holds = (plan: QueryPlan): boolean | undefined => treeOf(node)?.query?.planHolds([nodeAddressOf(node)!], plan)[0];
				const name = KIND_NAMES.get(node.$type);
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
		expect(misses).toEqual([]);
		expect(lists).toBeGreaterThan(300);
		expect(trailing).toBeGreaterThan(20);
	});
});
