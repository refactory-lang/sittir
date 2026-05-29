import { describe, expect, it } from 'vitest';
import { opaqueFacts, readFacts } from '../opaque-facts.ts';

describe('opaque-facts', () => {
	it('round-trips facts through the write → read seams', () => {
		const f = opaqueFacts({ origin: 'kind', count: 7 });
		expect(readFacts<{ origin: string; count: number }>(f)).toEqual({ origin: 'kind', count: 7 });
	});

	it('blocks compiler reads at the type level (the enforcement invariant)', () => {
		const f = opaqueFacts({ origin: 'kind' });
		// @ts-expect-error — OpaqueFacts exposes no readable keys, so the compiler
		// cannot index a fact. Reading is allowed ONLY via the explicit `readFacts`
		// seam (validator/diagnostics). If this line ever stops erroring, the brand
		// has been weakened and metadata-not-behavior is no longer type-enforced.
		const leak = f.origin;
		void leak;
		expect(readFacts<{ origin: string }>(f).origin).toBe('kind');
	});
});
