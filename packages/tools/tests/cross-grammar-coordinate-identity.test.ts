// Every grammar's addon is its own linked image, so tree ids must come from
// the one owner every addon shares — the JavaScript process — or a rust
// engine and a typescript engine would both mint tree 0 and a coordinate
// read by one could slice the other's unrelated tree. A node read by one
// grammar's engine is refused by another grammar's, naming both languages.
import { describe, expect, it } from 'vitest';
import type { AnyNodeData } from '@sittir/types';
import { createEngine } from '@sittir/common';
import { languageByName } from '../src/languages.ts';

describe('a coordinate names its tree across grammars', () => {
	it('is refused by an engine of another grammar, naming both, instead of resolved against its own tree', async () => {
		const typescript = await createEngine(await languageByName('typescript'));
		typescript.parse('let decoy = 1;\n');
		const rust = await createEngine(await languageByName('rust'));
		const item = (rust.parse('fn real() {}\n') as unknown as { statements(): AnyNodeData[] }).statements()[0]!;
		// @ts-expect-error a rust node is not a typescript node; the engine refuses it at runtime as well
		expect(() => typescript.render(item).toString()).toThrow('cannot render a rust node through a typescript engine');
	});

	it('mints distinct ids for trees parsed by engines of different grammars', async () => {
		const treeIdOf = async (grammar: string, source: string): Promise<number> => {
			const native = (await (await languageByName(grammar)).load()).createNative();
			return Math.floor((native.parseAndRead(source).root as { $handle: number }).$handle / 2 ** 32);
		};
		const a = await treeIdOf('rust', 'fn a() {}\n');
		const b = await treeIdOf('typescript', 'let b = 1;\n');
		expect(a).not.toBe(b);
	});
});
