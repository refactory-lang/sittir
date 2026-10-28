import { describe, expect, it } from 'vitest';
import { runPortableRoundTrip } from '../portable-round-trip.ts';

describe('the portable round trip', () => {
	it('reads each entry of a bound grammar from its root, builds it back, and reparses its render to the same tree', async () => {
		const result = await runPortableRoundTrip('rust', [
			{ name: 'function', source: 'pub async fn f(a: u8) {}' },
			{ name: 'closure', source: 'fn g() { |a, mut b, _| a; }' }
		]);
		expect(result).toMatchObject({ total: 2, pass: 2, astMatchPass: 2, errors: [], astMismatches: [] });
	});

	it('runs only for a grammar whose bindings give it a portable surface', async () => {
		expect(await runPortableRoundTrip('scm', [{ name: 'node', source: '(a)' }])).toBeUndefined();
	});
});
