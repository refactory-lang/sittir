import { type ChildProcessByStdio, spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import type { Socket } from 'node:net';
import { join, relative } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { bootstrapDir } from '../bootstrap/bootstrap.ts';
import { REPO_ROOT } from '../grammars.ts';
import type { FlagMember } from './flags.ts';
import { type PinnedMemo, pinnedMemo, readerDigest } from './pinned-memo.ts';
import { type BindingFacts, type BindingPattern, type BindingsRoundTrip, BindingsSyntaxError } from './facts.ts';
import type { Declared, FeatureIndex } from './vocabulary.ts';

export const PINNED_READER_MARKER = '\u0000sittir-pinned-reader\u0000';

export interface PinnedReaderModes {
	readonly facts: { readonly input: string; readonly output: BindingFacts };
	readonly patterns: { readonly input: string; readonly output: BindingPattern[] };
	readonly roundTrip: { readonly input: string; readonly output: BindingsRoundTrip };
	readonly flagsModule: { readonly input: readonly FlagMember[]; readonly output: string };
	readonly vocabularyDeclared: { readonly input: string; readonly output: Declared[] };
	readonly vocabularyFeatureIndex: { readonly input: string; readonly output: FeatureIndex };
	readonly exportedStrings: { readonly input: string; readonly output: Readonly<Record<string, string>> };
}

export type PinnedReaderMode = keyof PinnedReaderModes;

export type PinnedInput<M extends PinnedReaderMode> = PinnedReaderModes[M]['input'];

export type PinnedOutput<M extends PinnedReaderMode> = PinnedReaderModes[M]['output'];

export interface PinnedReaderRequest<M extends PinnedReaderMode = PinnedReaderMode> {
	readonly id: number;
	readonly mode: M;
	readonly input: PinnedInput<M>;
}

export type PinnedReaderReply = { readonly id: number } & (
	| { readonly value: unknown }
	| { readonly syntaxLines: readonly number[] }
	| { readonly error: string }
);

interface PendingRead {
	readonly mode: PinnedReaderMode;
	readonly resolve: (value: unknown) => void;
	readonly reject: (error: Error) => void;
}

interface PinnedReader {
	readonly child: ChildProcessByStdio<Socket, Socket, Socket>;
	readonly pending: Map<number, PendingRead>;
	next: number;
	stderr: string;
}

const requireFromHere = createRequire(import.meta.url);

const CHILD_ENTRY = fileURLToPath(new URL('./pinned-reader.child.ts', import.meta.url));

const CHILD_TSCONFIG = fileURLToPath(new URL('../../tsconfig.pinned.json', import.meta.url));

const LOCKFILE = 'pnpm-lock.yaml';

const PINNED_READS_DIR = 'reads';

let reader: PinnedReader | undefined;

let memo: PinnedMemo | undefined;

function hold(running: PinnedReader): void {
	const busy = running.pending.size > 0;
	for (const handle of [running.child, running.child.stdin, running.child.stdout, running.child.stderr]) {
		if (busy) handle.ref();
		else handle.unref();
	}
}

function settle(running: PinnedReader, reply: PinnedReaderReply): void {
	const waiting = running.pending.get(reply.id);
	if (waiting === undefined) return;
	running.pending.delete(reply.id);
	hold(running);
	if ('syntaxLines' in reply) waiting.reject(new BindingsSyntaxError(reply.syntaxLines));
	else if ('error' in reply) waiting.reject(new Error(`the pinned build's ${waiting.mode} failed:\n${reply.error}`));
	else waiting.resolve(reply.value);
}

function startReader(): PinnedReader {
	const child = spawn(
		process.execPath,
		['--import', pathToFileURL(requireFromHere.resolve('tsx')).href, CHILD_ENTRY],
		{
			stdio: 'pipe',
			env: { ...process.env, TSX_TSCONFIG_PATH: CHILD_TSCONFIG }
		}
	) as ChildProcessByStdio<Socket, Socket, Socket>;
	const running: PinnedReader = { child, pending: new Map(), next: 0, stderr: '' };
	child.stderr.setEncoding('utf8').on('data', (chunk: string) => {
		running.stderr += chunk;
	});
	createInterface({ input: child.stdout }).on('line', (line) => {
		const at = line.indexOf(PINNED_READER_MARKER);
		if (at >= 0) settle(running, JSON.parse(line.slice(at + PINNED_READER_MARKER.length)) as PinnedReaderReply);
	});
	const fail = (error: Error) => {
		if (reader === running) reader = undefined;
		for (const waiting of running.pending.values()) waiting.reject(error);
		running.pending.clear();
	};
	child.on('error', fail);
	child.on('exit', (code) => fail(new Error(`the pinned build's process exited (${code}):\n${running.stderr}`)));
	return running;
}

function askReader<M extends PinnedReaderMode>(mode: M, input: PinnedInput<M>): Promise<PinnedOutput<M>> {
	reader ??= startReader();
	const running = reader;
	const id = running.next++;
	return new Promise((resolve, reject) => {
		running.pending.set(id, { mode, resolve: resolve as (value: unknown) => void, reject });
		hold(running);
		running.child.stdin.write(`${JSON.stringify({ id, mode, input } satisfies PinnedReaderRequest<M>)}\n`);
	});
}

function readsMemo(): PinnedMemo {
	memo ??= pinnedMemo(
		join(bootstrapDir(), PINNED_READS_DIR),
		readerDigest(REPO_ROOT, relative(REPO_ROOT, CHILD_ENTRY), [relative(REPO_ROOT, CHILD_TSCONFIG), LOCKFILE])
	);
	return memo;
}

export function runPinned<M extends PinnedReaderMode>(mode: M, input: PinnedInput<M>): Promise<PinnedOutput<M>> {
	return readsMemo().read(mode, JSON.stringify(input), () => askReader(mode, input));
}

export const readBindings = (text: string): Promise<BindingFacts> => runPinned('facts', text);

export const bindingPatterns = (text: string): Promise<BindingPattern[]> => runPinned('patterns', text);

export const roundTripBindings = (text: string): Promise<BindingsRoundTrip> => runPinned('roundTrip', text);
