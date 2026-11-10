import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import type { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, it, vi } from 'vitest';
import { claim, giveBack, holdPeers, parseProcessTable, peerWork, processTable, sessionOf, stillHeld, type Mark } from '../src/profile/hold-peers.ts';

const darwin = process.platform === 'darwin';
const cleanups: (() => void)[] = [];
afterEach(() => {
	for (const cleanup of cleanups.splice(0)) cleanup();
});

const priority = (pid: number) => Number(execFileSync('ps', ['-o', 'pri=', '-p', String(pid)], { encoding: 'utf8' }).trim());
const priorities = (pids: readonly number[]) =>
	execFileSync('ps', ['-o', 'pri=', '-p', pids.join(',')], { encoding: 'utf8' })
		.trim()
		.split(/\s+/)
		.map(Number);
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
async function eventually(check: () => boolean): Promise<void> {
	while (!check()) await pause(50);
}

function pidLines(stream: Readable): (label: string, count?: number) => Promise<number[]> {
	const lines: string[] = [];
	let next = () => {};
	createInterface({ input: stream }).on('line', (line) => {
		lines.push(line);
		next();
	});
	return async (label, count = 1) => {
		for (;;) {
			const pids = lines.filter((line) => line.startsWith(`${label} `)).map((line) => Number(line.slice(label.length + 1)));
			if (pids.length >= count) return pids.slice(0, count);
			await new Promise<void>((resolve) => (next = resolve));
		}
	};
}

function scratch(): string {
	const dir = mkdtempSync(join(tmpdir(), 'hold-peers-'));
	cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
	return dir;
}

interface FakeSession {
	readonly root: number;
	readonly work: number[];
	readonly session: ChildProcess;
	readonly read: (label: string, count?: number) => Promise<number[]>;
}

async function fakeSession(dir: string, work = ['sleep 60', 'sleep 60']): Promise<FakeSession> {
	const shell = join(dir, 'claude');
	copyFileSync('/bin/bash', shell);
	execFileSync('codesign', ['-s', '-', '-f', shell], { stdio: 'ignore' });
	const session = spawn(shell, ['-c', `${work.map((command) => `${command} & echo "work $!";`).join(' ')} wait`], {
		stdio: ['ignore', 'pipe', 'ignore'],
		detached: true
	});
	cleanups.push(() => {
		try {
			execFileSync('pkill', ['-P', String(session.pid)]);
		} catch {}
		session.kill('SIGKILL');
	});
	const read = pidLines(session.stdout!);
	return { root: session.pid!, work: await read('work', work.length), session, read };
}

function holderProcess(root: number, state: string, env: NodeJS.ProcessEnv = process.env): Promise<ChildProcess> {
	const module = fileURLToPath(new URL('../src/profile/hold-peers.ts', import.meta.url));
	const script = `import { holdPeers } from ${JSON.stringify(module)};
await holdPeers({ within: ${root}, state: ${JSON.stringify(state)}, intervalMs: 200 });
console.log('held');
setInterval(() => {}, 1000);`;
	const holder = spawn(process.execPath, ['--input-type=module', '-e', script], { stdio: ['ignore', 'pipe', 'inherit'], env });
	cleanups.push(() => holder.kill('SIGKILL'));
	return new Promise((resolve, reject) => {
		holder.stdout!.on('data', (chunk: Buffer) => chunk.toString().includes('held') && resolve(holder));
		holder.on('exit', (code) => reject(new Error(`the holder exited with ${code} before it held`)));
	});
}

