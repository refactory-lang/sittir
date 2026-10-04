import { describe, expect, it } from 'vitest';
import { holds } from '../../common/src/query.ts';
import python from '../src/index.ts';
import { hooks } from '../src/api.ts';
import { createEngine } from '@sittir/common';
import type { QueryPlan } from '@sittir/types';

const py = await createEngine(python);
const K = py.kinds;

const SOURCE = [
	'def a(x):',
	'    def _b():',
	'        pass',
	'    return x',
	'class C:',
	'    def __init__(self):',
	'        pass',
	'    def _d(self, y):',
	'        return y',
	'def e():',
	'    pass',
	''
].join('\n');

type Spanned = { readonly $type: number; readonly $span?: { readonly start: number; readonly end: number } };

const textOf = (source: string, node: unknown): string => {
	const span = (node as Spanned).$span!;
	return source.slice(span.start, span.end);
};
const firstLine = (source: string, node: unknown): string => textOf(source, node).split('\n')[0]!;
const occurrence = (node: unknown): string =>
	`${(node as Spanned).$type}@${(node as Spanned).$span!.start}-${(node as Spanned).$span!.end}`;

const root = py.parse(SOURCE);
const descendants = () => root.$query().$descendants;

describe('the query facet of a parsed node', () => {
	it('reads each slot as a lazy view with the items the accessor returns', () => {
		const fn = descendants().ofType(K.FunctionDefinition).find()!;
		for (const slot of ['name', 'parameters', 'body'] as const) {
			const read: unknown = fn[slot]();
			const view = [...(fn.$query()[slot] as Iterable<unknown>)];
			expect(view.map(occurrence)).toEqual(
				(Array.isArray(read) ? read : read === undefined ? [] : [read]).map(occurrence)
			);
		}
		expect(root.statements().map(occurrence)).toEqual([...root.$query().statements].map(occurrence));
	});

	it('is what engine.query returns for the node', () => {
		expect(Object.keys(py.query(root))).toEqual(Object.keys(root.$query()));
		expect([...py.query(root).$children].map(occurrence)).toEqual([...root.$query().$children].map(occurrence));
	});

	it('resolves as itself when an async function returns it: then reads as undefined', async () => {
		const facet = root.$query();
		expect((facet as unknown as Record<string, unknown>).then).toBeUndefined();
		const resolved = await (async () => root.$query())();
		expect(Object.keys(resolved)).toEqual(Object.keys(facet));
	});

	it('names its slots and the two traversals, and refuses any other name', () => {
		const facet = root.$query();
		expect(Object.keys(facet)).toEqual(['$children', '$descendants', 'statements']);
		expect('statements' in facet).toBe(true);
		expect(() => (facet as unknown as Record<string, unknown>).nmae).toThrow(/has no slot 'nmae'/);
		expect((facet as unknown as Record<symbol, unknown>)[Symbol.iterator]).toBeUndefined();
		expect(() => {
			(facet as unknown as Record<string, unknown>).statements = 1;
		}).toThrow(/read-only/);
	});
});

describe('traversal', () => {
	it('walks the structural descendants in pre-order', () => {
		expect(
			Array.from(
				descendants()
					.ofType(K.FunctionDefinition)
					.map((fn) => firstLine(SOURCE, fn))
			)
		).toEqual(['def a(x):', 'def _b():', 'def __init__(self):', 'def _d(self, y):', 'def e():']);
	});

	it('takes the direct structural children in source order', () => {
		expect([...root.$query().$children].map((child) => firstLine(SOURCE, child))).toEqual([
			'def a(x):',
			'class C:',
			'def e():'
		]);
		const last = root.statements()[2]!;
		if (!py.is.functionDefinition(last)) throw new Error('expected a definition');
		expect([...last.body().$query().$children].map((child) => firstLine(SOURCE, child))).toEqual(['pass']);
	});

	it('never yields a comment', () => {
		const source = '# lead\ndef f():\n    # inside\n    pass\n';
		const kinds = [...py.parse(source).$query().$descendants].map((node) => (node as Spanned).$type);
		expect(kinds).not.toContain(K.Comment);
		expect(kinds).toContain(K.FunctionDefinition);
	});

	it('hydrates each node to the kind it reported', () => {
		expect(
			descendants()
				.ofType(K.Identifier)
				.every((node) => node.$type === K.Identifier)
		).toBe(true);
		expect(
			descendants()
				.ofType(K.Identifier)
				.some(() => true)
		).toBe(true);
	});

	it('pulls batches of 1, 4, 16, 64, then 256, and only as many as a terminal needs', () => {
		const { root: data, tree } = py.diagnostics.parseAndRead(SOURCE.repeat(40));
		const limits: number[] = [];
		const query = (tree as { query?: { descendants(step: { limit: number }): unknown } }).query!;
		const walk = query.descendants;
		query.descendants = (step) => {
			limits.push(step.limit);
			return walk(step);
		};
		const wrapped = hooks.wrap(data, tree);
		expect(firstLine(SOURCE, wrapped.$query().$descendants.ofType(K.FunctionDefinition).find())).toBe('def a(x):');
		expect(limits).toEqual([1]);
		limits.length = 0;
		const all = [...wrapped.$query().$descendants];
		expect(limits.slice(0, 6)).toEqual([1, 4, 16, 64, 256, 256]);
		expect(new Set(all.map(occurrence)).size).toBe(all.length);
	});

	it('sends the kind filter and a where condition into the native walk', () => {
		const { root: data, tree } = py.diagnostics.parseAndRead(SOURCE);
		const steps: { kinds?: readonly number[]; plan?: unknown }[] = [];
		const query = (tree as { query?: { descendants(step: { kinds?: readonly number[]; plan?: unknown }): unknown } })
			.query!;
		const walk = query.descendants;
		query.descendants = (step) => {
			steps.push(step);
			return walk(step);
		};
		const found = [
			...hooks
				.wrap(data, tree)
				.$query()
				.$descendants.ofType(K.FunctionDefinition)
				.where((c) => c.name.eq('e'))
		];
		expect(found.map((fn) => firstLine(SOURCE, fn))).toEqual(['def e():']);
		expect(steps.every((step) => step.kinds?.[0] === K.FunctionDefinition && step.plan !== undefined)).toBe(true);
	});
});

