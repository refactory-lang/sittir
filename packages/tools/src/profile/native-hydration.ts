import { createHash } from 'node:crypto';
import type { loadCorpusEntries } from '../validate/common.ts';
import type { nativeBackendOf } from '../validate/layout-runs.ts';

export type HydrationDepth = number | 'all';
export const nativePhases = ['parse', 'hydrate', 'render', 'pipeline', 'afterShallow'] as const;
type Backend = Awaited<ReturnType<typeof nativeBackendOf>>;
type NativeEngine = InstanceType<Backend['SittirEngine']>;
type Entries = ReturnType<typeof loadCorpusEntries>;

export interface NativeHydrationSample {
	depth: HydrationDepth;
	entries: number;
	rootsWithRecord: number;
	refused: { entry: string; stage: 'hydrate' | 'render'; error: string }[];
	render: { bytes: number; sha256: string };
	memory: { baseline: NodeJS.MemoryUsage; native: NodeJS.MemoryUsage };
	timings: Record<(typeof nativePhases)[number], number[]>;
}

interface NativeContext {
	backend: Backend;
	engine: NativeEngine;
	entries: Entries;
	depth: number;
	collect: () => Promise<void>;
}

async function withNativeTrees<T>(
	ctx: NativeContext,
	indexes: readonly number[],
	use: (ids: readonly number[], timing: { start: number; parsed: number }) => Promise<T>
): Promise<T> {
	const ids: number[] = [];
	try {
		const start = performance.now();
		for (const index of indexes) {
			const { treeId } = JSON.parse(ctx.engine.parse(ctx.entries[index]!.source)) as { treeId: number };
			ids.push(treeId);
		}
		return await use(ids, { start, parsed: performance.now() });
	} finally {
		for (const id of ids) ctx.backend.disposeTree(id);
	}
}

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
	return withNativeTrees(
		ctx,
		ctx.entries.map((_, i) => i),
		async (ids) => {
			const candidates: { index: number; id: number; address: number | null }[] = [];
			const refused: NativeHydrationSample['refused'] = [];
			let rootsWithRecord = 0;
			for (const [index, id] of ids.entries()) {
				try {
					const at = ctx.engine.hydrateRecord!(id, 0, ctx.depth);
					rootsWithRecord += Number(at !== null);
					candidates.push({ index, id, address: at });
				} catch (error) {
					refused.push({ entry: ctx.entries[index]!.name, stage: 'hydrate', error: String(error) });
				}
			}
			await ctx.collect();
			const memory = { baseline, native: process.memoryUsage() };
			const eligible: number[] = [];
			const rendered: string[] = [];
			for (const { index, id, address } of candidates) {
				try {
					if (address === null) throw new Error('root has no arena record');
					rendered.push(ctx.engine.renderRecord!(id, address, false, false));
					eligible.push(index);
				} catch (error) {
					refused.push({ entry: ctx.entries[index]!.name, stage: 'render', error: String(error) });
				}
			}
			return { eligible, rootsWithRecord, refused, render: renderFingerprint(rendered), memory };
		}
	);
}

async function timeNativeWorkflow(
	ctx: NativeContext,
	population: Awaited<ReturnType<typeof nativePopulation>>,
	warmup: number,
	iterations: number
): Promise<NativeHydrationSample['timings']> {
	const timings: NativeHydrationSample['timings'] = {
		parse: [],
		hydrate: [],
		render: [],
		pipeline: [],
		afterShallow: []
	};
	for (let iteration = -warmup; iteration < iterations; iteration++) {
		await ctx.collect();
		await withNativeTrees(ctx, population.eligible, async (ids, { start, parsed }) => {
			const addresses = ids.map((id) => ctx.engine.hydrateRecord!(id, 0, ctx.depth));
			const hydrated = performance.now();
			const rendered = ids.map((id, index) => ctx.engine.renderRecord!(id, addresses[index]!, false, false));
			const finished = performance.now();
			const fingerprint = renderFingerprint(rendered);
			if (addresses.some((address) => address === null)) throw new Error('native hydration workload changed');
			if (fingerprint.sha256 !== population.render.sha256 || fingerprint.bytes !== population.render.bytes)
				throw new Error('native render workload changed');
			if (iteration >= 0) {
				timings.parse.push(parsed - start);
				timings.hydrate.push(hydrated - parsed);
				timings.render.push(finished - hydrated);
				timings.pipeline.push(finished - start);
			}
		});
	}
	return timings;
}

async function timeNativeAfterShallow(
	ctx: NativeContext,
	eligible: readonly number[],
	warmup: number,
	iterations: number
): Promise<number[]> {
	const milliseconds: number[] = [];
	for (let iteration = -warmup; iteration < iterations; iteration++) {
		await ctx.collect();
		await withNativeTrees(ctx, eligible, async (ids) => {
			for (const id of ids) ctx.engine.readRecord!(id, 0, 1);
			let work = 0;
			const start = performance.now();
			for (const id of ids) work += Number(ctx.engine.hydrateRecord!(id, 0, ctx.depth) !== null);
			const elapsed = performance.now() - start;
			if (work !== eligible.length) throw new Error('native hydration workload changed');
			if (iteration >= 0) milliseconds.push(elapsed);
		});
	}
	return milliseconds;
}

export async function sampleNativeHydration(
	backend: Backend,
	entries: Entries,
	depth: HydrationDepth,
	warmup: number,
	iterations: number,
	collect: () => Promise<void>
): Promise<NativeHydrationSample> {
	const engine = new backend.SittirEngine();
	try {
		if (!engine.hydrateRecord || !engine.readRecord || !engine.renderRecord)
			throw new Error('native workflow needs an addon exposing hydrateRecord, readRecord and renderRecord');
		const ctx: NativeContext = { backend, engine, entries, depth: depth === 'all' ? Infinity : depth, collect };
		const population = await nativePopulation(ctx);
		const timings = await timeNativeWorkflow(ctx, population, warmup, iterations);
		timings.afterShallow = await timeNativeAfterShallow(ctx, population.eligible, warmup, iterations);
		return {
			depth,
			entries: population.eligible.length,
			rootsWithRecord: population.rootsWithRecord,
			refused: population.refused,
			render: population.render,
			memory: population.memory,
			timings
		};
	} finally {
		engine.dispose();
	}
}
