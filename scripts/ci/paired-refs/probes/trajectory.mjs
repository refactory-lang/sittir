// Usage: node --expose-gc trajectory.mjs <tree> <grammar> <object|arena> <out.json>
// The corpus worker's batch, as it runs it (parse, render, same-value root
// edits, the edits rendered, the edits released, a hash of every render),
// recording per batch: parse and render milliseconds, resident set, heap
// used, external memory, the native trees still live, and the garbage
// collections by kind (count and milliseconds) inside the batch.
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { performance, PerformanceObserver } from 'node:perf_hooks';
import { cpuModel } from '../../arena-benchmark-cpu.mjs';
import path from 'node:path';
const [root, grammar, nodeStorage, out] = process.argv.slice(2);
const require = createRequire(import.meta.url);
const native = require(`${root}/packages/${grammar}/native/index.cjs`);
const language = (await import(`${root}/packages/${grammar}/dist/index.js`)).default;
const engine = await language.createEngine({ nodeStorage });
const entries = JSON.parse(readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), '..', `corpus-${grammar}.json`), 'utf8'));
const hash = (texts) => createHash('sha256').update(JSON.stringify(texts)).digest('hex');
let gcs = {};
new PerformanceObserver((list) => {
	for (const e of list.getEntries()) {
		const kind = { 1: 'minor', 2: 'major', 4: 'incremental', 8: 'weakcb' }[e.detail?.kind] ?? String(e.detail?.kind);
		const g = (gcs[kind] ??= { n: 0, ms: 0 });
		g.n++;
		g.ms += e.duration;
	}
}).observe({ entryTypes: ['gc'] });
let sink = 0;
const batches = [];
function batch(record) {
	gcs = {};
	let start = performance.now();
	const roots = entries.map((entry) => engine.parse(entry.source));
	const parseMs = performance.now() - start;
	start = performance.now();
	const renders = roots.map((node) => {
		const rendered = engine.render(node);
		try {
			return rendered.toString();
		} finally {
			rendered[Symbol.dispose]?.();
		}
	});
	const renderMs = performance.now() - start;
	const changed = roots.flatMap((node) =>
		Object.keys(node.$with ?? {})
			.sort()
			.flatMap((key) => {
				const setter = node.$with[key];
				if (typeof setter !== 'function' || typeof node[key] !== 'function') return [];
				const value = node[key]();
				return [Array.isArray(value) && setter.length === 0 ? setter.call(node.$with, ...value) : setter.call(node.$with, value)];
			})
	);
	const editedRenders = changed.map((node) => node.$render());
	for (const node of changed) node[Symbol.dispose]?.();
	sink += hash(renders).length + hash(editedRenders).length;
	if (!record) return;
	const m = process.memoryUsage();
	batches.push({ parseMs, renderMs, rssMB: m.rss / 2 ** 20, heapMB: m.heapUsed / 2 ** 20, externalMB: m.external / 2 ** 20, liveTrees: native.liveTreeCount?.(), gc: gcs });
}
const warm = performance.now();
let warmupBatches = 0;
do {
	batch(false);
	warmupBatches++;
	await new Promise(setImmediate);
} while (performance.now() - warm < 2000);
for (let i = 0; i < 150; i++) {
	batch(true);
	await new Promise(setImmediate);
}
writeFileSync(out, JSON.stringify({ root, grammar, nodeStorage, cpu: cpuModel(), node: process.version, warmupBatches, batches, sink }) + '\n');
console.log(grammar, nodeStorage, 'warmup', warmupBatches, 'batches', batches.length);
engine.dispose();
