import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { cpus, release } from 'node:os';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { stableGrammars, type GrammarName } from '@sittir/codegen/grammars';
import { nativePhases, type HydrationDepth } from './native-hydration.ts';
import type { NativeHydrationOptions, NativeHydrationRun } from './native-hydration-worker.ts';
import { median } from './storage-common.ts';
import { summarizeValidationStorage, type ValidationStorageRun } from './validation-storage.ts';
import type { ValidationStorageOptions } from './validation-storage-worker.ts';
import type { Construction } from '../validate/common.ts';
export { median } from './storage-common.ts';

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
	validation?: boolean;
	construction?: Construction;
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

async function runWorker<T>(
	workerName: 'native-hydration' | 'validation-storage',
	args: NativeHydrationOptions | ValidationStorageOptions,
	round: number,
	idleGate?: string
): Promise<T & { round: number; idle: string | null }> {
	const idle = idleGate ? (await execute('bash', [idleGate, process.cwd()], { timeout: 120_000 })).stdout.trim() : null;
	process.stderr.write(
		`bench-storage: ${args.grammar} round ${round + 1} ${'storage' in args ? args.storage : 'native'}\n`
	);
	const extension = import.meta.url.endsWith('.ts') ? 'ts' : 'js';
	const worker = new URL(`./${workerName}-worker.${extension}`, import.meta.url);
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
	const construction = options.construction ?? 'objects';
	if (!options.validation && construction !== 'objects')
		throw new Error('--construction applies only to validation profiles, whose arena arm it builds with');
	if (options.validation && (options.limit !== undefined || nativeDepth !== 'all'))
		throw new Error(
			'validation profiles use the complete deep corpus; --limit and finite --native-depth apply only to native hydration'
		);
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
	const validationSamples: (ValidationStorageRun & { round: number; idle: string | null })[] = [];
	const startedAt = new Date().toISOString();
	for (const grammar of grammars) {
		for (let round = 0; round < rounds; round++) {
			if (options.validation) {
				const order = round % 2 === 0 ? (['object', 'arena'] as const) : (['arena', 'object'] as const);
				for (const storage of order)
					validationSamples.push(
						await runWorker<ValidationStorageRun>(
							'validation-storage',
							{ grammar, storage, construction: storage === 'arena' ? construction : 'objects', warmup, iterations },
							round,
							options.idleGate
						)
					);
				summarizeValidationStorage(validationSamples);
				continue;
			}
			nativeSamples.push(
				await runWorker<NativeHydrationRun>(
					'native-hydration',
					{ grammar, depth: nativeDepth, warmup, iterations, limit: options.limit },
					round,
					options.idleGate
				)
			);
		}
	}
	const nativeSummary = summarizeNativeHydration(nativeSamples);
	const validationSummary = summarizeValidationStorage(validationSamples);
	const extension = import.meta.url.endsWith('.ts') ? 'ts' : 'js';
	const harness = createHash('sha256').update(await readFile(fileURLToPath(import.meta.url)));
	const harnessFiles = options.validation
		? [
				'storage-common',
				'validation-storage-worker',
				'validation-storage',
				'../validate/roundtrip-profile',
				'../validate/read-render-parse',
				'../validate/factory-storage',
				'../validate/common'
			]
		: ['storage-common', 'native-hydration-worker', 'native-hydration'];
	for (const file of harnessFiles) harness.update(await readFile(new URL(`./${file}.${extension}`, import.meta.url)));
	const report = {
		schemaVersion: options.validation ? 4 : 3,
		mode: options.validation ? 'validation-storage' : 'native-hydration',
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
			nativeDepth,
			construction
		},
		...(options.validation ? { validationSummary, validationSamples } : { nativeSummary, nativeSamples })
	};
	const json = `${JSON.stringify(report, null, 2)}\n`;
	if (options.output) await writeFile(options.output, json);
	else process.stdout.write(json);
	if (nativeSummary.length) process.stderr.write('\ngrammar\tphase\tnative ms\n');
	for (const row of nativeSummary)
		for (const timing of row.timings)
			process.stderr.write(`${row.grammar}\tnative-${timing.phase}\t${timing.milliseconds.toFixed(3)}\n`);
	if (validationSummary.length) process.stderr.write('\ngrammar\tbucket\tphase\tobject ms\tarena ms\tarena/object\n');
	for (const row of validationSummary)
		for (const timing of row.timings)
			process.stderr.write(
				`${row.grammar}\t${row.bucket}\t${timing.phase}\t${timing.objectMs.toFixed(3)}\t${timing.arenaMs.toFixed(3)}\t${timing.arenaOverObject?.toFixed(3) ?? 'n/a'}\n`
			);
	return 0;
}
