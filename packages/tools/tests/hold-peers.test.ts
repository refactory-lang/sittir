import { expect, it } from 'vitest';
import { parseProcessTable, peerWork, sessionOf, stillHeld } from '../src/profile/hold-peers.ts';

const table = parseProcessTable(
	[
		'    1     0 Mon Nov  9 08:00:00 2026 /sbin/launchd',
		'   10     1 Mon Nov  9 09:00:00 2026 claude',
		'   11    10 Mon Nov  9 09:00:01 2026 /bin/zsh',
		'   12    11 Mon Nov  9 09:00:02 2026 node',
		'   20     1 Mon Nov  9 09:10:00 2026 /Users/me/.local/bin/claude',
		'   21    20 Mon Nov  9 09:10:01 2026 /bin/zsh',
		'   22    21 Mon Nov  9 09:10:02 2026 node',
		'   23    22 Mon Nov  9 09:10:03 2026 /opt/homebrew/bin/rustc',
		'   30     1 Mon Nov  9 08:30:00 2026 /opt/homebrew/bin/sccache',
		'   31    30 Mon Nov  9 09:20:00 2026 /opt/homebrew/bin/rustc',
		'   40     1 Mon Nov  9 08:05:00 2026 /System/Library/CoreServices/Finder.app/Contents/MacOS/Finder',
		'   41     1 Mon Nov  9 08:06:00 2026 /Applications/Claude Helper (Renderer).app/Contents/MacOS/Claude Helper (Renderer)'
	].join('\n')
);

const pids = (rows: readonly { pid: number }[]) => rows.map(({ pid }) => pid).sort((a, b) => a - b);

it('reads a process table with its start times and commands', () => {
	expect(table).toHaveLength(12);
	expect(table[4]).toEqual({ pid: 20, ppid: 1, started: 'Mon Nov 9 09:10:00 2026', command: '/Users/me/.local/bin/claude' });
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
			'   20     1 Mon Nov  9 09:10:00 2026 claude',
			'   22    20 Mon Nov  9 09:10:02 2026 node',
			'   24    22 Mon Nov  9 09:30:00 2026 node',
			'   25    24 Mon Nov  9 09:30:01 2026 /opt/homebrew/bin/rustc',
			'   30     1 Mon Nov  9 09:40:00 2026 /opt/homebrew/bin/sccache',
			'   50     1 Mon Nov  9 09:41:00 2026 node'
		].join('\n')
	);
	const held = new Map([
		[22, 'Mon Nov 9 09:10:02 2026'],
		[23, 'Mon Nov 9 09:10:03 2026'],
		[30, 'Mon Nov 9 08:30:00 2026']
	]);
	expect(stillHeld(later, held)).toEqual([22, 24, 25]);
});
