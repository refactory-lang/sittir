import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { BOOTSTRAP_COMMAND, BOOTSTRAP_PACKAGES, PINNED_TYPES_CONFIG, bootstrap, bootstrapDir, bootstrapSteps, isBootstrapped, markBootstrapped, pinnedTypePaths, readPin } from '../bootstrap.ts';
import { loadPinnedBuild } from '../pinned.ts';

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

	it('takes a relative SITTIR_BOOTSTRAP_DIR from the working directory, and names it absolutely', () => {
		process.env.SITTIR_BOOTSTRAP_DIR = join('relative', 'cache');
		expect(bootstrapDir(checkout())).toBe(join(process.cwd(), 'relative', 'cache', SHA));
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

describe('a finished build', () => {
	it('is finished only once every bootstrap package is built into it', () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-pin-built-'));
		expect(isBootstrapped(dir)).toBe(false);
		writeFileSync(join(dir, '.complete'), `${SHA}\n`);
		expect(isBootstrapped(dir)).toBe(false);
		markBootstrapped(dir, SHA);
		expect(isBootstrapped(dir)).toBe(true);
	});
});

describe('the pinned build loader', () => {
	it('refuses a missing build, naming the command that makes it', async () => {
		process.env.SITTIR_BOOTSTRAP_DIR = mkdtempSync(join(tmpdir(), 'sittir-pin-empty-'));
		await expect(loadPinnedBuild()).rejects.toThrow(BOOTSTRAP_COMMAND);
	});
});

function pinnedPackages(dir: string = realpathSync(mkdtempSync(join(tmpdir(), 'sittir-pin-types-')))): string {
	const manifest = (folder: string, contents: object, built: readonly string[] = []): void => {
		mkdirSync(join(dir, 'packages', folder), { recursive: true });
		writeFileSync(join(dir, 'packages', folder, 'package.json'), JSON.stringify(contents));
		for (const file of built) {
			mkdirSync(join(dir, 'packages', folder, file, '..'), { recursive: true });
			writeFileSync(join(dir, 'packages', folder, file), '');
		}
	};
	manifest('typescript', { name: '@sittir/typescript', exports: { '.': { types: './dist/index.d.ts', import: './dist/index.js' }, './api': { types: './dist/api.d.ts' } } }, ['dist/index.d.ts', 'dist/api.d.ts']);
	manifest('types', { name: '@sittir/types', exports: { '.': { types: './src/index.ts' } } }, ['src/index.ts']);
	manifest('rust', { name: '@sittir/rust', exports: { '.': { types: './dist/index.d.ts' } } });
	manifest('vendored', { name: 'not-sittir', exports: { '.': { types: './index.d.ts' } } });
	manifest('untyped', { name: '@sittir/untyped', exports: { '.': './index.js' } });
	mkdirSync(join(dir, 'packages', 'no-manifest'), { recursive: true });
	return dir;
}

describe('the pinned build\'s declarations', () => {
	it('map every @sittir export to the declaration file its types condition names, when the pin built it', () => {
		const dir = pinnedPackages();
		expect(pinnedTypePaths(dir)).toEqual({
			'@sittir/typescript': [join(dir, 'packages/typescript/dist/index.d.ts')],
			'@sittir/typescript/api': [join(dir, 'packages/typescript/dist/api.d.ts')],
			'@sittir/types': [join(dir, 'packages/types/src/index.ts')]
		});
	});

	it('are written into the checkout on every bootstrap, a finished build included', () => {
		const root = checkout();
		const cache = realpathSync(mkdtempSync(join(tmpdir(), 'sittir-pin-cache-')));
		process.env.SITTIR_BOOTSTRAP_DIR = cache;
		const dir = pinnedPackages(join(cache, SHA));
		markBootstrapped(dir, SHA);
		expect(bootstrap(root)).toBe(dir);
		expect(JSON.parse(readFileSync(join(root, PINNED_TYPES_CONFIG), 'utf8'))).toEqual({
			extends: join(root, 'packages', 'codegen', 'tsconfig.json'),
			compilerOptions: { paths: pinnedTypePaths(dir) }
		});
	});
});
