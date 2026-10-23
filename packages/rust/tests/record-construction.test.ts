import { describe, expect, it } from 'vitest';
import { useRecordConstruction } from '@sittir/common/engine';
import { recordOf } from '@sittir/common/utils';
import arena from '../src/arena.ts';
import rust from '../src/index.ts';

const objects = await arena.createEngine();
const records = await arena.createEngine();
useRecordConstruction(records, await import('../src/factories/records.ts'));

type Built = Record<string, unknown> & { readonly $type: number };

function build(engine: typeof objects): Built {
	const b = engine.build;
	return b.functionItem({
		name: b.identifier('process'),
		parameters: b.parameters(b.parameter({ name: b.identifier('input'), type: 'u32' })),
		body: b.block({
			statements: [b.expressionStatement(b.callExpression({ function: b.identifier('run'), arguments: b.arguments(b.identifier('input')) }))]
		})
	}) as unknown as Built;
}

const SKIP = new Set(['$with', '$trivia', '$render', 'toString', '$engine', '$query', '$snapshot', '$text', ...Object.getOwnPropertyNames(Array.prototype)]);

function accessorsOf(node: Built): string[] {
	return Object.keys(node).filter((key) => !key.startsWith('$') && !SKIP.has(key) && typeof node[key] === 'function' && (node[key] as () => unknown).length === 0);
}

function readBack(value: unknown, depth = 0): unknown {
	if (depth > 40) throw new Error('read past depth 40');
	if (Array.isArray(value)) return value.map((item) => readBack(item, depth + 1));
	if (value === null || typeof value !== 'object') return value;
	const node = value as Built;
	if (typeof node.$type !== 'number') return value;
	const text = typeof node.$text === 'function' ? (node.$text as () => unknown)() : undefined;
	return {
		$type: node.$type,
		...(text === undefined ? {} : { $text: text }),
		...Object.fromEntries(accessorsOf(node).sort().map((key) => [key, readBack((node[key] as () => unknown)(), depth + 1)]))
	};
}

describe('record construction', () => {
	it('builds a view of a record, and reads back the tree the object builders build', () => {
		const object = build(objects);
		const record = build(records);
		expect(recordOf(object)).toBeUndefined();
		expect(recordOf(record)).toBeTypeOf('number');
		expect(readBack(record)).toEqual(readBack(object));
	});

	it("returns a child's own node from its parent's record", () => {
		const b = records.build;
		const name = b.identifier('f');
		const body = b.block({ statements: [] });
		const fn = b.functionItem({ name, parameters: b.parameters(), body }) as unknown as Built;
		expect((fn.name as () => unknown)()).toBe(name);
		expect((fn.body as () => unknown)()).toBe(body);
	});

	it.each([
		['objects', objects],
		['records', records]
	])('returns the node a bounded slot was given, under every parent that holds it: %s', (_, engine) => {
		const b = engine.build;
		const args = b.arguments(b.identifier('input'));
		const run = b.callExpression({ function: b.identifier('run'), arguments: args }) as unknown as Built;
		const go = b.callExpression({ function: b.identifier('go'), arguments: args }) as unknown as Built;
		expect((run.arguments as () => unknown)()).toBe(args);
		expect((go.arguments as () => unknown)()).toBe(args);
	});

	it('rebuilds a bounded child through $with as the object builders do', () => {
		const rebuilt = (engine: typeof objects): unknown => {
			const b = engine.build;
			const call = b.callExpression({ function: b.identifier('run'), arguments: b.arguments(b.identifier('input')) }) as unknown as Built;
			const args = (call.arguments as () => Built)();
			return readBack((args.$with as { elements(...items: unknown[]): unknown }).elements(b.identifier('x'), b.identifier('y')));
		};
		expect(rebuilt(records)).toEqual(rebuilt(objects));
	});

	it('rebuilds through $with, sharing the unchanged children', () => {
		const b = records.build;
		const body = b.block({ statements: [] });
		const fn = b.functionItem({ name: b.identifier('f'), parameters: b.parameters(), body }) as unknown as Built;
		const renamed = (fn.$with as { name(value: unknown): Built }).name(b.identifier('g'));
		expect(recordOf(renamed)).not.toBe(recordOf(fn));
		expect(((renamed.name as () => Built)().$text as () => string)()).toBe('g');
		expect((renamed.body as () => unknown)()).toBe(body);
		expect(((fn.name as () => Built)().$text as () => string)()).toBe('f');
	});

	it('holds untouched parsed children by link, returning the parsed nodes', () => {
		const parsed = records.parse('fn f() { g(); }').statements()[0] as unknown as Built;
		const name = (parsed.name as () => unknown)();
		const body = (parsed.body as () => unknown)();
		const fn = records.build.functionItem({ name: name as never, parameters: records.build.parameters(), body: body as never }) as unknown as Built;
		expect(recordOf(fn)).toBeTypeOf('number');
		expect((fn.name as () => unknown)()).toBe(name);
		expect((fn.body as () => unknown)()).toBe(body);
	});

	it('renders a built record natively, as the object builders render the same tree', () => {
		expect(records.render(build(records) as never).toString()).toBe(objects.render(build(objects) as never).toString());
	});

	it('renders a built record holding a parsed child by link, through the parsed tree', () => {
		const withParsedBody = (engine: typeof objects): unknown => {
			const parsed = engine.parse('fn f() {\n    g(); // kept\n}\n').statements()[0] as unknown as Built;
			const b = engine.build;
			return b.functionItem({ name: b.identifier('h'), parameters: b.parameters(), body: (parsed.body as () => unknown)() as never });
		};
		const rendered = records.render(withParsedBody(records) as never).toString();
		expect(rendered).toBe(objects.render(withParsedBody(objects) as never).toString());
		expect(rendered).toContain('g(); // kept');
	});

	it('renders a rebuild with its new child and its unchanged ones', () => {
		const b = records.build;
		const fn = b.functionItem({ name: b.identifier('f'), parameters: b.parameters(), body: b.block({ statements: [] }) }) as unknown as Built;
		const renamed = (fn.$with as { name(value: unknown): Built }).name(b.identifier('g'));
		const o = objects.build;
		const expected = o.functionItem({ name: o.identifier('g'), parameters: o.parameters(), body: o.block({ statements: [] }) });
		expect(records.render(renamed as never).toString()).toBe(objects.render(expected as never).toString());
		expect(records.render(fn as never).toString()).toContain('fn f');
	});

	it('refuses a child of an engine that stores its nodes differently', async () => {
		const plain = await rust.createEngine();
		expect(() => objects.build.expressionStatement(plain.build.identifier('x') as never)).toThrow(/storing nodes as object .* stores them as arena/);
		expect(() => plain.build.expressionStatement(objects.build.identifier('x') as never)).toThrow(/storing nodes as arena .* stores them as object/);
	});

	it('refuses a child another engine built', () => {
		const foreign = objects.build.identifier('x');
		expect(() => records.build.expressionStatement(foreign as never)).toThrow(/its own engine built/);
	});
});
