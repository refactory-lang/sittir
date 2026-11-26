import { describe, expect, it } from 'vitest';
import { nativeEngineOf, type NativeModuleLike } from '../src/engine.ts';

function recording(refusal?: Error) {
	const calls: unknown[][] = [];
	const handle = {};
	const call =
		(name: string) =>
		(...[, ...args]: unknown[]) => {
			calls.push([name, ...args]);
		};
	const native = {
		SittirEngine: class {
			readonly handle = handle;
			parse = () => '';
			dispose = () => void calls.push(['dispose']);
		},
		builtBump: call('builtBump'),
		releaseBuilt: (_: object, batch: Float64Array) => {
			calls.push(['releaseBuilt', [...batch]]);
			if (refusal !== undefined) throw refusal;
		},
		renderBuilt: call('renderBuilt'),
		builtMemory: call('builtMemory')
	} as unknown as NativeModuleLike;
	return { calls, engine: nativeEngineOf(native) };
}

describe('a batched release', () => {
	it('crosses to native in one call for every release before the next engine call', () => {
		const { calls, engine } = recording();
		engine.releaseBuilt!(64, 0);
		engine.releaseBuilt!(96, 257);
		expect(calls).toEqual([]);
		engine.builtMemory!();
		expect(calls).toEqual([['releaseBuilt', [64, 0, 96, 257]], ['builtMemory']]);
	});

	it('crosses after the holds told before it, and once', () => {
		const { calls, engine } = recording();
		engine.holdSaturated!(64);
		engine.releaseBuilt!(64, 0);
		engine.renderBuilt!({}, 8, false, false);
		engine.renderBuilt!({}, 8, false, false);
		expect(calls.map(([name]) => name)).toEqual(['builtBump', 'releaseBuilt', 'renderBuilt', 'renderBuilt']);
	});

	it('crosses at the end of the microtask when no engine call comes first', async () => {
		const { calls, engine } = recording();
		engine.releaseBuilt!(64, 0);
		await Promise.resolve();
		expect(calls).toEqual([['releaseBuilt', [64, 0]]]);
	});

	it('surfaces a refusal on the engine call that crosses with it, not on the release', () => {
		const refusal = new Error('released count');
		const { engine } = recording(refusal);
		engine.releaseBuilt!(64, 0);
		expect(() => engine.renderBuilt!({}, 8, false, false)).toThrow(refusal);
		expect(() => engine.renderBuilt!({}, 8, false, false)).not.toThrow();
	});

	it('surfaces a refusal from the end of the microtask on the next engine call', async () => {
		const refusal = new Error('released count');
		const { engine } = recording(refusal);
		engine.releaseBuilt!(64, 0);
		await Promise.resolve();
		expect(() => engine.renderBuilt!({}, 8, false, false)).toThrow(refusal);
		expect(() => engine.renderBuilt!({}, 8, false, false)).not.toThrow();
	});

	it('crosses what waits when the engine is disposed, then disposes it', async () => {
		const { calls, engine } = recording();
		engine.releaseBuilt!(64, 0);
		engine.dispose();
		await Promise.resolve();
		expect(calls).toEqual([['releaseBuilt', [64, 0]], ['dispose']]);
	});

	it('surfaces a refusal met crossing on dispose from that dispose, the engine disposed', () => {
		const refusal = new Error('released count');
		const { calls, engine } = recording(refusal);
		engine.releaseBuilt!(64, 0);
		expect(() => engine.dispose()).toThrow(refusal);
		expect(calls.at(-1)).toEqual(['dispose']);
	});

	it('surfaces a refusal from the end of the microtask on dispose when no engine call comes first', async () => {
		const refusal = new Error('released count');
		const { calls, engine } = recording(refusal);
		engine.releaseBuilt!(64, 0);
		await Promise.resolve();
		expect(() => engine.dispose()).toThrow(refusal);
		expect(calls.at(-1)).toEqual(['dispose']);
	});
});
