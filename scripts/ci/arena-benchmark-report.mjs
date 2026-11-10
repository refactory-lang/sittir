import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const MEMORY_FIELDS = ['heapUsed', 'heapTotal', 'external', 'arrayBuffers', 'rss'];
const REVISIONS = ['branch', 'baseline'];
const MiB = 1048576;
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
	const compiled = readdirSync('packages').flatMap((name) => ['dist', 'build'].flatMap((output) => filesUnder(`packages/${name}/${output}`)));
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
	for (const shard of shards) {
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
		if (shard.report.baseline) {
			assert(shard.baselineBefore && shard.baselineAfter, 'baseline identity missing');
			verify(shard.baselineBefore, shard.baselineAfter);
			assert.equal(shard.baselineBefore.commit, shard.report.baseline.commit, 'baseline report and identity name other commits');
			for (const field of ['commit', 'sections', 'releaseProfile', 'workingTreeDiffSha256'])
				assert.deepEqual(shard.baselineBefore[field], shards[0].baselineBefore?.[field], 'shards must measure the same baseline');
		}
		analyzeCorpus(shard.report);
	}
	return { mode: 'validation-storage-shards', options: { grammars }, shards };
}

export function analyzeCorpus(data) {
	if (data.shards) {
		mergeCorpusShards(data.shards, data.options.grammars);
		const result = { workers: 0, aggregates: {}, phases: [], omitted: [], memoryMiB: {} };
		const revisions = [];
		for (const { report } of data.shards) {
			const part = analyzeCorpus(report);
			if (part.revision) revisions.push(part.revision);
			result.workers += part.workers;
			result.phases.push(...part.phases);
			result.omitted.push(...part.omitted);
			Object.assign(result.memoryMiB, part.memoryMiB);
			if (part.builtArena) Object.assign((result.builtArena ??= {}), part.builtArena);
			for (const [bucket, times] of Object.entries(part.aggregates)) {
				const aggregate = (result.aggregates[bucket] ??= { objectMs: 0, arenaMs: 0 });
				aggregate.objectMs += times.objectMs;
				aggregate.arenaMs += times.arenaMs;
			}
		}
		for (const value of Object.values(result.aggregates)) value.ratio = value.arenaMs / value.objectMs;
		if (revisions.length) {
			assert.equal(revisions.length, data.shards.length, 'every shard or none measures a baseline');
			result.revision = combineRevisions(revisions);
		}
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
	const result = { workers: workers.length, aggregates: {}, phases: [], omitted: [], memoryMiB: {} };
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
	const phaseNames = data.validationSummary[0].timings.map((timing) => timing.phase);
	for (const summary of data.validationSummary)
		assert.deepEqual(
			summary.timings.map((timing) => timing.phase),
			phaseNames,
			'every bucket times the same phases'
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
			const row = { grammar: summary.grammar, bucket: summary.bucket, phase: timing.phase, calls: timing.calls };
			if (timing.phase !== 'validator' && timing.calls === 0) {
				for (const observation of observations) assert.equal(observation.bucket.phases[timing.phase].calls, 0);
				result.omitted.push({ ...row, reason: 'no calls: the validator does no work under this phase' });
				continue;
			}
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
	assert.equal(result.phases.length + result.omitted.length, grammars.length * 3 * phaseNames.length);
	for (const value of Object.values(result.aggregates)) value.ratio = value.arenaMs / value.objectMs;
	if (data.baseline) result.revision = compareRevisions(data, result);
	return result;
}

const ratio = (value, base) => (base === 0 ? null : value / base);
const sides = (branch, baseline) => ({ branch, baseline, ratio: ratio(branch, baseline) });

function compareRevisions(data, branch) {
	const baseline = analyzeCorpus({
		...data,
		validationSummary: data.baseline.validationSummary,
		validationSamples: data.baseline.validationSamples,
		baseline: undefined,
		library: undefined
	});
	const pids = [...data.validationSamples, ...data.baseline.validationSamples, ...data.library.memory].map((worker) => worker.pid);
	assert.equal(new Set(pids).size, pids.length, 'workers must be fresh');
	for (const summary of data.validationSummary) {
		const other = data.baseline.validationSummary.find((row) => row.grammar === summary.grammar && row.bucket === summary.bucket);
		assert(
			other && isDeepStrictEqual(other.corpus, summary.corpus) && isDeepStrictEqual(other.counts, summary.counts),
			'baseline measured another workload'
		);
	}
	const phases = [];
	const incomparable = [];
	for (const row of branch.phases) {
		const base = baseline.phases.find((other) => other.grammar === row.grammar && other.bucket === row.bucket && other.phase === row.phase);
		const reason =
			base === undefined
				? 'the baseline does not time this phase'
				: base.calls !== row.calls
					? 'the revisions make different numbers of calls under it'
					: undefined;
		const named = { grammar: row.grammar, bucket: row.bucket, phase: row.phase };
		if (reason !== undefined) incomparable.push({ ...named, reason });
		else phases.push({ ...named, object: sides(row.object.median, base.object.median), arena: sides(row.arena.median, base.arena.median) });
	}
	const aggregates = Object.fromEntries(
		Object.entries(branch.aggregates).map(([bucket, value]) => [
			bucket,
			{ object: sides(value.objectMs, baseline.aggregates[bucket].objectMs), arena: sides(value.arenaMs, baseline.aggregates[bucket].arenaMs) }
		])
	);
	return { commit: data.baseline.commit, phases, incomparable, aggregates, ...analyzeLibrary(data) };
}

function analyzeLibrary(data) {
	const { memory, install } = data.library;
	const { grammars, rounds } = data.options;
	const alone = (worker) => isDeepStrictEqual(worker.grammars, [worker.grammar]);
	for (const grammar of grammars)
		for (let round = 0; round < rounds; round++)
			for (const revision of REVISIONS)
				for (const one of [true, false])
					assert.equal(
						memory.filter((worker) => worker.grammar === grammar && worker.round === round && worker.revision === revision && alone(worker) === one).length,
						1,
						'incomplete memory worker population'
					);
	assert.equal(memory.length, grammars.length * rounds * REVISIONS.length * 2, 'incomplete memory worker population');
	for (const worker of memory) {
		assert(Number.isFinite(worker.rssBytes) && worker.rssBytes > 0, 'invalid memory sample');
		assert(Number(worker.idle?.match(/(\d+)%/)?.[1]) >= 75, 'worker did not pass the idle gate');
	}
	const rssMiB = (rows) => median(rows.map((worker) => worker.rssBytes / MiB));
	const byRevision = (pick) => Object.fromEntries(REVISIONS.map((revision) => [revision, pick(revision)]));
	return {
		memoryMiB: {
			one: Object.fromEntries(
				grammars.map((grammar) => [grammar, byRevision((revision) => rssMiB(memory.filter((worker) => worker.grammar === grammar && worker.revision === revision && alone(worker))))])
			),
			all: byRevision((revision) => rssMiB(memory.filter((worker) => worker.revision === revision && !alone(worker))))
		},
		installMiB: Object.fromEntries(grammars.map((grammar) => [grammar, byRevision((revision) => install[revision][grammar].bytes / MiB)]))
	};
}

function combineRevisions(parts) {
	assert(parts.every((part) => part.commit === parts[0].commit), 'shards must measure the same baseline');
	const aggregates = {};
	for (const part of parts)
		for (const [bucket, value] of Object.entries(part.aggregates)) {
			const total = (aggregates[bucket] ??= { object: { branch: 0, baseline: 0 }, arena: { branch: 0, baseline: 0 } });
			for (const mode of ['object', 'arena']) for (const revision of REVISIONS) total[mode][revision] += value[mode][revision];
		}
	for (const value of Object.values(aggregates)) for (const mode of ['object', 'arena']) value[mode].ratio = ratio(value[mode].branch, value[mode].baseline);
	return {
		commit: parts[0].commit,
		phases: parts.flatMap((part) => part.phases),
		incomparable: parts.flatMap((part) => part.incomparable),
		aggregates,
		memoryMiB: {
			one: Object.assign({}, ...parts.map((part) => part.memoryMiB.one)),
			all: Object.fromEntries(REVISIONS.map((revision) => [revision, median(parts.map((part) => part.memoryMiB.all[revision]))]))
		},
		installMiB: Object.assign({}, ...parts.map((part) => part.installMiB))
	};
}

const signed = (value) => `${value >= 0 ? '+' : ''}${value.toFixed(3)}`;
const fixed = (value) => (value === null ? 'n/a' : value.toFixed(3));

function revisionLines(revision) {
	const total = (revisionName) => Object.values(revision.installMiB).reduce((sum, value) => sum + value[revisionName], 0);
	const row = (label, value) => `| ${label} | ${value.branch.toFixed(3)} | ${value.baseline.toFixed(3)} | ${signed(value.branch - value.baseline)} |`;
	return [
		`## Branch against baseline ${revision.commit}`,
		'',
		'Ratios are branch/baseline; above one the branch is slower. Both trees ran in the same rounds on each runner, every worker a fresh process, the order turning each round.',
		'',
		'| Whole validator round trip | Object branch/baseline | Arena branch/baseline |',
		'| --- | ---: | ---: |',
		...Object.entries(revision.aggregates).map(([bucket, value]) => `| ${bucket} | ${fixed(value.object.ratio)} | ${fixed(value.arena.ratio)} |`),
		'',
		'| Grammar | Read-render-parse phase | Object branch/baseline | Arena branch/baseline |',
		'| --- | --- | ---: | ---: |',
		...revision.phases
			.filter((value) => value.bucket === 'read-render-parse' && ['parse', 'read', 'copy', 'render'].includes(value.phase))
			.map((value) => `| ${value.grammar} | ${value.phase} | ${fixed(value.object.ratio)} | ${fixed(value.arena.ratio)} |`),
		'',
		...(revision.incomparable.length
			? [
					'Not compared with the baseline, because the two revisions time different work under these phases:',
					'',
					...revision.incomparable.map((value) => `- ${value.grammar} ${value.bucket} ${value.phase}: ${value.reason}`),
					''
				]
			: []),
		'| RSS after loading | Branch MiB | Baseline MiB | Branch - baseline |',
		'| --- | ---: | ---: | ---: |',
		...Object.entries(revision.memoryMiB.one).map(([grammar, value]) => row(`${grammar} alone`, value)),
		row('every grammar', revision.memoryMiB.all),
		'',
		'RSS is read in a fresh process after it creates each engine, parses and renders a sample, and collects garbage; medians over five rounds.',
		'',
		'| Host install | Branch MiB | Baseline MiB | Branch - baseline |',
		'| --- | ---: | ---: | ---: |',
		...Object.entries(revision.installMiB).map(([grammar, value]) => row(grammar, value)),
		row('all grammars', { branch: total('branch'), baseline: total('baseline') }),
		'',
		'Install sizes are the unpacked bytes npm reports for what a consumer on this runner installs: the grammar package, and its platform package where the tree ships one.',
		''
	];
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
		"The copy phase times the validators' copy of each read candidate into the plain data the factories and the render-from-content check take. It is validator tooling, not product work, and nothing is gated on it. The read phase times product reads only: read-render-parse's deep read of each tree.",
		'',
		...(analysis.omitted.length
			? [
					`A phase a validator does no work under has no row: ${[...new Set(analysis.omitted.map((value) => `${value.bucket} ${value.phase}`))].map((name) => `no row for ${name}`).join(', ')}.`,
					''
				]
			: []),
		'Factory and IR buckets build records on the arena arm and objects on the object arm.',
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
	if (analysis.revision) lines.push(...revisionLines(analysis.revision));
	return { analysis, markdown: lines.join('\n') };
}

function main() {
	const [action, first, ...rest] = process.argv.slice(2);
	const [second] = rest;
	if (action === 'capture') writeJson(first, capture());
	else if (action === 'verify') verify(readJson(first), readJson(second));
	else if (action === 'merge') {
		const optional = (path) => (existsSync(path) ? readJson(path) : undefined);
		const shards = rest.map((path) => ({
			report: readJson(path),
			before: readJson(join(dirname(path), 'before.json')),
			after: readJson(join(dirname(path), 'after.json')),
			baselineBefore: optional(join(dirname(path), 'baseline-before.json')),
			baselineAfter: optional(join(dirname(path), 'baseline-after.json'))
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
