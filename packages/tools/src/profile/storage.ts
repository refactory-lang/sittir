import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { cpus, release } from 'node:os';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { stableGrammars, type GrammarName } from '@sittir/codegen/grammars';
import { nativePhases, type HydrationDepth } from './native-hydration.ts';
import type { NativeHydrationOptions, NativeHydrationRun } from './native-hydration-worker.ts';

const execute = promisify(execFile);
export interface StorageBenchOptions {
	grammars?: readonly string[];
	rounds?: number;
	warmup?: number;
	iterations?: number;
	limit?: number;
	nativeDepth?: HydrationDepth;
	idleGate?: string;
	output?: string;
}

export function median(values: readonly number[]): number {
	if (!values.length) throw new Error('cannot summarize an empty sample');
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function retainedMemory(rows: readonly { baseline: NodeJS.MemoryUsage; current: NodeJS.MemoryUsage }[]) {
	return Object.fromEntries(
		(['heapUsed', 'heapTotal', 'external', 'arrayBuffers', 'rss'] as const).map((field) => [
			field,
			median(rows.map((row) => row.current[field] - row.baseline[field]))
		])
	);
}

export function summarizeNativeHydration(samples: readonly NativeHydrationRun[]) {
	return [...new Set(samples.map(({ grammar }) => grammar))].map((grammar) => {
		const rows = samples.filter((sample) => sample.grammar === grammar);
		const first = rows[0]!;
		const fingerprint = (row: NativeHydrationRun) =>
			JSON.stringify([
				row.depth,
				row.corpus,
				row.entries,
				row.rootsWithRecord,
				row.render,
				row.refused.map(({ entry, stage }) => [entry, stage])
			]);
		for (const row of rows)
			if (fingerprint(row) !== fingerprint(first)) throw new Error(`native hydration workload mismatch for ${grammar}`);
		const timings = nativePhases.map((phase) => {
			const rounds = rows.map((row) => median(row.timings[phase]));
			const milliseconds = median(rounds);
			return {
				phase,
				milliseconds,
				range: [Math.min(...rounds), Math.max(...rounds)],
				nsPerEntry: first.entries ? (milliseconds * 1e6) / first.entries : null
			};
		});
		return {
			grammar,
			depth: first.depth,
			corpus: first.corpus,
			entries: first.entries,
			rootsWithRecord: first.rootsWithRecord,
			refused: first.refused,
			render: first.render,
			timings,
			memoryBytes: retainedMemory(rows.map((row) => ({ baseline: row.memory.baseline, current: row.memory.native })))
		};
	});
}

async function runWorker(
	args: NativeHydrationOptions,
	round: number,
	idleGate?: string
): Promise<NativeHydrationRun & { round: number; idle: string | null }> {
	const idle = idleGate ? (await execute('bash', [idleGate, process.cwd()], { timeout: 120_000 })).stdout.trim() : null;
	process.stderr.write(`bench-storage: ${args.grammar} round ${round + 1} native\n`);
	const extension = import.meta.url.endsWith('.ts') ? 'ts' : 'js';
	const worker = new URL(`./native-hydration-worker.${extension}`, import.meta.url);
	const { stdout } = await execute(
		process.execPath,
		['--expose-gc', '--import', 'tsx', fileURLToPath(worker), JSON.stringify(args)],
		{ maxBuffer: 8 * 1024 * 1024, timeout: 300_000, env: { ...process.env, NODE_ENV: 'production' } }
	);
	return { ...JSON.parse(stdout), round, idle };
}

function integer(name: string, value: number, minimum: number): number {
	if (!Number.isSafeInteger(value) || value < minimum) throw new Error(`${name} must be an integer >= ${minimum}`);
	return value;
}

export async function run(options: StorageBenchOptions): Promise<number> {
	const rounds = integer('rounds', options.rounds ?? 5, 1);
	const warmup = integer('warmup', options.warmup ?? 2, 0);
	const iterations = integer('iterations', options.iterations ?? 3, 1);
	if (options.limit !== undefined) integer('limit', options.limit, 1);
	const nativeDepth = options.nativeDepth ?? 'all';
	if (nativeDepth !== 'all') {
		integer('native-depth', nativeDepth, 1);
		if (nativeDepth > 0xffffffff) throw new Error('native-depth exceeds the native depth range');
	}
	const grammars: GrammarName[] = [];
	for (const name of options.grammars?.length ? options.grammars : stableGrammars()) {
		const grammar = stableGrammars().find((known) => known === name);
		if (!grammar) throw new Error(`unknown grammar: ${name}`);
		if (!grammars.includes(grammar)) grammars.push(grammar);
	}
	const nativeSamples: (NativeHydrationRun & { round: number; idle: string | null })[] = [];
	const startedAt = new Date().toISOString();
	for (const grammar of grammars) {
		for (let round = 0; round < rounds; round++) {
			nativeSamples.push(
				await runWorker(
					{ grammar, depth: nativeDepth, warmup, iterations, limit: options.limit },
					round,
					options.idleGate
				)
			);
		}
	}
	const nativeSummary = summarizeNativeHydration(nativeSamples);
	const extension = import.meta.url.endsWith('.ts') ? 'ts' : 'js';
	const harness = createHash('sha256').update(await readFile(fileURLToPath(import.meta.url)));
	for (const file of ['storage-common', 'native-hydration-worker', 'native-hydration'])
		harness.update(await readFile(new URL(`./${file}.${extension}`, import.meta.url)));
	const report = {
		schemaVersion: 3,
		mode: 'native-hydration',
		startedAt,
		finishedAt: new Date().toISOString(),
		environment: {
			node: process.version,
			platform: process.platform,
			arch: process.arch,
			os: release(),
			cpu: cpus()[0]?.model,
			cpuCount: cpus().length,
			cwd: process.cwd(),
			nodeEnv: 'production',
			idleGated: Boolean(options.idleGate),
			harnessSha256: harness.digest('hex')
		},
		options: {
			grammars,
			rounds,
			warmup,
			iterations,
			limit: options.limit ?? null,
			nativeDepth
		},
		nativeSummary,
		nativeSamples
	};
	const json = `${JSON.stringify(report, null, 2)}\n`;
	if (options.output) await writeFile(options.output, json);
	else process.stdout.write(json);
	if (nativeSummary.length) process.stderr.write('\ngrammar\tphase\tnative ms\n');
	for (const row of nativeSummary)
		for (const timing of row.timings)
			process.stderr.write(`${row.grammar}\tnative-${timing.phase}\t${timing.milliseconds.toFixed(3)}\n`);
	return 0;
}
