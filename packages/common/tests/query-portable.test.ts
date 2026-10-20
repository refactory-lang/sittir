import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import python from '@sittir/python';
import rust from '@sittir/rust';
import typescript from '@sittir/typescript';
import { createEngine } from '../src/create-engine.ts';
import { portable } from '../src/portable/index.ts';

type Node = { readonly $type: number; readonly $_layout: { readonly at: { readonly $span: { readonly start: number; readonly end: number } } }; $render(): string };
type Item = Node | number;
type View = Iterable<Item> & {
	ofType(kind: unknown): View;
	filter(predicate: (item: Item) => unknown): View;
	map(fn: (item: Item) => unknown): View;
	where(condition: (slots: Record<string, { eq(text: string): unknown }>) => unknown): View;
};
type Parser = { parse(source: string): unknown };
type Guard = (value: unknown) => boolean;

const { kinds } = portable;
const descendants = (engine: Parser, source: string): View =>
	(engine.parse(source) as { $query(): { readonly $descendants: View } }).$query().$descendants;
const kindOf = (item: Item): number => (typeof item === 'number' ? item : item.$type);
const texts = (view: View): string[] => [...view].map((item) => (typeof item === 'number' ? `#${item}` : item.$render()));
const keyOf = (item: Item): string => (typeof item === 'number' ? `#${item}` : `${item.$type}@${item.$_layout.at.$span.start}-${item.$_layout.at.$span.end}`);
const kindAt = (path: string): unknown => path.split('.').reduce<unknown>((at, segment) => (at as Record<string, unknown>)[segment], kinds);
const source = (path: string): string => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

