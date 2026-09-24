// A C-style `for` keeps its two `;` in the statement's own template:
// tree-sitter tags the condition's `;` with the `condition` field, so the
// reader drops it as punctuation instead of seating it beside the
// expression, and the render body writes each `;` under a gate on the
// kind the slot holds — an expression takes one, an `empty_statement`
// already is one.
import { sliceSpan } from '@sittir/common';
import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/engine.js';
import { ir } from '../src/ir.js';
import { TSKindId } from '../src/types.js';

const SOURCE = 'for (let i = 0; i < 3; i++) {}\n';

type Read = { readonly $type: number; readonly $span: { start: number; end: number } };

describe('for_statement.condition', () => {
	it('holds the condition alone: the field-tagged `;` is punctuation', () => {
		const engine = createEngine();
		const { root } = engine.diagnostics.parseAndRead(SOURCE, { deep: true });
		const statement = (root as unknown as { _statements: { _condition: unknown } | { _condition: unknown }[] })
			._statements;
		const forStatement = Array.isArray(statement) ? statement[0]! : statement;
		const condition = forStatement._condition;
		expect(Array.isArray(condition)).toBe(false);
		const node = condition as Read;
		expect(node.$type).toBe(TSKindId.BinaryExpression);
		expect(sliceSpan(SOURCE, node.$span)).toBe('i < 3');
	});

	it('builds `for (let i = 0; i < 3; i++) {}` with both terminators from the factory', () => {
		const built = ir.program.strict({
			statements: [
				ir.forStatement.strict({
					initializer: ir.lexicalDeclaration.strict(
						{
							kind: TSKindId.LetKeyword,
							declarators: [ir.variableDeclarator.plain.strict({ name: ir.identifier('i'), value: ir.number('0') })]
						},
						{ terminator: TSKindId.Semi }
					),
					condition: ir.binaryExpression.strict({ left: ir.identifier('i'), operator: TSKindId.Lt, right: ir.number('3') }),
					increment: ir.updateExpression.postfix.strict({ argument: ir.identifier('i'), operator: TSKindId.PlusPlus }),
					body: ir.statementBlock.strict({ automaticSemicolon: true })
				})
			]
		});
		expect(built.$render()).toBe('for (let i = 0; i < 3; i++) {}\n');
	});

	it('keeps `for (;;) {}` at three semicolons: an empty statement is its own', () => {
		const built = ir.program.strict({
			statements: [
				ir.forStatement.strict({
					initializer: TSKindId.EmptyStatement,
					condition: TSKindId.EmptyStatement,
					body: ir.statementBlock.strict({ automaticSemicolon: true })
				})
			]
		});
		expect(built.$render()).toBe('for (;;) {}\n');
	});
});
