/**
 * Integration tests for Edit creation, replace(), and ast-grep compatibility.
 */
import { describe, it, expect } from 'vitest';
import { ir } from '../rust/src/ir.ts';
import { render, toEdit, replace, replaceField } from '../core/src/index.ts';
import type { AssignableNode, ReplaceTarget } from '../core/src/index.ts';
import { edit } from '../rust/src/factories.ts';
import { rules } from '../rust/src/rules.ts';
import { joinBy } from '../rust/src/joinby.ts';

/** Apply an edit to source text. */
function applyEdit(source: string, edit: { startPos: number; endPos: number; insertedText: string }): string {
	return source.slice(0, edit.startPos) + edit.insertedText + source.slice(edit.endPos);
}

/** Apply multiple edits in reverse order (highest offset first). */
function applyEdits(source: string, edits: { startPos: number; endPos: number; insertedText: string }[]): string {
	const sorted = [...edits].sort((a, b) => b.startPos - a.startPos);
	let result = source;
	for (const edit of sorted) {
		result = applyEdit(result, edit);
	}
	return result;
}

/** Mock an ast-grep SgNode-like target with typed kind and range. */
function mockTarget<K extends string>(kind: K, startIndex: number, endIndex: number) {
	return {
		type: kind as K,
		range: () => ({
			start: { index: startIndex, line: 0, column: startIndex },
			end: { index: endIndex, line: 0, column: endIndex },
		}),
	};
}

describe('toEdit with raw byte offsets', () => {
	it('produces Edit with correct startPos/endPos', () => {
		const replacement = ir.identifier('new_name');
		const edit = toEdit(replacement, rules, 10, 18);
		expect(edit.startPos).toBe(10);
		expect(edit.endPos).toBe(18);
		expect(edit.insertedText).toBe('new_name');
	});

	it('insertedText matches render()', () => {
		const node = ir.binaryExpression({
			left: ir.identifier('x'),
			operator: ir.add(),
			right: ir.integerLiteral('1'),
		});
		const edit = toEdit(node, rules, 0, 10);
		expect(edit.insertedText).toBe(render(node, rules, joinBy));
	});
});

describe('toEdit with ast-grep Range', () => {
	it('accepts { start: { index }, end: { index } } range', () => {
		const replacement = ir.identifier('y');
		const range = { start: { index: 5 }, end: { index: 6 } };
		const edit = toEdit(replacement, rules, range);
		expect(edit.startPos).toBe(5);
		expect(edit.endPos).toBe(6);
		expect(edit.insertedText).toBe('y');
	});
});

describe('replace() — typed codemod primitive', () => {
	it('replaces a target node with matching kind', () => {
		const target = mockTarget('identifier', 4, 5);
		const replacement = ir.identifier('count');
		const edit = replace(target, replacement);
		expect(edit.startPos).toBe(4);
		expect(edit.endPos).toBe(5);
		expect(edit.insertedText).toBe('count');
	});

	it('replaces with a complex node', () => {
		const target = mockTarget('binary_expression', 8, 13);
		const replacement = ir.binaryExpression({
			left: ir.identifier('x'),
			operator: ir.mul(),
			right: ir.integerLiteral('2'),
		});
		const edit = replace(target, replacement);
		expect(edit.startPos).toBe(8);
		expect(edit.endPos).toBe(13);
		expect(edit.insertedText).toBe('x * 2');
	});
});

describe('Node.replace() method', () => {
	it('replaces via attached method', () => {
		const target = mockTarget('identifier', 0, 3);
		const node = ir.identifier('replaced');
		const edit = node.replace(target);
		expect(edit.startPos).toBe(0);
		expect(edit.endPos).toBe(3);
		expect(edit.insertedText).toBe('replaced');
	});
});

describe('Node.toEdit() method', () => {
	it('works with raw byte offsets', () => {
		const node = ir.identifier('x');
		const edit = node.toEdit(0, 1);
		expect(edit.insertedText).toBe('x');
	});

	it('works with range object', () => {
		const node = ir.identifier('x');
		const edit = node.toEdit({ start: { index: 0 }, end: { index: 1 } });
		expect(edit.startPos).toBe(0);
		expect(edit.endPos).toBe(1);
	});
});

describe('Apply single edit to source', () => {
	it('replaces an identifier', () => {
		const source = 'let x = 42;';
		const target = mockTarget('identifier', 4, 5);
		const edit = replace(target, ir.identifier('count'));
		expect(applyEdit(source, edit)).toBe('let count = 42;');
	});

	it('replaces a number literal', () => {
		const source = 'let x = 42;';
		const edit = toEdit(ir.integerLiteral('100'), rules, 8, 10);
		expect(applyEdit(source, edit)).toBe('let x = 100;');
	});
});

describe('Apply multiple non-overlapping edits', () => {
	it('replaces two identifiers', () => {
		const source = 'let a = b;';
		const edits = [
			toEdit(ir.identifier('x'), rules, 4, 5),
			toEdit(ir.identifier('y'), rules, 8, 9),
		];
		expect(applyEdits(source, edits)).toBe('let x = y;');
	});

	it('handles different replacement lengths', () => {
		const source = 'a + b';
		const edits = [
			toEdit(ir.identifier('first'), rules, 0, 1),
			toEdit(ir.identifier('second'), rules, 4, 5),
		];
		expect(applyEdits(source, edits)).toBe('first + second');
	});
});

