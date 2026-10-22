import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PHASES = ['build', 'render', 'parse', 'pipeline', 'edit'];
const PROBE = 'docs/superpowers/probes/2026-10-12-record-wire/eager';
const IDLE = 'docs/superpowers/probes/2026-10-01-shared-arena/timing/idle.sh';
const sha = (value) => createHash('sha256').update(value).digest('hex');
const command = (name, args) => execFileSync(name, args, { encoding: 'utf8' }).trim();
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const median = (values) => {
	assert(values.length > 0, 'empty sample population');
	assert(values.every(Number.isFinite), 'non-finite sample');
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const stats = (values) => {
	assert(
		values.every((value) => value >= 0),
		'negative timing'
	);
	return { median: median(values), min: Math.min(...values), max: Math.max(...values) };
};
const near = (actual, expected) =>
	assert(
		Math.abs(actual - expected) <= 1e-8 * Math.max(1, Math.abs(expected)),
		'reported statistic differs from raw samples'
	);
const writeJson = (path, value) => {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
};

function filesUnder(directory) {
	if (!existsSync(directory)) return [];
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = join(directory, entry.name);
		return entry.isDirectory() ? filesUnder(path) : entry.isFile() ? [path] : [];
	});
}

function section(paths) {
	const hashes = Object.fromEntries([...new Set(paths)].sort().map((path) => [path, sha(readFileSync(path))]));
	return {
		files: Object.keys(hashes).length,
		sha256: sha(
			Object.entries(hashes)
				.map(([path, hash]) => `${path}\0${hash}\n`)
				.join('')
		),
		hashes
	};
}

