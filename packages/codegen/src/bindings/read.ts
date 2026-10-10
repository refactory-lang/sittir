import { type ChildProcessByStdio, spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import type { Socket } from 'node:net';
import { createInterface } from 'node:readline';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { type BindingFacts, type BindingPattern, type BindingsRoundTrip, BindingsSyntaxError } from './facts.ts';

export const PINNED_READER_MARKER = '\u0000sittir-pinned-reader\u0000';

export type PinnedReaderMode = 'facts' | 'patterns' | 'roundTrip';

export interface PinnedReaderRequest {
	readonly id: number;
	readonly mode: PinnedReaderMode;
	readonly text: string;
}

export type PinnedReaderReply = { readonly id: number } & (
	| { readonly value: unknown }
	| { readonly syntaxLines: readonly number[] }
	| { readonly error: string }
);

interface PendingRead {
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

let reader: PinnedReader | undefined;

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
	else if ('error' in reply) waiting.reject(new Error(`reading bindings.scm with the pinned @sittir/scm failed:\n${reply.error}`));
	else waiting.resolve(reply.value);
}

function startReader(): PinnedReader {
	const child = spawn(
		process.execPath,
		['--import', pathToFileURL(requireFromHere.resolve('tsx')).href, fileURLToPath(new URL('./pinned-reader.child.ts', import.meta.url))],
		{
			stdio: 'pipe',
			env: { ...process.env, TSX_TSCONFIG_PATH: fileURLToPath(new URL('../../tsconfig.pinned.json', import.meta.url)) }
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
	child.on('exit', (code) => fail(new Error(`the pinned @sittir/scm reader exited (${code}):\n${running.stderr}`)));
	return running;
}

function readPinned(mode: PinnedReaderMode, text: string): Promise<unknown> {
	reader ??= startReader();
	const running = reader;
	const id = running.next++;
	return new Promise((resolve, reject) => {
		running.pending.set(id, { resolve, reject });
		hold(running);
		running.child.stdin.write(`${JSON.stringify({ id, mode, text } satisfies PinnedReaderRequest)}\n`);
	});
}

export async function readBindings(text: string): Promise<BindingFacts> {
	return (await readPinned('facts', text)) as BindingFacts;
}

export async function bindingPatterns(text: string): Promise<BindingPattern[]> {
	return (await readPinned('patterns', text)) as BindingPattern[];
}

export async function roundTripBindings(text: string): Promise<BindingsRoundTrip> {
	return (await readPinned('roundTrip', text)) as BindingsRoundTrip;
}
