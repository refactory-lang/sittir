import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { useRecordConstruction } from '@sittir/common/engine';
import { snapshotOf, treeHandleOf, treeOf, writeTrivia } from '@sittir/common/utils';
import { sideEntryOf } from '../../common/src/built-arena.ts';
import { builtRefOf, leafSitesOf } from '../../common/src/built-ref.ts';
import { getActiveBackend } from '../src/backend.js';
import arena from '../src/arena.ts';
import { TSKindId } from '../src/kinds.ts';

function addon() {
	const status = getActiveBackend();
	if (status.name !== 'native') throw new Error(`native backend unavailable: ${status.reason}`);
	return status.native;
}

function arenaEngine() {
	const native = new (addon().SittirEngine)();
	const { renderBuilt, renderBuiltLeaf, builtTriviaSide, writeBuiltTriviaSide, holdBuiltArena } = native;
	if (
		renderBuilt === undefined ||
		renderBuiltLeaf === undefined ||
		builtTriviaSide === undefined ||
		writeBuiltTriviaSide === undefined ||
		holdBuiltArena === undefined
	)
		throw new Error('the native addon was built without the arena feature');
	const written = (chunks: readonly { readonly length: number }[]) => new Uint32Array(chunks.map((chunk) => chunk.length));
	return {
		hold: (words: readonly Uint32Array[], bytes: readonly Uint8Array[] = [], writtenWords = written(words)) =>
			holdBuiltArena.call(native, words, bytes, writtenWords, written(bytes)),
		renderBuilt: (address: number) => renderBuilt.call(native, native, address, false, false),
		renderBuiltLeaf: (kind: number, text: { readonly at: number; readonly len: number }) => renderBuiltLeaf.call(native, native, kind, text, null, false, false),
		dispose: () => native.dispose(),
		builtTriviaSide: builtTriviaSide.bind(native),
		writeBuiltTriviaSide: writeBuiltTriviaSide.bind(native)
	};
}

const words = (...values: number[]) => new Uint32Array([0, ...values]);

const writtenEntry = (node: object) => sideEntryOf(node, builtRefOf(node)!.arena, builtRefOf(node)!.arena.engine)!;

const recordEngine = async () => {
	const engine = await arena.createEngine();
	useRecordConstruction(engine, await import('../src/factories/records.ts'));
	return engine;
};

