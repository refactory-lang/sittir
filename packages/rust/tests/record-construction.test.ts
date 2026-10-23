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
