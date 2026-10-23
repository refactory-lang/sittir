import { describe, expect, it } from 'vitest';
import type { PortableRows, QuerySlots } from '@sittir/types';
import { classifierOf } from '../src/portable/classify.ts';

const FUNCTION = 1;
const DECORATED = 2;
const DECORATOR = 3;
const IDENTIFIER = 4;
const BOOLEAN = 5;
const BLOCK = 6;
const CLASS = 7;
const BINARY = 8;
const PLUS = 9;
const TRUE = 10;
const FALSE = 11;
const FIELD = 12;

const SLOTS: QuerySlots = {
	[FUNCTION]: [['name', 0, undefined, '_name']],
	[DECORATED]: [
		['decorators', 0, undefined, '_decorator'],
		['definition', 1, undefined, '_definition']
	],
	[DECORATOR]: [['expression', 0, undefined, '_expression']],
	[BINARY]: [['operator', 1, undefined, '_operator']],
	[FIELD]: [['accessor', 0, 'accessor', '_accessor']]
};

const subject = (kind: number, row: number) => ({ slots: { [kind]: SLOTS[kind]![row]![1] } });

const ROWS: PortableRows = {
	querySlots: SLOTS,
	table: {
		paths: {
			declaration: { ids: [FUNCTION], exact: true },
			'declaration.function': { ids: [FUNCTION], exact: false },
			'declaration.method': { ids: [FUNCTION], exact: false },
			'declaration.method.static': { ids: [FUNCTION], exact: false },
			'declaration.constructor': { ids: [FUNCTION], exact: false },
			literal: { ids: [BOOLEAN], exact: true },
			'literal.boolean': { ids: [BOOLEAN], exact: true },
			'literal.boolean.true': { ids: [BOOLEAN], exact: false },
			'literal.keyword': { ids: [TRUE, FALSE], exact: true },
			'literal.keyword.true': { ids: [TRUE], exact: true },
			expression: { ids: [IDENTIFIER, BINARY], exact: false },
			'expression.call': { ids: [IDENTIFIER], exact: true },
			'expression.add': { ids: [BINARY], exact: false },
			'declaration.property': { ids: [FIELD], exact: false }
		},
		fixedText: { [PLUS]: '+', [TRUE]: 'true', [FALSE]: 'false' },
		entries: {
			[FUNCTION]: [
				{
					path: 'declaration.method.static',
					within: [DECORATED],
					test: [
						{ up: 1, via: [subject(DECORATED, 0)], plan: { op: 'eq', text: 'staticmethod', ...subject(DECORATOR, 0) } }
					]
				},
				{
					path: 'declaration.constructor',
					within: [],
					test: [{ up: 0, via: [], plan: { op: 'eq', text: '__init__', ...subject(FUNCTION, 0) } }]
				},
				{ path: 'declaration.method', within: [BLOCK, CLASS], test: [] },
				{ path: 'declaration.function', within: [], test: [] }
			],
			[BOOLEAN]: [
				{
					path: 'literal.boolean.true',
					within: [],
					test: [{ up: 0, via: [], plan: { op: 'eq', text: 'true', self: true } }]
				},
				{ path: 'literal.boolean', within: [], test: [] }
			],
			[IDENTIFIER]: [{ path: 'expression.call', within: [], test: [] }],
			[TRUE]: [{ path: 'literal.keyword.true', within: [], test: [] }],
			[FALSE]: [
				{
					path: 'literal.keyword',
					within: [],
					test: [{ up: 0, via: [], plan: { op: 'eq', text: 'false', self: true } }]
				}
			],
			[BINARY]: [
				{
					path: 'expression.add',
					within: [],
					test: [{ up: 0, via: [], plan: { op: 'eq', text: '+', ...subject(BINARY, 0) } }]
				}
			],
			[FIELD]: [
				{
					path: 'declaration.property',
					within: [],
					test: [{ up: 0, via: [], plan: { op: 'present', ...subject(FIELD, 0) } }]
				}
			]
		}
	}
};

const leaf = ($type: number, $text: string) => ({ $type, $text });
const fn = (name: string) => ({ $type: FUNCTION, name: () => leaf(IDENTIFIER, name) });

const read = classifierOf(ROWS);

