import { execFileSync } from 'node:child_process';
import { mkdtempSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { BOOTSTRAP_COMMAND, BOOTSTRAP_PACKAGES, bootstrapDir, bootstrapSteps, readPin } from '../bootstrap.ts';
import { loadPinnedScm } from '../../scm/pinned.ts';

const SHA = 'a'.repeat(40);

const git = (cwd: string, ...args: string[]): string =>
	execFileSync('git', ['-c', 'user.name=test', '-c', 'user.email=test@example.com', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', ...args], {
		cwd,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe']
	});

function checkout(): string {
	const root = realpathSync(mkdtempSync(join(tmpdir(), 'sittir-pin-')));
	git(root, 'init', '-q', '-b', 'master');
	writeFileSync(join(root, 'bootstrap.json'), JSON.stringify({ sha: SHA }));
	git(root, 'add', '-A');
	git(root, 'commit', '-q', '-m', 'pin');
	return root;
}

const saved = process.env.SITTIR_BOOTSTRAP_DIR;
afterEach(() => {
	if (saved === undefined) delete process.env.SITTIR_BOOTSTRAP_DIR;
	else process.env.SITTIR_BOOTSTRAP_DIR = saved;
});

describe('the pin', () => {
	it('is the one commit bootstrap.json names', () => {
		expect(readPin(checkout())).toBe(SHA);
	});

	it('builds into the checkout\'s scratchpad, keyed by the commit', () => {
		delete process.env.SITTIR_BOOTSTRAP_DIR;
		const root = checkout();
		expect(bootstrapDir(root)).toBe(join(root, 'scratchpad', 'bootstrap', SHA));
	});

	it('builds into the main checkout\'s scratchpad from any of its worktrees, so they share one build', () => {
		delete process.env.SITTIR_BOOTSTRAP_DIR;
		const root = checkout();
		const worktree = `${root}-worktree`;
		git(root, 'worktree', 'add', '-q', '--detach', worktree);
		expect(bootstrapDir(worktree)).toBe(join(root, 'scratchpad', 'bootstrap', SHA));
	});

	it('builds where SITTIR_BOOTSTRAP_DIR says, still keyed by the commit', () => {
		process.env.SITTIR_BOOTSTRAP_DIR = '/cache';
		expect(bootstrapDir(checkout())).toBe(join('/cache', SHA));
	});
});

describe('the bootstrap build', () => {
	const steps = bootstrapSteps(SHA, '/cache/x');

	it('checks the pinned commit out detached, with the repository\'s hooks off for that checkout', () => {
		expect(steps[0]).toEqual({ command: 'git', args: ['-c', 'core.hooksPath=/dev/null', 'worktree', 'add', '--detach', '/cache/x', SHA], cwd: expect.any(String) });
	});

	it('installs, then builds only what the bootstrap packages need, natives last', () => {
		expect(steps.slice(1).map((s) => [s.command, ...s.args].join(' '))).toEqual([
			'pnpm install --frozen-lockfile --prefer-offline',
			'pnpm -C packages/types run build',
			'pnpm -C packages/common run build',
			...BOOTSTRAP_PACKAGES.map((p) => `pnpm -C packages/${p} run build`),
			...BOOTSTRAP_PACKAGES.map((p) => `pnpm -C rust/crates/sittir-${p} run build`)
		]);
		expect(steps.slice(1).every((s) => s.cwd === '/cache/x')).toBe(true);
	});
});

describe('the pinned scm loader', () => {
	it('refuses a missing build, naming the command that makes it', async () => {
		process.env.SITTIR_BOOTSTRAP_DIR = mkdtempSync(join(tmpdir(), 'sittir-pin-empty-'));
		await expect(loadPinnedScm()).rejects.toThrow(BOOTSTRAP_COMMAND);
	});
});
