import { spawnSync } from 'node:child_process';

export function regenerateGrammars(grammars: readonly string[], cwd: string): number {
	for (const buildNative of [false, true]) {
		for (const [i, grammar] of grammars.entries()) {
			const args = ['exec', 'tsx', 'packages/cli/src/cli.ts', 'gen', '--grammar', grammar, '--all', '--output', `packages/${grammar}/src`];
			if (!buildNative) args.push('--no-build-native');
			if (!buildNative || i < grammars.length - 1) args.push('--no-workspace-check');
			const child = spawnSync('pnpm', args, { cwd, stdio: 'inherit' });
			if (child.status !== 0) return child.status ?? 1;
		}
	}
	return 0;
}
