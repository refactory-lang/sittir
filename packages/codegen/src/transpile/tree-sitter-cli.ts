import { execFileSync, spawnSync, type StdioOptions } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { UNBOUND_ENV } from '../dsl/sittir-grammar.ts';

const require = createRequire(import.meta.url);

interface TreeSitterCliManifest {
	readonly path: string;
	readonly version: string;
	readonly bin: Readonly<Record<string, string>>;
}

function treeSitterCliManifest(): TreeSitterCliManifest {
	const path = require.resolve('tree-sitter-cli/package.json');
	const manifest: Omit<TreeSitterCliManifest, 'path'> = JSON.parse(readFileSync(path, 'utf8'));
	return { ...manifest, path };
}

function treeSitterCliPath(): string {
	const manifest = treeSitterCliManifest();
	return join(dirname(manifest.path), manifest.bin['tree-sitter']!);
}

export function treeSitterCliVersion(): string {
	return treeSitterCliManifest().version;
}

export function treeSitterCliEnv(
	requested: Readonly<Record<string, string>>,
	parent: NodeJS.ProcessEnv = process.env
): NodeJS.ProcessEnv {
	const { [UNBOUND_ENV]: _unbound, ...inherited } = parent;
	return { ...inherited, ...requested };
}

export function runTreeSitterCli(args: readonly string[], cwd: string, stdio: StdioOptions): void {
	execFileSync(process.execPath, [treeSitterCliPath(), ...args], { cwd, stdio, env: treeSitterCliEnv({}) });
}

export function runTreeSitterCliCapturing(
	args: readonly string[],
	cwd: string,
	env: Readonly<Record<string, string>> = {}
): { readonly status: number | null; readonly stderr: string } {
	const run = spawnSync(process.execPath, [treeSitterCliPath(), ...args], { cwd, encoding: 'utf8', maxBuffer: 1 << 28, env: treeSitterCliEnv(env) });
	if (run.error) throw run.error;
	process.stdout.write(run.stdout);
	return { status: run.status, stderr: run.stderr };
}

const NODE_FLOOR = (require('../../package.json') as { readonly engines: { readonly node: string } }).engines.node;

function versionParts(version: string): number[] {
	return version.replace(/^[v>=\s]+/, '').split('.').map(Number);
}

export function nodeFloorViolation(nodeVersion: string, floor: string = NODE_FLOOR): string | undefined {
	const have = versionParts(nodeVersion);
	const need = versionParts(floor);
	const index = need.findIndex((part, i) => (have[i] ?? 0) !== part);
	if (index === -1 || (have[index] ?? 0) > need[index]!) return undefined;
	return `tree-sitter runs grammar.sittir.ts with the \`node\` on PATH, which is ${nodeVersion}; stripping its TypeScript types needs node ${floor}`;
}

export function assertGrammarRuntimeFloor(): void {
	const violation = nodeFloorViolation(execFileSync('node', ['--version'], { encoding: 'utf8' }).trim());
	if (violation !== undefined) throw new Error(violation);
}
