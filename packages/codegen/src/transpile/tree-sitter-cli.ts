import { execFileSync, spawnSync, type StdioOptions } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir, tmpdir } from 'node:os';
import { dirname, isAbsolute, join } from 'node:path';
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

interface WasmToolchain {
	readonly name: string;
	readonly pathEnv: string;
	readonly executable: string;
}

const WASM_TOOLCHAINS: readonly WasmToolchain[] = [
	{ name: 'wasi-sdk', pathEnv: 'TREE_SITTER_WASI_SDK_PATH', executable: 'clang' },
	{ name: 'binaryen', pathEnv: 'TREE_SITTER_BINARYEN_PATH', executable: 'wasm-opt' }
];

const TOOLCHAIN_VERSION_FILE = '.version';

const TOOLCHAIN_PROBE_GRAMMAR = "module.exports = grammar({ name: 'toolchain', rules: { source: () => 'x' } });\n";

export function treeSitterCacheDir(env: NodeJS.ProcessEnv = process.env, platform: NodeJS.Platform = process.platform, home: string = homedir()): string {
	if (platform === 'win32') return join(home, 'AppData', 'Local', 'tree-sitter');
	const xdg = env.XDG_CACHE_HOME;
	return join(xdg !== undefined && isAbsolute(xdg) ? xdg : join(home, '.cache'), 'tree-sitter');
}

interface ToolchainSource {
	readonly path: string;
	readonly read: () => string | undefined;
}

function toolchainSource(toolchain: WasmToolchain, env: NodeJS.ProcessEnv): ToolchainSource {
	const named = env[toolchain.pathEnv];
	if (named !== undefined) {
		const path = join(named, 'bin', process.platform === 'win32' ? `${toolchain.executable}.exe` : toolchain.executable);
		return { path, read: () => (existsSync(path) ? executableVersion(path) : undefined) };
	}
	const path = join(treeSitterCacheDir(env), toolchain.name, TOOLCHAIN_VERSION_FILE);
	return { path, read: () => (existsSync(path) ? readFileSync(path, 'utf8').trim() : undefined) };
}

function executableVersion(path: string): string {
	const run = spawnSync(path, ['--version'], { encoding: 'utf8' });
	if (run.error !== undefined || run.status !== 0) return `${path} --version failed`;
	return run.stdout.split('\n')[0]!.trim();
}

export function treeSitterToolchain(env: NodeJS.ProcessEnv = process.env): readonly string[] {
	const toolchains = WASM_TOOLCHAINS.map((toolchain) => {
		const source = toolchainSource(toolchain, env);
		const version = source.read();
		return version === undefined ? `${toolchain.name}: no ${source.path}` : `${toolchain.name} ${version}`;
	});
	return [`tree-sitter-cli ${treeSitterCliVersion()}`, ...toolchains];
}

export function treeSitterToolchainIdentity(env: NodeJS.ProcessEnv = process.env): string {
	return treeSitterToolchain(env).join('\0');
}

function missingToolchains(env: NodeJS.ProcessEnv): { readonly named: string[]; readonly cached: string[] } {
	const named: string[] = [];
	const cached: string[] = [];
	for (const toolchain of WASM_TOOLCHAINS) {
		const { path } = toolchainSource(toolchain, env);
		if (existsSync(path)) continue;
		(env[toolchain.pathEnv] === undefined ? cached : named).push(path);
	}
	return { named, cached };
}

export function wasmToolchainInstalled(env: NodeJS.ProcessEnv = process.env): boolean {
	const { named, cached } = missingToolchains(env);
	return named.length === 0 && cached.length === 0;
}

function installWasmToolchain(): void {
	const dir = mkdtempSync(join(tmpdir(), 'sittir-wasm-toolchain-'));
	try {
		writeFileSync(join(dir, 'grammar.js'), TOOLCHAIN_PROBE_GRAMMAR);
		runTreeSitterCli(['generate'], dir, 'inherit');
		runTreeSitterCli(['build', '--wasm', '-o', 'toolchain.wasm'], dir, 'inherit');
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

export function ensureWasmToolchain(env: NodeJS.ProcessEnv = process.env, install: () => void = installWasmToolchain): void {
	if (wasmToolchainInstalled(env)) return;
	const before = missingToolchains(env);
	if (before.named.length > 0) {
		throw new Error(`tree-sitter's wasm toolchain is named by TREE_SITTER_WASI_SDK_PATH or TREE_SITTER_BINARYEN_PATH, but ${before.named.join(' and ')} does not exist.`);
	}
	install();
	const missing = missingToolchains(env).cached;
	if (missing.length > 0) {
		throw new Error(
			`tree-sitter's wasm toolchain has no version at ${missing.join(' or ')}, so the parsers it builds cannot be fingerprinted. ` +
				`tree-sitter writes it when it installs the toolchain.`
		);
	}
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