describe('a built arena rendered natively', () => {
	it('borrows only typed arrays of their kind over an ordinary ArrayBuffer, each when the render first reads it', () => {
		const native = arenaEngine();
		native.hold([new Uint32Array(new SharedArrayBuffer(16))]);
		expect(() => native.renderBuilt(1)).toThrow(/a built arena chunk must be a Uint32Array over an ordinary ArrayBuffer/);
		native.hold([new Uint8Array(16) as never]);
		expect(() => native.renderBuilt(1)).toThrow(/must be a Uint32Array/);
		native.hold([[0, 1] as never]);
		expect(() => native.renderBuilt(1)).toThrow(/must be a Uint32Array/);
		native.hold([words(TSKindId.Identifier, 0)], [new Uint8Array(new SharedArrayBuffer(8))]);
		expect(() => native.renderBuiltLeaf(TSKindId.Identifier, { at: 0, len: 1 })).toThrow(/a built arena chunk must be a Uint8Array over an ordinary ArrayBuffer/);
		native.hold([words(1, 0)], [], [3] as never);
		expect(() => native.renderBuilt(1)).toThrow(/written table/);
	});

	it('borrows no chunk the render does not read', () => {
		const native = arenaEngine();
		native.hold([words(TSKindId.Identifier, 0), new Uint32Array(new SharedArrayBuffer(16))], [new TextEncoder().encode('x'), new Uint8Array(new SharedArrayBuffer(8))]);
		expect(native.renderBuiltLeaf(TSKindId.Identifier, { at: 0, len: 1 })).toBe('x');
	});

	it('admits a lone leaf by its kind and its text', () => {
		const native = arenaEngine();
		native.hold([words(1, 0)], [new TextEncoder().encode('x')]);
		expect(() => native.renderBuiltLeaf(60000, { at: 0, len: 1 })).toThrow(/built leaf kind 60000/);
		expect(() => native.renderBuiltLeaf(TSKindId.Identifier, { at: 0, len: 9 })).toThrow();
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

	it('writes a side of a built leaf at each site it names, refusing holder 0 and anything but triples before writing any', async () => {
		const rs = await recordEngine();
		const b = rs.build;
		const x = b.identifier('x');
		const statement = b.expressionStatement(x);
		const [holder, word, item] = leafSitesOf(x)!;
		const arena = builtRefOf(x)!.arena;
		const entry = writtenEntry(b.blockComment(b.blockCommentRegular(' c ')));
		expect(() => arena.writeLeafSide([holder!, word!, item!, 0, word!, item!], 'leading', [entry])).toThrow(/record address 0/);
		expect(() => arena.writeLeafSide([holder!, word!], 'leading', [entry])).toThrow(/triples/);
		expect(rs.render(statement).toString()).toBe('x;');
		arena.writeLeafSide([holder!, word!, item!], 'leading', [entry]);
		expect(rs.render(statement).toString()).toBe('/* c */ x;');
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

	describe('a built record in a side of a node its own engine holds', () => {
		type Engine = Awaited<ReturnType<typeof recordEngine>>;
		type Statement = { $trivia: { trailing(...items: unknown[]): readonly unknown[] } };
		const statementOf = (engine: Engine) => {
			const parsed = engine.parse('fn f() {\n    g();\n}\n');
			return { parsed, statement: (parsed.statements()[0] as unknown as { body(): { statements(): readonly Statement[] } }).body().statements()[0]! };
		};
		const holders = async (make: () => Promise<Engine>) => {
			const engine = await make();
			const { parsed, statement } = statementOf(engine);
			const built = engine.build.expressionStatement(engine.build.identifier('x'));
			const comment = engine.build.blockComment(engine.build.blockCommentRegular(' c '));
			statement.$trivia.trailing(comment);
			built.$trivia.trailing(comment);
			return { engine, parsed, statement, built, comment };
		};
		const rendered = async (make: () => Promise<Engine>) => {
			const { engine, parsed, built } = await holders(make);
			return { parsed: engine.render(parsed).toString(), built: engine.render(built).toString() };
		};

		it('renders where the side renders, on records as on objects', async () => {
			const objects = await rendered(async () => arena.createEngine());
			expect(objects).toEqual({ parsed: 'fn f() {\n    g(); /* c */\n}\n', built: 'x; /* c */' });
			expect(await rendered(recordEngine)).toEqual(objects);
		});

		it("reads back as its builder's node", async () => {
			const { statement, built, comment } = await holders(recordEngine);
			expect(statement.$trivia.trailing()[0]).toBe(comment);
			expect(built.$trivia.trailing()[0]).toBe(comment);
		});

		it("refuses by name another engine's record, in a parsed and a built holder", async () => {
			const [builder, holder] = [await recordEngine(), await recordEngine()];
			const comment = builder.build.blockComment(builder.build.blockCommentRegular(' c '));
			const refusal = "cannot write another engine's record into a side: a side holds only records its holder's engine built";
			expect(() => holder.build.expressionStatement(holder.build.identifier('x')).$trivia.trailing(comment)).toThrow(refusal);
			expect(() => statementOf(holder).statement.$trivia.trailing(comment)).toThrow(refusal);
		});

		it('refuses in a side of an object node, whose engine builds no records', async () => {
			const comment = (await recordEngine()).build.blockComment(' c ');
			const objects = await arena.createEngine();
			const statement = objects.build.expressionStatement(objects.build.identifier('x'));
			expect(() => statement.$trivia.trailing(comment)).toThrow('a side names a built record, and its engine builds no records');
			expect(() => statementOf(objects).statement.$trivia.trailing(comment)).toThrow('a side names a built record, and its engine builds no records');
		});

		it("reads back as its builder's node from a parsed unit's side", async () => {
			const engine = await recordEngine();
			const block = (engine.parse('fn f() {\n    ;\n    x();\n}\n').statements()[0] as unknown as { body(): object }).body();
			const comment = engine.build.blockComment(engine.build.blockCommentRegular(' c '));
			const tree = treeOf(block)!;
			const holderRow = treeHandleOf(block)! % 2 ** 32;
			const written = [writtenEntry(comment)];
			const unitRow = [1, 2, 3].map((n) => holderRow + n).find((row) => {
				tree.writeTriviaSide!(row, 'leading', written);
				return (tree.unitSides!(holderRow) as readonly unknown[]).length > 0 || (tree.writeTriviaSide!(row, 'leading', []), false);
			});
			expect(unitRow).toBeDefined();
			expect((tree.unitSides!(holderRow) as readonly { leading: readonly unknown[] }[])[0]!.leading).toEqual([comment]);
			expect(JSON.stringify(snapshotOf(block))).toContain('" c "');
		});
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
