import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { loadavg } from 'node:os';
import { fileURLToPath } from 'node:url';
import { getHeapStatistics } from 'node:v8';
import { isMainThread, parentPort, Worker, workerData, type MessagePort } from 'node:worker_threads';
import { sourceSpans } from '@sittir/common';
import { spanOf } from '@sittir/common/utils';
import type { ByteSpan, NodeStorage } from '@sittir/types';
import {
	loadKindNameFromId,
	loadNativeEngine,
	loadSlotAccessorOf,
	parseNativeTree,
	readNodeOf,
	useValidationNodeStorage,
	walkWrappedTree
} from '../../validate/common.ts';
import { nativeBackendOf } from '../../validate/layout-runs.ts';

export const stages = ['io', 'parse', 'read', 'walk', 'transform', 'render'] as const;
export type Stage = (typeof stages)[number];

const LINT_KINDS = new Set([
	'debugger_statement',
	'with_statement',
	'empty_statement',
	'non_null_expression',
	'as_expression',
	'ternary_expression'
]);

const CHUNK = 8;
const CHUNK_BYTES = 128 * 1024;

export interface PipelineOptions {
	storage: NodeStorage;
	files: string;
	warmup: number;
	rounds: number;
	limit?: number;
	loopStage?: Stage;
	loopSeconds?: number;
	yieldEvery?: number;
	batchThreads?: number;
	workers?: number;
	release?: boolean;
	schedule?: 'size' | 'path';
	inventoryDepth?: number;
}

interface BatchRender {
	rendered: (string | null | undefined)[];
	errors: (string | null | undefined)[];
	peakLiveTrees: number;
	parseMs: number;
	readMs: number;
	renderMs: number;
	wallMs: number;
}

type ParseRenderBatch = (engine: object, sources: string[], threads: number) => BatchRender;

type RenderInventory = (engine: object, sources: string[], depth: number) => string;

export interface BatchRound {
	threads: number;
	load: number[];
	milliseconds: { io: number; batch: number; hash: number };
	native: { parseMs: number; readMs: number; renderMs: number; wallMs: number };
	peakLiveTrees: number;
	liveTreesBefore: number;
	liveTreesAfter: number;
	files: number;
	bytes: number;
	renderedBytes: number;
	renderedSha256: string;
	identical: number;
	refused: { path: string; error: string }[];
}

export interface Tally {
	milliseconds: Record<Stage, number>;
	files: number;
	bytes: number;
	visited: number;
	identifiers: number;
	lint: number;
	errors: number;
	renderedBytes: number;
	identical: number;
	refused: { path: string; stage: Stage; error: string }[];
}

export interface PipelineRound extends Tally {
	load: number[];
	renderedSha256: string;
	peaks: WorkerPeaks;
}

export interface WorkerPeaks {
	files: number;
	liveTrees: number;
	heapBytes: number;
	treeBytes: number;
}

export interface PooledRound extends PipelineRound {
	workers: number;
	wallMs: number;
	perWorker: WorkerPeaks[];
}

interface ChunkDone {
	rendered: (string | null)[];
	tally: Tally;
	peaks: WorkerPeaks;
}

function tally(): Tally {
	return {
		milliseconds: Object.fromEntries(stages.map((stage) => [stage, 0])) as Record<Stage, number>,
		files: 0,
		bytes: 0,
		visited: 0,
		identifiers: 0,
		lint: 0,
		errors: 0,
		renderedBytes: 0,
		identical: 0,
		refused: []
	};
}

function addTally(into: Tally, part: Tally): void {
	for (const stage of stages) into.milliseconds[stage] += part.milliseconds[stage];
	into.files += part.files;
	into.bytes += part.bytes;
	into.visited += part.visited;
	into.identifiers += part.identifiers;
	into.lint += part.lint;
	into.errors += part.errors;
	into.renderedBytes += part.renderedBytes;
	into.identical += part.identical;
	into.refused.push(...part.refused);
}

const loader = `${import.meta.url.endsWith('.js') ? 'dist' : 'src'}${process.execArgv.length > 0 ? ` (${process.execArgv.join(' ')})` : ''}`;

function chunkPoolOf(native: object) {
	const stats = (native as { chunkPoolStats?: () => { fresh: number; reused: number; freed: number; pooled: number } }).chunkPoolStats?.();
	return { on: process.env.SITTIR_CHUNK_POOL === '1', ...stats };
}

const collect = (): void => (globalThis as { gc?: () => void }).gc?.();

const yielded = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

function pathsOf(options: PipelineOptions): string[] {
	return readFileSync(options.files, 'utf8')
		.split('\n')
		.filter(Boolean)
		.slice(0, options.limit);
}

