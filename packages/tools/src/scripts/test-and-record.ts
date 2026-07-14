/**
 * test-and-record.ts
 *
 * Wraps `vitest run` for the root `pnpm test` script: runs the suite
 * exactly once (vitest.config.ts's `json` reporter writes a side-artifact
 * report alongside the normal terminal output — no second, separate vitest
 * invocation the way `sittir tool test-history --record` spawns one), then
 * records that report to `test-history.jsonl` via `recordFromReport`.
 *
 * Recording is skipped when extra CLI args are passed through (e.g.
 * `pnpm test packages/foo/bar.test.ts`, a filtered dev run) — a partial
 * run's `failedTestFiles` would make every file that simply wasn't
 * executed this time look "newly fixed" against the last full-suite
 * entry, corrupting the regression diff for anyone recording afterward.
 * Only an unfiltered, whole-suite run is a meaningful history entry.
 *
 * Exits with vitest's own exit code, not a code derived from the recording
 * step — `pnpm test`'s pass/fail signal (CI, a human running it locally)
 * must reflect "did the tests pass," not "are there new regressions since
 * the last recorded entry." A recording failure is logged as a warning and
 * does not change the exit code.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { recordFromReport, formatReport, type VitestJsonReport } from './record-test-run.ts';

const REPO_ROOT = fileURLToPath(new URL('../../../..', import.meta.url));
const REPORT_PATH = new URL('../../../../.vitest-report.json', import.meta.url);
const extraArgs = process.argv.slice(2);

const result = spawnSync('pnpm', ['exec', 'vitest', 'run', ...extraArgs], {
	cwd: REPO_ROOT,
	stdio: 'inherit'
});

if (extraArgs.length > 0) {
	process.exit(result.status ?? 1);
}

if (!existsSync(REPORT_PATH)) {
	console.warn(
		`\n⚠ test-and-record: no JSON report at ${fileURLToPath(REPORT_PATH)} — vitest likely crashed before the ` +
			`json reporter wrote it. Skipping test-history recording for this run.`
	);
	process.exit(result.status ?? 1);
}

try {
	const report = JSON.parse(readFileSync(REPORT_PATH, 'utf8')) as VitestJsonReport;
	const recorded = await recordFromReport(report);
	console.log(`\n${formatReport(recorded)}`);
} catch (e) {
	console.warn(`\n⚠ test-and-record: failed to record test history — ${(e as Error).message}`);
}

process.exit(result.status ?? 1);
