import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
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
