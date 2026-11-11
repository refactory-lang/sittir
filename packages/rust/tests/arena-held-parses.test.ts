import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { cellFormatOf } from '@sittir/common/engine';
import type { TreeHandle } from '@sittir/common/utils';
import { treeBuiltArena } from '../../common/src/engine-scope.ts';
import { getActiveBackend } from '../src/backend.js';
import rust from '../src/index.ts';

function addon() {
	const status = getActiveBackend();
	if (status.name !== 'native') throw new Error(`native backend unavailable: ${status.reason}`);
	return status.native;
}

const live = (): number => addon().liveTreeCount();
const arena = () => createEngine(rust, { nodeStorage: 'arena' });
const object = () => createEngine(rust, { nodeStorage: 'object' });

type Named = { name(): never; $with: { name(value: unknown): never } };
type Root = { statements(): readonly Named[]; [Symbol.dispose](): void };
const itemOf = (root: Root): Named => root.statements()[0]!;
type Sided = { $trivia: { leading(...entries: unknown[]): readonly { content(): never }[] } };
const sidedOf = (root: Root): Sided => root.statements()[0] as unknown as Sided;

const linkSide = async (engine: Awaited<ReturnType<typeof arena>>) => {
	const host = sidedOf(engine.parse('fn host() {}\n') as unknown as Root);
	const part = engine.parse('/// kept\nfn part() {}\n') as unknown as Root;
	const entry = engine.build.lineComment.docOuter(sidedOf(part).$trivia.leading()[0]!.content());
	host.$trivia.leading(entry);
	engine.release(entry);
	part[Symbol.dispose]();
	return () => host.$trivia.leading(engine.build.lineComment.docOuter(' other'));
};

