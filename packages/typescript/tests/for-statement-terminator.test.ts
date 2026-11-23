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
const tsStrict = await createEngine(typescript, { api: 'strict' });

const SOURCE = 'for (let i = 0; i < 3; i++) {}\n';

type Read = { readonly $type: number; readonly $span: { start: number; end: number } };

describe('for_statement.condition', () => {
	it('holds the condition alone: the field-tagged `;` is punctuation', () => {
		const forStatement = ts.parse(SOURCE).statements()[0] as unknown as { condition(): unknown };
		const condition = forStatement.condition();
		expect(Array.isArray(condition)).toBe(false);
		const node = condition as Read;
		expect(node.$type).toBe(ts.kinds.BinaryExpressionDefault);
		expect(sliceSpan(SOURCE, spanOf(node)!)).toBe('i < 3');
	});

	it('builds `for (let i = 0; i < 3; i++) {}` with both terminators from the factory', () => {
		const built = tsStrict.build.program({
			statements: [
				tsStrict.build.forStatement({
					initializer: tsStrict.build.lexicalDeclaration(
						{
							kind: ts.kinds.LetKeyword,
							declarators: [tsStrict.build.variableDeclarator.plain({ name: tsStrict.build.identifier('i'), value: tsStrict.build.number('0') })]
						},
						{ terminator: ts.kinds.Semi }
					),
					condition: tsStrict.build.binaryExpression({ left: tsStrict.build.identifier('i'), operator: ts.kinds.Lt, right: tsStrict.build.number('3') }),
					increment: tsStrict.build.updateExpression.postfix({ argument: tsStrict.build.identifier('i'), operator: ts.kinds.PlusPlus }),
					body: tsStrict.build.statementBlock({ terminator: ts.kinds.AutomaticSemicolon })
				})
			]
		});
		expect(built.$render()).toBe('for (let i = 0; i < 3; i++) {}\n');
	});

	it('writes the initializer\'s `;` after an expression initializer, built and edited through $with', () => {
		const built = tsStrict.build.program({
			statements: [
				tsStrict.build.forStatement({
					initializer: tsStrict.build.assignmentExpression({ left: tsStrict.build.lhsExpression(tsStrict.build.identifier('i')), right: tsStrict.build.number('0') }),
					condition: tsStrict.build.binaryExpression({ left: tsStrict.build.identifier('i'), operator: ts.kinds.Lt, right: tsStrict.build.number('3') }),
					increment: tsStrict.build.updateExpression.postfix({ argument: tsStrict.build.identifier('i'), operator: ts.kinds.PlusPlus }),
					body: tsStrict.build.statementBlock({ terminator: ts.kinds.AutomaticSemicolon })
				})
			]
		});
		expect(built.$render()).toBe('for (i = 0; i < 3; i++) {}\n');
		const loop = ts.parse('for (i = 0; i < 3; i++) {}\n').statements()[0] as unknown as { $with: { increment(v: unknown): { $render(): string } } };
		expect(loop.$with.increment(ts.build.updateExpression.postfix({ argument: ts.build.identifier('i'), operator: ts.kinds.PlusPlus })).$render()).toBe('for (i = 0; i < 3; i++) {}');
	});

	it('keeps `for (;;) {}` at three semicolons: an empty statement is its own', () => {
		const built = tsStrict.build.program({
			statements: [
				tsStrict.build.forStatement({
					initializer: ts.kinds.EmptyStatement,
					condition: ts.kinds.EmptyStatement,
					body: tsStrict.build.statementBlock({ terminator: ts.kinds.AutomaticSemicolon })
				})
			]
		});
		expect(built.$render()).toBe('for (;;) {}\n');
	});
});
