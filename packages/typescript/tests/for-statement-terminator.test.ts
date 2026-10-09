// A C-style `for` keeps its two `;` in the statement's own template:
// tree-sitter tags the condition's `;` with the `condition` field, so the
// wrap layer drops it as punctuation instead of seating it beside the
// expression, and the render body writes each `;` under a gate on the
// kind the slot holds — an expression takes one, an `empty_statement`
// already is one.
import { sliceSpan } from '@sittir/common';
import { spanOf } from '@sittir/common/utils';
import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

const SOURCE = 'for (let i = 0; i < 3; i++) {}\n';

type Read = { readonly $type: number; readonly $span: { start: number; end: number } };

describe('for_statement.condition', () => {
	it('holds the condition alone: the field-tagged `;` is punctuation', () => {
		const forStatement = ts.parse(SOURCE).statements()[0] as unknown as { condition(): unknown };
		const condition = forStatement.condition();
		expect(Array.isArray(condition)).toBe(false);
		const node = condition as Read;
		expect(node.$type).toBe(ts.kinds.BinaryExpression);
		expect(sliceSpan(SOURCE, spanOf(node)!)).toBe('i < 3');
	});

	it('builds `for (let i = 0; i < 3; i++) {}` with both terminators from the factory', () => {
		const built = ts.build.program.strict({
			statements: [
				ts.build.forStatement.strict({
					initializer: ts.build.lexicalDeclaration.strict(
						{
							kind: ts.kinds.LetKeyword,
							declarators: [ts.build.variableDeclarator.plain.strict({ name: ts.build.identifier('i'), value: ts.build.number('0') })]
						},
						{ terminator: ts.kinds.Semi }
					),
					condition: ts.build.binaryExpression.strict({ left: ts.build.identifier('i'), operator: ts.kinds.Lt, right: ts.build.number('3') }),
					increment: ts.build.updateExpression.postfix.strict({ argument: ts.build.identifier('i'), operator: ts.kinds.PlusPlus }),
					body: ts.build.statementBlock.strict({ terminator: ts.kinds.AutomaticSemicolon })
				})
			]
		});
		expect(built.$render()).toBe('for (let i = 0; i < 3; i++) {}\n');
	});

	it('keeps `for (;;) {}` at three semicolons: an empty statement is its own', () => {
		const built = ts.build.program.strict({
			statements: [
				ts.build.forStatement.strict({
					initializer: ts.kinds.EmptyStatement,
					condition: ts.kinds.EmptyStatement,
					body: ts.build.statementBlock.strict({ terminator: ts.kinds.AutomaticSemicolon })
				})
			]
		});
		expect(built.$render()).toBe('for (;;) {}\n');
	});
});
