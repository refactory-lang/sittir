import { describe, expect, it } from 'vitest';
import { sharedEngine } from '../src/testing.ts';

const disposable = () => {
	const state = { disposed: 0 };
	return { state, [Symbol.dispose]: () => void (state.disposed += 1) };
};

const held = await sharedEngine(async () => disposable());

describe('sharedEngine', () => {
	it('holds an engine created at file scope until the file ends', () => {
		expect(held.state.disposed).toBe(0);
	});

	it('refuses inside a running test, naming it, without creating the engine', async () => {
		let created = 0;
		await expect(
			sharedEngine(async () => {
				created += 1;
				return disposable();
			})
		).rejects.toThrow('sharedEngine was called inside a running test; its teardown would never run');
		expect(created).toBe(0);
	});
});
