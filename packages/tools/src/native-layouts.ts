import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative } from 'node:path';
import { PACKAGES_DIR, REPO_ROOT, grammarPackageDir, nativeBinaryName, nativePlatformPackage, type GrammarName } from '@sittir/codegen/grammars';
import { addonFileName, engineStampOf, platformPackageName, targetSuffix } from '@sittir/common/engine';
import { imageSymbols, mappedImages, type MappedImage, type NodeRunner } from './native-images.ts';
import {
	NATIVE_PACKAGES_DIR,
	SAMPLE_SOURCE,
	assembleNativePackages,
	declareNativePackages,
	grammarNapiPackage,
	pack,
	packWorkspacePackage,
	readManifest,
	type PlatformPackageManifest
} from './native-pack.ts';
import { run } from './spawn.ts';
import type { TreeIdCounterReport } from './tree-id-counter.ts';

export const LAYOUT_GRAMMARS: readonly GrammarName[] = ['python', 'rust'];

export const LAYOUTS = ['pnpm', 'npm-hoisted', 'npm-nested'] as const;

export type Layout = (typeof LAYOUTS)[number];

export interface LayoutPacks {
	readonly packages: Readonly<Record<string, string>>;
	readonly platforms: Readonly<Record<string, string>>;
	readonly skewed: Readonly<Record<string, string>>;
	readonly stamps: Readonly<Record<string, string>>;
}


export interface ExpectedRefusal {
	readonly packageName: string;
	readonly home: string;
	readonly file: string;
	readonly binaryName: string;
	readonly built: string;
	readonly loaded: string;
	readonly engine: string;
}

export interface LayoutResult {
	readonly layout: Layout;
	readonly gaps: readonly string[];
}

const PACKS_INDEX = 'packs.json';
const SHIP = 'ship';
const SKEW = 'skew';
const REFUSAL = 'refusal.json';

const [FIRST, SECOND] = LAYOUT_GRAMMARS as readonly [GrammarName, GrammarName];
const grammarPackage = (grammar: GrammarName): string => `@sittir/${grammar}`;
const realFolder = (image: string): string => realpathSync.native(dirname(image));
const lastLine = (output: string): string => output.trim().split('\n').at(-1)!;

export function packLayouts(bindings: string, out: string): LayoutPacks {
	const manifests = LAYOUT_GRAMMARS.map((grammar) => join(grammarPackageDir(grammar), 'package.json')).map((path) => [path, readFileSync(path, 'utf8')] as const);
	const stamps: Record<string, string> = {};
	const packPlatforms = (dirs: readonly string[], into: string): Record<string, string> => {
		mkdirSync(into, { recursive: true });
		return Object.fromEntries(
			dirs.map((dir) => {
				const { name, main } = readManifest<PlatformPackageManifest>(dir);
				const tarball = relative(out, pack('npm', dir, into));
				stamps[tarball] = engineStampOf(join(dir, main));
				return [name, tarball];
			})
		);
	};
	try {
		const shipped = LAYOUT_GRAMMARS.flatMap((grammar) => assembleNativePackages(grammarNapiPackage(grammar), join(bindings, SHIP)));
		for (const grammar of LAYOUT_GRAMMARS) declareNativePackages(grammarNapiPackage(grammar));
		const platforms = packPlatforms(shipped, join(out, SHIP));
		const packages = Object.fromEntries(
			['types', 'common', ...LAYOUT_GRAMMARS].map((name) => [`@sittir/${name}`, relative(out, packWorkspacePackage(join(PACKAGES_DIR, name), join(out, SHIP)))])
		);
		const skewed = packPlatforms(assembleNativePackages(grammarNapiPackage(SECOND), join(bindings, SKEW)), join(out, SKEW));
		const packs: LayoutPacks = { packages, platforms, skewed, stamps };
		writeFileSync(join(out, PACKS_INDEX), `${JSON.stringify(packs, null, 2)}\n`);
		return packs;
	} finally {
		for (const [path, text] of manifests) writeFileSync(path, text);
		for (const grammar of LAYOUT_GRAMMARS) rmSync(join(grammarPackageDir(grammar), NATIVE_PACKAGES_DIR), { recursive: true, force: true });
	}
}

