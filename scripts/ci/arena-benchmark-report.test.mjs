import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { analyzeCorpus, analyzeEager, summarize, verify } from './arena-benchmark-report.mjs';

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
