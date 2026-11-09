import { execFile, execFileSync, spawn } from 'node:child_process';
import { closeSync, constants, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execute = promisify(execFile);

export interface ProcessRow {
	readonly pid: number;
	readonly ppid: number;
	readonly group: number;
	readonly started: string;
	readonly command: string;
	readonly background: boolean;
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

export type Mark = readonly [pid: number, started: string, group: number];

export interface Holding {
	readonly held: readonly Mark[];
	readonly kept: readonly Mark[];
}

interface HoldState extends Holding {
	readonly owner: Owner;
}

const TABLE = ['-axo', 'pid=,ppid=,pgid=,pri=,lstart=,comm='];
const ROW = /^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\S+\s+\S+\s+\d+\s+[\d:]+\s+\d+)\s+(.+?)\s*$/;
const THROTTLED_PRIORITY = 4;
const O_EXLOCK = 0x20;
const LOCK = constants.O_RDWR | constants.O_CREAT | constants.O_NONBLOCK | O_EXLOCK;
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
		if (match)
			rows.push({
				pid: Number(match[1]),
				ppid: Number(match[2]),
				group: Number(match[3]),
				started: match[5]!.replace(/\s+/g, ' '),
				command: match[6]!,
				background: Number(match[4]) === THROTTLED_PRIORITY
			});
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

export function stillHeld(rows: readonly ProcessRow[], { held, kept }: Holding): number[] {
	const byPid = index(rows);
	const live = (marks: readonly Mark[]) => new Set(marks.filter(([pid, started]) => byPid.get(pid)?.started === started).map(([pid]) => pid));
	const taken = live(held);
	const left = live(kept);
	const owned = new Set(held.map(([, , group]) => group));
	for (const [, , group] of kept) owned.delete(group);
	const inherits = (row: ProcessRow) => {
		const nearest = [row, ...ancestors(byPid, row)].find((up) => taken.has(up.pid) || left.has(up.pid));
		return nearest === undefined ? row.background && owned.has(row.group) : taken.has(nearest.pid);
	};
	return rows
		.filter(inherits)
		.map((row) => row.pid)
		.sort((a, b) => a - b);
}

export function within(rows: readonly ProcessRow[], root: number | undefined): ProcessRow[] {
	if (root === undefined) return [...rows];
	const byPid = index(rows);
	return rows.filter((row) => row.pid === root || [...ancestors(byPid, row)].some((up) => up.pid === root));
}

export const processTable = () => parseProcessTable(execFileSync('ps', TABLE, { encoding: 'utf8', maxBuffer: 16 << 20 }));

function setClass(pid: number, background: boolean): boolean {
	try {
		execFileSync('taskpolicy', [background ? '-b' : '-B', '-p', String(pid)], { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}

const isRunning = (rows: readonly ProcessRow[], owner: Owner) => rows.some((row) => row.pid === owner.pid && row.started === owner.started);

function writeState(path: string, state: HoldState): void {
	const temporary = `${path}.${process.pid}.tmp`;
	writeFileSync(temporary, JSON.stringify(state));
	renameSync(temporary, path);
}

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

const system: ProcessControl = { table: processTable, setClass };

export function giveBack(holding: Holding, control: ProcessControl = system): number {
	const restored = new Set<number>();
	for (let pass = 0; pass < GIVE_BACK_PASSES; pass++) {
		const fresh = stillHeld(control.table(), holding).filter((pid) => !restored.has(pid));
		if (fresh.length === 0) break;
		for (const pid of fresh) if (control.setClass(pid, false)) restored.add(pid);
	}
	return restored.size;
}

function watch(path: string, owner: Owner, intervalMs: number): void {
	const timer = setInterval(() => {
		const state = readState(path);
		const ours = state !== undefined && state.owner.pid === owner.pid && state.owner.started === owner.started;
		if (ours && isRunning(processTable(), owner)) return;
		clearInterval(timer);
		if (ours) {
			giveBack(state);
			rmSync(path, { force: true });
		}
	}, intervalMs);
}

async function acquire(path: string, intervalMs: number): Promise<number> {
	mkdirSync(dirname(path), { recursive: true });
	let waitingOn: number | undefined;
	for (;;) {
		try {
			return openSync(`${path}.lock`, LOCK);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'EAGAIN') throw error;
		}
		const holder = readState(path)?.owner.pid;
		if (holder !== undefined && holder !== waitingOn) {
			waitingOn = holder;
			process.stderr.write(`hold-peers: waiting for the hold of pid ${holder} to end\n`);
		}
		await new Promise((resolve) => setTimeout(resolve, intervalMs));
	}
}

export async function holdPeers(options: HoldOptions = {}): Promise<PeerHold> {
	if (process.platform !== 'darwin')
		throw new Error('--hold-peers moves other sessions to the efficiency cores with macOS taskpolicy, which this platform does not have');
	const intervalMs = options.intervalMs ?? 2000;
	const path = options.state ?? DEFAULT_STATE;
	const rows = processTable();
	const owner: Owner = { pid: process.pid, started: rows.find((row) => row.pid === process.pid)!.started };
	const self = sessionOf(rows, process.pid);
	const lock = await acquire(path, intervalMs);
	const left = readState(path);
	if (left !== undefined) giveBack(left);
	const held = new Map<number, Mark>();
	const kept = new Map<number, Mark>();
	const holding = (): Holding => ({ held: [...held.values()], kept: [...kept.values()] });
	const record = () => writeState(path, { owner, ...holding() });
	record();
	const watchdog = spawn(process.execPath, [fileURLToPath(import.meta.url), WATCH, path, String(owner.pid), owner.started, String(Math.min(intervalMs, 500))], {
		detached: true,
		stdio: ['ignore', 'ignore', 'ignore', lock]
	});
	watchdog.unref();
	let total = 0;
	let released = false;
	let sweeping = false;
	let timer: NodeJS.Timeout | undefined;
	const sweep = async () => {
		const current = within(parseProcessTable((await execute('ps', TABLE, { maxBuffer: 16 << 20 })).stdout), options.within);
		if (released) return;
		const inherited = new Set(stillHeld(current, holding()));
		const fresh = peerWork(current, self).filter((row) => held.get(row.pid)?.[1] !== row.started && kept.get(row.pid)?.[1] !== row.started);
		if (fresh.length === 0) return;
		const taken = fresh.filter((row) => !row.background || inherited.has(row.pid));
		for (const row of fresh) (taken.includes(row) ? held : kept).set(row.pid, [row.pid, row.started, row.group]);
		record();
		const refused = taken.filter((row) => !setClass(row.pid, true));
		for (const row of refused) held.delete(row.pid);
		if (refused.length > 0) record();
		total += taken.length - refused.length;
	};
	const release = () => {
		if (released) return { held: total, restored: 0 };
		released = true;
		clearInterval(timer);
		for (const signal of SIGNALS) process.off(signal, onSignal);
		process.off('exit', release);
		const restored = giveBack(holding());
		rmSync(path, { force: true });
		watchdog.kill();
		closeSync(lock);
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
