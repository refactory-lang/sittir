import { createHash } from 'node:crypto';
import { setImmediate } from 'node:timers/promises';
import type { loadCorpusEntries } from '../validate/common.ts';

export async function collectGarbage(): Promise<void> {
	if (typeof globalThis.gc !== 'function') throw new Error('bench-storage workers require --expose-gc');
	for (let i = 0; i < 3; i++) {
		globalThis.gc();
		await setImmediate();
	}
}

export function corpusFingerprint(entries: ReturnType<typeof loadCorpusEntries>) {
	return {
		entries: entries.length,
		bytes: entries.reduce((sum, entry) => sum + Buffer.byteLength(entry.source), 0),
		sha256: createHash('sha256')
			.update(JSON.stringify(entries.map(({ name, source }) => [name, source])))
			.digest('hex')
	};
}
