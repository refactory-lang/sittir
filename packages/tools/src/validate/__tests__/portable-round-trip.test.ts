import { describe, expect, it } from 'vitest';
import { runPortableRoundTrip } from '../portable-round-trip.ts';

const CARRIED_CEILING = {
	python: 7,
	rust: 10,
	typescript: 8
};

const CARRIED_PAIRS: Record<keyof typeof CARRIED_CEILING, readonly string[]> = {
	python: [
		'float_point scalar',
		'float_scientific scalar',
		'key_value_pattern unclaimed',
		'string readOnly'
	],
	rust: [
		'char_literal_plain flags',
		'float_literal scalar',
		'impl_item_negative_clause unclaimed',
		'impl_item_positive_clause unclaimed',
		'integer_literal_binary scalar',
		'integer_literal_decimal scalar',
		'integer_literal_hex scalar',
		'integer_literal_octal scalar',
		'method_declaration flags',
		'use_wildcard_group unclaimed'
	],
	typescript: ['extends_clause_single unclaimed', 'for_header_lhs unclaimed']
};

describe('the portable round trip', () => {
	it('reads each entry of a bound grammar from its root, builds it back, and reparses its render to the same tree', async () => {
		const result = await runPortableRoundTrip('rust', [
			{ name: 'function', source: 'pub async fn f(a: u8) {}' },
			{ name: 'closure', source: 'fn g() { |a, mut b, _| a; }' }
		]);
		expect(result).toMatchObject({ total: 2, pass: 2, astMatchPass: 2, carried: [], errors: [], astMismatches: [] });
	});

	it('builds a form with no content back through its nullary builder', async () => {
		const result = await runPortableRoundTrip('rust', [{ name: 'bare range', source: 'fn f() { ..; }' }]);
		expect(result).toMatchObject({ total: 1, pass: 1, astMatchPass: 1, carried: [], errors: [], astMismatches: [] });
	});

	it('counts an entry the read carries a node of whole, with the flags no arm at its path builds', async () => {
		const result = await runPortableRoundTrip('rust', [{ name: 'byte', source: "let c = b'a';" }]);
		expect(result).toMatchObject({
			total: 1,
			pass: 1,
			carried: [{ entry: 'byte', carries: [{ reason: 'flags', flags: ['byte'] }] }]
		});
	});

	it('counts a carry a parse error forces apart from the carried entries: it marks a fault of the input, not a gap of the bindings', async () => {
		const result = await runPortableRoundTrip('typescript', [{ name: 'signed literal type', source: 'let x: 2 | +4;' }]);
		expect(result).toMatchObject({
			total: 1,
			carried: [],
			erred: [{ entry: 'signed literal type', carries: [{ kind: 'literal_type', reason: 'error' }] }],
			armless: [],
			errors: [{ entry: 'signed literal type', stage: 'reparse', rendered: 'let x: 2 | +4;\n' }]
		});
	});

	it('runs only for a grammar whose bindings give it a portable surface', async () => {
		expect(await runPortableRoundTrip('scm', [{ name: 'node', source: '(a)' }])).toBeUndefined();
	});
});

describe.each(Object.entries(CARRIED_CEILING))('the portable round trip over the %s corpus', (grammar, ceiling) => {
	it(`carries ${ceiling} entries whole, by a fixed set of kinds and reasons: a new carry or a new carried kind is a regression, and both only shrink as the bindings claim the kinds and flags carried; no node a path claims is carried as unclaimed`, async () => {
		const result = await runPortableRoundTrip(grammar);
		const pairs = [
			...new Set(
				(result?.carried ?? []).flatMap(({ carries }) => carries.map(({ kind, reason }) => `${kind} ${reason}`))
			)
		].sort();
		expect(pairs).toEqual(CARRIED_PAIRS[grammar as keyof typeof CARRIED_CEILING]);
		expect(result?.carried.length).toBe(ceiling);
		expect(result?.armless).toEqual([]);
	}, 300_000);
});
