import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import python from '../../python/src/index.ts';
import rust from '../../rust/src/index.ts';
import typescript from '../../typescript/src/index.ts';

type Engine = any;

type Grammar = {
	readonly descriptor: object;
	readonly kind: string;
	readonly holder: string;
	readonly statement: string;
	readonly sources: { readonly plain: string; readonly comment: string; readonly error: string; readonly nested: string; readonly two: string };
	readonly alone: { readonly plain: string; readonly comment: string; readonly error: string; readonly edited: string; readonly nested: string; readonly leading: string; readonly trailing: string; readonly built: string };
	readonly condition: (e: Engine, name: string) => unknown;
	readonly comment: (e: Engine) => unknown;
	readonly build: (e: Engine, inner: unknown) => unknown;
	readonly buildIf: (e: Engine) => unknown;
};

const GRAMMARS: Record<'rust' | 'python' | 'typescript', Grammar> = {
	rust: {
		descriptor: rust,
		kind: 'IfExpression',
		holder: 'FunctionItem',
		statement: 'ExpressionStatement',
		sources: {
			plain: 'fn g() {\n    if a {\n        b;\n    }\n}\n',
			comment: 'fn g() {\n    if a {\n        // c\n        b;\n    }\n}\n',
			error: 'fn g() {\n    if a {\n        @\n        b;\n    }\n}\n',
			nested: 'fn g() {\n    if a {\n        if b {\n            c;\n        }\n    }\n}\n',
			two: 'fn g() {\n    if a {\n        b;\n        c;\n    }\n}\n'
		},
		alone: {
			plain: 'if a {\n    b;\n}',
			comment: 'if a {\n    // c\n    b;\n}',
			error: 'if a {\n    @\n    b;\n}',
			edited: 'if z {\n    b;\n}',
			nested: 'if b {\n    c;\n}',
			leading: 'if a {\n    b;\n    // w\n    c;\n}',
			trailing: 'if a {\n    b;\n    c; // w\n}',
			built: 'if a {\n    b;\n}'
		},
		condition: (e, name) => e.build.identifier(name),
		comment: (e) => e.build.lineComment(' w'),
		build: (e, inner) => e.build.functionItem({ name: 'g', parameters: e.build.parameters(), body: e.build.block({ statements: [e.build.expressionStatement(inner)] }) }),
		buildIf: (e) => e.build.ifExpression({ condition: e.build.identifier('a'), consequence: e.build.block({ statements: [e.build.expressionStatement(e.build.identifier('b'))] }) })
	},
	python: {
		descriptor: python,
		kind: 'IfStatement',
		holder: 'FunctionDefinition',
		statement: 'ExpressionStatement',
		sources: {
			plain: 'def g():\n    if e:\n        f\n',
			comment: 'def g():\n    if e:\n        # c\n        f\n',
			error: 'def g():\n    if e:\n        f\n        $\n',
			nested: 'def g():\n    if a:\n        if b:\n            c\n',
			two: 'def g():\n    if e:\n        f\n        h\n'
		},
		alone: {
			plain: 'if e:\n    f',
			comment: 'if e:\n    # c\n    f',
			error: 'if e:\n    f\n    $',
			edited: 'if z:\n    f',
			nested: 'if b:\n    c',
			leading: 'if e:\n    f\n    # w\n    h',
			trailing: 'if e:\n    f\n    h # w\n',
			built: 'if e:\n    f\n'
		},
		condition: (e, name) => e.build.identifier(name),
		comment: (e) => e.build.comment(' w'),
		build: (e, inner) => e.build.functionDefinition({ name: 'g', parameters: e.build.parameters(), body: e.build.block(inner) }),
		buildIf: (e) => e.build.ifStatement({ condition: e.build.identifier('e'), consequence: e.build.block(e.build.expressionStatement(e.build.identifier('f'))) })
	},
	typescript: {
		descriptor: typescript,
		kind: 'IfStatement',
		holder: 'FunctionDeclaration',
		statement: 'ExpressionStatement',
		sources: {
			plain: 'function g() {\n  if (a) {\n    b;\n  }\n}\n',
			comment: 'function g() {\n  if (a) {\n    // c\n    b;\n  }\n}\n',
			error: 'function g() {\n  if (a) {\n    @;\n    b;\n  }\n}\n',
			nested: 'function g() {\n  if (a) {\n    if (b) {\n      c;\n    }\n  }\n}\n',
			two: 'function g() {\n  if (a) {\n    b;\n    c;\n  }\n}\n'
		},
		alone: {
			plain: 'if (a) {\n  b;\n}',
			comment: 'if (a) {\n  // c\n  b;\n}',
			error: 'if (a) {\n  @;\n  b;\n}',
			edited: 'if (z) {\n  b;\n}',
			nested: 'if (b) {\n  c;\n}',
			leading: 'if (a) {\n  b;\n  // w\n  c;\n}',
			trailing: 'if (a) {\n  b;\n  c; // w\n}',
			built: 'if (a) {\n  b;\n}'
		},
		condition: (e, name) => e.build.parenthesizedExpressionTyped({ expression: e.build.identifier(name) }),
		comment: (e) => e.build.comment(' w'),
		build: (e, inner) => e.build.functionDeclaration({ name: 'g', parameters: e.build.formalParameters(), body: e.build.statementBlock(inner) }),
		buildIf: (e) => e.build.ifStatement({ condition: e.build.parenthesizedExpressionTyped({ expression: e.build.identifier('a') }), consequence: e.build.statementBlock(e.build.expressionStatement(e.build.identifier('b'))) })
	}
};

