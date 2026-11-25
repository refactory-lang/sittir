import { describe, expect, it } from 'vitest';
import { nativeEngineOf, type NativeModuleLike } from '../src/engine.ts';

function recording() {
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
			dispose = () => {};
		},
		builtBump: call('builtBump'),
		releaseBuilt: call('releaseBuilt'),
		renderBuilt: call('renderBuilt')
	} as unknown as NativeModuleLike;
	return { calls, engine: nativeEngineOf(native) };
}

describe('holds past a saturated count', () => {
	it('cross to native once per address, before the next engine call', () => {
		const { calls, engine } = recording();
		for (let held = 0; held < 500; held++) engine.holdSaturated!(64);
		engine.holdSaturated!(96);
		expect(calls).toEqual([]);
		engine.releaseBuilt!(64, 0, false);
		expect(calls).toEqual([
			['builtBump', 64, 500],
			['builtBump', 96, 1],
			['releaseBuilt', 64, 0, false]
		]);
	});

	it('are told once', () => {
		const { calls, engine } = recording();
		engine.holdSaturated!(64);
		engine.releaseBuilt!(64, 0, false);
		engine.releaseBuilt!(64, 0, false);
		expect(calls.filter(([name]) => name === 'builtBump')).toEqual([['builtBump', 64, 1]]);
	});

	it('are told before a render reads them', () => {
		const { calls, engine } = recording();
		engine.holdSaturated!(64);
		engine.renderBuilt!({}, 64, false, false);
		expect(calls.map(([name]) => name)).toEqual(['builtBump', 'renderBuilt']);
	});

	it('go with a disposed engine', () => {
		const { calls, engine } = recording();
		engine.holdSaturated!(64);
		engine.dispose();
		expect(calls).toEqual([]);
	});
});
