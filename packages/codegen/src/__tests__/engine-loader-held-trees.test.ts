import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { heldTrees, languageAt, treeParser, type ParsedTree } from '../engine-loader.ts';

const wasm = fileURLToPath(new URL('../../../rust/.sittir/parser.wasm', import.meta.url));

describe('heldTrees', () => {
	it('hands back each held tree root and deletes every held tree when it is disposed', async () => {
		using parser = treeParser(await languageAt(wasm));
		const disposed: ParsedTree[] = [];
		const track = (tree: ParsedTree): ParsedTree => {
			const dispose = tree[Symbol.dispose];
			return { root: tree.root, [Symbol.dispose]: vi.fn(() => (disposed.push(tree), dispose())) };
		};
		const first = track(parser.parse('fn a() {}'));
		const second = track(parser.parse('fn b() {}'));
		{
			using held = heldTrees();
			expect(held.hold(first).type).toBe('source_file');
			expect(held.hold(second).text).toBe('fn b() {}');
			expect(disposed).toEqual([]);
		}
		expect(first[Symbol.dispose]).toHaveBeenCalledTimes(1);
		expect(second[Symbol.dispose]).toHaveBeenCalledTimes(1);
	});
});
