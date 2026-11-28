import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { isErrorNode } from '@sittir/common/utils';
import { builtRefOf, leafSitesOf } from '../../common/src/built-ref.ts';
import { unitSidesOf } from '../../common/src/node-data.ts';
import rust from '../src/index.ts';

const addon = createRequire(import.meta.url)('../native/index.cjs') as Record<string, unknown>;
let calls = 0;
for (const [name, value] of Object.entries(addon)) {
	if (typeof value !== 'function' || name === 'SittirEngine' || /^[A-Z]/.test(name)) continue;
	addon[name] = function (this: unknown, ...args: unknown[]) {
		calls++;
		return (value as (...args: unknown[]) => unknown).apply(this, args);
	};
}

/** `read`'s value and the native calls a second run of it makes. The first run views, once, each chunk a native write left a row in. */
function crossings<T>(read: () => T): { readonly value: T; readonly calls: number } {
	const first = read();
	const before = calls;
	const value = read();
	expect(value).toEqual(first);
	return { value, calls: calls - before };
}

const shape = (entries: readonly unknown[]): unknown[] => entries.map((entry) => (typeof entry === 'number' ? entry : String((entry as { $render(): unknown }).$render())));

describe("a built record's side is read from its record in the arena, with no native call", () => {
	it('reads a written leading side back: its gap codes, then its row', async () => {
		using rs: any = await createEngine(rust, { nodeStorage: 'arena' });
		const statement = rs.build.expressionStatement(rs.build.identifier('a')).$trivia.leading(rs.build.layout.blankline, '// c', rs.build.layout.newline);
		const read = crossings(() => statement.$trivia.leading());
		expect(shape(read.value)).toEqual([rs.kinds.Blankline, '// c\n', rs.kinds.Newline]);
		expect(read.calls).toBe(0);
	});

	it('reads a side its codes hold whole, and a side no write gave it as empty', async () => {
		using rs: any = await createEngine(rust, { nodeStorage: 'arena' });
		const statement = rs.build.expressionStatement(rs.build.identifier('a')).$trivia.trailing(rs.build.layout.space);
		const read = crossings(() => [statement.$trivia.trailing(), statement.$trivia.leading()]);
		expect(read.value.map(shape)).toEqual([[rs.kinds.Space], []]);
		expect(read.calls).toBe(0);
	});

	it('reads each gap kind back from the header code a write keeps it in', async () => {
		using rs: any = await createEngine(rust, { nodeStorage: 'arena' });
		const gaps = ['tight', 'space', 'tab', 'newline', 'blankline', 'doubleBlankline'] as const;
		const kinds = [rs.kinds.Tight, rs.kinds.Space, rs.kinds.Tab, rs.kinds.Newline, rs.kinds.Blankline, rs.kinds.DoubleBlankline];
		const statements = gaps.map((gap) => rs.build.expressionStatement(rs.build.identifier('a')).$trivia.leading(rs.build.layout[gap]).$trivia.trailing(rs.build.layout[gap]));
		const read = crossings(() => statements.map((statement) => [...statement.$trivia.leading(), ...statement.$trivia.trailing()]));
		expect(read.value).toEqual(kinds.map((kind) => [kind, kind]));
		expect(read.calls).toBe(0);
	});

	it('reads a comment and a layout member written to an inner side', async () => {
		using rs: any = await createEngine(rust, { nodeStorage: 'arena' });
		const block = rs.build.block().$trivia.inner('/* c */', rs.build.layout.newline);
		const read = crossings(() => block.$trivia.inner());
		expect(shape(read.value)).toEqual(['/* c */', rs.kinds.Newline]);
		expect(read.calls).toBe(0);
	});

	it('reads an ERROR a read placed, written to a side before any build opened a string chunk, as its source text', async () => {
		using rs: any = await createEngine(rust, { nodeStorage: 'arena' });
		const read = rs.parse('fn f() { § }\n');
		const error = read.$query().$descendants.ofType(rust.kinds.Block).at(0).$trivia.inner().find(isErrorNode);
		const block = rs.build.block().$trivia.trailing(error);
		expect(block.$trivia.trailing().map((entry: { $text(): string }) => entry.$text())).toEqual(['§']);
		expect(String(block.$render())).toBe('{} §');
	});
});

describe("a built record's unit and leaf sites are read from its record in the arena, with no native call", () => {
	it("reads a rebuilt record's unit sides, by slot and item", async () => {
		using rs: any = await createEngine(rust, { nodeStorage: 'arena' });
		const root = rs.parse('fn a() {}\n/* c */ ;\nfn b() {}\n');
		const copy = root.$with.statements(...root.statements());
		const read = crossings(() => unitSidesOf(copy)!);
		expect(read.value.map((unit) => ({ ...unit, leading: unit.leading === undefined ? undefined : shape(unit.leading) }))).toEqual([{ slot: '_statements', item: 1, leading: ['/* c */'] }]);
		expect(read.calls).toBe(0);
	});

	it("reads a built leaf's written side from the site its holder keeps", async () => {
		using rs: any = await createEngine(rust, { nodeStorage: 'arena' });
		const leaf = rs.build.identifier('a');
		rs.build.expressionStatement(leaf);
		const [holder, word, item] = leafSitesOf(leaf)!;
		leaf.$trivia.leading('/* c */');
		const arena = builtRefOf(leaf)!.arena;
		const read = crossings(() => [arena.leafSide(holder!, word!, item!, 'leading'), arena.leafSide(holder!, word!, item!, 'trailing')]);
		expect([shape(read.value[0]!), read.value[1]]).toEqual([['/* c */'], undefined]);
		expect(read.calls).toBe(0);
	});

	it("reads a copy's unit sides, once the work waiting on its source has run", async () => {
		using rs: any = await createEngine(rust, { nodeStorage: 'arena' });
		const root = rs.parse('fn a() {}\n/* c */ ;\nfn b() {}\n');
		const rebuilt = root.$with.statements(...root.statements());
		const copy = rebuilt.$with.statements(...rebuilt.statements());
		expect(unitSidesOf(copy)!.map((unit) => ({ ...unit, leading: unit.leading === undefined ? undefined : shape(unit.leading) }))).toEqual([{ slot: '_statements', item: 1, leading: ['/* c */'] }]);
	});

	it("reads a copy's leaf site at a word the copy left alone", async () => {
		using rs: any = await createEngine(rust, { nodeStorage: 'arena' });
		const leaf = rs.build.identifier('a');
		const assignment = rs.build.assignmentExpression({ left: leaf, right: rs.build.identifier('b') });
		const [, word, item] = leafSitesOf(leaf)!;
		leaf.$trivia.leading('/* c */');
		const copy = assignment.$with.right(rs.build.identifier('c'));
		const { arena, at } = builtRefOf(copy)!;
		expect(shape(arena.leafSide(at!, word!, item!, 'leading')!)).toEqual(['/* c */']);
		expect(String(copy.$render())).toBe('/* c */ a = c');
	});
});
