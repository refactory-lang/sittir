import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
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
import { nativePackGaps, unexpectedNativeBinaries } from '../native-pack.ts';

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

const TYPES_CHECK = `import type { SlotKey } from '@sittir/types';
interface Node { readonly _argument: readonly string[]; readonly __slotNames__?: { readonly _argument: 'arguments' } }
export const plural: SlotKey<Node, 'argument'> = 'arguments';
// @ts-expect-error a slot key is the model's slot name, not the storage name
export const storage: SlotKey<Node, 'argument'> = 'argument';
`;

const TYPES_CHECK_CONFIG = {
	compilerOptions: { target: 'esnext', module: 'nodenext', strict: true, noEmit: true, skipLibCheck: false, types: [] },
	files: ['types.ts']
};

function tscBin(): string {
	const manifest = createRequire(import.meta.url).resolve('typescript/package.json');
	const { bin } = JSON.parse(readFileSync(manifest, 'utf-8')) as { bin: { tsc: string } };
	return join(dirname(manifest), bin.tsc);
}

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
try {
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
		gaps.push(...nativePackGaps(entries, binding, suffixes).map((file) => `@sittir/${grammar}: lacks ${file}`));
		if (release) {
			gaps.push(...unexpectedNativeBinaries(entries, binding, suffixes).map((file) => `@sittir/${grammar}: holds ${file}, which is not a declared target`));
		}
		dependencies[`@sittir/${grammar}`] = `file:${tarball}`;
	}
	if (gaps.length > 0) {
		throw new Error(`${release ? 'release' : 'host'} pack check failed:\n  ${gaps.join('\n  ')}`);
	}

	writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: 'consumer', private: true, type: 'module', dependencies }));
	writeFileSync(join(consumer, 'smoke.mjs'), SMOKE);
	run('npm', ['install', '--no-audit', '--no-fund'], consumer);
	writeFileSync(join(consumer, 'types.ts'), TYPES_CHECK);
	writeFileSync(join(consumer, 'tsconfig.json'), JSON.stringify(TYPES_CHECK_CONFIG));
	run(process.execPath, [tscBin(), '-p', consumer], consumer);
	console.log('@sittir/types: type-checks from the installed package, without its devDependencies');
	for (const grammar of grammars) {
		const source = SAMPLE_SOURCE[grammar];
		if (source === undefined) throw new Error(`no sample source for grammar '${grammar}'`);
		process.stdout.write(run('node', ['smoke.mjs', grammar, source], consumer));
	}
} finally {
	rmSync(root, { recursive: true, force: true });
}
