import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { cellFormatOf } from '@sittir/common/engine';
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
