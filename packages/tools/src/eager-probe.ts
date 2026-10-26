import { spawnSync } from 'node:child_process';
import { printKept } from './regen.ts';

export const EAGER_PROBE_GENERATOR = 'docs/superpowers/probes/2026-10-12-record-wire/eager/generate.mts';

const LABEL = 'eager probe';

export function regenerateEagerProbe(cwd: string, verbose: boolean): number {
	const args = ['exec', 'tsx', EAGER_PROBE_GENERATOR];
	if (verbose) return spawnSync('pnpm', args, { cwd, stdio: 'inherit' }).status ?? 1;
	const child = spawnSync('pnpm', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
	const status = child.status ?? 1;
	if (status !== 0) {
		printKept(LABEL, child.stdout);
		printKept(LABEL, child.stderr, (line) => void process.stderr.write(line));
	}
	return status;
}
