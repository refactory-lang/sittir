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
}

const WASM_TOOLCHAINS: readonly WasmToolchain[] = [
	{ name: 'wasi-sdk', pathEnv: 'TREE_SITTER_WASI_SDK_PATH' },
	{ name: 'binaryen', pathEnv: 'TREE_SITTER_BINARYEN_PATH' }
];

const TOOLCHAIN_VERSION_FILE = '.version';

const TOOLCHAIN_PROBE_GRAMMAR = "module.exports = grammar({ name: 'toolchain', rules: { source: () => 'x' } });\n";

export function treeSitterCacheDir(env: NodeJS.ProcessEnv = process.env, platform: NodeJS.Platform = process.platform, home: string = homedir()): string {
	if (platform === 'win32') return join(home, 'AppData', 'Local', 'tree-sitter');
	const xdg = env.XDG_CACHE_HOME;
	return join(xdg !== undefined && isAbsolute(xdg) ? xdg : join(home, '.cache'), 'tree-sitter');
}

function toolchainVersionFile(toolchain: WasmToolchain, env: NodeJS.ProcessEnv): string {
	return join(env[toolchain.pathEnv] ?? join(treeSitterCacheDir(env), toolchain.name), TOOLCHAIN_VERSION_FILE);
}

export function treeSitterToolchainIdentity(env: NodeJS.ProcessEnv = process.env): string {
	const toolchains = WASM_TOOLCHAINS.map((toolchain) => {
		const file = toolchainVersionFile(toolchain, env);
		return existsSync(file) ? `${toolchain.name} ${readFileSync(file, 'utf8').trim()}` : `${toolchain.name}: no ${file}`;
	});
	return [`tree-sitter-cli ${treeSitterCliVersion()}`, ...toolchains].join('\0');
}

function missingToolchainVersionFiles(env: NodeJS.ProcessEnv): string[] {
	return WASM_TOOLCHAINS.map((toolchain) => toolchainVersionFile(toolchain, env)).filter((file) => !existsSync(file));
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
	if (missingToolchainVersionFiles(env).length === 0) return;
	install();
	const missing = missingToolchainVersionFiles(env);
	if (missing.length > 0) {
		throw new Error(
			`tree-sitter's wasm toolchain has no version at ${missing.join(' or ')}, so the parsers it builds cannot be fingerprinted. ` +
				`tree-sitter writes it when it installs the toolchain; a toolchain named by TREE_SITTER_WASI_SDK_PATH or TREE_SITTER_BINARYEN_PATH needs its version written there.`
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
