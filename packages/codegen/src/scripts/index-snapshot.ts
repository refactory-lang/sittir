import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface IndexSnapshot {
	readonly root: string;
	readonly visible: ReadonlySet<string>;
}

const git = (repoRoot: string, args: string[], input?: string): string =>
	execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', maxBuffer: 1 << 28, input });

export async function withIndexSnapshot<T>(
	repoRoot: string,
	pathspecs: readonly string[],
	use: (snapshot: IndexSnapshot) => T | Promise<T>
): Promise<T> {
	const scratch = mkdtempSync(join(tmpdir(), 'sittir-index-'));
	try {
		const listed = git(repoRoot, ['ls-files', '-z', '--cached', '--', ...pathspecs]);
		git(repoRoot, ['checkout-index', '-z', '--stdin', `--prefix=${scratch}/`], listed);
		const visible = new Set(git(repoRoot, ['ls-files', '-z', '--cached']).split('\0').filter((p) => p.length > 0));
		return await use({ root: scratch, visible });
	} finally {
		rmSync(scratch, { recursive: true, force: true });
	}
}
