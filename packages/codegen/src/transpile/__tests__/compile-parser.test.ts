import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { cpSync, existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { ensureParserWasm } from '../compile-parser.ts';

const realPythonSittir = join(__dirname, '../../../../', 'python', '.sittir');

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

	it('leaves a present parser.wasm untouched', () => {
		const wasmPath = join(pythonDir, '.sittir', 'parser.wasm');
		expect(existsSync(wasmPath)).toBe(true);
		const before = statSync(wasmPath).mtimeMs;
		expect(ensureParserWasm(pythonDir)).toEqual({ wasmPath, built: false });
		expect(statSync(wasmPath).mtimeMs).toBe(before);
	});
});
