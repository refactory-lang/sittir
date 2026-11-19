import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const SUMMARIZE = fileURLToPath(new URL('./summarize.py', import.meta.url));
const EARLIER = fileURLToPath(
	new URL('../../../docs/reviews/2026-10-29-paired-backends/benchmarks/object-benchmark-summary.json', import.meta.url)
);
const GRAMMARS = ['python', 'rust', 'typescript', 'regex', 'scm'];
const TREES = ['base', 'master', 'feature', 'prefold'];
const VERSIONS = TREES.flatMap((tree) => [tree, `${tree}-arena`]);
const CHANGED = new Set(['python 0 body', 'python 1 body', 'rust 2 items']);
const SAMPLE = { pipelineMs: 2, parseMs: 1, renderMs: 1, editMs: 0.5, releaseMs: 0.1, wholeReadMs: 1.5 };
const SECTION = { files: 1, sha256: 'a'.repeat(64) };

function measured(dir, held) {
	const runs = join(dir, 'runs');
	mkdirSync(runs, { recursive: true });
	const json = (name, value) => writeFileSync(join(dir, name), JSON.stringify(value));
	const receipts = [];
	for (const version of VERSIONS) {
		for (let round = 0; round < 5; round++) {
			receipts.push({ version, load1: 1 });
			for (const grammar of GRAMMARS) {
				const byEntry = [0, 1, 2, 3].map((at) => ({
					name: `${grammar} entry ${at}`,
					rendered: held(version, grammar, at, 'render', round),
					edits: Object.fromEntries(['body', 'items'].map((key) => [key, held(version, grammar, at, key, round)]))
				}));
				json(`runs/corpus-${grammar}-${version}-${round}.json`, {
					signature: { entries: 4 },
					buildProfile: 'release',
					samples: [SAMPLE],
					samplesMatched: [SAMPLE],
					peakRssMB: 100,
					byEntry
				});
			}
			const samples = [2000, 8000].flatMap((n) =>
				[false, true].flatMap((reuse) => {
					const edited = held(version, 'construction', n, reuse ? 'reused' : 'distinct', round);
					return Array.from({ length: 7 }, () => ({
						n,
						reuse,
						renderSha256: 'render',
						editedSha256: edited,
						pipelineMs: 1,
						buildMs: 1,
						renderMs: 1,
						editMs: 1,
						releaseMs: 0
					}));
				})
			);
			json(`runs/timing-rust-${version}-${round}.json`, { buildProfile: 'release', samples });
		}
		for (let round = 0; round < 3; round++) {
			json(`runs/memory-rust-${version}-${round}.json`, {
				buildProfile: 'release',
				samples: [{ delta: { heapUsed: 1, external: 1, arrayBuffers: 1, rss: 1 } }],
				builtMemory: null
			});
		}
	}
	json('runs/receipts.json', receipts);
	const commits = { base: 'b'.repeat(40), master: 'c'.repeat(40), feature: 'f'.repeat(40), prefold: 'e'.repeat(40) };
	json('refs.json', {
		base: commits.base,
		master: commits.master,
		feature: commits.feature,
		candidates: { prefold: { commit: commits.prefold, ref: 'prefold' } }
	});
	for (const tree of TREES) {
		json(`before-${tree}.json`, {
			commit: commits[tree],
			machine: { cpu: 'cpu', cores: 4, memory: 2 ** 34 },
			runner: { os: 'linux', arch: 'arm64', image: 'image', imageVersion: '1' },
			workingTreeDiffSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
			sections: { runtimeSource: SECTION, compiledRuntime: SECTION, nativeAndWasm: SECTION }
		});
		json(`build-path-${tree}.json`, {});
	}
	writeFileSync(join(dir, 'build-path.md'), 'Every tree is built with its own build driver.');
}

const featureLike = (version) => ['feature', 'prefold'].includes(version.replace(/-arena$/, ''));
const outputOf = (version, grammar, at, key) =>
	grammar === 'construction'
		? featureLike(version) && at === 8000 && key === 'reused'
			? 'g'
			: 'x'
		: featureLike(version) && CHANGED.has(`${grammar} ${at} ${key}`)
			? 'changed'
			: 'kept';

