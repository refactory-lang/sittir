import { spawnSync } from 'node:child_process';
import { REPO_ROOT, stableGrammars } from '@sittir/codegen/grammars';

const grammars = stableGrammars();
// Cargo resolves every workspace manifest, so refresh them all before any native build.
for (const buildNative of [false, true]) {
	for (const [i, grammar] of grammars.entries()) {
		const args = [
			'exec',
			'tsx',
			'packages/cli/src/cli.ts',
			'gen',
			'--grammar',
			grammar,
			'--all',
			'--output',
			`packages/${grammar}/src`
		];
		if (!buildNative) args.push('--no-build-native');
		if (!buildNative || i < grammars.length - 1) args.push('--no-workspace-check');
		const child = spawnSync('pnpm', args, { cwd: REPO_ROOT, stdio: 'inherit' });
		if (child.status !== 0) process.exit(child.status ?? 1);
	}
}
