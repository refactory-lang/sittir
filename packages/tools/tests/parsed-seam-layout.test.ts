import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../../rust/src/index.ts';
import typescript from '../../typescript/src/index.ts';

const rs = await createEngine(rust);
const ts = await createEngine(typescript);

describe("a template line break at a parsed node's seam obeys the gap's stored layout", () => {
	it.each(['fn f() { x; }\n', 'fn f() {} // c\nfn g() {}\n'])('rust %j snapshots to its source', (source) => {
		expect(rs.render(rs.parse(source).$snapshot()).toString()).toBe(source);
	});

	it('typescript "if (a) { b; }" snapshots to its source', () => {
		const source = 'if (a) { b; }\n';
		expect(ts.render(ts.parse(source).$snapshot()).toString()).toBe(source);
	});

	it('a rust block on one line stays on one line when it renders from its template', () => {
		const [item] = rs.parse('fn f() { x; }\n').statements();
		if (item === undefined || !rs.is.functionItem(item)) throw new Error('expected a function item');
		const body = item.body();
		expect(body.$with.statements(...body.statements()).$render()).toBe('{ x; }');
	});

	it('a typescript block on one line stays on one line, its read terminator kept, when it renders from its template', () => {
		const [statement] = ts.parse('if (a) { b; }\n').statements();
		if (statement === undefined || typeof statement === 'number' || !ts.is.ifStatement(statement)) throw new Error('expected an if statement');
		const consequence = statement.consequence();
		if (!ts.is.statementBlock(consequence)) throw new Error('expected a block');
		expect(consequence.$with.statements(...consequence.statements()).$render()).toBe('{ b; }\n');
	});

	it('items a stored single line break separates keep one break when their owner renders from its template', () => {
		const root = rs.parse('fn f() {} // c\nfn g() {}\n');
		expect(root.$with.statements(...root.statements()).$render()).toBe('fn f() {} // c\nfn g() {}\n');
	});

	it.each([
		[rs, 'enum E {\n    A,\n    B,\n}\n'],
		[ts, 'interface I {\n  a: string;\n  b: number;\n}\n']
	] as const)('%#: a declaration whose breaks equal the options renders unchanged from its snapshot and its template', (engine, source) => {
		const root = engine.parse(source);
		expect(engine.render(root.$snapshot()).toString()).toBe(source);
		expect(root.$with.statements(...root.statements()).$render()).toBe(source);
	});

	it('a per-call option changes a gap that stores nothing, but not a stored deviation', () => {
		const [item] = rs.parse('fn f() {\n    a +\n        b;\n}\n').statements();
		if (item === undefined || !rs.is.functionItem(item)) throw new Error('expected a function item');
		const [statement] = item.body().statements();
		if (statement === undefined || !rs.is.expressionStatement(statement)) throw new Error('expected an expression statement');
		const sum = statement.content().expression();
		if (!rs.is.binaryExpression(sum)) throw new Error('expected a binary expression');
		const rebuilt = sum.$with.left(sum.left());
		const tight = { binaryExpression: { operator: { before: rs.kinds.Tight, after: rs.kinds.Tight } } };
		expect(rs.render(rebuilt, tight).toString()).toBe('a+\n    b');
	});

	it("a built block keeps the template's line breaks", () => {
		const statement = rs.build.expressionStatement(rs.build.identifier('x'));
		expect(rs.build.block({ statements: [statement] }).$render()).toBe('{\n    x;\n}');
		expect(ts.build.statementBlock(ts.build.expressionStatement(ts.build.identifier('b'))).$render()).toBe('{\n  b;\n}');
	});
});
