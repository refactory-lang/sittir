import { CHOICE, FIELD, OPTIONAL, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { enrich } from '../enrich.ts';
import type { AnyRule } from '../../types/rule.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

type Optional = (content: AnyRule) => AnyRule;

const sittirOptional: Optional = (content) => ({ type: OPTIONAL, content }) as AnyRule;
const treeSitterOptional: Optional = (content) => ({ type: CHOICE, members: [content, { type: 'BLANK' }] }) as AnyRule;

const expression = (): AnyRule => ({ type: SYMBOL, name: '_expression' }) as AnyRule;
const field = (name: string, content: AnyRule): AnyRule => ({ type: FIELD, name, content }) as AnyRule;
const colon = (): AnyRule => ({ type: STRING, value: ':' }) as AnyRule;

function sliceGrammar(optional: Optional): Record<string, AnyRule> {
	return {
		source_file: { type: SYMBOL, name: 'slice_expression' } as AnyRule,
		slice_expression: {
			type: SEQ,
			members: [
				field('operand', expression()),
				{ type: STRING, value: '[' },
				{
					type: CHOICE,
					members: [
						{ type: SEQ, members: [field('start', optional(expression())), colon(), field('end', optional(expression()))] },
						{
							type: SEQ,
							members: [field('start', optional(expression())), colon(), field('end', expression()), colon(), field('capacity', expression())]
						}
					]
				},
				{ type: STRING, value: ']' }
			]
		} as AnyRule,
		_expression: { type: CHOICE, members: [{ type: SYMBOL, name: 'identifier' }, { type: SYMBOL, name: 'int_literal' }] } as AnyRule,
		identifier: { type: PATTERN, value: '[a-z]+' } as AnyRule,
		int_literal: { type: PATTERN, value: '[0-9]+' } as AnyRule
	};
}

function enrichedRuleNames(rules: Record<string, AnyRule>): string[] {
	const enriched = enrich({ grammar: { name: 'test', rules } }) as unknown as { grammar: { rules: Record<string, AnyRule> } };
	return Object.keys(enriched.grammar.rules).sort();
}

describe('enrich reads optional(x) the same in both spellings', () => {
	beforeAll(() => installFakeDsl());
	afterAll(() => restoreFakeDsl());

	it('declines the same slice arms whether optional() is OPTIONAL or CHOICE(x, BLANK)', () => {
		const fromSittir = enrichedRuleNames(sliceGrammar(sittirOptional));
		const fromTreeSitter = enrichedRuleNames(sliceGrammar(treeSitterOptional));
		expect(fromTreeSitter).toEqual(fromSittir);
		expect(fromSittir.filter((name) => name.startsWith('slice_expression_'))).toEqual([]);
	});
});
