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
	assert.match(summarize(combined).markdown, /build objects under both storage settings/);
	const records = shards.map((shard) => ({ ...shard, report: { ...shard.report, options: { ...shard.report.options, construction: 'records' } } }));
	assert.match(summarize(mergeCorpusShards(records, data.options.grammars)).markdown, /build records on the arena arm and objects on the object arm/);
	assert.throws(() => mergeCorpusShards([records[0], ...shards.slice(1)], data.options.grammars), /same construction/);
});
