// An arena engine that checks structure at run time edits through each
// kind's full `$patch`; a default engine edits through what each setter
// alone needs. Both must leave the same arena behind: the same words and
// bytes at the same addresses, the same counts, the same chunks freed in the
// same order once every handle is released, and the same renders. Each mode
// runs in its own child process (`fixtures/with-parity.mts`), since the
// parsed trees that link records name are numbered per process.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const fixture = fileURLToPath(new URL('./fixtures/with-parity.mts', import.meta.url));

function run(grammar: string, mode: 'default' | 'runtime'): string[] {
	const out = execFileSync(process.execPath, ['--import', 'tsx', fixture, grammar, mode], {
		cwd: fileURLToPath(new URL('../..', import.meta.url)),
		encoding: 'utf8',
		env: { ...process.env, SITTIR_BACKEND: 'native' },
		maxBuffer: 256 * 1024 * 1024
	});
	return out.trim().split('\n');
}

describe('a $with edit of an arena node', () => {
	it.each(['rust', 'typescript', 'python', 'regex', 'scm'])('writes the same arena whether or not the engine checks structure at run time (%s)', (grammar) => {
		const checked = run(grammar, 'runtime');
		const unchecked = run(grammar, 'default');
		const first = checked.findIndex((line, n) => unchecked[n] !== line);
		expect(first === -1 ? undefined : { checked: checked[first], unchecked: unchecked[first] }).toBeUndefined();
		expect(unchecked.length).toBe(checked.length);
		const { summary } = JSON.parse(checked.at(-1)!) as { summary: { setters: number; steps: number } };
		expect(summary.setters).toBeGreaterThan(0);
		expect(summary.steps).toBeGreaterThan(summary.setters);
	}, 120_000);
});
