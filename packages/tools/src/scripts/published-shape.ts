import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
	NATIVE_LOADER,
	NATIVE_TARGETS,
	NATIVE_TYPINGS,
	PACKAGES_DIR,
	assertGrammar,
	grammarPackageDir,
	nativeBinaryName,
	stableGrammars
} from '@sittir/codegen/grammars';
import { hostPlatform, platformSuffix, targetSuffix } from '@sittir/common/engine';
import { nativePackGaps } from '../native-pack.ts';

const SAMPLE_SOURCE: Readonly<Record<string, string>> = {
	python: 'def  f( x ):\n    return x\n',
	regex: 'a+(b|c)*',
	rust: 'fn  main( ) { let x = 1; }\n',
	scm: '(identifier) @name\n',
	typescript: 'const  x = [1, 2];\n'
};

const SMOKE = `import { createEngine } from '@sittir/common';
const [name, source] = process.argv.slice(2);
const { default: language } = await import('@sittir/' + name);
const engine = await createEngine(language);
const rendered = engine.parse(source).$render();
if (rendered !== source) throw new Error(name + ': rendered ' + JSON.stringify(rendered) + ', expected ' + JSON.stringify(source));
console.log('@sittir/' + name + ': createEngine, parse and render from the installed package');
`;

function run(command: string, args: readonly string[], cwd: string): string {
	const child = spawnSync(command, args, { cwd, encoding: 'utf-8', shell: process.platform === 'win32' });
	if (child.status !== 0) {
		throw new Error(`${command} ${args.join(' ')} failed in ${cwd}:\n${child.stdout}${child.stderr}`);
	}
	return child.stdout;
}

function pack(dir: string, into: string): string {
	if (!existsSync(join(dir, 'dist'))) throw new Error(`${dir} has no dist; run \`pnpm run build\` first`);
	const before = new Set(readdirSync(into));
	run('pnpm', ['pack', '--pack-destination', into], dir);
	const tarball = readdirSync(into).find((file) => !before.has(file));
	if (tarball === undefined) throw new Error(`pnpm pack wrote no tarball for ${dir}`);
	return join(into, tarball);
}

const args = process.argv.slice(2);
const release = args.includes('--release');
const named = args.filter((arg) => arg !== '--release');
const grammars = named.length === 0 ? stableGrammars() : named.map(assertGrammar);
const suffixes = release ? NATIVE_TARGETS.map(targetSuffix) : [platformSuffix(hostPlatform())];

const root = mkdtempSync(join(tmpdir(), 'sittir-published-'));
const tarballs = join(root, 'tarballs');
const consumer = join(root, 'consumer');
mkdirSync(tarballs);
mkdirSync(consumer);

const dependencies: Record<string, string> = {};
for (const name of ['types', 'common']) dependencies[`@sittir/${name}`] = `file:${pack(join(PACKAGES_DIR, name), tarballs)}`;

const gaps: string[] = [];
for (const grammar of grammars) {
	const tarball = pack(grammarPackageDir(grammar), tarballs);
	const entries = run('tar', ['-tzf', tarball], root).split('\n');
	const binding = { binaryName: nativeBinaryName(grammar), loader: NATIVE_LOADER, typings: NATIVE_TYPINGS };
	gaps.push(...nativePackGaps(entries, binding, suffixes).map((file) => `@sittir/${grammar}: ${file}`));
	dependencies[`@sittir/${grammar}`] = `file:${tarball}`;
}
if (gaps.length > 0) {
	console.error(`${release ? 'release' : 'host'} pack check: the packed packages lack\n  ${gaps.join('\n  ')}`);
	process.exit(1);
}

writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: 'consumer', private: true, type: 'module', dependencies }));
writeFileSync(join(consumer, 'smoke.mjs'), SMOKE);
run('npm', ['install', '--no-audit', '--no-fund'], consumer);
for (const grammar of grammars) {
	const source = SAMPLE_SOURCE[grammar];
	if (source === undefined) throw new Error(`no sample source for grammar '${grammar}'`);
	process.stdout.write(run('node', ['smoke.mjs', grammar, source], consumer));
}
