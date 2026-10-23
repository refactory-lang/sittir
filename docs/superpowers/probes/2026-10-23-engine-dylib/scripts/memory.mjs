// Memory with grammar addons loaded, in one fresh process.
//
//   node --expose-gc memory.mjs <grammar>=<file.node> [<grammar>=<file.node> ...]
//
// Records process.memoryUsage() (rss, heapUsed, external) after a GC at
// three points: before any addon, after loading every addon, and after a
// small workload in each (one engine, one fixture parsed, read at every
// depth, rendered, disposed). On macOS it also records vmmap's physical
// footprint, which counts a shared library's clean text once.
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { samples } from './samples.mjs';

const require = createRequire(import.meta.url);
const addons = process.argv.slice(2).map((spec) => spec.split('='));

function sample() {
	globalThis.gc?.();
	const { rss, heapUsed, external } = process.memoryUsage();
	const point = { rss, heapUsed, external };
	if (process.platform === 'darwin') {
		const summary = execFileSync('vmmap', ['--summary', String(process.pid)], { encoding: 'utf8', maxBuffer: 1 << 26 });
		const footprint = /Physical footprint:\s+([\d.]+)([KMG])/.exec(summary);
		if (footprint) point.footprint = Number(footprint[1]) * { K: 1 << 10, M: 1 << 20, G: 1 << 30 }[footprint[2]];
	}
	return point;
}

const report = { addons: addons.map(([grammar]) => grammar), before: sample() };
const loaded = addons.map(([grammar, file]) => [grammar, require(file)]);
report.loaded = sample();
for (const [grammar, native] of loaded) {
	const engine = new native.SittirEngine();
	const { treeId } = JSON.parse(engine.parse(samples[grammar]));
	engine.render(engine.read(treeId, 0, Infinity), treeId);
	native.disposeTree(treeId);
}
report.worked = sample();
console.log(JSON.stringify(report));
