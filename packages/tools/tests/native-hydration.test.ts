import { expect, it, vi } from 'vitest';
import { sampleNativeHydration } from '../src/profile/native-hydration.ts';
import { summarizeNativeHydration } from '../src/profile/storage.ts';
import type { NativeHydrationRun } from '../src/profile/native-hydration-worker.ts';

it('parses to records on a fresh engine each pass, transfers no node data, and disposes every engine including refusals', async () => {
	let engines = 0;
	const roots = new Map<number, string>();
	const read = vi.fn(() => {
		throw new Error('object data requested');
	});
	const parse = vi.fn(() => {
		throw new Error('a tree requested');
	});
	const parseRecords = vi.fn((_engine: object, source: string) => {
		if (source === 'refused') throw new Error('native refusal');
		const root = source === 'leaf' ? null : roots.size + 32;
		if (root !== null) roots.set(root, source);
		return JSON.stringify({ root, source: 16, options: {}, errors: [] });
	});
	const render = vi.fn((node: number, leading: boolean, trailing: boolean) => {
		expect([leading, trailing]).toEqual([false, false]);
		return roots.get(node)!;
	});
	const dispose = vi.fn(() => roots.clear());
	const backend = {
		SittirEngine: class {
			readonly handle = {};
			constructor() {
				engines += 1;
			}
			parse = parse;
			dispose = dispose;
		},
		read,
		parseRecords,
		readRenderAt: (_engine: object, node: number, leading: boolean, trailing: boolean) => render(node, leading, trailing)
	} as unknown as Parameters<typeof sampleNativeHydration>[0];
	const entries = ['ok', 'leaf', 'refused'].map((source) => ({ name: source, source })) as Parameters<
		typeof sampleNativeHydration
	>[1];
	const result = await sampleNativeHydration(backend, entries, 1, 2, async () => {});
	expect(result.entries).toBe(1);
	expect(result.rootsWithRecord).toBe(1);
	expect(result.refused.map(({ entry, stage }) => [entry, stage])).toEqual([
		['refused', 'parse'],
		['leaf', 'render']
	]);
	expect(Object.keys(result.timings)).toEqual(['parse', 'render', 'pipeline']);
	for (const phase of ['parse', 'render', 'pipeline'] as const) expect(result.timings[phase]).toHaveLength(2);
	expect(result.render.bytes).toBe(2);
	expect(result.render.sha256).toMatch(/^[a-f\d]{64}$/);
	expect(parseRecords).toHaveBeenCalledTimes(6);
	expect(render).toHaveBeenCalledTimes(4);
	expect(engines).toBe(4);
	expect(dispose).toHaveBeenCalledTimes(4);
	expect(roots.size).toBe(0);
	expect(parse).not.toHaveBeenCalled();
	expect(read).not.toHaveBeenCalled();
	render.mockImplementationOnce(() => 'ok').mockImplementationOnce(() => 'changed output');
	await expect(sampleNativeHydration(backend, entries, 0, 1, async () => {})).rejects.toThrow(
		'native render workload changed'
	);
	expect(dispose).toHaveBeenCalledTimes(6);
	const { parseRecords: _absent, ...older } = backend as unknown as Record<string, unknown>;
	await expect(
		sampleNativeHydration(older as unknown as typeof backend, entries, 0, 1, async () => {})
	).rejects.toThrow('native workflow needs an addon exposing parseRecords and readRenderAt');
	expect(dispose).toHaveBeenCalledTimes(7);
});

it('refuses native workload drift between rounds', () => {
	const memory = { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 };
	const first: NativeHydrationRun = {
		grammar: 'regex',
		pid: 1,
		corpus: { entries: 2, bytes: 4, sha256: 'same' },
		entries: 2,
		rootsWithRecord: 1,
		refused: [],
		render: { bytes: 4, sha256: 'rendered' },
		memory: { baseline: memory, native: memory },
		timings: { parse: [1], render: [1], pipeline: [2] }
	};
	expect(() => summarizeNativeHydration([first, { ...first, entries: 1 }])).toThrow('workload mismatch');
	expect(() =>
		summarizeNativeHydration([first, { ...first, refused: [{ entry: 'changed', stage: 'parse', error: 'refused' }] }])
	).toThrow('workload mismatch');
	expect(() => summarizeNativeHydration([first, { ...first, render: { ...first.render, sha256: 'changed' } }])).toThrow(
		'workload mismatch'
	);
});
