// A rebuilt node whose list items are still coordinates renders the class
// its source spelled, by majority, in place of the engine's option: blank
// lines survive an append, and a tight comma list survives a replace.
import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

describe('gaps between coordinates', () => {
	it('keeps the blank lines a parsed block spelled when a statement is appended', () => {
		const source = 'function f() {\n  a();\n\n  b();\n\n  c();\n}\n';
		const fn = ts.parse(source).statements()[0]!;
		if (!ts.is.functionDeclaration(fn)) throw new Error('expected a function declaration');
		const body = fn.body();
		const rebuilt = body.$with.statements([
			...body.statements(),
			ts.build.expressionStatement.strict(
				ts.build.callExpression.call.strict({ function: ts.build.identifier('d'), arguments: ts.build.arguments.strict() }),
				{ terminator: ts.kinds.Semi }
			)
		]);
		// The blank lines are the claim; the indent width is the format's.
		const text = rebuilt.$render().replace(/\n[ \t]+/g, '\n');
		expect(text).toContain('a();\n\nb();\n\nc();\n\nd();');
		expect(ts.render(rebuilt).toString()).toBe(rebuilt.$render());
	});

	it('keeps a tight comma list tight when an argument is replaced', () => {
		const statement = ts.parse('f(a,b,c);\n').statements()[0]!;
		if (!ts.is.expressionStatement(statement)) throw new Error('expected an expression statement');
		const call = statement.expression();
		if (!ts.is.callExpression(call)) throw new Error('expected a call expression');
		const args = call.arguments();
		if (!ts.is.arguments(args)) throw new Error('expected arguments');
		const [a, , c] = args.elements();
		const rebuilt = args.$with.elements(a!, ts.build.identifier('x'), c!);
		expect(rebuilt.$render()).toBe('(a,x,c)');
		expect(ts.render(rebuilt).toString()).toBe('(a,x,c)');
	});
});
