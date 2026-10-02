import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { enrich } from '../enrich.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

beforeAll(() => installFakeDsl());
afterAll(() => restoreFakeDsl());

const sym = (name: string) => ({ type: 'SYMBOL', name });
const str = (value: string) => ({ type: 'STRING', value });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
const optional = (content: unknown) => ({ type: 'CHOICE', members: [content, { type: 'BLANK' }] });
const item = { type: 'PATTERN', value: '[a-z]+' };

function enrichedRules(rules: Record<string, unknown>): Record<string, unknown> {
	const input = { grammar: { name: 'test', rules: { source: sym('owner'), ...rules, item }, externals: [] } };
	return (enrich(input as unknown as Parameters<typeof enrich>[0]) as unknown as { grammar: { rules: Record<string, unknown> } }).grammar.rules;
}

const fielded = { type: 'FIELD', name: 'item', content: sym('item') };
const stripped = (rule: unknown): unknown => JSON.parse(JSON.stringify(rule, (key, value) => (key === 'metadata' || key === 'annotations' ? undefined : value)));

describe('a list whose first element carries a required separator, written as a choice', () => {
	let rules: Record<string, unknown>;
	beforeAll(() => {
		rules = enrichedRules({
			owner: seq(sym('item'), {
				type: 'CHOICE',
				members: [str(','), seq({ type: 'REPEAT1', content: seq(str(','), sym('item')) }, optional(str(',')))]
			})
		});
	});

	it('keeps the whole rule as the list, with every element fielded', () => {
		expect(stripped(rules.owner)).toEqual(
			seq(fielded, {
				type: 'CHOICE',
				members: [str(','), seq({ type: 'REPEAT1', content: seq(str(','), fielded) }, optional(str(',')))]
			})
		);
	});

	it('mints no rule for the arm that holds the further elements', () => {
		expect(Object.keys(rules).filter((name) => name.startsWith('owner_') || name.startsWith('_owner'))).toEqual([]);
	});

	it('labels no arm of the choice as a variant', () => {
		expect(JSON.stringify(rules.owner)).not.toContain('variant');
	});
});

describe('a list whose first element carries a required separator, written inline with a suffix separator', () => {
	let rules: Record<string, unknown>;
	beforeAll(() => {
		rules = enrichedRules({
			owner: seq(str('('), seq(sym('item'), str(',')), { type: 'REPEAT', content: seq(sym('item'), str(',')) }, optional(sym('item')), str(')'))
		});
	});

	it('hoists the run as one list rule, with every element fielded', () => {
		expect(rules.owner).toMatchObject(seq(str('('), sym('items'), str(')')));
		expect(stripped(rules.items)).toEqual(
			seq(seq(fielded, str(',')), { type: 'REPEAT', content: seq(fielded, str(',')) }, optional(fielded))
		);
	});
});

describe('the same inline run when the owner may be empty', () => {
	let rules: Record<string, unknown>;
	beforeAll(() => {
		rules = enrichedRules({
			owner: seq(
				str('('),
				optional(seq(seq(sym('item'), str(',')), { type: 'REPEAT', content: seq(sym('item'), str(',')) }, optional(sym('item')))),
				str(')')
			)
		});
	});

	it('hoists the optional run as one list rule, with every element fielded', () => {
		expect(rules.owner).toMatchObject(seq(str('('), optional(sym('items')), str(')')));
		expect(stripped(rules.items)).toEqual(
			seq(seq(fielded, str(',')), { type: 'REPEAT', content: seq(fielded, str(',')) }, optional(fielded))
		);
	});
});
