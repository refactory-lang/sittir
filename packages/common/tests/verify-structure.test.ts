import { describe, expect, it } from 'vitest';
import type { StructureTable } from '@sittir/types';
import { verifyStructure } from '../src/verify-structure.ts';

const BLOCK = 1;
const CALL = 2;
const NAME = 3;

const table: StructureTable = {
	[BLOCK]: { kind: 'block', nonEmpty: [['_statements', 'block.statements']] },
	[CALL]: {
		kind: 'call',
		required: [['_callee', 'callee']],
		nodeOnly: [['_callee', 'Call.callee', 'a built Name'], ['_arguments', 'Call.arguments', 'a built Name']]
	}
};

const built = (type: number, slots: Record<string, unknown> = {}) => ({ $type: type, $source: 2 as const, $named: true as const, ...slots });
const name = () => built(NAME, { _text: 'f' });
const verify = (node: unknown, seen = new WeakSet<object>()) => verifyStructure(node, table, seen);

describe('verifyStructure', () => {
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