type NameRecorder = { readonly name: { eq(text: string): never; match(pattern: RegExp): never } };
type Combinable = { and(other: unknown): never; not(): never };

describe('where', () => {
	const cases: readonly (readonly [string, (c: NameRecorder) => never, QueryPlan])[] = [
		['name eq a', (c) => c.name.eq('a'), { op: 'eq', fields: ['name'], kinds: [], text: 'a' }],
		['name match ^_', (c) => c.name.match(/^_/), { op: 'match', fields: ['name'], kinds: [], pattern: '^_' }],
		[
			'name match ^_ and not ^__',
			(c) => (c.name.match(/^_/) as Combinable).and((c.name.match(/^__/) as Combinable).not()),
			{
				op: 'and',
				of: [
					{ op: 'match', fields: ['name'], kinds: [], pattern: '^_' },
					{ op: 'not', of: { op: 'match', fields: ['name'], kinds: [], pattern: '^__' } }
				]
			}
		]
	];

	for (const [label, condition, plan] of cases) {
		it(`selects natively what the JavaScript reference selects: ${label}`, () => {
			const defs = descendants().ofType(K.FunctionDefinition);
			const native = [...defs.where(condition as never)].map(occurrence);
			const reference = Array.from(defs.filter((fn) => holds(plan, () => [textOf(SOURCE, fn.name())]))).map(occurrence);
			expect(native).toEqual(reference);
			expect(native.length).toBeGreaterThan(0);
		});
	}

	it('evaluates over a slot view and over the children', () => {
		const defs = [
			...root
				.$query()
				.statements.ofType(K.FunctionDefinition)
				.where((c) => c.name.eq('e'))
		];
		expect(defs.map((fn) => firstLine(SOURCE, fn))).toEqual(['def e():']);
		const children = [
			...root
				.$query()
				.$children.ofType(K.FunctionDefinition)
				.where((c) => c.name.match(/^[ae]$/))
		];
		expect(children.map((fn) => firstLine(SOURCE, fn))).toEqual(['def a(x):', 'def e():']);
	});

	it('an index-free filter gives the same items before or after ofType and where', () => {
		const keep = (fn: { name(): unknown }) => textOf(SOURCE, fn.name()) !== 'e';
		const before = Array.from(
			descendants()
				.ofType(K.FunctionDefinition)
				.where((c) => c.name.match(/^[a-z_]/))
				.filter(keep)
		).map(occurrence);
		const after = [
			...descendants()
				.ofType(K.FunctionDefinition)
				.filter(keep)
				.where((c) => c.name.match(/^[a-z_]/))
		].map(occurrence);
		expect(after).toEqual(before);
		const typedLate = [
			...descendants()
				.filter((node) => (node as Spanned).$type !== K.Block)
				.ofType(K.FunctionDefinition)
		].map(occurrence);
		expect(typedLate).toEqual([...descendants().ofType(K.FunctionDefinition)].map(occurrence));
	});

	it('never moves ofType or where past a callback that takes an index', () => {
		expect(
			Array.from(
				descendants()
					.filter((_, i) => i === 0)
					.ofType(K.FunctionDefinition)
			).map((fn) => firstLine(SOURCE, fn))
		).toEqual(['def a(x):']);
		expect(
			Array.from(
				descendants()
					.filter((_, i) => i === 1)
					.ofType(K.FunctionDefinition)
			)
		).toEqual([]);
		expect(
			Array.from(
				descendants()
					.filter((_, i) => i === 1)
					.ofType(K.FunctionDefinition)
					.where((c) => c.name.match(/./))
			)
		).toEqual([]);
	});

	it('refuses an unknown slot, a call, a plain predicate and a flagged pattern at the call', () => {
		const defs = descendants().ofType(K.FunctionDefinition);
		expect(() => defs.where((c) => (c as unknown as Record<string, { eq(t: string): never }>).nmae!.eq('x'))).toThrow(
			/not a slot/
		);
		expect(() => defs.where((c) => (c.name as unknown as () => never)())).toThrow();
		expect(() => defs.where((() => true) as never)).toThrow(/recorded condition/);
		expect(() => defs.where((c) => c.name.match(/a/i))).toThrow(/flags/);
	});

	it('refuses a pattern the native matcher cannot compile when it runs', () => {
		expect(() => [
			...descendants()
				.ofType(K.FunctionDefinition)
				.where((c) => c.name.match(/(a)\1/))
		]).toThrow();
	});
});

