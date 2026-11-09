import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, it } from 'vitest';
import { giveBack, holdPeers, parseProcessTable, peerWork, processTable, sessionOf, stillHeld } from '../src/profile/hold-peers.ts';

const darwin = process.platform === 'darwin';
const cleanups: (() => void)[] = [];
afterEach(() => {
	for (const cleanup of cleanups.splice(0)) cleanup();
});

const priority = (pid: number) => Number(execFileSync('ps', ['-o', 'pri=', '-p', String(pid)], { encoding: 'utf8' }).trim());
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(check: () => boolean, ms: number): Promise<boolean> {
	for (const end = Date.now() + ms; Date.now() < end; await pause(100)) if (check()) return true;
	return check();
}

function scratch(): string {
	const dir = mkdtempSync(join(tmpdir(), 'hold-peers-'));
	cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
	return dir;
}

async function fakeSession(dir: string, work = ['sleep 60', 'sleep 60']): Promise<{ root: number; work: number[] }> {
	const shell = join(dir, 'claude');
	copyFileSync('/bin/bash', shell);
	execFileSync('codesign', ['-s', '-', '-f', shell], { stdio: 'ignore' });
	const session = spawn(shell, ['-c', `${work.map((command) => `${command} &`).join(' ')} wait`], { stdio: 'ignore' });
	cleanups.push(() => {
		try {
			execFileSync('pkill', ['-P', String(session.pid)]);
		} catch {}
		session.kill('SIGKILL');
	});
	const children = () =>
		processTable()
			.filter((row) => row.ppid === session.pid)
			.map((row) => row.pid);
	expect(await until(() => children().length === work.length, 5000)).toBe(true);
	return { root: session.pid!, work: children() };
}

function holderProcess(root: number, state: string): Promise<ChildProcess> {
	const module = fileURLToPath(new URL('../src/profile/hold-peers.ts', import.meta.url));
	const script = `import { holdPeers } from ${JSON.stringify(module)};
await holdPeers({ within: ${root}, state: ${JSON.stringify(state)}, intervalMs: 200 });
console.log('held');
setInterval(() => {}, 1000);`;
	const holder = spawn(process.execPath, ['--input-type=module', '-e', script], { stdio: ['ignore', 'pipe', 'inherit'] });
	cleanups.push(() => holder.kill('SIGKILL'));
	return new Promise((resolve, reject) => {
		holder.stdout!.on('data', (chunk: Buffer) => chunk.toString().includes('held') && resolve(holder));
		holder.on('exit', (code) => reject(new Error(`the holder exited with ${code} before it held`)));
	});
}

const table = parseProcessTable(
	[
		'    1     0   31 Mon Nov  9 08:00:00 2026 /sbin/launchd',
		'   10     1   31 Mon Nov  9 09:00:00 2026 claude',
		'   11    10   31 Mon Nov  9 09:00:01 2026 /bin/zsh',
		'   12    11   31 Mon Nov  9 09:00:02 2026 node',
		'   20     1   31 Mon Nov  9 09:10:00 2026 /Users/me/.local/bin/claude',
		'   21    20   31 Mon Nov  9 09:10:01 2026 /bin/zsh',
		'   22    21   31 Mon Nov  9 09:10:02 2026 node',
		'   23    22   31 Mon Nov  9 09:10:03 2026 /opt/homebrew/bin/rustc',
		'   30     1   31 Mon Nov  9 08:30:00 2026 /opt/homebrew/bin/sccache',
		'   31    30   31 Mon Nov  9 09:20:00 2026 /opt/homebrew/bin/rustc',
		'   40     1   31 Mon Nov  9 08:05:00 2026 /System/Library/CoreServices/Finder.app/Contents/MacOS/Finder',
		'   41     1   31 Mon Nov  9 08:06:00 2026 /Applications/Claude Helper (Renderer).app/Contents/MacOS/Claude Helper (Renderer)'
	].join('\n')
);

const pids = (rows: readonly { pid: number }[]) => rows.map(({ pid }) => pid).sort((a, b) => a - b);

