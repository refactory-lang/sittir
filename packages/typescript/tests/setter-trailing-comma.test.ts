// A setter's single parameter may end with a comma. The comma is admitted only
// there: a two-parameter setter with a trailing comma stays a parse error.
// A forwarding builder takes the arguments of the builder it forwards to: a
// setter's parameter list takes the comma as an option; a finally clause and an
// ambient global take their statement block's options first, then statements.
import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

describe('setter_trailing_comma', () => {
	it.each([
		['class setter', 'class A { set x(v: number,) {} }\n'],
		['object setter', 'const o = { set y(v: number,) {} };\n']
	])('parses a %s with a trailing comma without errors, and renders it unedited', async (_label, source) => {
		await using ts = await createEngine(typescript);
		const tree = ts.parse(source);
		expect(tree.$errors).toHaveLength(0);
		expect(tree.$render()).toBe(source);
	});

	it('still refuses a trailing comma after a two-parameter setter', async () => {
		await using ts = await createEngine(typescript);
		expect(ts.parse('class A { set x(v: number, w: number,) {} }\n').$errors.length).toBeGreaterThan(0);
	});

	it('builds a setter with the comma when the option is set, and without it when unset (strict)', async () => {
		await using ts = await createEngine(typescript, { api: 'strict' });
		const block = [...ts.parse('function f() {}').$query().$descendants.ofType(ts.kinds.StatementBlock)][0]!;
		const parameter = ts.build.setterParameter({ pattern: ts.kinds.This });
		const withComma = ts.build.classBodyMemberMethod.setter({
			name: ts.build.identifier('x'),
			parameters: ts.build.formalParametersSetAccessorSignature(parameter, { trailingComma: ts.kinds.Comma }),
			body: block
		});
		const without = ts.build.classBodyMemberMethod.setter({
			name: ts.build.identifier('x'),
			parameters: ts.build.formalParametersSetAccessorSignature(parameter),
			body: block
		});
		expect(withComma.$render()).toBe('set x(this,) {}');
		expect(without.$render()).toBe('set x(this) {}');
	});

	it('builds a setter with the comma when the option is set, and without it when unset (default)', async () => {
		await using ts = await createEngine(typescript);
		const block = [...ts.parse('function f() {}').$query().$descendants.ofType(ts.kinds.StatementBlock)][0]!;
		const parameter = ts.build.setterParameter({ pattern: ts.kinds.This });
		const withComma = ts.build.classBodyMemberMethod.setter({
			name: ts.build.identifier('x'),
			parameters: ts.build.formalParametersSetAccessorSignature(parameter, { trailingComma: ts.kinds.Comma }),
			body: block
		});
		const without = ts.build.classBodyMemberMethod.setter({
			name: ts.build.identifier('x'),
			parameters: ts.build.formalParametersSetAccessorSignature(parameter),
			body: block
		});
		expect(withComma.$render()).toBe('set x(this,) {}');
		expect(without.$render()).toBe('set x(this) {}');
	});
});

describe('the setter parameter list builder, on the strict and default engines', () => {
	it('takes the config form, the parameter with its options, and the parameter alone (strict)', async () => {
		await using ts = await createEngine(typescript, { api: 'strict' });
		const parameter = ts.build.setterParameter({ pattern: ts.kinds.This });
		expect(ts.build.formalParametersSetAccessorSignature({ pattern: ts.kinds.This }).$render()).toBe('(this)');
		expect(ts.build.formalParametersSetAccessorSignature(parameter, { trailingComma: ts.kinds.Comma }).$render()).toBe('(this,)');
		expect(ts.build.formalParametersSetAccessorSignature(parameter).$render()).toBe('(this)');
		expect(ts.build.formalParametersSetAccessorSignature({ pattern: ts.kinds.This }, { trailingComma: ts.kinds.Comma }).$render()).toBe('(this,)');
	});

	it('takes the config form, the parameter with its options, and the parameter alone (default)', async () => {
		await using ts = await createEngine(typescript);
		const parameter = ts.build.setterParameter({ pattern: ts.kinds.This });
		expect(ts.build.formalParametersSetAccessorSignature({ pattern: ts.kinds.This }).$render()).toBe('(this)');
		expect(ts.build.formalParametersSetAccessorSignature(parameter, { trailingComma: ts.kinds.Comma }).$render()).toBe('(this,)');
		expect(ts.build.formalParametersSetAccessorSignature(parameter).$render()).toBe('(this)');
		expect(ts.build.formalParametersSetAccessorSignature({ pattern: ts.kinds.This }, { trailingComma: ts.kinds.Comma }).$render()).toBe('(this,)');
	});
});

