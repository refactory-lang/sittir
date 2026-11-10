import { afterAll } from 'vitest';

export { liveEngineCount } from './engine-census.ts';

export async function sharedEngine<E extends { [Symbol.dispose](): void }>(create: () => Promise<E>): Promise<E> {
	const engine = await create();
	afterAll(() => engine[Symbol.dispose]());
	return engine;
}
