import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, copyFileSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runTreeSitterCli, treeSitterCliVersion } from './tree-sitter-cli.ts';
import { UPSTREAM_WASM, upstreamPackage } from '../grammars.ts';
import { BASE_ENTRY } from '../grammar-shapes/emit-grammar-shape.ts';

const UPSTREAM_KEY = 'upstream.json';

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

export function withUpstreamGrammar<T>(grammarDir: string, use: (dir: string, scannerFiles: readonly string[]) => T): T {
	const work = mkdtempSync(join(tmpdir(), 'sittir-upstream-'));
	try {
		const dir = join(work, 'upstream', 'grammar');
		mkdirSync(dir, { recursive: true });
		writeFileSync(join(dir, 'grammar.js'), `export { default } from ${JSON.stringify(pathToFileURL(join(grammarDir, BASE_ENTRY)).href)};\n`);
		for (const file of ['package.json', 'tree-sitter.json']) copyFileSync(join(grammarDir, '.sittir', file), join(dir, file));
		return use(dir, syncExternalScanner(grammarDir, dir));
	} finally {
		rmSync(work, { recursive: true, force: true });
	}
}

export function upstreamKeyOf(dir: string, scannerFiles: readonly string[]): string {
	runTreeSitterCli(['generate', '--no-parser'], dir, 'pipe');
	const hash = createHash('sha256').update(treeSitterCliVersion()).update(readFileSync(join(dir, 'src', 'grammar.json')));
	for (const file of [...scannerFiles].sort()) hash.update(relative(dir, file)).update(readFileSync(file));
	return hash.digest('hex');
}

export function buildUpstreamWasm(grammarDir: string, out: string): string {
	const wasmPath = resolve(out);
	withUpstreamGrammar(grammarDir, (dir) => {
		runTreeSitterCli(['generate'], dir, 'pipe');
		runTreeSitterCli(['build', '--wasm', '-o', wasmPath], dir, 'pipe');
	});
	return wasmPath;
}

export function ensureUpstreamWasm(grammarDir: string): { readonly wasmPath: string; readonly built: boolean } {
	const sittirDir = join(grammarDir, '.sittir');
	const wasmPath = join(sittirDir, UPSTREAM_WASM);
	const keyPath = join(sittirDir, UPSTREAM_KEY);
	const recorded = existsSync(keyPath) ? (JSON.parse(readFileSync(keyPath, 'utf8')) as { key?: string }).key : undefined;
	return withUpstreamGrammar(grammarDir, (dir, scannerFiles) => {
		const key = upstreamKeyOf(dir, scannerFiles);
		if (key === recorded && existsSync(wasmPath)) return { wasmPath, built: false };
		runTreeSitterCli(['generate'], dir, 'pipe');
		runTreeSitterCli(['build', '--wasm', '-o', wasmPath], dir, 'pipe');
		writeFileSync(keyPath, `${JSON.stringify({ key }, null, '\t')}\n`);
		return { wasmPath, built: true };
	});
}

function syncExternalScanner(grammarDir: string, targetDir: string): readonly string[] {
	const targetScanner = join(targetDir, 'src', 'scanner.c');
	if (existsSync(targetScanner)) return [];

	const grammarName = grammarDir.split('/').pop() ?? '';
	const candidates = [
		join(grammarDir, 'node_modules', upstreamPackage(grammarName), 'src', 'scanner.c'),
		join(grammarDir, 'node_modules', upstreamPackage(grammarName), grammarName, 'src', 'scanner.c')
	];
	const baseScanner = candidates.find((p) => existsSync(p));
	if (!baseScanner) return [];

	mkdirSync(dirname(targetScanner), { recursive: true });
	copyFileSync(baseScanner, targetScanner);
	return [targetScanner, ...copyRelativeScannerIncludes(baseScanner, targetScanner)];
}

function copyRelativeScannerIncludes(baseScanner: string, sittirScanner: string, copied: string[] = []): readonly string[] {
	const src = readFileSync(baseScanner, 'utf8');
	const includeRe = /#include\s+"([^"]+)"/g;
	for (const match of src.matchAll(includeRe)) {
		const incPath = match[1]!;
		if (!incPath.includes('/') || incPath.startsWith('tree_sitter/')) continue;
		const baseInc = resolve(dirname(baseScanner), incPath);
		if (!existsSync(baseInc)) continue;
		const sittirInc = resolve(dirname(sittirScanner), incPath);
		if (copied.includes(sittirInc)) continue;
		mkdirSync(dirname(sittirInc), { recursive: true });
		copyFileSync(baseInc, sittirInc);
		copied.push(sittirInc);
		copyRelativeScannerIncludes(baseInc, sittirInc, copied);
	}
	return copied;
}
