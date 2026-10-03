import { afterAll, describe, expect, it } from 'vitest';
import type { AnyUntypedNode } from '@sittir/types';
import { carryTree } from '@sittir/common/utils';
import { loadNativeEngine, readNodeOf, materializeDetached, readNativeTree } from '../common.ts';
import { detachedRenderer } from './helpers/detached-renderer.ts';
import { createEngine } from '@sittir/common';
import { languageByName } from '../../languages.ts';

const rust = await createEngine(await languageByName('rust'));
const typescript = await createEngine(await languageByName('typescript'));

afterAll(() => {
	rust.dispose();
	typescript.dispose();
});

describe('read trivia layout, rendered detached', () => {
	it('keeps a same-line line comment on its line and breaks once after it', async () => {
		const render = await detachedRenderer('rust');
		expect(render('fn g() { a; // note\n b; }')).toBe('fn g() {\n    a; // note\n    b;\n}\n');
		expect(render('fn f() {\n    a; // c\n    // d\n}\n')).toBe('fn f() {\n    a; // c\n    // d\n}\n');
	});

	it('closes a body right after an own-line trailing comment', async () => {
		expect((await detachedRenderer('rust'))('fn f() {\n    a;\n    // c\n}\n')).toBe('fn f() {\n    a;\n    // c\n}\n');
	});

	it('joins a same-line leading block comment with a space', async () => {
		expect((await detachedRenderer('rust'))('fn f() { /* c */ a; }')).toBe('fn f() {\n    /* c */ a;\n}\n');
	});

	it('lays out inner comments by the gap they sit in', async () => {
		const render = await detachedRenderer('rust');
		expect(render('fn f() { // TODO\n}\n')).toBe('fn f() {\n    // TODO\n}\n');
		expect(render('f(/* a */);')).toBe('f(/* a */);\n');
		expect(render('f(// a\n);')).toBe('f(// a\n);\n');
		expect(render('ok! {\n  // one\n  /* two */\n}\n')).toBe('ok!{// one\n/* two */}\n');
	});

	it('seats a same-line trailing entry after the anonymous tokens between it and its owner', async () => {
		const render = await detachedRenderer('rust');
		expect(render('fn f() { x = a + /* x */ b; }')).toBe('fn f() {\n    x = a + /* x */ b;\n}\n');
	});

	it('seats a same-line trailing entry after an anonymous token kept as a source coordinate', async () => {
		const engine = await loadNativeEngine('rust');
		const readNode = (await readNodeOf('rust'))!;
		const source = 'fn f() { x = a + /* x */ b; }';
		const data = materializeDetached(readNode(readNativeTree(engine, source).tree)) as never as {
			_statements: [{ _body: { _statements: [{ _content: { _expression: { _right: Record<string, any> } } }] } }];
		};
		const binary = data._statements[0]._body._statements[0]._content._expression._right;
		const at = source.indexOf('+');
		const comment = binary._left.$_trivia.trailing[0];
		binary._operator = carryTree(comment, { $type: binary._operator, $treeHandle: comment.$treeHandle, $span: { start: at, end: at + 1 } });
		expect(engine.render(data as never as AnyUntypedNode).toString()).toBe('fn f() {\n    x = a + /* x */ b;\n}\n');
	});

	it('keeps a same-line trailing entry on its owner\'s row, before the separator', async () => {
		expect((await detachedRenderer('rust'))('fn g() {} /* t */\n\nfn h() {}')).toBe('fn g() {} /* t */\n\nfn h() {}\n');
	});

	it('detached read keeps an own-line comment between items in its source layout', async () => {
		const rust = await detachedRenderer('rust');
		expect(rust('fn g() {}\n/* t */\n\nfn h() {}')).toBe('fn g() {}\n/* t */\n\nfn h() {}\n');
		expect(rust('fn g() {}\n// t\n\nfn h() {}')).toBe('fn g() {}\n// t\n\nfn h() {}\n');
		const typescript = await detachedRenderer('typescript');
		expect(typescript('a;\n/* c */\n\nb;')).toBe('a;\n/* c */\n\nb;\n');
		expect(typescript('a;\n// c\n\nb;')).toBe('a;\n// c\n\nb;\n');
	});

	it('lays root entries one per line, since the root gap starts a line', async () => {
		const render = await detachedRenderer('rust');
		expect(render('/* a */\n/* Comment */\n')).toBe('/* a */\n/* Comment */\n');
		expect(render('/* a */\n// ---\n')).toBe('/* a */\n// ---\n');
	});
});

