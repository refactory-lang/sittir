import { existsSync, statSync, mkdirSync, copyFileSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';

export interface CompileOptions {
	force?: boolean;
}

export async function compileParser(grammarDir: string, options?: CompileOptions): Promise<string> {
	const sittirDir = join(grammarDir, '.sittir');
	const grammarJs = join(sittirDir, 'grammar.js');
	const wasmPath = join(sittirDir, 'parser.wasm');

	if (!existsSync(grammarJs)) {
		throw new Error(
			`compileParser: no .sittir/grammar.js at ${grammarJs}. ` +
				`Run the transpile step first (codegen --grammar <name>).`
		);
	}

	if (!options?.force && existsSync(wasmPath)) {
		const grammarMtime = statSync(grammarJs).mtimeMs;
		const wasmMtime = statSync(wasmPath).mtimeMs;
		if (wasmMtime > grammarMtime) {
			return wasmPath;
		}
	}

	execFileSync('npx', ['tree-sitter', 'generate'], {
		cwd: sittirDir,
		stdio: 'pipe'
	});

	syncExternalScanner(grammarDir, sittirDir);

	execFileSync('npx', ['tree-sitter', 'build', '--wasm', '-o', 'parser.wasm'], {
		cwd: sittirDir,
		stdio: 'pipe'
	});

	return wasmPath;
}

function syncExternalScanner(grammarDir: string, sittirDir: string): void {
	const sittirScanner = join(sittirDir, 'src', 'scanner.c');
	if (existsSync(sittirScanner)) return;

	const grammarName = grammarDir.split('/').pop() ?? '';
	const candidates = [
		join(grammarDir, 'node_modules', `tree-sitter-${grammarName}`, 'src', 'scanner.c'),
		join(grammarDir, 'node_modules', `tree-sitter-${grammarName}`, grammarName, 'src', 'scanner.c')
	];
	const baseScanner = candidates.find((p) => existsSync(p));
	if (!baseScanner) return;

	mkdirSync(dirname(sittirScanner), { recursive: true });
	copyFileSync(baseScanner, sittirScanner);
	copyRelativeScannerIncludes(baseScanner, sittirScanner);
}

/**
 * Mirrors any header the scanner reaches via a relative `#include "..."`
 * alongside the copied scanner, at the same relative position from the new
 * .sittir/src/scanner.c location. Same-directory includes and tree-sitter's
 * own runtime headers are already resolvable and don't need copying.
 */
function copyRelativeScannerIncludes(baseScanner: string, sittirScanner: string): void {
	const src = readFileSync(baseScanner, 'utf8');
	const includeRe = /#include\s+"([^"]+)"/g;
	for (const match of src.matchAll(includeRe)) {
		const incPath = match[1]!;
		if (!incPath.includes('/') || incPath.startsWith('tree_sitter/')) continue;
		const baseInc = resolve(dirname(baseScanner), incPath);
		if (!existsSync(baseInc)) continue;
		const sittirInc = resolve(dirname(sittirScanner), incPath);
		mkdirSync(dirname(sittirInc), { recursive: true });
		copyFileSync(baseInc, sittirInc);
	}
}
