import { execFile, execFileSync, spawn } from 'node:child_process';
import { mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execute = promisify(execFile);

export interface ProcessRow {
	readonly pid: number;
	readonly ppid: number;
	readonly started: string;
	readonly command: string;
}

export interface PeerHold {
	release(): { readonly held: number; readonly restored: number };
}

export interface HoldOptions {
	readonly intervalMs?: number;
	readonly within?: number;
	readonly state?: string;
}

interface Owner {
	readonly pid: number;
	readonly started: string;
}

interface HoldState {
	readonly owner: Owner;
	readonly held: readonly (readonly [number, string])[];
}

const TABLE = ['-axo', 'pid=,ppid=,lstart=,comm='];
const ROW = /^\s*(\d+)\s+(\d+)\s+(\S+\s+\S+\s+\d+\s+[\d:]+\s+\d+)\s+(.+?)\s*$/;
const SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const;
const MAX_DEPTH = 64;
const GIVE_BACK_PASSES = 5;
const WATCH = '--watch';
const DEFAULT_STATE = join(homedir(), 'Library', 'Caches', 'sittir', 'hold-peers.json');

const isSession = (command: string) => /(^|\/)claude$/.test(command);
const isCompilerCache = (command: string) => /(^|\/)sccache$/.test(command);

export function parseProcessTable(text: string): ProcessRow[] {
	const rows: ProcessRow[] = [];
	for (const line of text.split('\n')) {
		const match = ROW.exec(line);
		if (match) rows.push({ pid: Number(match[1]), ppid: Number(match[2]), started: match[3]!.replace(/\s+/g, ' '), command: match[4]! });
	}
	return rows;
}

function* ancestors(byPid: ReadonlyMap<number, ProcessRow>, row: ProcessRow): Generator<ProcessRow> {
	let up = byPid.get(row.ppid);
	for (let depth = 0; up !== undefined && up.pid !== row.pid && depth < MAX_DEPTH; depth++) {
		yield up;
		up = up.ppid === up.pid ? undefined : byPid.get(up.ppid);
	}
}

const index = (rows: readonly ProcessRow[]) => new Map(rows.map((row) => [row.pid, row]));

export function sessionOf(rows: readonly ProcessRow[], pid: number): number | undefined {
	const byPid = index(rows);
	const row = byPid.get(pid);
	if (row === undefined) return undefined;
	for (const up of ancestors(byPid, row)) if (isSession(up.command)) return up.pid;
	return undefined;
}

export function peerWork(rows: readonly ProcessRow[], self: number | undefined): ProcessRow[] {
	const byPid = index(rows);
	return rows.filter((row) => {
		if (isSession(row.command)) return false;
		if (isCompilerCache(row.command)) return true;
		for (const up of ancestors(byPid, row)) {
			if (up.pid === self) return false;
			if (isSession(up.command) || isCompilerCache(up.command)) return true;
		}
		return false;
	});
}

export function stillHeld(rows: readonly ProcessRow[], held: ReadonlyMap<number, string>): number[] {
	const byPid = index(rows);
	const alive = new Set(rows.filter((row) => held.get(row.pid) === row.started).map((row) => row.pid));
	return rows
		.filter((row) => alive.has(row.pid) || [...ancestors(byPid, row)].some((up) => alive.has(up.pid)))
		.map((row) => row.pid)
		.sort((a, b) => a - b);
}

export function within(rows: readonly ProcessRow[], root: number | undefined): ProcessRow[] {
	if (root === undefined) return [...rows];
	const byPid = index(rows);
	return rows.filter((row) => row.pid === root || [...ancestors(byPid, row)].some((up) => up.pid === root));
}

const table = () => parseProcessTable(execFileSync('ps', TABLE, { encoding: 'utf8', maxBuffer: 16 << 20 }));

function setClass(pid: number, background: boolean): boolean {
	try {
		execFileSync('taskpolicy', [background ? '-b' : '-B', '-p', String(pid)], { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}

const isRunning = (rows: readonly ProcessRow[], owner: Owner) => rows.some((row) => row.pid === owner.pid && row.started === owner.started);

function readState(path: string): HoldState | undefined {
	try {
		return JSON.parse(readFileSync(path, 'utf8')) as HoldState;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT' || error instanceof SyntaxError) return undefined;
		throw error;
	}
}

export interface ProcessControl {
	table(): ProcessRow[];
	setClass(pid: number, background: boolean): boolean;
}

const system: ProcessControl = { table, setClass };

export function giveBack(held: readonly (readonly [number, string])[], control: ProcessControl = system): number {
	const recorded = new Map(held);
	const restored = new Set<number>();
	for (const row of control.table()) if (recorded.get(row.pid) === row.started && control.setClass(row.pid, false)) restored.add(row.pid);
	for (let pass = 0; pass < GIVE_BACK_PASSES; pass++) {
		const fresh = stillHeld(control.table(), recorded).filter((pid) => !restored.has(pid));
		if (fresh.length === 0) break;
		for (const pid of fresh) if (control.setClass(pid, false)) restored.add(pid);
	}
	return restored.size;
}

function takeOverStale(path: string, owner: Owner): boolean {
	const claimed = `${path}.${process.pid}.stale`;
	try {
		renameSync(path, claimed);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
		throw error;
	}
	const state = readState(claimed);
	if (state !== undefined && (state.owner.pid !== owner.pid || state.owner.started !== owner.started)) {
		renameSync(claimed, path);
		return false;
	}
	if (state !== undefined) giveBack(state.held);
	unlinkSync(claimed);
	return true;
}

function watch(path: string, owner: Owner, intervalMs: number): void {
	const timer = setInterval(() => {
		const state = readState(path);
		if (state === undefined || state.owner.pid !== owner.pid || state.owner.started !== owner.started) {
			clearInterval(timer);
			return;
		}
		if (isRunning(table(), owner)) return;
		takeOverStale(path, owner);
		clearInterval(timer);
	}, intervalMs);
}

async function acquire(path: string, owner: Owner, intervalMs: number): Promise<void> {
	mkdirSync(dirname(path), { recursive: true });
	let waitingOn: number | undefined;
	for (;;) {
		try {
			writeFileSync(path, JSON.stringify({ owner, held: [] } satisfies HoldState), { flag: 'wx' });
			return;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
		}
		const state = readState(path);
		if (state !== undefined && !isRunning(table(), state.owner)) {
			takeOverStale(path, state.owner);
			continue;
		}
		if (state !== undefined && waitingOn !== state.owner.pid) {
			waitingOn = state.owner.pid;
			process.stderr.write(`hold-peers: waiting for the hold of pid ${waitingOn} to end\n`);
		}
		await new Promise((resolve) => setTimeout(resolve, intervalMs));
	}
}

export async function holdPeers(options: HoldOptions = {}): Promise<PeerHold> {
	if (process.platform !== 'darwin')
		throw new Error('--hold-peers moves other sessions to the efficiency cores with macOS taskpolicy, which this platform does not have');
	const intervalMs = options.intervalMs ?? 2000;
	const path = options.state ?? DEFAULT_STATE;
	const rows = table();
	const owner: Owner = { pid: process.pid, started: rows.find((row) => row.pid === process.pid)!.started };
	const self = sessionOf(rows, process.pid);
	await acquire(path, owner, intervalMs);
	spawn(process.execPath, [fileURLToPath(import.meta.url), WATCH, path, String(owner.pid), owner.started, String(Math.min(intervalMs, 500))], {
		detached: true,
		stdio: 'ignore'
	}).unref();
	const held = new Map<number, string>();
	const record = () => {
		const temporary = `${path}.${process.pid}.tmp`;
		writeFileSync(temporary, JSON.stringify({ owner, held: [...held] } satisfies HoldState));
		renameSync(temporary, path);
	};
	let total = 0;
	let released = false;
	let sweeping = false;
	let timer: NodeJS.Timeout | undefined;
	const sweep = async () => {
		const current = within(parseProcessTable((await execute('ps', TABLE, { maxBuffer: 16 << 20 })).stdout), options.within);
		if (released) return;
		const fresh = peerWork(current, self).filter((row) => held.get(row.pid) !== row.started);
		if (fresh.length === 0) return;
		for (const row of fresh) held.set(row.pid, row.started);
		record();
		const refused = fresh.filter((row) => !setClass(row.pid, true));
		for (const row of refused) held.delete(row.pid);
		if (refused.length > 0) record();
		total += fresh.length - refused.length;
	};
	const release = () => {
		if (released) return { held: total, restored: 0 };
		released = true;
		clearInterval(timer);
		for (const signal of SIGNALS) process.off(signal, onSignal);
		process.off('exit', release);
		const restored = giveBack([...held]);
		const state = readState(path);
		if (state?.owner.pid === owner.pid && state.owner.started === owner.started) unlinkSync(path);
		return { held: total, restored };
	};
	const onSignal = (signal: NodeJS.Signals) => {
		release();
		process.kill(process.pid, signal);
	};
	for (const signal of SIGNALS) process.once(signal, onSignal);
	process.once('exit', release);
	await sweep();
	timer = setInterval(() => {
		if (sweeping || released) return;
		sweeping = true;
		void sweep().finally(() => {
			sweeping = false;
		});
	}, intervalMs);
	timer.unref();
	return { release };
}

if (process.argv[2] === WATCH && process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const [path, pid, started, intervalMs] = process.argv.slice(3);
	watch(path!, { pid: Number(pid), started: started! }, Number(intervalMs));
}
