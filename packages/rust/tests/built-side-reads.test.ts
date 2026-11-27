import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
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
});