/** Mock an AssignableNode (simulates a parsed tree node with field access). */
function mockAssignable<K extends string>(
	kind: K,
	startIndex: number,
	endIndex: number,
	fieldValues: Record<string, { type: string; text: string }> = {},
	childValues: { type: string; text: string }[] = [],
): AssignableNode<K> {
	return {
		type: kind,
		range: () => ({ start: { index: startIndex }, end: { index: endIndex } }),
		field: (name: string) => {
			const v = fieldValues[name];
			if (!v) return null;
			return {
				type: v.type,
				range: () => ({ start: { index: 0 }, end: { index: v.text.length } }),
				field: () => null,
				text: () => v.text,
				children: () => [],
			};
		},
		text: () => Object.values(fieldValues).map(v => v.text).join(' '),
		children: () => childValues.map(v => ({
			type: v.type,
			range: () => ({ start: { index: 0 }, end: { index: v.text.length } }),
			field: () => null,
			text: () => v.text,
			children: () => [],
		})),
	};
}

describe('ir.*.assign() — hydrate from parsed node', () => {
	it('hydrates a binary_expression from an assignable node', () => {
		const target = mockAssignable('binary_expression', 0, 5, {
			left: { type: 'identifier', text: 'a' },
			operator: { type: 'binary_operator', text: '+' },
			right: { type: 'integer_literal', text: '1' },
		});
		const node = ir.binaryExpression.assign(target);
		expect(node.type).toBe('binary_expression');
		const editObj = node.toEdit();
		expect(editObj.startPos).toBe(0);
		expect(editObj.endPos).toBe(5);
		expect(editObj.insertedText).toContain('a');
		expect(editObj.insertedText).toContain('+');
		expect(editObj.insertedText).toContain('1');
	});

	it('allows overriding a single field', () => {
		const target = mockAssignable('binary_expression', 10, 15, {
			left: { type: 'identifier', text: 'a' },
			operator: { type: 'binary_operator', text: '+' },
			right: { type: 'integer_literal', text: '1' },
		});
		const node = ir.binaryExpression.assign(target)
			.right(ir.integerLiteral('99'));
		const editObj = node.toEdit();
		expect(editObj.startPos).toBe(10);
		expect(editObj.endPos).toBe(15);
		expect(editObj.insertedText).toContain('a');
		expect(editObj.insertedText).toContain('99');
	});
});

describe('edit(target) — sugar for ir[kind].assign(target)', () => {
	it('dispatches to the right factory', () => {
		const target = mockAssignable('binary_expression', 0, 5, {
			left: { type: 'identifier', text: 'x' },
			operator: { type: 'binary_operator', text: '*' },
			right: { type: 'integer_literal', text: '2' },
		});
		const node = edit(target);
		expect(node.type).toBe('binary_expression');
	});

	it('supports fluent override then toEdit()', () => {
		const target = mockAssignable('binary_expression', 0, 5, {
			left: { type: 'identifier', text: 'x' },
			operator: { type: 'binary_operator', text: '*' },
			right: { type: 'integer_literal', text: '2' },
		});
		const editObj = edit(target)
			.left(ir.identifier('y'))
			.toEdit();
		expect(editObj.startPos).toBe(0);
		expect(editObj.endPos).toBe(5);
		expect(editObj.insertedText).toContain('y');
		expect(editObj.insertedText).toContain('*');
		expect(editObj.insertedText).toContain('2');
	});
});

describe('Round-trip: replace → apply → valid source', () => {
	it('replaces a return type in function signature', () => {
		const source = 'fn add(a: i32, b: i32) -> i32 { a + b }';
		const target = mockTarget('primitive_type', 26, 29);
		const edit = replace(target, ir.primitiveType('i64'));
		expect(applyEdit(source, edit)).toBe('fn add(a: i32, b: i32) -> i64 { a + b }');
	});
});

describe('replaceField — type-safe field replacement', () => {
	// Mock a typed navigation node (simulates a parsed FunctionItemNode)
	interface MockReturnTypeNode extends ReplaceTarget<'primitive_type'> {
		readonly type: 'primitive_type';
		readonly text: string;
	}

	interface MockFunctionNode {
		readonly type: 'function_item';
		readonly return_type?: MockReturnTypeNode;
	}

	it('replaces a field using selector lambda', () => {
		const fnNode: MockFunctionNode = {
			type: 'function_item',
			return_type: {
				type: 'primitive_type',
				range: () => ({ start: { index: 26 }, end: { index: 29 } }),
				text: 'i32',
			},
		};

		const edit = replaceField(
			fnNode,
			n => n.return_type,
			ir.primitiveType('i64'),
		);

		expect(edit.startPos).toBe(26);
		expect(edit.endPos).toBe(29);
		expect(edit.insertedText).toBe('i64');
	});

	it('throws when field is undefined', () => {
		const fnNode: MockFunctionNode = {
			type: 'function_item',
			// return_type is undefined
		};

		expect(() =>
			replaceField(fnNode, n => n.return_type, ir.primitiveType('i64')),
		).toThrow('Cannot replace undefined field');
	});

	// Type safety: this would be a compile error if uncommented:
	// replaceField(fnNode, n => n.return_type, ir.block(), rules);
	//                                          ^^^^^^^^^
	// Type 'NodeData<"block">' is not assignable to 'NodeData<"primitive_type">'
});
