import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import typescript from '../src/index.ts';

const storages = {
	object: await sharedEngine(() => createEngine(typescript, { nodeStorage: 'object' })),
	arena: await sharedEngine(() => createEngine(typescript, { nodeStorage: 'arena' }))
};

describe.each(Object.entries(storages))('a comment that ends its row past the tokens after a node, read in %s storage', (_, ts) => {
	type Root = ReturnType<typeof ts.parse>;
	type Sided = { $trivia: { leading(): readonly unknown[]; trailing(): readonly unknown[] } };

	const texts = (entries: readonly unknown[]): string[] => entries.filter((entry) => typeof entry === 'object').map((entry) => String(ts.render(entry as never)).trim());
	const sided = (node: unknown): Sided => {
		if (node === undefined || node === null || typeof node !== 'object') throw new Error('expected a node');
		return node as Sided;
	};
	const owns = (node: unknown) => ({ leading: texts(sided(node).$trivia.leading()), trailing: texts(sided(node).$trivia.trailing()) });

	/** The rendered tree, pinned exactly, and reparsed with no `ERROR`. */
	function rendersAs(root: { $render(): string }, expected: string): void {
		const out = root.$render();
		expect(out).toBe(expected);
		expect(ts.parse(out).$errors).toEqual([]);
	}

	function interfaceMembers(root: Root) {
		const [declaration] = root.statements();
		if (declaration === undefined || !ts.is.interfaceDeclaration(declaration)) throw new Error('expected an interface');
		return { declaration, body: declaration.body(), members: declaration.body().members() };
	}

	describe.each([';', ','])('an interface member followed by `%s`', (separator) => {
		const source = `interface I {\n  a: string${separator} // c\n  b: number\n}\n`;
		const replacement = () => interfaceMembers(ts.parse('interface J {\n  z: boolean\n}\n')).members.items()[0];

		it('gives the comment to the member it follows', () => {
			const [a, b] = interfaceMembers(ts.parse(source)).members.items();
			expect(owns(a)).toEqual({ leading: [], trailing: ['// c'] });
			expect(owns(b)).toEqual({ leading: [], trailing: [] });
		});

		it('writes the comment after the separator when the list is rebuilt', () => {
			const root = ts.parse(source);
			const { declaration, body, members } = interfaceMembers(root);
			rendersAs(root.$with.statements(declaration.$with.body(body.$with.members(members.$with.items(...members.items())))), source);
		});

		it('keeps the comment when the next member is replaced', () => {
			const root = ts.parse(source);
			const { declaration, body, members } = interfaceMembers(root);
			const [a] = members.items();
			rendersAs(root.$with.statements(declaration.$with.body(body.$with.members(members.$with.items(a!, replacement()!)))), `interface I {\n  a: string${separator} // c\n  z: boolean\n}\n`);
		});
	});

	it('gives the comment after an enum member`s comma to that member, and keeps it when the next member is replaced', () => {
		const source = 'enum E {\n  A, // c\n  B\n}\n';
		const root = ts.parse(source);
		const [declaration] = root.statements();
		if (declaration === undefined || !ts.is.enumDeclaration(declaration)) throw new Error('expected an enum');
		const body = declaration.body();
		const [a, b] = body.elements();
		expect(owns(a)).toEqual({ leading: [], trailing: ['// c'] });
		expect(owns(b)).toEqual({ leading: [], trailing: [] });
		const [z] = (() => {
			const [other] = ts.parse('enum F {\n  Z\n}\n').statements();
			if (other === undefined || !ts.is.enumDeclaration(other)) throw new Error('expected an enum');
			return other.body().elements();
		})();
		rendersAs(root.$with.statements(declaration.$with.body(body.$with.elements(a!, z!))), 'enum E {\n  A, // c\n  Z\n}\n');
	});

	function callOf(root: Root) {
		const [statement] = root.statements();
		if (statement === undefined || !ts.is.expressionStatement(statement)) throw new Error('expected an expression statement');
		const call = statement.expression();
		if (!ts.is.callExpressionCall(call)) throw new Error('expected a call');
		return { statement, call, args: call.arguments() };
	}

	it('gives the comment after an argument`s comma to that argument, and keeps it when the next argument is replaced', () => {
		const root = ts.parse('f(a, // c\n  b)\n');
		const { statement, call, args } = callOf(root);
		const [a, b] = args.elements();
		expect(owns(a)).toEqual({ leading: [], trailing: ['// c'] });
		expect(owns(b)).toEqual({ leading: [], trailing: [] });
		rendersAs(root.$with.statements(statement.$with.expression(call.$with.arguments(args.$with.elements(a!, ts.build.identifier('z'))))), 'f(a, // c\nz)\n');
	});

	it('gives the comment after an array item`s comma to that item, and keeps it when the next item is replaced', () => {
		const root = ts.parse('x([a, // c\n  b])\n');
		const { statement, call, args } = callOf(root);
		const [array] = args.elements();
		if (!ts.is.array(array)) throw new Error('expected an array');
		const [a, b] = array.elements();
		expect(owns(a)).toEqual({ leading: [], trailing: ['// c'] });
		expect(owns(b)).toEqual({ leading: [], trailing: [] });
		rendersAs(root.$with.statements(statement.$with.expression(call.$with.arguments(args.$with.elements(array.$with.elements(a!, ts.build.identifier('z')))))), 'x([a, // c\nz])\n');
	});

	const tokensBetween = (node: unknown): unknown[] => sided(node).$trivia.trailing().map((entry) => (entry as { $tokensBetween?: unknown }).$tokensBetween);

	it('marks a comment past the tokens after a leaf owner with $tokensBetween, as after a record owner', () => {
		const [a] = callOf(ts.parse('f(a, // c\n  b)\n')).args.elements();
		expect(tokensBetween(a)).toEqual([true]);
		const [member] = interfaceMembers(ts.parse('interface I {\n  a: string; // c\n  b: number\n}\n')).members.items();
		expect(tokensBetween(member)).toEqual([true]);
	});

	it('leaves $tokensBetween off a comment beside its owner, before the tokens', () => {
		const [a] = callOf(ts.parse('f(a /* x */, // c\n  b)\n')).args.elements();
		expect(tokensBetween(a)).toEqual([undefined, true]);
	});

	it('writes a side given back its entries with the comment after the separator', () => {
		const root = ts.parse('f(a, // c\n  b)\n');
		const { statement, call, args } = callOf(root);
		const [a, b] = args.elements();
		const written = sided(a).$trivia.trailing(...sided(a).$trivia.trailing());
		rendersAs(root.$with.statements(statement.$with.expression(call.$with.arguments(args.$with.elements(written as never, b!)))), 'f(a, // c\n  b)\n');
	});

	it('leaves a comment the next item follows on its row leading that item', () => {
		const { args } = callOf(ts.parse('f(a, /* c */ b)\n'));
		const [a, b] = args.elements();
		expect(owns(a)).toEqual({ leading: [], trailing: [] });
		expect(owns(b)).toEqual({ leading: ['/* c */'], trailing: [] });
	});

	it('leaves a comment before an array item on its row leading that item', () => {
		const { args } = callOf(ts.parse('x([/* A */ a, /* B */ b])\n'));
		const [array] = args.elements();
		if (!ts.is.array(array)) throw new Error('expected an array');
		const [a, b] = array.elements();
		expect(owns(a)).toEqual({ leading: ['/* A */'], trailing: [] });
		expect(owns(b)).toEqual({ leading: ['/* B */'], trailing: [] });
	});

	it('measures a comment after a multi-line comment from the end row of the statement before it', () => {
		const root = ts.parse('function f() {\n  a; /* x\n  */ /* y */ b;\n}\n');
		const [fn] = root.statements();
		if (fn === undefined || !ts.is.functionDeclaration(fn)) throw new Error('expected a function');
		const [a, b] = fn.body().statements();
		expect(owns(a)).toEqual({ leading: [], trailing: ['/* x\n  */'] });
		expect(owns(b)).toEqual({ leading: ['/* y */'], trailing: [] });
	});

	function valueOf(root: Root) {
		const [declaration] = root.statements();
		if (declaration === undefined || !ts.is.lexicalDeclaration(declaration)) throw new Error('expected a declaration');
		const [declarator] = declaration.declarators();
		if (declarator === undefined || !ts.is.variableDeclarator(declarator)) throw new Error('expected a declarator');
		return { declaration, declarator, value: declarator.value() };
	}

	it('gives the comment after an operator to the operand before it, and keeps it when the operand after it is replaced', () => {
		const root = ts.parse('const x = b + // c\n  d\n');
		const { declaration, declarator, value } = valueOf(root);
		if (!ts.is.binaryExpression(value)) throw new Error('expected a binary expression');
		expect(owns(value.left())).toEqual({ leading: [], trailing: ['// c'] });
		expect(owns(value.right())).toEqual({ leading: [], trailing: [] });
		rendersAs(root.$with.statements(declaration.$with.declarators(declarator.$with.value(value.$with.right(ts.build.identifier('z'))))), 'const x = b + // c\nz\n');
	});

	it('gives the comment after `=` to the name before it, and keeps it when the value after it is replaced', () => {
		const root = ts.parse('const x = // c\n  1\n');
		const { declaration, declarator } = valueOf(root);
		expect(owns(declarator.name())).toEqual({ leading: [], trailing: ['// c'] });
		expect(owns(declarator.value())).toEqual({ leading: [], trailing: [] });
		rendersAs(root.$with.statements(declaration.$with.declarators(declarator.$with.value(ts.build.identifier('z')))), 'const x = // c\nz\n');
	});
});
