import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { analyzeCorpus, mergeCorpusShards, summarize, verify } from './arena-benchmark-report.mjs';

const result = (name) =>
	JSON.parse(
		readFileSync(
			new URL(`../../docs/superpowers/probes/2026-10-12-record-wire/results/${name}`, import.meta.url),
			'utf8'
		)
	);
const corpus = () => result('2026-10-22-validation-storage-darwin-arm64.json');

test('describes sampled allocator state without claiming an unreleased node population', () => {
	const data = corpus();
	const zero = { heapUsed: 0, heapTotal: 0, external: 0, arrayBuffers: 0, rss: 0 };
	for (const worker of data.validationSamples)
		worker.memory = { baseline: { ...zero }, after: { ...zero }, peakRssBytes: 0, built: { chunks: 8192, counts: 1024 } };
	const { markdown } = summarize(data);
	assert.doesNotMatch(markdown, /typed Rust nodes before record encoding|nothing released/);
	assert.match(markdown, /allocator state/);
	assert.match(markdown, /not a retained/);
});

test('recomputes all corpus phase rows and known aggregate ratios', () => {
	const measured = analyzeCorpus(corpus());
	assert.equal(measured.workers, 50);
	assert.equal(measured.phases.length, 75);
	assert(Math.abs(measured.aggregates['read-render-parse'].ratio - 0.7610036878105529) < 1e-12);
});

test('rejects reused workers and invented summaries', () => {
	const reused = corpus();
	reused.validationSamples[1].pid = reused.validationSamples[0].pid;
	assert.throws(() => analyzeCorpus(reused), /workers must be fresh/);
	const invented = corpus();
	invented.validationSummary[0].timings[0].arenaMs += 1;
	assert.throws(() => analyzeCorpus(invented), /statistic differs/);
});

test('refuses a changed corpus result and incomplete worker population', () => {
	const changed = corpus();
	changed.validationSamples[0].buckets[0].resultSha256 = '0'.repeat(64);
	assert.throws(() => analyzeCorpus(changed), /changed resultSha256/);
	const incomplete = corpus();
	incomplete.validationSamples.pop();
	assert.throws(() => analyzeCorpus(incomplete));
});

test('reports slower arena timings without a performance gate', () => {
	const data = corpus();
	for (const worker of data.validationSamples.filter((value) => value.storage === 'arena'))
		for (const bucket of worker.buckets)
			for (const phase of Object.keys(bucket.timings)) bucket.timings[phase] = bucket.timings[phase].map((ms) => ms * 10);
	for (const summary of data.validationSummary)
		for (const timing of summary.timings) {
			timing.arenaMs *= 10;
			timing.arenaRange = timing.arenaRange.map((ms) => ms * 10);
			if (timing.arenaOverObject !== null) timing.arenaOverObject *= 10;
		}
	assert(Object.values(summarize(data).analysis.aggregates).every((value) => value.ratio > 1));
});

test('interval verification rejects runtime or commit changes', () => {
	const before = {
		commit: 'one',
		sections: { source: { hashes: { 'a.ts': 'original' } } },
		workingTreeDiffSha256: 'clean'
	};
	verify(before, structuredClone(before));
	assert.throws(() => verify(before, { ...before, commit: 'two' }), /commit changed/);
	const after = structuredClone(before);
	after.sections.source.hashes['a.ts'] = 'modified';
	assert.throws(() => verify(before, after), /runtime inputs changed/);
});

test('reports corpus peak RSS and signed settled deltas without summing process memory fields', () => {
	const data = corpus();
	for (const worker of data.validationSamples) {
		worker.memory = {
			baseline: { heapUsed: 10, heapTotal: 16, external: 1, arrayBuffers: 0.5, rss: 64 },
			after: { heapUsed: 8, heapTotal: 16, external: 3, arrayBuffers: 2, rss: 72 },
			peakRssBytes: (worker.storage === 'object' ? 96 : 128) * 1048576
		};
		for (const snapshot of [worker.memory.baseline, worker.memory.after])
			for (const field of Object.keys(snapshot)) snapshot[field] *= 1048576;
	}
	const { analysis, markdown } = summarize(data);
	const grammar = data.options.grammars[0];
	assert.equal(analysis.memoryMiB[grammar].object.peakRss.median, 96);
	assert.equal(analysis.memoryMiB[grammar].arena.peakRss.median, 128);
	assert.equal(analysis.memoryMiB[grammar].arena.settledDelta.heapUsed, -2);
	assert.equal(analysis.memoryMiB[grammar].arena.settledDelta.external, 2);
	assert.equal(analysis.memoryMiB[grammar].arena.heapPlusExternalDelta, 0);
	assert.match(markdown, /Whole-worker peak RSS/);
	assert.match(markdown, /all three buckets/);
	assert.match(markdown, /Object ms/);
	assert.match(markdown, /MiB/);
	assert.match(markdown, /Leak check: settled heap delta/);
	assert.match(markdown, /settled deltas are a leak check/);
	delete data.validationSamples[0].memory;
	assert.throws(() => analyzeCorpus(data), /incomplete worker memory/);
});

