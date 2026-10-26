import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import os from 'node:os';
import { median } from '../../../../../packages/tools/src/profile/storage-common.ts';
import { setup, native, functionCase, parseDeep, disposeTrees } from './load.mjs';
import { Arena as LegacyEncoder } from '../../2026-10-01-shared-arena/2026-10-01/encode-runtime.mts';

const { values } = parseArgs({
	options: {
		worker: { type: 'string' },
		count: { type: 'string', default: '10000' },
		rounds: { type: 'string', default: '5' },
		warmup: { type: 'string', default: '2' },
		iterations: { type: 'string', default: '3' },
		'idle-gate': { type: 'string' },
		output: { type: 'string', default: 'eager-builder-results.json' }
	}
});
const count = Number(values.count);
const warmup = Number(values.warmup);
const iterations = Number(values.iterations);
const rounds = Number(values.rounds);
for (const n of [count, iterations, rounds]) assert(Number.isSafeInteger(n) && n > 0);
assert(Number.isSafeInteger(warmup) && warmup >= 0);
const names = Array.from({ length: count }, (_, n) => `f${n}`);
const digest = (texts) => {
	const hash = createHash('sha256');
	for (const text of texts)
		hash
			.update(String(Buffer.byteLength(text)))
			.update(':')
			.update(text);
	return hash.digest('hex');
};
const difference = (before, after) =>
	Object.fromEntries(Object.keys(after).map((key) => [key, after[key] - before[key]]));
const collect = async () => {
	for (let pass = 0; pass < 3; pass++) {
		globalThis.gc();
		await new Promise(setImmediate);
	}
};

async function iteration(mode) {
	const { store, build } = setup(mode);
	const roots = [];
	const texts = [];
	const trees = [];
	await collect();
	assert.equal(native.heldArenaReferences(), 0, 'previous native registrations finalized before timing');
	const allocationBefore = native.allocatorTotals();
	const start = performance.now();
	for (const name of names) roots.push(functionCase(build, name));
	const built = performance.now();
	const renderBefore = native.allocatorTotals();
	let nativeRenderNs = 0;
	let bodyAllocationCalls = 0;
	let bodyAllocatedBytes = 0;
	for (const root of roots) {
		const result = root.render();
		texts.push(result.text);
		nativeRenderNs += result.nativeNs;
		bodyAllocationCalls += result.allocationCalls;
		bodyAllocatedBytes += result.allocatedBytes;
	}
	const rendered = performance.now();
	const renderAfter = native.allocatorTotals();
	try {
		for (const text of texts) trees.push(parseDeep(text));
	} finally {
		if (trees.length !== count) disposeTrees(trees);
	}
	const parsed = performance.now();
	const renderAllocations = difference(renderBefore, renderAfter);
	const allocations = difference(allocationBefore, renderAfter);
	disposeTrees(trees);
	const replacement = build.identifier('updated');
	const editBefore = native.allocatorTotals();
	const editStart = performance.now();
	const edited = roots.map((root) => root.$with.name(replacement));
	const editEnd = performance.now();
	const editAllocations = difference(editBefore, native.allocatorTotals());
	for (const n of [0, count - 1]) {
		assert.equal(roots[n].name().text(), names[n]);
		assert.equal(edited[n].name().text(), 'updated');
		assert.equal(store.identity(roots[n].body()), store.identity(edited[n].body()));
	}
	assert.equal(store.records, count * 5 + 1);
	let legacyEncode;
	if (mode === 'object') {
		const encoder = new LegacyEncoder();
		const encodeStart = performance.now();
		for (const root of roots) encoder.node(store.identity(root));
		legacyEncode = {
			ms: performance.now() - encodeStart,
			words: encoder.next,
			bytes: encoder.nextByte,
			capacityBytes: encoder.words.byteLength + encoder.bytes.byteLength
		};
	}
	return {
		phases: {
			build: built - start,
			render: rendered - built,
			parse: parsed - rendered,
			pipeline: parsed - start,
			edit: editEnd - editStart
		},
		count,
		casesSha256: digest(names),
		renderSha256: digest(texts),
		renderBytes: texts.reduce((sum, text) => sum + Buffer.byteLength(text), 0),
		nativeRenderNs,
		renderAllocations,
		bodyAllocationCalls,
		bodyAllocatedBytes,
		allocations,
		editAllocations,
		legacyEncode,
		storage: store.memory()
	};
}

