import { describe, expect, it } from 'vitest';
import type { PortableTable, QuerySlots } from '@sittir/types';
import { portableSurface } from '../src/portable.ts';

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

const SLOTS: QuerySlots = {
	[FUNCTION]: [['name', { fields: ['name'], kinds: [] }]],
	[DECORATED]: [
		['decorators', { fields: [], kinds: ['decorator'] }],
		['definition', { fields: ['definition'], kinds: [] }]
	],
	[DECORATOR]: [['expression', { fields: [], kinds: ['identifier'] }]],
	[BINARY]: [['operator', { fields: ['operator'], kinds: [] }]]
};

const TABLE: PortableTable = {
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
		'expression.add': { ids: [BINARY], exact: false }
	},
	fixedText: { [PLUS]: '+', [TRUE]: 'true', [FALSE]: 'false' },
	aliases: [['', 'static', 'declaration.method.static']],
	entries: {
		[FUNCTION]: [
			{
				path: 'declaration.method.static',
				within: [DECORATED],
				test: [{ up: 1, via: [SLOTS[DECORATED]![0]![1]], plan: { op: 'eq', text: 'staticmethod', ...SLOTS[DECORATOR]![0]![1] } }]
			},
			{ path: 'declaration.constructor', within: [], test: [{ up: 0, via: [], plan: { op: 'eq', text: '__init__', ...SLOTS[FUNCTION]![0]![1] } }] },
			{ path: 'declaration.method', within: [BLOCK, CLASS], test: [] },
			{ path: 'declaration.function', within: [], test: [] }
		],
		[BOOLEAN]: [
			{ path: 'literal.boolean.true', within: [], test: [{ up: 0, via: [], plan: { op: 'eq', text: 'true', self: true } }] },
			{ path: 'literal.boolean', within: [], test: [] }
		],
		[IDENTIFIER]: [{ path: 'expression.call', within: [], test: [] }],
		[TRUE]: [{ path: 'literal.keyword.true', within: [], test: [] }],
		[FALSE]: [{ path: 'literal.keyword', within: [], test: [{ up: 0, via: [], plan: { op: 'eq', text: 'false', self: true } }] }],
		[BINARY]: [{ path: 'expression.add', within: [], test: [{ up: 0, via: [], plan: { op: 'eq', text: '+', ...SLOTS[BINARY]![0]![1] } }] }]
	}
};

const leaf = ($type: number, $text: string) => ({ $type, $text });
const fn = (name: string) => ({ $type: FUNCTION, name: () => leaf(IDENTIFIER, name) });
const decorated = (decorator: string, definition: object) => ({
	$type: DECORATED,
	decorators: () => [{ $type: DECORATOR, expression: () => leaf(IDENTIFIER, decorator) }],
	definition: () => definition
});

const { kinds, is } = portableSurface(TABLE, SLOTS) as { kinds: any; is: any };

describe('portableSurface kinds', () => {
	it('is a frozen node per path holding its child segments and the ids read at or under it', () => {
		expect(kinds.declaration.$ids).toEqual([FUNCTION]);
		expect(kinds.declaration.method.static.$ids).toEqual([FUNCTION]);
		expect(Object.isFrozen(kinds.declaration.method)).toBe(true);
	});

	it('links an alias to the same node as its path', () => {
		expect(kinds.static).toBe(kinds.declaration.method.static);
		expect(is.static).toBe(is.declaration.method.static);
	});
});

