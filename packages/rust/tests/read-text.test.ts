import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { chunkOf, wordOf } from '@sittir/common/engine';
import { recordOf } from '@sittir/common/utils';
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

const SOURCE = 'fn é() { let s = "日本🎉"; } /* 🎉 c */\nfn f() { § }\n';

const textOf = (entry: { $text?: unknown }): unknown => (typeof entry.$text === 'function' ? (entry.$text as () => unknown)() : entry.$text);

describe.each(['object', 'arena'] as const)("a read's text, sliced from its source by byte spans (%s storage)", (nodeStorage) => {
	it("reads multi-byte leaves, a comment's content and an ERROR as the source spells them", async () => {
		using rs: any = await createEngine(rust, { nodeStorage });
		const root = rs.parse(SOURCE);
		const leaves: unknown[] = [];
		for (const node of root.$query().$descendants) if (typeof node?.$text === 'function') leaves.push(node.$text());
		expect(leaves).toEqual(['é', 's', '"', '日本🎉', 'f']);
		for (const leaf of leaves) expect(SOURCE).toContain(leaf);
		const [first, second] = root.statements();
		const [comment] = first.$trivia.trailing();
		expect(comment.content().$text()).toBe(' 🎉 c ');
		const errors = second.body().$trivia.inner().filter((entry: { $type?: number }) => typeof entry === 'object' && entry.$type === 65535);
		expect(errors.map(textOf)).toEqual(['§']);
	});
});

describe.each(['object', 'arena'] as const)("a read leaf's text after writes around it (%s storage)", (nodeStorage) => {
	it('answers what it answered before each edit and side write of it or its holder, and refuses once its read is freed only in arena storage', async () => {
		using rs: any = await createEngine(rust, { nodeStorage });
		const root = rs.parse('fn f() {\n    let a = b;\n}\n');
		const holder = root.$query().$descendants.ofType(rust.kinds.LetDeclaration).at(0);
		const leaf = holder.name();
		const comment = (text: string) => rs.build.lineComment(` ${text}`);
		expect(leaf.$text()).toBe('a');
		const valued = holder.$with.value(rs.build.identifier('z'));
		expect(leaf.$text()).toBe('a');
		const named = holder.$with.name(rs.build.identifier('q'));
		expect(leaf.$text()).toBe('a');
		holder.$trivia.leading(comment('h'));
		expect(leaf.$text()).toBe('a');
		leaf.$trivia.trailing(comment('l'));
		expect(leaf.$text()).toBe('a');
		expect(String(root.$render())).toBe('fn f() {\n    // h\n    let a // l\n    = b;\n}\n');
		for (const node of [valued, named, root]) node[Symbol.dispose]();
		rs.parse('fn g() {}\n');
		if (nodeStorage === 'arena') expect(() => leaf.$text()).toThrow(/released/);
		else expect(leaf.$text()).toBe('a');
	});
});

type ReadArena = {
	sourceOf(at: number): number;
	readText(at: number, span: { readonly start: number; readonly end: number }): string;
	readonly format: Parameters<typeof chunkOf>[1];
};

const arenaOf = (root: unknown): ReadArena => (root as { $tree: { built: ReadArena } }).$tree.built;
const nameOf = (root: any): { $text(): string } => root.statements()[0].name();

describe("a read's text is read through one view of the string chunk its source is in", () => {
	it("reads a later read's text through the view an earlier read took of the sources chunk they share", async () => {
		using rs: any = await createEngine(rust, { nodeStorage: 'arena' });
		const alpha = rs.parse('fn alpha() {}\n');
		expect(nameOf(alpha).$text()).toBe('alpha');
		const beta = rs.parse('fn beta() {}\n');
		const arena = arenaOf(alpha);
		const [a, b] = [alpha, beta].map((root) => arena.sourceOf(recordOf(root)!));
		expect(chunkOf(b!, arena.format)).toBe(chunkOf(a!, arena.format));
		expect(wordOf(b!, arena.format)).toBeGreaterThan(wordOf(a!, arena.format));
		const name = nameOf(beta);
		const before = calls;
		expect(name.$text()).toBe('beta');
		expect(calls - before).toBe(0);
	});

	it('reads a source too long for the sources chunk from a chunk of its own', async () => {
		using rs: any = await createEngine(rust, { nodeStorage: 'arena' });
		const small = rs.parse('fn alpha() {}\n');
		const long = rs.parse(Array.from({ length: 2000 }, (_, n) => `fn f${n}() {}\n`).join(''));
		const arena = arenaOf(small);
		const [a, b] = [small, long].map((root) => arena.sourceOf(recordOf(root)!));
		expect(chunkOf(b!, arena.format)).not.toBe(chunkOf(a!, arena.format));
		expect(wordOf(b!, arena.format)).toBe(0);
		expect(long.statements()[1999].name().$text()).toBe('f1999');
	});

	it('reads the same span of a source again as it read it first, and refuses a span past its end or splitting a character', async () => {
		using rs: any = await createEngine(rust, { nodeStorage: 'arena' });
		const plain = rs.parse('fn alpha() {}\n');
		const wide = rs.parse('fn é() {}\n');
		const arena = arenaOf(plain);
		const [a, b] = [plain, wide].map((root) => recordOf(root)!);
		expect([arena.readText(a!, { start: 3, end: 8 }), arena.readText(a!, { start: 3, end: 8 }), arena.readText(a!, { start: 0, end: 2 })]).toEqual(['alpha', 'alpha', 'fn']);
		expect([arena.readText(b!, { start: 3, end: 5 }), arena.readText(b!, { start: 3, end: 5 })]).toEqual(['é', 'é']);
		expect(() => arena.readText(a!, { start: 3, end: 99 })).toThrow(/is not a span/);
		expect(() => arena.readText(a!, { start: 8, end: 3 })).toThrow(/is not a span/);
		expect(() => arena.readText(b!, { start: 3, end: 4 })).toThrow(/is not a span/);
	});

	it("refuses a released read's text once its chunk is freed, and reads a later read's text", async () => {
		using rs: any = await createEngine(rust, { nodeStorage: 'arena' });
		const alpha = rs.parse('fn alpha() {}\n');
		const arena = arenaOf(alpha);
		const at = recordOf(alpha)!;
		expect(arena.readText(at, { start: 3, end: 8 })).toBe('alpha');
		alpha[Symbol.dispose]();
		const gamma = rs.parse('fn gamma() {}\n');
		expect(() => arena.readText(at, { start: 3, end: 8 })).toThrow(/released/);
		expect(arena.readText(recordOf(gamma)!, { start: 3, end: 8 })).toBe('gamma');
	});
});
