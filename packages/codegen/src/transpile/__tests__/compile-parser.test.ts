import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Language, Parser } from 'web-tree-sitter';
import { buildUpstreamWasm, ensureParserWasm, readUpstreamRecord, upstreamKeyOf, withUpstreamGrammar, writeUpstreamRecord } from '../compile-parser.ts';
import { treeSitterToolchain } from '../tree-sitter-cli.ts';

const realPythonDir = join(__dirname, '../../../../', 'python');
const realPythonSittir = join(realPythonDir, '.sittir');

let tmpRoot: string;
let pythonDir: string;

beforeAll(() => {
	tmpRoot = mkdtempSync(join(tmpdir(), 'sittir-compile-parser-'));
	pythonDir = join(tmpRoot, 'python');
	cpSync(realPythonSittir, join(pythonDir, '.sittir'), { recursive: true });
	rmSync(join(pythonDir, '.sittir', 'parser.wasm'));
});

afterAll(() => {
	rmSync(tmpRoot, { recursive: true, force: true });
});

describe('ensureParserWasm', () => {
	it('builds parser.wasm from the generated sources when it is missing', () => {
		const { wasmPath, built } = ensureParserWasm(pythonDir);
		expect(built).toBe(true);
		expect(wasmPath).toBe(join(pythonDir, '.sittir', 'parser.wasm'));
		expect(statSync(wasmPath).size).toBeGreaterThan(100_000);
	}, 120_000);

	it('builds the upstream parser from the grammar the package exports, the same parser its published wasm is', async () => {
		const built = buildUpstreamWasm(realPythonDir, join(tmpRoot, 'upstream.wasm'));
		const published = createRequire(join(realPythonDir, 'package.json')).resolve('tree-sitter-python/tree-sitter-python.wasm');
		await Parser.init();
		const treeOf = async (wasm: string, source: string): Promise<string> => {
			const parser = new Parser();
			parser.setLanguage(await Language.load(wasm));
			return parser.parse(source)!.rootNode.toString();
		};
		for (const source of ['x = 1\n', 'def f(a, /, b, *, c=1, d):\n    return a\n', 'match p:\n    case [x, *_]: pass\n', 'f"{x!r:>{w}}"\n'])
			expect(await treeOf(built, source)).toBe(await treeOf(published, source));
	}, 300_000);

	it("keys the upstream judge on every scanner file it stages, a header the scanner includes among them", () => {
		withUpstreamGrammar(join(realPythonDir, '..', 'typescript'), (dir, scannerFiles) => {
			const header = scannerFiles.find((file) => file.endsWith(join('common', 'scanner.h')));
			expect(header).toBeDefined();
			const before = upstreamKeyOf(dir, scannerFiles);
			appendFileSync(header!, '\n// changed\n');
			expect(upstreamKeyOf(dir, scannerFiles)).not.toBe(before);
		});
	}, 300_000);

	it('keys the upstream judge on the version of each wasm toolchain that builds it', () => {
		const cache = mkdtempSync(join(tmpdir(), 'sittir-toolchain-'));
		const version = (name: string, value: string): void => {
			mkdirSync(join(cache, 'tree-sitter', name), { recursive: true });
			writeFileSync(join(cache, 'tree-sitter', name, '.version'), value);
		};
		vi.stubEnv('XDG_CACHE_HOME', cache);
		vi.stubEnv('TREE_SITTER_WASI_SDK_PATH', undefined);
		vi.stubEnv('TREE_SITTER_BINARYEN_PATH', undefined);
		try {
			version('wasi-sdk', '34.0');
			version('binaryen', '132');
			withUpstreamGrammar(realPythonDir, (dir, scannerFiles) => {
				const before = upstreamKeyOf(dir, scannerFiles);
				version('binaryen', '133');
				expect(upstreamKeyOf(dir, scannerFiles)).not.toBe(before);
			});
		} finally {
			vi.unstubAllEnvs();
			rmSync(cache, { recursive: true, force: true });
		}
	}, 300_000);

	it('hashes the toolchain list its record names into the key', () => {
		withUpstreamGrammar(realPythonDir, (dir, scannerFiles) => {
			const toolchain = treeSitterToolchain();
			expect(upstreamKeyOf(dir, scannerFiles, toolchain)).toBe(upstreamKeyOf(dir, scannerFiles));
			expect(upstreamKeyOf(dir, scannerFiles, [...toolchain.slice(0, -1), 'binaryen 999'])).not.toBe(upstreamKeyOf(dir, scannerFiles, toolchain));
		});
	}, 300_000);

	it('reads back the upstream record it writes, and nothing where none is', () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-upstream-record-'));
		try {
			expect(readUpstreamRecord(dir)).toBeUndefined();
			writeUpstreamRecord(dir, { key: 'k', toolchain: ['tree-sitter-cli 1', 'wasi-sdk 2', 'binaryen 3'] });
			expect(readUpstreamRecord(dir)).toEqual({ key: 'k', toolchain: ['tree-sitter-cli 1', 'wasi-sdk 2', 'binaryen 3'] });
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('leaves a present parser.wasm untouched', () => {
		const wasmPath = join(pythonDir, '.sittir', 'parser.wasm');
		expect(existsSync(wasmPath)).toBe(true);
		const before = statSync(wasmPath).mtimeMs;
		expect(ensureParserWasm(pythonDir)).toEqual({ wasmPath, built: false });
		expect(statSync(wasmPath).mtimeMs).toBe(before);
	});
});
