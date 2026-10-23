// Loads the two toy addons of one spike, each from its own package directory,
// and prints what happened as JSON.
//
//   node toys.mjs napi-shared <a.node> <b.node>
//   node toys.mjs shape-a <a.node> <b.node>
import { createRequire } from 'node:module';
import { mappedImages } from './images.mjs';

const require = createRequire(import.meta.url);
const [scenario, pathA, pathB] = process.argv.slice(2);

function attempt(f) {
	try {
		return { ok: f() };
	} catch (error) {
		return { error: String(error.message ?? error) };
	}
}

const report = { scenario, platform: `${process.platform}-${process.arch}`, node: process.version };

if (scenario === 'napi-shared') {
	const a = attempt(() => require(pathA));
	report.loadA = a.error ?? 'loaded';
	if (a.ok) {
		report.aExports = Object.keys(a.ok).sort();
		report.aBeforeB = { addon: a.ok.addon(), constructed: new a.ok.SittirEngine().describe(), made: a.ok.make().describe() };
	}
	const b = attempt(() => require(pathB));
	report.loadB = b.error ?? 'loaded';
	if (b.ok) {
		report.bExports = Object.keys(b.ok).sort();
		report.b = {
			addon: b.ok.addon(),
			constructed: new b.ok.SittirEngine().describe(),
			made: b.ok.make().describe(),
			madeIsOwnClass: b.ok.make() instanceof b.ok.SittirEngine
		};
	}
	if (a.ok) {
		report.aAfterB = {
			addon: a.ok.addon(),
			constructed: new a.ok.SittirEngine().describe(),
			made: a.ok.make().describe(),
			madeIsOwnClass: a.ok.make() instanceof a.ok.SittirEngine
		};
	}
	report.images = mappedImages(['toy_napi', 'libstd-', 'std-']);
} else if (scenario === 'shape-a') {
	const a = require(pathA);
	const b = attempt(() => require(pathB));
	report.loadB = b.error ?? 'loaded';
	if (b.ok) {
		report.ids = [a.claimTreeId(), b.ok.claimTreeId(), a.claimTreeId(), b.ok.claimTreeId()];
		report.engine = { a: a.engine(), b: b.ok.engine() };
		report.mallocSlot = { a: a.mallocSlot(), b: b.ok.mallocSlot() };
		report.scannerRoundtrip = [a.scannerRoundtrip(), b.ok.scannerRoundtrip()];
		report.parseWithoutLanguage = [a.parseWithoutLanguage(), b.ok.parseWithoutLanguage()];
	}
	report.images = mappedImages(['toy_', 'sittir_engine', 'libstd-', 'std-']);
} else {
	throw new Error(`unknown scenario ${scenario}`);
}
console.log(JSON.stringify(report, null, 2));
