/**
 * Append-only JSONL history for validation runs.
 *
 * Each entry is one JSON line. The file is checked into git so that
 * pass/fail trends are visible in code review.
 *
 * Consumers call `appendHistory(entry)` after each full validation run
 * and `readHistory()` to inspect past runs.
 */
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
/** Append a single validation run entry to the history file. */
export declare function appendHistory(entry: ValidationRun): void;
/** Read all past validation runs from the history file, skipping non-run lines (e.g. schema headers). */
export declare function readHistory(): ValidationRun[];
/** Resolve the absolute path to the history file (useful for tooling). */
export declare function historyPath(): string;
//# sourceMappingURL=history.d.ts.map