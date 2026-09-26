import { spawnSync } from 'node:child_process';
import { REPO_ROOT, stableGrammars } from '@sittir/codegen/grammars';

const grammars = stableGrammars();
for (const [i, grammar] of grammars.entries()) {
	const args = ['exec', 'tsx', 'packages/cli/src/cli.ts', 'gen', '--grammar', grammar, '--all', '--output', `packages/${grammar}/src`];
	if (i < grammars.length - 1) args.push('--no-workspace-check');
	const child = spawnSync('pnpm', args, { cwd: REPO_ROOT, stdio: 'inherit' });
	if (child.status !== 0) process.exit(child.status ?? 1);
}
