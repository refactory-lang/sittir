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
/**
 * Resolve the history file path. Evaluated at call time so tests can override
 * it via the `SITTIR_HISTORY_PATH` environment variable without requiring a
 * module reload.
 */
function getHistoryPath() {
    return (process.env['SITTIR_HISTORY_PATH'] ??
        resolve(fileURLToPath(new URL('..', import.meta.url)), 'validation-history.jsonl'));
}
/** Return true when a parsed JSONL line represents a real `ValidationRun`. */
function isValidationRun(entry) {
    if (typeof entry !== 'object' || entry === null)
        return false;
    return !('schema' in entry) && typeof entry['ts'] === 'string';
}
/** Append a single validation run entry to the history file. */
export function appendHistory(entry) {
    appendFileSync(getHistoryPath(), JSON.stringify(entry) + '\n', 'utf8');
}
/** Read all past validation runs from the history file, skipping non-run lines (e.g. schema headers). */
export function readHistory() {
    const path = getHistoryPath();
    if (!existsSync(path))
        return [];
    return readFileSync(path, 'utf8')
        .split('\n')
        .filter((line) => line.trim() && !line.startsWith('//'))
        .map((line) => JSON.parse(line))
        .filter(isValidationRun);
}
/** Resolve the absolute path to the history file (useful for tooling). */
export function historyPath() {
    return getHistoryPath();
}
//# sourceMappingURL=history.js.map