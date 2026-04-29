/**
 * Spec 012 T059 — TS-side runner invoked by `scripts/bench-codemod.sh`.
 *
 * Walks the corpus directory passed as `process.argv[2]`, runs the
 * US1 codemod (`runCodemodOnDir`), and prints `<wall_ms> <files>` to
 * stdout. The shell wrapper times this single invocation by reading
 * the wall_ms value out, so the wall-clock measurement is internal —
 * we don't pay process-spawn time twice and we don't depend on
 * `hyperfine` / `time` formatting.
 *
 * The active backend is picked up via `SITTIR_BACKEND` env in the
 * shell wrapper; the TS layer just consumes whichever backend
 * `getActiveBackend()` resolves to.
 */

import { runCodemodOnDir } from '../tests/acceptance/codemod-inline.ts';

async function main(): Promise<void> {
	const corpus = process.argv[2];
	if (!corpus) {
		console.error('bench-codemod-runner: missing corpus directory argument');
		process.exit(2);
	}
	const start = Date.now();
	const results = await runCodemodOnDir(corpus);
	const elapsed = Date.now() - start;
	process.stdout.write(`${elapsed} ${results.length}\n`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
