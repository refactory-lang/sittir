// Two real grammar addons, each loaded from its own package directory with
// its own engine and std copies. Prints one JSON report.
//
//   node --expose-gc grammars.mjs <grammar>=<file.node> <grammar>=<file.node>
//
// - images: the engine and std images the process mapped;
// - ids: trees parsed alternately by the two addons, through the table
//   (`parse`) and as objects (`parseTree`), all from one counter, and the
//   `globalThis` counter never set;
// - tree objects: read and render through a `Tree` with no table, the same
//   text the table path renders; a `Tree` of one grammar refused by the
//   other; trees freed when JavaScript collects them.
import { createRequire } from 'node:module';
import { mappedImages } from './images.mjs';
import { samples } from './samples.mjs';

const require = createRequire(import.meta.url);
const addons = process.argv.slice(2).map((spec) => {
	const [grammar, file] = spec.split('=');
	const native = require(file);
	return { grammar, native, engine: new native.SittirEngine(), source: samples[grammar] };
});
const [first, second] = addons;

function attempt(f) {
	try {
		return { ok: f() };
	} catch (error) {
		return { error: String(error.message ?? error) };
	}
}

const report = { platform: `${process.platform}-${process.arch}`, node: process.version, grammars: addons.map((a) => a.grammar) };

const ids = [];
for (let round = 0; round < 2; round++) {
	for (const { grammar, engine, source } of addons) {
		ids.push([grammar, JSON.parse(engine.parse(source)).treeId]);
		ids.push([grammar, engine.parseTree(source).id]);
	}
}
report.ids = ids.map(([grammar, id]) => `${grammar}:${id}`);
report.idsUniqueAndIncreasing = ids.every(([, id], i) => i === 0 || id > ids[i - 1][1]);
report.globalCounter = globalThis.__sittirNextTreeId ?? null;

report.render = Object.fromEntries(
	addons.map(({ grammar, engine, source }) => {
		const tree = engine.parseTree(source);
		const viaTree = engine.renderIn(tree.read(0, Infinity), tree);
		const { treeId } = JSON.parse(engine.parse(source));
		const viaTable = engine.render(engine.read(treeId, 0, Infinity), treeId);
		return [grammar, { viaTreeIsSource: viaTree === source, sameAsTable: viaTree === viaTable }];
	})
);

const firstTree = first.engine.parseTree(first.source);
const secondTree = second.engine.parseTree(second.source);
report.crossGrammar = {
	renderInForeignTree: attempt(() => second.engine.renderIn(secondTree.read(0, Infinity), firstTree)).error ?? 'accepted',
	foreignMethodOnTree: attempt(() => Object.getPrototypeOf(firstTree).read.call(secondTree, 0)).error ?? 'accepted'
};

function churn({ engine, source }, count) {
	for (let i = 0; i < count; i++) engine.parseTree(source);
}
async function collect() {
	for (let i = 0; i < 4; i++) {
		globalThis.gc?.();
		await new Promise((resolve) => setImmediate(resolve));
	}
}
await collect();
const live = () => Object.fromEntries(addons.map(({ grammar, native }) => [grammar, native.liveTreeObjects()]));
const settled = live();
for (const addon of addons) churn(addon, 200);
const made = live();
await collect();
report.treeObjects = { settled, afterMaking200Each: made, afterGc: live(), held: [firstTree.id, secondTree.id].length };

report.images = mappedImages(['sittir_engine', 'libstd-', 'std-', 'sittir-']);
console.log(JSON.stringify(report, null, 2));
