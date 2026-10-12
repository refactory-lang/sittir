import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sidesOf } from '@sittir/common/utils';
import rust from '../src/index.ts';

const engine = await createEngine(rust);
const { build } = engine;
type Root = ReturnType<typeof engine.parse>;

function functionAt(root: Root, at: number) {
	const fn = root.statements()[at];
	if (fn === undefined || !engine.is.functionItem(fn)) throw new Error('expected a function');
	return fn;
}

function statementAt(root: Root, fnAt: number, at: number) {
	const statement = functionAt(root, fnAt).body().statements()[at];
	if (statement === undefined || typeof statement !== 'object') throw new Error('expected a statement');
	return statement;
}

function viaQuery(root: Root, fnAt: number, at: number) {
	const fn = root.$query().$descendants.ofType(engine.kinds.FunctionItem).at(fnAt);
	if (fn === undefined || !engine.is.functionItem(fn)) throw new Error('expected a function');
	const statement = fn.body().statements()[at];
	if (statement === undefined || typeof statement !== 'object') throw new Error('expected a statement');
	return statement;
}

const call = (name: string) =>
	build.expressionStatement(build.callExpression({ function: build.identifier(name), arguments: build.arguments() } as never) as never);

/** The text of each node entry of a side; its layout entries are not text. */
const texts = (entries: readonly unknown[]): string[] =>
	entries.filter((entry) => typeof entry === 'object').map((entry) => String(engine.render(entry as never)).trim());

/** The rendered tree, pinned exactly, and reparsed with no `ERROR`. */
function rendersAs(root: { $render(): string }, expected: string): void {
	const out = root.$render();
	expect(out).toBe(expected);
	expect(engine.parse(out).$errors).toEqual([]);
}

describe.each([
	['the accessors', statementAt],
	['a query', viaQuery]
])('a write on a node reached through %s', (_, reach) => {
	it('is accepted and renders in the whole tree', () => {
		const root = engine.parse('fn a() {}\nfn b() { let x = 1; }\n');
		reach(root, 1, 0).$trivia.leading(build.lineComment(' before'));
		rendersAs(root, 'fn a() {}\nfn b() {\n    // before\n    let x = 1;\n}\n');
	});

	it('keeps a deeper-indented comment between its siblings', () => {
		const root = engine.parse('fn f() {\n    a();\n        // deep\n    b();\n}\n');
		reach(root, 0, 0).$trivia.leading(build.lineComment(' lead'));
		rendersAs(root, 'fn f() {\n    // lead\n    a();\n        // deep\n    b();\n}\n');
	});
});

