import { readFileSync } from 'node:fs';
import type { FileChange, FileWrite, Pending } from '@sittir/types';

export type FileVerb = FileWrite['verb'];

export type FileChain = (change: FileWrite, next: () => Promise<void>) => Promise<void>;

export function currentText(path: string): string | undefined {
	try {
		return readFileSync(path, 'utf8');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
		throw error;
	}
}

export function pendingFile(
	path: string,
	verb: FileVerb,
	commit: () => void,
	diff: () => FileChange,
	chain: FileChain | undefined,
	release?: () => void
): Pending {
	let written: Promise<void> | undefined;
	const next = (): Promise<void> => (written ??= (async () => commit())());
	let committed: Promise<void> | undefined;
	const start = (): Promise<void> =>
		(committed ??= (async () => {
			try {
				await (chain === undefined ? next() : chain(Object.freeze({ path, verb, diff }), next));
			} finally {
				release?.();
			}
		})());
	return Object.freeze({
		path,
		diff,
		then<R1 = void, R2 = never>(
			onFulfilled?: ((value: void) => R1 | PromiseLike<R1>) | null,
			onRejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null
		): PromiseLike<R1 | R2> {
			return start().then(onFulfilled, onRejected);
		},
		[Symbol.asyncDispose]: start
	});
}
