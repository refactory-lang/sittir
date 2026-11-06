import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const runsBuilt = import.meta.url.endsWith('.js');

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));

function buildProjects(): string[] {
	const packages = join(ROOT, 'packages');
	return readdirSync(packages)
		.map((name) => join(packages, name, 'tsconfig.build.json'))
		.filter((project) => existsSync(project));
}

export function staleBuilds(): string[] {
	const report = execFileSync(
		join(ROOT, 'node_modules', '.bin', 'tsrs'),
		['--build', '--dry', '--verbose', ...buildProjects()],
		{
			cwd: ROOT,
			encoding: 'utf8'
		}
	);
	return [...report.matchAll(/A non-dry build would build project '([^']+)'/g)].map((match) => match[1]!);
}

export function measureBuilt(tool: string): void {
	if (!runsBuilt)
		throw new Error(
			`${tool} measures built code: run \`pnpm build\`, then \`node packages/cli/dist/cli.js tool ${tool}\``
		);
	const stale = staleBuilds();
	if (stale.length > 0)
		throw new Error(
			`${tool} measures built code, and these builds are older than their sources: ${stale.join(', ')}. Run \`pnpm build\`.`
		);
	process.env.NODE_ENV ??= 'production';
}
