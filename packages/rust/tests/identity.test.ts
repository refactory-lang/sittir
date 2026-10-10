import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { isCoordinate } from '../../common/src/read.ts';
import { treeOf } from '../../common/src/tree-token.ts';
import rust from '../src/index.ts';

const engine = await createEngine(rust);
const SOURCE = 'fn a() {}\nfn b() { let x = 1; }\n';

function viaAccessors(root: ReturnType<typeof engine.parse>) {
	const second = root.statements()[1]!;
	if (!engine.is.functionItem(second)) throw new Error('expected a function');
	const statement = second.body().statements()[0];
	if (statement === undefined || !engine.is.letDeclaration(statement)) throw new Error('expected a let declaration');
	return statement;
}

function viaQuery(root: ReturnType<typeof engine.parse>) {
	const found = Array.from(root.$query().$descendants).find((node) => engine.is.letDeclaration(node));
	if (found === undefined || !engine.is.letDeclaration(found)) throw new Error('expected a let declaration');
	return found;
}

function countingReads(root: object): number[] {
	const tree = treeOf(root);
	if (tree?.read === undefined) throw new Error('expected a live tree');
	const native = tree.read.bind(tree);
	const reads: number[] = [];
	tree.read = (index, depth) => (reads.push(index), native(index, depth));
	return reads;
}

describe.each([
	['a shallow read', 1],
	['a deep read', Infinity]
])('one wrapper per node, on %s', (_, depth) => {
	it('a query returns the object the accessors return', () => {
		const root = engine.parse(SOURCE, { depth });
		expect(viaQuery(root)).toBe(viaAccessors(root));
	});

	it('query first, accessor second', () => {
		const root = engine.parse(SOURCE, { depth });
		const queried = viaQuery(root);
		expect(viaAccessors(root)).toBe(queried);
	});

	it('the same object across two queries', () => {
		const root = engine.parse(SOURCE, { depth });
		expect(viaQuery(root)).toBe(viaQuery(root));
	});

	it('includes is identity', () => {
		const root = engine.parse(SOURCE, { depth });
		expect(root.$query().$descendants.includes(viaAccessors(root))).toBe(true);
	});
});

describe.each([
	['a let declaration', 'fn b() { let x = 1; let y = 2; }\n', engine.kinds.LetDeclaration],
	['a variant arm', 'fn b() { let r = 0..1; let s = 2..3; }\n', engine.kinds.RangeExpressionBinary]
] as const)('a descendants query over %s', (_, source, kind) => {
	it('reads only the matches not already registered, and no ancestor', () => {
		const root = engine.parse(source, { depth: 1 });
		const reads = countingReads(root);
		const first = Array.from(root.$query().$descendants.ofType(kind));
		expect(first.length).toBe(2);
		expect(reads.length).toBe(first.length);
		reads.length = 0;
		const again = Array.from(root.$query().$descendants.ofType(kind));
		expect(again).toEqual(first);
		expect(reads).toEqual([]);
	});
});

