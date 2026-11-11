import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import rust, { type RustAPI } from '@sittir/rust';
import type { BuildSurface, Engine, EngineOptions, FileChange } from '@sittir/types';
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
		const make = (build: BuildSurface<RustAPI, 'default'>) => build.sourceFile({ statements: [...engine.parse('fn a() {}\n').statements()] } as never) as never;
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
		const created = engine.create(join(directory, 'a.rs'), (build) => (kept = builtRoot(engine, build)) as never);
		expect(engine.render(kept as never).toString()).toBe('fn a() {}\n');
		await created;
		expect(readFileSync(join(directory, 'a.rs'), 'utf8')).toBe('fn a() {}\n');
		expectReleased(engine, kept);
	});

	it('create releases the root it built once its pending is disposed', async () => {
		const engine = await engineOf();
		let kept: unknown;
		{
			await using _ = engine.create(join(directory, 'a.rs'), (build) => (kept = builtRoot(engine, build)) as never);
		}
		expectReleased(engine, kept);
	});

	it('create releases the root it built when a file interceptor skips the write', async () => {
		const engine = await createEngine(rust, { nodeStorage, intercept: [{ file: async () => undefined }] });
		engines.push(engine);
		let kept: unknown;
		await engine.create(join(directory, 'a.rs'), (build) => (kept = builtRoot(engine, build)) as never);
		expect(existsSync(join(directory, 'a.rs'))).toBe(false);
		expectReleased(engine, kept);
	});

	it('a render of a build callback releases what it built once its handle is disposed', async () => {
		const engine = await engineOf();
		let kept: unknown;
		const rendered = engine.render((build) => (kept = builtRoot(engine, build)) as never);
		expect(rendered.toString()).toBe('fn a() {}\n');
		expect(engine.render(kept as never).toString()).toBe('fn a() {}\n');
		rendered[Symbol.dispose]();
		expectReleased(engine, kept);
	});
});
