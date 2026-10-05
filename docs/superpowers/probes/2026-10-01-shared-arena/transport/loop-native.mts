/**
 * Loop one native call for a fixed wall time so macOS `sample` can attribute it.
 * Same modes as ../2026-10-01/loop-deep-read.mts, adapted to the current loader and `toTransportData(node, view)`.
 *
 *   SITTIR_ROOT=<checkout> pnpm exec tsx <this file> <grammar> <source file> <deep-read|render-fixtures> <seconds> &
 *   sample <node pid> 6 1 -file out.txt
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const REPO = process.env.SITTIR_ROOT ?? process.cwd();
const [grammar = 'rust', sourcePath = `${REPO}/rust/crates/sittir-core/src/engine.rs`, mode = 'deep-read', seconds = '12'] =
	process.argv.slice(2);
const req = createRequire(import.meta.url);
const native = req(`${REPO}/packages/${grammar}/native/index.cjs`);
const raw = new native.SittirEngine();
const source = readFileSync(sourcePath, 'utf8');
const live = JSON.parse(raw.parseAndRead(source)).treeId as number;

const until = Date.now() + Number(seconds) * 1000;
let n = 0;
if (mode === 'deep-read') {
	while (Date.now() < until) {
		raw.readRoot(live, Infinity);
		n++;
	}
} else if (mode === 'render-fixtures') {
	const fixtures = JSON.parse(readFileSync(`${REPO}/rust/crates/sittir-${grammar}/test-fixtures.json`, 'utf8')) as {
		kind: string;
		input: unknown;
	}[];
	const { toTransportData, STORED_TRIVIA } = await import(`${REPO}/packages/common/src/transport-data.ts`);
	const transports = fixtures.filter((f) => f.kind === 'render').map((f) => toTransportData(f.input, STORED_TRIVIA));
	while (Date.now() < until) {
		for (const t of transports) raw.render(t);
		n += transports.length;
	}
}
console.log(`${mode}: ${n} calls`);
