import { createHash } from 'node:crypto';
import { setImmediate } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { createEngine } from '@sittir/common';
import { nodeText } from '@sittir/common/utils';
import type { GrammarName } from '@sittir/codegen/grammars';
import { languageByName } from '../languages.ts';
import { loadCorpusEntries, loadSlotReaders, walkWrappedTree, type SlotReaders } from '../validate/common.ts';

export const STORAGE_PHASES = [
	'parse-read',
	'walk-structure-cold',
	'walk-text-cold',
	'walk-text-warm',
	'render'
] as const;
export type StoragePhase = (typeof STORAGE_PHASES)[number];
export type StorageMode = 'object' | 'arena';
export interface StorageWorkerOptions {
	grammar: GrammarName;
	storage: StorageMode;
	warmup: number;
	iterations: number;
	limit?: number;
}
export interface WalkResult {
	nodes: number;
	kinds: number;
	textUnits: number;
}
export interface StorageSample {
	grammar: GrammarName;
	storage: StorageMode;
	corpus: { entries: number; bytes: number; sha256: string };
	nodes: number;
	walk: WalkResult;
	pid: number;
	memory: { structure: NodeJS.MemoryUsage; text: NodeJS.MemoryUsage; baseline: NodeJS.MemoryUsage };
	timings: { phase: StoragePhase; milliseconds: number[]; work: number }[];
	render: { entries: number; sha256: string; refused: { entry: string; error: string }[] };
}

async function engineFor(options: StorageWorkerOptions) {
	return createEngine(await languageByName(options.grammar), { nodeStorage: options.storage });
}
type BenchmarkEngine = Awaited<ReturnType<typeof engineFor>>;
type Roots = ReturnType<BenchmarkEngine['parse']>[];

function walk(roots: Roots, readers: SlotReaders, text: boolean): WalkResult {
	const result: WalkResult = { nodes: 0, kinds: 0, textUnits: 0 };
	for (const root of roots) {
		walkWrappedTree(
			root,
			readers,
			(node) => {
				result.nodes++;
				result.kinds += node.$type;
				if (text) result.textUnits += nodeText(node)?.length ?? 0;
			},
			(refusal) => {
				throw new Error(`accessor ${refusal.accessor}: ${refusal.message}`);
			}
		);
	}
	return result;
}

async function collectGarbage(): Promise<void> {
	if (typeof globalThis.gc !== 'function') throw new Error('bench-storage workers require --expose-gc');
	for (let i = 0; i < 3; i++) {
		globalThis.gc();
		await setImmediate();
	}
}

async function retainedPopulation(
	engine: BenchmarkEngine,
	entries: ReturnType<typeof loadCorpusEntries>,
	readers: SlotReaders
) {
	await collectGarbage();
	const baseline = process.memoryUsage();
	const roots = entries.map((entry) => engine.parse(entry.source));
	const structureWalk = walk(roots, readers, false);
	await collectGarbage();
	const structure = process.memoryUsage();
	const textWalk = walk(roots, readers, true);
	await collectGarbage();
	const text = process.memoryUsage();
	const renderable: number[] = [];
	const refused: StorageSample['render']['refused'] = [];
	const digest = createHash('sha256');
	let renderUnits = 0;
	for (const [index, root] of roots.entries()) {
		try {
			const output = engine.render(root).toString();
			renderable.push(index);
			renderUnits += output.length;
			digest.update(JSON.stringify([index, output]));
		} catch (error) {
			refused.push({ entry: entries[index]!.name, error: String(error) });
		}
	}
	const render = { entries: renderable.length, sha256: digest.digest('hex'), refused };
	return { memory: { baseline, structure, text }, walk: textWalk, structureWalk, render, renderable, renderUnits };
}

interface TimingContext {
	engine: BenchmarkEngine;
	entries: ReturnType<typeof loadCorpusEntries>;
	readers: SlotReaders;
	retained: Awaited<ReturnType<typeof retainedPopulation>>;
	options: StorageWorkerOptions;
}

async function timePhase(phase: StoragePhase, ctx: TimingContext): Promise<StorageSample['timings'][number]> {
	const { engine, entries, readers, retained, options } = ctx;
	const parse = (): Roots => entries.map((entry) => engine.parse(entry.source));
	const milliseconds: number[] = [];
	let roots: Roots = [];
	for (let iteration = -options.warmup; iteration < options.iterations; iteration++) {
		await collectGarbage();
		if (phase !== 'parse-read') roots = parse();
		if (phase === 'walk-text-warm') walk(roots, readers, true);
		const start = performance.now();
		let work: number;
		if (phase === 'parse-read') {
			roots = parse();
			work = roots.length;
		} else if (phase === 'render') {
			work = 0;
			for (const index of retained.renderable) work += engine.render(roots[index]!).toString().length;
		} else {
			const result = walk(roots, readers, phase !== 'walk-structure-cold');
			work = result.nodes + result.kinds + result.textUnits;
		}
		const elapsed = performance.now() - start;
		const expected =
			phase === 'parse-read'
				? entries.length
				: phase === 'render'
					? retained.renderUnits
					: retained.walk.nodes + retained.walk.kinds + (phase === 'walk-structure-cold' ? 0 : retained.walk.textUnits);
		if (work !== expected) throw new Error(`workload changed during ${phase}`);
		if (iteration >= 0) milliseconds.push(elapsed);
		roots = [];
	}
	return {
		phase,
		milliseconds,
		work: phase === 'parse-read' ? entries.length : phase === 'render' ? retained.render.entries : retained.walk.nodes
	};
}

export async function sampleStorage(options: StorageWorkerOptions): Promise<StorageSample> {
	const entries = loadCorpusEntries(options.grammar).slice(0, options.limit);
	const readers = await loadSlotReaders(options.grammar);
	const corpus = {
		entries: entries.length,
		bytes: entries.reduce((sum, entry) => sum + Buffer.byteLength(entry.source), 0),
		sha256: createHash('sha256')
			.update(JSON.stringify(entries.map(({ name, source }) => [name, source])))
			.digest('hex')
	};
	const engine = await engineFor(options);
	try {
		const retained = await retainedPopulation(engine, entries, readers);
		const timings: StorageSample['timings'] = [];
		for (const phase of STORAGE_PHASES)
			timings.push(await timePhase(phase, { engine, entries, readers, retained, options }));
		return {
			grammar: options.grammar,
			storage: options.storage,
			pid: process.pid,
			corpus,
			nodes: retained.walk.nodes,
			walk: retained.walk,
			memory: retained.memory,
			timings,
			render: retained.render
		};
	} finally {
		engine.dispose();
	}
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const options: StorageWorkerOptions = JSON.parse(process.argv[2] ?? '{}');
	process.stdout.write(`${JSON.stringify(await sampleStorage(options))}\n`);
}
