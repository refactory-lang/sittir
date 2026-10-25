import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { analyzeCorpus, analyzeEager, mergeCorpusShards, summarize, verify } from './arena-benchmark-report.mjs';

const result = (name) =>
	JSON.parse(
		readFileSync(
			new URL(`../../docs/superpowers/probes/2026-10-12-record-wire/results/${name}`, import.meta.url),
			'utf8'
		)
	);
const eager = () => result('2026-10-22-eager-literal-slots-storage-darwin-arm64.json');
const corpus = () => result('2026-10-22-validation-storage-darwin-arm64.json');

test('recomputes known eager medians and ratio from raw workers', () => {
	const measured = analyzeEager(eager());
	assert(Math.abs(measured.phases.object.build.median - 17.024625) < 1e-9);
	assert(Math.abs(measured.phases.arena.build.median - 14.771125) < 1e-9);
	assert(Math.abs(measured.ratios.build - 0.8676329140876831) < 1e-12);
});

test('recomputes all corpus phase rows and known aggregate ratios', () => {
	const measured = analyzeCorpus(corpus());
	assert.equal(measured.workers, 50);
	assert.equal(measured.phases.length, 75);
	assert(Math.abs(measured.aggregates['read-render-parse'].ratio - 0.7610036878105529) < 1e-12);
});

test('rejects reused workers, changed render fingerprints and invented summaries', () => {
	const reused = eager();
	reused.workers[1].pid = reused.workers[0].pid;
	assert.throws(() => analyzeEager(reused), /workers must be fresh/);
	const changed = eager();
	changed.workers[0].samples[0].renderSha256 = '0'.repeat(64);
	assert.throws(() => analyzeEager(changed), /changed renderSha256/);
	const invented = eager();
	invented.summary.arena.build.medianMs += 1;
	assert.throws(() => analyzeEager(invented), /statistic differs/);
});

test('refuses a changed corpus result and incomplete worker population', () => {
	const changed = corpus();
	changed.validationSamples[0].buckets[0].resultSha256 = '0'.repeat(64);
	assert.throws(() => analyzeCorpus(changed), /changed resultSha256/);
	const incomplete = corpus();
	incomplete.validationSamples.pop();
	assert.throws(() => analyzeCorpus(incomplete));
});

test('accepts signed GC memory deltas', () => {
	const data = eager();
	for (const worker of data.workers) worker.memory.renderedDelta.heapUsed = -1048576;
	assert.equal(analyzeEager(data).memoryMiB.arena.renderedDelta.heapUsed, -1);
});

test('reports slower arena timings without a performance gate', () => {
	const data = eager();
	for (const worker of data.workers.filter((value) => value.mode === 'arena'))
		for (const sample of worker.samples) sample.phases.build *= 10;
	for (const key of ['medianMs', 'minMs', 'maxMs', 'nsPerRoot']) data.summary.arena.build[key] *= 10;
	data.ratios.build *= 10;
	assert(summarize(data).analysis.ratios.build > 1);
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
	delete data.validationSamples[0].memory;
	assert.throws(() => analyzeCorpus(data), /incomplete worker memory/);
});

test('historical corpus reports mark absent memory rather than inventing zero usage', () => {
	const { analysis, markdown } = summarize(corpus());
	assert.deepEqual(analysis.memoryMiB, {});
	assert.match(markdown, /Worker memory was not recorded/);
});

test('eager summary includes heap, external and RSS beside milliseconds', () => {
	const data = eager();
	const { analysis, markdown } = summarize(data);
	assert.equal(
		analysis.memoryMiB.arena.renderedDelta.rss,
		data.workers
			.filter((worker) => worker.mode === 'arena')
			.map((worker) => worker.memory.renderedDelta.rss)
			.sort((a, b) => a - b)[2] / 1048576
	);
	assert.match(markdown, /RSS delta/);
	assert.match(markdown, /External delta/);
	assert.match(markdown, /Object ms/);
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
