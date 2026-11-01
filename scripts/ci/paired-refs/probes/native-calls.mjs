// Usage: node --expose-gc native-calls.mjs <tree> <grammar> <object|arena> <out.json> [joint|split]
// Runs the corpus worker's batch (parse every entry, render every root, edit
// every root through $with) and times, per tree, each phase, every native call
// the engine makes (by the phase it is made in), and the garbage collections
// by kind. The addon's exports are wrapped before the engine binds them.
// `joint` edits as the corpus worker does, each member read just before its
// setter (phase `edit`); `split` reads every member first (phase `read`) and
// then calls every setter with the value read (phase `set`). One second of
// warmup; then enough batches for about three seconds of timed work.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { performance, PerformanceObserver } from 'node:perf_hooks';
const [root, grammar, nodeStorage, out, editMode = 'joint'] = process.argv.slice(2);
const require = createRequire(import.meta.url);
const native = require(`${root}/packages/${grammar}/native/index.cjs`);
const calls = new Map();
let recording = false;
let phase = 'parse';
const wrap = (owner, name, label) => {
	const f = owner[name];
	owner[name] = function (...args) {
		if (!recording) return f.apply(this, args);
		const t = performance.now();
		try {
			return f.apply(this, args);
		} finally {
			const key = `${phase} ${label}`;
			const c = calls.get(key) ?? { n: 0, ms: 0 };
			c.n++;
			c.ms += performance.now() - t;
			calls.set(key, c);
		}
	};
};
for (const name of Object.keys(native)) if (typeof native[name] === 'function' && name !== 'SittirEngine') wrap(native, name, name);
const proto = native.SittirEngine.prototype;
for (const name of Object.getOwnPropertyNames(proto)) if (name !== 'constructor' && typeof Object.getOwnPropertyDescriptor(proto, name).value === 'function') wrap(proto, name, `engine.${name}`);
const language = (await import(`${root}/packages/${grammar}/dist/index.js`)).default;
const engine = await language.createEngine({ nodeStorage });
const entries = JSON.parse(readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), '..', `corpus-${grammar}.json`), 'utf8'));
const gcs = new Map();
new PerformanceObserver((list) => {
	if (!recording) return;
	for (const e of list.getEntries()) {
		const kind = { 1: 'minor', 2: 'major', 4: 'incremental', 8: 'weakcb' }[e.detail?.kind] ?? String(e.detail?.kind);
		const g = gcs.get(kind) ?? { n: 0, ms: 0 };
		g.n++;
		g.ms += e.duration;
		gcs.set(kind, g);
	}
}).observe({ entryTypes: ['gc'] });
let sink = 0;
const time = editMode === 'split' ? { parse: 0, render: 0, read: 0, set: 0 } : { parse: 0, render: 0, edit: 0 };
const set = (setter, node, value) => (Array.isArray(value) && setter.length === 0 ? setter.call(node.$with, ...value) : setter.call(node.$with, value));
function batch() {
	phase = 'parse';
	let t = performance.now();
	const roots = entries.map((entry) => engine.parse(entry.source));
	time.parse += performance.now() - t;
	phase = 'render';
	t = performance.now();
	for (const node of roots) {
		const r = engine.render(node);
		sink += r.toString().length;
		r[Symbol.dispose]?.();
	}
	time.render += performance.now() - t;
	if (editMode === 'split') {
		phase = 'read';
		t = performance.now();
		const reads = [];
		for (const node of roots)
			for (const key of Object.keys(node.$with ?? {}).sort()) {
				const setter = node.$with[key];
				if (typeof setter !== 'function' || typeof node[key] !== 'function') continue;
				reads.push([setter, node, node[key]()]);
			}
		time.read += performance.now() - t;
		phase = 'set';
		t = performance.now();
		for (const [setter, node, value] of reads) sink += set(setter, node, value) ? 1 : 0;
		time.set += performance.now() - t;
		return;
	}
	phase = 'edit';
	t = performance.now();
	for (const node of roots)
		for (const key of Object.keys(node.$with ?? {}).sort()) {
			const setter = node.$with[key];
			if (typeof setter !== 'function' || typeof node[key] !== 'function') continue;
			sink += set(setter, node, node[key]()) ? 1 : 0;
		}
	time.edit += performance.now() - t;
}
const warm = performance.now();
let warmBatches = 0;
do {
	batch();
	warmBatches++;
	await new Promise(setImmediate);
} while (performance.now() - warm < 1000);
const batches = Math.max(50, Math.ceil((3000 * warmBatches) / (performance.now() - warm)));
globalThis.gc();
for (const k of Object.keys(time)) time[k] = 0;
recording = true;
for (let i = 0; i < batches; i++) {
	batch();
	await new Promise(setImmediate);
}
await new Promise(setImmediate);
recording = false;
const trees = batches * entries.length;
const per = (ms) => (ms * 1000) / trees;
const result = {
	root,
	grammar,
	nodeStorage,
	editMode,
	buildProfile: engine.diagnostics.buildProfile,
	cpu: os.cpus()[0].model,
	node: process.version,
	batches,
	trees,
	usPerTree: Object.fromEntries(Object.entries(time).map(([k, v]) => [k, per(v)])),
	calls: Object.fromEntries([...calls].sort((a, b) => b[1].ms - a[1].ms).map(([k, c]) => [k, { perTree: c.n / trees, usPerTree: per(c.ms) }])),
	gc: Object.fromEntries([...gcs].map(([k, g]) => [k, { perBatch: g.n / batches, usPerTree: per(g.ms) }])),
	memory: process.memoryUsage(),
	sink
};
writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
console.log(`${grammar} ${nodeStorage} ${editMode}: ` + Object.entries(result.usPerTree).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(' ') + ` µs/tree over ${trees} trees`);
engine.dispose();
