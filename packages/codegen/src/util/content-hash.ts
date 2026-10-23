import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const sha256 = (data: string | Uint8Array): string => createHash('sha256').update(data).digest('hex');

export const sha256File = (path: string): string => sha256(readFileSync(path));

export function contentHashes(root: string, files: readonly string[]): Record<string, string> {
	const present = [...new Set(files)].filter((rel) => existsSync(join(root, rel))).sort();
	return Object.fromEntries(present.map((rel) => [rel, sha256File(join(root, rel))]));
}
