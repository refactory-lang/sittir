import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { appendFileSync, cpSync, existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Language, Parser } from 'web-tree-sitter';
import { buildUpstreamWasm, ensureParserWasm, upstreamKeyOf, withUpstreamGrammar } from '../compile-parser.ts';

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

	it('leaves a present parser.wasm untouched', () => {
		const wasmPath = join(pythonDir, '.sittir', 'parser.wasm');
		expect(existsSync(wasmPath)).toBe(true);
		const before = statSync(wasmPath).mtimeMs;
		expect(ensureParserWasm(pythonDir)).toEqual({ wasmPath, built: false });
		expect(statSync(wasmPath).mtimeMs).toBe(before);
	});
});
