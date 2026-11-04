import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { describeBuildPath, holdOnePath, placeBuildPath, resolveBuildPath } from './build-path.mjs';

const DRIVER = 'scripts/build-native.mts';
const FRESHNESS = 'packages/codegen/src/scripts/native-binary-freshness.ts';
const IDENTITY = { GIT_AUTHOR_NAME: 'test', GIT_AUTHOR_EMAIL: 'test@example.com', GIT_COMMITTER_NAME: 'test', GIT_COMMITTER_EMAIL: 'test@example.com' };

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, ...IDENTITY } }).trim();

function write(root, files) {
	for (const [path, text] of Object.entries(files)) {
		mkdirSync(dirname(join(root, path)), { recursive: true });
		writeFileSync(join(root, path), text);
	}
}

function commit(repo, message, files) {
	write(repo, files);
	git(repo, 'add', '-A');
	git(repo, 'commit', '-q', '-m', message);
	return git(repo, 'rev-parse', 'HEAD');
}

const driver = (strip, features) =>
	`import { stamp } from '../packages/codegen/src/scripts/native-binary-freshness.ts';\n\nexport const features = ${features};\n\n\n\n\nexport const strip = '${strip}';\n`;

function history(root) {
	const repo = join(root, 'repo');
	mkdirSync(repo);
	git(repo, 'init', '-q', '-b', 'main');
	const base = commit(repo, 'base', {
		[DRIVER]: driver('at link', "['arena']"),
		[FRESHNESS]: 'export const stamp = 1;\n',
		'packages/codegen/src/scripts/module-closure.ts': `export function moduleClosure(root, entries) {\n\treturn [...entries, '${FRESHNESS}'];\n}\n`,
		'README.md': 'base\n'
	});
	const path = commit(repo, 'the build path', {
		[DRIVER]: driver('after the build', "['arena']"),
		[FRESHNESS]: 'export const stamp = 1;\nexport const copy = true;\n',
		'README.md': 'documented\n'
	});
	const later = commit(repo, 'a later edit to the driver', { [DRIVER]: driver('after the build', "['arena', 'more']") });
	git(repo, 'checkout', '-q', '--detach', base);
	commit(repo, 'an unrelated change', { 'other.txt': 'other\n' });
	git(repo, 'cherry-pick', path);
	const picked = git(repo, 'rev-parse', 'HEAD');
	const pickedLater = commit(repo, 'a later edit beside the pick', { [DRIVER]: driver('after the build', '[]') });
	git(repo, 'checkout', '-q', '--detach', base);
	const conflicting = commit(repo, 'another strip', { [DRIVER]: driver('elsewhere', "['arena']") });
	const ownFeatures = (git(repo, 'checkout', '-q', '--detach', base), commit(repo, 'its own features', { [DRIVER]: driver('at link', '[]') }));
	return { repo, base, path, later, picked, pickedLater, conflicting, ownFeatures };
}

function tree(repo, root, name, at) {
	const dir = join(root, name);
	git(repo, 'worktree', 'add', '-q', '--detach', dir, at);
	return dir;
}