describe('classifierOf', () => {
	it("reads a node as its kind's first entry whose conditions all hold", () => {
		expect(read(fn('__init__'))).toBe('declaration.constructor');
		expect(read(fn('f'))).toBe('declaration.function');
	});

	it('skips an entry that depends on where the node sits, so it reads as the next entry', () => {
		expect(read(fn('m'))).toBe('declaration.function');
	});

	it("compares the node's own text", () => {
		expect(read(leaf(BOOLEAN, 'true'))).toBe('literal.boolean.true');
		expect(read(leaf(BOOLEAN, 'false'))).toBe('literal.boolean');
	});

	it("reads a slot holding a fixed literal's kind id as the literal's text", () => {
		expect(read({ $type: BINARY, operator: () => PLUS })).toBe('expression.add');
		expect(read({ $type: BINARY, operator: () => 99 })).toBeUndefined();
	});

	it('reads a boolean slot holding true as its keyword present, and false as absent', () => {
		expect(read({ $type: FIELD, accessor: () => true })).toBe('declaration.property');
		expect(read({ $type: FIELD, accessor: () => false })).toBeUndefined();
	});

	it('reads a kind no entry reads as nothing', () => {
		expect(read({ $type: 99 })).toBeUndefined();
	});

	it('builds one classifier per rows object', () => {
		expect(classifierOf(ROWS)).toBe(read);
	});
});

describe('classifierOf conditions through a list', () => {
	const METHOD = 20;
	const PARAMS = 21;
	const PARAM = 22;
	const SELF = 23;
	const PLAIN = 24;
	const ITEMS = { slots: { [PARAMS]: 0 } };
	const ELEMENT = { slots: { [PARAM]: 0 } };
	const SLOTS: QuerySlots = {
		[METHOD]: [['params', 0, undefined, '_params']],
		[PARAMS]: [['items', 0, undefined, '_items']],
		[PARAM]: [['element', 0, undefined, '_element']]
	};
	const PARAMS_STEP = { slots: { [METHOD]: 0 } };
	const read = classifierOf({
		querySlots: SLOTS,
		table: {
			paths: {
				method: { ids: [METHOD], exact: false },
				'method.first': { ids: [METHOD], exact: false },
				'method.last': { ids: [METHOD], exact: false },
				'method.only': { ids: [METHOD], exact: false },
				'method.static': { ids: [METHOD], exact: false }
			},
			fixedText: {},
			entries: {
				[METHOD]: [
					{
						path: 'method.only',
						within: [],
						test: [
							{
								up: 0,
								via: [PARAMS_STEP, { ...ITEMS, anchor: 'only' }],
								plan: { op: 'is', types: [PLAIN], ...ELEMENT }
							}
						]
					},
					{
						path: 'method.last',
						within: [],
						test: [
							{ up: 0, via: [PARAMS_STEP, { ...ITEMS, anchor: 'last' }], plan: { op: 'is', types: [SELF], ...ELEMENT } }
						]
					},
					{
						path: 'method.first',
						within: [],
						test: [
							{
								up: 0,
								via: [PARAMS_STEP, { ...ITEMS, anchor: 'first' }],
								plan: { op: 'is', types: [SELF], ...ELEMENT }
							}
						]
					},
					{
						path: 'method.static',
						within: [],
						test: [
							{ up: 0, via: [PARAMS_STEP, ITEMS], plan: { op: 'not', of: { op: 'is', types: [SELF], ...ELEMENT } } }
						]
					},
					{ path: 'method', within: [], test: [] }
				]
			}
		}
	});
	const method = (...elements: number[]) => ({
		$type: METHOD,
		params: () => ({
			$type: PARAMS,
			items: () => elements.map((type) => ({ $type: PARAM, element: () => ({ $type: type }) }))
		})
	});

	it('reads an anchored step as only the first, or only the last, node of its slot', () => {
		expect(read(method(SELF, PLAIN))).toBe('method.first');
		expect(read(method(PLAIN, SELF))).toBe('method.last');
	});

	it('reads a step anchored as only when its slot holds exactly one node', () => {
		expect(read(method(PLAIN))).toBe('method.only');
		expect(read(method(PLAIN, PLAIN))).not.toBe('method.only');
	});

	it('tests a negated plan against every node the steps reach, so it holds only when none matches', () => {
		expect(read(method(PLAIN, PLAIN))).toBe('method.static');
		expect(read(method())).toBe('method.static');
		expect(read(method(PLAIN, SELF, PLAIN))).toBe('method');
	});

	it('reads a bare kind id past every entry that reads a slot, since an id shows none, so a negated slot test does not hold', () => {
		expect(read(METHOD)).toBe('method');
	});
});