async function memory(mode) {
	const { store, build } = setup(mode);
	await collect();
	const allocationBaseline = native.allocatorTotals();
	const baseline = process.memoryUsage();
	const empty = store.memory();
	const roots = names.map((name) => functionCase(build, name));
	await collect();
	const built = process.memoryUsage();
	const builtStorage = store.memory();
	for (const root of roots) root.render();
	await collect();
	const rendered = process.memoryUsage();
	const renderedAllocations = difference(allocationBaseline, native.allocatorTotals());
	const child = build.identifier('updated');
	const edited = roots.map((root) => root.$with.name(child));
	for (const root of edited) root.render();
	await collect();
	const retainedSnapshots = process.memoryUsage();
	const editedStorage = store.memory();
	const editedAllocations = difference(allocationBaseline, native.allocatorTotals());
	globalThis.eagerProbeRetained = { store, roots, edited };
	assert.equal(roots.length + edited.length, count * 2);
	return {
		baseline,
		empty,
		built,
		builtStorage,
		rendered,
		renderedAllocations,
		renderedRustRetainedBytes: renderedAllocations.bytes - renderedAllocations.freedBytes,
		retainedSnapshots,
		editedStorage,
		editedAllocations,
		snapshotsRustRetainedBytes: editedAllocations.bytes - editedAllocations.freedBytes,
		builtDelta: difference(baseline, built),
		renderedDelta: difference(baseline, rendered),
		snapshotsDelta: difference(baseline, retainedSnapshots)
	};
}

if (values.worker !== undefined) {
	assert(['object', 'arena'].includes(values.worker));
	assert.equal(typeof globalThis.gc, 'function');
	for (let n = 0; n < warmup; n++) await iteration(values.worker);
	const samples = [];
	for (let n = 0; n < iterations; n++) samples.push(await iteration(values.worker));
	for (const sample of samples) {
		assert.equal(sample.renderSha256, samples[0].renderSha256);
		assert.equal(sample.casesSha256, samples[0].casesSha256);
		assert.deepEqual(sample.renderAllocations, samples[0].renderAllocations);
		assert.deepEqual(sample.editAllocations, { calls: 0, bytes: 0, frees: 0, freedBytes: 0 });
	}
	console.log(JSON.stringify({ mode: values.worker, pid: process.pid, samples, memory: await memory(values.worker) }));
} else {
	const workers = [];
	const start = new Date().toISOString();
	for (let round = 0; round < rounds; round++) {
		for (const mode of round % 2 === 0 ? ['object', 'arena'] : ['arena', 'object']) {
			let idle = null;
			if (values['idle-gate'] !== undefined) {
				const gate = spawnSync('bash', [values['idle-gate'], process.cwd()], { encoding: 'utf8', timeout: 120000 });
				if (gate.status !== 0) throw new Error(gate.stdout + gate.stderr);
				idle = gate.stdout.trim();
			}
			const child = spawnSync(
				process.execPath,
				[
					'--import',
					'tsx',
					'--expose-gc',
					fileURLToPath(import.meta.url),
					'--worker',
					mode,
					'--count',
					String(count),
					'--warmup',
					String(warmup),
					'--iterations',
					String(iterations)
				],
				{ encoding: 'utf8', env: { ...process.env, NODE_ENV: 'production' }, maxBuffer: 16 * 1024 * 1024 }
			);
			if (child.status !== 0) throw new Error(child.stdout + child.stderr);
			const worker = JSON.parse(child.stdout.trim());
			assert.equal(worker.mode, mode);
			workers.push({ round, idle, ...worker });
			process.stderr.write(`round ${round + 1}/${rounds} ${mode} finished\n`);
		}
	}
	const reference = workers[0].samples[0];
	for (const worker of workers)
		for (const sample of worker.samples) {
			for (const key of ['count', 'casesSha256', 'renderSha256', 'renderBytes'])
				assert.equal(sample[key], reference[key], key);
		}
	assert.equal(new Set(workers.map((worker) => worker.pid)).size, rounds * 2);
	const summary = Object.fromEntries(
		['object', 'arena'].map((mode) => {
			const selected = workers.filter((worker) => worker.mode === mode);
			return [
				mode,
				Object.fromEntries(
					Object.keys(reference.phases).map((phase) => {
						const medians = selected.map((worker) => median(worker.samples.map((sample) => sample.phases[phase])));
						return [
							phase,
							{
								medianMs: median(medians),
								minMs: Math.min(...medians),
								maxMs: Math.max(...medians),
								nsPerRoot: (median(medians) * 1e6) / count
							}
						];
					})
				)
			];
		})
	);
	const ratios = Object.fromEntries(
		Object.keys(reference.phases).map((phase) => [
			phase,
			summary.arena[phase].medianMs / summary.object[phase].medianMs
		])
	);
	const report = {
		schemaVersion: 2,
		startedAt: start,
		finishedAt: new Date().toISOString(),
		machine: {
			cpu: os.cpus()[0].model,
			platform: process.platform,
			release: os.release(),
			arch: process.arch,
			node: process.version
		},
		count,
		rounds,
		warmup,
		iterations,
		idleGated: values['idle-gate'] !== undefined,
		workers,
		summary,
		ratios
	};
	await writeFile(values.output, JSON.stringify(report, null, 2) + '\n');
	console.log(JSON.stringify({ output: values.output, ratios }));
}