const table = parseProcessTable(
	[
		'    1     0     1   31 Mon Nov  9 08:00:00 2026 /sbin/launchd',
		'   10     1    10   31 Mon Nov  9 09:00:00 2026 claude',
		'   11    10    10   31 Mon Nov  9 09:00:01 2026 /bin/zsh',
		'   12    11    10   31 Mon Nov  9 09:00:02 2026 node',
		'   20     1    20   31 Mon Nov  9 09:10:00 2026 /Users/me/.local/bin/claude',
		'   21    20    20   31 Mon Nov  9 09:10:01 2026 /bin/zsh',
		'   22    21    20   31 Mon Nov  9 09:10:02 2026 node',
		'   23    22    20   31 Mon Nov  9 09:10:03 2026 /opt/homebrew/bin/rustc',
		'   30     1    30   31 Mon Nov  9 08:30:00 2026 /opt/homebrew/bin/sccache',
		'   31    30    30   31 Mon Nov  9 09:20:00 2026 /opt/homebrew/bin/rustc',
		'   40     1    40   31 Mon Nov  9 08:05:00 2026 /System/Library/CoreServices/Finder.app/Contents/MacOS/Finder',
		'   41     1    41   31 Mon Nov  9 08:06:00 2026 /Applications/Claude Helper (Renderer).app/Contents/MacOS/Claude Helper (Renderer)'
	].join('\n')
);

const pids = (rows: readonly { pid: number }[]) => rows.map(({ pid }) => pid).sort((a, b) => a - b);

it('reads a process table with its start times and commands', () => {
	expect(table).toHaveLength(12);
	expect(table[4]).toEqual({ pid: 20, ppid: 1, group: 20, started: 'Mon Nov 9 09:10:00 2026', command: '/Users/me/.local/bin/claude', background: false });
	expect(table[11]!.command).toBe('/Applications/Claude Helper (Renderer).app/Contents/MacOS/Claude Helper (Renderer)');
});

it('finds the Claude session a process runs under', () => {
	expect(sessionOf(table, 12)).toBe(10);
	expect(sessionOf(table, 23)).toBe(20);
	expect(sessionOf(table, 31)).toBeUndefined();
	expect(sessionOf(table, 40)).toBeUndefined();
});

it("holds what other sessions run and the compiler cache, never a session itself or the caller's own work", () => {
	expect(pids(peerWork(table, 10))).toEqual([21, 22, 23, 30, 31]);
});

it('holds every session’s work when no session runs the caller', () => {
	expect(pids(peerWork(table, undefined))).toEqual([11, 12, 21, 22, 23, 30, 31]);
});

it('gives back what it held that still runs under the same start, and what started under it since', () => {
	const later = parseProcessTable(
		[
			'   20     1    20   31 Mon Nov  9 09:10:00 2026 claude',
			'   22    20    20   31 Mon Nov  9 09:10:02 2026 node',
			'   24    22    20   31 Mon Nov  9 09:30:00 2026 node',
			'   25    24    20   31 Mon Nov  9 09:30:01 2026 /opt/homebrew/bin/rustc',
			'   30     1    30   31 Mon Nov  9 09:40:00 2026 /opt/homebrew/bin/sccache',
			'   50     1    50   31 Mon Nov  9 09:41:00 2026 node'
		].join('\n')
	);
	const held: Mark[] = [
		[22, 'Mon Nov 9 09:10:02 2026', 20],
		[23, 'Mon Nov 9 09:10:03 2026', 20],
		[30, 'Mon Nov 9 08:30:00 2026', 30]
	];
	expect(stillHeld(later, { held, kept: [], bystanders: [] })).toEqual([22, 24, 25]);
});

it('gives back nothing under a process kept in the background class unless a held process is nearer', () => {
	const rows = parseProcessTable(
		[
			'   20     1    20   31 Mon Nov  9 09:10:00 2026 node',
			'   21    20    20    4 Mon Nov  9 09:10:01 2026 node',
			'   22    21    20    4 Mon Nov  9 09:10:02 2026 node',
			'   23    22    20   31 Mon Nov  9 09:10:03 2026 node',
			'   24    20    20    4 Mon Nov  9 09:20:00 2026 node'
		].join('\n')
	);
	expect(rows.map(({ background }) => background)).toEqual([false, true, true, false, true]);
	const held: Mark[] = [
		[20, 'Mon Nov 9 09:10:00 2026', 20],
		[23, 'Mon Nov 9 09:10:03 2026', 20]
	];
	const kept: Mark[] = [[21, 'Mon Nov 9 09:10:01 2026', 20]];
	expect(stillHeld(rows, { held, kept, bystanders: [] })).toEqual([20, 23, 24]);
});

