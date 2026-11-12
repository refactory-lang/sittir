import { closeSync, constants, fstatSync, openSync, readFileSync } from 'node:fs';
import type { FileChange, FileWrite, Pending } from '@sittir/types';

export type FileVerb = FileWrite['verb'];

export type FileHook = (change: FileWrite, next: () => Promise<void>) => Promise<void>;

export interface FileCommit extends Disposable {
	diff(): FileChange;
	commit(): void;
}

export function currentText(path: string): string | undefined {
	let descriptor: number;
	try {
		descriptor = openSync(path, constants.O_RDONLY | (constants.O_NONBLOCK ?? 0));
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
		throw error;
	}
	try {
		if (!fstatSync(descriptor).isFile()) throw new Error(`cannot read ${path}: it is not a regular file`);
		return readFileSync(descriptor, 'utf8');
	} finally {
		closeSync(descriptor);
	}
}

export function pendingFile(path: string, verb: FileVerb, open: () => FileCommit, diff: () => FileChange, hooks: readonly FileHook[]): Pending {
	const done = (): Error => new Error(`the ${verb} of ${path} is done: a file interceptor's next and diff run only while its write is in flight`);
	const run = async (): Promise<void> => {
		using opened = open();
		let closed = false;
		const steps = new Map<number, Promise<void>>();
		const inFlight = new Set<Promise<void>>();
		const failures: unknown[] = [];
		const change: FileWrite = Object.freeze({
			path,
			verb,
			diff: (): FileChange => {
				if (closed) throw done();
				return opened.diff();
			}
		});
		const step = (index: number): Promise<void> => {
			const known = steps.get(index);
			if (known !== undefined) return known;
			if (closed) return Promise.reject(done());
			const hook = hooks[index];
			const started = Promise.resolve().then(() => (hook === undefined ? opened.commit() : hook(change, () => step(index + 1))));
			steps.set(index, started);
			inFlight.add(started);
			started.then(
				() => inFlight.delete(started),
				(error: unknown) => {
					failures.push(error);
					inFlight.delete(started);
				}
			);
			return started;
		};
		const outermost = step(0);
		while (inFlight.size > 0) await Promise.allSettled(inFlight);
		closed = true;
		const [outcome] = await Promise.allSettled([outermost]);
		if (outcome.status === 'rejected') throw outcome.reason;
		if (failures.length > 0) throw failures[0];
	};
	let committed: Promise<void> | undefined;
	const start = (): Promise<void> => (committed ??= Promise.resolve().then(run));
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