export function layoutFiles(packsDir: string, packs: LayoutPacks, skewed: boolean): Readonly<Record<string, string>> {
	const file = (tarball: string): string => `file:${join(packsDir, tarball).replaceAll('\\', '/')}`;
	const grammars = new Set(LAYOUT_GRAMMARS.map(grammarPackage));
	const resolved = Object.entries({ ...packs.packages, ...packs.platforms, ...(skewed ? packs.skewed : {}) });
	const dependencies = Object.fromEntries(resolved.filter(([name]) => grammars.has(name)).map(([name, tarball]) => [name, file(tarball)]));
	const overrides = Object.fromEntries(resolved.filter(([name]) => !grammars.has(name)).map(([name, tarball]) => [name, file(tarball)]));
	return {
		'package.json': `${JSON.stringify({ name: 'sittir-layout', private: true, type: 'module', dependencies, overrides }, null, 2)}\n`,
		'pnpm-workspace.yaml': `${JSON.stringify({ overrides }, null, 2)}\n`
	};
}

export function shippedLayoutGaps(mapped: readonly MappedImage[], grammars: readonly GrammarName[], suffix: string): string[] {
	const gaps: string[] = [];
	const addons = mapped.filter((entry) => entry.kind === 'addon');
	const expected = grammars.map((grammar) => `${platformPackageName(nativePlatformPackage(grammar), suffix)}/${addonFileName(nativeBinaryName(grammar), suffix)}`);
	const found = addons.map((addon) => `${basename(realFolder(addon.image))}/${basename(addon.image)}`);
	if (found.join('\n') !== expected.join('\n')) {
		gaps.push(`the process mapped the addons ${addons.map((addon) => addon.image).join(', ') || 'none'}, not ${expected.join(' then ')}`);
	}
	for (const kind of ['engine', 'std'] as const) {
		const images = mapped.filter((entry) => entry.kind === kind).map((entry) => entry.image);
		if (images.length !== 1) gaps.push(`the process mapped ${images.length} ${kind} images, not 1: ${images.join(', ') || 'none'}`);
	}
	const [first] = addons;
	for (const entry of mapped) {
		if (entry.kind !== 'addon' && first !== undefined && realFolder(entry.image) !== realFolder(first.image)) {
			gaps.push(`${entry.image} is not beside the first addon, in ${dirname(first.image)}`);
		}
	}
	return gaps;
}

export function engineRefusalGap(refusal: string | undefined, expected: ExpectedRefusal): string | undefined {
	if (refusal === undefined) return `${expected.packageName} loaded beside an engine of another stamp`;
	const prefix =
		`${expected.packageName}: ${expected.home}${expected.file} is present and failed to load: ` +
		`sittir: ${expected.binaryName} was built against engine ${expected.built} but loaded engine ${expected.loaded} from `;
	const at = refusal.indexOf(prefix);
	if (at < 0) return `expected a refusal containing\n  ${prefix}\ngot\n  ${refusal}`;
	const named = refusal.slice(at + prefix.length).split('\n')[0]!.trim();
	if (!existsSync(named)) return `the refusal names ${named}, which does not exist`;
	return realpathSync.native(named) === realpathSync.native(expected.engine) ? undefined : `the refusal names ${named}, not ${expected.engine}`;
}

interface TargetShell {
	node(cwd: string): NodeRunner;
	install(layout: Layout, cwd: string): void;
}

function pinnedPnpm(): string {
	const { packageManager } = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as { packageManager?: string };
	if (packageManager?.startsWith('pnpm@') !== true) throw new Error(`${join(REPO_ROOT, 'package.json')} pins no pnpm in packageManager`);
	return packageManager;
}

function targetShell(container: string | undefined, mounts: readonly string[]): TargetShell {
	const exec = (command: readonly string[], cwd: string, shell?: boolean): string => {
		if (container === undefined) return run(command[0]!, command.slice(1), cwd, shell);
		const user = `${process.getuid!()}:${process.getgid!()}`;
		const volumes = mounts.flatMap((mount) => ['--volume', `${mount}:${mount}`]);
		return run('docker', ['run', '--rm', '--user', user, '--env', 'HOME=/tmp', ...volumes, '--workdir', cwd, container, ...command], cwd, false);
	};
	const pnpm = ['npx', '--yes', pinnedPnpm()];
	return {
		node: (cwd) => (args) => exec([container === undefined ? process.execPath : 'node', ...args], cwd, false),
		install: (layout, cwd) => {
			const command =
				layout === 'pnpm'
					? [...pnpm, 'install', '--no-frozen-lockfile']
					: ['npm', 'install', `--install-strategy=${layout === 'npm-hoisted' ? 'hoisted' : 'nested'}`, '--no-audit', '--no-fund'];
			exec(command, cwd);
		}
	};
}

const LOAD_PROBE = `for (const grammar of ${JSON.stringify(LAYOUT_GRAMMARS)}) await (await import(\`@sittir/\${grammar}\`)).default.createEngine();\n`;

