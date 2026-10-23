import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { load } from './codegen-surface.ts';

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

export async function writeRegenRecord(cwd: string, grammar: string, record: RegenRecord): Promise<void> {
	(await load('writeFileAtomic')).writeFileAtomic(recordPath(cwd, grammar), JSON.stringify(record, null, 2) + '\n');
}

export function clearRegenRecord(cwd: string, grammar: string): void {
	rmSync(recordPath(cwd, grammar), { force: true });
}
