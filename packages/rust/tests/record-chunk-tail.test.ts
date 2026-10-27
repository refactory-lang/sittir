// A parsed tree's chunk crosses as the words past those a reader holds:
// records only append to a chunk, so the words before `from` never change.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEngine } from '@sittir/common';
import { getActiveBackend } from '../src/backend.js';

const SOURCE = 'fn f(a: u8) -> u8 { let b = a + 1; b * 2 }\nfn g(c: &str) { println!("{}", c); }\n';

type Chunked = { chunk(treeId: number, n: number, from: number): Uint32Array };

function addon() {
	const status = getActiveBackend();
	if (status.name !== 'native') throw new Error(`native backend unavailable: ${status.reason}`);
	return status.native;
}

describe("a parsed tree's chunk", () => {
	it('crosses from word `from` on, and refuses a `from` past its words or a chunk the arena does not hold', () => {
		const native = new (addon().SittirEngine)();
		const { readRecord, hydrateRecord } = native;
		if (readRecord === undefined || hydrateRecord === undefined) throw new Error('the native addon was built without the arena feature');
		const chunked = native as unknown as Chunked;
		const { treeId } = JSON.parse(native.parse(SOURCE)) as { treeId: number };
		readRecord.call(native, treeId, 0, 1);
		const before = chunked.chunk(treeId, 0, 0);
		hydrateRecord.call(native, treeId, 0, Infinity);
		const whole = chunked.chunk(treeId, 0, 0);
		expect(whole.length).toBeGreaterThan(before.length);
		expect([...whole.subarray(0, before.length)]).toEqual([...before]);
		expect([...chunked.chunk(treeId, 0, before.length)]).toEqual([...whole.subarray(before.length)]);
		expect(chunked.chunk(treeId, 0, whole.length)).toHaveLength(0);
		expect(() => chunked.chunk(treeId, 0, whole.length + 1)).toThrow(`tree ${treeId}'s chunk 0 holds ${whole.length} words, short of word ${whole.length + 1}`);
		expect(() => chunked.chunk(treeId, 99, 0)).toThrow(`tree ${treeId}'s arena holds no chunk 99`);
		native.dispose();
	});
});

describe('an arena tree read deeper', () => {
	afterEach(() => {
		vi.doUnmock('../src/backend.js');
		vi.resetModules();
	});

	it('asks for each chunk only the words past those it already holds', async () => {
		const requests: { n: number; from: number; words: number }[] = [];
		vi.doMock('../src/backend.js', async (importOriginal) => {
			const real = await importOriginal<typeof import('../src/backend.js')>();
			const status = real.getActiveBackend();
			if (status.name !== 'native') return real;
			const Real = status.native.SittirEngine;
			function Counting(this: unknown, ...args: ConstructorParameters<typeof Real>) {
				const inner = new Real(...args);
				const chunk = (inner as unknown as Chunked).chunk;
				(inner as unknown as Chunked).chunk = (treeId, n, from) => {
					const words = chunk.call(inner, treeId, n, from);
					requests.push({ n, from, words: words.length });
					return words;
				};
				return inner;
			}
			const counted = { ...status, native: { ...status.native, SittirEngine: Counting as unknown as typeof Real } };
			return { ...real, getActiveBackend: () => counted };
		});
		const rust = (await import('../src/index.ts')).default;
		const rs = await createEngine(rust, { nodeStorage: 'arena' });
		const root = rs.parse(SOURCE);
		const rendered: string[] = [];
		for (const statement of root.statements()) {
			if (!rs.is.functionItem(statement)) throw new Error('not a function item');
			const body = statement.body();
			rendered.push(rs.render(statement.name()).toString(), rs.render(statement.parameters()).toString());
			for (const inner of body.statements()) rendered.push(rs.render(inner).toString());
		}
		expect(rendered).toEqual(['f', '(a: u8)', 'let b = a + 1;', 'g', '(c: &str)', 'println!("{}", c);']);
		const held = new Map<number, number>();
		for (const { n, from, words } of requests) {
			expect(from).toBe(held.get(n) ?? 0);
			held.set(n, from + words);
		}
		expect(requests.some(({ from }) => from > 0)).toBe(true);
		rs.dispose();
	});
});