function chunksOf(paths: readonly string[], schedule: 'size' | 'path'): number[][] {
	const sizes = paths.map((path) => statSync(path).size);
	const order = paths.map((_, n) => n);
	if (schedule === 'size') order.sort((a, b) => sizes[b]! - sizes[a]! || a - b);
	const cap = schedule === 'size' ? CHUNK_BYTES : Infinity;
	const chunks: number[][] = [];
	let chunk: number[] = [];
	let bytes = 0;
	for (const n of order) {
		if (chunk.length === CHUNK || (chunk.length > 0 && bytes + sizes[n]! > cap)) {
			chunks.push(chunk);
			chunk = [];
			bytes = 0;
		}
		chunk.push(n);
		bytes += sizes[n]!;
	}
	if (chunk.length > 0) chunks.push(chunk);
	return chunks;
}

function shouldYield(options: PipelineOptions, into: Tally): boolean {
	return options.yieldEvery !== 0 && into.files % (options.yieldEvery ?? 1) === 0;
}

function renderHash() {
	const hash = createHash('sha256');
	return {
		add(path: string, text: string | null | undefined): void {
			if (text !== null && text !== undefined) hash.update(`${path}\0${text.length}\0`).update(text);
		},
		digest: (): string => hash.digest('hex')
	};
}

function hashRenders(paths: readonly string[], rendered: readonly (string | null | undefined)[]): string {
	const hash = renderHash();
	paths.forEach((path, n) => hash.add(path, rendered[n]));
	return hash.digest();
}

async function contextOf(storage: NodeStorage) {
	useValidationNodeStorage(storage);
	return {
		engine: await loadNativeEngine('typescript'),
		readNode: await readNodeOf('typescript'),
		accessorOf: await loadSlotAccessorOf('typescript'),
		kindName: await loadKindNameFromId('typescript'),
		backend: await nativeBackendOf('typescript')
	};
}

type Context = Awaited<ReturnType<typeof contextOf>>;

function peaksOf(): WorkerPeaks {
	return { files: 0, liveTrees: 0, heapBytes: 0, treeBytes: 0 };
}

function notePeaks(ctx: Context, peaks: WorkerPeaks): void {
	peaks.liveTrees = Math.max(peaks.liveTrees, ctx.backend.liveTreeCount());
	peaks.heapBytes = Math.max(peaks.heapBytes, getHeapStatistics().used_heap_size);
}

function runFile(ctx: Context, path: string, into: Tally, peaks: WorkerPeaks, release: boolean): string | undefined {
	const { engine, readNode, accessorOf, kindName, backend } = ctx;
	const { milliseconds } = into;
	let stage: Stage = 'io';
	let tree: number | undefined;
	try {
		let at = performance.now();
		const lap = (next: Stage): void => {
			const now = performance.now();
			milliseconds[stage] += now - at;
			at = now;
			stage = next;
		};
		const source = readFileSync(path, 'utf8');
		lap('parse');
		const handle = parseNativeTree(engine, source);
		tree = handle.id;
		lap('read');
		let root: unknown;
		if (handle.records !== undefined) handle.records.hydrate(0, Infinity);
		else root = readNode(handle, undefined, Infinity);
		lap('walk');
		const identifiers: ByteSpan[] = [];
		const visit = (node: { readonly $type: number }): void => {
			into.visited++;
			const kind = kindName(node.$type);
			if (LINT_KINDS.has(kind)) into.lint++;
			else if (kind === 'ERROR') into.errors++;
			else if (kind === 'identifier') {
				const span = spanOf(node);
				if (span !== undefined) identifiers.push(span);
			}
		};
		if (handle.records !== undefined) for (const node of handle.records.candidates(0)) visit(node);
		else walkWrappedTree(root, accessorOf, visit);
		lap('transform');
		const spans = sourceSpans(source);
		const renamed = new Map<string, string>();
		for (const span of identifiers) {
			const text = spans.slice(span);
			if (!renamed.has(text)) renamed.set(text, `${text}$`);
		}
		into.identifiers += identifiers.length;
		notePeaks(ctx, peaks);
		lap('render');
		const rendered =
			handle.records !== undefined
				? handle.records.renderCandidate(0)
				: engine.render(root as Parameters<typeof engine.render>[0]).toString();
		lap('io');
		into.files++;
		into.bytes += spans.byteLength;
		into.renderedBytes += Buffer.byteLength(rendered);
		into.identical += Number(rendered === source);
		if (process.env.THREADING_TRACE === '1') {
			collect();
			const { heapUsed, external, rss } = process.memoryUsage();
			const trees = backend.treeMemory();
			process.stderr.write(`${into.files}\t${spans.byteLength}\t${(heapUsed / 2 ** 20).toFixed(0)}\t${(external / 2 ** 20).toFixed(0)}\t${(rss / 2 ** 20).toFixed(0)}\t${backend.liveTreeCount()}\t${(trees.counted / 2 ** 20).toFixed(1)}\t${(trees.reported / 2 ** 20).toFixed(1)}\t${path}\n`);
		}
		return rendered;
	} catch (error) {
		into.refused.push({ path, stage, error: String(error).slice(0, 200) });
		return undefined;
	} finally {
		if (release && tree !== undefined) {
			const at = performance.now();
			backend.disposeTree(tree);
			milliseconds.render += performance.now() - at;
		}
	}
}

