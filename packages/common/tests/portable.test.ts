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
		expression: { ids: [IDENTIFIER, BINARY], exact: false },
		'expression.call': { ids: [IDENTIFIER], exact: true },
		'expression.add': { ids: [BINARY], exact: false }
	},
	fixedText: { [PLUS]: '+' },
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

	it('rejects a kind no entry reads', () => {
		expect(is.declaration({ $type: 99 })).toBe(false);
	});
});
