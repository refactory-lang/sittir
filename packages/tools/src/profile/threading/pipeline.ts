import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { loadavg } from 'node:os';
import { fileURLToPath } from 'node:url';
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

export interface PipelineRound {
	load: number[];
	milliseconds: Record<Stage, number>;
	files: number;
	bytes: number;
	visited: number;
	identifiers: number;
	lint: number;
	errors: number;
	renderedBytes: number;
	renderedSha256: string;
	identical: number;
	refused: { path: string; stage: Stage; error: string }[];
}

function zero(): Record<Stage, number> {
	return Object.fromEntries(stages.map((stage) => [stage, 0])) as Record<Stage, number>;
}

const loader = `${import.meta.url.endsWith('.js') ? 'dist' : 'src'}${process.execArgv.length > 0 ? ` (${process.execArgv.join(' ')})` : ''}`;

async function batch(options: PipelineOptions, threads: number) {
	if (options.storage !== 'arena')
		throw new Error(`a native batch reads arena records, so it refuses ${options.storage} storage`);
	const backend = await nativeBackendOf('typescript');
	const parseRenderBatch = (backend as { parseRenderBatch?: ParseRenderBatch }).parseRenderBatch;
	if (parseRenderBatch === undefined) throw new Error("typescript's addon has no parseRenderBatch: rebuild it on this branch");
	const { handle } = new backend.SittirEngine();
	const paths = readFileSync(options.files, 'utf8')
		.split('\n')
		.filter(Boolean)
		.slice(0, options.limit);
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
		const hash = createHash('sha256');
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
			renderedSha256: '',
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
			hash.update(`${path}\0${rendered.length}\0`).update(rendered);
		});
		round.renderedSha256 = hash.digest('hex');
		round.milliseconds.hash = performance.now() - at;
		return round;
	};
	for (let i = 0; i < options.warmup; i++) once();
	const rounds: BatchRound[] = [];
	for (let i = 0; i < options.rounds; i++) {
		(globalThis as { gc?: () => void }).gc?.();
		rounds.push(once());
	}
	return { storage: options.storage, threads, loader, pid: process.pid, node: process.version, peakRssBytes: process.resourceUsage().maxRSS * 1024, rounds };
}

export async function pipeline(options: PipelineOptions) {
	if (options.batchThreads !== undefined) return batch(options, options.batchThreads);
	useValidationNodeStorage(options.storage);
	const engine = await loadNativeEngine('typescript');
	const readNode = await readNodeOf('typescript');
	const accessorOf = await loadSlotAccessorOf('typescript');
	const kindName = await loadKindNameFromId('typescript');
	const backend = await nativeBackendOf('typescript');
	const paths = readFileSync(options.files, 'utf8')
		.split('\n')
		.filter(Boolean)
		.slice(0, options.limit);

	const once = async (): Promise<PipelineRound> => {
		const milliseconds = zero();
		const hash = createHash('sha256');
		const round: PipelineRound = {
			load: loadavg(),
			milliseconds,
			files: 0,
			bytes: 0,
			visited: 0,
			identifiers: 0,
			lint: 0,
			errors: 0,
			renderedBytes: 0,
			renderedSha256: '',
			identical: 0,
			refused: []
		};
		for (const path of paths) {
			if (options.yieldEvery !== 0 && round.files % (options.yieldEvery ?? 1) === 0) await new Promise((resolve) => setImmediate(resolve));
			let stage: Stage = 'io';
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
				lap('read');
				let root: unknown;
				if (handle.records !== undefined) handle.records.hydrate(0, Infinity);
				else root = readNode(handle, undefined, Infinity);
				lap('walk');
				const identifiers: ByteSpan[] = [];
				const visit = (node: { readonly $type: number }): void => {
					round.visited++;
					const kind = kindName(node.$type);
					if (LINT_KINDS.has(kind)) round.lint++;
					else if (kind === 'ERROR') round.errors++;
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
				round.identifiers += identifiers.length;
				lap('render');
				const rendered =
					handle.records !== undefined
						? handle.records.renderCandidate(0)
						: engine.render(root as Parameters<typeof engine.render>[0]).toString();
				lap('io');
				round.files++;
				round.bytes += spans.byteLength;
				round.renderedBytes += Buffer.byteLength(rendered);
				round.identical += Number(rendered === source);
				hash.update(`${path}\0${rendered.length}\0`).update(rendered);
				if (process.env.THREADING_TRACE === '1') {
					(globalThis as { gc?: () => void }).gc?.();
					const { heapUsed, external, rss } = process.memoryUsage();
					const trees = backend.treeMemory();
					process.stderr.write(`${round.files}\t${spans.byteLength}\t${(heapUsed / 2 ** 20).toFixed(0)}\t${(external / 2 ** 20).toFixed(0)}\t${(rss / 2 ** 20).toFixed(0)}\t${backend.liveTreeCount()}\t${(trees.counted / 2 ** 20).toFixed(1)}\t${(trees.reported / 2 ** 20).toFixed(1)}\t${path}\n`);
				}
			} catch (error) {
				round.refused.push({ path, stage, error: String(error).slice(0, 200) });
			}
		}
		round.renderedSha256 = hash.digest('hex');
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
		(globalThis as { gc?: () => void }).gc?.();
		rounds.push(await once());
	}
	const memory = process.memoryUsage();
	return {
		storage: options.storage,
		loader,
		pid: process.pid,
		node: process.version,
		buildProfile: engine.diagnostics.buildProfile,
		peakRssBytes: process.resourceUsage().maxRSS * 1024,
		memory,
		rounds
	};
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const options = JSON.parse(process.argv[2] ?? '{}') as PipelineOptions;
	process.stdout.write(`${JSON.stringify(await pipeline(options))}\n`);
}
