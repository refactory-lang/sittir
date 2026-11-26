import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

type List = Iterable<unknown> & { $with: { items(...items: unknown[]): { $render(): string } } };

const listOf = (root: { $query(): { $descendants: { ofType(kind: number): Iterable<unknown> } } }, kind: number): List => [...root.$query().$descendants.ofType(kind)][0] as List;

describe.each(['object', 'arena'] as const)('a list read through its element wrap (%s storage)', (nodeStorage) => {
	it('keeps the leading comment of an item it read as the wrapped member', async () => {
		using engine = await createEngine(rust, { nodeStorage });
		const list = listOf(engine.parse('struct P {\n  x: i32,\n  // c\n  y: i32,\n}'), rust.kinds.FieldDeclarationListElements);
		expect(list.$with.items(...list).$render()).toBe('x: i32,\n// c\ny: i32,');
	});

	it('keeps the leading comment of an attributed member with its attribute, wherever the member moves', async () => {
		using engine = await createEngine(rust, { nodeStorage });
		const list = listOf(engine.parse('struct P {\n  x: i32,\n  // c\n  #[b]\n  y: i32,\n}'), rust.kinds.FieldDeclarationListElements);
		const [x, y] = [...list];
		expect(list.$with.items(y, x).$render()).toBe('// c\n#[b]\ny: i32,\nx: i32,');
	});

	it.each([
		['fields', 'struct P {\n  x: i32,\n\n  y: i32,\n}', rust.kinds.FieldDeclarationListElements, 'x: i32,\n\ny: i32,'],
		['arguments', 'fn f() { g(a,\n\n  b); }', rust.kinds.ArgumentsElements, 'a,\n\nb']
	] as const)('keeps the blank line after a member of a list of %s rebuilt with its own items', async (_, source, kind, expected) => {
		using engine = await createEngine(rust, { nodeStorage });
		const list = listOf(engine.parse(source), kind);
		expect(list.$with.items(...list).$render()).toBe(expected);
	});
});
