import v8 from 'node:v8';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { isStorageKey, PLAIN_KINDS, toNodeData, treeTokenOf } from '@sittir/common/utils';
import rust from '../../rust/src/index.ts';
import typescript from '../../typescript/src/index.ts';
import python from '../../python/src/index.ts';
import { loadSlotAccessorOf, walkWrappedTree } from '../src/validate/common.ts';

v8.setFlagsFromString('--allow-natives-syntax');
const hasFastProperties = new Function('o', 'return %HasFastProperties(o)') as (o: object) => boolean;
const COUNT = 1000;
const fastCount = (make: () => object): number => Array.from({ length: COUNT }, make).filter(hasFastProperties).length;

const rs = await createEngine(rust);
const ts = await createEngine(typescript);
const py = await createEngine(python);
const { identifier: buildIdentifier } = (await rust.load()).build;
const rustSlots = await loadSlotAccessorOf('rust');

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
	'rust plain kind': () =>
		rs.build.binaryExpression({ left: rs.build.identifier('a'), operator: '+', right: rs.build.identifier('b') }),
	'rust group seat, group present': () => rs.build.matchBlock(arms),
	'rust group seat, group absent': () => rs.build.matchBlock(),
	'rust list owner': () =>
		rs.build.arguments(rs.build.identifier('a'), rs.build.identifier('b'), rs.build.identifier('c')),
	'typescript text leaf': () => ts.build.identifier('x'),
	'typescript plain kind': () =>
		ts.build.binaryExpression({ left: ts.build.identifier('a'), operator: '+', right: ts.build.identifier('b') }),
	'typescript group seat': () => ts.build.catchClause({ body: ts.build.statementBlock() }),
	'python text leaf': () => py.build.identifier('x'),
	'python group seat': () => py.build.slice({})
};

const NODE_METADATA = new Set([
	'$type',
	'$named',
	'$text',
	'$other',
	'$span',
	'$treeHandle',
	'$end',
	'$_trivia',
	'$slotOrder'
]);

const offenders = (value: unknown, path = '$'): string[] => {
	if (typeof value === 'function') return [`${path} is a function`];
	if (Array.isArray(value)) return value.flatMap((entry, index) => offenders(entry, `${path}[${index}]`));
	if (value === null || typeof value !== 'object') return [];
	const isNode = ['number', 'string'].includes(typeof (value as { $type?: unknown }).$type);
	return Object.entries(value).flatMap(([key, entry]) => {
		const stray =
			!isNode || isStorageKey(key) || NODE_METADATA.has(key)
				? []
				: [`${path}.${key} is neither storage nor $ metadata`];
		return [...stray, ...offenders(entry, `${path}.${key}`)];
	});
};

describe('what a node sends across the boundary carries no member', () => {
	const source = 'fn f(a: i32) { let x = g(a, a + 1); match x { 1 => 1, _ => 2 } }\n';
	const wrapped: Record<string, () => object> = {
		'rust parsed, shallow': () => rs.parse(source),
		'rust parsed, deep': () => rs.parse(source, { depth: Infinity }),
		'typescript parsed': () => ts.parse('const x = f(a, b);\n'),
		'python parsed': () => py.parse('x = f(a, b)\n')
	};
	for (const [label, make] of Object.entries({ ...classes, ...wrapped })) {
		it(label, () => {
			expect(offenders(toNodeData(make() as never, PLAIN_KINDS))).toEqual([]);
		});
	}
});

describe('a wrapped node holds its tree token', () => {
	const source = 'fn f(a: i32) { let x = g(a, a + 1); match x { 1 => 1, _ => 2 } }\n';
	it('on every node of a parse', () => {
		const nodes = typedNodesOf(rs.parse(source));
		expect(nodes.length).toBeGreaterThan(10);
		expect(nodes.filter((node) => treeTokenOf(node) === undefined)).toEqual([]);
	});
});

describe('a built node keeps fast properties', () => {
	for (const [label, make] of Object.entries(classes)) {
		const run = () => expect(fastCount(make)).toBe(COUNT);
		it(label, run);
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
	const nodes = new Set<object>();
	walkWrappedTree(root, rustSlots, (node) => nodes.add(node));
	return [...nodes];
};

describe('a parsed plain kind keeps fast properties', () => {
	it('binary expressions, let declarations and function items read from source', () => {
		const nodes = typedNodesOf(rs.parse('fn f() { let x = a + b * c; }\nfn g() { 1 + 2 }\n', { depth: Infinity }));
		const plain = nodes.filter((node) =>
			[rs.kinds.BinaryExpression, rs.kinds.LetDeclaration, rs.kinds.FunctionItem].includes(
				(node as { $type: number }).$type
			)
		);
		expect(plain.length).toBeGreaterThanOrEqual(4);
		expect(plain.filter((node) => !hasFastProperties(node))).toEqual([]);
	});
});

describe('a parsed node keeps fast properties', () => {
	const source = 'fn f(a: i32) { let x = g(a, a + 1); match x { 1 => 1, _ => 2 } }\n';
	for (const deep of [false, true]) {
		it(deep ? 'deep parse' : 'shallow parse', () => {
			const nodes = typedNodesOf(rs.parse(source, deep ? { depth: Infinity } : undefined));
			expect(nodes.length).toBeGreaterThan(10);
			expect(nodes.filter((node) => !hasFastProperties(node))).toEqual([]);
		});
	}
});
