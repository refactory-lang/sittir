import assert from 'node:assert/strict';
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const BUILD_DRIVER = 'scripts/build-native.mts';
const MODULE_CLOSURE = 'packages/codegen/src/scripts/module-closure.ts';
const STAMPS = 'node_modules/.cache/sittir/native-build';
const DIFF = ['--no-color', '--no-ext-diff', '--no-renames'];

const git = (cwd, args, input) => execFileSync('git', args, { cwd, encoding: 'utf8', input, maxBuffer: 2 ** 30 });
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const writeJson = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
const short = (commit) => commit.slice(0, 9);

function isAncestor(cwd, ancestor, commit) {
	try {
		git(cwd, ['merge-base', '--is-ancestor', ancestor, commit]);
		return true;
	} catch (error) {
		if (error.status === 1) return false;
		throw error;
	}
}

export async function driverClosure(repo, commit) {
	const scratch = mkdtempSync(join(tmpdir(), 'build-path-'));
	const archive = join(scratch, 'driver.tar');
	const snapshot = join(scratch, 'tree');
	try {
		git(repo, ['archive', '--output', archive, commit, '--', 'scripts', 'packages']);
		mkdirSync(snapshot);
		execFileSync('tar', ['-xf', archive, '-C', snapshot]);
		const { moduleClosure } = await import(pathToFileURL(join(snapshot, MODULE_CLOSURE)).href);
		return moduleClosure(snapshot, [BUILD_DRIVER]);
	} finally {
		rmSync(scratch, { recursive: true, force: true });
	}
}

export async function resolveBuildPath({ repo = process.cwd(), commit, ref = commit, closure }) {
	const parent = git(repo, ['rev-parse', `${commit}^`]).trim();
	const driver = new Set(closure ?? (await driverClosure(repo, commit)));
	const files = git(repo, ['diff', '--name-only', ...DIFF, parent, commit])
		.split('\n')
		.filter((file) => driver.has(file))
		.sort();
	assert(files.length, `build path ${ref}: ${short(commit)} changes nothing in the module closure of ${BUILD_DRIVER}`);
	const patch = git(repo, ['diff', ...DIFF, parent, commit, '--', ...files]);
	return { commit, ref, files, patch };
}

export function placeBuildPath({ tree, buildPath, patch }) {
	const commit = git(tree, ['rev-parse', 'HEAD']).trim();
	if (!buildPath) return { commit, how: 'own' };
	const { files } = buildPath;
	if (isAncestor(tree, buildPath.commit, commit)) return { commit, how: 'ancestor', files };
	try {
		git(tree, ['apply', '--check'], patch);
	} catch {
		return { commit, how: 'as is', files };
	}
	git(tree, ['apply'], patch);
	return { commit, how: 'patched', files };
}

function pathFacts(name, dir) {
	const root = join(dir, STAMPS);
	const stamps = existsSync(root)
		? readdirSync(root).flatMap((grammar) =>
				readdirSync(join(root, grammar))
					.filter((file) => file.endsWith('.node.json'))
					.map((file) => [`${grammar}/${file.slice(0, -'.json'.length)}`, readJson(join(root, grammar, file))])
			)
		: [];
	assert(stamps.length, `${name}: no native build stamp under ${STAMPS}`);
	return stamps.map(([binary, stamp]) => ({
		tree: name,
		binary,
		fact: {
			profile: stamp.profile,
			keptUnstrippedCopy: stamp.unstripped !== undefined,
			config: Object.fromEntries(Object.entries(stamp.config).sort(([a], [b]) => a.localeCompare(b)))
		}
	}));
}

export function holdOnePath(trees) {
	const facts = trees.flatMap(({ name, dir }) => pathFacts(name, dir));
	const paths = new Map();
	for (const { tree, binary, fact } of facts) {
		const key = JSON.stringify(fact);
		paths.set(key, [...(paths.get(key) ?? []), `${tree} ${binary}`]);
	}
	if (paths.size > 1)
		throw new Error(
			`the trees were built on ${paths.size} build paths:\n` +
				[...paths].map(([fact, builds]) => `  ${fact}\n    ${builds.join(', ')}`).join('\n')
		);
	return facts[0].fact;
}

export function describeBuildPath({ buildPath, placements, fact }) {
	const driver = buildPath
		? `build-native at ${buildPath.ref} \`${short(buildPath.commit)}\` (${buildPath.files.join(', ')}): ` +
			placements
				.map(({ tree, how }) => `${tree} ${how === 'ancestor' ? 'contains it (ancestor)' : how}`)
				.join(', ')
		: "each tree's own build-native";
	const copy = fact.keptUnstrippedCopy ? 'the unstripped copy kept' : 'no unstripped copy';
	return `Build path: ${driver}. Every addon's stamp agrees: profile ${fact.profile}, ${copy}, one build config.`;
}

async function main() {
	const [action, out, ...rest] = process.argv.slice(2);
	const refsPath = join(out ?? '', 'refs.json');
	if (action === 'resolve') {
		const [commit, ref] = rest;
		const refs = readJson(refsPath);
		refs.buildPath = null;
		if (commit) {
			const { patch, ...buildPath } = await resolveBuildPath({ commit, ref });
			writeFileSync(join(out, 'build-path.patch'), patch);
			refs.buildPath = buildPath;
		}
		writeJson(refsPath, refs);
		console.log(JSON.stringify(refs.buildPath));
	} else if (action === 'place') {
		const [name, tree] = rest;
		const { buildPath } = readJson(refsPath);
		const patch = buildPath ? readFileSync(join(out, 'build-path.patch'), 'utf8') : undefined;
		const placement = { tree: name, ...placeBuildPath({ tree, buildPath, patch }) };
		writeJson(join(out, `build-path-${name}.json`), placement);
		console.log(JSON.stringify(placement));
	} else if (action === 'check') {
		const [trees, ...names] = rest;
		const { buildPath } = readJson(refsPath);
		const fact = holdOnePath(names.map((name) => ({ name, dir: join(trees, name) })));
		const placements = names.map((name) => readJson(join(out, `build-path-${name}.json`)));
		const markdown = describeBuildPath({ buildPath, placements, fact }) + '\n';
		writeFileSync(join(out, 'build-path.md'), markdown);
		if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
		process.stdout.write(markdown);
	} else
		throw new Error(
			'usage: build-path.mjs resolve <out> [<commit> <ref>] | place <out> <tree name> <tree dir> | check <out> <trees dir> <tree names...>'
		);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) await main();
