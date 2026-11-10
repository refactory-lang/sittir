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

	it('deletes every held tree when one delete throws, and throws what failed', async () => {
		using parser = treeParser(await languageAt(wasm));
		const failing = (tree: ParsedTree, error: Error): ParsedTree => ({
			root: tree.root,
			[Symbol.dispose]: vi.fn(() => {
				tree[Symbol.dispose]();
				throw error;
			})
		});
		const one = new Error('first delete failed');
		const other = new Error('third delete failed');
		const first = failing(parser.parse('fn a() {}'), one);
		const tree = parser.parse('fn b() {}');
		const second: ParsedTree = { root: tree.root, [Symbol.dispose]: vi.fn(() => tree[Symbol.dispose]()) };
		const third = failing(parser.parse('fn c() {}'), other);
		const held = heldTrees();
		for (const each of [first, second, third]) held.hold(each);
		let thrown: unknown;
		try {
			held[Symbol.dispose]();
		} catch (error) {
			thrown = error;
		}
		for (const each of [first, second, third]) expect(each[Symbol.dispose]).toHaveBeenCalledTimes(1);
		expect(thrown).toBeInstanceOf(AggregateError);
		expect((thrown as AggregateError).errors).toEqual([one, other]);
	});

	it('throws a lone failed delete as it was thrown', async () => {
		using parser = treeParser(await languageAt(wasm));
		const tree = parser.parse('fn a() {}');
		const error = new Error('delete failed');
		const held = heldTrees();
		held.hold({
			root: tree.root,
			[Symbol.dispose]: () => {
				tree[Symbol.dispose]();
				throw error;
			}
		});
		expect(() => held[Symbol.dispose]()).toThrow(error);
	});
});