describe('the sides of a parsed node come from its tree', () => {
	it('keeps a comment between two untouched children of an edited parent', () => {
		const root = engine.parse('fn f() {\n    a();\n    // mid\n    b();\n    c();\n}\n');
		statementAt(root, 0, 2).$trivia.leading(build.lineComment(' c'));
		rendersAs(root, 'fn f() {\n    a();\n    // mid\n    b();\n    // c\n    c();\n}\n');
	});

	it("gives a comment before a parent and its first child to the parent, and a write to the child's leading leaves it", () => {
		const root = engine.parse('fn f() {\n    // c\n    a();\n}\n');
		const statement = statementAt(root, 0, 0);
		if (!engine.is.expressionStatement(statement)) throw new Error('expected an expression statement');
		expect(texts(statement.$trivia.leading())).toEqual(['// c']);
		const content = statement.content();
		expect(texts(content.$trivia.leading())).toEqual([]);
		content.$trivia.leading(build.lineComment(' d'));
		expect(texts(statement.$trivia.leading())).toEqual(['// c']);
		rendersAs(root, 'fn f() {\n    // c\n    // d\n    a();\n}\n');
	});

	it("reads and writes each side through its node, and a childless node's entries through inner", () => {
		const root = engine.parse('fn f() {}\nfn g() {\n    a(); // t\n}\n');
		const statement = statementAt(root, 1, 0);
		expect(texts(statement.$trivia.trailing())).toEqual(['// t']);
		statement.$trivia.leading(build.lineComment(' l'));
		expect(texts(statement.$trivia.leading())).toEqual(['// l']);
		const body = functionAt(root, 0).body();
		if (!engine.isEmptyNode(body)) throw new Error('expected an empty block');
		body.$trivia.inner(build.lineComment(' i'));
		expect(texts(body.$trivia.inner())).toEqual(['// i']);
		rendersAs(root, 'fn f() {\n    // i\n}\nfn g() {\n    // l\n    a(); // t\n}\n');
	});

	it('renders a write through a parsed holder in a draft that stores its range unread', () => {
		const root = engine.parse('fn g() {\n    a();\n}\n');
		const g = functionAt(root, 0);
		statementAt(root, 0, 0).$trivia.leading(build.lineComment(' w'));
		expect(g.$with.name(build.identifier('h')).$render()).toBe('fn h() {\n    // w\n    a();\n}');
	});

	it('reads a side as equal entries that are not the same object', () => {
		const statement = statementAt(engine.parse('fn f() {\n    // c\n    a();\n}\n'), 0, 0);
		const first = statement.$trivia.leading();
		const second = statement.$trivia.leading();
		expect(second).toEqual(first);
		expect(second).not.toBe(first);
	});

	it("keeps a comment with the item it trails when its sibling is replaced, and drops the replaced item's own", () => {
		const root = engine.parse('fn f() {\n    s1(); // a\n    // b\n    s2();\n}\n');
		const body = functionAt(root, 0).body();
		const [first] = body.statements();
		if (first === undefined) throw new Error('expected a statement');
		expect(body.$with.statements(first, call('s3')).$render()).toBe('{\n    s1(); // a\n    s3();\n}');
	});

	it('renders an ERROR entry verbatim when its owner renders from its template', () => {
		const root = engine.parse('fn f() {}\n@\nfn g() {}\n');
		const g = functionAt(root, 1);
		const edited = root.$with.statements(functionAt(root, 0), g.$with.name(build.identifier('h')));
		expect(edited.$render()).toBe('fn f() {}\n@\nfn h() {}\n');
	});

	it('carries a doc comment with its item to a new holder, with the comments in its body', () => {
		const root = engine.parse('/// doc\nfn g() {\n    // body\n    a();\n}\n');
		const item = functionAt(root, 0);
		const holder = build.modItem.inline({ name: build.identifier('m'), body: build.declarationList(item) } as never);
		expect(holder.$render()).toBe('mod m {\n    /// doc\n    fn g() {\n        // body\n        a();\n    }\n}');
	});

	it('gives a comment written on a child to the node the reparse assigns it', () => {
		const root = engine.parse('fn f() {\n    a();\n}\n');
		const statement = statementAt(root, 0, 0);
		if (!engine.is.expressionStatement(statement)) throw new Error('expected an expression statement');
		statement.content().$trivia.leading(build.lineComment(' c'));
		const reparsed = engine.parse(root.$render());
		const again = statementAt(reparsed, 0, 0);
		if (!engine.is.expressionStatement(again)) throw new Error('expected an expression statement');
		expect(texts(again.$trivia.leading())).toEqual(['// c']);
		expect(texts(again.content().$trivia.leading())).toEqual([]);
	});
});

describe('a node renders the layout its entries hold', () => {
	it('renders a parsed one-line block on one line after a write elsewhere in its tree', () => {
		const root = engine.parse('fn f() { a(); b(); }\nfn g() {}\n');
		functionAt(root, 1).$trivia.leading(build.lineComment(' g'));
		rendersAs(root, 'fn f() { a(); b(); }\n\n// g\nfn g() {}\n');
	});

	it('renders a statement written into a parsed block with the seam defaults', () => {
		const root = engine.parse('fn f() {\n    a();\n}\n');
		const body = functionAt(root, 0).body();
		expect(body.$with.statements(...body.statements(), call('b')).$render()).toBe('{\n    a();\n    b();\n}');
	});

	it("carries a moved node's layout entries into its new tree", () => {
		const moved = functionAt(engine.parse('fn f() {\n    a();\n\n    // c\n    b();\n}\n'), 0);
		const target = engine.parse('fn g() {}\n');
		rendersAs(target.$with.statements(...target.statements(), moved), 'fn g() {}\n\nfn f() {\n    a();\n\n    // c\n    b();\n}\n');
	});

	it('keeps the pad of a comment alone in the braces, and empty braces tight, after an edit elsewhere', () => {
		const root = engine.parse('fn h() {\n    let s = S { /* c */ };\n    let t = S {};\n}\n');
		functionAt(root, 0).$trivia.leading(build.lineComment(' h'));
		rendersAs(root, '// h\nfn h() {\n    let s = S { /* c */ };\n    let t = S {};\n}\n');
	});
});

