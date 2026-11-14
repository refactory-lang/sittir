import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { REPO_ROOT } from '../grammars.ts';

export const BOOTSTRAP_PACKAGES = ['scm', 'typescript'] as const;

export type BootstrapPackage = (typeof BOOTSTRAP_PACKAGES)[number];

export const BOOTSTRAP_COMMAND = 'pnpm exec tsx packages/cli/src/cli.ts bootstrap';

export const BOOTSTRAP_DIR_ENV = 'SITTIR_BOOTSTRAP_DIR';

const COMPLETE = '.complete';

export const PIN_FILE = 'bootstrap.json';

export const PINNED_TYPES_CONFIG = join('scratchpad', 'pinned-types', 'tsconfig.json');

export function readPin(root: string = REPO_ROOT): string {
	const { sha } = JSON.parse(readFileSync(join(root, PIN_FILE), 'utf8')) as { sha?: unknown };
	if (typeof sha !== 'string' || !/^[0-9a-f]{40}$/.test(sha)) throw new Error(`${PIN_FILE}: "sha" must be a full commit hash`);
	return sha;
}

function mainCheckout(root: string): string {
	return dirname(execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: root, encoding: 'utf8' }).trim());
}

export function bootstrapDir(root: string = REPO_ROOT): string {
	return join(resolve(process.env[BOOTSTRAP_DIR_ENV] ?? join(mainCheckout(root), 'scratchpad', 'bootstrap')), readPin(root));
}

export function isBootstrapped(dir: string): boolean {
	const marker = join(dir, COMPLETE);
	if (!existsSync(marker)) return false;
	const built = new Set(readFileSync(marker, 'utf8').split(/\s+/));
	return BOOTSTRAP_PACKAGES.every((p) => built.has(p));
}

export function markBootstrapped(dir: string, sha: string): void {
	writeFileSync(join(dir, COMPLETE), `${sha}\n${BOOTSTRAP_PACKAGES.join(' ')}\n`);
}

export interface BootstrapStep {
	readonly command: string;
	readonly args: readonly string[];
	readonly cwd: string;
}

export function bootstrapSteps(sha: string, dir: string, root: string = REPO_ROOT): BootstrapStep[] {
	const pnpm = (...args: string[]): BootstrapStep => ({ command: 'pnpm', args, cwd: dir });
	return [
		{ command: 'git', args: ['-c', 'core.hooksPath=/dev/null', 'worktree', 'add', '--detach', dir, sha], cwd: root },
		pnpm('install', '--frozen-lockfile', '--prefer-offline'),
		pnpm('-C', 'packages/types', 'run', 'build'),
		pnpm('-C', 'packages/common', 'run', 'build'),
		...BOOTSTRAP_PACKAGES.map((p) => pnpm('-C', `packages/${p}`, 'run', 'build')),
		...BOOTSTRAP_PACKAGES.map((p) => pnpm('-C', `rust/crates/sittir-${p}`, 'run', 'build'))
	];
}

interface PackageManifest {
	readonly name?: string;
	readonly exports?: Readonly<Record<string, string | { readonly types?: string }>>;
}

export function pinnedTypePaths(dir: string): Record<string, string[]> {
	const packages = join(dir, 'packages');
	const entries = readdirSync(packages).flatMap((folder): [string, string[]][] => {
		const manifestPath = join(packages, folder, 'package.json');
		if (!existsSync(manifestPath)) return [];
		const { name, exports = {} } = JSON.parse(readFileSync(manifestPath, 'utf8')) as PackageManifest;
		if (name === undefined || !name.startsWith('@sittir/')) return [];
		return Object.entries(exports).flatMap(([subpath, target]): [string, string[]][] => {
			const types = typeof target === 'string' ? undefined : target.types;
			const declaration = types === undefined ? undefined : join(packages, folder, types);
			if (declaration === undefined || !existsSync(declaration)) return [];
			return [[subpath === '.' ? name : `${name}/${subpath.replace(/^\.\//, '')}`, [declaration]]];
		});
	});
	return Object.fromEntries(entries);
}

export function writePinnedTypes(root: string, dir: string): string {
	const path = join(root, PINNED_TYPES_CONFIG);
	mkdirSync(dirname(path), { recursive: true });
	const config = { extends: join(root, 'packages', 'codegen', 'tsconfig.json'), compilerOptions: { paths: pinnedTypePaths(dir) } };
	writeFileSync(path, `${JSON.stringify(config, null, '\t')}\n`);
	return path;
}

export function bootstrap(root: string = REPO_ROOT): string {
	const sha = readPin(root);
	const dir = bootstrapDir(root);
	if (!isBootstrapped(dir)) {
		const steps = bootstrapSteps(sha, dir, root);
		for (const step of existsSync(dir) ? steps.slice(1) : steps) {
			execFileSync(step.command, step.args, { cwd: step.cwd, stdio: 'inherit' });
		}
		markBootstrapped(dir, sha);
	}
	writePinnedTypes(root, dir);
	return dir;
}
