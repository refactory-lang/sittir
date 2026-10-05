// A builder whose one real slot repeats takes its items positionally, and a
// preference the options block registers goes first, in a leading options
// object, as it does for a list builder.
import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import type * as T from '../src/types.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

const declarator = (name: string, value: string) =>
	ts.build.variableDeclarator.plain.strict({ name: ts.build.identifier(name), value: ts.build.number(value) });

describe('variable_declaration takes its declarators positionally', () => {
	it('strict: items alone, then a leading options block', () => {
		expect(ts.build.variableDeclaration.strict(declarator('x', '1'), declarator('y', '2')).$render()).toBe('var x = 1, y = 2;');
		expect(ts.build.variableDeclaration.strict({ terminator: ts.kinds.AutomaticSemicolon }, declarator('x', '1')).$render()).toBe(
			'var x = 1\n'
		);
	});

	it('loose: items alone, then a leading options block', () => {
		expect(ts.build.variableDeclaration(declarator('x', '1')).$render()).toBe('var x = 1;');
		expect(ts.build.variableDeclaration({ terminator: ts.kinds.AutomaticSemicolon }, declarator('x', '1')).$render()).toBe('var x = 1\n');
	});

	it('setters and a loose rebuild keep the chosen terminator', () => {
		const built = ts.build.variableDeclaration.strict({ terminator: ts.kinds.AutomaticSemicolon }, declarator('x', '1'));
		expect(built.$with.declarators(declarator('z', '3')).$render()).toBe('var z = 3\n');
		expect(ts.build.variableDeclaration.strict(declarator('x', '1')).$with.terminator(ts.kinds.AutomaticSemicolon).$render()).toBe('var x = 1\n');
		expect(ts.build.variableDeclaration(built).$render()).toBe('var x = 1\n');
	});
});

const statement = () => ts.build.expressionStatement.strict(ts.build.identifier('a'));

describe('statement_block takes its statements positionally and its terminator as a blank-armed preference', () => {
	it('strict: items alone, then a leading options block choosing either arm', () => {
		expect(ts.build.statementBlock.strict(statement(), statement()).$render()).toBe('{\n  a;\n  a;\n}');
		expect(ts.build.statementBlock.strict().$render()).toBe('{}');
		expect(ts.build.statementBlock.strict({ terminator: ts.kinds.AutomaticSemicolon }, statement()).$render()).toBe('{\n  a;\n}\n');
		expect(ts.build.statementBlock.strict({ terminator: null }, statement()).$render()).toBe('{\n  a;\n}');
	});

	it('loose: items alone, then a leading options block', () => {
		expect(ts.build.statementBlock(statement()).$render()).toBe('{\n  a;\n}');
		expect(ts.build.statementBlock({ terminator: ts.kinds.AutomaticSemicolon }, statement()).$render()).toBe('{\n  a;\n}\n');
	});

	it('setters choose and keep the terminator', () => {
		expect(ts.build.statementBlock.strict(statement()).$with.terminator(ts.kinds.AutomaticSemicolon).$render()).toBe('{\n  a;\n}\n');
		const chosen = ts.build.statementBlock.strict({ terminator: ts.kinds.AutomaticSemicolon }, statement());
		expect(chosen.$with.statements(statement(), statement()).$render()).toBe('{\n  a;\n  a;\n}\n');
		expect(chosen.$with.terminator(null).$render()).toBe('{\n  a;\n}');
	});
});

describe('the terminator preference fills only an unset slot', () => {
	const asiEngine = createEngine(typescript, { render: { statementBlock: { terminator: ts.kinds.AutomaticSemicolon } } } as never);

	it('an engine option fills an unset terminator, and a per-call null picks the blank', async () => {
		const asi = await asiEngine;
		const block = ts.build.statementBlock.strict();
		expect(ts.render(block).toString()).toBe('{}');
		expect(asi.render(block).toString()).toBe('{}\n');
		expect(asi.render(block, { statementBlock: { terminator: null } } as never).toString()).toBe('{}');
	});

	it('a parsed block keeps the blank or line break it was read with when rebuilt', async () => {
		const asi = await asiEngine;
		const consequence = (source: string) => (asi.parse(source) as never as { statements(): { consequence(): T.StatementBlock.Parsed }[] }).statements()[0]!.consequence();
		expect(asi.render(consequence('if (x) { a; } b;\n').$with.statements(statement())).toString()).toBe('{\n  a;\n}');
		expect(asi.render(consequence('if (x) { a; }\nb;\n').$with.statements(statement())).toString()).toBe('{\n  a;\n}\n');
	});
});

describe('a class method defaults to no terminator', () => {
	const method = () => ts.build.methodDefinition({ name: 'foo', parameters: ts.build.formalParameters(), body: ts.build.statementBlock() });

	it('a method built without a terminator renders bare; a chosen `;` renders', () => {
		expect(ts.build.classBody(ts.build.classBodyMember.method({ methodDefinition: method() })).$render()).toBe('{\n  foo() {}\n}');
		expect(
			ts.build.classBody(ts.build.classBodyMember.method({ methodDefinition: method() }, { terminator: ts.kinds.Semi })).$render()
		).toBe('{\n  foo() {};\n}');
	});

	it('a rebuilt class body keeps a parsed method bare or terminated', () => {
		const rebuilt = (source: string) => {
			const body = (ts.parse(source) as never as { statements(): { body(): T.ClassBody.Parsed }[] }).statements()[0]!.body();
			return ts.render(body.$with.members(...body.members())).toString();
		};
		expect(rebuilt('class A { foo() {} }\n')).toBe('{\n  foo() {}\n}');
		expect(rebuilt('class A { foo() {}; }\n')).toBe('{\n  foo() {};\n}');
	});
});

describe('class_static_block takes its body positionally and its terminator in a trailing options block', () => {
	it('strict and loose', () => {
		expect(ts.build.classStaticBlock.strict(ts.build.statementBlock.strict(statement())).$render()).toBe('static {\n  a;\n}');
		expect(ts.build.classStaticBlock.strict(ts.build.statementBlock.strict(), { terminator: ts.kinds.AutomaticSemicolon }).$render()).toBe(
			'static\n{}'
		);
		expect(ts.build.classStaticBlock(ts.build.statementBlock(statement())).$render()).toBe('static {\n  a;\n}');
	});
});
