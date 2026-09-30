import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { gitVisiblePaths } from '../generated-manifest.ts';

let root: string;

function write(rel: string, content = 'x'): void {
	mkdirSync(dirname(join(root, rel)), { recursive: true });
	writeFileSync(join(root, rel), content);
}

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), 'git-visible-'));
	execFileSync('git', ['init', '-q'], { cwd: root });
	write('.gitignore', 'ignored/\n');
	write('packages/g/src/tracked.ts');
	execFileSync('git', ['add', '.'], { cwd: root });
	execFileSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'init'], { cwd: root });
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('gitVisiblePaths', () => {
	it('counts a tracked file and a new untracked one, but not an ignored one', () => {
		write('packages/g/src/fresh.ts');
		write('ignored/skipped.ts');
		const visible = gitVisiblePaths(root);
		expect(visible.has('packages/g/src/tracked.ts')).toBe(true);
		expect(visible.has('packages/g/src/fresh.ts')).toBe(true);
		expect(visible.has('ignored/skipped.ts')).toBe(false);
	});
});
