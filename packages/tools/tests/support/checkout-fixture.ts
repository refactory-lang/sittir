import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

let root: string | undefined;

process.on('exit', () => {
	if (root !== undefined) rmSync(root, { recursive: true, force: true });
});

export function fixtureFile(relativePath: string): string {
	if (root === undefined) {
		root = mkdtempSync(join(tmpdir(), 'tools-report-fixture-'));
		mkdirSync(join(root, '.git'));
	}
	const file = join(root, relativePath);
	if (!existsSync(file)) {
		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(file, '');
	}
	return file;
}
