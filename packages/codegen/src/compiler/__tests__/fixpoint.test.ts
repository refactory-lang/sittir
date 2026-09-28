import { describe, it, expect } from 'vitest';
import { runToFixpoint } from '../fixpoint.ts';

describe('runToFixpoint', () => {
	it('returns once the step reports no change', () => {
		let calls = 0;
		runToFixpoint({
			name: 'test.converges',
			cap: 16,
			step: () => {
				calls++;
				return calls < 3;
			}
		});
		expect(calls).toBe(3);
	});

	it('throws, naming the pass, when a cycling step never converges', () => {
		expect(() => runToFixpoint({ name: 'test.cyclingPass', cap: 4, step: () => true })).toThrow(
			/test\.cyclingPass: did not converge within 4 passes/
		);
	});
});
