import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { cpus, release } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { REPO_ROOT, stableGrammars, type GrammarName } from '@sittir/codegen/grammars';
import type { NodeStorage } from '@sittir/types';
import { hostInstallSize, inTree } from '../native-pack.ts';
import type { LibraryMemoryOptions, LibraryMemoryRun } from './library-memory-worker.ts';
import { nativePhases, type HydrationDepth } from './native-hydration.ts';
import type { NativeHydrationOptions, NativeHydrationRun } from './native-hydration-worker.ts';
import { measureBuilt } from '../built.ts';
import { median } from './storage-common.ts';
import { summarizeValidationStorage, type ValidationStorageRun } from './validation-storage.ts';
import type { ValidationStorageOptions } from './validation-storage-worker.ts';
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
	baseline?: string;
}

export type Revision = 'branch' | 'baseline';

export type RoundWorker =
	| { readonly revision: Revision; readonly storage: NodeStorage }
	| { readonly revision: Revision; readonly grammars: 'one' | 'all' };

export function roundWorkers(round: number, revisions: readonly Revision[], memory: boolean): RoundWorker[] {
	const odd = round % 2 === 1;
	const ordered = odd ? [...revisions].reverse() : revisions;
	const storages: readonly NodeStorage[] = odd ? ['arena', 'object'] : ['object', 'arena'];
	const loads = odd ? (['all', 'one'] as const) : (['one', 'all'] as const);
	return [
		...ordered.flatMap((revision) => storages.map((storage) => ({ revision, storage }))),
		...(memory ? ordered.flatMap((revision) => loads.map((grammars) => ({ revision, grammars }))) : [])
	];
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

type WorkerName = 'native-hydration' | 'validation-storage' | 'library-memory';

const ownWorker = (name: WorkerName): string => fileURLToPath(new URL(`./${name}-worker.js`, import.meta.url));

async function runWorker<T>(
	worker: string,
	args: NativeHydrationOptions | ValidationStorageOptions | LibraryMemoryOptions,
	label: string,
	round: number,
	idleGate?: string,
	cwd = process.cwd()
): Promise<T & { round: number; idle: string | null }> {
	const idle = idleGate ? (await execute('bash', [idleGate, cwd], { timeout: 120_000 })).stdout.trim() : null;
	process.stderr.write(`bench-storage: ${label} round ${round + 1}\n`);
	const { stdout } = await execute(process.execPath, ['--expose-gc', worker, JSON.stringify(args)], {
		cwd,
		maxBuffer: 8 * 1024 * 1024,
		timeout: 300_000,
		env: { ...process.env, NODE_ENV: 'production' }
	});
	return { ...JSON.parse(stdout), round, idle };
}

const PROFILE_DIR = dirname(fileURLToPath(import.meta.url));

async function harnessDigest(profileDir: string, files: readonly string[]): Promise<string> {
	const harness = createHash('sha256');
	for (const file of ['storage', ...files]) harness.update(await readFile(join(profileDir, `${file}.js`)));
	return harness.digest('hex');
}

function integer(name: string, value: number, minimum: number): number {
	if (!Number.isSafeInteger(value) || value < minimum) throw new Error(`${name} must be an integer >= ${minimum}`);
	return value;
}

export async function run(options: StorageBenchOptions): Promise<number> {
	measureBuilt('bench-storage');
	const rounds = integer('rounds', options.rounds ?? 5, 1);
	const warmup = integer('warmup', options.warmup ?? 2, 0);
	const iterations = integer('iterations', options.iterations ?? 3, 1);
	if (options.limit !== undefined) integer('limit', options.limit, 1);
	const nativeDepth = options.nativeDepth ?? 'all';
	if (options.validation && (options.limit !== undefined || nativeDepth !== 'all'))
		throw new Error(
			'validation profiles use the complete deep corpus; --limit and finite --native-depth apply only to native hydration'
		);
	if (options.baseline !== undefined && !options.validation) throw new Error('--baseline compares the validation profiles; add --validation');
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
	const trees: Readonly<Record<Revision, string>> = { branch: REPO_ROOT, baseline: options.baseline === undefined ? REPO_ROOT : realpathSync.native(options.baseline) };
	const revisions: readonly Revision[] = options.baseline === undefined ? ['branch'] : ['branch', 'baseline'];
	const nativeSamples: (NativeHydrationRun & { round: number; idle: string | null })[] = [];
	const validationSamples: Record<Revision, (ValidationStorageRun & { round: number; idle: string | null })[]> = { branch: [], baseline: [] };
	const memorySamples: (LibraryMemoryRun & { grammar: GrammarName; revision: Revision; round: number; idle: string | null })[] = [];
	const startedAt = new Date().toISOString();
	for (const grammar of grammars) {
		for (let round = 0; round < rounds; round++) {
			if (!options.validation) {
				nativeSamples.push(
					await runWorker<NativeHydrationRun>(
						ownWorker('native-hydration'),
						{ grammar, depth: nativeDepth, warmup, iterations, limit: options.limit },
						`${grammar} native`,
						round,
						options.idleGate
					)
				);
				continue;
			}
			for (const slot of roundWorkers(round, revisions, options.baseline !== undefined)) {
				const tree = trees[slot.revision];
				if ('storage' in slot) {
					validationSamples[slot.revision].push(
						await runWorker<ValidationStorageRun>(
							inTree(tree, ownWorker('validation-storage')),
							{ grammar, storage: slot.storage, warmup, iterations },
							`${grammar} ${slot.storage} ${slot.revision}`,
							round,
							options.idleGate,
							tree
						)
					);
				} else {
					const loaded = slot.grammars === 'one' ? [grammar] : stableGrammars();
					const sample = await runWorker<LibraryMemoryRun>(
						ownWorker('library-memory'),
						{ tree, grammars: loaded },
						`${slot.grammars === 'one' ? grammar : 'all grammars'} memory ${slot.revision}`,
						round,
						options.idleGate,
						tree
					);
					memorySamples.push({ ...sample, grammar, revision: slot.revision });
				}
			}
			for (const revision of revisions) summarizeValidationStorage(validationSamples[revision]);
		}
	}
	const nativeSummary = summarizeNativeHydration(nativeSamples);
	const validationSummary = summarizeValidationStorage(validationSamples.branch);
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
	const baseline =
		options.baseline === undefined
			? undefined
			: {
					tree: trees.baseline,
					commit: (await execute('git', ['rev-parse', 'HEAD'], { cwd: trees.baseline })).stdout.trim(),
					harnessSha256: await harnessDigest(inTree(trees.baseline, PROFILE_DIR), harnessFiles),
					validationSummary: summarizeValidationStorage(validationSamples.baseline),
					validationSamples: validationSamples.baseline
				};
	const library =
		baseline === undefined
			? undefined
			: {
					memory: memorySamples,
					install: Object.fromEntries(
						revisions.map((revision) => [revision, Object.fromEntries(grammars.map((grammar) => [grammar, hostInstallSize(trees[revision], grammar)]))])
					)
				};
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
			harnessSha256: await harnessDigest(PROFILE_DIR, harnessFiles)
		},
		options: {
			grammars,
			rounds,
			warmup,
			iterations,
			limit: options.limit ?? null,
			nativeDepth
		},
		...(options.validation ? { validationSummary, validationSamples: validationSamples.branch } : { nativeSummary, nativeSamples }),
		...(baseline === undefined ? {} : { baseline, library })
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