describe.each([
	['a shallow read', 1],
	['a deep read', Infinity]
])('a write under a node a query reached, on %s', (_, depth) => {
	it('is refused while no accessor chain from the root holds it', () => {
		const root = engine.parse(SOURCE, { depth });
		const fn = root.$query().$descendants.ofType(engine.kinds.FunctionItem).at(1);
		if (fn === undefined || !engine.is.functionItem(fn)) throw new Error('expected a function');
		const statement = fn.body().statements()[0];
		if (statement === undefined || !engine.is.letDeclaration(statement)) throw new Error('expected a let declaration');
		expect(() => statement.$trivia.leading(engine.build.lineComment(' x'))).toThrow(/reached outside its parent's accessors/);
	});

	it('is accepted and renders once the accessors from the root reach it', () => {
		const root = engine.parse(SOURCE, { depth });
		const fn = root.$query().$descendants.ofType(engine.kinds.FunctionItem).at(1);
		if (fn === undefined || !engine.is.functionItem(fn)) throw new Error('expected a function');
		const statement = fn.body().statements()[0];
		expect(viaAccessors(root)).toBe(statement);
		viaAccessors(root).$trivia.leading(engine.build.lineComment(' x'));
		expect(root.$render()).toContain('// x\n');
	});
});

describe('a variant arm a query reached', () => {
	it('is returned by its accessor with no native read of its own', () => {
		const root = engine.parse('fn b() { let r = 0..1; }\n', { depth: 1 });
		const reads = countingReads(root);
		const [arm] = root.$query().$descendants.ofType(engine.kinds.RangeExpressionBinary);
		const armReads = [...reads];
		expect(armReads.length).toBe(1);
		reads.length = 0;
		const fn = root.statements()[0];
		if (fn === undefined || !engine.is.functionItem(fn)) throw new Error('expected a function');
		const statement = fn.body().statements()[0];
		if (statement === undefined || !engine.is.letDeclaration(statement)) throw new Error('expected a let declaration');
		expect(statement.value()).toBe(arm);
		expect(reads.filter((index) => armReads.includes(index))).toEqual([]);
	});
});

describe('a collected wrapper', () => {
	it('is wrapped again, and the new wrapper is the one every route returns', () => {
		const fixture = fileURLToPath(new URL('../../common/tests/fixtures/registry-collect.mts', import.meta.url));
		const out = execFileSync(process.execPath, ['--expose-gc', '--import', 'tsx', fixture], {
			cwd: fileURLToPath(new URL('..', import.meta.url)),
			encoding: 'utf8',
			env: { ...process.env, SITTIR_BACKEND: 'native' }
		});
		expect(JSON.parse(out.trim().split('\n').at(-1) ?? '')).toEqual({ collected: true, sameAfter: true });
	}, 60_000);
});

describe('an alias envelope and its content', () => {
	it('are two objects, each the same through every route', () => {
		const root = engine.parse('fn f() { a.b; }\n', { depth: 1 });
		const access = root.$query().$descendants.ofType(engine.kinds.FieldExpression).at(0);
		if (access === undefined || !engine.is.fieldExpression(access)) throw new Error('expected a field expression');
		const envelope = access.field();
		const content = envelope.content();
		expect(access.field()).toBe(envelope);
		expect(envelope.content()).toBe(content);
		expect(content).not.toBe(envelope);
		expect(Array.from(root.$query().$descendants).find((node) => engine.is.fieldIdentifier(node))).toBe(envelope);
	});
});

describe('ofType at an alias envelope', () => {
	const SOURCE_FIELDS = 'fn f() { a.b; c.d; }\n';
	const accessed = (root: ReturnType<typeof engine.parse>) =>
		root.$query().$descendants.ofType(engine.kinds.FieldExpression).map((access) => {
			if (!engine.is.fieldExpression(access)) throw new Error('expected a field expression');
			return access.field();
		});

	it('selects the envelopes by their display kind, the objects the accessors return', () => {
		const root = engine.parse(SOURCE_FIELDS, { depth: 1 });
		const fields = [...accessed(root)];
		expect(fields.length).toBe(2);
		expect([...root.$query().$descendants.ofType(engine.kinds.FieldIdentifier)]).toEqual(fields);
		const [first] = root.$query().$descendants.ofType(engine.kinds.FieldIdentifier);
		expect(first).toBe(fields[0]);
	});

	it('does not select an aliased node by its content kind', () => {
		const root = engine.parse(SOURCE_FIELDS, { depth: 1 });
		const identifiers = [...root.$query().$descendants.ofType(engine.kinds.Identifier)];
		expect(identifiers.map((node) => (node as { readonly $text?: string }).$text)).toEqual(['f', 'a', 'c']);
		expect(identifiers.every((node) => (node as { readonly $type: number }).$type === engine.kinds.Identifier)).toBe(true);
	});
});

const NESTED = 'fn a() { let p = 1; }\nfn b() { let q = 2; let r = 3; }\nfn c() { let s = 4; }\n';

type RootStatement = ReturnType<ReturnType<typeof engine.parse>['statements']>[number];

function letAt(fn: RootStatement | undefined, at: number) {
	if (fn === undefined || !engine.is.functionItem(fn)) throw new Error('expected a function');
	const statement = fn.body().statements()[at];
	if (statement === undefined || !engine.is.letDeclaration(statement)) throw new Error('expected a let declaration');
	return statement;
}

describe('the fold by range', () => {
	it('a deep write unfolds its ancestors and leaves siblings and cousins as bytes', () => {
		const root = engine.parse(NESTED, { depth: 1 });
		const [, b] = root.statements();
		letAt(b, 0).$trivia.leading(engine.build.lineComment(' q'));
		expect(root.$render()).toBe('fn a() { let p = 1; }\nfn b() {\n    // q\n    let q = 2; let r = 3;\n}\nfn c() { let s = 4; }\n');
	});

	it('nested writes fold only untouched ranges', () => {
		const root = engine.parse(NESTED, { depth: 1 });
		const [a, b] = root.statements();
		letAt(a, 0).$trivia.leading(engine.build.lineComment(' p'));
		letAt(b, 1).$trivia.trailing(engine.build.lineComment(' r'));
		const out = root.$render();
		expect(out).toContain('// p\n');
		expect(out).toContain('let r = 3;\n    // r\n');
		expect(out.endsWith('fn c() { let s = 4; }\n')).toBe(true);
	});

	it('a built holder of an edited parsed child', () => {
		const root = engine.parse(NESTED, { depth: 1 });
		const [, b] = root.statements();
		if (b === undefined || !engine.is.functionItem(b)) throw new Error('expected a function');
		letAt(b, 0).$trivia.leading(engine.build.lineComment(' q'));
		const built = engine.build.sourceFile({ statements: [b] });
		expect(built.$render()).toBe('fn b() {\n    // q\n    let q = 2; let r = 3;\n}\n');
	});

	it('an untouched node folds after a write elsewhere', () => {
		const root = engine.parse(NESTED, { depth: 1 });
		const [a, , c] = root.statements();
		if (c === undefined || !engine.is.functionItem(c)) throw new Error('expected a function');
		letAt(a, 0).$trivia.leading(engine.build.lineComment(' p'));
		expect(c.$render()).toBe('fn c() { let s = 4; }');
	});
});

interface Storage {
	readonly _statements: never[];
	readonly _item: never[];
	readonly _parameters: never;
	readonly _body: never;
}

function storageOf(node: object): Storage {
	return node as unknown as Storage;
}

describe('a built node over parsed storage', () => {
	it("hydrates a list item it stores into the parsed holder's object", () => {
		const parsed = engine.parse(SOURCE, { depth: 1 });
		const built = engine.build.sourceFile({ statements: storageOf(parsed)._statements });
		expect(built.$render()).toBe(SOURCE);
		expect(built.statements()[0]).toBe(parsed.statements()[0]);
		expect(built.statements()).toBe(built.statements());
		expect(built.$render()).toBe(SOURCE);
	});

	it("hydrates a single slot it stores into the parsed holder's object", () => {
		const parsed = engine.parse(SOURCE, { depth: 1 });
		const fn = parsed.statements()[1];
		if (fn === undefined || !engine.is.functionItem(fn)) throw new Error('expected a function');
		const stored = storageOf(fn);
		expect(isCoordinate(stored._body)).toBe(true);
		const built = engine.build.functionItem({ name: engine.build.identifier('c'), parameters: stored._parameters, body: stored._body });
		expect(built.body()).toBe(fn.body());
		expect(built.$render()).toBe('fn c() { let x = 1; }');
	});

	it('refuses a coordinate that lost its tree, and never returns it raw', () => {
		const parsed = engine.parse(SOURCE, { depth: 1 });
		const held = storageOf(parsed)._statements[0];
		expect(isCoordinate(held)).toBe(true);
		const copied = storageOf({ _statements: [JSON.parse(JSON.stringify(held))] })._statements;
		const built = engine.build.sourceFile({ statements: copied });
		expect(() => built.statements()[0]).toThrow(/does not hold that tree/);
	});

	it('reads a list through its accessor on every route: at, an index and iteration', () => {
		const root = engine.parse('type T = (Vec<A>, Vec<B>);\n', { depth: 1 });
		const item = root.statements()[0];
		if (item === undefined || !engine.is.typeItem(item)) throw new Error('expected a type item');
		const tuple = item.type();
		if (!engine.is.tupleType(tuple)) throw new Error('expected a tuple type');
		const parsed = tuple.types();
		const stored = storageOf(parsed)._item;
		expect(stored.every(isCoordinate)).toBe(true);
		const [first, ...rest] = stored;
		if (first === undefined) throw new Error('expected items');
		const built = engine.build.types(first, ...rest);
		const items = built.items();
		expect(built.at(0)).toBe(items[0]);
		expect(built[1]).toBe(items[1]);
		expect([...built]).toEqual(items);
		expect(built.at(0)).toBe(parsed.items()[0]);
	});

	it('refuses to render a write inside a coordinate it never read; a holder built from the written node renders it', () => {
		const parsed = engine.parse(SOURCE, { depth: 1 });
		const built = engine.build.sourceFile({ statements: storageOf(parsed)._statements });
		letAt(parsed.statements()[1], 0).$trivia.leading(engine.build.lineComment(' x'));
		expect(() => built.$render()).toThrow(/nodes \d+\.\.\d+ of tree \d+ are held here as a coordinate this holder never read/);
		expect(parsed.$render()).toContain('// x');
		expect(engine.build.sourceFile({ statements: [...parsed.statements()] }).$render()).toContain('// x');
	});

	it('refuses to render an outside write on the node a stored coordinate names', () => {
		const parsed = engine.parse(SOURCE, { depth: 1 });
		const built = engine.build.sourceFile({ statements: storageOf(parsed)._statements });
		const fn = parsed.statements()[1];
		if (fn === undefined || !engine.is.functionItem(fn)) throw new Error('expected a function');
		fn.$trivia.leading(engine.build.lineComment(' own'));
		expect(() => built.$render()).toThrow(/held here as a coordinate this holder never read/);
		expect(engine.build.sourceFile({ statements: [...parsed.statements()] }).$render()).toContain('// own\n');
	});

	it('refuses after its engine is disposed, naming the tree', async () => {
		const scoped = await createEngine(rust);
		const parsed = scoped.parse(SOURCE, { depth: 1 });
		const built = scoped.build.sourceFile({ statements: storageOf(parsed)._statements });
		scoped.dispose();
		expect(() => built.statements()[0]).toThrow(/tree \d+/);
	});
});
