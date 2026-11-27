import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const addon = createRequire(import.meta.url)('../native/index.cjs') as { treeMemory(): { counted: number } };

const SOURCE = 'fn f() {\n    let a = 1;\n}\n';

type Memory = { built: number | undefined; tree: number };

describe.each(['object', 'arena'] as const)('a side a read node is written again and again holds only the last write (%s storage)', (nodeStorage) => {
	it.each([1000, 5000])('holds as much after %i writes to one side as after half as many', async (writes) => {
		using rs: any = await createEngine(rust, { nodeStorage });
		const root = rs.parse(SOURCE);
		const node = root.$query().$descendants.ofType(rust.kinds.LetDeclaration).at(0);
		const write = (n: number) => {
			using comment = rs.build.lineComment(` w${n}`);
			node.$trivia.leading(comment);
		};
		const memory = (): Memory => ({ built: rs.diagnostics.builtMemory?.()?.live, tree: addon.treeMemory().counted });
		for (let n = 1; n <= writes / 2; n++) write(n);
		const half = memory();
		for (let n = writes / 2 + 1; n <= writes; n++) write(n);
		const full = memory();
		expect(full.built).toBe(half.built);
		expect(full.tree - half.tree).toBeLessThan(writes / 100);
		expect(String(root.$render())).toBe(`fn f() {\n    // w${writes}\n    let a = 1;\n}\n`);
	});
});
