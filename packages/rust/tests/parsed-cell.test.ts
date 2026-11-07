import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { treeOf } from '../../common/src/tree-token.ts';
import type { RecordHandle } from '../../common/src/handle.ts';
import rust from '../src/index.ts';

const engine = await createEngine(rust, { nodeStorage: 'arena' });
const SOURCE = 'fn a() {}\nfn b() { let x = 1; }\n';

function countingCells(root: object): number[] {
	const records = treeOf(root)?.records;
	if (records === undefined) throw new Error('expected a tree read as records');
	const native = records.cell.bind(records);
	const holders: number[] = [];
	records.cell = (holder, word, item, depth) => (holders.push(holder), native(holder, word, item, depth));
	return holders;
}

function second(root: ReturnType<typeof engine.parse>) {
	const item = root.statements()[1];
	if (item === undefined || !engine.is.functionItem(item)) throw new Error('expected a function');
	return item;
}

describe('a parsed cell names its record once a read writes it', () => {
	it('reads the same node before and after the rewrite, and the read after it makes no native call', () => {
		const root = engine.parse(SOURCE, { depth: 1 });
		const holders = countingCells(root);
		const first = second(root);
		expect(holders.length).toBeGreaterThan(0);
		holders.length = 0;
		(root as unknown as RecordHandle).$cache = undefined;
		const again = second(root);
		expect(again).toBe(first);
		expect((again as unknown as RecordHandle).$at).toBe((first as unknown as RecordHandle).$at);
		expect(holders).toEqual([]);
	});

	it('a deeper read writes the children with their addresses, so reading them makes no native call', () => {
		const root = engine.parse(SOURCE, { depth: Infinity });
		const holders = countingCells(root);
		const statement = second(root).body().statements()[0];
		expect(statement === undefined ? undefined : engine.is.letDeclaration(statement)).toBe(true);
		expect(holders).toEqual([]);
	});

	it('a query hit writes its ancestors once, so the accessors that reach it read addresses', () => {
		const root = engine.parse(SOURCE, { depth: 1 });
		const hit = Array.from(root.$query().$descendants.ofType(engine.kinds.LetDeclaration))[0];
		const holders = countingCells(root);
		const fn = second(root);
		holders.length = 0;
		expect(fn.body().statements()[0]).toBe(hit);
		expect(holders).toEqual([]);
	});

	it('a $with copies a child cell in either form', () => {
		const renamed = (root: ReturnType<typeof engine.parse>) => second(root).$with.name(engine.build.identifier('c')).$render();
		const expected = 'fn c() { let x = 1; }';
		const unread = engine.parse(SOURCE, { depth: 1 });
		expect(renamed(unread)).toBe(expected);
		const read = engine.parse(SOURCE, { depth: 1 });
		second(read).body();
		expect(renamed(read)).toBe(expected);
	});
});
