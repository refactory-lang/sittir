import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { REPO_ROOT } from '../grammars.ts';

export const BOOTSTRAP_PACKAGES = ['scm'] as const;

export type BootstrapPackage = (typeof BOOTSTRAP_PACKAGES)[number];

export const BOOTSTRAP_COMMAND = 'pnpm exec tsx packages/cli/src/cli.ts bootstrap';

export const BOOTSTRAP_DIR_ENV = 'SITTIR_BOOTSTRAP_DIR';

const COMPLETE = '.complete';

export const PIN_FILE = 'bootstrap.json';

export function readPin(root: string = REPO_ROOT): string {
	const { sha } = JSON.parse(readFileSync(join(root, PIN_FILE), 'utf8')) as { sha?: unknown };
	if (typeof sha !== 'string' || !/^[0-9a-f]{40}$/.test(sha)) throw new Error(`${PIN_FILE}: "sha" must be a full commit hash`);
	return sha;
}

function mainCheckout(root: string): string {
	return dirname(execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: root, encoding: 'utf8' }).trim());
}

export function bootstrapDir(root: string = REPO_ROOT): string {
	return join(process.env[BOOTSTRAP_DIR_ENV] ?? join(mainCheckout(root), 'scratchpad', 'bootstrap'), readPin(root));
}

export const isBootstrapped = (dir: string): boolean => existsSync(join(dir, COMPLETE));

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

export function bootstrap(root: string = REPO_ROOT): string {
	const sha = readPin(root);
	const dir = bootstrapDir(root);
	if (isBootstrapped(dir)) return dir;
	const steps = bootstrapSteps(sha, dir, root);
	for (const step of existsSync(dir) ? steps.slice(1) : steps) {
		execFileSync(step.command, step.args, { cwd: step.cwd, stdio: 'inherit' });
	}
	writeFileSync(join(dir, COMPLETE), `${sha}\n`);
	return dir;
}