describe('built and read trivia render alike', () => {
	it('gives a built tree and a read tree of the same source the same layout', async () => {
		const render = await detachedRenderer('rust');
		const ir = (await loadNativeEngine('rust')).build as any;
		const todo = () => ir.lineComment(' TODO');
		const f = (body: unknown) => ir.functionItem({ name: 'f', parameters: ir.parameters(), body });
		const pairs: [unknown, string][] = [
			[f(ir.block().$trivia.inner(todo())), 'fn f() {\n    // TODO\n}\n'],
			[ir.expressionStatement(ir.callExpression({ function: 'f', arguments: ir.arguments().$trivia.inner(ir.blockComment(' a ')) })), 'f(/* a */);'],
			[
				f(ir.block({ statements: [ir.expressionStatement(ir.identifier('a')).$trivia.trailing(ir.lineComment(' c'))] })),
				'fn f() {\n    a;\n    // c\n}\n'
			]
		];
		for (const [built, source] of pairs) {
			expect((ir.sourceFile({ statements: [built] }) as { $render(): string }).$render()).toBe(render(source));
		}
	});
});

describe('an ERROR node, rendered detached', () => {
	it('renders the source it wraps as trivia text', async () => {
		const render = await detachedRenderer('python');
		expect(render('from a import (  # c\n    *)\n')).toBe('from a import (  # c\n    *)\n');
		expect(render('x = 1 $ 2\n')).toBe('x = 1 $ 2\n');
		expect(render('x = 1\n@@@\ny = 2\n')).toBe('x = 1\n@@@\ny = 2\n');
	});
});

describe('a list, rendered detached', () => {
	it('keeps the source flanks and gaps of a multi-line argument list', async () => {
		const source = 'fn f() {\n    g(\n        a,\n        b\n    );\n}\n';
		expect((await detachedRenderer('rust'))(source)).toBe(source);
	});
});

describe('a detached copy of a read node', () => {
	const renderCopy = async (node: unknown): Promise<string> => (await loadNativeEngine('rust')).render(materializeDetached(node)).toString();

	it('renders a copied multi-line parameter list with its source breaks and depth', async () => {
		const item = rust.parse('fn f(\n    a: u8,\n    b: i32\n) {}\n').statements()[0];
		if (item === undefined || typeof item === 'number' || !rust.is.functionItem(item)) throw new Error('expected a function item');
		expect(await renderCopy(item.parameters())).toBe('(\n    a: u8,\n    b: i32\n)');
	});

	it('renders a copied function item with the block comment before it', async () => {
		expect(await renderCopy(rust.parse('\n/* plain block comment */\nfn main() {}\n').statements()[0])).toBe('/* plain block comment */\nfn main() {}');
	});
});

