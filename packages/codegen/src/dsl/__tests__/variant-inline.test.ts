import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../compiler/__tests__/_temp-grammar.ts';

const rules = "k: ($) => choice(seq('x', $.y), seq('z', $.y)), y: () => /y/";

const withoutIds = (value: unknown): unknown => {
	if (Array.isArray(value)) return value.map(withoutIds);
	if (value === null || typeof value !== 'object') return value;
	return Object.fromEntries(
		Object.entries(value)
			.filter(([key]) => key !== 'id')
			.map(([key, inner]) => [key, withoutIds(inner)])
	);
};


describe('variant() inline equals the variant entry', () => {
	it('re-authors a choice of arms the way the entries do, with the same rules, annotations and patch sites', async () => {
		const inline = await evaluateTempGrammar({ extras: '', rules }, '', {
			bindings: "rules: { k: ($) => choice(variant('a', seq('x', $.y)), variant('b', seq('z', $.y))) }"
		});
		const keyed = await evaluateTempGrammar({ extras: '', rules }, '', {
			bindings: "rules: { k: ($) => choice(seq('x', $.y), seq('z', $.y)) }, edits: { k: { '0': variant('a'), '1': variant('b') } }"
		});
		expect(withoutIds(inline.rules)).toEqual(withoutIds(keyed.rules));
		expect(inline.patchSites).toEqual(keyed.patchSites);
	}, 60_000);

	it('keeps the label of an arm an entry edits inside, as the entry form keeps its variant', async () => {
		const inline = await evaluateTempGrammar({ extras: '', rules }, '', {
			bindings: "rules: { k: ($) => choice(variant('a', seq('x', $.y)), seq('z', $.y)) }, edits: { k: { '0/1': field('q') } }"
		});
		const keyed = await evaluateTempGrammar({ extras: '', rules }, '', {
			bindings: "rules: { k: ($) => choice(seq('x', $.y), seq('z', $.y)) }, edits: { k: { '0': variant('a'), '0/1': field('q') } }"
		});
		expect(Object.keys(inline.rules)).toContain('k_a');
		expect(withoutIds(inline.rules)).toEqual(withoutIds(keyed.rules));
	}, 60_000);

	it('carries an options argument through to the arm, as the entry form does', async () => {
		const inline = await evaluateTempGrammar({ extras: '', rules }, '', {
			bindings: "rules: { k: ($) => choice(variant('a', seq('x', $.y), { default: true }), variant('b', seq('z', $.y))) }"
		});
		const keyed = await evaluateTempGrammar({ extras: '', rules }, '', {
			bindings: "rules: { k: ($) => choice(seq('x', $.y), seq('z', $.y)) }, edits: { k: { '0': variant('a', { default: true }), '1': variant('b') } }"
		});
		expect(withoutIds(inline.rules)).toEqual(withoutIds(keyed.rules));
		expect(inline.patchSites).toEqual(keyed.patchSites);
	}, 60_000);
});
