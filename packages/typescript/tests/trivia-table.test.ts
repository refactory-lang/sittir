import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sidesOf } from '@sittir/common/utils';
import typescript from '../src/index.ts';

const engine = await createEngine(typescript);
const { build } = engine;
type Root = ReturnType<typeof engine.parse>;

function functionAt(root: Root, at: number) {
	const fn = root.statements()[at];
	if (fn === undefined || !engine.is.functionDeclaration(fn)) throw new Error('expected a function');
	return fn;
}

function statementAt(root: Root, fnAt: number, at: number) {
	const statement = functionAt(root, fnAt).body().statements()[at];
	if (statement === undefined || typeof statement !== 'object') throw new Error('expected a statement');
	return statement;
}

function viaQuery(root: Root, fnAt: number, at: number) {
	const fn = root.$query().$descendants.ofType(engine.kinds.FunctionDeclaration).at(fnAt);
	if (fn === undefined || !engine.is.functionDeclaration(fn)) throw new Error('expected a function');
	const statement = fn.body().statements()[at];
	if (statement === undefined || typeof statement !== 'object') throw new Error('expected a statement');
	return statement;
}

const statement = (name: string) => build.expressionStatement(build.identifier(name) as never);

/** The rendered tree, pinned exactly, and reparsed with no `ERROR`. */
function rendersAs(root: { $render(): string }, expected: string): void {
	const out = root.$render();
	expect(out).toBe(expected);
	expect(engine.parse(out).$errors).toEqual([]);
}

/** The body of a parsed `function g`, with `inner` moved in after its one statement; a body renders its stored automatic semicolon as a line break. */
function movedInto(inner: ReturnType<typeof functionAt>) {
	const outer = engine.parse('function g() {\n  x();\n}\n');
	const body = functionAt(outer, 0).body();
	return body.$with.statements(...body.statements(), inner);
}

describe.each([
	['the accessors', statementAt],
	['a query', viaQuery]
])('a write on a node reached through %s', (_, reach) => {
	it('is accepted and renders in the whole tree', () => {
		const root = engine.parse('function a() {}\nfunction b() { let x = 1; }\n');
		reach(root, 1, 0).$trivia.leading('// before');
		rendersAs(root, 'function a() {}\nfunction b() {\n  // before\n  let x = 1;\n}\n');
	});

	it('keeps a deeper-indented comment between its siblings', () => {
		const root = engine.parse('function f() {\n  a();\n      // deep\n  b();\n}\n');
		reach(root, 0, 0).$trivia.leading('// lead');
		rendersAs(root, 'function f() {\n  // lead\n  a();\n      // deep\n  b();\n}\n');
	});
});

describe("a block keeps its source's indentation step", () => {
	for (const step of ['  ', '    ']) {
		const source = `function f() {\n${step}a();\n${step}b();\n}\n`;

		it(`renders a ${step.length}-space block in place from its template after an edit in it`, () => {
			const root = engine.parse(source);
			statementAt(root, 0, 1).$trivia.leading('// c');
			rendersAs(root, `function f() {\n${step}a();\n${step}// c\n${step}b();\n}\n`);
		});

		it(`renders a ${step.length}-space block moved one level deeper at the new line's indentation plus its step`, () => {
			const moved = movedInto(functionAt(engine.parse(source), 0));
			expect(moved.$render()).toBe(`{\n  x();\n  function f() {\n  ${step}a();\n  ${step}b();\n  }\n}\n`);
		});

		it(`gives a built statement written into a ${step.length}-space block the writer's depth`, () => {
			const body = functionAt(engine.parse(source), 0).body();
			expect(body.$with.statements(...body.statements(), statement('c')).$render()).toBe(`{\n${step}a();\n${step}b();\n${step}c;\n}\n`);
		});
	}

	it('keeps a continuation aligned under a paren, in place and moved one level deeper', () => {
		const source = 'function f() {\n  foo(a,\n      b);\n  c();\n}\n';
		const root = engine.parse(source);
		statementAt(root, 0, 1).$trivia.leading('// c');
		rendersAs(root, 'function f() {\n  foo(a,\n      b);\n  // c\n  c();\n}\n');
		const moved = movedInto(functionAt(engine.parse(source), 0));
		expect(moved.$render()).toBe('{\n  x();\n  function f() {\n    foo(a,\n        b);\n    c();\n  }\n}\n');
	});
});

describe('the sides of a parsed node come from its tree', () => {
	it('keeps a comment between two untouched children of an edited parent', () => {
		const root = engine.parse('function f() {\n  a();\n  // mid\n  b();\n  c();\n}\n');
		statementAt(root, 0, 2).$trivia.leading('// c');
		rendersAs(root, 'function f() {\n  a();\n  // mid\n  b();\n  // c\n  c();\n}\n');
	});

	it('renders a write through a parsed holder in a draft that stores its range unread', () => {
		const root = engine.parse('function g() {\n  a();\n}\n');
		const g = functionAt(root, 0);
		statementAt(root, 0, 0).$trivia.leading('// w');
		expect(g.$with.name(build.identifier('h')).$render()).toBe('function h() {\n  // w\n  a();\n}\n');
	});

	it('reads a side as equal entries that are not the same object', () => {
		const node = statementAt(engine.parse('function f() {\n  // c\n  a();\n}\n'), 0, 0);
		const first = node.$trivia.leading();
		const second = node.$trivia.leading();
		expect(second).toEqual(first);
		expect(second).not.toBe(first);
	});

	it("keeps a comment with the statement it trails when its sibling is replaced, and drops the replaced statement's own", () => {
		const body = functionAt(engine.parse('function f() {\n  s1(); // a\n  // b\n  s2();\n}\n'), 0).body();
		const [first] = body.statements();
		if (first === undefined) throw new Error('expected a statement');
		expect(body.$with.statements(first, statement('s3')).$render()).toBe('{\n  s1(); // a\n  s3;\n}\n');
	});
});

