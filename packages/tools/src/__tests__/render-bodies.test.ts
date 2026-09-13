import { describe, expect, it } from 'vitest';
import { bodyToLegacyRule } from '../validate/render-bodies.ts';
import type { RenderBody } from '../codegen-surface.ts';
import { INDENT_TEXT, DEDENT_TEXT } from '../../../codegen/src/dsl/primitives/spacing.ts';

describe('bodyToLegacyRule', () => {
	it('spells a slot as its placeholder and keeps text verbatim', () => {
		const body: RenderBody = [
			{ kind: 'text', text: 'fn ' },
			{ kind: 'slot', name: 'name' },
			{ kind: 'seam', field: 'lparen_before' },
			{ kind: 'text', text: '(' },
			{ kind: 'adjacent' },
			{ kind: 'slot', name: 'parameters' },
			{ kind: 'text', text: ')' }
		];
		expect(bodyToLegacyRule(body)).toBe('fn $NAME($PARAMETERS)');
	});

	it('turns a gate into a clause placeholder with the arm as the clause body', () => {
		const body: RenderBody = [
			{ kind: 'slot', name: 'name' },
			{
				kind: 'if',
				arms: [{ test: 'type', body: [{ kind: 'text', text: ': ' }, { kind: 'slot', name: 'type' }] }],
				fallback: undefined
			}
		];
		expect(bodyToLegacyRule(body)).toEqual({ template: '$NAME$TYPE_CLAUSE', type_clause: ': $TYPE' });
	});

	it('inlines a fallback and contributes the depth arms\' and a token seam\'s own text', () => {
		const body: RenderBody = [
			{ kind: 'indent' },
			{ kind: 'slot', name: 'block' },
			{ kind: 'dedent' },
			{ kind: 'tokenSeam', text: '\n' },
			{
				kind: 'if',
				arms: [{ test: 'a', body: [{ kind: 'slot', name: 'a' }] }],
				fallback: [{ kind: 'text', text: '_' }]
			},
			{ kind: 'space' }
		];
		expect(bodyToLegacyRule(body)).toEqual({
			template: `${INDENT_TEXT}$BLOCK${DEDENT_TEXT}\n$A_CLAUSE_ `,
			a_clause: '$A'
		});
	});
});
