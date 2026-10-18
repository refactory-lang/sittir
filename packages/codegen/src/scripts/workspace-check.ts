import { spawnSync } from 'node:child_process';

export const WORKSPACE_CHECK = ['cargo', 'check', '--workspace', '--features', 'napi-bindings'] as const;

export function runWorkspaceCheck(cwd: string): number {
	console.log(`  → ${WORKSPACE_CHECK.join(' ')} (catches cross-grammar breakage)…`);
	const [command, ...args] = WORKSPACE_CHECK;
	const status = spawnSync(command, args, { cwd, stdio: 'inherit' }).status ?? 1;
	if (status !== 0) {
		console.error(
			`    Workspace cargo check failed. Other grammars' generated code does not compile — ` +
				`render-module.ts changes likely emit invalid code for them. Fix and re-run.`
		);
	}
	return status;
}
