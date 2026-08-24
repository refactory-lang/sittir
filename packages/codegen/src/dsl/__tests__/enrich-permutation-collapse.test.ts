/**
 * Integration coverage for the permutation-choice collapse: enrich() must
 * BOTH decline the choice-arm mint AND normalize a required raw keyword
 * step into the shared `field('<kw>_marker', $._kw_<kw>_marker)` spelling,
 * so the arms' slots merge on the parent (public_field_definition's
 * modifier positions are the exemplar).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { enrich } from '../enrich.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

beforeAll(() => installFakeDsl());
afterAll(() => restoreFakeDsl());

function mkGrammar(rules: Record<string, unknown>) {
	return { grammar: { name: 'test', rules } };
}

function runEnrich(input: ReturnType<typeof mkGrammar>) {
	return enrich(input as unknown as Parameters<typeof enrich>[0]) as unknown as {
		grammar: { name: string; rules: Record<string, unknown> };
	};
}

describe('enrich — permutation-choice collapse', () => {
	const input = () =>
		mkGrammar({
			parent: {
				type: 'SEQ',
				members: [
					{ type: 'FIELD', name: 'name', content: { type: 'SYMBOL', name: 'identifier' } },
					{
						type: 'OPTIONAL',
						content: {
							type: 'CHOICE',
							members: [
								{
									type: 'SEQ',
									members: [
										{ type: 'STRING', value: 'declare' },
										{ type: 'OPTIONAL', content: { type: 'SYMBOL', name: 'access_modifier' } }
									]
								},
								{
									type: 'SEQ',
									members: [
										{ type: 'SYMBOL', name: 'access_modifier' },
										{ type: 'OPTIONAL', content: { type: 'STRING', value: 'declare' } }
									]
								}
							]
						}
					}
				]
			},
			access_modifier: { type: 'STRING', value: 'public' },
			identifier: { type: 'PATTERN', value: '[a-z]+' }
		});

	it('mints no arm/group kinds for the permutation choice', () => {
		const out = runEnrich(input());
		const minted = Object.keys(out.grammar.rules).filter((k) => /parent_(arm|group|optional)\d*/.test(k));
		expect(minted).toEqual([]);
	});

	it('normalizes the required raw keyword to the shared marker field', () => {
		const out = runEnrich(input());
		expect(out.grammar.rules['_kw_declare_marker']).toBeDefined();
		const json = JSON.stringify(out.grammar.rules['parent']);
		// Required spelling (arm 1) and the optional spelling (arm 2, promoted
		// by the optional-keyword pass) both carry the ONE marker field.
		expect(json).toContain('"declare_marker"');
		expect(json).toContain('_kw_declare_marker');
		expect(json).not.toContain('"value":"declare"');
	});
});
