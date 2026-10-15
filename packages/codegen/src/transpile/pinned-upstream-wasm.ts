import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { runTreeSitterCli } from './tree-sitter-cli.ts';

const CONFLICTS_ANCHOR = '    conflicts: ($, previous) => previous.concat([\n';
const GENERATION_CONFLICTS = ['[$.primary_expression, $.variable_declarator]', '[$.assignment_expression, $._initializer]'];

const built = new Map<string, string>();

export function pinnedTypescriptWasmPath(from: string, cacheRoot: string): string {
	const manifestPath = createRequire(from).resolve('tree-sitter-typescript/package.json');
	if (!built.has(manifestPath)) built.set(manifestPath, buildPinned(manifestPath, cacheRoot));
	return built.get(manifestPath)!;
}

function buildPinned(manifestPath: string, cacheRoot: string): string {
	const upstreamRequire = createRequire(manifestPath);
	const packageDir = dirname(realpathSync(manifestPath));
	const baseDir = dirname(realpathSync(upstreamRequire.resolve('tree-sitter-javascript/package.json')));
	const version = (path: string): string => JSON.parse(readFileSync(path, 'utf8')).version;
	const cache = join(cacheRoot, `sittir-pinned-typescript-${version(manifestPath)}-js${version(join(baseDir, 'package.json'))}`);
	const wasm = join(cache, 'tree-sitter-typescript.wasm');
	if (existsSync(wasm)) return wasm;

	mkdirSync(cache, { recursive: true });
	const staging = mkdtempSync(join(cache, 'build-'));
	const copy = join(staging, 'pkg');
	cpSync(packageDir, copy, { recursive: true, dereference: true });
	mkdirSync(join(copy, 'node_modules'), { recursive: true });
	symlinkSync(baseDir, join(copy, 'node_modules', 'tree-sitter-javascript'));

	const definePath = join(copy, 'common', 'define-grammar.js');
	const defined = readFileSync(definePath, 'utf8');
	if (!defined.includes(CONFLICTS_ANCHOR)) throw new Error('define-grammar.js no longer declares conflicts the way the pinned-upstream build patches');
	writeFileSync(definePath, defined.replace(CONFLICTS_ANCHOR, CONFLICTS_ANCHOR + GENERATION_CONFLICTS.map((pair) => `      ${pair},\n`).join('')));

	const buildDir = join(copy, 'typescript');
	runTreeSitterCli(['generate'], buildDir, 'pipe');
	const staged = join(staging, 'tree-sitter-typescript.wasm');
	runTreeSitterCli(['build', '--wasm', '-o', staged], buildDir, 'pipe');
	renameSync(staged, wasm);
	rmSync(staging, { recursive: true, force: true });
	return wasm;
}
