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

describe('a hoisted list kind that takes its owner as a prefix to stay unique in the grammar', () => {
	const listOf = (open: string, separator: string, close: string) =>
		seq(str(open), sym('item'), { type: 'REPEAT', content: seq(str(separator), sym('item')) }, optional(str(separator)), str(close));
	let rules: Record<string, unknown>;
	beforeAll(() => {
		rules = enrichedRules({
			owner: seq(sym('first'), sym('second'), sym('third')),
			first: listOf('(', ',', ')'),
			second: listOf('[', ';', ']'),
			third: seq({ type: 'FIELD', name: 'items', content: sym('item') }, listOf('{', '|', '}'))
		});
	});

	it('names the kind after its owner and fields the reference with the bare plural', () => {
		expect(Object.keys(rules)).toEqual(expect.arrayContaining(['first_items', 'second_items']));
		expect(rules.first).toMatchObject(seq(str('('), { type: 'FIELD', name: 'items', content: sym('first_items') }, str(')')));
		expect(rules.second).toMatchObject(seq(str('['), { type: 'FIELD', name: 'items', content: sym('second_items') }, str(']')));
	});

	it('leaves the reference unfielded when the owner already has a slot of that name', () => {
		expect(JSON.stringify(stripped(rules.third))).not.toContain('{"type":"FIELD","name":"items","content":{"type":"SYMBOL","name":"third_items"}}');
		expect(JSON.stringify(stripped(rules.third))).toContain('"name":"third_items"');
	});
});

describe('an owner-prefixed list kind at a position a patch fields', () => {
	it('leaves the reference to the patch', () => {
		const listOf = (open: string, separator: string, close: string) =>
			seq(str(open), sym('item'), { type: 'REPEAT', content: seq(str(separator), sym('item')) }, optional(str(separator)), str(close));
		const input = {
			grammar: {
				name: 'test',
				rules: { source: seq(sym('first'), sym('second')), first: listOf('(', ',', ')'), second: listOf('[', ';', ']'), item },
				externals: []
			}
		};
		const fieldSites = new Map([['second', [{ path: [1], name: 'arguments' }]]]);
		const rules = (
			enrich(input as unknown as Parameters<typeof enrich>[0], { fieldSites } as Parameters<typeof enrich>[1]) as unknown as {
				grammar: { rules: Record<string, unknown> };
			}
		).grammar.rules;
		expect(rules.first).toMatchObject(seq(str('('), { type: 'FIELD', name: 'items', content: sym('first_items') }, str(')')));
		expect(rules.second).toMatchObject(seq(str('['), sym('second_items'), str(']')));
	});
});

describe('an owner-prefixed list kind inside a rule enrich itself minted', () => {
	it('is fielded with the bare plural there too', () => {
		const listOf = (open: string, separator: string, close: string) =>
			seq(str(open), sym('item'), { type: 'REPEAT', content: seq(str(separator), sym('item')) }, optional(str(separator)), str(close));
		const rules = enrichedRules({
			owner: seq(sym('first'), sym('host')),
			first: listOf('(', ',', ')'),
			host: { type: 'CHOICE', members: [seq(str('a'), listOf('[', ';', ']')), seq(str('b'), sym('item'))] }
		});
		const minted = Object.entries(rules).filter(([name]) => name.startsWith('host_') && !name.endsWith('_items'));
		const holder = minted.find(([, body]) => JSON.stringify(body).includes('"name":"host_'));
		expect(holder, `minted rules: ${minted.map(([name]) => name).join(', ')}`).toBeDefined();
		expect(JSON.stringify(stripped(holder![1]))).toMatch(/\{"type":"FIELD","name":"items","content":\{"type":"SYMBOL","name":"host_[a-z0-9_]*items"/);
	});
});

describe('a hoisted list kind named after its owner because its element has no single name', () => {
	it('is fielded as elements in its owner', () => {
		const element = { type: 'CHOICE', members: [sym('item'), sym('other')] };
		const rules = enrichedRules({
			owner: seq(str('('), element, { type: 'REPEAT', content: seq(str(','), element) }, optional(str(',')), str(')')),
			other: str('o')
		});
		expect(Object.keys(rules)).toContain('owner_elements');
		expect(rules.owner).toMatchObject(seq(str('('), { type: 'FIELD', name: 'elements', content: sym('owner_elements') }, str(')')));
	});
});

describe('the element field of a rule that is a list', () => {
	const entry = sym('entry');
	const run = (element: unknown) => [element, { type: 'REPEAT', content: seq(str(','), element) }];
	const authoredKey = { type: 'FIELD', name: 'key', content: entry };
	let rules: Record<string, unknown>;
	beforeAll(() => {
		rules = enrichedRules({
			owner: seq(sym('hoisted'), sym('whole'), sym('plain'), sym('mixed'), sym('named')),
			hoisted: seq(str('('), ...run(entry), optional(str(',')), str(')')),
			whole: seq(...run(entry), optional(str(','))),
			plain: seq(...run(entry)),
			mixed: seq(sym('plain'), str(':'), ...run(entry)),
			named: seq(...run(authoredKey), optional(str(','))),
			entry: str('e')
		});
	});
	const fieldNames = (rule: unknown): string[] => [...JSON.stringify(stripped(rule)).matchAll(/"type":"FIELD","name":"([a-z_]+)"/g)].map((match) => match[1]!);

	it('is item in a hoisted list kind', () => {
		expect(new Set(fieldNames(rules.entries))).toEqual(new Set(['item']));
	});

	it('is item in a rule whose whole body is the list', () => {
		expect(new Set(fieldNames(rules.whole))).toEqual(new Set(['item']));
	});

	it('keeps the element name in a separated run with a fixed separator and no optional flank, which is not a list kind', () => {
		expect(new Set(fieldNames(rules.plain))).toEqual(new Set(['entry']));
	});

	it('keeps the element name in an owner that holds more than the list', () => {
		expect(fieldNames(rules.mixed)).toContain('entry');
		expect(fieldNames(rules.mixed)).not.toContain('item');
	});

	it('keeps a field the grammar authored', () => {
		expect(new Set(fieldNames(rules.named))).toEqual(new Set(['key']));
	});
});
