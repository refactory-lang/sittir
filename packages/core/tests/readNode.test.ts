/**
 * readNode.test.ts — unit coverage for the fname / anonymous-keyword
 * collision and multi-value accumulation branches.
 *
 * These branches are load-bearing for grammars where the same field
 * name appears on multiple children (python's repeated `argument`
 * field) AND where an anonymous keyword shares text with a named
 * field's target (rust's `type_item` has an anon `type` keyword
 * child plus a `field('type', ...)` for the RHS). Without unit tests,
 * a three-way-branch reorder could silently break either case and
 * only surface via a specific grammar's round-trip regression.
 */

import { describe, it, expect } from 'vitest';
import { readNode } from '../src/readNode.ts';
import type { AnyTreeNode, TreeHandle } from '../src/readNode.ts';

interface FakeChild {
	type: string;
	text: string;
	named: boolean;
	fieldName?: string | null;
	id: number;
	start?: number;
	end?: number;
}

function makeHandle(rootType: string, children: FakeChild[]): TreeHandle {
	const idMap = new Map<number, AnyTreeNode>();
	const root: AnyTreeNode = {
		type: rootType,
		id: () => 0,
		text: () => '',
		range: () => ({ start: { index: 0 }, end: { index: 0 } }),
		isNamed: () => true,
		children: () => childNodes,
		fieldNameForChild: (i: number) => children[i]?.fieldName ?? null,
	} as unknown as AnyTreeNode;
	const childNodes = children.map((c, _i): AnyTreeNode => ({
		type: c.type,
		id: () => c.id,
		text: () => c.text,
		range: () => ({
			start: { index: c.start ?? 0 },
			end: { index: c.end ?? c.text.length },
		}),
		isNamed: () => c.named,
		children: () => [],
		fieldNameForChild: () => null,
	} as unknown as AnyTreeNode));
	idMap.set(0, root);
	childNodes.forEach((n, i) => idMap.set(children[i]!.id, n));
	return {
		rootNode: root,
		nodeById: (id: number) => idMap.get(id) as AnyTreeNode,
	};
}

describe('readNode — fname / anonymous-keyword collision', () => {
	it('real named field displaces a prior anonymous-keyword placeholder', () => {
		// Shape mirrors rust's type_item: [ anon 'type' keyword, name,
		// '=', <named-field='type'>, ';' ]. The anonymous `type` child
		// lands first and (via promoteAnonymousKeyword) would populate
		// fields.type with the keyword placeholder. When the real
		// fname='type' child arrives, it must REPLACE the placeholder,
		// not array-accumulate with it.
		const handle = makeHandle('type_item', [
			{ type: 'type', text: 'type', named: false, id: 1 },
			{ type: 'type_identifier', text: 'Foo', named: true, fieldName: 'name', id: 2 },
			{ type: '=', text: '=', named: false, id: 3 },
			{ type: 'type_identifier', text: 'u64', named: true, fieldName: 'type', id: 4 },
			{ type: ';', text: ';', named: false, id: 5 },
		]);
		const data = readNode(handle);
		expect(data.$fields?.type).toBeDefined();
		// $fields.type is the NAMED RHS, not an array and not the anon.
		const t = data.$fields!.type as { $type: string; $text: string; $named: boolean };
		expect(Array.isArray(t)).toBe(false);
		expect(t.$type).toBe('type_identifier');
		expect(t.$text).toBe('u64');
		expect(t.$named).toBe(true);
	});

	it('accumulates two named fname writes into an array (multi-valued field)', () => {
		// Shape mirrors a python `print_statement` with repeated
		// `argument` field: each expression gets fieldName='argument',
		// which must array-accumulate rather than overwrite.
		const handle = makeHandle('print_statement', [
			{ type: 'identifier', text: 'print', named: false, id: 1 },
			{ type: 'integer', text: '1', named: true, fieldName: 'argument', id: 2 },
			{ type: ',', text: ',', named: false, id: 3 },
			{ type: 'integer', text: '2', named: true, fieldName: 'argument', id: 4 },
			{ type: ',', text: ',', named: false, id: 5 },
			{ type: 'integer', text: '3', named: true, fieldName: 'argument', id: 6 },
		]);
		const data = readNode(handle);
		const args = data.$fields?.argument;
		expect(Array.isArray(args)).toBe(true);
		const arr = args as Array<{ $text: string }>;
		expect(arr).toHaveLength(3);
		expect(arr.map(a => a.$text)).toEqual(['1', '2', '3']);
	});
});
