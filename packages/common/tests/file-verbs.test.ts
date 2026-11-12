import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import rust, { type RustAPI } from '@sittir/rust';
import type { BuildSurface, Engine, EngineOptions, FileChange, Pending } from '@sittir/types';
import { createEngine } from '../src/create-engine.ts';

const engines: { dispose(): void }[] = [];
let directory = '';

beforeEach(() => {
	directory = mkdtempSync(join(tmpdir(), 'sittir-file-verbs-'));
});

afterEach(() => {
	for (const engine of engines.splice(0)) engine.dispose();
	rmSync(directory, { recursive: true, force: true });
});

const settled = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

describe.each(['object', 'arena'] as const)('engine.write and engine.create (%s)', (nodeStorage) => {
	async function engineOf(options?: EngineOptions<RustAPI>): Promise<Engine<RustAPI>> {
		const engine = await createEngine(rust, { ...options, nodeStorage });
		engines.push(engine);
		return engine;
	}

	const at = (name: string): string => join(directory, name);

	it('stamps the grammar root kinds on the engine', async () => {
		const engine = await engineOf();
		expect(engine.rootKinds).toEqual([engine.parse('fn a() {}\n').$type]);
	});

	it('write commits when awaited', async () => {
		const engine = await engineOf();
		const root = engine.parse('fn a() {}\n');
		await engine.write(at('a.rs'), root);
		expect(readFileSync(at('a.rs'), 'utf8')).toBe(engine.render(root).toString());
	});

	it('an unawaited, undisposed write writes nothing', async () => {
		const engine = await engineOf();
		void engine.write(at('a.rs'), engine.parse('fn a() {}\n'));
		await settled();
		expect(existsSync(at('a.rs'))).toBe(false);
	});

	it('await using commits at the end of the scope', async () => {
		const engine = await engineOf();
		const path = at('a.rs');
		{
			await using written = engine.write(path, engine.parse('fn a() {}\n'));
			expect(written.path).toBe(path);
			expect(existsSync(path)).toBe(false);
		}
		expect(readFileSync(path, 'utf8')).toBe('fn a() {}\n');
	});

	it('commits once however often it is awaited', async () => {
		let commits = 0;
		const engine = await engineOf({
			intercept: [
				{
					async file(_, next) {
						commits++;
						await next();
					}
				}
			]
		});
		const written = engine.write(at('a.rs'), engine.parse('fn a() {}\n'));
		await written;
		await written;
		await written[Symbol.asyncDispose]();
		expect(commits).toBe(1);
	});

	it('writes the root as it is at the commit', async () => {
		const engine = await engineOf();
		const root = engine.parse('fn a() {}\n');
		const written = engine.write(at('a.rs'), root);
		root.$trivia.leading('// note');
		await written;
		const text = engine.render(root).toString();
		expect(text).toContain('// note');
		expect(readFileSync(at('a.rs'), 'utf8')).toBe(text);
		expect(written.diff().after).toBe(text);
	});

	it('diff names a new file with no before', async () => {
		const engine = await engineOf();
		const root = engine.parse('fn a() {}\n');
		expect(engine.write(at('a.rs'), root).diff()).toEqual({ path: at('a.rs'), before: undefined, after: engine.render(root).toString() });
		expect(existsSync(at('a.rs'))).toBe(false);
	});

	it('diff reads the file as it is now', async () => {
		const engine = await engineOf();
		const path = at('a.rs');
		writeFileSync(path, 'fn old() {}\n');
		expect(engine.write(path, engine.parse('fn a() {}\n')).diff()).toEqual({ path, before: 'fn old() {}\n', after: 'fn a() {}\n' });
	});

	it('refuses a node that is not a root, naming its kind', async () => {
		const engine = await engineOf();
		await expect(engine.write(at('a.rs'), engine.build.identifier('a') as never)).rejects.toThrow(/identifier/);
		expect(existsSync(at('a.rs'))).toBe(false);
	});

	it("refuses another engine's root", async () => {
		const engine = await engineOf();
		const other = await engineOf();
		await expect(engine.write(at('a.rs'), other.parse('fn a() {}\n'))).rejects.toThrow(/engine/);
		expect(existsSync(at('a.rs'))).toBe(false);
	});

	it('create writes a new file and refuses an existing one', async () => {
		const engine = await engineOf();
		const path = at('a.rs');
		const make = (build: BuildSurface<RustAPI, 'default'>) => build.sourceFile({ statements: [...engine.parse('fn a() {}\n').statements()] } as never);
		await engine.create(path, make);
		expect(readFileSync(path, 'utf8')).toBe('fn a() {}\n');
		await expect(engine.create(path, make)).rejects.toThrow(/exists/);
		expect(readFileSync(path, 'utf8')).toBe('fn a() {}\n');
	});

	it('create builds when called, so a builder that throws throws from create', async () => {
		const engine = await engineOf();
		const cause = new Error('builder failed');
		expect(() =>
			engine.create(at('a.rs'), () => {
				throw cause;
			})
		).toThrow(cause);
	});

	it('a file interceptor sees path and verb, and can skip the write', async () => {
		const seen: { readonly path: string; readonly verb: string }[] = [];
		const engine = await engineOf({
			intercept: [
				{
					async file({ path, verb }) {
						seen.push({ path, verb });
					}
				}
			]
		});
		await engine.write(at('a.rs'), engine.parse('fn a() {}\n'));
		await engine.create(at('b.rs'), () => engine.parse('fn b() {}\n'));
		expect(existsSync(at('a.rs'))).toBe(false);
		expect(existsSync(at('b.rs'))).toBe(false);
		expect(seen).toEqual([
			{ path: at('a.rs'), verb: 'write' },
			{ path: at('b.rs'), verb: 'create' }
		]);
	});

	it('a file interceptor reads the change through diff', async () => {
		const diffs: FileChange[] = [];
		const engine = await engineOf({
			intercept: [
				{
					async file(change, next) {
						diffs.push(change.diff());
						await next();
					}
				}
			]
		});
		await engine.write(at('a.rs'), engine.parse('fn a() {}\n'));
		expect(diffs).toEqual([{ path: at('a.rs'), before: undefined, after: 'fn a() {}\n' }]);
		expect(readFileSync(at('a.rs'), 'utf8')).toBe('fn a() {}\n');
	});

	it.each(['then', 'asyncDispose'] as const)('commits once when a render interceptor reaches the same pending through %s', async (entry) => {
		let pending: Pending | undefined;
		let reentered = false;
		const engine = await engineOf({
			intercept: [
				{
					render(_, next) {
						if (!reentered && pending !== undefined) {
							reentered = true;
							void (entry === 'then' ? pending.then(() => undefined) : pending[Symbol.asyncDispose]());
						}
						return next();
					}
				}
			]
		});
		pending = engine.create(at('a.rs'), () => engine.parse('fn a() {}\n'));
		await pending;
		expect(reentered).toBe(true);
		expect(readFileSync(at('a.rs'), 'utf8')).toBe('fn a() {}\n');
	});

	it('a file interceptor approves the text the commit writes', async () => {
		let renders = 0;
		let approved: string | undefined;
		const engine = await engineOf({
			intercept: [
				{
					render: (_, next) => `${next()}// render ${++renders}\n`,
					async file(change, next) {
						approved = change.diff().after;
						await next();
					}
				}
			]
		});
		await engine.write(at('a.rs'), engine.parse('fn a() {}\n'));
		expect(approved).toBe('fn a() {}\n// render 1\n');
		expect(readFileSync(at('a.rs'), 'utf8')).toBe(approved);
	});

	it("refuses a file interceptor's next and diff once its commit is done", async () => {
		let kept: { next: () => Promise<void>; diff: () => FileChange } | undefined;
		const engine = await engineOf({
			intercept: [
				{
					async file(change, next) {
						kept = { next, diff: () => change.diff() };
					}
				}
			]
		});
		await engine.create(at('a.rs'), () => engine.parse('fn a() {}\n'));
		await expect(kept!.next()).rejects.toThrow(/create of .*a\.rs is done/);
		expect(() => kept!.diff()).toThrow(/create of .*a\.rs is done/);
		expect(existsSync(at('a.rs'))).toBe(false);
	});

	it('finishes a write a file interceptor started before the interceptor threw', async () => {
		const engine = await engineOf({
			intercept: [
				{
					file(_, next) {
						void next();
						throw new Error('file hook failed');
					}
				}
			]
		});
		const make = (build: BuildSurface<RustAPI, 'default'>) => build.sourceFile({ statements: [...engine.parse('fn a() {}\n').statements()] } as never);
		await expect(engine.create(at('a.rs'), make)).rejects.toThrow('file hook failed');
		expect(readFileSync(at('a.rs'), 'utf8')).toBe('fn a() {}\n');
	});

	it.each(['write', 'create'] as const)('a %s a file interceptor started and left rejects when it fails', async (verb) => {
		const engine = await engineOf({
			intercept: [
				{
					async file(_, next) {
						void next();
					}
				}
			]
		});
		const root = () => engine.parse('fn a() {}\n');
		const pending = verb === 'write' ? engine.write(directory, root()) : engine.create(directory, root);
		await expect(pending).rejects.toThrow(verb === 'write' ? /not a regular file/ : /exists/);
	});

	it.each(['write', 'create'] as const)('a %s a delayed file interceptor started rejects when it fails', async (verb) => {
		const engine = await engineOf({
			intercept: [
				{
					async file(_, next) {
						void next();
						await settled();
					}
				}
			]
		});
		const root = () => engine.parse('fn a() {}\n');
		const pending = verb === 'write' ? engine.write(directory, root()) : engine.create(directory, root);
		await expect(pending).rejects.toThrow(verb === 'write' ? /not a regular file/ : /exists/);
	});

	it('waits for a downstream file interceptor an upstream one started and left', async () => {
		const order: string[] = [];
		const engine = await engineOf({
			intercept: [
				{
					async file(_, next) {
						void next();
						order.push('outer returned');
					}
				},
				{
					async file(_, next) {
						await settled();
						await next();
						order.push('inner wrote');
					}
				}
			]
		});
		const make = (build: BuildSurface<RustAPI, 'default'>) => build.sourceFile({ statements: [...engine.parse('fn a() {}\n').statements()] } as never);
		await engine.create(at('a.rs'), make);
		expect(order).toEqual(['outer returned', 'inner wrote']);
		expect(readFileSync(at('a.rs'), 'utf8')).toBe('fn a() {}\n');
		await expect(engine.create(directory, make)).rejects.toThrow(/exists/);
	});

	it('a file interceptor that catches a failed write still leaves the pending rejected', async () => {
		const engine = await engineOf({
			intercept: [
				{
					async file(_, next) {
						await next().catch(() => undefined);
					}
				}
			]
		});
		await expect(engine.write(directory, engine.parse('fn a() {}\n'))).rejects.toThrow(/not a regular file/);
	});

	it('a write under a render interceptor writes the intercepted text', async () => {
		const engine = await engineOf({ intercept: [{ render: (_, next) => next().toUpperCase() }] });
		const root = engine.parse('fn a() {}\n');
		await engine.write(at('a.rs'), root);
		expect(readFileSync(at('a.rs'), 'utf8')).toBe('FN A() {}\n');
		expect(readFileSync(at('a.rs'), 'utf8')).toBe(engine.render(root).toString());
	});
});

