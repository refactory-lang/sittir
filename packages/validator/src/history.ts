/**
 * Append-only JSONL history for validation runs.
 *
 * Each entry is one JSON line. The file is checked into git so that
 * pass/fail trends are visible in code review.
 *
 * Consumers call `appendHistory(entry)` after each full validation run
 * and `readHistory()` to inspect past runs.
 */

import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Grammar, Backend } from './run.ts';

/** One row in `validation-history.jsonl`. */
export interface ValidationRun {
	/** ISO-8601 timestamp of the run. */
	ts: string;
	grammar: Grammar;
	backend: Backend;
	fromPass: number;
	fromTotal: number;
	covPass: number;
	covTotal: number;
	rtPass: number;
	rtTotal: number;
	rtAstMatchPass: number;
	factoryPass: number;
	factoryTotal: number;
	factoryAstMatchPass: number;
}

const HISTORY_PATH = resolve(
	fileURLToPath(new URL('..', import.meta.url)),
	'validation-history.jsonl',
);

/** Append a single validation run entry to the history file. */
export function appendHistory(entry: ValidationRun): void {
	appendFileSync(HISTORY_PATH, JSON.stringify(entry) + '\n', 'utf8');
}

/** Read all past validation runs from the history file. */
export function readHistory(): ValidationRun[] {
	if (!existsSync(HISTORY_PATH)) return [];
	return readFileSync(HISTORY_PATH, 'utf8')
		.split('\n')
		.filter((line) => line.trim() && !line.startsWith('//'))
		.map((line) => JSON.parse(line) as ValidationRun);
}

/** Resolve the absolute path to the history file (useful for tooling). */
export function historyPath(): string {
	return HISTORY_PATH;
}
