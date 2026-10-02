import { describe, expect, it } from 'vitest';
import type { AnyUntypedNode } from '@sittir/types';
import { carryTree } from '@sittir/common/utils';
import { loadNativeEngine, readNodeOf, materializeDetached, readNativeTree } from '../common.ts';
import { detachedRenderer } from './helpers/detached-renderer.ts';

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

	it("detached read seats an own-line comment as the next owner's leading entry", async () => {
		const rust = await detachedRenderer('rust');
		expect(rust('fn g() {}\n/* t */\n\nfn h() {}')).toBe('fn g() {}\n\n/* t */\nfn h() {}\n');
		expect(rust('fn g() {}\n// t\n\nfn h() {}')).toBe('fn g() {}\n\n// t\nfn h() {}\n');
		const typescript = await detachedRenderer('typescript');
		expect(typescript('a;\n/* c */\n\nb;')).toBe('a;\n\n/* c */\nb;\n');
		expect(typescript('a;\n// c\n\nb;')).toBe('a;\n\n// c\nb;\n');
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
