import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const MEMORY_FIELDS = ['heapUsed', 'heapTotal', 'external', 'arrayBuffers', 'rss'];
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
			path === IDLE ||
			path === 'Cargo.lock' ||
			(!path.includes('/') && /\.(json|ya?ml|toml|[cm]?ts|[cm]?js)$/.test(path))
	);
	const compiled = readdirSync('packages').flatMap((name) => filesUnder(`packages/${name}/dist`));
	const native = grammars.flatMap((name) => {
		const binaries = filesUnder(`packages/${name}/native`).filter((path) => path.endsWith('.node'));
		assert.equal(binaries.length, 1, `one host addon required for ${name}`);
		return [...binaries, `packages/${name}/.sittir/parser.wasm`, `packages/${name}/.sittir/upstream.wasm`];
	});
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
	const groups = [...new Set(workers.map((worker) => worker.grammar))];
	for (const group of groups) {
		for (let round = 0; round < rounds; round++) {
			const pair = workers.filter((worker) => (worker.grammar) === group && worker.round === round);
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

export function mergeCorpusShards(shards, grammars) {
	assert(Array.isArray(grammars) && grammars.length, 'expected grammars required');
	assert.deepEqual(
		shards.flatMap(({ report }) => report.options.grammars).sort(),
		[...grammars].sort(),
		'grammar shard coverage differs'
	);
	assert.equal(shards.length, grammars.length, 'grammar shard coverage differs');
	const construction = constructionOf(shards[0].report);
	for (const shard of shards) {
		assert.equal(constructionOf(shard.report), construction, 'shards must build with the same construction');
		assert.equal(shard.report.options.grammars.length, 1, 'one grammar per runner required');
		verify(shard.before, shard.after);
		for (const field of [
			'commit',
			'sections',
			'node',
			'v8',
			'rust',
			'pnpm',
			'releaseProfile',
			'workingTreeDiffSha256'
		]) {
			assert.deepEqual(shard.before[field], shard.after[field], 'runtime identity changed during measurement');
			assert.deepEqual(shard.before[field], shards[0].before[field], 'shards must measure the same runtime');
		}
		for (const field of ['node', 'platform', 'arch', 'nodeEnv', 'idleGated', 'harnessSha256'])
			assert.deepEqual(
				shard.report.environment[field],
				shards[0].report.environment[field],
				'shard environment differs'
			);
		analyzeCorpus(shard.report);
	}
	return { mode: 'validation-storage-shards', options: { grammars, construction }, shards };
}

/** The construction a corpus report's arena arm builds with: objects unless the run named records. */
export function constructionOf(report) {
	return report.options?.construction ?? 'objects';
}

export function analyzeCorpus(data) {
	if (data.shards) {
		mergeCorpusShards(data.shards, data.options.grammars);
		const result = { workers: 0, aggregates: {}, phases: [], memoryMiB: {} };
		for (const { report } of data.shards) {
			const part = analyzeCorpus(report);
			result.workers += part.workers;
			result.phases.push(...part.phases);
			Object.assign(result.memoryMiB, part.memoryMiB);
			if (part.builtArena) Object.assign((result.builtArena ??= {}), part.builtArena);
			for (const [bucket, times] of Object.entries(part.aggregates)) {
				const aggregate = (result.aggregates[bucket] ??= { objectMs: 0, arenaMs: 0 });
				aggregate.objectMs += times.objectMs;
				aggregate.arenaMs += times.arenaMs;
			}
		}
		for (const value of Object.values(result.aggregates)) value.ratio = value.arenaMs / value.objectMs;
		return result;
	}
	assert.equal(data.options.rounds, 5);
	assert.equal(data.options.warmup, 2);
	assert.equal(data.options.iterations, 3);
	assert(data.environment.idleGated, 'corpus run must use the idle gate');
	const workers = data.validationSamples;
	const grammars = [...new Set(workers.map((worker) => worker.grammar))].sort();
	assert.deepEqual(grammars, [...data.options.grammars].sort());
	checkWorkers(workers, data.options.rounds, (worker) => worker.storage);
	const result = { workers: workers.length, aggregates: {}, phases: [], memoryMiB: {} };
	const memoryWorkers = workers.filter((worker) => worker.memory !== undefined);
	if (memoryWorkers.length) {
		assert.equal(memoryWorkers.length, workers.length, 'incomplete worker memory');
		for (const { memory } of memoryWorkers) {
			for (const snapshot of [memory.baseline, memory.after])
				for (const field of MEMORY_FIELDS)
					assert(Number.isFinite(snapshot[field]) && snapshot[field] >= 0, `invalid memory ${field}`);
			assert(
				Number.isFinite(memory.peakRssBytes) && memory.peakRssBytes >= Math.max(memory.baseline.rss, memory.after.rss),
				'invalid peak RSS'
			);
		}
		for (const grammar of grammars) {
			result.memoryMiB[grammar] = {};
			for (const mode of ['object', 'arena']) {
				const rows = memoryWorkers.filter((worker) => worker.grammar === grammar && worker.storage === mode);
				const delta = (field) => rows.map(({ memory }) => (memory.after[field] - memory.baseline[field]) / 1048576);
				result.memoryMiB[grammar][mode] = {
					peakRss: stats(rows.map(({ memory }) => memory.peakRssBytes / 1048576)),
					settledDelta: Object.fromEntries(MEMORY_FIELDS.map((field) => [field, median(delta(field))])),
					heapPlusExternalDelta: median(
						rows.map(
							({ memory }) =>
								(memory.after.heapUsed + memory.after.external - memory.baseline.heapUsed - memory.baseline.external) /
								1048576
						)
					)
				};
			}
			const built = memoryWorkers.filter((worker) => worker.grammar === grammar && worker.memory.built !== undefined);
			if (built.length) {
				const chunks = median(built.map(({ memory }) => memory.built.chunks));
				const counts = median(built.map(({ memory }) => memory.built.counts));
				(result.builtArena ??= {})[grammar] = {
					chunksMiB: chunks / 1048576,
					countsMiB: counts / 1048576,
					countShare: chunks > counts ? counts / (chunks - counts) : 0
				};
			}
		}
	}
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
	const analysis = analyzeCorpus(data);
	const lines = [
		'# Corpus storage benchmark',
		'',
		'Descriptive measurements; no performance threshold is enforced. Arena/object below one favors arena.',
		'',
		'| Whole validator round trip | Object ms | Arena ms | Arena/object |',
		'| --- | ---: | ---: | ---: |',
		...Object.entries(analysis.aggregates).map(
			([bucket, value]) =>
				`| ${bucket} | ${value.objectMs.toFixed(3)} | ${value.arenaMs.toFixed(3)} | ${value.ratio.toFixed(3)} |`
		),
		'',
		"Medians are computed from each worker's three batches, then across five workers. Ranges remain in analysis.json and raw samples.",
		'',
		"Each row times its bucket's whole validator round trip: producing the nodes, rendering, reparsing and comparing. The factory and IR rows are therefore not construction measurements.",
		'',
		`${
			constructionOf(data) === 'records'
				? 'Factory and IR buckets build records on the arena arm and objects on the object arm.'
				: 'Factory and IR buckets build objects under both storage settings.'
		}`,
		''
	];
	if (data.shards)
		lines.push(
			"Grammar shards ran on separate runners. Every object/arena pair and all five rounds for a grammar ran on that grammar's single runner; raw shard environments retain host details.",
			''
		);
	lines.push(
		`Corpus rows sum ${data.options.grammars.length} grammar medians, rather than timing a combined run. Arena RRP performs native deep root hydration; no additional JS inspection benchmark is added.`,
		''
	);
	if (Object.keys(analysis.memoryMiB).length) {
		lines.push('| Grammar | Worker memory, MiB | Objects | Arena |', '| --- | --- | ---: | ---: |');
		for (const [grammar, modes] of Object.entries(analysis.memoryMiB))
			for (const [label, field] of [
				['Whole-worker peak RSS', (value) => value.peakRss.median],
				['Leak check: settled heap delta', (value) => value.settledDelta.heapUsed],
				['Leak check: settled external delta', (value) => value.settledDelta.external],
				['Leak check: settled heap + external delta', (value) => value.heapPlusExternalDelta],
				['Leak check: settled RSS delta', (value) => value.settledDelta.rss]
			])
				lines.push(
					`| ${grammar} | ${label} | ${field(modes.object).toFixed(3)} | ${field(modes.arena).toFixed(3)} |`
				);
		lines.push(
			'',
			'Memory medians cover five fresh workers per mode. Peak RSS includes process startup, warmups and all three buckets; it is not a per-bucket peak and is not summed across grammars. The settled deltas are a leak check: they compare GC-settled snapshots after loading the engine/corpus and after all validation has finished, so they show what validation leaves behind, not the memory a retained AST population holds. Memory capture and GC stay outside timing.',
			''
		);
		if (analysis.builtArena) {
			lines.push('| Grammar | Built arena, MiB | Count tables, MiB | Count tables per chunk byte |', '| --- | ---: | ---: | ---: |');
			for (const [grammar, row] of Object.entries(analysis.builtArena))
				lines.push(`| ${grammar} | ${row.chunksMiB.toFixed(3)} | ${row.countsMiB.toFixed(3)} | ${(row.countShare * 100).toFixed(1)} % |`);
			lines.push(
				'',
				"Built allocator state at sampling after all three buckets: chunks including count tables, and count tables against the chunks' own bytes. This is not a retained node population.",
				''
			);
		}
	} else lines.push('Worker memory was not recorded in this historical report.', '');
	lines.push(
		'',
		'External memory includes array buffers; do not add them again. RSS overlaps heap and external memory, so do not sum these columns. These fields do not provide complete native retained-memory attribution.',
		''
	);
	return { analysis, markdown: lines.join('\n') };
}

function main() {
	const [action, first, ...rest] = process.argv.slice(2);
	const [second] = rest;
	if (action === 'capture') writeJson(first, capture());
	else if (action === 'verify') verify(readJson(first), readJson(second));
	else if (action === 'merge') {
		const shards = rest.map((path) => ({
			report: readJson(path),
			before: readJson(join(dirname(path), 'before.json')),
			after: readJson(join(dirname(path), 'after.json'))
		}));
		writeJson(first, mergeCorpusShards(shards, JSON.parse(process.env.EXPECTED_GRAMMARS ?? 'null')));
	} else if (action === 'summarize') {
		const { analysis, markdown } = summarize(readJson(first));
		writeJson(join(dirname(second), 'analysis.json'), analysis);
		writeFileSync(second, markdown);
		if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
		process.stdout.write(markdown);
	} else
		throw new Error(
			'usage: arena-benchmark-report.mjs capture <json> | verify <before> <after> | merge <output> <shard reports...> | summarize <raw> <markdown>'
		);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) main();