describe('portableSurface is', () => {
	it('holds at a node\'s first matching entry and every path above it, nowhere else', () => {
		const init = fn('__init__');
		expect(is.declaration.constructor(init)).toBe(true);
		expect(is.declaration(init)).toBe(true);
		expect(is.declaration.function(init)).toBe(false);
		expect(is.declaration.function(fn('f'))).toBe(true);
	});

	it('compares the node\'s own text', () => {
		expect(is.literal.boolean.true(leaf(BOOLEAN, 'true'))).toBe(true);
		expect(is.literal.boolean.true(leaf(BOOLEAN, 'false'))).toBe(false);
		expect(is.literal.boolean(leaf(BOOLEAN, 'false'))).toBe(true);
	});

	it('runs a placed predicate on the context node holding its capture', () => {
		const method = fn('m');
		expect(is.declaration.method.static(method, [decorated('staticmethod', method)])).toBe(true);
		expect(is.declaration.method.static(method, [decorated('classmethod', method)])).toBe(false);
	});

	it('falls to the next entry when the context is absent', () => {
		const method = fn('m');
		expect(is.declaration.method.static(method)).toBe(false);
		expect(is.declaration.function(method)).toBe(true);
	});

	it('matches a placement against the nearest context nodes, outermost to nearest', () => {
		const method = fn('m');
		expect(is.declaration.method(method, [{ $type: CLASS }, { $type: BLOCK }])).toBe(true);
		expect(is.declaration.method(method, [{ $type: BLOCK }, { $type: CLASS }])).toBe(false);
	});

	it('keeps a child segment that a function property already names', () => {
		expect(typeof is.expression.call).toBe('function');
		expect(is.expression.call(leaf(IDENTIFIER, 'x'))).toBe(true);
		expect(kinds.expression.call.$ids).toEqual([IDENTIFIER]);
	});

	it('reads a slot holding a fixed literal\'s kind id as the literal\'s text', () => {
		expect(is.expression.add({ $type: BINARY, operator: () => PLUS })).toBe(true);
		expect(is.expression.add({ $type: BINARY, operator: () => 99 })).toBe(false);
	});

	it('decides an exact path by its kind ids alone', () => {
		expect(is.literal.boolean({ $type: BOOLEAN })).toBe(true);
		expect(is.literal.boolean.true({ $type: BOOLEAN })).toBe(false);
	});

	it('reads a refined path off a node\'s $subType, with no context', () => {
		const method = { ...fn('m'), $subType: 'declaration.method.static' };
		expect(is.declaration.method.static(method)).toBe(true);
		expect(is.declaration.method(method)).toBe(true);
		expect(is.declaration.constructor({ ...fn('__init__'), $subType: 'declaration.function' })).toBe(false);
	});

	it('reads a kind-id leaf as a node of its kind, its text the fixed literal\'s', () => {
		expect(is.literal.keyword.true(TRUE)).toBe(true);
		expect(is.literal.keyword.true(FALSE)).toBe(false);
		expect(is.literal.keyword(FALSE)).toBe(true);
		expect(is.literal.keyword(PLUS)).toBe(false);
	});

	it('rejects a kind no entry reads', () => {
		expect(is.declaration({ $type: 99 })).toBe(false);
	});
});

describe('portableSurface conditions through a list', () => {
	const METHOD = 20;
	const PARAMS = 21;
	const PARAM = 22;
	const SELF = 23;
	const PLAIN = 24;
	const ITEMS = { fields: [], kinds: ['param'] };
	const ELEMENT = { fields: [], kinds: ['self', 'plain'] };
	const SLOTS: QuerySlots = {
		[METHOD]: [['params', { fields: ['params'], kinds: [] }]],
		[PARAMS]: [['items', ITEMS]],
		[PARAM]: [['element', ELEMENT]]
	};
	const PARAMS_STEP = SLOTS[METHOD]![0]![1];
	const { is } = portableSurface(
		{
			paths: {
				method: { ids: [METHOD], exact: false },
				'method.first': { ids: [METHOD], exact: false },
				'method.last': { ids: [METHOD], exact: false },
				'method.static': { ids: [METHOD], exact: false }
			},
			fixedText: {},
			aliases: [],
			entries: {
				[METHOD]: [
					{ path: 'method.last', within: [], test: [{ up: 0, via: [PARAMS_STEP, { ...ITEMS, anchor: 'last' }], plan: { op: 'is', types: [SELF], ...ELEMENT } }] },
					{ path: 'method.first', within: [], test: [{ up: 0, via: [PARAMS_STEP, { ...ITEMS, anchor: 'first' }], plan: { op: 'is', types: [SELF], ...ELEMENT } }] },
					{ path: 'method.static', within: [], test: [{ up: 0, via: [PARAMS_STEP, ITEMS], plan: { op: 'not', of: { op: 'is', types: [SELF], ...ELEMENT } } }] },
					{ path: 'method', within: [], test: [] }
				]
			}
		},
		SLOTS
	) as { is: any };
	const method = (...elements: number[]) => ({
		$type: METHOD,
		params: () => ({ $type: PARAMS, items: () => elements.map((type) => ({ $type: PARAM, element: () => ({ $type: type }) })) })
	});

	it('reads an anchored step as only the first, or only the last, node of its slot', () => {
		expect(is.method.first(method(SELF, PLAIN))).toBe(true);
		expect(is.method.last(method(SELF, PLAIN))).toBe(false);
		expect(is.method.first(method(PLAIN, SELF))).toBe(false);
		expect(is.method.last(method(PLAIN, SELF))).toBe(true);
	});

	it('tests a negated plan against every node the steps reach, so it holds only when none matches', () => {
		expect(is.method.static(method(PLAIN, SELF))).toBe(false);
		expect(is.method.static(method(PLAIN, PLAIN))).toBe(true);
		expect(is.method.static(method())).toBe(true);
	});
});
