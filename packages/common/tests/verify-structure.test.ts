import { describe, expect, it } from 'vitest';
import type { KindMembership, StructureTable } from '@sittir/types';
import { checkInput, verifyStructure } from '../src/verify-structure.ts';
import { stampBuilt } from '../src/source-stamp.ts';

const BLOCK = 1;
const CALL = 2;
const NAME = 3;
const OTHER = 4;
const LITERAL = 5;
const SEMI = 6;
const NEWLINE = 7;

const membership: KindMembership = { isMember: (kind, type) => kind === type, membersOf: (kind) => [kind] };

const table: StructureTable = {
	[BLOCK]: { kind: 'block', nonEmpty: [['_statements', 'block.statements']] },
	[CALL]: {
		kind: 'call',
		required: [['_callee', 'callee']],
		nodeOnly: [['_callee', 'Call.callee', 'a built Name', [NAME]], ['_arguments', 'Call.arguments', 'a built Name', [NAME, BLOCK]]]
	},
	[LITERAL]: {
		kind: 'literal',
		booleans: [['_signed', 'Literal.signed']],
		kindIds: [['_terminator', 'Literal.terminator', [SEMI, NEWLINE]]],
		texts: [['_prefix', 'Literal.prefix', ['0x', '0X']]]
	}
};

const built = (type: number, slots: Record<string, unknown> = {}) => stampBuilt({ $type: type, $named: true as const, ...slots });
const name = () => built(NAME, { _text: 'f' });
const verify = (node: unknown, seen = new WeakSet<object>()) => verifyStructure(node, table, membership, seen);

describe('verifyStructure', () => {
	it('refuses a plain config and a node of another kind in a node-only slot', () => {
		expect(() => verify(built(CALL, { _callee: { _text: 'f' } }))).toThrow('a strict factory takes a built node');
		expect(() => verify(built(CALL, { _callee: built(OTHER) }))).toThrow('Call.callee: a strict factory takes a built Name, not a node of kind 4');
		expect(() => verify(built(CALL, { _callee: name(), _arguments: [name(), built(OTHER)] }))).toThrow('Call.arguments');
	});

	it('accepts a node that satisfies its row, and a kind with no row', () => {
		expect(() => verify(built(CALL, { _callee: name(), _arguments: [name()] }))).not.toThrow();
		expect(() => verify(name())).not.toThrow();
	});

	it('refuses a required slot that holds no value, naming the slot and the kind', () => {
		expect(() => verify(built(CALL, { _arguments: [] }))).toThrow("Missing required slot 'callee' on call");
		expect(() => verify(built(CALL, { _callee: null, _arguments: [] }))).toThrow("Missing required slot 'callee' on call");
	});

	it('refuses an empty non-empty list, and one that is absent', () => {
		expect(() => verify(built(BLOCK, { _statements: [] }))).toThrow('block.statements: requires at least one element');
		expect(() => verify(built(BLOCK))).toThrow('block.statements: requires at least one element');
	});

	it('refuses bare text in a node-only slot, alone or in a list', () => {
		expect(() => verify(built(CALL, { _callee: 'f', _arguments: [] }))).toThrow(
			'Call.callee: a strict factory takes a built node, not a string; expected a built Name, or use .coerce'
		);
		expect(() => verify(built(CALL, { _callee: name(), _arguments: [name(), 1n] }))).toThrow(
			'Call.arguments: a strict factory takes a built node, not a bigint; expected a built Name, or use .coerce'
		);
	});

	it('refuses a value in a node-only slot that is not a node, a coordinate, a list or a kind id', () => {
		expect(() => verify(built(CALL, { _callee: () => 1, _arguments: [] }))).toThrow(
			'Call.callee: a strict factory takes a built node, not a function; expected a built Name, or use .coerce'
		);
		expect(() => verify(built(CALL, { _callee: name(), _arguments: [true] }))).toThrow(
			'Call.arguments: a strict factory takes a built node, not a boolean; expected a built Name, or use .coerce'
		);
		expect(() => verify(built(CALL, { _callee: name(), _arguments: [NAME] }))).not.toThrow();
	});

	it('holds a kind-id slot to a kind id of its kinds, or nothing', () => {
		expect(() => verify(built(LITERAL, { _terminator: SEMI }))).not.toThrow();
		expect(() => verify(built(LITERAL))).not.toThrow();
		expect(() => verify(built(LITERAL, { _terminator: () => SEMI }))).toThrow('Literal.terminator: takes a kind id of 6 / 7, not a function');
		expect(() => verify(built(LITERAL, { _terminator: OTHER }))).toThrow('Literal.terminator: takes a kind id of 6 / 7, not kind id 4');
		expect(() => verify(built(LITERAL, { _terminator: ';' }))).toThrow(
			'Literal.terminator: a strict factory takes a built node, not a string; expected a kind id, or use .coerce'
		);
	});

	it('holds a boolean slot to a boolean, or nothing', () => {
		expect(() => verify(built(LITERAL, { _signed: true }))).not.toThrow();
		expect(() => verify(built(LITERAL, { _signed: 'signed' }))).toThrow(
			'Literal.signed: a strict factory takes a built node, not a string; expected a boolean, or use .coerce'
		);
		expect(() => verify(built(LITERAL, { _signed: () => true }))).toThrow('Literal.signed: takes a boolean, not a function');
	});

	it('holds a text slot to one of its texts, or nothing', () => {
		expect(() => verify(built(LITERAL, { _prefix: '0X' }))).not.toThrow();
		expect(() => verify(built(LITERAL, { _prefix: '0b' }))).toThrow("Literal.prefix: takes one of '0x' / '0X', not the string '0b'");
		expect(() => verify(built(LITERAL, { _prefix: () => '0x' }))).toThrow("Literal.prefix: takes one of '0x' / '0X', not a function");
	});

	it('checks the built nodes a node holds, at any depth', () => {
		const inner = built(BLOCK, { _statements: [] });
		expect(() => verify(built(BLOCK, { _statements: [built(CALL, { _callee: name(), _arguments: [inner] })] }))).toThrow(
			'block.statements: requires at least one element'
		);
	});

	it('skips what it holds but did not build: a coordinate, or a read node', () => {
		const coordinate = { $treeHandle: 7, $span: { start: 0, end: 1 } };
		const read = { $type: BLOCK, _statements: [] };
		expect(() => verify(built(BLOCK, { _statements: [coordinate, read] }))).not.toThrow();
	});

	it('checks the node it is given whatever wrote it, since a rebuild of a read node writes its slots', () => {
		expect(() => verify({ $type: BLOCK, _statements: [] })).toThrow('block.statements: requires at least one element');
	});

	it('walks a node once per seen set', () => {
		const seen = new WeakSet<object>();
		const block = built(BLOCK, { _statements: [name()] });
		verify(block, seen);
		Object.assign(block, { _statements: [] });
		expect(() => verify(block, seen)).not.toThrow();
		expect(() => verify(block)).toThrow('block.statements: requires at least one element');
	});

	it('does not mark a node seen when it refuses it', () => {
		const seen = new WeakSet<object>();
		const block = built(BLOCK, { _statements: [] });
		expect(() => verify(block, seen)).toThrow();
		expect(() => verify(block, seen)).toThrow();
	});
});