async function batch(options: PipelineOptions, threads: number) {
	if (options.storage !== 'arena')
		throw new Error(`a native batch reads arena records, so it refuses ${options.storage} storage`);
	const backend = await nativeBackendOf('typescript');
	const parseRenderBatch = (backend as { parseRenderBatch?: ParseRenderBatch }).parseRenderBatch;
	if (parseRenderBatch === undefined) throw new Error("typescript's addon has no parseRenderBatch: rebuild it on this branch");
	const { handle } = new backend.SittirEngine();
	const paths = pathsOf(options);
	const once = (): BatchRound => {
		const load = loadavg();
		let at = performance.now();
		const sources = paths.map((path) => readFileSync(path, 'utf8'));
		const io = performance.now() - at;
		const liveTreesBefore = backend.liveTreeCount();
		at = performance.now();
		const out = parseRenderBatch(handle, sources, threads);
		const batched = performance.now() - at;
		const liveTreesAfter = backend.liveTreeCount();
		at = performance.now();
		const round: BatchRound = {
			threads,
			load,
			milliseconds: { io, batch: batched, hash: 0 },
			native: { parseMs: out.parseMs, readMs: out.readMs, renderMs: out.renderMs, wallMs: out.wallMs },
			peakLiveTrees: out.peakLiveTrees,
			liveTreesBefore,
			liveTreesAfter,
			files: 0,
			bytes: 0,
			renderedBytes: 0,
			renderedSha256: hashRenders(paths, out.rendered),
			identical: 0,
			refused: []
		};
		paths.forEach((path, n) => {
			const rendered = out.rendered[n];
			const source = sources[n]!;
			if (rendered === null || rendered === undefined) {
				round.refused.push({ path, error: String(out.errors[n]).slice(0, 200) });
				return;
			}
			round.files++;
			round.bytes += Buffer.byteLength(source);
			round.renderedBytes += Buffer.byteLength(rendered);
			round.identical += Number(rendered === source);
		});
		round.milliseconds.hash = performance.now() - at;
		return round;
	};
	for (let i = 0; i < options.warmup; i++) once();
	const rounds: BatchRound[] = [];
	for (let i = 0; i < options.rounds; i++) {
		collect();
		rounds.push(once());
	}
	return { storage: options.storage, threads, loader, chunkPool: chunkPoolOf(backend), pid: process.pid, node: process.version, peakRssBytes: process.resourceUsage().maxRSS * 1024, rounds };
}

async function inventory(options: PipelineOptions, depth: number) {
	if (options.storage !== 'arena')
		throw new Error(`a render inventory reads arena records, so it refuses ${options.storage} storage`);
	const backend = await nativeBackendOf('typescript');
	const renderInventory = (backend as { renderInventory?: RenderInventory }).renderInventory;
	if (renderInventory === undefined) throw new Error("typescript's addon has no renderInventory: rebuild it on this branch");
	const { handle } = new backend.SittirEngine();
	const paths = pathsOf(options);
	const load = loadavg();
	const rows = (JSON.parse(renderInventory(handle, paths.map((path) => readFileSync(path, 'utf8')), depth)) as object[]).map((row, n) => ({ path: paths[n], ...row }));
	return { storage: options.storage, depth, loader, load, pid: process.pid, node: process.version, rows };
}

async function workerMain(options: PipelineOptions, port: MessagePort): Promise<void> {
	const ctx = await contextOf(options.storage);
	const paths = pathsOf(options);
	const peaks = peaksOf();
	port.on('message', async (message: { gc?: true; indices?: number[] }) => {
		if (message.gc) {
			collect();
			port.postMessage({});
			return;
		}
		const into = tally();
		const rendered: (string | null)[] = [];
		for (const index of message.indices ?? []) {
			if (shouldYield(options, into)) await yielded();
			rendered.push(runFile(ctx, paths[index]!, into, peaks, options.release === true) ?? null);
		}
		peaks.files += into.files;
		peaks.treeBytes = Math.max(peaks.treeBytes, ctx.backend.treeMemory().counted);
		port.postMessage({ rendered, tally: into, peaks } satisfies ChunkDone);
	});
	port.postMessage({ ready: true });
}

