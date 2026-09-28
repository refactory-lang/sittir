import { describe, expect, it } from 'vitest';
import { stripStructuralProvenance } from '@sittir/common';
import type { AnyNodeData } from '@sittir/types';
import { importGrammarModule, loadIsLeafKind, loadNativeEngine, loadReadTreeNode, materializeWrappedNodeData } from '../common.ts';
import { selfContainedRenderInput } from '../read-render-parse.ts';

async function detachedRenderer(grammar: string): Promise<(source: string) => string> {
	const engine = await loadNativeEngine(grammar);
	const read = await loadReadTreeNode(grammar);
	const isLeafKind = await loadIsLeafKind(grammar);
	if (read === null) throw new Error(`no readTreeNode for ${grammar}`);
	return (source) => {
		const data = stripStructuralProvenance(materializeWrappedNodeData(read(engine.diagnostics.parseAndRead(source).tree)));
		return engine.render(selfContainedRenderInput(data, source, isLeafKind) as AnyNodeData).toString();
	};
}

describe('read trivia layout, rendered detached', () => {
	it('keeps a same-line line comment on its line and breaks once after it', async () => {
		const render = await detachedRenderer('rust');
		expect(render('fn g() { a; // note\n b; }')).toBe('fn g() {\n    a; // note\n    b;\n}');
		expect(render('fn f() {\n    a; // c\n    // d\n}\n')).toBe('fn f() {\n    a; // c\n    // d\n}');
	});

	it('closes a body right after an own-line trailing comment', async () => {
		expect((await detachedRenderer('rust'))('fn f() {\n    a;\n    // c\n}\n')).toBe('fn f() {\n    a;\n    // c\n}');
	});

	it('joins a same-line leading block comment with a space', async () => {
		expect((await detachedRenderer('rust'))('fn f() { /* c */ a; }')).toBe('fn f() {\n    /* c */ a;\n}');
	});

	it('lays out inner comments by the gap they sit in', async () => {
		const render = await detachedRenderer('rust');
		expect(render('fn f() { // TODO\n}\n')).toBe('fn f() {\n    // TODO\n}');
		expect(render('f(/* a */);')).toBe('f(/* a */);');
		expect(render('f(// a\n);')).toBe('f(// a\n);');
		expect(render('ok! {\n  // one\n  /* two */\n}\n')).toBe('ok!{// one\n/* two */}');
	});

	it('seats a same-line trailing entry after the anonymous tokens between it and its owner', async () => {
		const render = await detachedRenderer('rust');
		expect(render('fn f() { x = a + /* x */ b; }')).toBe('fn f() {\n    x = a + /* x */ b;\n}');
	});

	it('seats a same-line trailing entry after an anonymous token kept as a source coordinate', async () => {
		const engine = await loadNativeEngine('rust');
		const read = (await loadReadTreeNode('rust'))!;
		const source = 'fn f() { x = a + /* x */ b; }';
		const data = stripStructuralProvenance(materializeWrappedNodeData(read(engine.diagnostics.parseAndRead(source).tree))) as never as {
			_statements: [{ _body: { _statements: [{ _content: { _expression: { _right: Record<string, any> } } }] } }];
		};
		const binary = data._statements[0]._body._statements[0]._content._expression._right;
		const at = source.indexOf('+');
		binary._operator = { $type: binary._operator, $nodeHandle: binary._left.$_trivia.trailing[0].$nodeHandle, $span: { start: at, end: at + 1 } };
		expect(engine.render(data as never as AnyNodeData).toString()).toBe('fn f() {\n    x = a + /* x */ b;\n}');
	});

	it('lays root entries one per line, since the root gap starts a line', async () => {
		const render = await detachedRenderer('rust');
		expect(render('/* a */\n/* Comment */\n')).toBe('/* a */\n/* Comment */');
		expect(render('/* a */\n// ---\n')).toBe('/* a */\n// ---\n');
	});
});

describe('built and read trivia render alike', () => {
	it('gives a built tree and a read tree of the same source the same layout', async () => {
		const render = await detachedRenderer('rust');
		const { ir } = (await importGrammarModule('rust', 'ir.ts'))!;
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
			expect((built as { $render(): string }).$render()).toBe(render(source));
		}
	});
});
