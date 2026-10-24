import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export function writeFileAtomic(path: string, text: string): void {
	mkdirSync(dirname(path), { recursive: true });
	const scratch = `${path}.${process.pid}.tmp`;
	writeFileSync(scratch, text);
	renameSync(scratch, path);
}
