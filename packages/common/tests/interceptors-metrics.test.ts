import { afterEach, describe, expect, it, vi } from 'vitest';
import rust, { type RustAPI } from '@sittir/rust';
import type { Engine, Interceptor, Language } from '@sittir/types';
import { createEngine } from '../src/create-engine.ts';

const { recordFfi } = vi.hoisted(() => ({ recordFfi: vi.fn() }));
vi.mock('../src/metrics.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('../src/metrics.ts')>()),
	metricsEnabled: true,
	recordFfi
}));

const engines: Engine<RustAPI>[] = [];
afterEach(() => {
	for (const engine of engines.splice(0)) engine.dispose();
	recordFfi.mockClear();
});

async function measuredEngine(render: NonNullable<Interceptor<RustAPI>['render']>, failure?: Error) {
	const hooks = await rust.load();
	const counts = { captured: 0, materialized: 0, released: 0 };
	const language: Language<RustAPI> = {
		...rust,
		createEngine: (options) => createEngine(language, options),
		load: async () => ({
			...hooks,
			createNative(options) {
				const native = hooks.createNative(options);
				return {
					...native,
					render(node, options) {
						const rendered = native.render(node, options);
						counts.captured++;
						return {
							...rendered,
							toString() {
								counts.materialized++;
								if (failure !== undefined) throw failure;
								return rendered.toString();
							},
							[Symbol.dispose]() {
								counts.released++;
								rendered[Symbol.dispose]();
							}
						};
					}
				};
			}
		})
	};
	const engine = await createEngine(language, { intercept: [{ render }] });
	engines.push(engine);
	return { engine, counts };
}

describe('render middleware with metrics enabled', () => {
	it('preserves direct-path measurement without middleware', async () => {
		const engine = await createEngine(rust);
		engines.push(engine);
		const output = engine.render(engine.build.identifier('direct'));
		expect(recordFfi).toHaveBeenCalledTimes(1);
		expect(output.toString()).toBe('direct');
		output[Symbol.dispose]();
	});

	it('short-circuits a failing native renderer without materialization or metrics', async () => {
		const { engine, counts } = await measuredEngine(() => 'cached', new Error('native materialization'));
		const output = engine.render(engine.build.identifier('value'));
		expect(counts).toEqual({ captured: 1, materialized: 0, released: 0 });
		expect(output.toString()).toBe('cached');
		expect(recordFfi).not.toHaveBeenCalled();
		output[Symbol.dispose]();
		expect(counts).toEqual({ captured: 1, materialized: 0, released: 1 });
	});

	it('records one native materialization when the continuation runs', async () => {
		const { engine, counts } = await measuredEngine((_call, next) => next());
		const output = engine.render(engine.build.identifier('value'));
		expect(recordFfi).not.toHaveBeenCalled();
		expect(counts.materialized).toBe(0);
		expect(output.toString()).toBe('value');
		expect(output.toString()).toBe('value');
		expect(counts.materialized).toBe(1);
		expect(recordFfi).toHaveBeenCalledTimes(1);
		output[Symbol.dispose]();
		expect(counts.released).toBe(1);
	});
});
