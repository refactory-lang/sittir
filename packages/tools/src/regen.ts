import { spawnSync } from 'node:child_process';

export function regenerateGrammars(grammars: readonly string[], cwd: string): void {
	for (const buildNative of [false, true]) {
		for (const [i, grammar] of grammars.entries()) {
			const args = ['exec', 'tsx', 'packages/cli/src/cli.ts', 'gen', '--grammar', grammar, '--all', '--output', `packages/${grammar}/src`];
			if (!buildNative) args.push('--no-build-native');
			if (!buildNative || i < grammars.length - 1) args.push('--no-workspace-check');
			const child = spawnSync('pnpm', args, { cwd, stdio: 'inherit' });
			if (child.status !== 0) throw new Error(`gen --grammar ${grammar} failed (exit ${String(child.status)})`);
		}
	}
}
