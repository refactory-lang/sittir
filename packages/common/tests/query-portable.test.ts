import { describe, expect, it } from 'vitest';
import python from '@sittir/python';
import rust from '@sittir/rust';
import { createEngine } from '../src/create-engine.ts';
import { portable } from '../src/portable/index.ts';

type Node = { readonly $type: number; $render(): string };
type View = Iterable<Node> & {
	ofType(kind: unknown): View;
	where(condition: (slots: Record<string, { eq(text: string): unknown }>) => unknown): View;
};
type Parser = { parse(source: string): unknown };

const { kinds } = portable;
const descendants = (engine: Parser, source: string): View =>
	(engine.parse(source) as { $query(): { readonly $descendants: View } }).$query().$descendants;
const texts = (view: View): string[] => [...view].map((node) => node.$render());

describe('ofType takes a portable kind', async () => {
	const rs = await createEngine(rust);
	const py = await createEngine(python);

	it('yields the nodes of the language that read as the path', () => {
		expect([...descendants(rs, 'fn f() {} struct S;').ofType(kinds.declaration.function)].map((node) => node.$type)).toEqual([rs.kinds.FunctionItem]);
		expect([...descendants(py, 'def f(): pass\n').ofType(kinds.declaration.function)].map((node) => node.$type)).toEqual([py.kinds.FunctionDefinition]);
	});

	it('reads a path its kinds do not decide by the classifier', () => {
		const view = descendants(rs, 'use a; pub use b;');
		expect(texts(view.ofType(kinds.statement.import))).toEqual(['use a;', 'pub use b;']);
		expect(texts(view.ofType(kinds.statement.import.public))).toEqual(['pub use b;']);
	});

	it('compiles a later where for the kinds the path reads', () => {
		const view = descendants(rs, 'fn f() {} fn g() {}').ofType(kinds.declaration.function);
		expect(texts(view.where((slots) => slots.name!.eq('g')))).toEqual(['fn g() {}']);
	});

	it('yields nothing for a path the language does not read', () => {
		expect(texts(descendants(py, 'import a\n').ofType(kinds.statement.import.public))).toEqual([]);
	});

	it('yields nothing for a value whose path is not a vocabulary path', () => {
		expect(texts(descendants(rs, 'fn f() {}').ofType({ $path: 'nope' }))).toEqual([]);
	});

	it('refuses a kind name', () => {
		expect(() => descendants(rs, 'fn f() {}').ofType('function_item')).toThrow(/ofType takes a kind id/);
	});
});
