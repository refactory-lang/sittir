// A parsed tree's chunk crosses once, as its native memory: a later read's
// records, and the cells it rewrites to name them, appear in the same array.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEngine } from '@sittir/common';
import { nativeEngineOf } from '@sittir/common/engine';
import { getActiveBackend } from '../src/backend.js';

const SOURCE = 'fn f(a: u8) -> u8 { let b = a + 1; b * 2 }\nfn g(c: &str) { println!("{}", c); }\n';

function addon() {
	const status = getActiveBackend();
	if (status.name !== 'native') throw new Error(`native backend unavailable: ${status.reason}`);
	return status.native;
}

describe("a parsed tree's chunk", () => {
	it('crosses as one array over its native memory, which later reads fill in place, and refuses a chunk the arena does not hold', () => {
		const status = addon();
		const native = nativeEngineOf(status);
		const { readRecord, hydrateRecord, chunk: chunkOf } = native;
		if (readRecord === undefined || hydrateRecord === undefined || chunkOf === undefined) throw new Error('the native addon was built without the arena feature');
		const { treeId } = JSON.parse(native.parse(SOURCE)) as { treeId: number };
		const root = readRecord(treeId, 0, 1)!;
		const chunk = chunkOf(treeId, 0);
		const before = Array.from(chunk);
		expect(chunkOf(treeId, 0)).toBe(chunk);
		hydrateRecord(treeId, 0, Infinity);
		expect(Array.from(chunk).filter((word) => word !== 0).length).toBeGreaterThan(before.filter((word) => word !== 0).length);
		expect(Array.from(chunk).slice(root, root + 2)).toEqual(before.slice(root, root + 2));
		expect(before.some((word, at) => chunk[at] !== word)).toBe(true);
		expect(() => chunkOf(treeId, 99)).toThrow(`tree ${treeId}'s arena holds no chunk 99`);
		status.disposeTree(treeId);
		expect(chunk.length).toBe(0);
		native.dispose();
	});
});

describe('an arena tree read deeper', () => {
	afterEach(() => {
		vi.doUnmock('../src/backend.js');
		vi.resetModules();
	});

	it('asks for each chunk once', async () => {
		const requests: number[] = [];
		vi.doMock('../src/backend.js', async (importOriginal) => {
			const real = await importOriginal<typeof import('../src/backend.js')>();
			const status = real.getActiveBackend();
			if (status.name !== 'native') return real;
			const { chunk } = status.native;
			if (chunk === undefined) return real;
			const counted = {
				...status,
				native: {
					...status.native,
					chunk: (treeId: number, n: number) => {
						requests.push(n);
						return chunk(treeId, n);
					}
				}
			};
			return { ...real, getActiveBackend: () => counted };
		});
		const rust = (await import('../src/index.ts')).default;
		const rs = await createEngine(rust);
		const root = rs.parse(SOURCE);
		const rendered: string[] = [];
		for (const statement of root.statements()) {
			if (!rs.is.functionItem(statement)) throw new Error('not a function item');
			const body = statement.body();
			rendered.push(rs.render(statement.name()).toString(), rs.render(statement.parameters()).toString());
			for (const inner of body.statements()) rendered.push(rs.render(inner).toString());
		}
		expect(rendered).toEqual(['f', '(a: u8)', 'let b = a + 1;', 'g', '(c: &str)', 'println!("{}", c);']);
		expect(requests.length).toBeGreaterThan(0);
		expect(new Set(requests).size).toBe(requests.length);
		rs.dispose();
	});
});
