import { existsSync, mkdirSync, copyFileSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { runTreeSitterCli } from './tree-sitter-cli.ts';
import { upstreamPackage } from '../grammars.ts';

export function buildParserWasm(grammarDir: string): string {
	const sittirDir = join(grammarDir, '.sittir');
	syncExternalScanner(grammarDir, sittirDir);
	runTreeSitterCli(['build', '--wasm', '-o', 'parser.wasm'], sittirDir, 'pipe');
	return join(sittirDir, 'parser.wasm');
}

export function ensureParserWasm(grammarDir: string): { readonly wasmPath: string; readonly built: boolean } {
	const wasmPath = join(grammarDir, '.sittir', 'parser.wasm');
	if (existsSync(wasmPath)) return { wasmPath, built: false };
	return { wasmPath: buildParserWasm(grammarDir), built: true };
}

function syncExternalScanner(grammarDir: string, sittirDir: string): void {
	const sittirScanner = join(sittirDir, 'src', 'scanner.c');
	if (existsSync(sittirScanner)) return;

	const grammarName = grammarDir.split('/').pop() ?? '';
	const candidates = [
		join(grammarDir, 'node_modules', upstreamPackage(grammarName), 'src', 'scanner.c'),
		join(grammarDir, 'node_modules', upstreamPackage(grammarName), grammarName, 'src', 'scanner.c')
	];
	const baseScanner = candidates.find((p) => existsSync(p));
	if (!baseScanner) return;

	mkdirSync(dirname(sittirScanner), { recursive: true });
	copyFileSync(baseScanner, sittirScanner);
	copyRelativeScannerIncludes(baseScanner, sittirScanner);
}

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
