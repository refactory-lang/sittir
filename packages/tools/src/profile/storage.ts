import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { cpus, release } from 'node:os';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { stableGrammars, type GrammarName } from '@sittir/codegen/grammars';
import { nativePhases, type HydrationDepth } from './native-hydration.ts';
import type { NativeHydrationOptions, NativeHydrationRun } from './native-hydration-worker.ts';
import { STORAGE_PHASES, type StorageMode, type StorageSample, type StorageWorkerOptions } from './storage-worker.ts';

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

export function validatePair(object: StorageSample, arena: StorageSample): void {
	const fingerprint = (sample: StorageSample) =>
		JSON.stringify({
			grammar: sample.grammar,
			corpus: sample.corpus,
			walk: sample.walk,
			work: sample.timings.map(({ phase, work }) => [phase, work]),
			render: {
				entries: sample.render.entries,
				sha256: sample.render.sha256,
				refused: sample.render.refused.map(({ entry }) => entry)
			}
		});
	if (fingerprint(object) !== fingerprint(arena))
		throw new Error(`object/arena workload mismatch for ${object.grammar}`);
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

export function summarize(samples: readonly StorageSample[]) {
	return [...new Set(samples.map(({ grammar }) => grammar))].map((grammar) => {
		const group = samples.filter((sample) => sample.grammar === grammar);
		for (const sample of group) validatePair(group[0]!, sample);
		const timings = STORAGE_PHASES.map((phase) => {
			const values = (storage: StorageMode) =>
				group
					.filter((sample) => sample.storage === storage)
					.flatMap((sample) =>
						sample.timings.filter((timing) => timing.phase === phase).map((timing) => median(timing.milliseconds))
					);
			const object = values('object');
			const arena = values('arena');
			const objectMs = median(object);
			const arenaMs = median(arena);
			const work = group[0]!.timings.find((timing) => timing.phase === phase)!.work;
			return {
				phase,
				work,
				unit: phase === 'parse-read' ? 'entry' : phase === 'render' ? 'rendered-root' : 'node',
				objectMs,
				arenaMs,
				objectNsPerUnit: work ? (objectMs * 1e6) / work : null,
				arenaNsPerUnit: work ? (arenaMs * 1e6) / work : null,
				arenaOverObject: work && objectMs ? arenaMs / objectMs : null,
				objectRange: [Math.min(...object), Math.max(...object)],
				arenaRange: [Math.min(...arena), Math.max(...arena)]
			};
		});
		const memory = (['object', 'arena'] as const).map((storage) => {
			const rows = group.filter((sample) => sample.storage === storage);
			const retained = (state: 'structure' | 'text') =>
				retainedMemory(rows.map((sample) => ({ baseline: sample.memory.baseline, current: sample.memory[state] })));
			return { storage, nodes: rows[0]!.nodes, structureBytes: retained('structure'), textBytes: retained('text') };
		});
		return { grammar, corpus: group[0]!.corpus, timings, memory, refused: group[0]!.render.refused };
	});
}

async function runWorker<T>(
	mode: StorageMode | 'native',
	args: StorageWorkerOptions | NativeHydrationOptions,
	round: number,
	idleGate?: string
): Promise<T & { round: number; idle: string | null }> {
	const idle = idleGate ? (await execute('bash', [idleGate, process.cwd()], { timeout: 120_000 })).stdout.trim() : null;
	process.stderr.write(`bench-storage: ${args.grammar} round ${round + 1} ${mode}\n`);
	const extension = import.meta.url.endsWith('.ts') ? 'ts' : 'js';
	const worker = new URL(
		`./${mode === 'native' ? 'native-hydration' : 'storage'}-worker.${extension}`,
		import.meta.url
	);
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
	if (options.nativeDepth !== undefined && options.nativeDepth !== 'all') {
		integer('native-depth', options.nativeDepth, 1);
		if (options.nativeDepth > 0xffffffff) throw new Error('native-depth exceeds the native depth range');
	}
	const grammars: GrammarName[] = [];
	for (const name of options.grammars?.length ? options.grammars : stableGrammars()) {
		const grammar = stableGrammars().find((known) => known === name);
		if (!grammar) throw new Error(`unknown grammar: ${name}`);
		if (!grammars.includes(grammar)) grammars.push(grammar);
	}
	const samples: (StorageSample & { round: number; idle: string | null })[] = [];
	const nativeSamples: (NativeHydrationRun & { round: number; idle: string | null })[] = [];
	const startedAt = new Date().toISOString();
	for (const grammar of grammars) {
		for (let round = 0; round < rounds; round++) {
			if (options.nativeDepth !== undefined) {
				nativeSamples.push(
					await runWorker<NativeHydrationRun>(
						'native',
						{ grammar, depth: options.nativeDepth, warmup, iterations, limit: options.limit },
						round,
						options.idleGate
					)
				);
				continue;
			}
			const order: StorageMode[] = round % 2 === 0 ? ['object', 'arena'] : ['arena', 'object'];
			for (const storage of order) {
				const args: StorageWorkerOptions = { grammar, storage, warmup, iterations, limit: options.limit };
				samples.push(await runWorker<StorageSample>(storage, args, round, options.idleGate));
			}
			const pair = samples.slice(-2);
			validatePair(
				pair.find((sample) => sample.storage === 'object')!,
				pair.find((sample) => sample.storage === 'arena')!
			);
		}
	}
	const summary = summarize(samples);
	const nativeSummary = summarizeNativeHydration(nativeSamples);
	const extension = import.meta.url.endsWith('.ts') ? 'ts' : 'js';
	const harness = createHash('sha256').update(await readFile(fileURLToPath(import.meta.url)));
	for (const file of ['storage-worker', 'storage-common', 'native-hydration-worker', 'native-hydration'])
		harness.update(await readFile(new URL(`./${file}.${extension}`, import.meta.url)));
	const report = {
		schemaVersion: 2,
		mode: options.nativeDepth === undefined ? 'object-arena' : 'native-hydration',
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
			nativeDepth: options.nativeDepth ?? null
		},
		summary,
		samples,
		nativeSummary,
		nativeSamples
	};
	const json = `${JSON.stringify(report, null, 2)}\n`;
	if (options.output) await writeFile(options.output, json);
	else process.stdout.write(json);
	if (summary.length) process.stderr.write('\ngrammar\tphase\tobject ms\tarena ms\tarena/object\n');
	for (const row of summary)
		for (const timing of row.timings)
			process.stderr.write(
				`${row.grammar}\t${timing.phase}\t${timing.objectMs.toFixed(3)}\t${timing.arenaMs.toFixed(3)}\t${timing.arenaOverObject?.toFixed(3) ?? 'n/a'}\n`
			);
	if (nativeSummary.length) process.stderr.write('\ngrammar\tphase\tnative ms\n');
	for (const row of nativeSummary)
		for (const timing of row.timings)
			process.stderr.write(`${row.grammar}\tnative-${timing.phase}\t${timing.milliseconds.toFixed(3)}\n`);
	return 0;
}