const COUNTER_PROBE = `const { treeIdCounter } = await import(${JSON.stringify(new URL('./tree-id-counter.ts', import.meta.url).href)});
const samples = [];
for (const [grammar, source] of ${JSON.stringify(LAYOUT_GRAMMARS.map((grammar) => [grammar, SAMPLE_SOURCE[grammar]]))}) {
	samples.push({ language: (await import(\`@sittir/\${grammar}\`)).default, source });
}
console.log(JSON.stringify(await treeIdCounter(samples)));
`;

const SKEW_PROBE = `import { writeFileSync } from 'node:fs';
await (await import(${JSON.stringify(grammarPackage(FIRST))})).default.createEngine();
let refusal;
try {
	await (await import(${JSON.stringify(grammarPackage(SECOND))})).default.createEngine();
} catch (error) {
	refusal = error instanceof Error ? error.message : String(error);
}
writeFileSync(new URL(${JSON.stringify(`./${REFUSAL}`)}, import.meta.url), JSON.stringify({ refusal }));
`;

function consumer(work: string, name: string, files: Readonly<Record<string, string>>): string {
	const dir = join(work, name);
	mkdirSync(dir);
	for (const [file, text] of Object.entries(files)) writeFileSync(join(dir, file), text);
	return dir;
}

async function shippedGaps(dir: string, shell: TargetShell, suffix: string): Promise<string[]> {
	const mapped = mappedImages(join(dir, 'load.mjs'), shell.node(dir), suffix);
	const gaps = shippedLayoutGaps(mapped, LAYOUT_GRAMMARS, suffix);
	for (const addon of mapped.filter((entry) => entry.kind === 'addon')) {
		const defined = (await imageSymbols(addon.image, { defined: 'ts_' })).defined ?? [];
		if (defined.length > 0) gaps.push(`${addon.image} defines ${defined.join(', ')}`);
	}
	const counter = JSON.parse(lastLine(shell.node(dir)(['counter.mjs']))) as TreeIdCounterReport;
	if (counter.outOfOrder.length > 0) gaps.push(`tree ids not above the one before them: ${counter.outOfOrder.join(', ')}`);
	if ('onGlobalThis' in counter) gaps.push(`globalThis.__sittirNextTreeId is ${JSON.stringify(counter.onGlobalThis)}`);
	return gaps;
}

function skewGaps(dir: string, shell: TargetShell, suffix: string, packs: LayoutPacks): string[] {
	const engines = mappedImages(join(dir, 'skew.mjs'), shell.node(dir), suffix).filter((entry) => entry.kind === 'engine');
	if (engines.length !== 1) return [`the skew process mapped ${engines.length} engine images, not 1: ${engines.map((entry) => entry.image).join(', ') || 'none'}`];
	const [engine] = engines as [MappedImage];
	const name = platformPackageName(nativePlatformPackage(SECOND), suffix);
	const built = packs.stamps[packs.skewed[name] ?? ''];
	if (built === undefined) return [`the packs hold no ${name} built from another commit`];
	if (built === engine.stamp) return [`${name} built from another commit holds the shipped stamp ${built}`];
	const { refusal } = JSON.parse(readFileSync(join(dir, REFUSAL), 'utf8')) as { refusal?: string };
	const gap = engineRefusalGap(refusal, {
		packageName: grammarPackage(SECOND),
		home: `${name}/`,
		file: addonFileName(nativeBinaryName(SECOND), suffix),
		binaryName: nativeBinaryName(SECOND),
		built,
		loaded: engine.stamp!,
		engine: engine.image
	});
	return gap === undefined ? [] : [gap];
}

export async function checkLayouts(packsPath: string, target: string, container?: string): Promise<LayoutResult[]> {
	const suffix = targetSuffix(target);
	const packsDir = realpathSync.native(packsPath);
	const packs = JSON.parse(readFileSync(join(packsDir, PACKS_INDEX), 'utf8')) as LayoutPacks;
	const work = realpathSync.native(mkdtempSync(join(tmpdir(), 'sittir-layouts-')));
	const shell = targetShell(container, [REPO_ROOT, packsDir, work]);
	try {
		const results: LayoutResult[] = [];
		for (const layout of LAYOUTS) {
			const shipped = consumer(work, `${layout}-${SHIP}`, { ...layoutFiles(packsDir, packs, false), 'load.mjs': LOAD_PROBE, 'counter.mjs': COUNTER_PROBE });
			const skewed = consumer(work, `${layout}-${SKEW}`, { ...layoutFiles(packsDir, packs, true), 'skew.mjs': SKEW_PROBE });
			shell.install(layout, shipped);
			shell.install(layout, skewed);
			results.push({ layout, gaps: [...(await shippedGaps(shipped, shell, suffix)), ...skewGaps(skewed, shell, suffix, packs)] });
		}
		return results;
	} finally {
		rmSync(work, { recursive: true, force: true });
	}
}
