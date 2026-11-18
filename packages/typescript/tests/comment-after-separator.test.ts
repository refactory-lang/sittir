import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import typescript from '../src/index.ts';

const storages = {
	object: await sharedEngine(() => createEngine(typescript, { nodeStorage: 'object' })),
	arena: await sharedEngine(() => createEngine(typescript, { nodeStorage: 'arena' }))
};

describe.each(Object.entries(storages))('a comment after an item`s separator, read in %s storage', (_, ts) => {
	type Root = ReturnType<typeof ts.parse>;
	type Sided = { $trivia: { leading(): readonly unknown[]; trailing(): readonly unknown[] } };

	const texts = (entries: readonly unknown[]): string[] => entries.filter((entry) => typeof entry === 'object').map((entry) => String(ts.render(entry as never)).trim());
	const sided = (node: unknown): Sided => {
		if (node === undefined || node === null || typeof node !== 'object') throw new Error('expected a node');
		return node as Sided;
	};
	const owns = (node: unknown) => ({ leading: texts(sided(node).$trivia.leading()), trailing: texts(sided(node).$trivia.trailing()) });
	const leadsTheNext = (before: unknown, after: unknown) => {
		expect(owns(before)).toEqual({ leading: [], trailing: [] });
		expect(owns(after)).toEqual({ leading: ['// c'], trailing: [] });
	};

	/** The rendered tree, pinned exactly, and reparsed with no `ERROR`. */
	function rendersAs(root: { $render(): string }, expected: string): void {
		const out = root.$render();
		expect(out).toBe(expected);
		expect(ts.parse(out).$errors).toEqual([]);
	}

	function interfaceMembers(root: Root) {
		const [declaration] = root.statements();
		if (declaration === undefined || !ts.is.interfaceDeclaration(declaration)) throw new Error('expected an interface');
		const body = declaration.body();
		const members = body.members();
		if (members === undefined) throw new Error('expected members');
		return { declaration, body, members };
	}

	describe.each([';', ','])('an interface member followed by `%s`', (separator) => {
		const source = `interface I {\n  a: string${separator} // c\n  b: number\n}\n`;

		it('gives the comment to the member after it', () => {
			const [a, b] = interfaceMembers(ts.parse(source)).members.items();
			leadsTheNext(a, b);
		});

		it('renders the list rebuilt with its own members as the source', () => {
			const root = ts.parse(source);
			const { declaration, body, members } = interfaceMembers(root);
			rendersAs(root.$with.statements(declaration.$with.body(body.$with.members(members.$with.items(...members.items())))), source);
		});
	});

	it('loses the comment when the member after it is replaced, a known gap', () => {
		const root = ts.parse('interface I {\n  a: string; // c\n  b: number\n}\n');
		const { declaration, body, members } = interfaceMembers(root);
		const [a] = members.items();
		const [z] = interfaceMembers(ts.parse('interface J {\n  z: boolean\n}\n')).members.items();
		rendersAs(root.$with.statements(declaration.$with.body(body.$with.members(members.$with.items(a!, z!)))), 'interface I {\n  a: string;\n  z: boolean\n}\n');
	});

	it('gives the comment after an enum member`s comma to the member after it', () => {
		const [declaration] = ts.parse('enum E {\n  A, // c\n  B\n}\n').statements();
		if (declaration === undefined || !ts.is.enumDeclaration(declaration)) throw new Error('expected an enum');
		const [a, b] = declaration.body().elements() ?? [];
		leadsTheNext(a, b);
	});

	function callOf(root: Root) {
		const [statement] = root.statements();
		if (statement === undefined || !ts.is.expressionStatement(statement)) throw new Error('expected an expression statement');
		const call = statement.expression();
		if (!ts.is.callExpressionCall(call)) throw new Error('expected a call');
		return { statement, call, args: call.arguments() };
	}

	it('gives the comment after an argument`s comma to the argument after it', () => {
		const [a, b] = callOf(ts.parse('f(a, // c\n  b)\n')).args.elements();
		leadsTheNext(a, b);
	});

	it('gives the comment after an array item`s comma to the item after it', () => {
		const [array] = callOf(ts.parse('x([a, // c\n  b])\n')).args.elements();
		if (array === undefined || array === null || !ts.is.array(array)) throw new Error('expected an array');
		const [a, b] = array.elements();
		leadsTheNext(a, b);
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
		if (array === undefined || array === null || !ts.is.array(array)) throw new Error('expected an array');
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
		if (declarator === undefined || !ts.is.variableDeclaratorPlain(declarator)) throw new Error('expected a declarator with a value');
		return { declarator, value: declarator.value() };
	}

	it('gives the comment after an operator to the operand after it', () => {
		const { value } = valueOf(ts.parse('const x = b + // c\n  d\n'));
		if (value === undefined || !ts.is.binaryExpression(value)) throw new Error('expected a binary expression');
		leadsTheNext(value.left(), value.right());
	});

	it('gives the comment after `=` to the value after it', () => {
		const { declarator } = valueOf(ts.parse('const x = // c\n  1\n'));
		leadsTheNext(declarator.name(), declarator.value());
	});
});
