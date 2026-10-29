import { describe, expect, it } from 'vitest';
import { runPortableRoundTrip } from '../portable-round-trip.ts';

const CARRIED_CEILING = {
	python: 58,
	rust: 40,
	typescript: 40
};

describe('the portable round trip', () => {
	it('reads each entry of a bound grammar from its root, builds it back, and reparses its render to the same tree', async () => {
		const result = await runPortableRoundTrip('rust', [
			{ name: 'function', source: 'pub async fn f(a: u8) {}' },
			{ name: 'closure', source: 'fn g() { |a, mut b, _| a; }' }
		]);
		expect(result).toMatchObject({ total: 2, pass: 2, astMatchPass: 2, carried: [], errors: [], astMismatches: [] });
	});

	it('counts an entry the read carries a node of whole, with the flags no arm at its path builds', async () => {
		const result = await runPortableRoundTrip('rust', [{ name: 'byte', source: "let c = b'a';" }]);
		expect(result).toMatchObject({ total: 1, pass: 1, carried: [{ entry: 'byte', carries: [{ reason: 'flags', flags: ['byte'] }] }] });
	});

	it('runs only for a grammar whose bindings give it a portable surface', async () => {
		expect(await runPortableRoundTrip('scm', [{ name: 'node', source: '(a)' }])).toBeUndefined();
	});
});

describe.each(Object.entries(CARRIED_CEILING))('the portable round trip over the %s corpus', (grammar, ceiling) => {
	it(`carries ${ceiling} entries whole: a new carry is a regression, and the count only shrinks as the bindings claim the kinds and flags carried`, async () => {
		expect((await runPortableRoundTrip(grammar))?.carried.length).toBe(ceiling);
	}, 300_000);
});
