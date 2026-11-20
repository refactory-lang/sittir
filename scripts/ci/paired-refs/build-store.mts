// Usage: build-store.mts fetch|store <grammar> <profile> <scratch-dir>   (from a prepared tree's root, under its tsx)
//        build-store.mts fetch-compiled|store-compiled <scratch-dir>    (from a checked-out tree's root)
//        build-store.mts compiled-paths | ensure | prune <days> <kept-dir>
// Builds kept as assets of the RELEASE prerelease, so a tree whose build was
// made before restores it instead of making it. Each is one bundle
// (arena-benchmark-runtime.mjs) whose label names what it was built from:
// - a release addon: its grammar, profile, platform and the tree's native
//   build fingerprint (native-binary-freshness.ts), the toolchain, build
//   configuration and native inputs its build stamp records (store reads them
//   from the stamp the build wrote). A restored addon is held to the tree's
//   own freshness check.
// - the compiled packages (compiled-paths): platform, node and git's content
//   hash of packages/ and of the repository's root files, which are all the
//   packages' build reads.
// So a commit that changes neither names the same bundles as its parent.
// fetch exits 1 when nothing is stored under the label; store uploads the
// manifest last, since it marks the bundle complete. Each fetched or stored
// bundle leaves a directory named by its label in <scratch-dir>. prune deletes
// the assets older than <days> days whose label no directory in <kept-dir>
// names.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { pack, restore } from '../arena-benchmark-runtime.mjs';

