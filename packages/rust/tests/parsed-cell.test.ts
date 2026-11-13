import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const engine = await createEngine(rust, { nodeStorage: 'arena' });
const SOURCE = 'fn a() {}\nfn b() { let x = 1; }\n';

function second(root: ReturnType<typeof engine.parse>) {
	const item = root.statements()[1];
	if (item === undefined || !engine.is.functionItem(item)) throw new Error('expected a function');
	return item;
}

describe('a parsed child cell', () => {
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
