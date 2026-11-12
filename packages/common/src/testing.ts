import { afterAll, TestRunner } from 'vitest';

export { liveEngineCount } from './engine-census.ts';

export async function sharedEngine<E extends { [Symbol.dispose](): void }>(create: () => Promise<E>): Promise<E> {
	if (TestRunner.getCurrentTest() !== undefined) {
		throw new Error('sharedEngine was called inside a running test; its teardown would never run. Hold the engine with `using` in the test, or create it at file scope');
	}
	const engine = await create();
	afterAll(() => engine[Symbol.dispose]());
	return engine;
}