export function capture() {
	const grammars = command('pnpm', ['exec', 'tsx', 'packages/tools/src/scripts/list-grammars.ts', 'stable']).split(
		/\s+/
	);
	const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
	const source = tracked.filter(
		(path) =>
			/^(packages|rust|scripts)\//.test(path) ||
			path.startsWith(`${PROBE}/`) ||
			path === IDLE ||
			path === 'Cargo.lock' ||
			path === 'docs/superpowers/probes/2026-10-01-shared-arena/2026-10-01/encode-runtime.mts' ||
			(!path.includes('/') && /\.(json|ya?ml|toml|[cm]?ts|[cm]?js)$/.test(path))
	);
	const compiled = readdirSync('packages').flatMap((name) => filesUnder(`packages/${name}/dist`));
	const native = grammars.flatMap((name) => {
		const binaries = filesUnder(`packages/${name}/native`).filter((path) => path.endsWith('.node'));
		assert.equal(binaries.length, 1, `one host addon required for ${name}`);
		return [...binaries, `packages/${name}/.sittir/parser.wasm`, `packages/${name}/.sittir/upstream.wasm`];
	});
	if (existsSync(`${PROBE}/native/eager-builder-probe.node`)) native.push(`${PROBE}/native/eager-builder-probe.node`);
	const release = readFileSync('Cargo.toml', 'utf8')
		.split(/(?=^\[)/m)
		.find((part) => part.startsWith('[profile.release]'));
	assert(release, 'workspace release profile missing');
	return {
		commit: command('git', ['rev-parse', 'HEAD']),
		grammars,
		at: new Date().toISOString(),
		node: process.version,
		v8: process.versions.v8,
		rust: command('rustc', ['-Vv']),
		pnpm: command('pnpm', ['--version']),
		machine: {
			platform: process.platform,
			arch: process.arch,
			release: os.release(),
			cpu: os.cpus()[0]?.model,
			cores: os.cpus().length,
			memory: os.totalmem()
		},
		runner: {
			os: process.env.RUNNER_OS,
			arch: process.env.RUNNER_ARCH,
			image: process.env.ImageOS,
			imageVersion: process.env.ImageVersion,
			run: process.env.GITHUB_RUN_ID,
			attempt: process.env.GITHUB_RUN_ATTEMPT
		},
		releaseProfile: {
			text: release,
			sha256: sha(release),
			rustflags: process.env.RUSTFLAGS ?? null,
			encodedRustflags: process.env.CARGO_ENCODED_RUSTFLAGS ?? null
		},
		digestEncoding: 'sha256 of sorted path, NUL, file sha256, newline',
		sections: { runtimeSource: section(source), compiledRuntime: section(compiled), nativeAndWasm: section(native) },
		workingTreeDiffSha256: sha(execFileSync('git', ['diff', '--binary', 'HEAD', '--']))
	};
}

export function verify(before, after) {
	assert.equal(before.commit, after.commit, 'commit changed during measurement');
	assert.deepEqual(before.sections, after.sections, 'runtime inputs changed during measurement');
	assert.equal(before.workingTreeDiffSha256, after.workingTreeDiffSha256, 'working tree changed during measurement');
}

function checkWorkers(workers, rounds, modeOf) {
	assert.equal(new Set(workers.map((worker) => worker.pid)).size, workers.length, 'workers must be fresh');
	const groups = [...new Set(workers.map((worker) => worker.grammar ?? 'eager'))];
	for (const group of groups) {
		for (let round = 0; round < rounds; round++) {
			const pair = workers.filter((worker) => (worker.grammar ?? 'eager') === group && worker.round === round);
			assert.deepEqual(
				pair.map(modeOf),
				round % 2 ? ['arena', 'object'] : ['object', 'arena'],
				'storage order must alternate'
			);
		}
	}
	assert.equal(workers.length, groups.length * rounds * 2, 'incomplete worker population');
	for (const worker of workers)
		assert(Number(worker.idle?.match(/(\d+)%/)?.[1]) >= 75, 'worker did not pass the idle gate');
}

export function analyzeEager(data) {
	assert.equal(data.rounds, 5);
	assert.equal(data.warmup, 2);
	assert.equal(data.iterations, 3);
	assert.equal(data.count, 10000);
	assert(data.idleGated);
	checkWorkers(data.workers, data.rounds, (worker) => worker.mode);
	const samples = data.workers.flatMap((worker) => worker.samples);
	assert.equal(samples.length, 30);
	assert(samples.every((sample) => sample.count === data.count));
	for (const key of ['count', 'casesSha256', 'renderSha256', 'renderBytes'])
		assert.equal(new Set(samples.map((sample) => sample[key])).size, 1, `changed ${key}`);
	const result = { phases: {}, memoryMiB: {}, arenaStorage: {}, ratios: {}, workers: data.workers.length };
	for (const mode of ['object', 'arena']) {
		const workers = data.workers.filter((worker) => worker.mode === mode);
		result.phases[mode] = {};
		for (const phase of PHASES) {
			const measured = stats(workers.map((worker) => median(worker.samples.map((sample) => sample.phases[phase]))));
			const reported = data.summary[mode][phase];
			near(measured.median, reported.medianMs);
			near(measured.min, reported.minMs);
			near(measured.max, reported.maxMs);
			result.phases[mode][phase] = measured;
		}
		result.memoryMiB[mode] = {};
		for (const population of ['renderedDelta', 'snapshotsDelta']) {
			const field = (key) => workers.map((worker) => worker.memory[population][key]);
			result.memoryMiB[mode][population] = {
				heapUsed: median(field('heapUsed')) / 1048576,
				external: median(field('external')) / 1048576,
				heapPlusExternal:
					median(workers.map((worker) => worker.memory[population].heapUsed + worker.memory[population].external)) /
					1048576
			};
		}
		if (mode === 'arena')
			for (const population of ['builtStorage', 'editedStorage']) {
				const value = workers[0].memory[population];
				for (const worker of workers) assert.deepEqual(worker.memory[population], value);
				result.arenaStorage[population] = value;
			}
	}
	for (const phase of PHASES) {
		result.ratios[phase] = result.phases.arena[phase].median / result.phases.object[phase].median;
		near(result.ratios[phase], data.ratios[phase]);
	}
	return result;
}

export function analyzeCorpus(data) {
	assert.equal(data.options.rounds, 5);
	assert.equal(data.options.warmup, 2);
	assert.equal(data.options.iterations, 3);
	assert(data.environment.idleGated, 'corpus run must use the idle gate');
	const workers = data.validationSamples;
	const grammars = [...new Set(workers.map((worker) => worker.grammar))].sort();
	assert.deepEqual(grammars, [...data.options.grammars].sort());
	checkWorkers(workers, data.options.rounds, (worker) => worker.storage);
	const result = { workers: workers.length, aggregates: {}, phases: [] };
	assert.equal(
		new Set(data.validationSummary.map((row) => `${row.grammar}/${row.bucket}`)).size,
		grammars.length * 3,
		'incomplete bucket coverage'
	);
	for (const summary of data.validationSummary) {
		const observations = workers
			.filter((worker) => worker.grammar === summary.grammar)
			.map((worker) => ({ ...worker, bucket: worker.buckets.find((bucket) => bucket.bucket === summary.bucket) }));
		for (const observation of observations) {
			assert.deepEqual(observation.corpus, summary.corpus);
			for (const key of ['counts', 'work', 'resultSha256'])
				assert.deepEqual(observation.bucket[key], summary[key], `changed ${key}`);
			assert.deepEqual(observation.bucket.render, summary.render[observation.storage]);
		}
		if (summary.bucket !== 'read-render-parse') assert.deepEqual(summary.render.object, summary.render.arena);
		const totals = (result.aggregates[summary.bucket] ??= { objectMs: 0, arenaMs: 0 });
		for (const timing of summary.timings) {
			const row = { grammar: summary.grammar, bucket: summary.bucket, phase: timing.phase };
			for (const mode of ['object', 'arena']) {
				const values = observations
					.filter((observation) => observation.storage === mode)
					.map((observation) => {
						const times = observation.bucket.timings[timing.phase];
						assert.equal(times.length, data.options.iterations);
						if (timing.phase !== 'validator') {
							assert.equal(observation.bucket.phases[timing.phase].calls, timing.calls);
							assert.equal(observation.bucket.phases[timing.phase].throws, timing.throws);
						}
						return median(times);
					});
				const measured = stats(values);
				near(measured.median, timing[`${mode}Ms`]);
				near(measured.min, timing[`${mode}Range`][0]);
				near(measured.max, timing[`${mode}Range`][1]);
				row[mode] = measured;
			}
			row.ratio = row.object.median === 0 ? null : row.arena.median / row.object.median;
			if (row.ratio !== null) near(row.ratio, timing.arenaOverObject);
			if (timing.phase === 'validator') {
				totals.objectMs += row.object.median;
				totals.arenaMs += row.arena.median;
			}
			result.phases.push(row);
		}
	}
	assert.equal(result.phases.length, grammars.length * 3 * 5);
	for (const value of Object.values(result.aggregates)) value.ratio = value.arenaMs / value.objectMs;
	return result;
}

export function summarize(data) {
	const eager = Array.isArray(data.workers);
	const analysis = eager ? analyzeEager(data) : analyzeCorpus(data);
	const rows = eager
		? PHASES.map((phase) => [
				phase,
				analysis.phases.object[phase].median,
				analysis.phases.arena[phase].median,
				analysis.ratios[phase]
			])
		: Object.entries(analysis.aggregates).map(([bucket, value]) => [
				bucket,
				value.objectMs,
				value.arenaMs,
				value.ratio
			]);
	const lines = [
		`# ${eager ? 'Eager construction' : 'Corpus storage'} benchmark`,
		'',
		'Descriptive measurements; no performance threshold is enforced. Arena/object below one favors arena.',
		'',
		'| Work | Object ms | Arena ms | Arena/object |',
		'| --- | ---: | ---: | ---: |',
		...rows.map(
			([label, object, arena, ratio]) =>
				`| ${label} | ${object.toFixed(3)} | ${arena.toFixed(3)} | ${ratio.toFixed(3)} |`
		),
		'',
		"Medians are computed from each worker's three batches, then across five workers. Ranges remain in analysis.json and raw samples.",
		'',
		'Native parsed hydration currently builds typed Rust nodes before record encoding. No intermediate JS AST crosses the bridge. Public factory/IR buckets still build objects under both storage settings.',
		''
	];
	if (eager) {
		lines.push('| Retained heap + external, MiB | Objects | Arena |', '| --- | ---: | ---: |');
		for (const population of ['renderedDelta', 'snapshotsDelta'])
			lines.push(
				`| ${population} | ${analysis.memoryMiB.object[population].heapPlusExternal.toFixed(3)} | ${analysis.memoryMiB.arena[population].heapPlusExternal.toFixed(3)} |`
			);
		lines.push(
			'',
			'External memory includes array buffers; do not add them again. These fields do not provide complete native retained-memory attribution.',
			''
		);
	} else
		lines.push(
			'Corpus rows sum five grammar medians, rather than timing a combined run. Arena RRP performs native deep root hydration; no additional JS inspection benchmark is added.',
			''
		);
	return { analysis, markdown: lines.join('\n') };
}

function main() {
	const [action, first, second] = process.argv.slice(2);
	if (action === 'capture') writeJson(first, capture());
	else if (action === 'verify') verify(readJson(first), readJson(second));
	else if (action === 'summarize') {
		const { analysis, markdown } = summarize(readJson(first));
		writeJson(join(dirname(second), 'analysis.json'), analysis);
		writeFileSync(second, markdown);
		if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
		process.stdout.write(markdown);
	} else
		throw new Error(
			'usage: arena-benchmark-report.mjs capture <json> | verify <before> <after> | summarize <raw> <markdown>'
		);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) main();