const RELEASE = 'benchmark-builds';
const COMPILED = ['dist', 'build', 'tsconfig.build.tsbuildinfo'];
const repo = process.env.GITHUB_REPOSITORY ? ['--repo', process.env.GITHUB_REPOSITORY] : [];
const gh = (args: string[]): string => execFileSync('gh', args, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
const git = (args: string[]): string => execFileSync('git', args, { encoding: 'utf8' }).trim();
const sha256 = (text: string): string => createHash('sha256').update(text).digest('hex');
const [action, ...args] = process.argv.slice(2);
const root = process.cwd();

function scratchFor(scratch: string, label: string): string {
	const directory = join(scratch, label);
	rmSync(directory, { recursive: true, force: true });
	mkdirSync(directory, { recursive: true });
	return directory;
}

function fetched(label: string, directory: string, stamp: object): boolean {
	try {
		gh(['release', 'download', RELEASE, ...repo, '--dir', directory, '--pattern', `${label}.manifest.json`]);
	} catch {
		return false;
	}
	gh(['release', 'download', RELEASE, ...repo, '--dir', directory, '--pattern', `${label}.tar.gz`]);
	restore({ directory, required: [label], root, stamp });
	return true;
}

function stored(label: string, directory: string, stamp: object, paths: string[]): void {
	pack({ directory, label, paths, root, stamp });
	gh(['release', 'upload', RELEASE, ...repo, join(directory, `${label}.tar.gz`), '--clobber']);
	gh(['release', 'upload', RELEASE, ...repo, join(directory, `${label}.manifest.json`), '--clobber']);
}

async function addon(grammar: string, profile: string, built: boolean) {
	const fromTree = (path: string) => import(pathToFileURL(join(root, path)).href);
	const freshness = await fromTree('packages/codegen/src/scripts/native-binary-freshness.ts');
	const { nativeBindingRelDir } = await fromTree('packages/codegen/src/grammars.ts');
	const recorded = built ? freshness.nativeBuildStamp(root, grammar) : undefined;
	if (built && recorded?.profile !== profile) throw new Error(`${grammar}: no ${profile} build stamp to store`);
	const fingerprint = recorded ? { toolchain: recorded.toolchain, config: recorded.config, inputs: recorded.inputs } : freshness.nativeBuildFingerprint(root, grammar);
	const label = `${grammar}-${profile}-${process.platform}-${process.arch}-${sha256(JSON.stringify({ profile, ...fingerprint })).slice(0, 32)}`;
	const stamps = relative(root, dirname(freshness.unstrippedBinaryPath(root, grammar, freshness.hostBinaryName(grammar))));
	return { freshness, label, stamp: { label, abi: process.versions.modules }, paths: [nativeBindingRelDir(grammar), stamps] };
}

function compiledPaths(): string[] {
	return readdirSync(join(root, 'packages'))
		.sort()
		.flatMap((name) => COMPILED.map((output) => `packages/${name}/${output}`))
		.filter((path) => existsSync(join(root, path)));
}

function compiledLabel(): string {
	const rootFiles = git(['ls-tree', 'HEAD'])
		.split('\n')
		.filter((line) => line.split(/\s+/)[1] === 'blob')
		.join('\n');
	const sources = sha256(`${git(['rev-parse', 'HEAD:packages'])}\n${rootFiles}`);
	return `compiled-${process.platform}-${process.arch}-node${process.version.slice(1).replaceAll('.', '-')}-${sources.slice(0, 32)}`;
}

if (action === 'fetch') {
	const [grammar, profile, scratch] = args;
	const { freshness, label, stamp } = await addon(grammar, profile, false);
	if (!fetched(label, scratchFor(scratch, label), stamp)) {
		console.log(`${grammar}: nothing stored as ${label}`);
		process.exit(1);
	}
	const { fresh, reason } = freshness.nativeBuildFreshness(root, grammar, profile);
	if (!fresh) throw new Error(`${grammar}: the stored addon ${label} is not fresh in this tree: ${reason}`);
	console.log(`${grammar}: restored ${label}`);
} else if (action === 'store') {
	const [grammar, profile, scratch] = args;
	const { label, stamp, paths } = await addon(grammar, profile, true);
	stored(label, scratchFor(scratch, label), stamp, paths);
	console.log(`${grammar}: stored ${label}`);
} else if (action === 'fetch-compiled') {
	const [scratch] = args;
	const label = compiledLabel();
	if (!fetched(label, scratchFor(scratch, label), { label })) {
		console.log(`compiled packages: nothing stored as ${label}`);
		process.exit(1);
	}
	console.log(`compiled packages: restored ${label}`);
} else if (action === 'store-compiled') {
	const [scratch] = args;
	const label = compiledLabel();
	stored(label, scratchFor(scratch, label), { label }, compiledPaths());
	console.log(`compiled packages: stored ${label}`);
} else if (action === 'compiled-paths') {
	console.log(compiledPaths().join('\n'));
} else if (action === 'ensure') {
	try {
		gh(['release', 'view', RELEASE, ...repo]);
	} catch {
		const notes = 'Builds for the paired-refs, probe and oxc-reference benchmarks: release addons and compiled packages, one bundle per label of what it was built from. Written by benchmark-builds.yml and by the benchmarks that build. Not a product release.';
		gh(['release', 'create', RELEASE, ...repo, '--prerelease', '--title', 'Benchmark builds', '--notes', notes]);
	}
} else if (action === 'prune') {
	const [days, kept] = args;
	const keep = new Set(existsSync(kept) ? readdirSync(kept) : []);
	const cutoff = Date.now() - Number(days) * 86_400_000;
	const id = gh(['api', `repos/${process.env.GITHUB_REPOSITORY}/releases/tags/${RELEASE}`, '--jq', '.id']).trim();
	const assets = gh(['api', '--paginate', `repos/${process.env.GITHUB_REPOSITORY}/releases/${id}/assets?per_page=100`, '--jq', '.[] | [.id, .name, .created_at] | @tsv']);
	for (const line of assets.split('\n').filter(Boolean)) {
		const [asset, name, created] = line.split('\t');
		const label = name.replace(/\.(tar\.gz|manifest\.json)$/, '');
		if (keep.has(label) || Date.parse(created) >= cutoff) continue;
		gh(['api', '-X', 'DELETE', `repos/${process.env.GITHUB_REPOSITORY}/releases/assets/${asset}`]);
		console.log(`pruned ${name}`);
	}
} else {
	throw new Error('usage: build-store.mts fetch|store <grammar> <profile> <scratch-dir> | fetch-compiled|store-compiled <scratch-dir> | compiled-paths | ensure | prune <days> <kept-dir>');
}