function summarize(held, identity) {
	const dir = mkdtempSync(join(tmpdir(), 'paired-refs-summary-'));
	try {
		measured(dir, held);
		const { GITHUB_STEP_SUMMARY: _, ...env } = process.env;
		const run = spawnSync('python3', [SUMMARIZE, dir, EARLIER, '--identity', identity], { encoding: 'utf8', env });
		const written = join(dir, 'summary.json');
		const summary = existsSync(written) ? JSON.parse(readFileSync(written, 'utf8')) : undefined;
		return { status: run.status, stderr: run.stderr, summary };
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

const FROM_BASE = [
	{ grammar: 'construction', entry: '8000 function roots, reused name', key: 'render and edit' },
	{ grammar: 'python', entry: '#0 python entry 0', key: 'edit body' },
	{ grammar: 'python', entry: '#1 python entry 1', key: 'edit body' },
	{ grammar: 'rust', entry: '#2 rust entry 2', key: 'edit items' }
];

test('identity feature passes and lists where feature differs from base, with each version held at feature or at base', () => {
	const { status, summary } = summarize(outputOf, 'feature');
	assert.equal(status, 0);
	assert.deepEqual(summary.mismatches, []);
	assert.deepEqual(summary.differFromBase, FROM_BASE);
	for (const version of VERSIONS) {
		assert.deepEqual(
			summary.heldOnDifferencesFromBase[version],
			featureLike(version) ? { atIdentity: 4, atBase: 0 } : { atIdentity: 0, atBase: 4 },
			version
		);
	}
});

test('identity base fails a version that differs from base and names each entry', () => {
	const { status, summary } = summarize(outputOf, 'base');
	assert.equal(status, 1);
	assert.deepEqual(summary.differFromBase, []);
	const feature = summary.mismatches.find((line) => line.startsWith('feature rounds 0, 1, 2, 3, 4: 4 apart from base'));
	assert.ok(feature, summary.mismatches.join('\n'));
	assert.match(feature, /python #0 python entry 0: edit body/);
	assert.match(feature, /construction, 8000 function roots, reused name/);
});

test('a candidate that keeps base output where feature differs passes, and its count shows it', () => {
	const held = (version, ...at) => outputOf(version.startsWith('prefold') ? 'base' : version, ...at);
	const { status, summary } = summarize(held, 'feature');
	assert.equal(status, 0);
	assert.deepEqual(summary.heldOnDifferencesFromBase.prefold, { atIdentity: 0, atBase: 4 });
});

test('a version holding neither the identity output nor base output fails and names the entry', () => {
	const held = (version, grammar, at, key) =>
		version.startsWith('master') && grammar === 'python' && at === 0 && key === 'body'
			? 'third'
			: outputOf(version, grammar, at, key);
	const { status, summary } = summarize(held, 'feature');
	assert.equal(status, 1);
	assert.deepEqual(summary.mismatches, [
		'master rounds 0, 1, 2, 3, 4: 1 apart from feature: python #0 python entry 0: edit body',
		'master-arena rounds 0, 1, 2, 3, 4: 1 apart from feature: python #0 python entry 0: edit body'
	]);
});

test('an arena read apart from the same tree read in object storage fails, even at base output where feature differs from base', () => {
	const held = (version, ...at) => (version === 'feature-arena' ? outputOf('base', ...at) : outputOf(version, ...at));
	const { status, summary } = summarize(held, 'feature');
	assert.equal(status, 1);
	assert.ok(
		summary.mismatches.includes(
			'feature-arena rounds 0, 1, 2, 3, 4: 4 apart from feature: construction, 8000 function roots, reused name, python #0 python entry 0: edit body, python #1 python entry 1: edit body, rust #2 rust entry 2: edit items'
		),
		summary.mismatches.join('\n')
	);
});

for (const [what, at] of [
	['corpus edit', ['python', 0, 'body']],
	['construction case', ['construction', 8000, 'reused']]
]) {
	test(`a version whose ${what} holds the identity output in round 0 and base output after fails, in both storages`, () => {
		const held = (version, grammar, entry, key, round) =>
			version.startsWith('prefold') && round > 0 && `${grammar} ${entry} ${key}` === at.join(' ')
				? outputOf('base', grammar, entry, key)
				: outputOf(version, grammar, entry, key);
		const { status, summary } = summarize(held, 'feature');
		assert.equal(status, 1);
		const named =
			what === 'corpus edit' ? 'python #0 python entry 0: edit body' : 'construction, 8000 function roots, reused name';
		assert.deepEqual(summary.mismatches, [
			`prefold rounds 1, 2, 3, 4: 1 apart from its round 0: ${named}`,
			`prefold-arena rounds 1, 2, 3, 4: 1 apart from its round 0: ${named}`
		]);
	});
}

test('an identity that names no tree is refused', () => {
	const { status, stderr } = summarize(outputOf, 'nightly');
	assert.notEqual(status, 0);
	assert.match(stderr, /identity nightly is none of base, master, feature, prefold/);
});