it('reads a process table with its start times and commands', () => {
	expect(table).toHaveLength(12);
	expect(table[4]).toEqual({ pid: 20, ppid: 1, started: 'Mon Nov 9 09:10:00 2026', command: '/Users/me/.local/bin/claude', background: false });
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
			'   20     1   31 Mon Nov  9 09:10:00 2026 claude',
			'   22    20   31 Mon Nov  9 09:10:02 2026 node',
			'   24    22   31 Mon Nov  9 09:30:00 2026 node',
			'   25    24   31 Mon Nov  9 09:30:01 2026 /opt/homebrew/bin/rustc',
			'   30     1   31 Mon Nov  9 09:40:00 2026 /opt/homebrew/bin/sccache',
			'   50     1   31 Mon Nov  9 09:41:00 2026 node'
		].join('\n')
	);
	const held = new Map([
		[22, 'Mon Nov 9 09:10:02 2026'],
		[23, 'Mon Nov 9 09:10:03 2026'],
		[30, 'Mon Nov 9 08:30:00 2026']
	]);
	expect(stillHeld(later, held, new Map())).toEqual([22, 24, 25]);
});

it('gives back nothing under a process kept in the background class unless a held process is nearer', () => {
	const rows = parseProcessTable(
		[
			'   20     1   31 Mon Nov  9 09:10:00 2026 node',
			'   21    20    4 Mon Nov  9 09:10:01 2026 node',
			'   22    21    4 Mon Nov  9 09:10:02 2026 node',
			'   23    22   31 Mon Nov  9 09:10:03 2026 node',
			'   24    20    4 Mon Nov  9 09:20:00 2026 node'
		].join('\n')
	);
	expect(rows.map(({ background }) => background)).toEqual([false, true, true, false, true]);
	const held = new Map([
		[20, 'Mon Nov 9 09:10:00 2026'],
		[23, 'Mon Nov 9 09:10:03 2026']
	]);
	const kept = new Map([[21, 'Mon Nov 9 09:10:01 2026']]);
	expect(stillHeld(rows, held, kept)).toEqual([20, 23, 24]);
});

it.runIf(darwin)('gives back what it held when its process is killed outright', async () => {
	const dir = scratch();
	const { root, work } = await fakeSession(dir);
	const holder = await holderProcess(root, join(dir, 'hold.json'));
	expect(work.map(priority)).toEqual([4, 4]);
	holder.kill('SIGKILL');
	expect(await until(() => work.every((pid) => priority(pid) === 31), 5000)).toBe(true);
}, 20_000);

it.runIf(darwin)('waits for another hold to end before it holds anything', async () => {
	const dir = scratch();
	const state = join(dir, 'hold.json');
	const { root, work } = await fakeSession(dir);
	const first = await holdPeers({ within: root, state, intervalMs: 200 });
	let secondHeld = false;
	const second = holdPeers({ within: root, state, intervalMs: 200 }).then((hold) => {
		secondHeld = true;
		return hold;
	});
	await pause(1500);
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
	for (const pid of work) execFileSync('taskpolicy', ['-b', '-p', String(pid)]);
	const gone = spawn('true');
	await new Promise((resolve) => gone.on('exit', resolve));
	writeFileSync(state, JSON.stringify({ owner: { pid: gone.pid, started: 'Thu Jan 1 00:00:00 1970' }, held: work.map((pid) => [pid, started(pid)]), kept: [] }));
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
		table: () => [...processes].map(([pid, { ppid, started, background }]) => ({ pid, ppid, started, command: 'node', background })),
		setClass: (pid: number, background: boolean) => {
			if (!processes.has(30) && processes.get(20)!.background) processes.set(30, { ppid: 20, started: 'Mon Nov 9 09:05:00 2026', background: true });
			processes.get(pid)!.background = background;
			return true;
		}
	};
	giveBack(
		{
			held: [
				[20, 'Mon Nov 9 09:00:00 2026'],
				[21, 'Mon Nov 9 09:00:01 2026']
			],
			kept: []
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
	const { root, work } = await fakeSession(dir, ["bash -c 'sleep 60 & wait'"]);
	const [shell] = work;
	const under = () => processTable().filter((row) => row.ppid === shell);
	expect(await until(() => under().length === 1, 5000)).toBe(true);
	const [deliberate] = under().map((row) => row.pid);
	demote(deliberate!);
	expect([priority(shell!), priority(deliberate!)]).toEqual([31, 4]);
	const holder = await holderProcess(root, join(dir, 'hold.json'));
	expect(priority(shell!)).toBe(4);
	holder.kill('SIGKILL');
	expect(await until(() => priority(shell!) === 31, 5000)).toBe(true);
	await pause(1000);
	expect(priority(deliberate!)).toBe(4);
}, 20_000);
