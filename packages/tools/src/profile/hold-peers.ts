import { execFile, execFileSync } from 'node:child_process';
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

const TABLE = ['-axo', 'pid=,ppid=,lstart=,comm='];
const ROW = /^\s*(\d+)\s+(\d+)\s+(\S+\s+\S+\s+\d+\s+[\d:]+\s+\d+)\s+(.+?)\s*$/;
const SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const;
const MAX_DEPTH = 64;

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

const table = () => parseProcessTable(execFileSync('ps', TABLE, { encoding: 'utf8', maxBuffer: 16 << 20 }));

function setClass(pid: number, background: boolean): boolean {
	try {
		execFileSync('taskpolicy', [background ? '-b' : '-B', '-p', String(pid)], { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}

export async function holdPeers(intervalMs = 2000): Promise<PeerHold> {
	if (process.platform !== 'darwin')
		throw new Error('--hold-peers moves other sessions to the efficiency cores with macOS taskpolicy, which this platform does not have');
	const self = sessionOf(table(), process.pid);
	const held = new Map<number, string>();
	let total = 0;
	let released = false;
	let sweeping = false;
	let timer: NodeJS.Timeout | undefined;
	const sweep = async () => {
		const rows = parseProcessTable((await execute('ps', TABLE, { maxBuffer: 16 << 20 })).stdout);
		for (const row of peerWork(rows, self)) {
			if (released) return;
			if (held.get(row.pid) === row.started || !setClass(row.pid, true)) continue;
			held.set(row.pid, row.started);
			total++;
		}
	};
	const release = () => {
		if (released) return { held: total, restored: 0 };
		released = true;
		clearInterval(timer);
		for (const signal of SIGNALS) process.off(signal, onSignal);
		process.off('exit', release);
		const restored = stillHeld(table(), held).filter((pid) => setClass(pid, false)).length;
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