describe('checkInput', () => {
	const config = { kind: 'case', config: ['value', 'bodies'], lists: [['bodies', false, 'key']] } as const;
	const spread = { kind: 'block', lists: [['statements', false, 0]] } as const;
	const led = { kind: 'seq', lists: [['items', false, 1]] } as const;
	const holes = { kind: 'array', lists: [['elements', true, 0]] } as const;

	it('refuses a config key the kind does not declare, and passes the declared ones and tags', () => {
		expect(() => checkInput(config, [{ value: 1, body: [] }])).toThrow("case: undeclared config key 'body'");
		expect(() => checkInput(config, [{ $type: 1, value: 1, bodies: [] }])).not.toThrow();
	});

	it('reads only a plain object as a config', () => {
		expect(() => checkInput(config, ['text'])).not.toThrow();
		expect(() => checkInput(config, [[{ stray: 1 }]])).not.toThrow();
		expect(() => checkInput(config, [])).not.toThrow();
	});

	it('refuses an absent item in a config list, by index', () => {
		expect(() => checkInput(config, [{ value: 1, bodies: [1, null] }])).toThrow('case.bodies: absent item at index 1');
		expect(() => checkInput(config, [{ value: 1 }])).not.toThrow();
	});

	it('refuses an absent item in rest arguments, in an array argument and in a keyed config', () => {
		expect(() => checkInput(spread, [1, undefined])).toThrow('block.statements: absent item at index 1');
		expect(() => checkInput(spread, [[1, null]])).toThrow('block.statements: absent item at index 1');
		expect(() => checkInput(spread, [{ statements: [undefined] }])).toThrow('block.statements: absent item at index 0');
		expect(() => checkInput(spread, [1, 2])).not.toThrow();
	});

	it('starts the rest items after a leading options object', () => {
		expect(() => checkInput(led, [{ terminator: 1 }, 1, null])).toThrow('seq.items: absent item at index 1');
		expect(() => checkInput(led, [{ terminator: 1 }, 1])).not.toThrow();
		expect(() => checkInput(led, [1, null])).toThrow('seq.items: absent item at index 1');
	});

	it('unwraps the container that follows a leading options object', () => {
		expect(() => checkInput(led, [{}, [1, null]])).toThrow('seq.items: absent item at index 1');
		expect(() => checkInput(led, [{}, { items: [1, null] }])).toThrow('seq.items: absent item at index 1');
		expect(() => checkInput(led, [{ items: [1, null] }])).toThrow('seq.items: absent item at index 1');
		expect(() => checkInput(led, [{}, [1, 2]])).not.toThrow();
	});

	it('checks config keys against the form keys it is given', () => {
		expect(() => checkInput(config, [{ value: 1, stray: 1 }], ['value'])).toThrow("case: undeclared config key 'stray'");
		expect(() => checkInput(config, [{ value: 1 }], ['value'])).not.toThrow();
	});

	it('admits absent items in a list that holds holes', () => {
		expect(() => checkInput(holes, [1, undefined, null])).not.toThrow();
	});
});
