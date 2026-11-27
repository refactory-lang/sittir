import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import rust from '../src/index.ts';

const engine = await sharedEngine(() => createEngine(rust, { nodeStorage: 'arena' }));
const { build } = engine;
const indented = await sharedEngine(() => createEngine(rust, { nodeStorage: 'arena', render: { closureExpressionBlock: { dashGt: { after: engine.kinds.Indent }, after: engine.kinds.Dedent } } }));
type Root = ReturnType<typeof engine.parse>;

function statementAt(root: Root, fnAt: number, at: number) {
	const fn = root.statements()[fnAt];
	if (fn === undefined || !engine.is.functionItem(fn)) throw new Error('expected a function');
	const statement = fn.body().statements()[at];
	if (statement === undefined || typeof statement !== 'object') throw new Error('expected a statement');
	return statement;
}

function rendersAs(root: { $render(): string }, expected: string): void {
	const out = root.$render();
	expect(out).toBe(expected);
	expect(engine.parse(out).$errors).toEqual([]);
}

const IRREGULAR = 'fn f() {\n    a();  // keep\n\n    b();\n}\n\n\nfn g() {}\n';

describe('a side written to a parsed node replaces its range of the source, and every other byte stays', () => {
	it('inserts a leading side where its node starts', () => {
		const root = engine.parse(IRREGULAR);
		statementAt(root, 0, 1).$trivia.leading(build.lineComment(' c'));
		rendersAs(root, 'fn f() {\n    a();  // keep\n\n    // c\n    b();\n}\n\n\nfn g() {}\n');
	});

	it('replaces a trailing side from where its node ends to where its last comment ends', () => {
		const root = engine.parse(IRREGULAR);
		statementAt(root, 0, 0).$trivia.trailing(build.lineComment(' t'));
		rendersAs(root, 'fn f() {\n    a(); // t\n\n    b();\n}\n\n\nfn g() {}\n');
	});

	it('replaces a leading side from where its first comment starts to where its node starts', () => {
		const root = engine.parse('fn f() {\n    a();\n      // old\n    b();\n}\n');
		statementAt(root, 0, 1).$trivia.leading(build.lineComment(' new'));
		rendersAs(root, 'fn f() {\n    a();\n      // new\n    b();\n}\n');
	});

	it('breaks the line after a written line comment at the indentation of the line its node is on', () => {
		const root = engine.parse('fn f() {\n  a();\n   b();\n}\n');
		statementAt(root, 0, 1).$trivia.leading(build.lineComment(' c'));
		rendersAs(root, 'fn f() {\n  a();\n   // c\n   b();\n}\n');
	});

	it('breaks a line written into a one-line node one unit past its line for each level the templates open down to it', () => {
		const root = engine.parse('fn b() { let x = 1; }\n');
		statementAt(root, 0, 0).$trivia.leading(build.lineComment(' before'));
		rendersAs(root, 'fn b() { // before\n    let x = 1; }\n');
	});

	it('counts the levels from the first node of the line, past the line\'s own indentation', () => {
		const root = engine.parse('impl X {\n    fn b() { let x = 1; }\n}\n');
		const [item] = root.statements();
		if (item === undefined || !engine.is.implItemBody(item)) throw new Error('expected an impl with a body');
		const [fn] = item.body();
		if (fn === undefined || !engine.is.methodDeclaration(fn)) throw new Error('expected a method');
		const [statement] = fn.body().statements();
		if (statement === undefined || typeof statement !== 'object') throw new Error('expected a statement');
		statement.$trivia.leading(build.lineComment(' before'));
		rendersAs(root, 'impl X {\n    fn b() { // before\n        let x = 1; }\n}\n');
	});

	it('counts each range of a line at its own depth', () => {
		const root = engine.parse('fn a() { let x = 1; } fn b() { if c { d(); } }\n');
		statementAt(root, 0, 0).$trivia.leading(build.lineComment(' p'));
		const call = root.$query().$descendants.ofType(engine.kinds.ExpressionStatement).at(1);
		if (call === undefined || typeof call !== 'object') throw new Error('expected a call statement');
		call.$trivia.leading(build.lineComment(' q'));
		rendersAs(root, 'fn a() { // p\n    let x = 1; } fn b() { if c { // q\n        d(); } }\n');
	});

	it('counts a range whose node holds another range\'s node at its own depth', () => {
		const root = engine.parse('fn a() { if c { d(); } }\n');
		statementAt(root, 0, 0).$trivia.leading(build.lineComment(' p'));
		const call = root.$query().$descendants.ofType(engine.kinds.ExpressionStatement).at(1);
		if (call === undefined || typeof call !== 'object') throw new Error('expected a call statement');
		call.$trivia.leading(build.lineComment(' q'));
		rendersAs(root, 'fn a() { // p\n    if c { // q\n        d(); } }\n');
	});

	it('counts a level a site opens only where the template writes the site', () => {
		const written = (source: string) => {
			const root = indented.parse(source);
			const fn = root.statements()[0];
			if (fn === undefined || !indented.is.functionItem(fn)) throw new Error('expected a function');
			const statement = fn.body().statements()[0];
			if (statement === undefined || !indented.is.letDeclaration(statement)) throw new Error('expected a let');
			const closure = statement.value();
			if (closure === undefined || !indented.is.closureExpression(closure)) throw new Error('expected a closure');
			const body = closure.body();
			if (!indented.is.block(body)) throw new Error('expected a block body');
			const [call] = body.statements();
			if (call === undefined || typeof call !== 'object') throw new Error('expected a statement');
			call.$trivia.leading(indented.build.lineComment(' c'));
			return root.$render();
		};
		expect(written('fn f() {\n    let c = |x| -> T { a(); };\n}\n')).toBe('fn f() {\n    let c = |x| -> T { // c\n            a(); };\n}\n');
		expect(written('fn f() {\n    let c = |x| { a(); };\n}\n')).toBe('fn f() {\n    let c = |x| { // c\n        a(); };\n}\n');
	});

	it('moves a written parsed node with its source when a built holder reindents it', () => {
		const root = engine.parse('fn g() {\n  a();\n   b();\n}\n');
		statementAt(root, 0, 1).$trivia.leading(build.lineComment(' w'));
		const [item] = root.statements();
		if (item === undefined || !engine.is.functionItem(item)) throw new Error('expected a function');
		const holder = build.modItem.inline({ name: build.identifier('m'), body: build.declarationList(item) } as never);
		expect(holder.$render()).toBe('mod m {\n    fn g() {\n      a();\n       // w\n       b();\n    }\n}');
	});
});
