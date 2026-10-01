// The live trees of a language are held in one table, owned by the grammar's
// addon and not by an engine: every engine of the language resolves every
// tree, a tree outlives the engine that parsed it, and release is a function
// of the addon.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getActiveBackend } from '../src/backend.js';

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
