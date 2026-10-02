// The live trees of a language are held in one table, owned by the grammar's
// addon and not by an engine: every engine of the language resolves every
// tree, a tree outlives the engine that parsed it, and release is a function
// of the addon.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { getActiveBackend } from '../src/backend.js';
import rust from '../src/index.ts';

function addon() {
	const status = getActiveBackend();
	if (status.name !== 'native') throw new Error(`native backend unavailable: ${status.reason}`);
	return status.native;
}

/** The id of the tree a raw native read retained, from the JSON it returns. */
const treeIdOf = (read: string): number => (JSON.parse(read) as { treeId: number }).treeId;

describe('the live tree table of a language', () => {
	it('is one table for every engine of the addon', () => {
		const native = addon();
		const before = native.liveTreeCount();
		const a = new native.SittirEngine();
		const b = new native.SittirEngine();
		const first = treeIdOf(a.parseAndRead('fn a() {}'));
		const second = treeIdOf(b.parseAndRead('fn b() {}'));
		expect(native.liveTreeCount()).toBe(before + 2);
		expect(JSON.parse(b.readRoot(first))).toBeDefined();
		native.disposeTree(first);
		native.disposeTree(second);
		expect(native.liveTreeCount()).toBe(before);
	});

	it('keeps its trees when the engine that parsed them is disposed', () => {
		const native = addon();
		const before = native.liveTreeCount();
		const a = new native.SittirEngine();
		const id = treeIdOf(a.parseAndRead('fn kept() {}'));
		a.dispose();
		expect(native.liveTreeCount()).toBe(before + 1);
		expect(JSON.parse(new native.SittirEngine().readRoot(id))).toBeDefined();
		native.disposeTree(id);
		expect(native.liveTreeCount()).toBe(before);
	});

	it('ignores a nonsense tree id and a repeated release', () => {
		const native = addon();
		const id = treeIdOf(new native.SittirEngine().parseAndRead('fn a() {}'));
		const held = native.liveTreeCount();
		// `as` saturates, so an unchecked cast would turn both of these into
		// 0 — a tree id, and a live one when it is the thread's first parse.
		native.disposeTree(Number.NaN);
		native.disposeTree(-1);
		expect(native.liveTreeCount()).toBe(held);
		native.disposeTree(id);
		native.disposeTree(id);
		expect(native.liveTreeCount()).toBe(held - 1);
	});

	it('keeps a tree while a parsed object names it and releases it after', () => {
		// A collection can only be forced under `--expose-gc`, so the cases
		// run in a child process that reports what the addon still holds.
		const fixture = fileURLToPath(new URL('../../common/tests/fixtures/tree-release.mts', import.meta.url));
		const out = execFileSync(process.execPath, ['--expose-gc', '--import', 'tsx', fixture], {
			cwd: fileURLToPath(new URL('..', import.meta.url)),
			encoding: 'utf8',
			env: { ...process.env, SITTIR_BACKEND: 'native' }
		});
		expect(JSON.parse(out.trim().split('\n').at(-1) ?? '')).toEqual({
			before: 'g + y',
			heldCount: 1,
			after: 'g + y',
			droppedCount: 1,
			orphanCount: 2,
			afterOrphanCount: 1
		});
	}, 60_000);
});

describe('rendering parts parsed by other engines of the language', () => {
	type Named = { name(): never; $with: { name(value: unknown): never }; $render(): string };
	const itemOf = (engine: { parse(source: string): { statements(): readonly unknown[] } }, source: string) =>
		engine.parse(source).statements()[0] as Named;

	it('renders a node built around a part another engine parsed, through either engine', async () => {
		const a = await createEngine(rust);
		const b = await createEngine(rust);
		const mixed = a.build.binaryExpression({
			left: itemOf(b, 'fn f() {}\n').name(),
			operator: '+',
			right: a.build.identifier('y')
		});
		expect(String(a.render(mixed))).toBe('f + y');
		expect(String(b.render(mixed))).toBe('f + y');
	});

	it('renders a parsed node edited to hold a part another engine parsed', async () => {
		const a = await createEngine(rust);
		const b = await createEngine(rust);
		const edited = itemOf(a, 'fn g() {}\n').$with.name(itemOf(b, 'fn f() {}\n').name());
		expect(String(a.render(edited))).toBe('fn f() {}');
	});

	it('renders parts of several engines in one node', async () => {
		const [a, b, c] = await Promise.all([createEngine(rust), createEngine(rust), createEngine(rust)]);
		const both = a.build.binaryExpression({
			left: itemOf(b, 'fn f() {}\n').name(),
			operator: '+',
			right: itemOf(c, 'fn g() {}\n').name()
		});
		expect(String(a.render(both))).toBe('f + g');
		expect(both.$render()).toBe('f + g');
	});

	it('renders a node whose parsing engine is disposed, while its own $render still refuses', async () => {
		const a = await createEngine(rust);
		const b = await createEngine(rust);
		const item = itemOf(b, 'fn real() {}');
		b.dispose();
		expect(String(a.render(item as never))).toBe('fn real() {}');
		expect(() => item.$render()).toThrow(/engine disposed.*engine\.render\(node\)/);
	});
});

describe('the tree table across threads and processes', () => {
	const fixture = (name: string): string =>
		fileURLToPath(new URL(`../../common/tests/fixtures/${name}`, import.meta.url));
	const REFUSAL = /another tree table.*parse the source on this thread/;
	const reply = <T>(worker: Worker): Promise<T> =>
		new Promise((resolve, reject) => {
			worker.once('message', resolve);
			worker.once('error', reject);
		});

	it('gives each worker thread its own table and its own tree ids', async () => {
		const native = addon();
		const mine = treeIdOf(new native.SittirEngine().parseAndRead('fn main_thread() {}'));
		const held = native.liveTreeCount();
		const worker = new Worker(fixture('tree-worker.mjs'), {
			workerData: { addon: fileURLToPath(new URL('../native/index.cjs', import.meta.url)) }
		});
		expect(await reply(worker)).toEqual({ before: 0, after: 1, treeId: 0 });
		expect(native.liveTreeCount()).toBe(held);
		native.disposeTree(mine);
	});

	it('refuses read data cloned in from another thread', async () => {
		const engine = await createEngine(rust);
		const leaf = (engine.parse('fn f() {}\n').statements()[0] as unknown as { name(): object }).name();
		const worker = new Worker(fixture('tree-clone-worker.mts'), {
			workerData: { leaf: { ...leaf } },
			execArgv: ['--import', 'tsx']
		});
		const message = await reply<{ rendered?: string; error?: string }>(worker);
		expect(message.rendered).toBeUndefined();
		expect(message.error).toMatch(REFUSAL);
	}, 60_000);

	it('refuses read data copied in from another process', () => {
		// Every process counts its tree ids from 0 and its main thread is
		// thread 0, so both match between the two child processes here.
		const run = (name: string, ...args: string[]): string =>
			execFileSync(process.execPath, ['--import', 'tsx', fixture(name), ...args], {
				cwd: fileURLToPath(new URL('..', import.meta.url)),
				encoding: 'utf8',
				env: { ...process.env, SITTIR_BACKEND: 'native' }
			})
				.trim()
				.split('\n')
				.at(-1) ?? '';
		const leaf = run('tree-leaf-process.mts');
		const message = JSON.parse(run('tree-leaf-receiver.mts', leaf)) as { rendered?: string; error?: string };
		expect(message.rendered).toBeUndefined();
		expect(message.error).toMatch(REFUSAL);
	}, 60_000);
});
