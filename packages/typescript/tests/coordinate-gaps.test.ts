// A rebuilt list keeps the source bytes of every gap whose two items were
// adjacent in the source, and gives every other gap its canonical spelling:
// the seat of the kind before it, or the render option.
import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

describe('gaps between coordinates', () => {
	it('keeps the blank lines a parsed block spelled and seats a statement appended after them', () => {
		const source = 'function f() {\n  a();\n\n  b();\n\n  c();\n}\n';
		const fn = ts.parse(source).statements()[0]!;
		if (!ts.is.functionDeclaration(fn)) throw new Error('expected a function declaration');
		const body = fn.body();
		const rebuilt = body.$with.statements(
			...body.statements(),
			ts.build.expressionStatement.strict(
				ts.build.callExpression.call.strict({ function: ts.build.identifier('d'), arguments: ts.build.arguments.strict() }),
				{ terminator: ts.kinds.Semi }
			)
		);
		// The blank lines are the claim; the indent width is the format's.
		const text = rebuilt.$render().replace(/\n[ \t]+/g, '\n');
		expect(text).toContain('a();\n\nb();\n\nc();\nd();');
		expect(ts.render(rebuilt).toString()).toBe(rebuilt.$render());
	});

	it('spells the gaps around a replaced argument canonically and keeps the untouched pairs tight', () => {
		const statement = ts.parse('f(a,b,c);\n').statements()[0]!;
		if (!ts.is.expressionStatement(statement)) throw new Error('expected an expression statement');
		const call = statement.expression();
		if (!ts.is.callExpression(call)) throw new Error('expected a call expression');
		const args = call.arguments();
		if (!ts.is.arguments(args)) throw new Error('expected arguments');
		const [a, b, c] = args.elements();
		const rebuilt = args.$with.elements(a!, ts.build.identifier('x'), c!);
		expect(rebuilt.$render()).toBe('(a, x, c)');
		expect(ts.render(rebuilt).toString()).toBe('(a, x, c)');
		expect(args.$with.elements(a!, b!, c!).$render()).toBe('(a,b,c)');
	});

	it('keeps the source gaps around an edited argument', () => {
		const statement = ts.parse('f(a.x,b.x,c.x);\n').statements()[0]!;
		if (!ts.is.expressionStatement(statement)) throw new Error('expected an expression statement');
		const call = statement.expression();
		if (!ts.is.callExpression(call)) throw new Error('expected a call expression');
		const args = call.arguments();
		if (!ts.is.arguments(args)) throw new Error('expected arguments');
		const [a, b, c] = args.elements();
		if (b === undefined || typeof b === 'number' || !ts.is.memberExpression(b)) throw new Error('expected a member expression');
		const edited = b.$with.object(ts.build.identifier('y')) as typeof b;
		expect(args.$with.elements(a!, edited, c!).$render()).toBe('(a.x,y.x,c.x)');
	});
});
