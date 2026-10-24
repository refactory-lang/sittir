import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readerDigest } from '../pinned-memo.ts';

let root: string;
beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), 'reader-digest-'));
	writeFileSync(join(root, 'a.ts'), "import './b.ts';\nexport const a = 1;\n");
	writeFileSync(join(root, 'b.ts'), 'export const b = 1;\n');
	writeFileSync(join(root, 'outside.ts'), 'export const o = 1;\n');
	writeFileSync(join(root, 'extra.txt'), 'input one\n');
	mkdirSync(join(root, 'sub'), { recursive: true });
});
afterEach(() => {
	rmSync(root, { recursive: true, force: true });
});

describe('readerDigest covers the module closure and the extra inputs', () => {
	it('is the same on two calls with unchanged files', () => {
		expect(readerDigest(root, 'a.ts', ['extra.txt'])).toBe(readerDigest(root, 'a.ts', ['extra.txt']));
	});

	it('moves when a module in the closure changes', () => {
		const before = readerDigest(root, 'a.ts', ['extra.txt']);
		writeFileSync(join(root, 'b.ts'), 'export const b = 2;\n');
		expect(readerDigest(root, 'a.ts', ['extra.txt'])).not.toBe(before);
	});

	it('moves when an extra input changes', () => {
		const before = readerDigest(root, 'a.ts', ['extra.txt']);
		writeFileSync(join(root, 'extra.txt'), 'input two\n');
		expect(readerDigest(root, 'a.ts', ['extra.txt'])).not.toBe(before);
	});

	it('stays when a file outside the closure changes', () => {
		const before = readerDigest(root, 'a.ts', ['extra.txt']);
		writeFileSync(join(root, 'outside.ts'), 'export const o = 2;\n');
		expect(readerDigest(root, 'a.ts', ['extra.txt'])).toBe(before);
	});
});
