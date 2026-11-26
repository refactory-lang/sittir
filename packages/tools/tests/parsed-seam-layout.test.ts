import { describe, expect, it } from 'vitest';
import { sharedEngine } from '@sittir/common/testing';
import { createEngine } from '@sittir/common';
import rust from '../../rust/src/index.ts';
import typescript from '../../typescript/src/index.ts';

const rs = await sharedEngine(() => createEngine(rust));
const ts = await sharedEngine(() => createEngine(typescript));

describe("a template line break at a parsed node's seam obeys the options", () => {
	it.each([
		['fn f() { x; }\n', 'fn f() {\n    x;\n}\n'],
		['fn f() {} // c\nfn g() {}\n', 'fn f() {} // c\n\nfn g() {}\n']
	])('rust %j snapshots in the options\' layout', (source, expected) => {
		expect(rs.render(rs.parse(source).$snapshot()).toString()).toBe(expected);
	});

	it('typescript "if (a) { b; }" snapshots in the options\' layout', () => {
		expect(ts.render(ts.parse('if (a) { b; }\n').$snapshot()).toString()).toBe('if (a) {\n  b;\n}\n');
	});

	it('a rust block on one line breaks as the options do when it renders from its template', () => {
		const [item] = rs.parse('fn f() { x; }\n').statements();
		if (item === undefined || !rs.is.functionItem(item)) throw new Error('expected a function item');
		const body = item.body();
		expect(body.$with.statements(...body.statements()).$render()).toBe('{\n    x;\n}');
	});

	it('a typescript block on one line breaks as the options do, its read terminator kept, when it renders from its template', () => {
		const [statement] = ts.parse('if (a) { b; }\n').statements();
		if (statement === undefined || typeof statement === 'number' || !ts.is.ifStatement(statement)) throw new Error('expected an if statement');
		const consequence = statement.consequence();
		if (!ts.is.statementBlock(consequence)) throw new Error('expected a block');
		expect(consequence.$with.statements(...consequence.statements()).$render()).toBe('{\n  b;\n}\n');
	});

	it('items a comment ends the row between take the options\' gap between items when their owner renders from its template', () => {
		const root = rs.parse('fn f() {} // c\nfn g() {}\n');
		expect(root.$with.statements(...root.statements()).$render()).toBe('fn f() {} // c\n\nfn g() {}\n');
	});

	it('a rust enum whose breaks equal the options renders unchanged from its snapshot and its template', () => {
		const source = 'enum E {\n    A,\n    B,\n}\n';
		const root = rs.parse(source);
		expect(rs.render(root.$snapshot()).toString()).toBe(source);
		expect(root.$with.statements(...root.statements()).$render()).toBe(source);
	});

	it('a typescript interface whose breaks equal the options renders unchanged from its snapshot and its template', () => {
		const source = 'interface I {\n  a: string;\n  b: number;\n}\n';
		const root = ts.parse(source);
		expect(ts.render(root.$snapshot()).toString()).toBe(source);
		expect(root.$with.statements(...root.statements()).$render()).toBe(source);
	});

	it('a per-call option changes a gap, which the read stores nothing for', () => {
		const [item] = rs.parse('fn f() {\n    a +\n        b;\n}\n').statements();
		if (item === undefined || !rs.is.functionItem(item)) throw new Error('expected a function item');
		const [statement] = item.body().statements();
		if (statement === undefined || !rs.is.expressionStatement(statement)) throw new Error('expected an expression statement');
		const content = statement.content();
		if (!('expression' in content)) throw new Error('expected an expression with its semicolon');
		const sum = content.expression();
		if (!rs.is.binaryExpression(sum)) throw new Error('expected a binary expression');
		expect(rs.render(sum.$snapshot()).toString()).toBe('a + b');
		expect(rs.render(sum.$snapshot(), { binaryExpression: { operator: { before: rs.kinds.Tight, after: rs.kinds.Tight } } }).toString()).toBe('a+b');
	});

	it.each(['fn f() {x;}\n', 'fn f() {x; }\n'])('rust %j, tight where the options break, snapshots in the options\' layout', (source) => {
		expect(rs.render(rs.parse(source).$snapshot()).toString()).toBe('fn f() {\n    x;\n}\n');
	});

	it('typescript "if (a) {b;}" snapshots in the options\' layout', () => {
		expect(ts.render(ts.parse('if (a) {b;}\n').$snapshot()).toString()).toBe('if (a) {\n  b;\n}\n');
	});

	it('a tight entry written on a side holds its gap tight', () => {
		const [item] = rs.parse('fn f() {\n    x;\n}\n').statements();
		if (item === undefined || !rs.is.functionItem(item)) throw new Error('expected a function item');
		const body = item.body();
		const [statement] = body.statements();
		if (statement === undefined || !rs.is.expressionStatement(statement)) throw new Error('expected an expression statement');
		statement.$trivia.leading(rs.kinds.Tight);
		expect(body.$with.statements(...body.statements()).$render()).toBe('{x;\n}');
	});

	it.each(['#!\nfn main() {}\n', '#!\n\nfn main() {}\n'])('rust %j, a token that ends its own line, renders with one break after it from its snapshot and its rebuilt root', (source) => {
		const root = rs.parse(source);
		expect(rs.render(root.$snapshot()).toString()).toBe('#!\nfn main() {}\n');
		expect(root.$with.statements(...root.statements()).$render()).toBe('#!\nfn main() {}\n');
	});

	it("a built block keeps the template's line breaks", () => {
		const statement = rs.build.expressionStatement(rs.build.identifier('x'));
		expect(rs.build.block({ statements: [statement] }).$render()).toBe('{\n    x;\n}');
		expect(ts.build.statementBlock(ts.build.expressionStatement(ts.build.identifier('b'))).$render()).toBe('{\n  b;\n}');
	});
});
