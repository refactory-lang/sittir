import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export interface RegenRecord {
	readonly source: string;
	readonly binarySha256: string;
	readonly fixtures: Readonly<Record<string, string>>;
}

const RECORD_DIR = 'node_modules/.cache/sittir/regen';

const recordPath = (cwd: string, grammar: string): string => join(cwd, RECORD_DIR, `${grammar}.json`);

export function readRegenRecord(cwd: string, grammar: string): RegenRecord | undefined {
	const path = recordPath(cwd, grammar);
	return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as RegenRecord) : undefined;
}

export function writeRegenRecord(cwd: string, grammar: string, record: RegenRecord): void {
	const path = recordPath(cwd, grammar);
	mkdirSync(dirname(path), { recursive: true });
	const scratch = `${path}.${process.pid}.tmp`;
	writeFileSync(scratch, JSON.stringify(record, null, 2) + '\n');
	renameSync(scratch, path);
}

export function clearRegenRecord(cwd: string, grammar: string): void {
	rmSync(recordPath(cwd, grammar), { force: true });
}
