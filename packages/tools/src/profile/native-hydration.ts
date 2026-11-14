import { createHash } from 'node:crypto';
import { nativeEngineOf, type NativeEngineLike } from '@sittir/common/engine';
import type { loadCorpusEntries } from '../validate/common.ts';
import type { nativeBackendOf } from '../validate/layout-runs.ts';

export const nativePhases = ['parse', 'render', 'pipeline'] as const;
type Backend = Awaited<ReturnType<typeof nativeBackendOf>>;
type Entries = ReturnType<typeof loadCorpusEntries>;
type RecordEngine = Required<Pick<NativeEngineLike, 'parseRecords' | 'readRenderAt'>>;

export interface NativeHydrationSample {
	entries: number;
	rootsWithRecord: number;
	refused: { entry: string; stage: 'parse' | 'render'; error: string }[];
	render: { bytes: number; sha256: string };
	memory: { baseline: NodeJS.MemoryUsage; native: NodeJS.MemoryUsage };
	timings: Record<(typeof nativePhases)[number], number[]>;
}

interface NativeContext {
	backend: Backend;
	entries: Entries;
	collect: () => Promise<void>;
}

async function withRecordEngine<T>(backend: Backend, use: (engine: RecordEngine) => Promise<T>): Promise<T> {
	const engine = nativeEngineOf(backend);
	try {
		const { parseRecords, readRenderAt } = engine;
		if (!parseRecords || !readRenderAt) throw new Error('native workflow needs an addon exposing parseRecords and readRenderAt');
		return await use({ parseRecords, readRenderAt });
	} finally {
		engine.dispose();
	}
}

const rootOf = (engine: RecordEngine, source: string): number | null => (JSON.parse(engine.parseRecords(source)) as { root: number | null }).root;

function renderFingerprint(rendered: readonly string[]): NativeHydrationSample['render'] {
	const hash = createHash('sha256');
	let bytes = 0;
	for (const text of rendered) {
		const length = Buffer.byteLength(text);
		bytes += length;
		hash.update(`${length}:`).update(text);
	}
	return { bytes, sha256: hash.digest('hex') };
}

async function nativePopulation(ctx: NativeContext) {
	await ctx.collect();
	const baseline = process.memoryUsage();
	return withRecordEngine(ctx.backend, async (engine) => {
		const candidates: { index: number; root: number | null }[] = [];
		const refused: NativeHydrationSample['refused'] = [];
		let rootsWithRecord = 0;
		for (const [index, entry] of ctx.entries.entries()) {
			try {
				const root = rootOf(engine, entry.source);
				rootsWithRecord += Number(root !== null);
				candidates.push({ index, root });
			} catch (error) {
				refused.push({ entry: entry.name, stage: 'parse', error: String(error) });
			}
		}
		await ctx.collect();
		const memory = { baseline, native: process.memoryUsage() };
		const eligible: number[] = [];
		const rendered: string[] = [];
		for (const { index, root } of candidates) {
			try {
				if (root === null) throw new Error('root has no arena record');
				rendered.push(engine.readRenderAt(root, false, false));
				eligible.push(index);
			} catch (error) {
				refused.push({ entry: ctx.entries[index]!.name, stage: 'render', error: String(error) });
			}
		}
		return { eligible, rootsWithRecord, refused, render: renderFingerprint(rendered), memory };
	});
}

async function timeNativeWorkflow(
	ctx: NativeContext,
	population: Awaited<ReturnType<typeof nativePopulation>>,
	warmup: number,
	iterations: number
): Promise<NativeHydrationSample['timings']> {
	const timings: NativeHydrationSample['timings'] = { parse: [], render: [], pipeline: [] };
	for (let iteration = -warmup; iteration < iterations; iteration++) {
		await ctx.collect();
		await withRecordEngine(ctx.backend, async (engine) => {
			const start = performance.now();
			const roots = population.eligible.map((index) => rootOf(engine, ctx.entries[index]!.source));
			const parsed = performance.now();
			const rendered = roots.map((root) => {
				if (root === null) throw new Error('native parse workload changed');
				return engine.readRenderAt(root, false, false);
			});
			const finished = performance.now();
			const fingerprint = renderFingerprint(rendered);
			if (fingerprint.sha256 !== population.render.sha256 || fingerprint.bytes !== population.render.bytes)
				throw new Error('native render workload changed');
			if (iteration >= 0) {
				timings.parse.push(parsed - start);
				timings.render.push(finished - parsed);
				timings.pipeline.push(finished - start);
			}
		});
	}
	return timings;
}

export async function sampleNativeHydration(
	backend: Backend,
	entries: Entries,
	warmup: number,
	iterations: number,
	collect: () => Promise<void>
): Promise<NativeHydrationSample> {
	const ctx: NativeContext = { backend, entries, collect };
	const population = await nativePopulation(ctx);
	return {
		entries: population.eligible.length,
		rootsWithRecord: population.rootsWithRecord,
		refused: population.refused,
		render: population.render,
		memory: population.memory,
		timings: await timeNativeWorkflow(ctx, population, warmup, iterations)
	};
}
