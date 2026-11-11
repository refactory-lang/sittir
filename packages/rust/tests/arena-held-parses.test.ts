import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { cellFormatOf } from '@sittir/common/engine';
import type { TreeHandle } from '@sittir/common/utils';
import { treeBuiltArena } from '../../common/src/engine-scope.ts';
import { TREE, treeTokenOf } from '../../common/src/tree-token.ts';
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

type ArenaEngine = Awaited<ReturnType<typeof arena>>;

const linkSide = async (engine: ArenaEngine) => {
	const host = sidedOf(engine.parse('fn host() {}\n') as unknown as Root);
	const part = engine.parse('/// kept\nfn part() {}\n') as unknown as Root;
	const entry = engine.build.lineComment.docOuter(sidedOf(part).$trivia.leading()[0]!.content());
	host.$trivia.leading(entry);
	engine.release(entry);
	part[Symbol.dispose]();
	return () => host.$trivia.leading(engine.build.lineComment.docOuter(' other'));
};

const placingBuildThatRewritesAndThrows = async (entry: (engine: ArenaEngine) => unknown) => {
	let leaf: Sided | undefined;
	const hook = {
		build: (call: { readonly path: readonly string[] }, next: () => unknown): unknown => {
			if (leaf === undefined || call.path.at(-1) !== 'binaryExpression') return next();
			next();
			leaf.$trivia.leading(entry(engine));
			throw new Error('refused');
		}
	};
	const engine: ArenaEngine = await createEngine(rust, { nodeStorage: 'arena', intercept: [hook as never] });
	const place = (placed: Sided, right: unknown): unknown => {
		leaf = placed;
		try {
			return engine.build.binaryExpression({ left: placed as never, operator: '+', right: right as never });
		} finally {
			leaf = undefined;
		}
	};
	return { engine, place };
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

	it("refuses a side entry naming another engine's tree, on a built node and on a tree, as a link to it is refused", async () => {
		using engine = await arena();
		using other = await arena();
		const before = live();
		const donor = other.parse('/// kept\nfn f() {}\n') as unknown as Root;
		const comment = sidedOf(donor).$trivia.leading()[0]!;
		const b = engine.build;
		const built = b.binaryExpression({ left: b.identifier('x'), operator: '+', right: b.identifier('y') }) as unknown as Sided;
		expect(() => built.$trivia.leading(comment)).toThrow('a built record holds only nodes its own engine built or parsed, not a node another engine parsed');
		const host = engine.parse('fn host() {}\n') as unknown as Root;
		expect(() => sidedOf(host).$trivia.leading(comment)).toThrow('a built record holds only nodes its own engine built or parsed, not a node another engine parsed');
		donor[Symbol.dispose]();
		expect(String(engine.render(built as never))).toBe('x + y');
		expect(String(engine.render(host as never))).toBe('fn host() {}\n');
		host[Symbol.dispose]();
		engine.release(built as never);
		expect(live()).toBe(before);
	});

	it("keeps the slot of a record an unplaced built leaf's side names past its root's release, and frees it with the leaf", async () => {
		using engine = await arena();
		const before = live();
		const donor = engine.parse('/// kept\nfn f() {}\n') as unknown as Root;
		const leaf = engine.build.identifier('x') as unknown as Sided;
		leaf.$trivia.leading(sidedOf(donor).$trivia.leading()[0]!);
		donor[Symbol.dispose]();
		expect(live()).toBe(before + 1);
		expect(String(engine.render(leaf as never))).toBe('/// kept\nx');
		engine.release(leaf as never);
		expect(live()).toBe(before);
	});

	it("hands the count an unplaced leaf's side takes of a record's slot on to the node that places the leaf", async () => {
		using engine = await arena();
		const before = live();
		const donor = engine.parse('/// kept\nfn f() {}\n') as unknown as Root;
		const b = engine.build;
		const leaf = b.identifier('x') as unknown as Sided;
		leaf.$trivia.leading(sidedOf(donor).$trivia.leading()[0]!);
		const built = b.binaryExpression({ left: leaf as never, operator: '+', right: b.identifier('y') });
		donor[Symbol.dispose]();
		expect(live()).toBe(before + 1);
		expect(String(engine.render(built as never))).toBe('/// kept\nx + y');
		engine.release(built as never);
		expect(live()).toBe(before);
	});

	it("keeps an unplaced leaf's parked comment and its tree when a build that rewrote the leaf's side throws", async () => {
		let leaf: Sided | undefined;
		let fresh: unknown;
		const hook = {
			build: (call: { readonly path: readonly string[] }, next: () => unknown): unknown => {
				if (leaf === undefined || call.path.at(-1) !== 'binaryExpression') return next();
				leaf.$trivia.leading(fresh);
				throw new Error('refused');
			}
		};
		using engine = await createEngine(rust, { nodeStorage: 'arena', intercept: [hook as never] });
		const before = live();
		const donor = engine.parse('/// old\nfn f() {}\n') as unknown as Root;
		const other = engine.parse('/// new\nfn g() {}\n') as unknown as Root;
		const b = engine.build;
		const made = b.identifier('x') as unknown as Sided;
		made.$trivia.leading(sidedOf(donor).$trivia.leading()[0]!);
		fresh = sidedOf(other).$trivia.leading()[0]!;
		donor[Symbol.dispose]();
		const records = (): number => {
			const memory = engine.diagnostics.builtMemory?.();
			if (memory === undefined) throw new Error('the engine builds no arena');
			return memory.live;
		};
		const y = b.identifier('y');
		const z = b.identifier('z');
		const held = records();
		leaf = made;
		expect(() => b.binaryExpression({ left: y, operator: '+', right: z })).toThrow('refused');
		expect(records()).toBe(held);
		expect(String(engine.render(made as never))).toBe('/// old\nx');
		other[Symbol.dispose]();
		expect(live()).toBe(before + 1);
		engine.release(made as never);
		expect(live()).toBe(before);
	});

	it("restores an unplaced leaf's parked comment and its side when a build places the leaf, rewrites the side with a built comment and throws", async () => {
		const { engine: created, place } = await placingBuildThatRewritesAndThrows((engine) => engine.build.lineComment.docOuter(' new'));
		using engine = created;
		const before = live();
		const donor = engine.parse('/// old\nfn f() {}\n') as unknown as Root;
		const b = engine.build;
		const leaf = b.identifier('x') as unknown as Sided;
		leaf.$trivia.leading(sidedOf(donor).$trivia.leading()[0]!);
		donor[Symbol.dispose]();
		const y = b.identifier('y');
		const held = engine.diagnostics.builtMemory?.()?.live;
		expect(() => place(leaf, y)).toThrow('refused');
		expect(engine.diagnostics.builtMemory?.()?.live).toBe(held);
		expect(String(engine.render(leaf as never))).toBe('/// old\nx');
		expect(live()).toBe(before + 1);
		engine.release(leaf as never);
		expect(live()).toBe(before);
		expect(engine.diagnostics.builtMemory?.()?.live).toBe(0);
	});

	it("restores an unplaced leaf's parked built comment when a build places the leaf, rewrites the side with a parsed comment and throws, and frees that comment's tree", async () => {
		let other: Root | undefined;
		const { engine: created, place } = await placingBuildThatRewritesAndThrows(() => sidedOf(other!).$trivia.leading()[0]!);
		using engine = created;
		const before = live();
		other = engine.parse('/// new\nfn g() {}\n') as unknown as Root;
		const b = engine.build;
		const comment = b.lineComment.docOuter(' old');
		const leaf = b.identifier('x') as unknown as Sided;
		leaf.$trivia.leading(comment);
		const y = b.identifier('y');
		const held = engine.diagnostics.builtMemory?.()?.live;
		expect(() => place(leaf, y)).toThrow('refused');
		expect(engine.diagnostics.builtMemory?.()?.live).toBe(held);
		expect(String(engine.render(leaf as never))).toBe('/// old\nx');
		other[Symbol.dispose]();
		expect(live()).toBe(before);
		engine.release(leaf as never);
		engine.release(comment as never);
		expect(engine.diagnostics.builtMemory?.()?.live).toBe(0);
	});

	it('keeps a side write to a placed leaf on the leaf and on the node that placed it alike when a build placing the leaf again throws', async () => {
		const { engine: created, place } = await placingBuildThatRewritesAndThrows((engine) => engine.build.lineComment.docOuter(' new'));
		using engine = created;
		const b = engine.build;
		const comment = b.lineComment.docOuter(' old');
		const leaf = b.identifier('x') as unknown as Sided;
		leaf.$trivia.leading(comment);
		const built = b.binaryExpression({ left: leaf as never, operator: '+', right: b.identifier('y') });
		expect(() => place(leaf, b.identifier('z'))).toThrow('refused');
		expect(String(engine.render(built as never))).toBe('/// new\nx + y');
		expect(String(engine.render(leaf as never))).toBe('/// new\nx');
		engine.release(built as never);
		engine.release(leaf as never);
		engine.release(comment as never);
		expect(engine.diagnostics.builtMemory?.()?.live).toBe(0);
	});

	it("frees what a leaf's old comment holds when a closed scope kept the leaf placed and its side is rewritten", async () => {
		using engine = await arena();
		const before = live();
		const b = engine.build;
		const donor = engine.parse('/// old\nfn f() {}\n') as unknown as Root;
		const leaf = b.identifier('x') as unknown as Sided;
		leaf.$trivia.leading(sidedOf(donor).$trivia.leading()[0]!);
		donor[Symbol.dispose]();
		let built: unknown;
		{
			using scope = engine.scope();
			built = scope.keep(b.binaryExpression({ left: leaf as never, operator: '+', right: b.identifier('y') }) as object);
			scope.keep(leaf as unknown as object);
		}
		const fresh = b.lineComment.docOuter(' new');
		leaf.$trivia.leading(fresh);
		expect(live()).toBe(before);
		expect(String(engine.render(built as never))).toBe('/// new\nx + y');
		expect(String(engine.render(leaf as never))).toBe('/// new\nx');
		engine.release(built as never);
		engine.release(leaf as never);
		engine.release(fresh as never);
		expect(engine.diagnostics.builtMemory?.()?.live).toBe(0);
	});

	it('keeps a side write to a leaf a closed scope kept placed, and frees what its old comment holds, when a build placing the leaf again throws', async () => {
		const { engine: created, place } = await placingBuildThatRewritesAndThrows((engine) => engine.build.lineComment.docOuter(' new'));
		using engine = created;
		const before = live();
		const b = engine.build;
		const donor = engine.parse('/// old\nfn f() {}\n') as unknown as Root;
		const leaf = b.identifier('x') as unknown as Sided;
		leaf.$trivia.leading(sidedOf(donor).$trivia.leading()[0]!);
		donor[Symbol.dispose]();
		let built: unknown;
		{
			using scope = engine.scope();
			built = scope.keep(b.binaryExpression({ left: leaf as never, operator: '+', right: b.identifier('y') }) as object);
			scope.keep(leaf as unknown as object);
		}
		expect(() => place(leaf, b.identifier('z'))).toThrow('refused');
		expect(live()).toBe(before);
		expect(String(engine.render(built as never))).toBe('/// new\nx + y');
		expect(String(engine.render(leaf as never))).toBe('/// new\nx');
		engine.release(built as never);
		engine.release(leaf as never);
		expect(engine.diagnostics.builtMemory?.()?.live).toBe(0);
	});

	it('keeps a side write to a leaf a scope keeps placed on the leaf and on the node that placed it alike when the build that wrote it throws', async () => {
		let target: Sided | undefined;
		let fresh: unknown;
		const hook = {
			build: (call: { readonly path: readonly string[] }, next: () => unknown): unknown => {
				if (target === undefined || call.path.at(-1) !== 'binaryExpression') return next();
				target.$trivia.leading(fresh);
				throw new Error('refused');
			}
		};
		using engine = await createEngine(rust, { nodeStorage: 'arena', intercept: [hook as never] });
		const before = live();
		const b = engine.build;
		const donor = engine.parse('/// old\nfn f() {}\n') as unknown as Root;
		const leaf = b.identifier('x') as unknown as Sided;
		leaf.$trivia.leading(sidedOf(donor).$trivia.leading()[0]!);
		donor[Symbol.dispose]();
		fresh = b.lineComment.docOuter(' new');
		let built: unknown;
		{
			using scope = engine.scope();
			built = scope.keep(b.binaryExpression({ left: leaf as never, operator: '+', right: b.identifier('y') }) as object);
			scope.keep(leaf as unknown as object);
			target = leaf;
			expect(() => b.binaryExpression({ left: b.identifier('p'), operator: '+', right: b.identifier('q') })).toThrow('refused');
			target = undefined;
			expect(live()).toBe(before);
		}
		expect(String(engine.render(built as never))).toBe('/// new\nx + y');
		expect(String(engine.render(leaf as never))).toBe('/// new\nx');
		engine.release(built as never);
		engine.release(leaf as never);
		engine.release(fresh as never);
		expect(engine.diagnostics.builtMemory?.()?.live).toBe(0);
	});

	it.each([false, true])("restores a leaf an outer build placed when an inner build rewrote its side and threw, and the outer build then threw (kept by a scope: %s)", async (kept) => {
		let leaf: Sided | undefined;
		let inner = false;
		const hook = {
			build: (call: { readonly path: readonly string[] }, next: () => unknown): unknown => {
				const name = call.path.at(-1);
				if (leaf !== undefined && name === 'binaryExpression') {
					next();
					inner = true;
					try {
						engine.build.identifier('w');
					} catch {}
					inner = false;
					throw new Error('outer');
				}
				if (inner && name === 'identifier') {
					leaf!.$trivia.leading(engine.build.lineComment.docOuter(' new'));
					throw new Error('inner');
				}
				return next();
			}
		};
		using engine = await createEngine(rust, { nodeStorage: 'arena', intercept: [hook as never] });
		const before = live();
		const donor = engine.parse('/// old\nfn f() {}\n') as unknown as Root;
		const b = engine.build;
		const made = b.identifier('x') as unknown as Sided;
		made.$trivia.leading(sidedOf(donor).$trivia.leading()[0]!);
		donor[Symbol.dispose]();
		const y = b.identifier('y');
		{
			using scope = engine.scope();
			if (kept) scope.keep(made as unknown as object);
			leaf = made;
			expect(() => b.binaryExpression({ left: made as never, operator: '+', right: y })).toThrow('outer');
			leaf = undefined;
		}
		expect(String(engine.render(made as never))).toBe('/// old\nx');
		expect(live()).toBe(before + 1);
		engine.release(made as never);
		expect(live()).toBe(before);
		expect(engine.diagnostics.builtMemory?.()?.live).toBe(0);
	});

	it("takes no count for an unplaced leaf's side when one of its entries is refused", async () => {
		using engine = await arena();
		const before = live();
		const kept = engine.parse('/// kept\nfn f() {}\n') as unknown as Root;
		const gone = engine.parse('/// gone\nfn g() {}\n') as unknown as Root;
		const comment = sidedOf(kept).$trivia.leading()[0]!;
		const freed = sidedOf(gone).$trivia.leading()[0]!;
		gone[Symbol.dispose]();
		const leaf = engine.build.identifier('x') as unknown as Sided;
		expect(() => leaf.$trivia.leading(comment, freed)).toThrow();
		kept[Symbol.dispose]();
		engine.release(leaf as never);
		expect(live()).toBe(before);
	});

	it("keeps an unplaced leaf's old comment when a caught inner build moved a built comment onto its side and threw, and the outer build went on", async () => {
		let leaf: Sided | undefined;
		let fresh: unknown;
		let inner = false;
		const hook = {
			build: (call: { readonly path: readonly string[] }, next: () => unknown): unknown => {
				const name = call.path.at(-1);
				if (leaf !== undefined && name === 'binaryExpression') {
					inner = true;
					try {
						engine.build.identifier('w');
					} catch {}
					inner = false;
					return next();
				}
				if (inner && name === 'identifier') {
					leaf!.$trivia.leading(fresh);
					throw new Error('refused');
				}
				return next();
			}
		};
		using engine = await createEngine(rust, { nodeStorage: 'arena', intercept: [hook as never] });
		const before = live();
		const donor = engine.parse('/// old\nfn f() {}\n') as unknown as Root;
		const b = engine.build;
		const made = b.identifier('x') as unknown as Sided;
		made.$trivia.leading(sidedOf(donor).$trivia.leading()[0]!);
		donor[Symbol.dispose]();
		fresh = b.lineComment.docOuter(' new');
		const y = b.identifier('y');
		const z = b.identifier('z');
		leaf = made;
		const built = b.binaryExpression({ left: y, operator: '+', right: z });
		leaf = undefined;
		expect(String(engine.render(made as never))).toBe('/// old\nx');
		expect(String(engine.render(fresh as never))).toBe('/// new\n');
		expect(live()).toBe(before + 1);
		engine.release(made as never);
		engine.release(fresh as never);
		engine.release(built as never);
		expect(live()).toBe(before);
		expect(engine.diagnostics.builtMemory?.()?.live).toBe(0);
	});

	it('leaves a built comment its own when a write to an unplaced leaf that named it is refused', async () => {
		using engine = await arena();
		const gone = engine.parse('/// gone\nfn g() {}\n') as unknown as Root;
		const freed = sidedOf(gone).$trivia.leading()[0]!;
		gone[Symbol.dispose]();
		const b = engine.build;
		const comment = b.lineComment.docOuter(' built');
		const leaf = b.identifier('x') as unknown as Sided;
		expect(() => leaf.$trivia.leading(comment, freed)).toThrow();
		expect(String(engine.render(comment as never))).toBe('/// built\n');
		engine.release(leaf as never);
		engine.release(comment as never);
		expect(engine.diagnostics.builtMemory?.()?.live).toBe(0);
	});

	it('gives a built comment its count back once when a build that parked it on a leaf and kept it throws', async () => {
		let leaf: Sided | undefined;
		let comment: unknown;
		let keep: ((node: object) => object) | undefined;
		const hook = {
			build: (call: { readonly path: readonly string[] }, next: () => unknown): unknown => {
				if (leaf === undefined || call.path.at(-1) !== 'binaryExpression') return next();
				leaf.$trivia.leading(comment);
				keep!(comment as object);
				throw new Error('refused');
			}
		};
		using engine = await createEngine(rust, { nodeStorage: 'arena', intercept: [hook as never] });
		const b = engine.build;
		const made = b.identifier('x') as unknown as Sided;
		comment = b.lineComment.docOuter(' c');
		const y = b.identifier('y');
		const z = b.identifier('z');
		{
			using scope = engine.scope();
			keep = (node) => scope.keep(node);
			leaf = made;
			expect(() => b.binaryExpression({ left: y, operator: '+', right: z })).toThrow('refused');
			leaf = undefined;
		}
		for (const node of [made, comment, y, z]) engine.release(node as never);
		expect(engine.diagnostics.builtMemory?.()?.live).toBe(0);
	});

	it.each(['parsed', 'built'] as const)('releases what a %s comment parked on a leaf takes when a build places the leaf, keeps it and throws', async (form) => {
		let leaf: Sided | undefined;
		let keep: ((node: object) => object) | undefined;
		const hook = {
			build: (call: { readonly path: readonly string[] }, next: () => unknown): unknown => {
				if (leaf === undefined || call.path.at(-1) !== 'binaryExpression') return next();
				next();
				keep!(leaf as unknown as object);
				throw new Error('refused');
			}
		};
		using engine = await createEngine(rust, { nodeStorage: 'arena', intercept: [hook as never] });
		const before = live();
		const b = engine.build;
		const made = b.identifier('x') as unknown as Sided;
		const donor = engine.parse('/// kept\nfn f() {}\n') as unknown as Root;
		made.$trivia.leading(form === 'parsed' ? sidedOf(donor).$trivia.leading()[0]! : b.blockComment('/* c */'));
		donor[Symbol.dispose]();
		const z = b.identifier('z');
		{
			using scope = engine.scope();
			keep = (node) => scope.keep(node);
			leaf = made;
			expect(() => b.binaryExpression({ left: made as never, operator: '+', right: z })).toThrow('refused');
			leaf = undefined;
		}
		engine.release(made as never);
		engine.release(z);
		expect(live()).toBe(before);
		expect(engine.diagnostics.builtMemory?.()?.live).toBe(0);
	});

	it('counts a spread copy of an unplaced leaf that a scope keeps apart from the leaf, so each release drops its own count', async () => {
		using engine = await arena();
		const before = live();
		const donor = engine.parse('/// kept\nfn f() {}\n') as unknown as Root;
		const leaf = engine.build.identifier('x') as unknown as Sided;
		leaf.$trivia.leading(sidedOf(donor).$trivia.leading()[0]!);
		const copy = { ...(leaf as object) };
		{
			using scope = engine.scope();
			scope.keep(copy);
		}
		donor[Symbol.dispose]();
		engine.release(leaf as never);
		expect(live()).toBe(before + 1);
		engine.release(copy as never);
		expect(live()).toBe(before);
	});

	it("refuses an arena tree's record on a side of an object-storage node, built or parsed, which no count can keep", async () => {
		using engine = await arena();
		using objects = await object();
		const donor = engine.parse('/// kept\nfn f() {}\n') as unknown as Root;
		const comment = sidedOf(donor).$trivia.leading()[0]!;
		const b = objects.build;
		const built = b.binaryExpression({ left: b.identifier('x'), operator: '+', right: b.identifier('y') }) as unknown as Sided;
		expect(() => built.$trivia.leading(comment)).toThrow('a built record holds only nodes its own engine built or parsed, not a node another engine parsed');
		const host = objects.parse('fn host() {}\n') as unknown as Root;
		expect(() => sidedOf(host).$trivia.leading(comment)).toThrow('a built record holds only nodes its own engine built or parsed, not a node another engine parsed');
		donor[Symbol.dispose]();
		expect(String(objects.render(built as never))).toBe('x + y');
	});

	it('refuses a side entry whose token names a tree of the holder and whose coordinate names another', async () => {
		using engine = await arena();
		using other = await arena();
		const host = engine.parse('fn host() {}\n') as unknown as Root;
		const donor = other.parse('/// kept\nfn f() {}\n') as unknown as Root;
		const comment = sidedOf(donor).$trivia.leading()[0]! as unknown as object;
		const local = treeTokenOf(host as unknown as object);
		const spliced = new Proxy(comment, { get: (target, key, receiver) => (key === TREE ? local : Reflect.get(target, key, receiver)) });
		const b = engine.build;
		const built = b.binaryExpression({ left: b.identifier('x'), operator: '+', right: b.identifier('y') }) as unknown as Sided;
		expect(() => built.$trivia.leading(spliced)).toThrow('a built record holds only nodes its own engine built or parsed, not a node another engine parsed');
		expect(() => sidedOf(host).$trivia.leading(spliced)).toThrow('a built record holds only nodes its own engine built or parsed, not a node another engine parsed');
		donor[Symbol.dispose]();
		expect(String(engine.render(built as never))).toBe('x + y');
		engine.release(built as never);
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
