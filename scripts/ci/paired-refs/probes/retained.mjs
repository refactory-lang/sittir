// Usage: node --expose-gc retained.mjs <tree> <grammar> <storage> <variant> <out>
// What a parsed tree's data costs while nothing releases it. Parses the
// corpus BATCHES times; after each batch its roots are either dropped
// (variant dropped: no release, so only the garbage collector can free
// them) or released (variant released: each root's dispose). Then a full GC
// and a finalizer drain, and this process's RSS and V8 external memory are
// recorded. Writes the series and its first, middle and last points as <out>.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const [root, grammar, nodeStorage, variant, out] = process.argv.slice(2);
if (!['dropped', 'released'].includes(variant)) throw new Error(`unknown variant ${variant}`);
const BATCHES = 200;
const here = path.dirname(new URL(import.meta.url).pathname);
const sources = JSON.parse(readFileSync(path.join(here, '..', `corpus-${grammar}.json`), 'utf8')).map((entry) => entry.source);
const engine = await (await import(`${root}/packages/${grammar}/dist/index.js`)).default.createEngine({ nodeStorage });
const tick = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const settle = async () => {
	globalThis.gc();
	await tick(0);
	globalThis.gc();
	await tick(0);
};
const MiB = 1024 * 1024;
const point = (batch) => {
	const { rss, external, arrayBuffers, heapUsed } = process.memoryUsage();
	return { batch, rss: rss / MiB, external: external / MiB, arrayBuffers: arrayBuffers / MiB, heapUsed: heapUsed / MiB };
};
let sink = 0;
try {
	await settle();
	const series = [point(0)];
	for (let batch = 1; batch <= BATCHES; batch++) {
		let roots = sources.map((source) => engine.parse(source));
		sink += roots.length;
		if (variant === 'released') for (const node of roots) node[Symbol.dispose]?.();
		roots = undefined;
		await settle();
		series.push(point(batch));
	}
	const at = (batch) => series[batch];
	const result = { grammar, nodeStorage, variant, parsedPerBatch: sources.length, batches: BATCHES, first: at(1), middle: at(BATCHES / 2), last: at(BATCHES), start: at(0), series, sink };
	writeFileSync(out, JSON.stringify(result) + '\n');
	console.log(JSON.stringify({ grammar, nodeStorage, variant, first: at(1), last: at(BATCHES) }));
} finally {
	engine.dispose();
}