it('gives back what inherited the hold from a held process that has since exited, by the process group they shared', () => {
	const rows = parseProcessTable(
		[
			'    1     0     1   31 Mon Nov  9 08:00:00 2026 /sbin/launchd',
			'   26     1    21    4 Mon Nov  9 09:30:00 2026 node',
			'   27     1    40    4 Mon Nov  9 09:30:00 2026 node',
			'   28     1    50    4 Mon Nov  9 09:30:00 2026 /System/Library/Frameworks/CoreServices.framework/Frameworks/Metadata.framework/Versions/A/Support/mdworker_shared',
			'   29     1    21   31 Mon Nov  9 09:30:00 2026 node'
		].join('\n')
	);
	const held: Mark[] = [
		[22, 'Mon Nov 9 09:10:02 2026', 21],
		[41, 'Mon Nov 9 09:10:00 2026', 40]
	];
	const kept: Mark[] = [[42, 'Mon Nov 9 09:10:01 2026', 40]];
	expect(stillHeld(rows, { held, kept, bystanders: [] })).toEqual([26]);
});

it('never gives back a process that shared a held group before the hold and was not taken', () => {
	const before = parseProcessTable(
		[
			'    1     0     1   31 Mon Nov  9 08:00:00 2026 /sbin/launchd',
			'   60     1    60    4 Mon Nov  9 09:00:00 2026 claude',
			'   61    60    60   31 Mon Nov  9 09:00:01 2026 /bin/zsh',
			'   62     1    60   31 Mon Nov  9 09:00:02 2026 node'
		].join('\n')
	);
	const found = claim(before, undefined, undefined, { held: [], kept: [], bystanders: [] });
	expect([pids(found.taken), pids(found.kept), pids(found.bystanders)]).toEqual([[61], [60], [62]]);
	const mark = (row: { pid: number; started: string; group: number }): Mark => [row.pid, row.started, row.group];
	const holding = { held: found.taken.map(mark), kept: found.kept.map(mark), bystanders: found.bystanders.map(mark) };
	const after = parseProcessTable(
		[
			'    1     0     1   31 Mon Nov  9 08:00:00 2026 /sbin/launchd',
			'   60     1    60    4 Mon Nov  9 09:00:00 2026 claude',
			'   61    60    60    4 Mon Nov  9 09:00:01 2026 /bin/zsh',
			'   62     1    60    4 Mon Nov  9 09:00:02 2026 node'
		].join('\n')
	);
	expect(stillHeld(after, holding)).toEqual([61]);
});

it('gives back by process group only what was orphaned inside the held group', () => {
	const rows = parseProcessTable(
		[
			'    1     0     1   31 Mon Nov  9 08:00:00 2026 /sbin/launchd',
			'   70     1    70   31 Mon Nov  9 08:10:00 2026 /System/Applications/Utilities/Terminal.app/Contents/MacOS/Terminal',
			'  100    70   100    4 Mon Nov  9 09:40:00 2026 /bin/zsh',
			'  101   100   100    4 Mon Nov  9 09:40:01 2026 node',
			'  102     1   100    4 Mon Nov  9 09:40:02 2026 node',
			'  103   102   100    4 Mon Nov  9 09:40:03 2026 node'
		].join('\n')
	);
	const held: Mark[] = [[200, 'Mon Nov 9 09:10:00 2026', 100]];
	expect(stillHeld(rows, { held, kept: [], bystanders: [] })).toEqual([102, 103]);
});

it.runIf(darwin)('gives back what it held when its process is killed outright', async () => {
	const dir = scratch();
	const state = join(dir, 'hold.json');
	const { root, work } = await fakeSession(dir);
	const holder = await holderProcess(root, state);
	expect(work.map(priority)).toEqual([4, 4]);
	holder.kill('SIGKILL');
	await eventually(() => !existsSync(state));
	expect(work.map(priority)).toEqual([31, 31]);
}, 20_000);

