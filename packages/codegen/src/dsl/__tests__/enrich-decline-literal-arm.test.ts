/**
 * Split justification — `armsDifferOnlyByLiteralChoice`: a choice arm
 * whose only delta against a sibling is a literal-choice position stays
 * unminted (the literal belongs in the parent's enum slot; splitting
 * would mint a form whose sole difference is a determined enum).
 */

import { describe, expect, it } from 'vitest';
import { armsDifferOnlyByLiteralChoice } from '../rule-patterns.ts';
import type { Rule } from '../../types/rule.ts';

const sym = (name: string) => ({ type: 'SYMBOL', name }) as unknown as Rule;
const str = (value: string) => ({ type: 'STRING', value }) as unknown as Rule;
const seq = (...members: Rule[]) => ({ type: 'SEQ', members }) as unknown as Rule;
const choice = (...members: Rule[]) => ({ type: 'CHOICE', members }) as unknown as Rule;
const field = (name: string, content: Rule) => ({ type: 'FIELD', name, content }) as unknown as Rule;

describe('armsDifferOnlyByLiteralChoice', () => {
	it('matches arms whose only delta is one literal vs a literal choice', () => {
		const a = seq(sym('expr'), str('in'), sym('expr'));
		const b = seq(sym('expr'), choice(str('+'), str('-')), sym('expr'));
		expect(armsDifferOnlyByLiteralChoice(a, b)).toBe(true);
	});

	it('matches through identical field wrappers around the literal position', () => {
		const a = seq(field('left', sym('expr')), field('operator', str('in')), field('right', sym('expr')));
		const b = seq(
			field('left', sym('expr')),
			field('operator', choice(str('<'), str('>'))),
			field('right', sym('expr'))
		);
		expect(armsDifferOnlyByLiteralChoice(a, b)).toBe(true);
	});

	it('declines arms with a structural delta (a different symbol beside the literal)', () => {
		// binary_expression's `in` arm widens `left` to include
		// private_property_identifier — structural, so the split stays.
		const a = seq(field('left', choice(sym('expr'), sym('private_property_identifier'))), str('in'), sym('expr'));
		const b = seq(field('left', sym('expr')), choice(str('+'), str('-')), sym('expr'));
		expect(armsDifferOnlyByLiteralChoice(a, b)).toBe(false);
	});

	it('declines arms differing at TWO literal positions (distinct forms, not one enum)', () => {
		// meta_property: `new . target` vs `import . meta` — folding these
		// into one kind with two enum slots would admit `new.meta`.
		const a = seq(str('new'), str('.'), str('target'));
		const b = seq(str('import'), str('.'), str('meta'));
		expect(armsDifferOnlyByLiteralChoice(a, b)).toBe(false);
	});

	it('declines arms with different member counts or identical arms', () => {
		const a = seq(sym('expr'), str('in'));
		const b = seq(sym('expr'), str('in'), sym('expr'));
		expect(armsDifferOnlyByLiteralChoice(a, b)).toBe(false);
		expect(armsDifferOnlyByLiteralChoice(b, b)).toBe(false);
	});
});