function request<T>(worker: Worker, message: object): Promise<T> {
	return new Promise((resolve) => {
		worker.once('message', resolve);
		worker.postMessage(message);
	});
}

async function pooled(options: PipelineOptions, workers: number) {
	const paths = pathsOf(options);
	const schedule = options.schedule ?? 'size';
	const chunks = chunksOf(paths, schedule);
	const started = performance.now();
	const pool = await Promise.all(
		Array.from({ length: workers }, () => {
			const worker = new Worker(new URL(import.meta.url), { workerData: { role: 'pipeline-worker', options } });
			worker.on('error', (error: unknown) => {
				process.stderr.write(`a pipeline worker failed: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`);
				process.exit(1);
			});
			return new Promise<Worker>((resolve) => worker.once('message', () => resolve(worker)));
		})
	);
	const startupMs = performance.now() - started;
	const once = async (): Promise<PooledRound> => {
		await Promise.all(pool.map((worker) => request(worker, { gc: true })));
		const load = loadavg();
		const total = tally();
		const rendered: (string | null)[] = Array.from({ length: paths.length }, () => null);
		const perWorker: WorkerPeaks[] = pool.map(peaksOf);
		let next = 0;
		const at = performance.now();
		await Promise.all(
			pool.map(async (worker, w) => {
				while (next < chunks.length) {
					const indices = chunks[next++]!;
					const done = await request<ChunkDone>(worker, { indices });
					indices.forEach((index, k) => (rendered[index] = done.rendered[k] ?? null));
					addTally(total, done.tally);
					perWorker[w] = { ...done.peaks, files: perWorker[w]!.files + done.tally.files };
				}
			})
		);
		const wallMs = performance.now() - at;
		const order = new Map(paths.map((path, n) => [path, n]));
		total.refused.sort((a, b) => order.get(a.path)! - order.get(b.path)!);
		return { ...total, workers, load, wallMs, renderedSha256: hashRenders(paths, rendered), peaks: peaksOf(), perWorker };
	};
	for (let i = 0; i < options.warmup; i++) await once();
	const rounds: PooledRound[] = [];
	for (let i = 0; i < options.rounds; i++) rounds.push(await once());
	await Promise.all(pool.map((worker) => worker.terminate()));
	const chunkPool = chunkPoolOf(await nativeBackendOf('typescript'));
	return { storage: options.storage, workers, schedule, chunks: chunks.length, loader, chunkPool, pid: process.pid, node: process.version, startupMs, peakRssBytes: process.resourceUsage().maxRSS * 1024, rounds };
}

export async function pipeline(options: PipelineOptions) {
	if (options.inventoryDepth !== undefined) return inventory(options, options.inventoryDepth);
	if (options.batchThreads !== undefined) return batch(options, options.batchThreads);
	if (options.workers !== undefined) return pooled(options, options.workers);
	const ctx = await contextOf(options.storage);
	const paths = pathsOf(options);

	const once = async (): Promise<PipelineRound> => {
		const round: PipelineRound = { ...tally(), load: loadavg(), renderedSha256: '', peaks: peaksOf() };
		const hash = renderHash();
		for (const path of paths) {
			if (shouldYield(options, round)) await yielded();
			hash.add(path, runFile(ctx, path, round, round.peaks, options.release === true));
		}
		round.peaks.files = round.files;
		round.peaks.treeBytes = ctx.backend.treeMemory().counted;
		round.renderedSha256 = hash.digest();
		return round;
	};

	if (options.loopStage !== undefined) {
		const until = performance.now() + (options.loopSeconds ?? 10) * 1000;
		while (performance.now() < until) await once();
		return { storage: options.storage, pid: process.pid, looped: options.loopStage };
	}
	for (let i = 0; i < options.warmup; i++) await once();
	const rounds: PipelineRound[] = [];
	for (let i = 0; i < options.rounds; i++) {
		collect();
		rounds.push(await once());
	}
	const memory = process.memoryUsage();
	return {
		storage: options.storage,
		loader,
		chunkPool: chunkPoolOf(ctx.backend),
		pid: process.pid,
		node: process.version,
		buildProfile: ctx.engine.diagnostics.buildProfile,
		peakRssBytes: process.resourceUsage().maxRSS * 1024,
		memory,
		rounds
	};
}

const role = (workerData as { role?: string; options?: PipelineOptions } | null) ?? undefined;
if (!isMainThread && role?.role === 'pipeline-worker' && parentPort !== null) await workerMain(role.options!, parentPort);
else if (isMainThread && process.argv[1] === fileURLToPath(import.meta.url)) {
	const options = JSON.parse(process.argv[2] ?? '{}') as PipelineOptions;
	process.stdout.write(`${JSON.stringify(await pipeline(options))}\n`);
}
