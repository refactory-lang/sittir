import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { syncBase, type SyncBaseTarget } from '../sync-base.ts';

let cwd: string;
const git = (...args: string[]): string =>
	execFileSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const write = (rel: string, text: string): void => {
	mkdirSync(dirname(join(cwd, rel)), { recursive: true });
	writeFileSync(join(cwd, rel), text);
};
const commit = (message: string): void => {
	git('add', '-A');
	git('commit', '-qm', message);
};

const generatedOutput = 'gen/out.txt';
const roots = { g: ['gen'], h: ['other'] };
function target(effect: () => void = () => undefined): SyncBaseTarget & { regenerated: string[] } {
	const regenerated: string[] = [];
	return {
		roots,
		regenerated,
		verify: (grammar) =>
			grammar !== 'g' || readFileSync(join(cwd, generatedOutput), 'utf8') === `regenerated from ${readFileSync(join(cwd, 'src.txt'), 'utf8').trim()}`,
		regenerate(grammar) {
			regenerated.push(grammar);
			write(generatedOutput, `regenerated from ${readFileSync(join(cwd, 'src.txt'), 'utf8').trim()}`);
			effect();
		}
	};
}

beforeEach(() => {
	cwd = mkdtempSync(join(tmpdir(), 'sync-base-'));
	git('init', '-q', '-b', 'main');
	git('config', 'user.name', 'sync-base test');
	git('config', 'user.email', 'sync-base@example.invalid');
	write('src.txt', 'v1\n');
	write(generatedOutput, 'regenerated from v1');
	write('other/keep.txt', 'h');
	commit('init');
	git('checkout', '-qb', 'feature');
});

afterEach(() => rmSync(cwd, { recursive: true, force: true }));

describe('syncBase', () => {
	it('takes the base side of a conflicted generated file, regenerates only its grammar and commits the merge', () => {
		git('checkout', '-q', 'main');
		write('src.txt', 'v2\n');
		write(generatedOutput, 'regenerated from v2');
		commit('main change');
		git('checkout', '-q', 'feature');
		write(generatedOutput, 'feature output');
		commit('feature change');
		const t = target();
		expect(syncBase({ base: 'main', cwd }, t, () => undefined)).toBe(0);
		expect(t.regenerated).toEqual(['g']);
		expect(readFileSync(join(cwd, generatedOutput), 'utf8')).toBe('regenerated from v2');
		expect(git('log', '-1', '--format=%p').trim().split(' ')).toHaveLength(2);
		expect(git('status', '--porcelain').trim()).toBe('');
	});

	it('regenerates a grammar whose generated files are stale after a clean merge, and only that one', () => {
		git('checkout', '-q', 'main');
		write('src.txt', 'v2\n');
		commit('main change');
		git('checkout', '-q', 'feature');
		write('other/extra.txt', 'feature only');
		commit('feature change');
		const t = target();
		expect(syncBase({ base: 'main', cwd }, t, () => undefined)).toBe(0);
		expect(t.regenerated).toEqual(['g']);
		expect(readFileSync(join(cwd, generatedOutput), 'utf8')).toBe('regenerated from v2');
		expect(git('log', '-1', '--format=%p').trim().split(' ')).toHaveLength(2);
	});

	it('commits a clean merge whose grammars all verify without regenerating', () => {
		git('checkout', '-q', 'main');
		write('unrelated.txt', 'main\n');
		commit('main change');
		git('checkout', '-q', 'feature');
		write('other/extra.txt', 'feature only');
		commit('feature change');
		const t = target();
		expect(syncBase({ base: 'main', cwd }, t, () => undefined)).toBe(0);
		expect(t.regenerated).toEqual([]);
	});

	it('stops on a conflict outside the generated roots and leaves the merge in progress', () => {
		git('checkout', '-q', 'main');
		write('src.txt', 'main\n');
		commit('main change');
		git('checkout', '-q', 'feature');
		write('src.txt', 'feature\n');
		commit('feature change');
		const printed: string[] = [];
		const t = target();
		expect(syncBase({ base: 'main', cwd }, t, (line) => printed.push(line))).toBe(1);
		expect(printed.join('\n')).toContain('src.txt');
		expect(t.regenerated).toEqual([]);
		expect(existsSync(join(cwd, '.git/MERGE_HEAD'))).toBe(true);
	});

	it('does not commit when regeneration changes a file outside the generated roots', () => {
		git('checkout', '-q', 'main');
		write(generatedOutput, 'main output');
		commit('main change');
		git('checkout', '-q', 'feature');
		write(generatedOutput, 'feature output');
		commit('feature change');
		const printed: string[] = [];
		const t = target(() => write('src.txt', 'touched by regeneration\n'));
		expect(syncBase({ base: 'main', cwd }, t, (line) => printed.push(line))).toBe(1);
		expect(printed.join('\n')).toContain('src.txt');
		expect(existsSync(join(cwd, '.git/MERGE_HEAD'))).toBe(true);
		expect(git('log', '-1', '--format=%s').trim()).toBe('feature change');
	});

	it('removes a generated file the base deleted, and takes the base side of one it changed', () => {
		write('gen/gone.txt', 'v1');
		commit('add gone');
		git('checkout', '-q', 'main');
		git('merge', '-q', 'feature');
		git('rm', '-q', 'gen/gone.txt');
		write('src.txt', 'v2\n');
		commit('main deletes');
		git('checkout', '-q', 'feature');
		write('gen/gone.txt', 'feature edit');
		commit('feature edits');
		const t = target();
		expect(syncBase({ base: 'main', cwd }, t, () => undefined)).toBe(0);
		expect(existsSync(join(cwd, 'gen/gone.txt'))).toBe(false);
		expect(t.regenerated).toEqual(['g']);
	});

	it('propagates a merge that fails without a conflict, such as a missing base ref', () => {
		expect(() => syncBase({ base: 'no-such-ref', cwd }, target(), () => undefined)).toThrow();
	});

	it('refuses a dirty working tree', () => {
		write('src.txt', 'dirty\n');
		const printed: string[] = [];
		expect(syncBase({ base: 'main', cwd }, target(), (line) => printed.push(line))).toBe(1);
		expect(printed.join('\n')).toContain('uncommitted');
	});

	it('reports an up-to-date branch', () => {
		const printed: string[] = [];
		expect(syncBase({ base: 'main', cwd }, target(), (line) => printed.push(line))).toBe(0);
		expect(printed.join('\n')).toContain('up to date');
	});
});
