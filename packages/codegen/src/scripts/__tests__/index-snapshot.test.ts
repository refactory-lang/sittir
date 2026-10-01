import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { withIndexSnapshot } from '../index-snapshot.ts';

let repo: string;
const git = (...args: string[]): string => execFileSync('git', args, { cwd: repo, encoding: 'utf8' });

beforeEach(() => {
	repo = mkdtempSync(join(tmpdir(), 'index-snapshot-'));
	git('init', '-q');
	mkdirSync(join(repo, 'packages/a'), { recursive: true });
	writeFileSync(join(repo, 'packages/a/x.ts'), 'committed\n');
	git('add', '-A');
	git('-c', 'user.email=t@example.com', '-c', 'user.name=t', 'commit', '-q', '-m', 'base');
});

afterEach(() => rmSync(repo, { recursive: true, force: true }));

describe('withIndexSnapshot', () => {
	it('materializes staged content, not the working tree', async () => {
		writeFileSync(join(repo, 'packages/a/x.ts'), 'staged\n');
		git('add', 'packages/a/x.ts');
		writeFileSync(join(repo, 'packages/a/x.ts'), 'unstaged edit\n');
		writeFileSync(join(repo, 'packages/a/untracked.ts'), 'untracked\n');
		const seen = await withIndexSnapshot(repo, ['packages'], ({ root, visible }) => ({
			x: readFileSync(join(root, 'packages/a/x.ts'), 'utf8'),
			untracked: existsSync(join(root, 'packages/a/untracked.ts')),
			visible: [...visible]
		}));
		expect(seen.x).toBe('staged\n');
		expect(seen.untracked).toBe(false);
		expect(seen.visible).toEqual(['packages/a/x.ts']);
	});

	it('removes the scratch checkout when the callback settles', async () => {
		const root = await withIndexSnapshot(repo, ['packages'], (snapshot) => snapshot.root);
		expect(existsSync(root)).toBe(false);
	});
});
