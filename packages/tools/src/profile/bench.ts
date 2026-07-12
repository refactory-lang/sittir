/**
 * bench.ts — render benchmark comparing native (Askama) vs JS (Nunjucks).
 *
 * For each grammar (rust, typescript, python):
 *   1. Parses all corpus fixtures with the override-compiled (or base) WASM parser.
 *   2. Calls readNode() on each parsed tree to produce NodeData.
 *   3. Times N iterations of render(nodeData) through the JS/Nunjucks path.
 *   4. Times N iterations of render(nodeData) through the native/Askama path
 *      (skipped gracefully when the native binary is not compiled).
 *   5. Reports total time, renders/sec, mean, min, max per (grammar, backend) pair.
 *      Memory deltas (heapUsed, heapTotal, rss) and approximate heap per render
 *      are captured around the timed loop (after a GC cycle when --expose-gc is
 *      available) and included in both JSON output and the stderr table.
 *
 * Benchmarks default `NODE_ENV` to `production` when it is unset so native
 * boundary assertions stay out of timing / memory measurements. An explicit
 * `NODE_ENV` is respected.
 */

import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

import type { AnyNodeData } from '@sittir/types';
import type { TSTree } from '../validate/common.ts';

const GRAMMARS = ['rust', 'typescript', 'python'] as const;
type Grammar = (typeof GRAMMARS)[number];

const N = (() => {
	const env = process.env['BENCH_ITERATIONS'];
	if (env) {
		const n = parseInt(env, 10);
		if (!isNaN(n) && n > 0) return n;
	}
	return 100;
})();

const WARMUP_ITERATIONS = 1;

function ensureBenchmarkNodeEnv(): void {
	process.env.NODE_ENV ??= 'production';
}

type BenchmarkRuntime = {
	readNode: typeof import('@sittir/common').readNode;
	createRenderer: typeof import('@sittir/legacy-core').createRenderer;
	loadCorpusEntries: typeof import('../validate/common.ts').loadCorpusEntries;
	loadLanguageForGrammar: typeof import('../validate/common.ts').loadLanguageForGrammar;
	loadKindNames: typeof import('../validate/common.ts').loadKindNames;
	loadKindIdFromName: typeof import('../validate/common.ts').loadKindIdFromName;
	treeHandle: typeof import('../validate/common.ts').treeHandle;
};

let benchmarkRuntimePromise: Promise<BenchmarkRuntime> | undefined;

async function loadBenchmarkRuntime(): Promise<BenchmarkRuntime> {
	ensureBenchmarkNodeEnv();
	benchmarkRuntimePromise ??= Promise.all([
		import('@sittir/common'),
		import('@sittir/legacy-core'),
		import('../validate/common.ts')
	]).then(([common, core, validate]) => ({
		readNode: common.readNode,
		createRenderer: core.createRenderer,
		loadCorpusEntries: validate.loadCorpusEntries,
		loadLanguageForGrammar: validate.loadLanguageForGrammar,
		loadKindNames: validate.loadKindNames,
		loadKindIdFromName: validate.loadKindIdFromName,
		treeHandle: validate.treeHandle
	}));
	return benchmarkRuntimePromise;
}

const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url)).replace(/\/$/, '');
const requireFromHere = createRequire(import.meta.url);
void requireFromHere;

function templatesPathFor(grammar: Grammar): string {
	return resolve(repoRoot, `packages/${grammar}/templates`);
}

function boundaryPathFor(grammar: Grammar): string {
	return pathToFileURL(resolve(repoRoot, `packages/${grammar}/src/boundary.ts`)).href;
}

export interface MemoryDelta {
	/** Delta in heapUsed (bytes) */
	heapUsedDelta: number;
	/** Delta in heapTotal (bytes) */
	heapTotalDelta: number;
	/** Delta in rss (bytes) */
	rssDelta: number;
	/** Approximate heap bytes allocated per render call */
	heapPerRender: number;
}

export interface BenchResult {
	grammar: Grammar;
	backend: 'js' | 'native';
	iterations: number;
	/** Total number of render calls (iterations × nodes) */
	totalRenders: number;
	/** Total wall time in milliseconds */
	totalMs: number;
	/** Renders per second */
	rendersPerSec: number;
	/** Mean time per render in ms */
	meanMs: number;
	/** Min time for a single render in ms */
	minMs: number;
	/** Max time for a single render in ms */
	maxMs: number;
	/** Number of corpus nodes sampled */
	nodeCount: number;
	/** Memory utilization metrics (undefined when totalRenders === 0) */
	memory?: MemoryDelta;
}

// No CLI options — bench is driven by environment variables:
//   BENCH_ITERATIONS: number of iterations per backend per grammar (default: 100)
//   NODE_ENV: 'production' | 'development' (default: 'production')
export interface BenchOptions {
	// intentionally empty
}