describe('a statement block forwarded by a finally clause or an ambient global (strict)', () => {
	it('takes the block options first, then the statements, for each terminator arm', async () => {
		await using ts = await createEngine(typescript, { api: 'strict' });
		const [statement] = [...ts.parse('a;').$query().$descendants.ofType(ts.kinds.ExpressionStatement)];
		expect(ts.build.finallyClause({}, statement!).$render()).toBe('finally {\n  a;\n}');
		expect(ts.build.finallyClause({ terminator: ts.kinds.AutomaticSemicolon }, statement!).$render()).toBe('finally {\n  a;\n}\n');
		expect(ts.build.ambientDeclarationGlobal({}, statement!).$render()).toBe('global {\n  a;\n}');
		expect(ts.build.ambientDeclarationGlobal({ terminator: ts.kinds.AutomaticSemicolon }, statement!).$render()).toBe('global {\n  a;\n}\n');
	});

	it('builds a nested block when the first argument is a block statement', async () => {
		await using ts = await createEngine(typescript, { api: 'strict' });
		const [statement] = [...ts.parse('a;').$query().$descendants.ofType(ts.kinds.ExpressionStatement)];
		const [inner] = [...ts.parse('{ b; }').$query().$descendants.ofType(ts.kinds.StatementBlock)];
		expect(ts.build.finallyClause(inner!, statement!).$render()).toBe('finally {\n  { b; }\n  a;\n}');
	});

	it('fails on a block followed by options, through the statement-list resolution', async () => {
		await using ts = await createEngine(typescript, { api: 'strict' });
		const block = [...ts.parse('function f() {}').$query().$descendants.ofType(ts.kinds.StatementBlock)][0]!;
		// @ts-expect-error a block takes no options after it; its options go in when the block is built
		expect(() => ts.build.finallyClause(block, { terminator: ts.kinds.AutomaticSemicolon })).toThrow();
	});
});

describe('a statement block forwarded by a finally clause or an ambient global (default)', () => {
	it('takes the block options first, then the statements, for each terminator arm', async () => {
		await using ts = await createEngine(typescript);
		const [statement] = [...ts.parse('a;').$query().$descendants.ofType(ts.kinds.ExpressionStatement)];
		expect(ts.build.finallyClause({}, statement!).$render()).toBe('finally {\n  a;\n}');
		expect(ts.build.finallyClause({ terminator: ts.kinds.AutomaticSemicolon }, statement!).$render()).toBe('finally {\n  a;\n}\n');
		expect(ts.build.ambientDeclarationGlobal({}, statement!).$render()).toBe('global {\n  a;\n}');
		expect(ts.build.ambientDeclarationGlobal({ terminator: ts.kinds.AutomaticSemicolon }, statement!).$render()).toBe('global {\n  a;\n}\n');
	});

	it('builds a nested block when the first argument is a block statement', async () => {
		await using ts = await createEngine(typescript);
		const [statement] = [...ts.parse('a;').$query().$descendants.ofType(ts.kinds.ExpressionStatement)];
		const [inner] = [...ts.parse('{ b; }').$query().$descendants.ofType(ts.kinds.StatementBlock)];
		expect(ts.build.finallyClause(inner!, statement!).$render()).toBe('finally {\n  { b; }\n  a;\n}');
	});

	it('fails on a block followed by options, through the statement-list resolution', async () => {
		await using ts = await createEngine(typescript);
		const block = [...ts.parse('function f() {}').$query().$descendants.ofType(ts.kinds.StatementBlock)][0]!;
		expect(() => ts.build.finallyClause(block, { terminator: ts.kinds.AutomaticSemicolon })).toThrow();
	});
});

describe('a bare label takes its statement options after it, on the strict and default engines', () => {
	it('break takes the terminator option after the label (strict)', async () => {
		await using ts = await createEngine(typescript, { api: 'strict' });
		expect(ts.build.breakStatement(ts.build.identifier('x'), { terminator: ts.kinds.AutomaticSemicolon }).$render()).toBe('break x\n');
		expect(ts.build.continueStatement(ts.build.identifier('x'), { terminator: ts.kinds.AutomaticSemicolon }).$render()).toBe('continue x\n');
	});

	it('break takes the terminator option after the label (default)', async () => {
		await using ts = await createEngine(typescript);
		expect(ts.build.breakStatement(ts.build.identifier('x'), { terminator: ts.kinds.AutomaticSemicolon }).$render()).toBe('break x\n');
		expect(ts.build.continueStatement(ts.build.identifier('x'), { terminator: ts.kinds.AutomaticSemicolon }).$render()).toBe('continue x\n');
	});
});

describe('the setter parameter elements sub-builder (strict)', () => {
	it('takes the config form with the trailing comma option', async () => {
		await using ts = await createEngine(typescript, { api: 'strict' });
		expect(ts.build.formalParametersSetAccessorSignature.elements({ pattern: ts.kinds.This }, { trailingComma: ts.kinds.Comma }).$render()).toBe('(this,)');
	});
});
