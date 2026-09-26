import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
	REPO_ROOT,
	grammarDisplayName,
	grammarPackageDir,
	nativeCrateDir,
	upstreamPackage
} from '@sittir/codegen/grammars';
import { fetchUpstreamCorpus } from '../corpus/fetch.ts';
import { grammarPackageFiles, type GrammarTemplateVars, type TemplateFile } from './templates.ts';

export interface BootstrapGrammarOptions {
	readonly name: string;
	readonly upstream?: string;
	readonly range?: string;
	readonly install?: boolean;
	readonly generate?: boolean;
	readonly dryRun?: boolean;
}

const GRAMMAR_NAME = /^[a-z][a-z0-9_]*$/;

function latestRange(pkg: string): string {
	const version = execFileSync('npm', ['view', pkg, 'version'], { encoding: 'utf8' }).trim();
	return `^${version}`;
}

const NPM_PACKAGE_NAME = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

function dependencySpec(dependency: string, upstream: string, range: string | undefined): string {
	if (!NPM_PACKAGE_NAME.test(upstream)) return upstream;
	const resolved = range ?? latestRange(upstream);
	return upstream === dependency ? resolved : `npm:${upstream}@${resolved}`;
}

export function templateVars(opts: BootstrapGrammarOptions): GrammarTemplateVars {
	const dependency = upstreamPackage(opts.name);
	return {
		name: opts.name,
		Name: grammarDisplayName(opts.name),
		upstreamDependency: dependency,
		upstreamRange: dependencySpec(dependency, opts.upstream ?? dependency, opts.range)
	};
}

function writeFiles(root: string, files: readonly TemplateFile[], dryRun: boolean): string[] {
	return files.map((file) => {
		const path = join(root, file.path);
		if (!dryRun) {
			mkdirSync(dirname(path), { recursive: true });
			writeFileSync(path, file.contents);
		}
		return path;
	});
}

function addTsconfigReference(name: string, dryRun: boolean): string {
	const path = join(REPO_ROOT, 'tsconfig.json');
	const source = readFileSync(path, 'utf8');
	const ref = `./packages/${name}/tsconfig.build.json`;
	if (source.includes(`"${ref}"`)) return path;
	const anchor = source.match(/^(\s*)\{ "path": "\.\/packages\/tools\/tsconfig\.build\.json" \}/m);
	if (!anchor || anchor.index === undefined) throw new Error('bootstrap-grammar: tsconfig.json has no packages/tools reference to insert before');
	const updated = `${source.slice(0, anchor.index)}${anchor[1]}{ "path": "${ref}" },\n${source.slice(anchor.index)}`;
	if (!dryRun) writeFileSync(path, updated);
	return path;
}

function run(cmd: string, args: readonly string[]): void {
	execFileSync(cmd, args, { cwd: REPO_ROOT, stdio: 'inherit' });
}

export async function bootstrapGrammar(opts: BootstrapGrammarOptions): Promise<number> {
	if (!GRAMMAR_NAME.test(opts.name)) {
		throw new Error(`bootstrap-grammar: '${opts.name}' is not a valid grammar name (${GRAMMAR_NAME})`);
	}
	const packageDir = grammarPackageDir(opts.name);
	const crateDir = nativeCrateDir(opts.name);
	for (const dir of [packageDir, crateDir]) {
		if (existsSync(dir)) throw new Error(`bootstrap-grammar: ${dir} already exists`);
	}

	const vars = templateVars(opts);
	const dryRun = opts.dryRun === true;
	const written = [
		...writeFiles(packageDir, grammarPackageFiles(vars), dryRun),
		addTsconfigReference(opts.name, dryRun)
	];
	for (const path of written) process.stdout.write(`${dryRun ? 'would write' : 'wrote'} ${path}\n`);
	process.stdout.write(`${vars.upstreamDependency}: ${vars.upstreamRange}\n`);
	if (dryRun) return 0;

	run('pnpm', ['exec', 'oxfmt', ...written.filter((path) => /\.(ts|json|md)$/.test(path))]);
	if (opts.install !== false) {
		run('pnpm', ['install']);
		const corpus = await fetchUpstreamCorpus({ grammar: opts.name });
		process.stdout.write(`corpus: ${corpus.files.length} file(s) from ${corpus.repository}@${corpus.ref}\n`);
	}
	if (opts.generate) {
		run('pnpm', [
			'exec',
			'tsx',
			'packages/cli/src/cli.ts',
			'gen',
			'--grammar',
			opts.name,
			'--all',
			'--output',
			`packages/${opts.name}/src`
		]);
	}
	return 0;
}
