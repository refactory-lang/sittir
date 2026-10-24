import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { moduleClosure } from '../scripts/module-closure.ts';
import { contentHashes, sha256 } from '../util/content-hash.ts';
import { writeFileAtomic } from '../util/write-file-atomic.ts';

export interface PinnedMemo {
	read<T>(mode: string, input: string, run: () => Promise<T>): Promise<T>;
}

interface MemoEntry {
	readonly reader: string;
	readonly value: unknown;
}

export const readerDigest = (root: string, entry: string, inputs: readonly string[]): string =>
	sha256(JSON.stringify(contentHashes(root, [...moduleClosure(root, [entry]), ...inputs])));

function storedEntry(file: string): Partial<MemoEntry> | undefined {
	let text: string;
	try {
		text = readFileSync(file, 'utf8');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
		throw error;
	}
	try {
		const entry: unknown = JSON.parse(text);
		return typeof entry === 'object' && entry !== null ? entry : undefined;
	} catch {
		return undefined;
	}
}

export function pinnedMemo(dir: string, reader: string): PinnedMemo {
	return {
		async read<T>(mode: string, input: string, run: () => Promise<T>): Promise<T> {
			const file = join(dir, mode, `${sha256(input)}.json`);
			const stored = storedEntry(file);
			if (stored?.reader === reader && 'value' in stored) return stored.value as T;
			const value = await run();
			writeFileAtomic(file, JSON.stringify({ reader, value } satisfies MemoEntry));
			return value;
		}
	};
}