describe('depth is one fact per position', () => {
	const copy = async (grammar: string, node: unknown): Promise<string> => (await loadNativeEngine(grammar)).render(materializeDetached(node)).toString();
	const struct = 'struct Point {\n    x: i32,\n    y: i32,\n}';
	const enumeration = 'enum E {\n    A,\n    B,\n}';
	const union = 'union U {\n    a: u8,\n    b: u16,\n}';
	const flankBreak = 'fn f() {\n    g(\n        a,\n        b);\n    h();\n}';
	const stringBody = "function f(): any {\n  'a';\n  'b';\n}";
	const firstOf = <T>(statements: readonly T[]): T => {
		const [first] = statements;
		if (first === undefined) throw new Error('expected a statement');
		return first;
	};

	it('opens one depth for a struct body whose template and list flank both open one', async () => {
		const item = firstOf(rust.parse(`${struct}\n`).statements());
		if (typeof item === 'number' || !rust.is.structItem(item) || item.$type !== rust.kinds.StructItemBrace) throw new Error('expected a struct item with a body');
		expect(await copy('rust', item)).toBe(struct);
		const body = item.body();
		const edited = body.$with.elements(...body) as Parameters<typeof item.$with.body>[0];
		expect(item.$with.body(edited).$render()).toBe(struct);
	});

	it('opens one depth for an enum body whose template and list flank both open one', async () => {
		const item = firstOf(rust.parse(`${enumeration}\n`).statements());
		if (typeof item === 'number' || !rust.is.enumItem(item)) throw new Error('expected an enum item');
		expect(await copy('rust', item)).toBe(enumeration);
		const body = item.body();
		const edited = body.$with.elements(...body) as Parameters<typeof item.$with.body>[0];
		expect(item.$with.body(edited).$render()).toBe(enumeration);
	});

	it('opens one depth for a union body whose template and list flank both open one', async () => {
		const item = firstOf(rust.parse(`${union}\n`).statements());
		if (typeof item === 'number' || !rust.is.unionItem(item)) throw new Error('expected a union item');
		expect(await copy('rust', item)).toBe(union);
		const body = item.body();
		const edited = body.$with.elements(...body) as Parameters<typeof item.$with.body>[0];
		expect(item.$with.body(edited).$render()).toBe(union);
	});

	it('keeps a macro body and a call whose opener opens no template depth as they are', async () => {
		for (const source of ['macro_rules! m {\n    () => {};\n    (x) => {};\n}', 'fn f() {\n    add(\n        1i32,\n        2i32\n    );\n}']) {
			expect(await copy('rust', rust.parse(`${source}\n`).statements()[0])).toBe(source);
		}
	});

	it('closes the depth a list flank opens although the closer shares the last item\'s line', async () => {
		const fn = firstOf(rust.parse(`${flankBreak}\n`).statements());
		if (typeof fn === 'number' || !rust.is.functionItem(fn)) throw new Error('expected a function item');
		expect(await copy('rust', fn)).toBe(flankBreak);
		const [statement, next] = fn.body().statements();
		if (statement === undefined || typeof statement === 'number' || !rust.is.expressionStatement(statement)) throw new Error('expected an expression statement');
		if (next === undefined) throw new Error('expected a second statement');
		const wrapper = statement.content();
		if (wrapper.$type !== rust.kinds.ExpressionStatementWithSemi) throw new Error('expected an expression with its semicolon');
		const call = wrapper.expression();
		if (typeof call === 'number' || !rust.is.callExpression(call)) throw new Error('expected a call');
		const args = call.arguments();
		const call2 = call.$with.arguments(args.$with.elements(...args) as Parameters<typeof call.$with.arguments>[0]);
		const wrapper2 = wrapper.$with.expression(call2 as Parameters<typeof wrapper.$with.expression>[0]);
		const statement2 = statement.$with.content(wrapper2 as Parameters<typeof statement.$with.content>[0]);
		const body = fn.body().$with.statements(statement2, next);
		expect(fn.$with.body(body as Parameters<typeof fn.$with.body>[0]).$render()).toBe(flankBreak);
	});

	it('gives a string no list flanks, so a body of string statements keeps its depth', async () => {
		const fn = firstOf(typescript.parse(`${stringBody}\n`).statements());
		if (typeof fn === 'number' || !typescript.is.functionDeclaration(fn)) throw new Error('expected a function declaration');
		expect(await copy('typescript', fn)).toBe(`${stringBody}\n`);
		const [first, second] = fn.body().statements();
		if (first === undefined || typeof first === 'number' || !typescript.is.expressionStatement(first)) throw new Error('expected an expression statement');
		if (second === undefined) throw new Error('expected a second statement');
		const string = first.expression();
		if (typeof string === 'number' || !typescript.is.string(string) || string.$type !== typescript.kinds.StringSingle) throw new Error('expected a single-quoted string');
		const rebuilt = first.$with.expression(string.$with.elements(...(string.elements() as Parameters<typeof string.$with.elements>)) as Parameters<typeof first.$with.expression>[0]);
		const body = fn.body().$with.statements(rebuilt, second);
		expect(fn.$with.body(body as Parameters<typeof fn.$with.body>[0]).$render()).toBe(`${stringBody}\n`);
	});
});
