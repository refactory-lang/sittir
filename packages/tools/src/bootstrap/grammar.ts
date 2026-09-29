import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
	REPO_ROOT,
	grammarDisplayName,
	grammarPackageDir,
	languageApiName,
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

export function addTsconfigReference(name: string, source: string): string {
	const ref = `./packages/${name}/tsconfig.build.json`;
	if (source.includes(`"${ref}"`)) return source;
	const anchor = source.match(/^(\s*)\{ "path": "\.\/packages\/tools\/tsconfig\.build\.json" \}/m);
	if (!anchor || anchor.index === undefined) throw new Error('bootstrap-grammar: tsconfig.json has no packages/tools reference to insert before');
	return `${source.slice(0, anchor.index)}${anchor[1]}{ "path": "${ref}" },\n${source.slice(anchor.index)}`;
}

export function addWorkspaceDependency(name: string, source: string): string {
	const manifest = JSON.parse(source) as { dependencies?: Record<string, string> };
	const dependencies = { ...manifest.dependencies, [`@sittir/${name}`]: 'workspace:*' };
	manifest.dependencies = Object.fromEntries(Object.entries(dependencies).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
	return `${JSON.stringify(manifest, null, '\t')}\n`;
}

const API_IMPORT = /^import type \{ \w+ \} from '@sittir\/[a-z0-9_]+';\n/gm;
const LANGUAGE_APIS = /(export interface LanguageApis \{\n)((?:\treadonly [a-z0-9_]+: \w+;\n)*)(\})/;

function sortedLines(lines: readonly string[]): string {
	return [...new Set(lines)].sort().join('');
}

export function addLanguageApi(name: string, source: string): string {
	const api = languageApiName(name);
	const imports = [...source.matchAll(API_IMPORT)];
	const members = source.match(LANGUAGE_APIS);
	if (imports.length === 0 || !members) throw new Error('bootstrap-grammar: languages.ts has no grammar API imports or LanguageApis map to extend');
	const first = imports[0]!.index;
	const last = imports.at(-1)!;
	const importBlock = sortedLines([...imports.map((m) => m[0]), `import type { ${api} } from '@sittir/${name}';\n`]);
	const withImports = `${source.slice(0, first)}${importBlock}${source.slice(last.index + last[0].length)}`;
	return withImports.replace(LANGUAGE_APIS, (_, open: string, body: string, close: string) =>
		`${open}${sortedLines([...body.split(/(?<=\n)/).filter(Boolean), `\treadonly ${name}: ${api};\n`])}${close}`
	);
}

const REGISTRATIONS: readonly (readonly [path: string, edit: (name: string, source: string) => string])[] = [
	['tsconfig.json', addTsconfigReference],
	['packages/tools/package.json', addWorkspaceDependency],
	['packages/tools/src/languages.ts', addLanguageApi]
];

export function plannedRegistrations(name: string, root: string = REPO_ROOT): TemplateFile[] {
	return REGISTRATIONS.flatMap(([path, edit]) => {
		const source = readFileSync(join(root, path), 'utf8');
		const contents = edit(name, source);
		return contents === source ? [] : [{ path, contents }];
	});
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
		...writeFiles(REPO_ROOT, plannedRegistrations(opts.name), dryRun)
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