async function collectNodeData(grammar: Grammar): Promise<AnyNodeData[]> {
	const { readNode, loadCorpusEntries, loadLanguageForGrammar, loadKindIdFromName, treeHandle } =
		await loadBenchmarkRuntime();
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);

	const entries = loadCorpusEntries(grammar);
	const kindIdFromName = await loadKindIdFromName(grammar);

	const safeKindIdFromName = kindIdFromName
		? (name: string): number | undefined => {
				try {
					return kindIdFromName(name);
				} catch {
					return undefined;
				}
			}
		: undefined;

	const nodes: AnyNodeData[] = [];
	for (const entry of entries) {
		let tree: TSTree;
		try {
			tree = parser.parse(entry.source) as TSTree;
		} catch {
			continue;
		}
		if (tree.rootNode.hasError) continue;

		const handle = treeHandle(tree as Parameters<typeof treeHandle>[0], entry.source, safeKindIdFromName);
		try {
			nodes.push(readNode(handle));
		} catch {
			// Skip any readNode failures — we only benchmark nodes we can read.
		}
	}
	return nodes;
}

async function loadNativeRender(grammar: Grammar): Promise<((node: unknown) => string) | null> {
	ensureBenchmarkNodeEnv();
	const path = boundaryPathFor(grammar);
	try {
		const mod = await import(path);
		const render = (mod as { render?: unknown }).render;
		if (typeof render !== 'function') return null;
		return render as (node: unknown) => string;
	} catch {
		return null;
	}
}

function hrNow(): bigint {
	return process.hrtime.bigint();
}

function bigintToMs(ns: bigint): number {
	return Number(ns) / 1_000_000;
}

function tryGc(): void {
	(global as { gc?: () => void }).gc?.();
}

function captureMemory(): NodeJS.MemoryUsage {
	return process.memoryUsage();
}

function memoryDelta(before: NodeJS.MemoryUsage, after: NodeJS.MemoryUsage, totalRenders: number): MemoryDelta {
	const heapUsedDelta = after.heapUsed - before.heapUsed;
	const heapTotalDelta = after.heapTotal - before.heapTotal;
	const rssDelta = after.rss - before.rss;
	const heapPerRender = totalRenders > 0 ? heapUsedDelta / totalRenders : 0;
	return { heapUsedDelta, heapTotalDelta, rssDelta, heapPerRender };
}

function runBench(
	nodes: AnyNodeData[],
	renderFn: (node: unknown) => string,
	iterations: number
): Omit<BenchResult, 'grammar' | 'backend'> {
	if (nodes.length === 0) {
		return {
			iterations,
			totalRenders: 0,
			totalMs: 0,
			rendersPerSec: 0,
			meanMs: 0,
			minMs: 0,
			maxMs: 0,
			nodeCount: 0
		};
	}

	for (let i = 0; i < WARMUP_ITERATIONS; i++) {
		for (const node of nodes) {
			try {
				renderFn(node);
			} catch {
				// Ignore render failures in warmup
			}
		}
	}

	tryGc();
	const memBefore = captureMemory();

	let totalNs = 0n;
	let minNs = BigInt(Number.MAX_SAFE_INTEGER);
	let maxNs = 0n;
	let totalRenders = 0;

	for (let i = 0; i < iterations; i++) {
		for (const node of nodes) {
			const t0 = hrNow();
			try {
				renderFn(node);
			} catch {
				// Skip render failures — they're counted in totalRenders so
				// throughput reflects the real workload size.
			}
			const dt = hrNow() - t0;
			totalNs += dt;
			if (dt < minNs) minNs = dt;
			if (dt > maxNs) maxNs = dt;
			totalRenders++;
		}
	}

	const memAfter = captureMemory();
	const memory = memoryDelta(memBefore, memAfter, totalRenders);

	const totalMs = bigintToMs(totalNs);
	const rendersPerSec = totalMs > 0 ? Math.round((totalRenders / totalMs) * 1000) : 0;
	const meanMs = totalRenders > 0 ? totalMs / totalRenders : 0;

	return {
		iterations,
		totalRenders,
		totalMs,
		rendersPerSec,
		meanMs,
		minMs: bigintToMs(minNs === BigInt(Number.MAX_SAFE_INTEGER) ? 0n : minNs),
		maxMs: bigintToMs(maxNs),
		nodeCount: nodes.length,
		memory
	};
}

