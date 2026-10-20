import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { nodeText, treeOf } from '@sittir/common/utils';
import { getActiveBackend } from '../src/backend.js';
import rust from '../src/index.ts';

function addon() {
	const status = getActiveBackend();
	if (status.name !== 'native') throw new Error(`native backend unavailable: ${status.reason}`);
	return status.native;
}

describe('an arena view whose tree was released', () => {
	it('is refused, naming the tree, wherever its read reaches the tree', async () => {
		const rs = await createEngine(rust, { nodeStorage: 'arena' });
		const root = rs.parse('fn f(a: u8) -> u8 { a + 1 }\nfn g() {}\n');
		const statements = root.statements();
		const [f, g] = [statements[0]!, statements[1]!];
		if (!rs.is.functionItem(f) || !rs.is.functionItem(g)) throw new Error('not two function items');
		const name = f.name();
		const id = treeOf(root)?.id;
		if (id === undefined) throw new Error('a parsed tree has an id');
		addon().disposeTree(id);
		const released = new RegExp(`tree ${id} is not live`);
		expect(() => nodeText(name)).toThrow(released);
		expect(() => f.parameters()).toThrow(released);
		expect(() => g.name()).toThrow(released);
		expect(() => rs.render(f).toString()).toThrow(released);
		rs.dispose();
	});
});
