import { readFileSync } from 'node:fs';
import { relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, expect } from 'vitest';
import type { RunnerTask } from 'vitest';
import { liveEngineCount } from './packages/common/src/engine-census.ts';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const ALLOWLIST = Symbol.for('sittir.engineAllowlist');

function loadAllowlist(): ReadonlySet<string> {
	const cache = globalThis as Record<symbol, ReadonlySet<string> | undefined>;
	return (cache[ALLOWLIST] ??= new Set(
		readFileSync(new URL('./vitest.engine-allowlist.txt', import.meta.url), 'utf8')
			.split(/\r?\n/)
			.filter((line) => line !== '' && !line.startsWith('#'))
	));
}

function ranWhole(tasks: readonly RunnerTask[]): boolean {
	return tasks.every((task) => (task.type === 'suite' ? ranWhole(task.tasks) : task.mode === 'run' && task.result?.state !== 'skip'));
}

// oxlint-disable-next-line no-empty-pattern
afterAll(({}, suite) => {
	const file = relative(ROOT, expect.getState().testPath ?? '').split(sep).join('/');
	const live = liveEngineCount();
	const listed = loadAllowlist().has(file);
	if (live > 0 && !listed) {
		throw new Error(`${file}: ${live} engine(s) never disposed; use \`using engine = await createEngine(...)\` in a test, or sharedEngine from @sittir/common/testing for a shared one`);
	}
	if (live === 0 && listed && ranWhole(suite.tasks)) {
		throw new Error(`${file}: no engine left undisposed; remove it from vitest.engine-allowlist.txt`);
	}
});
