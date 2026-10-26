import { expect, it, vi } from 'vitest';
import { sampleNativeHydration } from '../src/profile/native-hydration.ts';
import { summarizeNativeHydration } from '../src/profile/storage.ts';
import type { NativeHydrationRun } from '../src/profile/native-hydration-worker.ts';

it('hydrates native trees with depth, transfers no node data, and disposes every tree including refusals', async () => {
	const live = new Map<number, string>();
	let next = 0;
	const chunk = vi.fn(() => {
		throw new Error('chunk copy requested');
	});
	const read = vi.fn(() => {
		throw new Error('object data requested');
	});
	const hydrate = vi.fn((id: number, _index: number, depth: number) => {
		expect(depth).toBe(Infinity);
		if (live.get(id) === 'refused') throw new Error('native refusal');
		return live.get(id) === 'leaf' ? null : 17;
	});
	const shallow = vi.fn((_id: number, index: number, depth: number) => {
		expect(index).toBe(0);
		expect(depth).toBe(1);
		return 17;
	});
	const render = vi.fn((id: number, address: number, leading: boolean, trailing: boolean) => {
		expect(address).toBe(17);
		expect([leading, trailing]).toEqual([false, false]);
		return live.get(id)!;
	});
	const dispose = vi.fn();
	const backend = {
		SittirEngine: class {
			parse(source: string) {
				live.set(++next, source);
				return JSON.stringify({ treeId: next });
			}
			read = read;
			chunk = chunk;
			hydrateRecord = hydrate;
			readRecord = shallow;
			renderRecord = render;
			dispose = dispose;
		},
		disposeTree(id: number) {
			expect(live.delete(id)).toBe(true);
		}
	} as unknown as Parameters<typeof sampleNativeHydration>[0];
	const entries = ['ok', 'leaf', 'refused'].map((source) => ({ name: source, source })) as Parameters<
		typeof sampleNativeHydration
	>[1];
	const result = await sampleNativeHydration(backend, entries, 'all', 1, 2, async () => {});
	expect(result.entries).toBe(1);
	expect(result.rootsWithRecord).toBe(1);
	expect(result.refused.map(({ entry, stage }) => [entry, stage])).toEqual([
		['refused', 'hydrate'],
		['leaf', 'render']
	]);
	for (const phase of ['parse', 'hydrate', 'render', 'pipeline', 'afterShallow'] as const)
		expect(result.timings[phase]).toHaveLength(2);
	expect(result.render.bytes).toBe(2);
	expect(result.render.sha256).toMatch(/^[a-f\d]{64}$/);
	expect(shallow).toHaveBeenCalledTimes(3);
	expect(render).toHaveBeenCalledTimes(4);
	expect(live.size).toBe(0);
	expect(dispose).toHaveBeenCalledOnce();
	expect(chunk).not.toHaveBeenCalled();
	expect(read).not.toHaveBeenCalled();
	render.mockImplementationOnce(() => 'changed output');
	await expect(sampleNativeHydration(backend, entries, 'all', 0, 1, async () => {})).rejects.toThrow(
		'native render workload changed'
	);
	expect(live.size).toBe(0);
	expect(dispose).toHaveBeenCalledTimes(2);
});

it('refuses native workload or depth drift between rounds', () => {
	const memory = { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 };
	const first: NativeHydrationRun = {
		grammar: 'regex',
		pid: 1,
		corpus: { entries: 2, bytes: 4, sha256: 'same' },
		depth: 2,
		entries: 2,
		rootsWithRecord: 1,
		refused: [],
		render: { bytes: 4, sha256: 'rendered' },
		memory: { baseline: memory, native: memory },
		timings: { parse: [1], hydrate: [1], render: [1], pipeline: [3], afterShallow: [2] }
	};
	expect(() => summarizeNativeHydration([first, { ...first, depth: 'all' }])).toThrow('workload mismatch');
	expect(() =>
		summarizeNativeHydration([first, { ...first, refused: [{ entry: 'changed', stage: 'hydrate', error: 'refused' }] }])
	).toThrow('workload mismatch');
	expect(() => summarizeNativeHydration([first, { ...first, render: { ...first.render, sha256: 'changed' } }])).toThrow(
		'workload mismatch'
	);
});
