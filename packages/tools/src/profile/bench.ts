/**
 * bench.ts — native render benchmark.
 *
 * For each stable grammar two workloads are timed over
 * N iterations through the grammar's own engine:
 *   - coordinate: every corpus fixture parsed and read, rendered as read.
 *     Nothing under the root was rebuilt, so it folds to one coordinate and
 *     the render slices the source. Only the engine that read a node can
 *     resolve its coordinates, so the read and the render share an engine.
 *   - transport: the grammar's parity render fixtures (`test-fixtures.json`),
 *     the self-contained inputs the validator captured and proved to render
 *     standalone, so every node crosses as a transport and the render
 *     rebuilds it from its template.
 * Reports total time, renders/sec, mean, min, max and memory deltas per
 * grammar and workload (heapUsed, heapTotal, rss around the timed loop,
 * after a GC cycle when --expose-gc is available).
 *
 * A render that throws fails the benchmark: a count that included failures
 * would measure exception throughput.
 *
 * Benchmarks default `NODE_ENV` to `production` when it is unset so native
 * boundary assertions stay out of timing / memory measurements. An explicit
 * `NODE_ENV` is respected.
 */

import { stableGrammars, type GrammarName } from '@sittir/codegen/grammars';
import { readFileSync } from 'node:fs';
import type { AnyNodeData } from '@sittir/types';
import type { SittirEngine } from '@sittir/common/engine';
import { loadCorpusEntries } from '../validate/common.ts';
import { fixturesOutputPath, type ParityFixture } from '../validate/parity-fixtures.ts';


const WORKLOADS = ['coordinate', 'transport'] as const;
type Workload = (typeof WORKLOADS)[number];

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
	grammar: GrammarName;
	backend: 'native';
	workload: Workload;
	iterations: number;
	totalRenders: number;
	totalMs: number;
	rendersPerSec: number;
	meanMs: number;
	minMs: number;
	maxMs: number;
	nodeCount: number;
	/** Memory utilization metrics (undefined when totalRenders === 0) */
	memory?: MemoryDelta;
}

// No CLI options — bench is driven by environment variables:
//   BENCH_ITERATIONS: number of iterations per grammar (default: 100)
//   NODE_ENV: 'production' | 'development' (default: 'production')
export interface BenchOptions {
	// intentionally empty
}

async function loadEngine(grammar: GrammarName): Promise<SittirEngine> {
	const { createEngine } = (await import(`@sittir/${grammar}`)) as { createEngine(): SittirEngine };
	return createEngine();
}

/** The nodes a workload renders: one read root per corpus fixture, or every parity render fixture's input. */
function collectNodeData(grammar: GrammarName, engine: SittirEngine, workload: Workload): AnyNodeData[] {
	if (workload === 'coordinate') {
		return loadCorpusEntries(grammar).map((entry) => engine.diagnostics.parseAndRead(entry.source).root);
	}
	const fixtures = JSON.parse(readFileSync(fixturesOutputPath(grammar), 'utf8')) as ParityFixture[];
	return fixtures.flatMap((fixture) => (fixture.kind === 'render' ? [fixture.input as AnyNodeData] : []));
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
	renderFn: (node: AnyNodeData) => string,
	iterations: number
): Omit<BenchResult, 'grammar' | 'backend' | 'workload'> {
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
		for (const node of nodes) renderFn(node);
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
			renderFn(node);
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

async function benchGrammar(grammar: GrammarName): Promise<BenchResult[]> {
	const results: BenchResult[] = [];

	process.stderr.write(`[bench] ${grammar}: loading native engine...\n`);
	const engine = await loadEngine(grammar);
	const render = (node: AnyNodeData): string => engine.render(node).toString();

	for (const workload of WORKLOADS) {
		process.stderr.write(`[bench] ${grammar}/${workload}: collecting corpus nodes...\n`);
		const nodes = collectNodeData(grammar, engine, workload);
		process.stderr.write(`[bench] ${grammar}/${workload}: ${nodes.length} nodes from corpus\n`);
		if (nodes.length === 0) {
			process.stderr.write(`[bench] ${grammar}/${workload}: no nodes — skipping\n`);
			continue;
		}
		process.stderr.write(`[bench] ${grammar}/${workload}: native path (N=${N})...\n`);
		results.push({ grammar, backend: 'native', workload, ...runBench(nodes, render, N) });
	}

	engine.dispose();
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
		'workload',
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
		r.workload,
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

export async function run(_opts: BenchOptions): Promise<number> {
	ensureBenchmarkNodeEnv();
	const gcAvailable = typeof (global as { gc?: unknown }).gc === 'function';
	process.stderr.write(`bench-render: N=${N} iterations per grammar and workload\n`);
	process.stderr.write(`bench-render: warmup=${WARMUP_ITERATIONS}\n`);
	process.stderr.write(`bench-render: NODE_ENV=${process.env.NODE_ENV}\n`);
	process.stderr.write(
		`bench-render: gc=${gcAvailable ? 'available (--expose-gc)' : 'unavailable — pass node --expose-gc for cleaner memory snapshots'}\n\n`
	);

	const allResults: BenchResult[] = [];
	for (const grammar of stableGrammars()) {
		const results = await benchGrammar(grammar);
		allResults.push(...results);
	}

	process.stdout.write(`${JSON.stringify(allResults, null, 2)}\n`);

	process.stderr.write('\n=== Render Benchmark Results ===\n\n');
	process.stderr.write(`${formatTable(allResults)}\n`);
	return 0;
}
