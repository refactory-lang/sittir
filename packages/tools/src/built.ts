import { execFileSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { grammarPackageDir, REPO_ROOT, type GrammarName } from '@sittir/codegen/grammars';

export const runsBuilt = import.meta.url.endsWith('.js');

const BUILD_PROJECT = 'tsconfig.build.json';

function projectOf(file: string): string {
	for (let dir = dirname(realpathSync(file)); ; dir = dirname(dir)) {
		const project = join(dir, BUILD_PROJECT);
		if (existsSync(project)) return project;
		if (dirname(dir) === dir) throw new Error(`${file} lies in no built project`);
	}
}

export function staleBuilds(projects: readonly string[]): string[] {
	const report = execFileSync(join(REPO_ROOT, 'node_modules', '.bin', 'tsrs'), ['--build', '--dry', '--verbose', ...projects], {
		cwd: REPO_ROOT,
		encoding: 'utf8'
	});
	return [...report.matchAll(/A non-dry build would build project '([^']+)'/g)].map((match) => match[1]!);
}

export function measureBuilt(tool: string, grammars: readonly GrammarName[]): void {
	if (!runsBuilt)
		throw new Error(
			`${tool} measures built code: run \`pnpm build\`, then \`node packages/cli/dist/cli.js tool ${tool}\``
		);
	const stale = staleBuilds([projectOf(process.argv[1]!), ...grammars.map((grammar) => join(grammarPackageDir(grammar), BUILD_PROJECT))]);
	if (stale.length > 0)
		throw new Error(
			`${tool} measures built code, and these builds are older than their sources: ${stale.join(', ')}. Run \`pnpm build\`.`
		);
	process.env.NODE_ENV ??= 'production';
}
