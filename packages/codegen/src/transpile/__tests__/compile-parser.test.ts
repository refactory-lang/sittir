import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { join } from 'node:path';
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, statSync, utimesSync } from 'node:fs';
import { compileParser } from '../compile-parser.ts';

const packagesRoot = join(__dirname, '../../../../');
const realPythonSittir = join(packagesRoot, 'python', '.sittir');
const realGrammarJs = join(realPythonSittir, 'grammar.js');

// These tests exercise the REAL tree-sitter generate + wasm build — but
// against an isolated copy of python's .sittir, never the repo's own.
// `compileParser({ force: true })` rewrites `.sittir/src/grammar.json` in
// place over several seconds; doing that to the real directory mid-suite
// tears the file under any concurrent worker hashing it for
// generated-manifest verification, and `utimesSync` on the real grammar.js
// re-arms a regeneration on the next validator run.
//
// The copy lives under the repo's node_modules/.cache — NOT the OS tmpdir —
// because compileParser shells out to `npx tree-sitter` with the copy as
// cwd and grammar.js `require()`s the external base grammar
// (`tree-sitter-python/grammar.js`); both resolve by walking up to the
// repo's node_modules, which an OS-tmpdir copy can't reach.
const cacheRoot = join(packagesRoot, '..', 'node_modules', '.cache');
let tmpRoot: string;
let pythonDir: string;
let grammarJs: string;

beforeAll(() => {
	if (!existsSync(realGrammarJs)) return;
	mkdirSync(cacheRoot, { recursive: true });
	tmpRoot = mkdtempSync(join(cacheRoot, 'sittir-compile-parser-'));
	pythonDir = join(tmpRoot, 'python');
	cpSync(realPythonSittir, join(pythonDir, '.sittir'), { recursive: true });
	grammarJs = join(pythonDir, '.sittir', 'grammar.js');
});

afterAll(() => {
	if (tmpRoot) rmSync(tmpRoot, { recursive: true, force: true });
});

describe('compileParser', () => {
	it.skipIf(!existsSync(realGrammarJs))(
		'produces parser.wasm from .sittir/grammar.js',
		async () => {
			const wasmPath = await compileParser(pythonDir, { force: true });
			expect(wasmPath).toContain('parser.wasm');
			expect(existsSync(wasmPath)).toBe(true);
			const stat = statSync(wasmPath);
			expect(stat.size).toBeGreaterThan(100_000);
		},
		60_000
	);

	it.skipIf(!existsSync(realGrammarJs))(
		'reuses cached WASM when grammar.js is unchanged',
		async () => {
			const wasmPath1 = await compileParser(pythonDir);
			const mtime1 = statSync(wasmPath1).mtimeMs;
			const wasmPath2 = await compileParser(pythonDir);
			const mtime2 = statSync(wasmPath2).mtimeMs;
			expect(mtime1).toBe(mtime2);
		},
		60_000
	);

	it.skipIf(!existsSync(realGrammarJs))(
		'recompiles when grammar.js is newer than cached WASM',
		async () => {
			const wasmPath = await compileParser(pythonDir);
			const mtime1 = statSync(wasmPath).mtimeMs;

			// Touch grammar.js to make it newer
			const now = new Date();
			utimesSync(grammarJs, now, now);

			const wasmPath2 = await compileParser(pythonDir);
			const mtime2 = statSync(wasmPath2).mtimeMs;
			expect(mtime2).toBeGreaterThan(mtime1);
		},
		60_000
	);

	it('throws when .sittir/grammar.js is missing', async () => {
		const fakeDir = join(packagesRoot, 'nonexistent');
		await expect(compileParser(fakeDir)).rejects.toThrow(/grammar\.js/);
	});

	it.skipIf(!existsSync(realGrammarJs))(
		'produces node-types.json alongside parser.wasm',
		async () => {
			await compileParser(pythonDir);
			const nodeTypes = join(pythonDir, '.sittir', 'src', 'node-types.json');
			expect(existsSync(nodeTypes)).toBe(true);
		},
		60_000
	);

	it.skipIf(!existsSync(realGrammarJs))(
		'warm-cache path completes in <500ms',
		async () => {
			await compileParser(pythonDir);
			const start = performance.now();
			await compileParser(pythonDir);
			const elapsed = performance.now() - start;
			expect(elapsed).toBeLessThan(500);
		},
		60_000
	);
});
