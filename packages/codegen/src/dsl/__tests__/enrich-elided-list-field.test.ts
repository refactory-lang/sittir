import { CHOICE, FIELD, OPTIONAL, REPEAT, REPEAT1, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { enrich } from '../enrich.ts';
import type { Rule } from '../../types/rule.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

const sym = (name: string) => ({ type: SYMBOL, name }) as unknown as Rule;
const str = (value: string) => ({ type: STRING, value }) as unknown as Rule;
const seq = (...members: Rule[]) => ({ type: SEQ, members }) as unknown as Rule;
const optional = (content: Rule) => ({ type: OPTIONAL, content }) as unknown as Rule;
const repeat = (content: Rule) => ({ type: REPEAT, content }) as unknown as Rule;
const repeat1 = (content: Rule) => ({ type: REPEAT1, content }) as unknown as Rule;

const enrichRule = (rule: Rule): Rule =>
	(
		enrich({ grammar: { name: 'test', rules: { owner: rule, term: str('t') } } }) as unknown as {
			grammar: { rules: Record<string, Rule> };
		}
	).grammar.rules.owner!;

describe('enrich — an elided separated list is fielded whole', () => {
	beforeAll(() => {
		installFakeDsl();
	});
	afterAll(() => {
		restoreFakeDsl();
	});

	it('fields a rule body of optional element then separated repeat, separators included, under the pluralized element name', () => {
		const out = enrichRule(seq(optional(sym('term')), repeat1(seq(str('|'), optional(sym('term'))))));
		expect(out).toMatchObject({ type: FIELD, name: 'terms' });
		expect((out as unknown as { content: Rule }).content).toMatchObject({ type: SEQ });
	});

	it('fields a bracketed optional list member and leaves its brackets outside the field', () => {
		const list = optional(seq(optional(sym('term')), repeat(seq(str(','), optional(sym('term'))))));
		const out = enrichRule(seq(str('['), list, str(']'))) as unknown as { members: Rule[] };
		expect(out.members[0]).toMatchObject({ type: STRING, value: '[' });
		expect(out.members[1]).toMatchObject({ type: FIELD, name: 'terms' });
		expect(out.members[2]).toMatchObject({ type: STRING, value: ']' });
	});

	it('names a list whose element is not one symbol `elements`', () => {
		const element = { type: CHOICE, members: [sym('term'), sym('other')] } as unknown as Rule;
		const out = enrichRule(seq(optional(element), repeat(seq(str(','), optional(element)))));
		expect(out).toMatchObject({ type: FIELD, name: 'elements' });
	});

	it('leaves a list without elided elements unfielded', () => {
		const out = enrichRule(seq(sym('term'), repeat(seq(str(','), sym('term')))));
		expect((out as unknown as { type: string }).type).toBe(SEQ);
	});

	it('leaves an already fielded list alone', () => {
		const fielded = { type: FIELD, name: 'items', content: seq(optional(sym('term')), repeat(seq(str(','), optional(sym('term'))))) } as unknown as Rule;
		expect(enrichRule(fielded)).toMatchObject({ type: FIELD, name: 'items' });
	});
});
