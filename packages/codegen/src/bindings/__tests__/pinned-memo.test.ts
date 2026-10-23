import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pinnedMemo } from '../pinned-memo.ts';

let dir: string;
beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), 'pinned-memo-'));
});
afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

const sha256Hex = (text: string) => createHash('sha256').update(text).digest('hex');
const entryFile = (root: string, mode: string, input: string) => join(root, mode, `${sha256Hex(input)}.json`);

describe('a pinned read is memoised by pin, mode, input and reader', () => {
	it('the first read runs once and returns its value; the second returns it with no further call', async () => {
		const run = vi.fn(async () => 'value-1');
		const memo = pinnedMemo(dir, 'reader-A');
		expect(await memo.read('mode', 'input', run)).toBe('value-1');
		expect(await memo.read('mode', 'input', run)).toBe('value-1');
		expect(run).toHaveBeenCalledTimes(1);
	});

	it.each([
		['the pin (dir)', (d: string) => ({ dir: join(d, 'other-pin'), mode: 'mode', input: 'input', reader: 'reader-A' })],
		['the mode', () => ({ dir, mode: 'other-mode', input: 'input', reader: 'reader-A' })],
		['the input', () => ({ dir, mode: 'mode', input: 'other-input', reader: 'reader-A' })],
		['the reader', () => ({ dir, mode: 'mode', input: 'input', reader: 'reader-B' })]
	])('changing %s alone calls run again', async (_label, changed) => {
		const run = vi.fn(async () => 'v');
		await pinnedMemo(dir, 'reader-A').read('mode', 'input', run);
		const next = changed(dir);
		await pinnedMemo(next.dir, next.reader).read(next.mode, next.input, run);
		expect(run).toHaveBeenCalledTimes(2);
	});

	it('a changed reader rewrites the slot, so the old reader misses again', async () => {
		const run = vi.fn(async () => 'v');
		await pinnedMemo(dir, 'reader-B').read('mode', 'input', run);
		await pinnedMemo(dir, 'reader-A').read('mode', 'input', run);
		expect(run).toHaveBeenCalledTimes(2);
		await pinnedMemo(dir, 'reader-B').read('mode', 'input', run);
		expect(run).toHaveBeenCalledTimes(3);
		expect(JSON.parse(readFileSync(entryFile(dir, 'mode', 'input'), 'utf8'))).toEqual({
			reader: 'reader-B',
			value: 'v'
		});
	});

	it.each([
		['garbage', 'not json at all'],
		['truncated JSON', '{"reader":"reader-A","val'],
		['null', 'null'],
		['42', '42'],
		['an object without value', '{"reader":"reader-A"}']
	])('an entry that is %s is a miss and is rewritten', async (_label, bytes) => {
		const file = entryFile(dir, 'mode', 'input');
		mkdirSync(join(dir, 'mode'), { recursive: true });
		writeFileSync(file, bytes);
		const run = vi.fn(async () => 'fresh');
		expect(await pinnedMemo(dir, 'reader-A').read('mode', 'input', run)).toBe('fresh');
		expect(run).toHaveBeenCalledTimes(1);
		expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({ reader: 'reader-A', value: 'fresh' });
	});

	it('a rejecting run propagates its error and leaves no entry', async () => {
		const run = vi.fn(async () => {
			throw new Error('child failed');
		});
		await expect(pinnedMemo(dir, 'reader-A').read('mode', 'input', run)).rejects.toThrow('child failed');
		expect(() => readFileSync(entryFile(dir, 'mode', 'input'), 'utf8')).toThrow();
	});
});
