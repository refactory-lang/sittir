import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const TABBED = '\n\nfn g() {\n\tx();\n}';
const TWO_SPACE = 'fn g() {\n  x();\n}\n';
const PLAIN = 'fn g() {\n    x();\n}\n';

const openEngine = (nodeStorage: 'object' | 'arena') => createEngine(rust, { nodeStorage });
type Engine = Awaited<ReturnType<typeof openEngine>>;

function builtFunction(engine: Engine): string {
	const b = engine.build as any;
	const call = b.expressionStatement(b.callExpression({ function: b.identifier('a'), arguments: b.arguments() }));
	return engine.render(b.functionItem({ name: 'f', parameters: b.parameters(), body: b.block({ statements: [call] }) })).toString();
}

function swappedRoot(engine: Engine): string {
	const root = engine.parse('use x;\nuse y;\n');
	const [x, y] = root.statements();
	return root.$with.statements(y!, x!).$render();
}

describe.each(['object', 'arena'] as const)('a parse that adopts its style, in %s storage', (nodeStorage) => {
	it('lays the style over the defaults, under the createEngine options and those of a render call', async () => {
		using adopting = await openEngine(nodeStorage);
		adopting.parse(TABBED, { adoptStyle: true });
		expect(builtFunction(adopting)).toBe('fn f() {\n\ta();\n}');
		expect(swappedRoot(adopting)).toBe('\n\nuse y;\nuse x;');

		using given = await createEngine(rust, { nodeStorage, render: { layout: { indent: '  ' } } });
		given.parse(TABBED, { adoptStyle: true });
		expect(builtFunction(given)).toBe('fn f() {\n  a();\n}');
		expect(swappedRoot(given)).toBe('\n\nuse y;\nuse x;');

		const b = given.build as any;
		const call = b.expressionStatement(b.callExpression({ function: b.identifier('a'), arguments: b.arguments() }));
		const fn = b.functionItem({ name: 'f', parameters: b.parameters(), body: b.block({ statements: [call] }) });
		expect(given.render(fn, { layout: { indent: '   ' } }).toString()).toBe('fn f() {\n   a();\n}');
	});

	it('is replaced by a later adopting parse, and a plain-style file brings the defaults back', async () => {
		using engine = await openEngine(nodeStorage);
		engine.parse(TABBED, { adoptStyle: true });
		expect(builtFunction(engine)).toBe('fn f() {\n\ta();\n}');
		engine.parse(TWO_SPACE, { adoptStyle: true });
		expect(builtFunction(engine)).toBe('fn f() {\n  a();\n}');
		expect(swappedRoot(engine)).toBe('use y;\nuse x;\n');
		engine.parse(TABBED, { adoptStyle: true });
		engine.parse(PLAIN, { adoptStyle: true });
		expect(builtFunction(engine)).toBe('fn f() {\n    a();\n}');
		expect(swappedRoot(engine)).toBe('use y;\nuse x;\n');
	});

	it('is left in place by a parse that does not adopt', async () => {
		using engine = await openEngine(nodeStorage);
		engine.parse(TABBED, { adoptStyle: true });
		engine.parse(TWO_SPACE);
		expect(builtFunction(engine)).toBe('fn f() {\n\ta();\n}');
		expect(swappedRoot(engine)).toBe('\n\nuse y;\nuse x;');
	});

	it('writes an edit in a tree parsed before it, and a snapshot of that tree, in the adopted style', async () => {
		using engine = await openEngine(nodeStorage);
		const earlier = engine.parse(PLAIN, { depth: Infinity });
		engine.parse(TWO_SPACE, { adoptStyle: true });
		const fn = earlier.statements()[0] as any;
		const body = fn.body();
		const b = engine.build as any;
		const call = b.expressionStatement(b.callExpression({ function: b.identifier('c'), arguments: b.arguments() }));
		expect(fn.$with.body(body.$with.statements(...body.statements(), call)).$render()).toBe('fn g() {\n  x();\n  c();\n}');
		expect(engine.render(earlier.$snapshot()).toString()).toBe('fn g() {\n  x();\n}\n');
	});

	it('leaves a tree parsed before it rendering its source bytes', async () => {
		using engine = await openEngine(nodeStorage);
		const earlier = engine.parse(TABBED);
		engine.parse(TWO_SPACE, { adoptStyle: true });
		expect(earlier.$render()).toBe(TABBED);
		expect(engine.render(earlier).toString()).toBe(TABBED);
	});
});