it.runIf(darwin)('waits for another hold to end before it holds anything', async () => {
	const dir = scratch();
	const state = join(dir, 'hold.json');
	const { root, work } = await fakeSession(dir);
	const first = await holdPeers({ within: root, state, intervalMs: 200 });
	const write = process.stderr.write.bind(process.stderr);
	const waiting = new Promise<void>((resolve) => {
		const spy = vi.spyOn(process.stderr, 'write').mockImplementation((chunk: string | Uint8Array, encoding?: BufferEncoding, done?: (error?: Error | null) => void) => {
			if (String(chunk).includes(`waiting for the hold of pid ${process.pid}`)) resolve();
			return write(chunk, encoding, done);
		});
		cleanups.push(() => spy.mockRestore());
	});
	let secondHeld = false;
	const second = holdPeers({ within: root, state, intervalMs: 200 }).then((hold) => {
		secondHeld = true;
		return hold;
	});
	await waiting;
	expect(secondHeld).toBe(false);
	first.release();
	const hold = await second;
	expect(work.map(priority)).toEqual([4, 4]);
	hold.release();
	expect(work.map(priority)).toEqual([31, 31]);
}, 20_000);

it.runIf(darwin)('gives back what a hold whose owner died left held before it holds anything', async () => {
	const dir = scratch();
	const state = join(dir, 'hold.json');
	const { work } = await fakeSession(dir);
	const rows = processTable();
	const started = (pid: number) => rows.find((row) => row.pid === pid)!.started;
	const group = (pid: number) => rows.find((row) => row.pid === pid)!.group;
	for (const pid of work) execFileSync('taskpolicy', ['-b', '-p', String(pid)]);
	const gone = spawn('true');
	await new Promise((resolve) => gone.on('exit', resolve));
	writeFileSync(state, JSON.stringify({ owner: { pid: gone.pid, started: 'Thu Jan 1 00:00:00 1970' }, held: work.map((pid) => [pid, started(pid), group(pid)]), kept: [], bystanders: [] }));
	expect(work.map(priority)).toEqual([4, 4]);
	const { root: elsewhere } = await fakeSession(scratch());
	const hold = await holdPeers({ within: elsewhere, state, intervalMs: 200 });
	expect(work.map(priority)).toEqual([31, 31]);
	hold.release();
}, 20_000);

it('leaves nothing held that a held process starts while it is being given back', () => {
	const processes = new Map<number, { ppid: number; started: string; background: boolean }>([
		[1, { ppid: 0, started: 'Mon Nov 9 08:00:00 2026', background: false }],
		[20, { ppid: 1, started: 'Mon Nov 9 09:00:00 2026', background: true }],
		[21, { ppid: 20, started: 'Mon Nov 9 09:00:01 2026', background: true }]
	]);
	const control = {
		table: () => [...processes].map(([pid, { ppid, started, background }]) => ({ pid, ppid, group: 20, started, command: 'node', background })),
		setClass: (pid: number, background: boolean) => {
			if (!processes.has(30) && processes.get(20)!.background) processes.set(30, { ppid: 20, started: 'Mon Nov 9 09:05:00 2026', background: true });
			processes.get(pid)!.background = background;
			return true;
		}
	};
	giveBack(
		{
			held: [
				[20, 'Mon Nov 9 09:00:00 2026', 20],
				[21, 'Mon Nov 9 09:00:01 2026', 20]
			],
			kept: [],
			bystanders: []
		},
		control
	);
	expect([...processes].filter(([, { background }]) => background).map(([pid]) => pid)).toEqual([]);
});

const demote = (pid: number) => execFileSync('taskpolicy', ['-b', '-p', String(pid)]);

