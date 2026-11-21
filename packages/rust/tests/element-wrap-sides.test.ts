import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

type List = Iterable<unknown> & { $with: { items(...items: unknown[]): { $render(): string } } };

describe.each(['object', 'arena'] as const)('a list read through its element wrap (%s storage)', (nodeStorage) => {
	it.fails('keeps the leading comment of an item it read as the wrapped member', async () => {
		using engine = await createEngine(rust, { nodeStorage });
		const root = engine.parse('struct P {\n  x: i32,\n  // c\n  y: i32,\n}');
		const [list] = root.$query().$descendants.ofType(rust.kinds.FieldDeclarationListElements) as Iterable<List>;
		expect(list!.$with.items(...list!).$render()).toBe('x: i32,\n// c\ny: i32,');
	});
});