describe.each(['object', 'arena'] as const)('a root built for a create or a render is released when done (%s)', (nodeStorage) => {
	async function engineOf(): Promise<Engine<RustAPI>> {
		const engine = await createEngine(rust, { nodeStorage });
		engines.push(engine);
		return engine;
	}

	const builtRoot = (engine: Engine<RustAPI>, build: BuildSurface<RustAPI, 'default'>) =>
		build.sourceFile({ statements: [...engine.parse('fn a() {}\n').statements()] } as never);

	function expectReleased(engine: Engine<RustAPI>, kept: unknown): void {
		if (nodeStorage === 'arena') expect(() => engine.render(kept as never).toString()).toThrow(/was released/);
		else expect(engine.render(kept as never).toString()).toBe('fn a() {}\n');
	}

	it('create releases the root it built once its pending commits', async () => {
		const engine = await engineOf();
		let kept: unknown;
		const created = engine.create(join(directory, 'a.rs'), (build) => (kept = builtRoot(engine, build)));
		expect(engine.render(kept as never).toString()).toBe('fn a() {}\n');
		await created;
		expect(readFileSync(join(directory, 'a.rs'), 'utf8')).toBe('fn a() {}\n');
		expectReleased(engine, kept);
	});

	it('create releases the root it built once its pending is disposed', async () => {
		const engine = await engineOf();
		let kept: unknown;
		{
			await using _ = engine.create(join(directory, 'a.rs'), (build) => (kept = builtRoot(engine, build)));
		}
		expectReleased(engine, kept);
	});

	it('create releases the root it built when a file interceptor skips the write', async () => {
		const engine = await createEngine(rust, { nodeStorage, intercept: [{ file: async () => undefined }] });
		engines.push(engine);
		let kept: unknown;
		await engine.create(join(directory, 'a.rs'), (build) => (kept = builtRoot(engine, build)));
		expect(existsSync(join(directory, 'a.rs'))).toBe(false);
		expectReleased(engine, kept);
	});

	it('a render of a build callback releases what it built once its handle is disposed', async () => {
		const engine = await engineOf();
		let kept: unknown;
		const rendered = engine.render((build) => (kept = builtRoot(engine, build)));
		expect(rendered.toString()).toBe('fn a() {}\n');
		expect(engine.render(kept as never).toString()).toBe('fn a() {}\n');
		rendered[Symbol.dispose]();
		expectReleased(engine, kept);
	});

	const live = (engine: Engine<RustAPI>): number => engine.diagnostics.builtMemory?.()?.live ?? 0;
	const failing = (verb: 'create' | 'render', engine: Engine<RustAPI>, fn: (build: BuildSurface<RustAPI, 'default'>) => void) => () => {
		const run = (build: BuildSurface<RustAPI, 'default'>): never => {
			fn(build);
			throw new Error('callback failed');
		};
		return verb === 'create' ? engine.create(join(directory, 'a.rs'), run) : engine.render(run);
	};

	it.each(['create', 'render'] as const)('a %s whose build callback throws releases what the callback built', async (verb) => {
		const engine = await engineOf();
		const start = live(engine);
		const call = failing(verb, engine, (build) => {
			builtRoot(engine, build);
			build.identifier('stray');
		});
		for (let round = 0; round < 3; round++) expect(call).toThrow('callback failed');
		expect(live(engine)).toBe(start);
		expect(existsSync(join(directory, 'a.rs'))).toBe(false);
	});

	it.each(['create', 'render'] as const)('a node a throwing %s callback placed into what it built goes with it', async (verb) => {
		const engine = await engineOf();
		const start = live(engine);
		const outer = engine.build.expressionStatement.withSemi(engine.build.identifier('a'));
		expect(failing(verb, engine, (build) => build.sourceFile({ statements: [outer] } as never))).toThrow('callback failed');
		expect(live(engine)).toBe(start);
		if (nodeStorage === 'arena') expect(() => engine.render(outer).toString()).toThrow(/was released/);
		else expect(engine.render(outer).toString()).toBe('a;');
	});

	it.each(['create', 'render'] as const)('a %s callback that throws after disposing a nested render keeps its own error and holds nothing', async (verb) => {
		const engine = await engineOf();
		const start = live(engine);
		const outer = engine.build.expressionStatement.withSemi(engine.build.identifier('a'));
		const call = failing(verb, engine, (build) => {
			engine.render((inner) => inner.sourceFile({ statements: [outer] } as never))[Symbol.dispose]();
			build.sourceFile({});
		});
		expect(call).toThrow('callback failed');
		expect(live(engine)).toBe(start);
	});

	it.each(['create', 'render'] as const)('a node a scope opened before a throwing %s kept is held once, by that scope', async (verb) => {
		const engine = await engineOf();
		const start = live(engine);
		let outer: ReturnType<Engine<RustAPI>['build']['expressionStatement']['withSemi']>;
		{
			using scope = engine.scope();
			outer = engine.build.expressionStatement.withSemi(engine.build.identifier('a'));
			const call = failing(verb, engine, (build) => {
				build.sourceFile({ statements: [outer] } as never);
				scope.keep(outer);
			});
			expect(call).toThrow('callback failed');
		}
		expect(engine.render(outer).toString()).toBe('a;');
		engine.release(outer);
		expect(live(engine)).toBe(start);
	});

	it('a build callback inside a running build is refused in arena storage, as engine.scope() is', async () => {
		const seen: string[] = [];
		const engine: Engine<RustAPI> = await createEngine(rust, {
			nodeStorage,
			intercept: [
				{
					build(call, next) {
						if (call.path[0] === 'expressionStatement') {
							const rendered = engine.render((build) => build.identifier('seen'));
							seen.push(rendered.toString());
							rendered[Symbol.dispose]();
						}
						return next();
					}
				}
			]
		});
		engines.push(engine);
		const built = () => engine.render(engine.build.expressionStatement.withSemi(engine.build.identifier('a'))).toString();
		if (nodeStorage === 'arena') {
			expect(built).toThrow(/build callback .*while a build is running/);
			expect(seen).toEqual([]);
		} else {
			expect(built()).toBe('a;');
			expect(seen).toEqual(['seen']);
		}
	});

	type Scope = ReturnType<Engine<RustAPI>['scope']>;

	it.each(['create', 'render'] as const)('a scope a throwing %s callback left open closes, and the callback holds nothing once it has', async (verb) => {
		const engine = await engineOf();
		const start = live(engine);
		let escaped: Scope | undefined;
		{
			using _enclosing = engine.scope();
			const call = failing(verb, engine, (build) => {
				escaped = engine.scope();
				build.sourceFile({});
			});
			expect(call).toThrow('callback failed');
			escaped![Symbol.dispose]();
		}
		expect(live(engine)).toBe(start);
	});

	it.each(['create', 'render'] as const)('a scope a returning %s callback left open closes, and what it kept is released when done', async (verb) => {
		const engine = await engineOf();
		const start = live(engine);
		let escaped: Scope | undefined;
		{
			using _enclosing = engine.scope();
			const make = (build: BuildSurface<RustAPI, 'default'>) => {
				escaped = engine.scope();
				return escaped.keep(builtRoot(engine, build));
			};
			if (verb === 'create') {
				const created = engine.create(join(directory, 'a.rs'), make);
				escaped![Symbol.dispose]();
				await created;
				expect(readFileSync(join(directory, 'a.rs'), 'utf8')).toBe('fn a() {}\n');
			} else {
				const rendered = engine.render(make);
				escaped![Symbol.dispose]();
				expect(rendered.toString()).toBe('fn a() {}\n');
				rendered[Symbol.dispose]();
			}
		}
		expect(live(engine)).toBe(start);
	});

	it('engine.scope() opens inside a build callback as well as before it', async () => {
		const engine = await engineOf();
		const inside = engine.render((build) => {
			using scope = engine.scope();
			return scope.keep(builtRoot(engine, build));
		});
		expect(inside.toString()).toBe('fn a() {}\n');
		inside[Symbol.dispose]();
		using scope = engine.scope();
		const before = engine.render((build) => scope.keep(builtRoot(engine, build)));
		expect(before.toString()).toBe('fn a() {}\n');
		before[Symbol.dispose]();
	});
});