const find = (node: any, kind: number, seen = new Set<object>()): any => {
	if (node === null || typeof node !== 'object' || seen.has(node)) return undefined;
	seen.add(node);
	if (node.$type === kind) return node;
	for (const slot of Object.keys(node.$with ?? {})) {
		if (typeof node[slot] !== 'function') continue;
		const value: unknown = node[slot]();
		for (const child of Array.isArray(value) ? value : [value]) {
			const found = find(child, kind, seen);
			if (found !== undefined) return found;
		}
	}
	return undefined;
};

describe.each(Object.entries(GRAMMARS))('a nested %s node rendered on its own starts at column 0, its later lines relative to it', (_, grammar) => {
	describe.each(['object', 'arena'] as const)('%s storage', async (nodeStorage) => {
		const e: Engine = await sharedEngine(() => createEngine(grammar.descriptor as never, { nodeStorage }));
		const kind = e.kinds[grammar.kind] as number;
		const parsedIf = (source: string) => e.parse(source).$query().$descendants.ofType(kind).at(0);
		const render = (node: { $render(): unknown }) => String(node.$render());

		it.each(['plain', 'comment', 'error'] as const)('parsed, %s', (source) => {
			expect(render(parsedIf(grammar.sources[source]))).toBe(grammar.alone[source]);
		});

		it('parsed, the inner of two nested', () => {
			const inner = [...e.parse(grammar.sources.nested).$query().$descendants.ofType(kind)][1];
			expect(render(inner)).toBe(grammar.alone.nested);
		});

		it('parsed and edited in place', () => {
			expect(render(parsedIf(grammar.sources.plain).$with.condition(grammar.condition(e, 'z')))).toBe(grammar.alone.edited);
		});

		it('parsed, held by an edited parent', () => {
			const holder = find(e.parse(grammar.sources.plain), e.kinds[grammar.holder]).$with.name(e.build.identifier('h'));
			expect(render(find(holder, kind))).toBe(grammar.alone.plain);
		});

		it.each(['leading', 'trailing'] as const)('parsed, a %s side written on a statement inside it', (side) => {
			const node = parsedIf(grammar.sources.two);
			const [, second] = [...node.$query().$descendants.ofType(e.kinds[grammar.statement])];
			second.$trivia[side](grammar.comment(e));
			expect(render(node)).toBe(grammar.alone[side]);
		});

		it('built on its own', () => {
			expect(render(grammar.buildIf(e) as never)).toBe(grammar.alone.built);
		});

		it('built, taken out of a built tree', () => {
			expect(render(find(grammar.build(e, grammar.buildIf(e)), kind))).toBe(grammar.alone.built);
		});
	});
});
