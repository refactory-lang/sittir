import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

describe('a layout run carries its excess indentation as depth members', () => {
	it('opens a continuation with an indent, keeps its later lines on it, and closes it inside the call', () => {
		const source = 'foo(a,\n    b,\n    c);\nnext;\n';
		expect(ts.parse(source).$render()).toBe(source);
	});

	it('renders a parsed document by its own unit, and a detached copy by the unit its options name', async () => {
		const source = 'function f() {\n    a();\n}\n';
		const root = ts.parse(source);
		expect(root.$render()).toBe(source);
		const named = await createEngine(typescript, { render: { layout: { indent: '    ' } } });
		expect(named.render(root.$snapshot()).toString()).toBe(source);
		const unnamed = await createEngine(typescript);
		expect(unnamed.render(root.$snapshot()).toString()).toBe('function f() {\n  a();\n}\n');
	});

	it('keeps a copied continuation balanced in the block it moves into', () => {
		const root = ts.parse('function f() {\n  g();\n}\nfoo(a,\n  b,\n  c);\nnext();\n');
		const [fn, call, next] = root.statements();
		if (fn === undefined || !ts.is.functionDeclaration(fn) || call === undefined || next === undefined) throw new Error('expected a function and two statements');
		const body = fn.body();
		const moved = root.$with.statements(fn.$with.body(body.$with.statements(...body.statements(), call)), call, next);
		expect(moved.$render()).toBe('function f() {\n  g();\n  foo(a,\n    b,\n    c);\n}\nfoo(a,\n  b,\n  c);\nnext();\n');
	});

	it('starts a reordered statement written off its level at its new place, without shifting the statement after it', () => {
		const root = ts.parse('function f() {\n  g();\n  // c\n    h();\n}\nnext();\n');
		const [fn, next] = root.statements();
		if (fn === undefined || !ts.is.functionDeclaration(fn) || next === undefined) throw new Error('expected a function and a statement');
		const body = fn.body();
		const [g, h] = body.statements();
		if (g === undefined || h === undefined) throw new Error('expected two statements');
		const reordered = root.$with.statements(fn.$with.body(body.$with.statements(h, g)), next);
		expect(reordered.$render()).toBe('function f() {\n  // c\n  h();\n  g();\n}\nnext();\n');
	});

	it('keeps the old owner and the new parent balanced when a child with a kept depth member moves out', () => {
		const root = ts.parse('foo(a,\n// c\n  b);\nfunction f() {\n  g();\n}\nnext();\n');
		const [statement, fn, next] = root.statements();
		if (statement === undefined || fn === undefined || !ts.is.expressionStatement(statement) || !ts.is.functionDeclaration(fn) || next === undefined) throw new Error('expected a call, a function and a statement');
		const call = statement.expression();
		if (!ts.is.callExpressionCall(call)) throw new Error('expected a plain call');
		const args = call.arguments();
		if (!ts.is.arguments(args)) throw new Error('expected arguments');
		const [a, b] = args.elements();
		if (a === undefined || b === undefined) throw new Error('expected two arguments');
		const body = fn.body();
		const edited = root.$with.statements(
			statement.$with.expression(call.$with.arguments(args.$with.elements(a))),
			fn.$with.body(body.$with.statements(...body.statements(), ts.build.expressionStatement(b))),
			next
		);
		expect(edited.$render()).toBe('foo(a);\nfunction f() {\n  g();\n  // c\n    b;\n}\nnext();\n');
	});
});