describe('the view verbs', () => {
	const names = () =>
		descendants()
			.ofType(K.FunctionDefinition)
			.map((fn) => textOf(SOURCE, fn.name()));

	it('slice, at, find, findIndex, some, every, reduce and forEach read as an array would', () => {
		const all = [...names()];
		expect(Array.from(names().slice(1, 3))).toEqual(all.slice(1, 3));
		expect(Array.from(names().slice(-2))).toEqual(all.slice(-2));
		expect(names().at(2)).toBe(all.at(2));
		expect(names().at(-1)).toBe(all.at(-1));
		expect(names().find((name) => name.startsWith('_'))).toBe('_b');
		expect(names().findIndex((name) => name === 'e')).toBe(all.indexOf('e'));
		expect(names().some((name) => name === '__init__')).toBe(true);
		expect(names().every((name) => name.length > 0)).toBe(true);
		expect(names().reduce((joined, name) => `${joined},${name}`)).toBe(all.join(','));
		const seen: string[] = [];
		names().forEach((name) => seen.push(name));
		expect(seen).toEqual(all);
		expect(() =>
			names()
				.filter(() => false)
				.reduce((a, b) => a + b)
		).toThrow(/empty view/);
	});

	it('counts slice and at bounds as an array does: truncated, NaN as zero', () => {
		const all = Array.from(names());
		expect(Array.from(names().slice(0, 2.5))).toEqual(all.slice(0, 2.5));
		expect(Array.from(names().slice(NaN))).toEqual(all.slice(NaN));
		expect(Array.from(names().slice(1.9, -1.5))).toEqual(all.slice(1.9, -1.5));
		expect(Array.from(descendants().ofType(K.FunctionDefinition).slice(0, 2.5)).length).toBe(2);
		expect(names().at(1.5)).toBe(all.at(1.5));
		expect(names().at(NaN)).toBe(all.at(NaN));
	});

	it('slices the declarative prefix before hydrating', () => {
		expect(
			Array.from(descendants().ofType(K.FunctionDefinition).slice(1, 3)).map((fn) => firstLine(SOURCE, fn))
		).toEqual(['def _b():', 'def __init__(self):']);
	});

	it('flatMap spreads an array result and a view runs again on each pass', () => {
		const view = descendants()
			.ofType(K.FunctionDefinition)
			.flatMap((fn) => [fn.$type, fn.$type]);
		expect([...view].length).toBe(10);
		expect([...view]).toEqual([...view]);
	});

	it('includes compares occurrences: the same node read twice, never a built node', () => {
		const fn = root.statements()[0]!;
		const walked = descendants().ofType(K.FunctionDefinition);
		expect(walked.includes(fn as never)).toBe(true);
		expect(walked.find() === fn).toBe(false);
		expect(walked.includes(py.build.parameters() as never)).toBe(false);
	});
});

describe('refusals', () => {
	it('a built node has no $query, and engine.query names the way through $commit()', () => {
		const built = py.build.parameters();
		expect((built as { $query?: unknown }).$query).toBeUndefined();
		expect(() => py.query(built as never)).toThrow(/\$commit\(\)/);
	});

	it('a $with draft has no $query, and engine.query refuses it', () => {
		const fn = descendants().ofType(K.FunctionDefinition).find()!;
		const draft = fn.$with.name(py.build.identifier('z'));
		expect((draft as { $query?: unknown }).$query).toBeUndefined();
		expect(() => py.query(draft as never)).toThrow(/\$commit\(\)/);
	});

	it('a parsed leaf is plain data with no $query; engine.query gives it an empty facet', () => {
		const leaf = descendants().ofType(K.Identifier).find()!;
		expect('$query' in leaf).toBe(false);
		expect(Object.keys(py.query(leaf))).toEqual(['$children', '$descendants']);
		expect(Array.from(py.query(leaf).$descendants)).toEqual([]);
		expect(Array.from(py.query(leaf).$children)).toEqual([]);
	});

	it("a disposed engine's nodes refuse $query", async () => {
		const own = await createEngine(python);
		const parsed = own.parse('x = 1\n');
		own.dispose();
		expect(() => parsed.$query()).toThrow(/engine disposed/);
	});
});
