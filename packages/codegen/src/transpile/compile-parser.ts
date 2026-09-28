import { existsSync, statSync, mkdirSync, copyFileSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { pruneOrphanedPlaceholderRules } from './prune-grammar-json.ts';
import { runTreeSitterCli } from './tree-sitter-cli.ts';
import { upstreamPackage } from '../grammars.ts';

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

	runTreeSitterCli(['generate'], sittirDir, 'pipe');
	pruneOrphanedPlaceholderRules(sittirDir);

	syncExternalScanner(grammarDir, sittirDir);

	runTreeSitterCli(['build', '--wasm', '-o', 'parser.wasm'], sittirDir, 'pipe');

	return wasmPath;
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
