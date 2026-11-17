import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

type List = Iterable<unknown> & { $with: { items(...items: unknown[]): { $render(): string } } };

describe.each(['object', 'arena'] as const)('a rebuilt list writes one blank line before an item the source set apart (%s storage)', (nodeStorage) => {
	it('when the list is rebuilt with its own items, one read through its element wrap', async () => {
		using engine = await createEngine(rust, { nodeStorage });
		const root = engine.parse('struct P {\n  x: i32,\n\n  #[b]\n  y: i32,\n}');
		const [list] = root.$query().$descendants.ofType(rust.kinds.FieldDeclarationListElements) as Iterable<List>;
		expect(list!.$with.items(...list!).$render()).toBe('x: i32,\n\n#[b]\ny: i32,');
	});

	it('and none once the item moves first', async () => {
		using engine = await createEngine(rust, { nodeStorage });
		const root = engine.parse('fn f() {\n    a();\n\n    b();\n}\n') as any;
		const [fn] = root.statements();
		const block = fn.body();
		const statements = block.statements();
		expect(root.$with.statements(fn.$with.body(block.$with.statements(statements[1], statements[0]))).$render()).toBe('fn f() {\n    b();\n    a();\n}\n');
	});
});
