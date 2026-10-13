/**
 * Whether a run records its row in a checked-in history file
 * (`validation-history.jsonl`, `test-history.jsonl`), decided once for both.
 *
 * Only the integration branches keep the record. A pull request's branch
 * writes nothing: its rows go in the pull request body, and a history file
 * the branch touched, committed or not, conflicts with every merge from the
 * integration branch (GitHub's merge check does not honour `merge=union`, and
 * an uncommitted append blocks a local `git merge`).
 */

import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';

/** The branches whose runs are recorded. */
export const RECORDING_BRANCHES: readonly string[] = ['master', 'feat/bindings'];

/** `commit`: append the row and commit it; `append`: append it uncommitted; `none`: write nothing. */
export type HistoryRecording = 'commit' | 'append' | 'none';

function branchOf(path: string): string | undefined {
	try {
		return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: dirname(path), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
	} catch {
		return undefined;
	}
}

/**
 * How a run records into the history file at `path`: nothing off the
 * recording branches (a detached head and a directory outside git included)
 * unless `SITTIR_HISTORY_COMMIT=1` asks for it; on them, an uncommitted append
 * when `SITTIR_HISTORY_NO_COMMIT=1` or a codegen-internal run
 * (`SITTIR_INTERNAL_CODEGEN_RUN=1`) asks for one, and a commit otherwise.
 */
export function historyRecording(path: string): HistoryRecording {
	const branch = branchOf(path);
	const recording = process.env['SITTIR_HISTORY_COMMIT'] === '1' || (branch !== undefined && RECORDING_BRANCHES.includes(branch));
	if (!recording) return 'none';
	if (process.env['SITTIR_HISTORY_NO_COMMIT'] === '1' || process.env['SITTIR_INTERNAL_CODEGEN_RUN'] === '1') return 'append';
	return 'commit';
}
