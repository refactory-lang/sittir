import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { cpus, release } from 'node:os';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { stableGrammars, type GrammarName } from '@sittir/codegen/grammars';
import { STORAGE_PHASES, type StorageMode, type StorageSample, type StorageWorkerOptions } from './storage-worker.ts';

const execute = promisify(execFile);
export interface StorageBenchOptions {
	grammars?: readonly string[];
	rounds?: number;
	warmup?: number;
	iterations?: number;
	limit?: number;
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
				Object.fromEntries(
					(['heapUsed', 'heapTotal', 'external', 'arrayBuffers', 'rss'] as const).map((field) => [
						field,
						median(rows.map((sample) => sample.memory[state][field] - sample.memory.baseline[field]))
					])
				);
			return { storage, nodes: rows[0]!.nodes, structureBytes: retained('structure'), textBytes: retained('text') };
		});
		return { grammar, corpus: group[0]!.corpus, timings, memory, refused: group[0]!.render.refused };
	});
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
	const grammars: GrammarName[] = [];
	for (const name of options.grammars?.length ? options.grammars : stableGrammars()) {
		const grammar = stableGrammars().find((known) => known === name);
		if (!grammar) throw new Error(`unknown grammar: ${name}`);
		if (!grammars.includes(grammar)) grammars.push(grammar);
	}
	const worker = new URL(
		import.meta.url.endsWith('.ts') ? './storage-worker.ts' : './storage-worker.js',
		import.meta.url
	);
	const samples: (StorageSample & { round: number; idle: string | null })[] = [];
	const startedAt = new Date().toISOString();
	for (const grammar of grammars) {
		for (let round = 0; round < rounds; round++) {
			const order: StorageMode[] = round % 2 === 0 ? ['object', 'arena'] : ['arena', 'object'];
			for (const storage of order) {
				const idle = options.idleGate
					? (await execute('bash', [options.idleGate, process.cwd()], { timeout: 120_000 })).stdout.trim()
					: null;
				process.stderr.write(`bench-storage: ${grammar} round ${round + 1}/${rounds} ${storage}\n`);
				const args: StorageWorkerOptions = { grammar, storage, warmup, iterations, limit: options.limit };
				const { stdout } = await execute(
					process.execPath,
					['--expose-gc', '--import', 'tsx', fileURLToPath(worker), JSON.stringify(args)],
					{ maxBuffer: 8 * 1024 * 1024, timeout: 300_000, env: { ...process.env, NODE_ENV: 'production' } }
				);
				const sample: StorageSample = JSON.parse(stdout);
				samples.push({ ...sample, round, idle });
			}
			const pair = samples.slice(-2);
			validatePair(
				pair.find((sample) => sample.storage === 'object')!,
				pair.find((sample) => sample.storage === 'arena')!
			);
		}
	}
	const summary = summarize(samples);
	const report = {
		schemaVersion: 1,
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
			harnessSha256: createHash('sha256')
				.update(await readFile(fileURLToPath(import.meta.url)))
				.update(await readFile(worker))
				.digest('hex')
		},
		options: { grammars, rounds, warmup, iterations, limit: options.limit ?? null },
		summary,
		samples
	};
	const json = `${JSON.stringify(report, null, 2)}\n`;
	if (options.output) await writeFile(options.output, json);
	else process.stdout.write(json);
	process.stderr.write('\ngrammar\tphase\tobject ms\tarena ms\tarena/object\n');
	for (const row of summary)
		for (const timing of row.timings)
			process.stderr.write(
				`${row.grammar}\t${timing.phase}\t${timing.objectMs.toFixed(3)}\t${timing.arenaMs.toFixed(3)}\t${timing.arenaOverObject?.toFixed(3) ?? 'n/a'}\n`
			);
	return 0;
}