it.runIf(darwin)('neither holds nor gives back a process already in the background class when the hold starts', async () => {
	const dir = scratch();
	const { root, work } = await fakeSession(dir);
	const [plain, deliberate] = work;
	demote(deliberate!);
	expect([priority(plain!), priority(deliberate!)]).toEqual([31, 4]);
	const hold = await holdPeers({ within: root, state: join(dir, 'hold.json'), intervalMs: 200 });
	expect([priority(plain!), priority(deliberate!)]).toEqual([4, 4]);
	expect(hold.release().held).toBe(1);
	expect([priority(plain!), priority(deliberate!)]).toEqual([31, 4]);
}, 20_000);

it.runIf(darwin)('leaves a process already in the background class there when a held process runs it and the holder is killed outright', async () => {
	const dir = scratch();
	const state = join(dir, 'hold.json');
	const { root, work, read } = await fakeSession(dir, [`bash -c 'sleep 60 & echo "inner $!"; wait'`]);
	const [shell] = work;
	const [deliberate] = await read('inner');
	demote(deliberate!);
	expect([priority(shell!), priority(deliberate!)]).toEqual([31, 4]);
	const holder = await holderProcess(root, state);
	expect(priority(shell!)).toBe(4);
	holder.kill('SIGKILL');
	await eventually(() => !existsSync(state));
	expect([priority(shell!), priority(deliberate!)]).toEqual([31, 4]);
}, 20_000);

it.runIf(darwin)('gives back what a held process started and left behind before the next look', async () => {
	const dir = scratch();
	const go = join(dir, 'go');
	execFileSync('mkfifo', [go]);
	const { root, work, session, read } = await fakeSession(dir, [`bash -c 'read _ < ${go}; sleep 60 & taskpolicy -b -p $!; echo "left $!"; exit'`]);
	const [shell] = work;
	const hold = await holdPeers({ within: root, state: join(dir, 'hold.json'), intervalMs: 60_000 });
	expect(priority(shell!)).toBe(4);
	execFileSync('taskpolicy', ['-B', '-p', String(shell)]);
	const ended = new Promise((resolve) => session.once('exit', resolve));
	writeFileSync(go, '\n');
	const [left] = await read('left');
	cleanups.push(() => {
		try {
			process.kill(left!, 'SIGKILL');
		} catch {}
	});
	await ended;
	expect(processTable().find((row) => row.pid === left)).toMatchObject({ ppid: 1, group: root, background: true });
	hold.release();
	expect(priority(left!)).toBe(31);
}, 20_000);

it.runIf(darwin)('holds after a holder that died while it wrote its state', async () => {
	const dir = scratch();
	const state = join(dir, 'hold.json');
	writeFileSync(state, '');
	const { root, work } = await fakeSession(dir);
	const hold = await holdPeers({ within: root, state, intervalMs: 100 });
	expect(work.map(priority)).toEqual([4, 4]);
	hold.release();
	expect(work.map(priority)).toEqual([31, 31]);
}, 20_000);

it.runIf(darwin)('starts no hold while a killed holder’s peers are still being given back', async () => {
	const dir = scratch();
	const state = join(dir, 'hold.json');
	const { root, work } = await fakeSession(dir, Array.from({ length: 8 }, () => 'sleep 60'));
	const slow = join(dir, 'slow');
	mkdirSync(slow);
	writeFileSync(join(slow, 'taskpolicy'), '#!/bin/sh\nsleep 0.05\nexec /usr/sbin/taskpolicy "$@"\n', { mode: 0o755 });
	const holder = await holderProcess(root, state, { ...process.env, PATH: `${slow}:${process.env.PATH}` });
	expect(work.map(priority)).toEqual(work.map(() => 4));
	holder.kill('SIGKILL');
	while (priorities(work).every((pri) => pri === 4)) await pause(0);
	const hold = await holdPeers({ within: root, state, intervalMs: 20 });
	expect(work.map(priority)).toEqual(work.map(() => 4));
	expect(hold.release().held).toBe(work.length);
	expect(work.map(priority)).toEqual(work.map(() => 31));
}, 30_000);
