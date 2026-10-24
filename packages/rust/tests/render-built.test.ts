import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { useRecordConstruction } from '@sittir/common/engine';
import { recordOf, treeOf, writeTrivia } from '@sittir/common/utils';
import { getActiveBackend } from '../src/backend.js';
import arena from '../src/arena.ts';

function addon() {
	const status = getActiveBackend();
	if (status.name !== 'native') throw new Error(`native backend unavailable: ${status.reason}`);
	return status.native;
}

function arenaEngine() {
	const native = new (addon().SittirEngine)();
	const { renderBuilt, builtTriviaSide, writeBuiltTriviaSide } = native;
	if (renderBuilt === undefined || builtTriviaSide === undefined || writeBuiltTriviaSide === undefined) throw new Error('the native addon was built without the arena feature');
	return { renderBuilt: renderBuilt.bind(native, native), builtTriviaSide: builtTriviaSide.bind(native), writeBuiltTriviaSide: writeBuiltTriviaSide.bind(native) };
}

const words = (...values: number[]) => new Uint32Array([0, ...values]);

describe('a built arena rendered natively', () => {
	it('borrows only typed arrays of their kind over an ordinary ArrayBuffer', () => {
		const native = arenaEngine();
		const shared = new Uint32Array(new SharedArrayBuffer(16));
		expect(() => native.renderBuilt([shared], [], 1, false, false)).toThrow(/a built arena chunk must be a Uint32Array over an ordinary ArrayBuffer/);
		expect(() => native.renderBuilt([new Uint8Array(16) as never], [], 1, false, false)).toThrow(/must be a Uint32Array/);
		expect(() => native.renderBuilt([[0, 1] as never], [], 1, false, false)).toThrow(/must be a Uint32Array/);
		expect(() => native.renderBuilt([words(1, 0)], [new Uint8Array(new SharedArrayBuffer(8))], 1, false, false)).toThrow(
			/a built arena chunk must be a Uint8Array over an ordinary ArrayBuffer/
		);
	});

	it('refuses words that are no record it admits', () => {
		const native = arenaEngine();
		expect(() => native.renderBuilt([words(1, 0)], [], 0, false, false)).toThrow(/record address 0 is not one a record writer writes/);
		expect(() => native.renderBuilt([words(60000, 0)], [], 1, false, false)).toThrow(/record kind 60000 is not one a record writer writes/);
		expect(() => native.renderBuilt([words(1, 0)], [], 9, false, false)).toThrow(/past what the arena wrote/);
	});

	it('reads and writes the sides of a built record by its address, refusing address 0', () => {
		const native = arenaEngine();
		expect(native.builtTriviaSide(5, 'leading')).toBeNull();
		native.writeBuiltTriviaSide(5, 'leading', [], [], []);
		expect(native.builtTriviaSide(5, 'leading')).toEqual([]);
		expect(native.builtTriviaSide(6, 'leading')).toBeNull();
		expect(() => native.builtTriviaSide(0, 'leading')).toThrow(/record address 0/);
		expect(() => native.writeBuiltTriviaSide(0, 'leading', [], [], [])).toThrow(/record address 0/);
		expect(() => native.builtTriviaSide(5, 'beside' as never)).toThrow();
	});

	it('refuses a side entry written as a record of a kind no side holds by record, at the native write', async () => {
		const records = await arena.createEngine();
		useRecordConstruction(records, await import('../src/factories/records.ts'));
		const b = records.build;
		const x = b.expressionStatement(b.identifier('x'));
		const z = b.expressionStatement(b.identifier('z'));
		expect(recordOf(z)).toBeTypeOf('number');
		expect(() => writeTrivia(x, { leading: [z as never] })).toThrow(/trivia entry kind/);
		expect(records.render(x).toString()).toBe('x;');
		records.dispose();
	});

	it.each([
		['objects', async () => arena.createEngine()],
		[
			'records',
			async () => {
				const engine = await arena.createEngine();
				useRecordConstruction(engine, await import('../src/factories/records.ts'));
				return engine;
			}
		]
	])('renders a node another engine of its language built with the sides that engine wrote, under its own options: %s', async (_, make) => {
		const noted = (engine: Awaited<ReturnType<typeof make>>, name: string, note: string) => {
			const b = engine.build;
			const statement = b.expressionStatement(b.identifier(name));
			statement.$trivia.leading(b.blockComment(b.blockCommentRegular(note)));
			return statement;
		};
		const [owner, renderer] = [await make(), await make()];
		const built = noted(owner, 'x', ' owner ');
		noted(renderer, 'y', ' renderer ');
		expect(renderer.render(built).toString()).toBe('/* owner */ x;');
		expect(owner.render(built).toString()).toBe('/* owner */ x;');
	});

	it("renders a built record with its builder's sides once nothing else names its builder", () => {
		// A collection can only be forced under `--expose-gc`, so the case runs
		// in a child process that reports the render before and after.
		const fixture = fileURLToPath(new URL('../../common/tests/fixtures/built-sides-release.mts', import.meta.url));
		const out = execFileSync(process.execPath, ['--expose-gc', '--import', 'tsx', fixture], {
			cwd: fileURLToPath(new URL('..', import.meta.url)),
			encoding: 'utf8',
			env: { ...process.env, SITTIR_BACKEND: 'native' }
		});
		expect(JSON.parse(out.trim().split('\n').at(-1) ?? '')).toEqual({ before: '/* its builder */ x;', after: '/* its builder */ x;' });
	}, 60_000);

	it('refuses a record that links a parsed tree that is not live, naming the tree', async () => {
		const records = await arena.createEngine();
		useRecordConstruction(records, await import('../src/factories/records.ts'));
		const parsed = records.parse('fn f() { g(); }').statements()[0] as unknown as { body(): unknown };
		const b = records.build;
		const fn = b.functionItem({ name: b.identifier('h'), parameters: b.parameters(), body: parsed.body() as never });
		const id = treeOf(parsed as object)?.id;
		if (id === undefined) throw new Error('a parsed tree has an id');
		addon().disposeTree(id);
		expect(() => records.render(fn).toString()).toThrow(new RegExp(`names tree ${id}, which is not live`));
		records.dispose();
	});
});
