// The toy spikes end to end on the host: build, lay out four packages (each
// with its own engine and std copies), run both scenarios in fresh
// processes, report link facts, then run the two skew cases. Prints one
// JSON report and writes it to <out>/report.json.
//
//   RUSTFLAGS="-C prefer-dynamic" node toys-ci.mjs --out <dir> [--target-dir <dir>]
//
// Skew cases, each built against a changed engine and loaded after package
// A's engine is already mapped:
// - source: the engine's source changes and its version does not, so every
//   symbol still resolves and the stamp check must refuse;
// - version: the engine's version changes, so its mangled symbol names do
//   too and the load itself must fail.
// Both edit tracked files for the length of one build and restore them.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { linkFacts } from './symbols.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const spikes = resolve(here, '../spikes');
const repo = resolve(here, '../../../../..');
const { values } = parseArgs({ options: { out: { type: 'string' }, 'target-dir': { type: 'string' } } });
const out = resolve(values.out ?? 'toys-out');
const host = /^host: (.+)$/m.exec(execFileSync('rustc', ['-vV'], { encoding: 'utf8' }))[1];
const targetDir = resolve(values['target-dir'] ?? process.env.CARGO_TARGET_DIR ?? join(spikes, 'target'));
const built = join(targetDir, host, 'release');

const lib = (name) => join(built, process.platform === 'win32' ? `${name}.dll` : `lib${name}.${process.platform === 'darwin' ? 'dylib' : 'so'}`);

function cargo(args) {
	execFileSync('cargo', ['build', '--release', '--target', host, ...args], {
		cwd: spikes,
		stdio: 'inherit',
		env: { ...process.env, CARGO_TARGET_DIR: targetDir }
	});
}

function pack(dir, node, cdylib, engine) {
	execFileSync(process.execPath, [join(here, 'package.mjs'), '--out', join(out, dir), '--node', `${node}=${lib(cdylib)}`, '--engine', lib(engine)], { stdio: 'ignore' });
	return join(out, dir, `${node}.node`);
}

function scenario(name, a, b) {
	const run = spawnSync(process.execPath, [join(here, 'toys.mjs'), name, a, b], { encoding: 'utf8' });
	if (run.status !== 0) return { exit: run.status, stderr: run.stderr.slice(-2000) };
	return JSON.parse(run.stdout);
}

function withEdit(file, edit, body) {
	const original = readFileSync(file, 'utf8');
	writeFileSync(file, edit(original));
	try {
		return body();
	} finally {
		writeFileSync(file, original);
	}
}

mkdirSync(out, { recursive: true });
cargo([]);
const napiA = pack('napi-a', 'toy_napi_a', 'toy_napi_a', 'toy_napi_engine');
const napiB = pack('napi-b', 'toy_napi_b', 'toy_napi_b', 'toy_napi_engine');
const shapeA = pack('shape-a-a', 'toy_addon_a', 'toy_addon_a', 'sittir_engine');
const shapeB = pack('shape-a-b', 'toy_addon_b', 'toy_addon_b', 'sittir_engine');

const report = {
	host,
	napiShared: scenario('napi-shared', napiA, napiB),
	shapeA: scenario('shape-a', shapeA, shapeB),
	links: {
		engine: linkFacts(join(out, 'shape-a-a', lib('sittir_engine').split(/[\\/]/).pop())),
		addon: linkFacts(shapeA),
		napiAddon: linkFacts(napiA)
	}
};

const engineSource = join(repo, 'rust/crates/sittir-engine/src/lib.rs');
report.skewSource = withEdit(
	engineSource,
	(text) => `${text}\n// a different engine build of the same version\n`,
	() => {
		cargo(['-p', 'toy-addon-b']);
		return scenario('shape-a', shapeA, pack('skew-source-b', 'toy_addon_b', 'toy_addon_b', 'sittir_engine'));
	}
);
report.skewVersion = withEdit(
	join(repo, 'Cargo.toml'),
	(text) => text.replace(/(\[workspace\.package\]\nversion = ")([^"]+)"/, '$10.0.1-skew"'),
	() => {
		cargo(['-p', 'toy-addon-b']);
		return scenario('shape-a', shapeA, pack('skew-version-b', 'toy_addon_b', 'toy_addon_b', 'sittir_engine'));
	}
);
cargo([]);

writeFileSync(join(out, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
