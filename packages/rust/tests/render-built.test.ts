import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { useRecordConstruction } from '@sittir/common/engine';
import { treeOf, writeTrivia } from '@sittir/common/utils';
import { getActiveBackend } from '../src/backend.js';
import arena from '../src/arena.ts';

function addon() {
	const status = getActiveBackend();
	if (status.name !== 'native') throw new Error(`native backend unavailable: ${status.reason}`);
	return status.native;
}

function arenaEngine() {
	const native = new (addon().SittirEngine)();
	const { renderBuilt, builtTriviaSide, writeBuiltTriviaSide, holdBuiltArena } = native;
	if (renderBuilt === undefined || builtTriviaSide === undefined || writeBuiltTriviaSide === undefined || holdBuiltArena === undefined)
		throw new Error('the native addon was built without the arena feature');
	const written = (chunks: readonly { readonly length: number }[]) => new Uint32Array(chunks.map((chunk) => chunk.length));
	return {
		hold: (words: readonly Uint32Array[], bytes: readonly Uint8Array[] = [], writtenWords = written(words)) =>
			holdBuiltArena.call(native, words, bytes, writtenWords, written(bytes)),
		renderBuilt: (address: number) => renderBuilt.call(native, native, address, null, false, false),
		dispose: () => native.dispose(),
		builtTriviaSide: builtTriviaSide.bind(native),
		writeBuiltTriviaSide: writeBuiltTriviaSide.bind(native)
	};
}

const words = (...values: number[]) => new Uint32Array([0, ...values]);

const recordEngine = async () => {
	const engine = await arena.createEngine();
	useRecordConstruction(engine, await import('../src/factories/records.ts'));
	return engine;
};

describe('a built arena rendered natively', () => {
	it('borrows only typed arrays of their kind over an ordinary ArrayBuffer', () => {
		const native = arenaEngine();
		native.hold([new Uint32Array(new SharedArrayBuffer(16))]);
		expect(() => native.renderBuilt(1)).toThrow(/a built arena chunk must be a Uint32Array over an ordinary ArrayBuffer/);
		native.hold([new Uint8Array(16) as never]);
		expect(() => native.renderBuilt(1)).toThrow(/must be a Uint32Array/);
		native.hold([[0, 1] as never]);
		expect(() => native.renderBuilt(1)).toThrow(/must be a Uint32Array/);
		native.hold([words(1, 0)], [new Uint8Array(new SharedArrayBuffer(8))]);
		expect(() => native.renderBuilt(1)).toThrow(/a built arena chunk must be a Uint8Array over an ordinary ArrayBuffer/);
		native.hold([words(1, 0)], [], [3] as never);
		expect(() => native.renderBuilt(1)).toThrow(/written table/);
	});

	it('refuses words that are no record it admits', () => {
		const native = arenaEngine();
		native.hold([words(1, 0)]);
		expect(() => native.renderBuilt(0)).toThrow(/record address 0 is not one a record writer writes/);
		expect(() => native.renderBuilt(9)).toThrow(/past what the arena wrote/);
		native.hold([words(60000, 0)]);
		expect(() => native.renderBuilt(1)).toThrow(/record kind 60000 is not one a record writer writes/);
	});

	it('refuses, by name, a render from an arena its engine let go of', () => {
		const native = arenaEngine();
		expect(() => native.renderBuilt(1)).toThrow(/the arena that built a side's record was released/);
		native.hold([words(1, 0)]);
		native.dispose();
		expect(() => native.renderBuilt(1)).toThrow(/the arena that built a side's record was released/);
	});

	it("refuses, by name, a record in a side once the engine that built it is disposed, and renders the rest after", async () => {
		const [owner, renderer] = [await recordEngine(), await recordEngine()];
		const b = owner.build;
		const noted = b.expressionStatement(b.identifier('x'));
		noted.$trivia.leading(b.blockComment(b.blockCommentRegular(' owner ')));
		expect(renderer.render(noted).toString()).toBe('/* owner */ x;');
		owner.dispose();
		expect(() => renderer.render(noted).toString()).toThrow(/the arena that built a side's record was released/);
		expect(renderer.render(renderer.build.expressionStatement(renderer.build.identifier('y'))).toString()).toBe('y;');
	});

	it('reads and writes the sides of a built record by its address, refusing address 0', () => {
		const native = arenaEngine();
		expect(native.builtTriviaSide(5, 'leading')).toBeNull();
		native.writeBuiltTriviaSide(5, 'leading', []);
		expect(native.builtTriviaSide(5, 'leading')).toEqual([]);
		expect(native.builtTriviaSide(6, 'leading')).toBeNull();
		expect(() => native.builtTriviaSide(0, 'leading')).toThrow(/record address 0/);
		expect(() => native.writeBuiltTriviaSide(0, 'leading', [])).toThrow(/record address 0/);
		expect(() => native.builtTriviaSide(5, 'beside' as never)).toThrow();
	});

	it.each([
		['objects', async () => arena.createEngine()],
		['records', recordEngine]
	])('refuses at the render, as its trivia type names it, a node of a kind no side holds: %s', async (_, make) => {
		const engine = await make();
		const b = engine.build;
		const x = b.expressionStatement(b.identifier('x'));
		const z = b.expressionStatement(b.identifier('z'));
		writeTrivia(x, { leading: [z as never] });
		expect(() => engine.render(x).toString()).toThrow(new RegExp(`unknown kind id ${z.$type} in TriviaNode`));
		expect(engine.render(b.expressionStatement(b.identifier('y'))).toString()).toBe('y;');
		engine.dispose();
	});

	it.each([
		['objects', async () => arena.createEngine()],
		['records', recordEngine]
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
