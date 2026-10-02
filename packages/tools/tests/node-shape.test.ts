import v8 from 'node:v8';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../../rust/src/index.ts';
import typescript from '../../typescript/src/index.ts';
import python from '../../python/src/index.ts';
import { buildIdentifier } from '../../rust/src/factories/raw.ts';

v8.setFlagsFromString('--allow-natives-syntax');
const hasFastProperties = new Function('o', 'return %HasFastProperties(o)') as (o: object) => boolean;
const COUNT = 1000;
const fastCount = (make: () => object): number => Array.from({ length: COUNT }, make).filter(hasFastProperties).length;

const rs = await createEngine(rust);
const ts = await createEngine(typescript);
const py = await createEngine(python);

const parsedMatchBlock = () => {
	const item = rs.parse('fn f() { match x { 1 => 1, _ => 2 } }\n').statements()[0]!;
	if (!rs.is.functionItem(item)) throw new Error('not a function');
	const statement = item.body().statements()[0]!;
	if (!rs.is.expressionStatement(statement)) throw new Error('not an expression statement');
	const expression = statement.content();
	if (!rs.is.matchExpression(expression)) throw new Error('not a match');
	return expression.body();
};
const arms = parsedMatchBlock().matchBlockArms();

const classes: Record<string, () => object> = {
	'rust text leaf': () => rs.build.identifier('x'),
	'rust plain kind': () => rs.build.binaryExpression({ left: rs.build.identifier('a'), operator: '+', right: rs.build.identifier('b') }),
	'rust group seat, group present': () => rs.build.matchBlock(arms),
	'rust group seat, group absent': () => rs.build.matchBlock(),
	'rust list owner': () => rs.build.arguments(rs.build.identifier('a'), rs.build.identifier('b'), rs.build.identifier('c')),
	'typescript text leaf': () => ts.build.identifier('x'),
	'typescript plain kind': () => ts.build.binaryExpression({ left: ts.build.identifier('a'), operator: '+', right: ts.build.identifier('b') }),
	'typescript group seat': () => ts.build.catchClause({ body: ts.build.statementBlock() }),
	'python text leaf': () => py.build.identifier('x'),
	'python group seat': () => py.build.slice({})
};

const pending = new Set([
	'rust group seat, group present',
	'rust group seat, group absent',
	'rust list owner',
	'typescript group seat',
	'python group seat',
	'parsed'
]);

describe('a built node keeps fast properties', () => {
	for (const [label, make] of Object.entries(classes)) {
		const run = () => expect(fastCount(make)).toBe(COUNT);
		(pending.has(label) ? it.fails : it)(label, run);
	}
});

describe('a built node without an engine, or with trivia, keeps fast properties', () => {
	it('has no engine and refuses to render, as one shape', () => {
		const node = buildIdentifier('x');
		expect(() => node.$render()).toThrow('node has no engine');
		expect(() => node.$trivia.leading()).toThrow('node has no engine');
		expect((node as unknown as { $engine?: unknown }).$engine).toBeUndefined();
		expect(fastCount(() => buildIdentifier('x'))).toBe(COUNT);
	});

	it('a node that gets trivia attached stays fast', () => {
		const comment = rs.build.comment(' c');
		expect(fastCount(() => rs.build.identifier('x').$trivia.leading(comment))).toBe(COUNT);
	});
});

const typedNodesOf = (root: unknown): object[] => {
	const seen = new Set<object>();
	const camel = (slot: string) => slot.replace(/^_/, '').replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
	const walk = (node: any): void => {
		if (node === null || typeof node !== 'object') return;
		if (Array.isArray(node)) return node.forEach(walk);
		if (seen.has(node)) return;
		seen.add(node);
		for (const key of Object.keys(node)) {
			if (!key.startsWith('_') || node[key] == null) continue;
			const reader = node[camel(key)];
			walk(typeof reader === 'function' ? reader.call(node) : node[key]);
		}
	};
	walk(root);
	return [...seen].filter((node) => typeof (node as { $type?: unknown }).$type === 'number');
};

describe('a parsed plain kind keeps fast properties', () => {
	it('binary expressions and let declarations read from source', () => {
		const nodes = typedNodesOf(rs.parse('fn f() { let x = a + b * c; }\nfn g() { 1 + 2 }\n', { deep: true }));
		const plain = nodes.filter((node) => [rs.kinds.BinaryExpression, rs.kinds.LetDeclaration].includes((node as { $type: number }).$type));
		expect(plain.length).toBeGreaterThanOrEqual(4);
		expect(plain.filter((node) => !hasFastProperties(node))).toEqual([]);
	});
});

describe('a parsed node keeps fast properties', () => {
	const source = 'fn f(a: i32) { let x = g(a, a + 1); match x { 1 => 1, _ => 2 } }\n';
	for (const deep of [false, true]) {
		(pending.has('parsed') ? it.fails : it)(deep ? 'deep parse' : 'shallow parse', () => {
			const nodes = typedNodesOf(rs.parse(source, deep ? { deep: true } : undefined));
			expect(nodes.length).toBeGreaterThan(10);
			expect(nodes.filter((node) => !hasFastProperties(node))).toEqual([]);
		});
	}
});
