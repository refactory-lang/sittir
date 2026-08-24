/**
 * Split justification — `isPermutationChoice`: a choice whose arms are
 * permutations of one modifier-slot set (same atom set, different
 * ordering/optionality) stays unminted — the markers collapse into the
 * parent's own slots instead of minting per-arm kinds
 * (public_field_definition's modifier positions are the exemplar).
 */

import { describe, expect, it } from 'vitest';
import { isPermutationChoice } from '../group-classify.ts';

const sym = (name: string) => ({ type: 'SYMBOL', name });
const str = (value: string) => ({ type: 'STRING', value });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
const choice = (...members: unknown[]) => ({ type: 'CHOICE', members });
const opt = (content: unknown) => ({ type: 'OPTIONAL', content });
const field = (name: string, content: unknown) => ({ type: 'FIELD', name, content });

describe('isPermutationChoice', () => {
	it('accepts declare/access permutation arms (public_field_definition pos 1)', () => {
		const arms = choice(
			seq(str('declare'), opt(sym('accessibility_modifier'))),
			seq(sym('accessibility_modifier'), opt(str('declare')))
		);
		expect(isPermutationChoice(arms)).toBe(true);
	});

	it('resolves a promoted marker field to its keyword so mixed spellings key equal', () => {
		const kwRules = { _kw_declare_marker: str('declare') };
		const arms = choice(
			seq(str('declare'), opt(sym('accessibility_modifier'))),
			seq(sym('accessibility_modifier'), opt(field('declare_marker', sym('_kw_declare_marker'))))
		);
		expect(isPermutationChoice(arms, undefined, kwRules)).toBe(true);
		// Without the kwRules bag the promoted spelling cannot key to the raw
		// literal — the assertion pair pins that the resolution is what makes
		// the arms match.
		expect(isPermutationChoice(arms)).toBe(false);
	});

	it('declines arms with different slot sets (alternatives, not permutations)', () => {
		// rust function_type's trait-form/fn-form arms share `parameters` but
		// carry distinct discriminators — a real form split, not a modifier
		// permutation.
		const arms = choice(seq(sym('trait_bound'), sym('parameters')), seq(str('fn'), sym('parameters')));
		expect(isPermutationChoice(arms)).toBe(false);
	});

	it('declines byte-identical duplicate arms', () => {
		const arm = () => seq(str('static'), opt(str('readonly')));
		expect(isPermutationChoice(choice(arm(), arm()))).toBe(false);
	});

	it('declines arms containing non-atom steps (repeat / nested seq)', () => {
		const arms = choice(
			seq(str('static'), { type: 'REPEAT', content: sym('decorator') }),
			seq({ type: 'REPEAT', content: sym('decorator') }, str('static'))
		);
		expect(isPermutationChoice(arms)).toBe(false);
	});

	it('declines non-word literal steps (punctuation is not a modifier)', () => {
		const arms = choice(seq(str('('), sym('expr')), seq(sym('expr'), str('(')));
		expect(isPermutationChoice(arms)).toBe(false);
	});
});