describe("an interface body's line break, held with no inner gap", () => {
	const source = 'interface Bar {\n  }\n';

	function bar() {
		const root = engine.parse(source);
		const iface = root.statements()[0];
		if (iface === undefined || !engine.is.interfaceDeclaration(iface)) throw new Error('expected an interface');
		return { root, iface };
	}

	it('renders between the braces of a $with draft', () => {
		const { iface } = bar();
		const baz = engine.parse('interface Baz {}\n').statements()[0];
		if (baz === undefined || !engine.is.interfaceDeclaration(baz)) throw new Error('expected an interface');
		expect(iface.$with.name(baz.name()).$render()).toBe('interface Baz {\n  }');
	});

	it('takes the seam default between a rewritten name and a parsed body with members', () => {
		const iface = engine.parse('interface Bar {\n  x: number;\n}\n').statements()[0];
		const baz = engine.parse('interface Baz {}\n').statements()[0];
		if (iface === undefined || baz === undefined || !engine.is.interfaceDeclaration(iface) || !engine.is.interfaceDeclaration(baz)) throw new Error('expected interfaces');
		expect(iface.$with.name(baz.name()).$render()).toBe('interface Baz {\n  x: number;\n}');
	});

	it('renders between the braces when the body moves into another tree', () => {
		const target = engine.parse('interface Foo {}\n');
		const foo = target.statements()[0];
		if (foo === undefined || !engine.is.interfaceDeclaration(foo)) throw new Error('expected an interface');
		expect(foo.$with.body(bar().iface.body()).$render()).toBe('interface Foo {\n  }');
	});
});

describe('a snapshot of an edited tree', () => {
	it('takes its sides from the table, with no stamps in its data', () => {
		const root = engine.parse('function f() {\n  // keep\n  let x = 1; // same\n}\n');
		statementAt(root, 0, 0).$trivia.leading('// new');
		const data = JSON.stringify(root.$snapshot());
		expect(data).not.toMatch(/"\$sameLine"|"\$tokensBetween"/);
		expect(engine.render(root.$snapshot()).toString()).toBe(root.$render());
	});
});

/** The text of each node entry of a side; its layout entries are not text. */
const texts = (entries: readonly unknown[]): string[] =>
	entries.filter((entry) => typeof entry === 'object').map((entry) => String(engine.render(entry as never)).trim());

describe('the owner a side belongs to', () => {
	it("leaves a comment on its line's statement when the next statement's leading is written", () => {
		const root = engine.parse('function f() {\n  s1(); // x\n  s2();\n}\n');
		statementAt(root, 0, 1).$trivia.leading('// c');
		rendersAs(root, 'function f() {\n  s1(); // x\n  // c\n  s2();\n}\n');
	});

	it('renders a write through each side with the layout of that side', () => {
		const root = engine.parse('function f() {}\nfunction g() {\n  a();\n}\n');
		statementAt(root, 1, 0).$trivia.leading('// l');
		statementAt(root, 1, 0).$trivia.trailing('// t');
		const body = functionAt(root, 0).body();
		if (!engine.isEmptyNode(body)) throw new Error('expected an empty block');
		body.$trivia.inner('// i');
		rendersAs(root, 'function f() {\n  // i\n}\nfunction g() {\n  // l\n  a(); // t\n}\n');
	});

	it("gives a file of comments only to the root's inner, and renders it as its source", () => {
		const root = engine.parse('// a\n\n// b\n');
		expect(engine.isEmptyNode(root)).toBe(true);
		expect(texts(sidesOf(root)?.inner ?? [])).toEqual(['// a', '// b']);
		expect(root.$render()).toBe('// a\n\n// b\n');
	});

	it('reads a write through a query back through the accessors', () => {
		const root = engine.parse('function f() {\n  a();\n}\n');
		viaQuery(root, 0, 0).$trivia.leading('// q');
		expect(texts(statementAt(root, 0, 0).$trivia.leading())).toEqual(['// q']);
	});

	it.each([
		['between two of a statement’s own tokens', 'for /*c*/ (;;) {}\nf();\n'],
		['after a trailing separator', 'const x = [a, b, // c\n];\nf();\n']
	])('keeps a comment no side takes, %s, while its owner copies its source', (_, source) => {
		const root = engine.parse(source);
		const last = root.statements().at(-1);
		if (last === undefined || typeof last !== 'object') throw new Error('expected a statement');
		last.$trivia.leading('// f');
		rendersAs(root, source.replace('f();\n', '// f\nf();\n'));
	});

	it('gives a same-line comment to the statement, not the call inside it', () => {
		const node = statementAt(engine.parse('function f() {\n  s1(); // x\n}\n'), 0, 0);
		if (!engine.is.expressionStatement(node)) throw new Error('expected an expression statement');
		expect(texts(node.$trivia.trailing())).toEqual(['// x']);
		const expression = node.expression();
		if (!engine.is.callExpression(expression)) throw new Error('expected a call');
		expect(texts(expression.$trivia.trailing())).toEqual([]);
	});
});
