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
	readRenderParsePass: number;
	readRenderParseTotal: number;
	readRenderParseAstMatchPass: number;
	readRenderParseShallowPass: number;
	readRenderParseShallowTotal: number;
	readRenderParseShallowAstMatchPass: number;
	factoryRenderParsePass: number;
	factoryRenderParseTotal: number;
	factoryRenderParseAstMatchPass: number;
	/** Legacy pre-rename fields kept optional for older rows. */
	rtPass?: number;
	rtTotal?: number;
	rtAstMatchPass?: number;
	factoryPass?: number;
	factoryTotal?: number;
	factoryAstMatchPass?: number;
}

/**
 * Resolve the history file path. Evaluated at call time so tests can override
 * it via the `SITTIR_HISTORY_PATH` environment variable without requiring a
 * module reload.
 */
function getHistoryPath(): string {
	return (
		process.env['SITTIR_HISTORY_PATH'] ??
		resolve(fileURLToPath(new URL('..', import.meta.url)), 'validation-history.jsonl')
	);
}

/** Return true when a parsed JSONL line represents a real `ValidationRun`. */
function isValidationRun(entry: unknown): entry is ValidationRun {
	if (typeof entry !== 'object' || entry === null) return false;
	return !('schema' in entry) && typeof (entry as { ts?: unknown })['ts'] === 'string';
}

/** Append a single validation run entry to the history file. */
export function appendHistory(entry: ValidationRun): void {
	appendFileSync(getHistoryPath(), JSON.stringify(entry) + '\n', 'utf8');
}

/** Read all past validation runs from the history file, skipping non-run lines (e.g. schema headers). */
export function readHistory(): ValidationRun[] {
	const path = getHistoryPath();
	if (!existsSync(path)) return [];
	return readFileSync(path, 'utf8')
		.split('\n')
		.filter((line) => line.trim() && !line.startsWith('//'))
		.map((line) => JSON.parse(line) as unknown)
		.filter(isValidationRun);
}

/** Resolve the absolute path to the history file (useful for tooling). */
export function historyPath(): string {
	return getHistoryPath();
}