test("the build path is its commit's change to the build driver's module closure, read from that commit's own closure", async () => {
	const root = mkdtempSync(join(tmpdir(), 'build-path-test-'));
	try {
		const { repo, path } = history(root);
		const resolved = await resolveBuildPath({ repo, commit: path, ref: 'strip' });
		assert.deepEqual(resolved.files, [FRESHNESS, DRIVER].sort());
		assert.match(resolved.patchId, /^[0-9a-f]{40}$/);
		assert.doesNotMatch(resolved.patch, /README/);
		const outside = commit(repo, 'outside the driver', { 'README.md': 'only docs\n' });
		await assert.rejects(resolveBuildPath({ repo, commit: outside }), /changes nothing in the module closure/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test('a tree carrying the build path is left as it is, a tree before it is patched, and a tree it cannot reach is refused', async () => {
	const root = mkdtempSync(join(tmpdir(), 'build-path-test-'));
	try {
		const refs = history(root);
		const { patch, ...buildPath } = await resolveBuildPath({ repo: refs.repo, commit: refs.path, ref: 'strip' });
		const place = (name) => placeBuildPath({ tree: tree(refs.repo, root, name, refs[name]), buildPath, patch });

		assert.deepEqual(place('path'), { commit: refs.path, how: 'contained', via: 'ancestor', files: buildPath.files });
		assert.equal(place('later').via, 'ancestor');
		assert.equal(place('picked').via, `patch-id of ${refs.picked.slice(0, 9)}`);
		assert.equal(place('pickedLater').via, `patch-id of ${refs.picked.slice(0, 9)}`);

		const before = place('base');
		assert.equal(before.how, 'patched');
		assert.equal(readFileSync(join(root, 'base', DRIVER), 'utf8'), driver('after the build', "['arena']"));
		assert.equal(readFileSync(join(root, 'base', 'README.md'), 'utf8'), 'base\n');
		assert.equal(place('ownFeatures').how, 'patched');
		assert.equal(readFileSync(join(root, 'ownFeatures', DRIVER), 'utf8'), driver('after the build', '[]'));

		assert.throws(() => place('conflicting'), /neither carries .* nor takes its change .* cleanly/);
		assert.equal(placeBuildPath({ tree: join(root, 'conflicting') }).how, 'own');
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

function built(root, name, stamps) {
	const dir = join(root, name);
	for (const [binary, stamp] of Object.entries(stamps))
		write(dir, { [`node_modules/.cache/sittir/native-build/${binary}.json`]: JSON.stringify({ binarySha256: name, inputs: { name }, ...stamp }) });
	return { name, dir };
}

test('every tree is held to one build path by what its stamps record', () => {
	const root = mkdtempSync(join(tmpdir(), 'build-path-test-'));
	try {
		const copy = { path: 'kept', sha256: 'kept' };
		const after = { profile: 'release', unstripped: copy, config: { 'b.toml': 'b', 'a.toml': 'a' } };
		const base = built(root, 'base', { 'regex/sittir-regex.linux-x64-gnu.node': after, 'rust/sittir-rust.linux-x64-gnu.node': after });
		const feature = built(root, 'feature', { 'regex/sittir-regex.linux-x64-gnu.node': { ...after, config: { 'a.toml': 'a', 'b.toml': 'b' } } });
		const fact = holdOnePath([base, feature]);
		assert.deepEqual(fact, { profile: 'release', keptUnstrippedCopy: true, config: { 'a.toml': 'a', 'b.toml': 'b' } });

		const atLink = built(root, 'master', { 'regex/sittir-regex.linux-x64-gnu.node': { profile: 'release', config: { ...after.config, CARGO_PROFILE_RELEASE_STRIP: 'symbols' } } });
		assert.throws(() => holdOnePath([base, atLink]), /built on 2 build paths:[\s\S]*master regex\/sittir-regex/);
		const uncopied = built(root, 'lean', { 'regex/sittir-regex.linux-x64-gnu.node': { profile: 'release', config: after.config } });
		assert.throws(() => holdOnePath([feature, uncopied]), /built on 2 build paths/);
		assert.throws(() => holdOnePath([{ name: 'empty', dir: join(root, 'empty') }]), /no native build stamp/);

		assert.equal(
			describeBuildPath({
				buildPath: { ref: 'strip', commit: '7ee97efc7aaaa', files: ['scripts/build-native.mts'] },
				placements: [{ tree: 'base', how: 'patched' }, { tree: 'feature', how: 'contained', via: 'ancestor' }],
				fact
			}),
			"Build path: build-native at strip `7ee97efc7` (scripts/build-native.mts): base patched, feature contains it (ancestor). Every addon's stamp agrees: profile release, the unstripped copy kept, one build config."
		);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
