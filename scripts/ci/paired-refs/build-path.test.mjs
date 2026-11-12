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

const driver = (strip, features, note = '') =>
	`import { stamp } from '../packages/codegen/src/scripts/native-binary-freshness.ts';\n\nexport const features = ${features};\n\n\n\n${note}\nexport const strip = '${strip}';\n`;

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
	git(repo, 'checkout', '-q', '--detach', base);
	const ownContext = commit(repo, 'its own edit beside the strip', { [DRIVER]: driver('at link', '[]', '// its own') });
	const reworked = commit(repo, 'the build path, reworked onto its own context', {
		[DRIVER]: driver('after the build', '[]', '// its own'),
		[FRESHNESS]: 'export const stamp = 1;\nexport const copy = true;\n'
	});
	git(repo, 'checkout', '-q', '--detach', base);
	const ownFeatures = commit(repo, 'its own features', { [DRIVER]: driver('at link', '[]') });
	return { repo, base, path, later, picked, ownContext, reworked, ownFeatures };
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
		assert.doesNotMatch(resolved.patch, /README/);
		const outside = commit(repo, 'outside the driver', { 'README.md': 'only docs\n' });
		await assert.rejects(resolveBuildPath({ repo, commit: outside }), /changes nothing in the module closure/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test('a tree descended from the build path is built as it is, a tree it applies to is patched, and any other tree is built as it is for its stamps to judge', async () => {
	const root = mkdtempSync(join(tmpdir(), 'build-path-test-'));
	try {
		const refs = history(root);
		const { patch, ...buildPath } = await resolveBuildPath({ repo: refs.repo, commit: refs.path, ref: 'strip' });
		const place = (name) => placeBuildPath({ tree: tree(refs.repo, root, name, refs[name]), buildPath, patch });
		const driverOf = (name) => readFileSync(join(root, name, DRIVER), 'utf8');

		assert.deepEqual(place('path'), { commit: refs.path, how: 'ancestor', files: buildPath.files });
		assert.equal(place('later').how, 'ancestor');

		assert.equal(place('base').how, 'patched');
		assert.equal(driverOf('base'), driver('after the build', "['arena']"));
		assert.equal(readFileSync(join(root, 'base', 'README.md'), 'utf8'), 'base\n');
		assert.equal(place('ownFeatures').how, 'patched');
		assert.equal(driverOf('ownFeatures'), driver('after the build', '[]'));

		assert.equal(place('picked').how, 'as is');
		assert.equal(driverOf('picked'), driver('after the build', "['arena']"));
		assert.equal(place('reworked').how, 'as is');
		assert.equal(driverOf('reworked'), driver('after the build', '[]', '// its own'));
		assert.equal(place('ownContext').how, 'as is');
		assert.equal(driverOf('ownContext'), driver('at link', '[]', '// its own'));

		assert.equal(placeBuildPath({ tree: join(root, 'ownContext') }).how, 'own');
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

test('the stamps hold every tree to one build path: a tree built as it is on the old path is refused, one on the new path agrees', () => {
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
				placements: [{ tree: 'base', how: 'patched' }, { tree: 'master', how: 'as is' }, { tree: 'feature', how: 'ancestor' }],
				fact
			}),
			"Build path: build-native at strip `7ee97efc7` (scripts/build-native.mts): base patched, master as is, feature contains it (ancestor). Every addon's stamp agrees: profile release, the unstripped copy kept, one build config."
		);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
