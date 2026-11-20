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
const automatic = { statements: { terminator: ts.kinds.AutomaticSemicolon } } as const;
const tsAutomatic = await createEngine(typescript, { api: 'strict', render: automatic });

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
		const built = tsStrict.build.program({
			statements: [
				tsStrict.build.forStatement({
					initializer: tsStrict.build.forInitializerLetConstKind({
						kind: ts.kinds.LetKeyword,
						declarators: [tsStrict.build.variableDeclarator.plain({ name: tsStrict.build.identifier('i'), value: tsStrict.build.number('0') })]
					}),
					condition: tsStrict.build.binaryExpression({ left: tsStrict.build.identifier('i'), operator: ts.kinds.Lt, right: tsStrict.build.number('3') }),
					increment: tsStrict.build.updateExpression.postfix({ argument: tsStrict.build.identifier('i'), operator: ts.kinds.PlusPlus }),
					body: tsStrict.build.statementBlock({ terminator: ts.kinds.AutomaticSemicolon })
				})
			]
		});
		expect(built.$render()).toBe('for (let i = 0; i < 3; i++) {}\n');
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

describe('a classic for header declaration keeps the loop\'s `;` under either terminator option', () => {
	const engines = [
		['the default terminator', tsStrict],
		['AutomaticSemicolon', tsAutomatic]
	] as const;
	const declarator = (e: typeof tsStrict) => e.build.variableDeclarator.plain({ name: e.build.identifier('i'), value: e.build.number('0') });
	const headers = {
		let: (e: typeof tsStrict) => e.build.forInitializerLetConstKind({ kind: ts.kinds.LetKeyword, declarators: [declarator(e)] }),
		const: (e: typeof tsStrict) => e.build.forInitializerLetConstKind({ kind: ts.kinds.ConstKeyword, declarators: [declarator(e)] }),
		var: (e: typeof tsStrict) => e.build.forInitializerVarKind(declarator(e)),
		using: (e: typeof tsStrict) => e.build.forInitializerUsingKind({ kind: ts.kinds.UsingKeyword, declarators: [declarator(e)] })
	} as const;
	const forWith = (e: typeof tsStrict, initializer: ReturnType<(typeof headers)[keyof typeof headers]>) =>
		e.build.program({
			statements: [
				e.build.forStatement({
					initializer,
					condition: e.build.binaryExpression({ left: e.build.identifier('i'), operator: ts.kinds.Lt, right: e.build.number('3') }),
					increment: e.build.updateExpression.postfix({ argument: e.build.identifier('i'), operator: ts.kinds.PlusPlus }),
					body: e.build.statementBlock({ terminator: ts.kinds.AutomaticSemicolon })
				})
			]
		});

	describe.each(engines)('%s', (_, engine) => {
		it.each(Object.keys(headers) as (keyof typeof headers)[])('a built `%s` header renders its declaration and the loop\'s `;`', (keyword) => {
			expect(engine.render(forWith(engine, headers[keyword](engine))).toString()).toBe(`for (${keyword} i = 0; i < 3; i++) {}\n`);
		});

		it.each(['let', 'const', 'var', 'using', 'await using'])('a parsed `%s` header edited through $with renders the loop\'s `;` and an untouched parse its source bytes', (keyword) => {
			const source = `for (${keyword} i = 0; i < 3; i++) {}\n`;
			const tree = engine.parse(source);
			expect(tree.$render()).toBe(source);
			const loop = tree.statements()[0] as unknown as { $with: { increment(v: unknown): { $render(): string } } };
			const edited = loop.$with.increment(engine.build.updateExpression.postfix({ argument: engine.build.identifier('i'), operator: ts.kinds.PlusPlus }));
			expect(edited.$render()).toBe(`for (${keyword} i = 0; i < 3; i++) {}`);
		});
	});

	it.each(engines)('an expression initializer keeps the loop\'s `;` when built and when edited through $with (%s)', (_, engine) => {
		const initializer = engine.build.assignmentExpression({ left: engine.build.lhsExpression(engine.build.identifier('i')), right: engine.build.number('0') });
		expect(engine.render(forWith(engine, initializer as never)).toString()).toBe('for (i = 0; i < 3; i++) {}\n');
		const loop = engine.parse('for (i = 0; i < 3; i++) {}\n').statements()[0] as unknown as { $with: { increment(v: unknown): { $render(): string } } };
		expect(loop.$with.increment(engine.build.updateExpression.postfix({ argument: engine.build.identifier('i'), operator: ts.kinds.PlusPlus })).$render()).toBe('for (i = 0; i < 3; i++) {}');
	});

	it('a statement-level declaration still takes the terminator option', () => {
		const statement = (e: typeof tsStrict) =>
			e.build.program({ statements: [e.build.lexicalDeclaration({ kind: ts.kinds.LetKeyword, declarators: [declarator(e)] })] });
		expect(tsStrict.render(statement(tsStrict)).toString()).toBe('let i = 0;\n');
		expect(tsAutomatic.render(statement(tsAutomatic)).toString()).toBe('let i = 0\n');
	});

	it('the parse refuses a for header whose declaration ends in a line break instead of `;`', () => {
		for (const keyword of ['let', 'var']) {
			const tree = ts.parse(`for (${keyword} i = 0\ni < 3; i++) {}\n`);
			expect(tree.statements()[0] && ts.is.forStatement(tree.statements()[0])).not.toBe(true);
		}
	});
});