test('historical corpus reports mark absent memory rather than inventing zero usage', () => {
	const { analysis, markdown } = summarize(corpus());
	assert.deepEqual(analysis.memoryMiB, {});
	assert.match(markdown, /Worker memory was not recorded/);
});

test('labels each corpus row as a whole validator round trip, not construction', () => {
	const { markdown } = summarize(corpus());
	assert.match(markdown, /\| Whole validator round trip \| Object ms \| Arena ms \| Arena\/object \|/);
	assert.match(markdown, /\| factory-render-parse \|/);
	assert.match(markdown, /not construction measurements/);
});

test('independent grammar runners preserve complete coverage, paired statistics and runtime identity', () => {
	const data = corpus();
	const before = {
		commit: 'revision',
		sections: { compiledRuntime: { hashes: { 'runtime.js': 'hash' } } },
		workingTreeDiffSha256: 'clean'
	};
	const shards = data.options.grammars.map((grammar) => ({
		report: {
			...structuredClone(data),
			options: { ...data.options, grammars: [grammar] },
			validationSummary: data.validationSummary.filter((row) => row.grammar === grammar),
			validationSamples: data.validationSamples
				.filter((row) => row.grammar === grammar)
				.map((row, index) => ({ ...row, pid: index + 1 }))
		},
		before: structuredClone(before),
		after: structuredClone(before)
	}));
	const combined = mergeCorpusShards(shards, data.options.grammars);
	const measured = analyzeCorpus(combined);
	assert.equal(measured.workers, 50);
	assert.equal(measured.phases.length, 75);
	assert.deepEqual(measured.aggregates, analyzeCorpus(data).aggregates);
	assert.match(summarize(combined).markdown, /separate runners/);
	assert.throws(() => mergeCorpusShards(shards.slice(1), data.options.grammars), /grammar shard coverage/);
	assert.throws(() => mergeCorpusShards([...shards, shards[0]], data.options.grammars), /grammar shard coverage/);
	const changed = structuredClone(shards);
	changed[0].before.sections.compiledRuntime.hashes['runtime.js'] = 'different';
	changed[0].after.sections.compiledRuntime.hashes['runtime.js'] = 'different';
	assert.throws(() => mergeCorpusShards(changed, data.options.grammars), /same runtime/);
	changed[0].after.commit = 'changed';
	assert.throws(() => mergeCorpusShards(changed, data.options.grammars), /commit changed/);
	assert.match(summarize(combined).markdown, /build records on the arena arm and objects on the object arm/);
});

const MiB = 1048576;

function withBaseline(data, scale) {
	const baseline = {
		tree: '/baseline',
		commit: 'base',
		harnessSha256: data.environment.harnessSha256,
		validationSummary: structuredClone(data.validationSummary),
		validationSamples: structuredClone(data.validationSamples)
	};
	let pid = Math.max(...data.validationSamples.map((worker) => worker.pid));
	for (const worker of baseline.validationSamples) {
		worker.pid = ++pid;
		for (const bucket of worker.buckets)
			for (const phase of Object.keys(bucket.timings)) bucket.timings[phase] = bucket.timings[phase].map((ms) => ms * scale);
	}
	for (const summary of baseline.validationSummary)
		for (const timing of summary.timings) {
			timing.objectMs *= scale;
			timing.arenaMs *= scale;
			timing.objectRange = timing.objectRange.map((ms) => ms * scale);
			timing.arenaRange = timing.arenaRange.map((ms) => ms * scale);
		}
	const memory = [];
	for (const grammar of data.options.grammars)
		for (let round = 0; round < data.options.rounds; round++)
			for (const revision of ['branch', 'baseline'])
				for (const grammars of [[grammar], data.options.grammars])
					memory.push({
						grammar,
						revision,
						round,
						grammars,
						pid: ++pid,
						idle: 'idle 90%',
						rssBytes: ((revision === 'branch' ? 100 : 98) + (grammars.length > 1 ? 50 : 0)) * MiB
					});
	const install = Object.fromEntries(
		['branch', 'baseline'].map((revision) => [
			revision,
			Object.fromEntries(data.options.grammars.map((grammar) => [grammar, { packages: { [`@sittir/${grammar}`]: 1 }, bytes: (revision === 'branch' ? 8 : 6.5) * MiB }]))
		])
	);
	return { ...data, baseline, library: { memory, install } };
}

