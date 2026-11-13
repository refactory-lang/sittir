// A parsed tree's chunk crosses once, as its native memory: a later read's
// records, and the cells it rewrites to name them, appear in the same array.
import { describe, expect, it } from 'vitest';
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