describe('an arena parse, held by its engine and counted by its root and each record naming it', () => {
	it('frees each of 100 parses when its root is released', async () => {
		using engine = await arena();
		const before = live();
		for (let n = 0; n < 100; n++) (engine.parse(`fn f${n}() {}`) as unknown as Root)[Symbol.dispose]();
		expect(live()).toBe(before);
	});

	it('frees 100 parses no root released when its engine is disposed', async () => {
		const before = live();
		{
			using engine = await arena();
			for (let n = 0; n < 100; n++) engine.parse(`fn f${n}() {}`);
			expect(live()).toBe(before + 100);
		}
		expect(live()).toBe(before);
	});

	it('keeps a parse a built node links after its root is released, and frees it with the built node', async () => {
		using engine = await arena();
		const before = live();
		const root = engine.parse('fn f() {}\n') as unknown as Root;
		const built = engine.build.binaryExpression({ left: itemOf(root).name(), operator: '+', right: engine.build.identifier('y') });
		root[Symbol.dispose]();
		expect(live()).toBe(before + 1);
		expect(String(engine.render(built))).toBe('f + y');
		engine.release(built);
		expect(live()).toBe(before);
	});

	it('keeps a parse a rebuilt node names after its root is released, and frees it with the rebuilt node', async () => {
		using engine = await arena();
		const before = live();
		const root = engine.parse('fn g() {}\n') as unknown as Root;
		const edited = itemOf(root).$with.name(engine.build.identifier('h'));
		root[Symbol.dispose]();
		expect(live()).toBe(before + 1);
		expect(String(engine.render(edited))).toBe('fn h() {}');
		engine.release(edited);
		expect(live()).toBe(before);
	});

	it('releases a root once, however many times it is disposed', async () => {
		using engine = await arena();
		const before = live();
		const root = engine.parse('fn f() {}\n') as unknown as Root;
		const built = engine.build.binaryExpression({ left: itemOf(root).name(), operator: '+', right: engine.build.identifier('y') });
		root[Symbol.dispose]();
		root[Symbol.dispose]();
		expect(live()).toBe(before + 1);
		expect(String(engine.render(built))).toBe('f + y');
	});

	it('refuses a built node around a part another engine parsed', async () => {
		using a = await arena();
		using b = await arena();
		const part = itemOf(b.parse('fn f() {}\n') as unknown as Root).name();
		expect(() => a.build.binaryExpression({ left: part, operator: '+', right: a.build.identifier('y') })).toThrow(/another engine/);
	});

	it('refuses an edit of a parsed node to hold a part another engine parsed', async () => {
		using a = await arena();
		using b = await arena();
		const part = itemOf(b.parse('fn f() {}\n') as unknown as Root).name();
		expect(() => itemOf(a.parse('fn g() {}\n') as unknown as Root).$with.name(part)).toThrow(/another engine/);
	});

	it('renders a parsed tree whose side holds a record built over a node of the same parse, through its own engine and another', () => {
		const fixture = fileURLToPath(new URL('../../common/tests/fixtures/side-entry-same-parse.mts', import.meta.url));
		const rendersIn = (storage: string): unknown => {
			const out = execFileSync(process.execPath, ['--import', 'tsx', fixture, storage], {
				cwd: fileURLToPath(new URL('..', import.meta.url)),
				encoding: 'utf8',
				env: { ...process.env, SITTIR_BACKEND: 'native' },
				timeout: 30_000
			});
			return JSON.parse(out.trim().split('\n').at(-1) ?? '');
		};
		const linked = '/// kept\nfn f() {}\n\n/// kept\nfn g() {}\n';
		const rebuilt = '/// kept\nfn f() {}\n\n/// new\nfn g() {}\n';
		const expected = { linked: { own: linked, other: linked }, rebuilt: { own: rebuilt, other: rebuilt } };
		expect(rendersIn('object')).toEqual(expected);
		expect(rendersIn('arena')).toEqual(expected);
	}, 90_000);

	it('frees a parse only a side entry holds when the side is replaced, and its engine dispose leaves no tree', async () => {
		const before = live();
		{
			using engine = await arena();
			const replace = await linkSide(engine);
			expect(live()).toBe(before + 2);
			replace();
			expect(live()).toBe(before + 1);
		}
		expect(live()).toBe(before);
	});

	it('reads a link into a parse held in a slot a side replacement freed, after an unrelated release', async () => {
		using engine = await arena();
		(await linkSide(engine))();
		const reused = engine.parse('fn reused() {}\n') as unknown as Root;
		const built = engine.build.binaryExpression({ left: itemOf(reused).name(), operator: '+', right: engine.build.identifier('y') }) as unknown as { left(): never };
		reused[Symbol.dispose]();
		engine.release(engine.build.identifier('z'));
		expect(String(engine.render(built.left()))).toBe('reused');
	});

	it('keeps the slot lookup of a parse while a report names another parse freed from its slot', async () => {
		using engine = await arena();
		const root = engine.parse('fn kept() {}\n') as unknown as Root & { $tree: TreeHandle };
		const linked = () => engine.build.binaryExpression({ left: itemOf(root).name(), operator: '+', right: engine.build.identifier('y') }) as unknown as { left(): never };
		const [first, second] = [linked(), linked()];
		const { $tree: tree } = root;
		treeBuiltArena(tree)!.forgetParses([tree.slot!, tree.id! + 1]);
		expect(String(engine.render(first.left()))).toBe('kept');
		treeBuiltArena(tree)!.forgetParses([tree.slot!, tree.id!]);
		expect(() => second.left()).toThrow(/does not hold/);
	});

	it('holds nothing of a parse its parse call refuses', async () => {
		using engine = await arena();
		const before = live();
		for (let n = 0; n < 100; n++) {
			expect(() => engine.parse('fn {', { errors: 'throw' })).toThrow();
			expect(() => engine.parse('fn f() {}', { depth: 0 })).toThrow(/depth 0/);
		}
		expect(live()).toBe(before);
	});

	it('holds nothing of a parse an interceptor throws after, however often it called next', async () => {
		const throwingAfter = (calls: number) => ({
			parse(_: unknown, next: () => unknown): never {
				for (let n = 0; n < calls; n++) next();
				throw new Error('hook refused');
			}
		});
		for (const calls of [1, 2]) {
			using engine = await createEngine(rust, { nodeStorage: 'arena', intercept: [throwingAfter(calls)] });
			const before = live();
			for (let n = 0; n < 50; n++) expect(() => engine.parse('fn f() {}\n')).toThrow('hook refused');
			expect(live()).toBe(before);
		}
	});

	it('holds nothing of a parse whose refusal an interceptor catches', async () => {
		using other = await object();
		const fallback = other.parse('fn ok() {}\n');
		const catching = {
			parse(_: unknown, next: () => unknown): unknown {
				try {
					return next();
				} catch {
					return fallback;
				}
			}
		};
		using engine = await createEngine(rust, { nodeStorage: 'arena', intercept: [catching as never] });
		const before = live();
		for (let n = 0; n < 50; n++) expect(engine.parse('fn {', { errors: 'throw' })).toBe(fallback);
		expect(live()).toBe(before);
	});

	it('holds nothing of a parse an interceptor does not return, and keeps the one it does', async () => {
		using other = await object();
		const fallback = other.parse('fn ok() {}\n');
		const hooks = [
			{ parse: (_: unknown, next: () => unknown): unknown => (next(), next()) },
			{ parse: (_: unknown, next: () => unknown): unknown => (next(), fallback) }
		];
		for (const hook of hooks) {
			using engine = await createEngine(rust, { nodeStorage: 'arena', intercept: [hook as never] });
			const before = live();
			for (let n = 0; n < 20; n++) {
				const root = engine.parse('fn f() {}\n');
				if (root === fallback) continue;
				expect(String(engine.render(root))).toBe('fn f() {}\n');
				engine.release(root);
			}
			expect(live()).toBe(before);
		}
	});

	it('keeps the parse whose root an interceptor answers wrapped, and frees it by either release of the wrapper', async () => {
		const wrappers = [
			(root: object): object =>
				new Proxy(root, {
					get: (target, key) => {
						const value: unknown = Reflect.get(target, key, target);
						return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(target) : value;
					}
				}),
			(root: object): object => Object.create(root) as object
		];
		type Arena = Awaited<ReturnType<typeof arena>>;
		const releases = [(engine: Arena, node: object) => engine.release(node as never), (_: Arena, node: object) => (node as Disposable)[Symbol.dispose]()];
		for (const wrap of wrappers) {
			for (const release of releases) {
				using engine = await createEngine(rust, { nodeStorage: 'arena', intercept: [{ parse: (_: unknown, next: () => unknown) => wrap(next() as object) } as never] });
				const before = live();
				const root = engine.parse('fn f() {}\n') as object;
				expect(String(engine.render(root as never))).toBe('fn f() {}\n');
				expect(live()).toBe(before + 1);
				release(engine, root);
				expect(live()).toBe(before);
			}
		}
	});

	it('holds nothing of a parse whose returned value an interceptor revoked, or that is not a root', async () => {
		const hooks = [
			{
				parse: (_: unknown, next: () => unknown): unknown => {
					const { proxy, revoke } = Proxy.revocable(next() as object, {});
					revoke();
					return proxy;
				}
			},
			{ parse: (_: unknown, next: () => unknown): unknown => (next() as Root).statements()[0] }
		];
		for (const hook of hooks) {
			using engine = await createEngine(rust, { nodeStorage: 'arena', intercept: [hook as never] });
			const before = live();
			for (let n = 0; n < 20; n++) {
				try {
					engine.parse('fn f() {}\n');
				} catch (error) {
					expect(String(error)).toMatch(/revoked/);
				}
			}
			expect(live()).toBe(before);
		}
	});

	it("keeps the slot of a record a built node's side names past its root's release, and frees it with the built node", async () => {
		using engine = await arena();
		const before = live();
		const donor = engine.parse('/// kept\nfn f() {}\n') as unknown as Root;
		const b = engine.build;
		const built = b.binaryExpression({ left: b.identifier('x'), operator: '+', right: b.identifier('y') }) as unknown as Sided;
		built.$trivia.leading(sidedOf(donor).$trivia.leading()[0]!);
		donor[Symbol.dispose]();
		expect(live()).toBe(before + 1);
		expect(String(engine.render(built as never))).toBe('/// kept\nx + y');
		engine.release(built as never);
		expect(live()).toBe(before);
	});

	it('keeps the slot of a record an interceptor puts on a side of the built node it answers, past the release of the root it discards', async () => {
		const hook = {
			parse: (_: unknown, next: () => unknown): unknown => {
				const b = engine.build;
				const built = b.binaryExpression({ left: b.identifier('x'), operator: '+', right: b.identifier('y') }) as unknown as Sided;
				built.$trivia.leading(sidedOf(next() as Root).$trivia.leading()[0]!);
				return built;
			}
		};
		using engine = await createEngine(rust, { nodeStorage: 'arena', intercept: [hook as never] });
		const before = live();
		const answer = engine.parse('/// kept\nfn f() {}\n');
		expect(live()).toBe(before + 1);
		expect(String(engine.render(answer as never))).toBe('/// kept\nx + y');
		engine.release(answer as never);
		expect(live()).toBe(before);
	});

	it("keeps the slot of a record another tree's side names past its root's release, and frees it with that tree", async () => {
		using engine = await arena();
		const before = live();
		const host = engine.parse('fn host() {}\n') as unknown as Root;
		const donor = engine.parse('/// kept\nfn f() {}\n') as unknown as Root;
		sidedOf(host).$trivia.leading(sidedOf(donor).$trivia.leading()[0]!);
		donor[Symbol.dispose]();
		expect(live()).toBe(before + 2);
		expect(String(engine.render(host as never))).toBe('/// kept\nfn host() {}\n');
		host[Symbol.dispose]();
		expect(live()).toBe(before);
	});

	it("takes no count of a tree's own slot for a record its own side names, so its root's release frees it", async () => {
		using engine = await arena();
		const before = live();
		const root = engine.parse('/// kept\nfn f() {}\nfn g() {}\n') as unknown as Root;
		const [first, second] = root.statements() as unknown as [Sided, Sided];
		second.$trivia.leading(first.$trivia.leading()[0]!);
		expect(String(engine.render(root as never))).toMatch(/^\/\/\/ kept\nfn f\(\) \{\}\n\s*\/\/\/ kept\nfn g\(\) \{\}\n$/);
		root[Symbol.dispose]();
		expect(live()).toBe(before);
	});

	it('refuses to dispose a parse its engine holds, which its root then frees', async () => {
		using engine = await arena();
		const before = live();
		const root = engine.parse('fn f() {}\n') as unknown as Root & { $tree: TreeHandle };
		expect(() => addon().disposeTree(root.$tree.id!)).toThrow(/its engine holds/);
		expect(live()).toBe(before + 1);
		root[Symbol.dispose]();
		expect(live()).toBe(before);
	});

	it('keeps the link record at 8 words', () => {
		expect(cellFormatOf(addon())?.linkWords).toBe(8);
	});
});

describe('an object parse, held by the garbage collector', () => {
	it('keeps its tree past its root dispose and its engine dispose', async () => {
		const before = live();
		{
			using engine = await object();
			(engine.parse('fn kept() {}') as unknown as Root)[Symbol.dispose]();
		}
		expect(live()).toBe(before + 1);
	});
});