describe('ofType takes a portable kind', async () => {
	const rs = await createEngine(rust);
	const py = await createEngine(python);

	it('yields the nodes of the language that read as the path', () => {
		expect([...descendants(rs, 'fn f() {} struct S;').ofType(kinds.declaration.function)].map(kindOf)).toEqual([rs.kinds.FunctionItem]);
		expect([...descendants(py, 'def f(): pass\n').ofType(kinds.declaration.function)].map(kindOf)).toEqual([py.kinds.FunctionDefinition]);
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

describe('ofType selects an element by the kind it reads as', async () => {
	const rs = await createEngine(rust);
	const SOURCE = 'const X: bool = true; fn f(x: u8) -> bool { false }';
	const constType = (): View => {
		const item = [...descendants(rs, SOURCE).ofType(rs.kinds.ConstItem)][0] as unknown as { $query(): { readonly type: View } };
		return item.$query().type;
	};

	it('selects a keyword leaf of a walk by its keyword id', () => {
		expect([...descendants(rs, SOURCE).ofType(rs.kinds.TrueKeyword)]).toEqual([rs.kinds.TrueKeyword]);
		expect([...descendants(rs, SOURCE).ofType(kinds.literal.boolean)]).toEqual([rs.kinds.TrueKeyword, rs.kinds.FalseKeyword]);
	});

	it('selects a keyword leaf a slot holds', () => {
		expect([...constType()]).toEqual([rs.kinds.BoolKeyword]);
		expect([...constType().ofType(rs.kinds.BoolKeyword)]).toEqual([rs.kinds.BoolKeyword]);
		expect([...constType().ofType(kinds.type.primitive.boolean)]).toEqual([rs.kinds.BoolKeyword]);
	});

	it('selects an enum kind or a supertype by its members, as the guards hold for them', () => {
		const ids = (kind: number) => [...descendants(rs, SOURCE).ofType(kind)].map(kindOf);
		expect(ids(rs.kinds.BooleanLiteral)).toEqual([rs.kinds.TrueKeyword, rs.kinds.FalseKeyword]);
		expect(ids(rs.kinds.Literal)).toEqual([rs.kinds.TrueKeyword, rs.kinds.FalseKeyword]);
		expect(ids(rs.kinds.Expression)).toEqual(expect.arrayContaining([rs.kinds.TrueKeyword, rs.kinds.FalseKeyword]));
		expect(ids(rs.kinds.Type).filter((kind) => kind === rs.kinds.BoolKeyword)).toEqual([rs.kinds.BoolKeyword, rs.kinds.BoolKeyword]);
		const is = rust.is as unknown as Record<string, Guard>;
		expect([is.booleanLiteral!(rs.kinds.TrueKeyword), is.literal!(rs.kinds.TrueKeyword), is.expression!(rs.kinds.TrueKeyword), is.type!(rs.kinds.BoolKeyword)]).toEqual([true, true, true, true]);
	});

	it('selects a keyword leaf after an opaque step', () => {
		const late = () => descendants(rs, SOURCE).filter(() => true);
		expect([...late().ofType(rs.kinds.TrueKeyword)]).toEqual([rs.kinds.TrueKeyword]);
		expect([...late().ofType(kinds.literal.boolean)]).toEqual([rs.kinds.TrueKeyword, rs.kinds.FalseKeyword]);
	});
});

describe('ofType holds only for an element of the view\'s language, as the guards do', async () => {
	const rs = await createEngine(rust);
	const py = await createEngine(python);
	const foreign = [...descendants(py, source('docs/superpowers/probes/2026-10-13-node-flags/census.py'))].find((item) => kindOf(item) === rs.kinds.FunctionItem);
	const mapped = (): View => descendants(rs, 'fn f() {}').map(() => foreign);

	it('rejects a node of another language whose kind id the view\'s kind would accept', () => {
		expect(foreign).toBeTypeOf('object');
		const is = rust.is as unknown as Record<string, Guard> & { portable: { declaration: { function: Guard } } };
		expect([is.functionItem!(foreign), is.portable.declaration.function(foreign)]).toEqual([false, false]);
		expect([...mapped().ofType(rs.kinds.FunctionItem)]).toEqual([]);
		expect([...mapped().ofType(kinds.declaration.function)]).toEqual([]);
	});
});

describe('ofType keeps exactly what the language guard holds for', () => {
	const CORPUS = [
		['rust', rust, 'rust/crates/sittir-core/src/types.rs'],
		['python', python, 'docs/superpowers/probes/2026-10-13-node-flags/census.py'],
		['typescript', typescript, 'packages/common/src/portable/classify.ts']
	] as const;

	it.each(CORPUS)('%s: every path the language reads, over every descendant', async (_, language, file) => {
		const engine = await createEngine(language as typeof rust);
		const rows = (language as unknown as { hooks?: unknown }) && (await import(`../../${_}/src/portable.ts`)).rows as { table: { paths: Record<string, unknown> } };
		const guards = (language as unknown as { is: { portable: unknown } }).is.portable;
		const guardAt = (path: string): Guard => path.split('.').reduce<unknown>((at, segment) => (at as Record<string, unknown>)[segment], guards) as Guard;
		const text = source(file);
		const all = [...descendants(engine, text)];
		const disagreements: string[] = [];
		for (const path of Object.keys(rows.table.paths)) {
			const selected = [...descendants(engine, text).ofType(kindAt(path))].map(keyOf);
			const held = all.filter(guardAt(path)).map(keyOf);
			if (JSON.stringify(selected) !== JSON.stringify(held)) disagreements.push(`${path}: ofType ${selected.length}, guard ${held.length}`);
		}
		expect(disagreements).toEqual([]);
	});

	it.each(CORPUS)('%s: every kind id, over every descendant', async (name, language, file) => {
		const engine = await createEngine(language as typeof rust);
		const { membership } = (await import(`../../${name}/src/api.ts`)).hooks as { membership: { isMember(kind: number, type: number): boolean } };
		const text = source(file);
		const all = [...descendants(engine, text)];
		const disagreements: string[] = [];
		for (const kind of Object.values(engine.kinds as Record<string, unknown>).filter((value): value is number => typeof value === 'number')) {
			const selected = [...descendants(engine, text).ofType(kind)].map(keyOf);
			const held = all.filter((item) => membership.isMember(kind, kindOf(item))).map(keyOf);
			if (JSON.stringify(selected) !== JSON.stringify(held)) disagreements.push(`${engine.trivia.kindName(kind)}: ofType ${selected.length}, guard ${held.length}`);
		}
		expect(disagreements).toEqual([]);
	});
});
