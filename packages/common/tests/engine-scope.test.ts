import { describe, expect, it } from 'vitest';
import type { EngineIdentity } from '@sittir/types';
import { currentHandle, inEngine, isLive, type EngineHandle, type LiveEngine } from '../src/engine-scope.ts';

const identity: EngineIdentity = {
	language: { name: 'fake', load: () => Promise.reject(new Error('type-only')) },
	renderModuleHash: 'hash',
	options: {},
	trivia: { kindName: () => undefined, kinds: new Set<string>(), innerGaps: {} }
};

function handleOf(label: string): EngineHandle {
	const live: LiveEngine = {
		...identity,
		render: () => Object.assign(() => label, { toString: () => label }) as never
	};
	return { current: live };
}

describe('engine scope', () => {
	it('has no handle outside a call', () => {
		expect(currentHandle()).toBeUndefined();
	});

	it('exposes the handle to the synchronous call and restores afterwards', () => {
		const a = handleOf('a');
		const seen = inEngine(a, () => currentHandle());
		expect(seen).toBe(a);
		expect(currentHandle()).toBeUndefined();
	});

	it('nests, the inner handle winning and the outer one restored', () => {
		const a = handleOf('a');
		const b = handleOf('b');
		inEngine(a, () => {
			inEngine(b, () => expect(currentHandle()).toBe(b));
			expect(currentHandle()).toBe(a);
		});
		expect(currentHandle()).toBeUndefined();
	});

	it('restores after a throw', () => {
		const a = handleOf('a');
		expect(() =>
			inEngine(a, () => {
				throw new Error('boom');
			})
		).toThrow('boom');
		expect(currentHandle()).toBeUndefined();
	});

	it('returns what the call returns', () => {
		expect(inEngine(handleOf('a'), () => 42)).toBe(42);
	});

	it('tells a live engine from its identity', () => {
		const handle = handleOf('a');
		expect(isLive(handle.current)).toBe(true);
		handle.current = identity;
		expect(isLive(handle.current)).toBe(false);
	});
});
