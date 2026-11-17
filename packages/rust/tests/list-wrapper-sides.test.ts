import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

describe.each(['arena', 'object'] as const)('a list rebuilt from its own items keeps the item wrappers, %s storage', (nodeStorage) => {
	it('keeps the comment between struct fields', async () => {
		using e = await createEngine(rust, { nodeStorage });
		const root = e.parse('struct P {\n  x: i32,\n  // c\n  y: i32,\n}\n');
		const item = root.statements()[0]!;
		if (!e.is.structItemBrace(item)) throw new Error('expected a struct');
		const rebuilt = item.$with.body(...item.body());
		expect(String(e.render(rebuilt))).toContain('// c');
	});
});