async function benchGrammar(grammar: Grammar): Promise<BenchResult[]> {
	const { createRenderer, loadKindNames } = await loadBenchmarkRuntime();
	const results: BenchResult[] = [];

	process.stderr.write(`[bench] ${grammar}: collecting corpus nodes...\n`);
	const nodes = await collectNodeData(grammar);
	process.stderr.write(`[bench] ${grammar}: ${nodes.length} nodes from corpus\n`);

	if (nodes.length === 0) {
		process.stderr.write(`[bench] ${grammar}: no nodes — skipping\n`);
		return results;
	}

	process.stderr.write(`[bench] ${grammar}: JS path (N=${N})...\n`);
	const kindNames = await loadKindNames(grammar);
	const jsRenderer = createRenderer(templatesPathFor(grammar), { kindNames });
	const jsStats = runBench(nodes, (node) => jsRenderer.render(node as AnyNodeData), N);
	results.push({ grammar, backend: 'js', ...jsStats });

	process.stderr.write(`[bench] ${grammar}: loading native backend...\n`);
	const nativeRender = await loadNativeRender(grammar);
	if (nativeRender === null) {
		process.stderr.write(`[bench] ${grammar}: native backend not available — skipping\n`);
	} else {
		process.stderr.write(`[bench] ${grammar}: native path (N=${N})...\n`);
		const nativeStats = runBench(nodes, nativeRender, N);
		results.push({ grammar, backend: 'native', ...nativeStats });
	}

	return results;
}

function fmtBytes(bytes: number): string {
	const abs = Math.abs(bytes);
	const sign = bytes < 0 ? '-' : '+';
	if (abs < 1024) return `${sign}${abs.toFixed(0)}B`;
	if (abs < 1024 * 1024) return `${sign}${(abs / 1024).toFixed(1)}KB`;
	return `${sign}${(abs / (1024 * 1024)).toFixed(2)}MB`;
}

function formatTable(results: BenchResult[]): string {
	const cols = [
		'grammar',
		'backend',
		'nodes',
		'iterations',
		'totalRenders',
		'totalMs',
		'renders/sec',
		'mean ms',
		'min ms',
		'max ms',
		'heapUsed Δ',
		'heap/render',
		'rss Δ'
	];
	const rows: string[][] = results.map((r) => [
		r.grammar,
		r.backend,
		r.nodeCount.toString(),
		r.iterations.toString(),
		r.totalRenders.toString(),
		r.totalMs.toFixed(1),
		r.rendersPerSec.toString(),
		r.meanMs.toFixed(4),
		r.minMs.toFixed(4),
		r.maxMs.toFixed(2),
		r.memory != null ? fmtBytes(r.memory.heapUsedDelta) : 'n/a',
		r.memory != null ? fmtBytes(r.memory.heapPerRender) : 'n/a',
		r.memory != null ? fmtBytes(r.memory.rssDelta) : 'n/a'
	]);
	const widths = cols.map((c, i) => Math.max(c.length, ...rows.map((r) => (r[i] ?? '').length)));
	const line = widths.map((w) => '-'.repeat(w)).join('-+-');
	const header = cols.map((c, i) => c.padStart(widths[i]!)).join(' | ');
	const body = rows.map((r) => r.map((v, i) => v.padStart(widths[i]!)).join(' | ')).join('\n');
	return `${header}\n${line}\n${body}`;
}

function formatSpeedupColumn(results: BenchResult[]): string {
	const lines: string[] = [];
	for (const grammar of GRAMMARS) {
		const js = results.find((r) => r.grammar === grammar && r.backend === 'js');
		const native = results.find((r) => r.grammar === grammar && r.backend === 'native');
		if (js && native && js.meanMs > 0) {
			const speedup = js.meanMs / native.meanMs;
			lines.push(`  ${grammar}: native is ${speedup.toFixed(2)}x ${speedup >= 1 ? 'faster' : 'slower'} than JS`);
		}
	}
	return lines.join('\n');
}

export async function run(_opts: BenchOptions): Promise<number> {
	ensureBenchmarkNodeEnv();
	const gcAvailable = typeof (global as { gc?: unknown }).gc === 'function';
	process.stderr.write(`bench-render: N=${N} iterations per backend per grammar\n`);
	process.stderr.write(`bench-render: warmup=${WARMUP_ITERATIONS}\n`);
	process.stderr.write(`bench-render: NODE_ENV=${process.env.NODE_ENV}\n`);
	process.stderr.write(
		`bench-render: gc=${gcAvailable ? 'available (--expose-gc)' : 'unavailable — pass node --expose-gc for cleaner memory snapshots'}\n\n`
	);

	const allResults: BenchResult[] = [];
	for (const grammar of GRAMMARS) {
		const results = await benchGrammar(grammar);
		allResults.push(...results);
	}

	process.stdout.write(`${JSON.stringify(allResults, null, 2)}\n`);

	process.stderr.write('\n=== Render Benchmark Results ===\n\n');
	process.stderr.write(`${formatTable(allResults)}\n`);

	const speedup = formatSpeedupColumn(allResults);
	if (speedup) {
		process.stderr.write('\n=== Speedup (mean time per render) ===\n');
		process.stderr.write(`${speedup}\n`);
	}
	return 0;
}