test('compares the branch with its baseline from the same rounds: throughput, memory and a host install', () => {
	const data = withBaseline(corpus(), 2);
	const { analysis, markdown } = summarize(data);
	const [grammar] = data.options.grammars;
	assert(Math.abs(analysis.revision.aggregates['read-render-parse'].object.ratio - 0.5) < 1e-12);
	assert(Math.abs(analysis.revision.aggregates['read-render-parse'].arena.ratio - 0.5) < 1e-12);
	for (const row of analysis.revision.phases) if (row.object.ratio !== null) assert(Math.abs(row.object.ratio - 0.5) < 1e-12);
	assert.deepEqual(analysis.revision.memoryMiB.one[grammar], { branch: 100, baseline: 98 });
	assert.deepEqual(analysis.revision.memoryMiB.all, { branch: 150, baseline: 148 });
	assert.deepEqual(analysis.revision.installMiB[grammar], { branch: 8, baseline: 6.5 });
	assert.match(markdown, /Branch against baseline base/);
	assert.match(markdown, /\| read-render-parse \| 0\.500 \| 0\.500 \|/);
	assert.match(markdown, /\| every grammar \| 150\.000 \| 148\.000 \| \+2\.000 \|/);
	assert.match(markdown, /\| all grammars \| 40\.000 \| 32\.500 \| \+7\.500 \|/);
});

test('refuses a baseline that measured another workload, a reused worker and missing memory workers', () => {
	const other = withBaseline(corpus(), 1);
	const [first] = other.baseline.validationSummary;
	first.counts = { ...first.counts, pass: first.counts.pass + 1 };
	for (const worker of other.baseline.validationSamples.filter((value) => value.grammar === first.grammar))
		for (const bucket of worker.buckets.filter((value) => value.bucket === first.bucket)) bucket.counts = first.counts;
	assert.throws(() => analyzeCorpus(other), /baseline measured another workload/);
	const reused = withBaseline(corpus(), 1);
	reused.baseline.validationSamples[0].pid = reused.validationSamples[0].pid;
	assert.throws(() => analyzeCorpus(reused), /workers must be fresh/);
	const missing = withBaseline(corpus(), 1);
	missing.library.memory.pop();
	assert.throws(() => analyzeCorpus(missing), /incomplete memory worker population/);
});

test('grammar runners each compare against the same baseline, and their comparisons combine', () => {
	const data = withBaseline(corpus(), 2);
	const identity = (commit) => ({ commit, sections: { compiledRuntime: { hashes: { 'runtime.js': commit } } }, workingTreeDiffSha256: 'clean' });
	const shards = data.options.grammars.map((grammar) => ({
		report: {
			...structuredClone(data),
			options: { ...data.options, grammars: [grammar] },
			validationSummary: data.validationSummary.filter((row) => row.grammar === grammar),
			validationSamples: data.validationSamples.filter((row) => row.grammar === grammar),
			baseline: {
				...data.baseline,
				validationSummary: data.baseline.validationSummary.filter((row) => row.grammar === grammar),
				validationSamples: data.baseline.validationSamples.filter((row) => row.grammar === grammar)
			},
			library: {
				memory: data.library.memory.filter((row) => row.grammar === grammar),
				install: Object.fromEntries(Object.entries(data.library.install).map(([revision, sizes]) => [revision, { [grammar]: sizes[grammar] }]))
			}
		},
		before: identity('revision'),
		after: identity('revision'),
		baselineBefore: identity('base'),
		baselineAfter: identity('base')
	}));
	const combined = analyzeCorpus(mergeCorpusShards(shards, data.options.grammars));
	assert.deepEqual(combined.revision.aggregates, analyzeCorpus(data).revision.aggregates);
	assert.deepEqual(combined.revision.memoryMiB.all, { branch: 150, baseline: 148 });
	assert.equal(Object.keys(combined.revision.installMiB).length, data.options.grammars.length);
	const unverified = structuredClone(shards);
	delete unverified[0].baselineAfter;
	assert.throws(() => mergeCorpusShards(unverified, data.options.grammars), /baseline identity missing/);
	const other = structuredClone(shards);
	other[1].baselineBefore = identity('elsewhere');
	other[1].baselineAfter = identity('elsewhere');
	assert.throws(() => mergeCorpusShards(other, data.options.grammars), /baseline report and identity name other commits/);
});