describe("a document's final line break is its source's", () => {
	for (const body of ['\n//! doc', '//! doc', 'fn main() {}\n// end', 'fn main() {} // end']) {
		for (const source of [body, `${body}\n`]) {
			it(JSON.stringify(source), () => {
				const root = engine.parse(source);
				expect(root.$render()).toBe(source);
				expect(root.$with.statements(...root.statements()).$render()).toBe(source);
			});
		}
	}
});

describe('a snapshot of an edited tree', () => {
	it('takes its sides from the table, with no stamps in its data', () => {
		const root = engine.parse('fn f() {\n    // keep\n    let x = 1; // same\n}\n');
		statementAt(root, 0, 0).$trivia.leading(build.lineComment(' new'));
		const data = JSON.stringify(root.$snapshot());
		expect(data).not.toMatch(/"\$sameLine"|"\$tokensBetween"/);
		expect(engine.render(root.$snapshot()).toString()).toBe(root.$render());
	});
});

describe('the owner a side belongs to', () => {
	it("leaves a comment on its line's statement when the next statement's leading is written", () => {
		const root = engine.parse('fn f() {\n    s1(); // x\n    s2();\n}\n');
		statementAt(root, 0, 1).$trivia.leading(build.lineComment(' c'));
		rendersAs(root, 'fn f() {\n    s1(); // x\n    // c\n    s2();\n}\n');
	});

	it('renders a write through each side with the layout of that side', () => {
		const root = engine.parse('fn f() {}\nfn g() {\n    a();\n}\n');
		statementAt(root, 1, 0).$trivia.trailing(build.lineComment(' t'));
		statementAt(root, 1, 0).$trivia.leading(build.lineComment(' l'));
		const body = functionAt(root, 0).body();
		if (!engine.isEmptyNode(body)) throw new Error('expected an empty block');
		body.$trivia.inner(build.lineComment(' i'));
		rendersAs(root, 'fn f() {\n    // i\n}\nfn g() {\n    // l\n    a(); // t\n}\n');
	});

	it("gives a file of comments only to the root's inner, and renders it as its source", () => {
		const root = engine.parse('// a\n\n// b\n');
		expect(engine.isEmptyNode(root)).toBe(true);
		expect(texts(sidesOf(root)?.inner ?? [])).toEqual(['// a', '// b']);
		expect(root.$render()).toBe('// a\n\n// b\n');
	});

	it('reads a write through a query back through the accessors', () => {
		const root = engine.parse('fn f() {\n    a();\n}\n');
		viaQuery(root, 0, 0).$trivia.leading(build.lineComment(' q'));
		expect(texts(statementAt(root, 0, 0).$trivia.leading())).toEqual(['// q']);
	});

	it("reads a childless node's comment through inner", () => {
		const root = engine.parse('fn h() {\n    let s = S { /* c */ };\n}\n');
		const declaration = statementAt(root, 0, 0);
		if (!engine.is.letDeclaration(declaration)) throw new Error('expected a let declaration');
		const value = declaration.value();
		if (value === undefined || !engine.is.structExpression(value)) throw new Error('expected a struct expression');
		const body = value.body();
		if (!engine.isEmptyNode(body)) throw new Error('expected an empty body');
		expect(texts(body.$trivia.inner())).toEqual(['/* c */']);
	});

	it('gives a same-line comment to the statement, not the call inside it', () => {
		const statement = statementAt(engine.parse('fn f() {\n    s1(); // x\n}\n'), 0, 0);
		if (!engine.is.expressionStatement(statement)) throw new Error('expected an expression statement');
		expect(texts(statement.$trivia.trailing())).toEqual(['// x']);
		expect(texts(statement.content().$trivia.trailing())).toEqual([]);
	});

	it('gives a comment before a public function to the function, and a write to its visibility leaves it', () => {
		const root = engine.parse('// c\npub fn f() {}\n');
		const fn = functionAt(root, 0);
		expect(texts(fn.$trivia.leading())).toEqual(['// c']);
		const visibility = fn.visibilityModifier();
		if (visibility === undefined) throw new Error('expected a visibility modifier');
		expect(texts(visibility.$trivia.leading())).toEqual([]);
		visibility.$trivia.leading(build.lineComment(' v'));
		expect(texts(fn.$trivia.leading())).toEqual(['// c']);
	});
});
