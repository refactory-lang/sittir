// Usage: native-store.mts fetch|store <grammar> <profile> <scratch-dir>   (from a prepared tree's root, under its tsx)
//        native-store.mts ensure | prune <days> <kept-dir>                (from anywhere)
// Release addons kept as assets of the RELEASE prerelease, so a tree whose
// addon was built before restores it instead of compiling it. An addon is one
// bundle (arena-benchmark-runtime.mjs) named by its grammar, profile, platform
// and the tree's native build fingerprint (native-binary-freshness.ts): the
// toolchain, the build configuration and every native input, the facts its
// build stamp records (store reads them from the stamp the build wrote). So a
// commit that changes no native input names the same bundle as its parent. fetch restores a stored bundle and holds it to the
// tree's own freshness check, exiting 1 when none is stored; store packs the
// built addon and its stamp, uploading the manifest last, since it marks the
// bundle complete. Each fetched or stored bundle leaves a directory named by
// its label in <scratch-dir>. prune deletes the assets older than <days> days
// whose label no directory in <kept-dir> names.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { pack, restore } from '../arena-benchmark-runtime.mjs';

const RELEASE = 'benchmark-addons';
const repo = process.env.GITHUB_REPOSITORY ? ['--repo', process.env.GITHUB_REPOSITORY] : [];
const gh = (args: string[]): string => execFileSync('gh', args, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
const [action, ...args] = process.argv.slice(2);

async function bundle(grammar: string, profile: string, scratch: string, built: boolean) {
	const root = process.cwd();
	const fromTree = (path: string) => import(pathToFileURL(join(root, path)).href);
	const freshness = await fromTree('packages/codegen/src/scripts/native-binary-freshness.ts');
	const { nativeBindingRelDir } = await fromTree('packages/codegen/src/grammars.ts');
	const recorded = built ? freshness.nativeBuildStamp(root, grammar) : undefined;
	if (built && recorded?.profile !== profile) throw new Error(`${grammar}: no ${profile} build stamp to store`);
	const fingerprint = recorded ? { toolchain: recorded.toolchain, config: recorded.config, inputs: recorded.inputs } : freshness.nativeBuildFingerprint(root, grammar);
	const digest = createHash('sha256').update(JSON.stringify({ profile, ...fingerprint })).digest('hex');
	const label = `${grammar}-${profile}-${process.platform}-${process.arch}-${digest.slice(0, 32)}`;
	const directory = join(scratch, label);
	rmSync(directory, { recursive: true, force: true });
	mkdirSync(directory, { recursive: true });
	const stamps = relative(root, dirname(freshness.unstrippedBinaryPath(root, grammar, freshness.hostBinaryName(grammar))));
	return { root, freshness, label, directory, stamp: { label, abi: process.versions.modules }, paths: [nativeBindingRelDir(grammar), stamps] };
}

if (action === 'fetch') {
	const [grammar, profile, scratch] = args;
	const { root, freshness, label, directory, stamp } = await bundle(grammar, profile, scratch, false);
	try {
		gh(['release', 'download', RELEASE, ...repo, '--dir', directory, '--pattern', `${label}.manifest.json`]);
	} catch {
		console.log(`${grammar}: no stored addon ${label}`);
		process.exit(1);
	}
	gh(['release', 'download', RELEASE, ...repo, '--dir', directory, '--pattern', `${label}.tar.gz`]);
	restore({ directory, required: [label], root, stamp });
	const { fresh, reason } = freshness.nativeBuildFreshness(root, grammar, profile);
	if (!fresh) throw new Error(`${grammar}: the stored addon ${label} is not fresh in this tree: ${reason}`);
	console.log(`${grammar}: restored the stored addon ${label}`);
} else if (action === 'store') {
	const [grammar, profile, scratch] = args;
	const { root, label, directory, stamp, paths } = await bundle(grammar, profile, scratch, true);
	pack({ directory, label, paths, root, stamp });
	gh(['release', 'upload', RELEASE, ...repo, join(directory, `${label}.tar.gz`), '--clobber']);
	gh(['release', 'upload', RELEASE, ...repo, join(directory, `${label}.manifest.json`), '--clobber']);
	console.log(`${grammar}: stored ${label}`);
} else if (action === 'ensure') {
	try {
		gh(['release', 'view', RELEASE, ...repo]);
	} catch {
		const notes = 'Release addons built from master for the paired-refs, probe and oxc-reference benchmarks, one bundle per grammar and native build fingerprint. Written by benchmark-addons.yml and by the benchmarks that build addons. Not a product release.';
		gh(['release', 'create', RELEASE, ...repo, '--prerelease', '--title', 'Benchmark addons', '--notes', notes]);
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
	throw new Error('usage: native-store.mts fetch|store <grammar> <profile> <scratch-dir> | ensure | prune <days> <kept-dir>');
}
