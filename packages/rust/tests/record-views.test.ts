import { describe, expect, it } from 'vitest';
import { recordOf } from '@sittir/common/utils';
import { TSKindId } from '../src/kinds.ts';
import rust from '../src/index.ts';
import arena from '../src/arena.ts';

const source = 'struct A { a: u8, pub b: u8, #[x] c: u8 }\n\nfn f(x: u8) -> u8 {\n    g(x, "héllo")\n}\n';

const engines = { object: await rust.createEngine(), arena: await arena.createEngine() };
const wires = ['object', 'arena'] as const;
type Wire = (typeof wires)[number];

function structAt(wire: Wire) {
	const item = engines[wire].parse(source).statements()[0];
	if (item === undefined || !engines[wire].is.structItem(item) || !('body' in item)) throw new Error('expected a braced struct');
	return item;
}

function functionAt(wire: Wire, text = source) {
	const item = engines[wire].parse(text).statements()[1];
	if (item === undefined || !engines[wire].is.functionItem(item)) throw new Error('expected a function');
	return item;
}

type Node = Record<string, unknown> & { readonly $type: number };

function isNode(value: unknown): value is Node {
	return value !== null && typeof value === 'object' && typeof (value as { $type?: unknown }).$type === 'number';
}

function spanOf(node: unknown): unknown {
	return (node as { readonly $_layout: { readonly at: { readonly $span: unknown } } }).$_layout.at.$span;
}

/** Every accessor's value, its kind and its text, read down the whole tree. */
function shape(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(shape);
	if (!isNode(value)) return value;
	const accessors = Object.keys(value)
		.filter((key) => !key.startsWith('$') && !key.startsWith('_') && key !== 'toString' && !(key in Array.prototype))
		.filter((key) => typeof value[key] === 'function' && (value[key] as () => unknown).length === 0)
		.sort();
	const text = typeof value.$text === 'function' ? (value.$text as () => unknown)() : undefined;
	const items = typeof value.length === 'number' ? Array.from({ length: value.length }, (_, n) => shape(value[n])) : undefined;
	return { $type: value.$type, text, items, ...Object.fromEntries(accessors.map((key) => [key, shape((value[key] as () => unknown).call(value))])) };
}

describe('a tree read as records', () => {
	it('reads its root as a view whose coordinate holds the whole source span', () => {
		const root = engines.arena.parse(source);
		expect(recordOf(root)).toBeDefined();
		expect(spanOf(root)).toEqual({ start: 0, end: Buffer.byteLength(source) });
		expect(root.$errors).toEqual([]);
	});

	it('reads a record a child cell names as a view with its own byte span', () => {
		const object = functionAt('object').body().trailingExpression()!;
		const view = functionAt('arena').body().trailingExpression()!;
		expect(recordOf(view)).toBeDefined();
		expect(recordOf(object)).toBeUndefined();
		expect(spanOf(view)).toEqual(spanOf(object));
	});

	it('answers every accessor, kind and text as the object read does', () => {
		expect(shape(engines.arena.parse(source))).toEqual(shape(engines.object.parse(source)));
	});

	it('reads a list wrapper that carries only its content as that content, on both wires', () => {
		for (const wire of wires) {
			const body = structAt(wire).body();
			expect([...(body ?? [])].map((field) => (isNode(field) ? field.$type : field))).toEqual([TSKindId.FieldDeclaration, TSKindId.FieldDeclaration, TSKindId.AttributedFieldDeclaration]);
		}
	});

	it('renders an untouched node as a render root, as the object read does', () => {
		for (const wire of wires) {
			const item = functionAt(wire, 'fn a() {}\n\nfn b() { Ok(None) }\n');
			expect(String(item)).toBe('fn b() { Ok(None) }');
			expect(String(item.body().trailingExpression())).toBe('Ok(None)');
		}
	});

	it("reads a kind that seats a group as a view: each key the group lends is there only while the group is, as on the object read", () => {
		const seats = 'use a::*;\nuse *;\n\nfn f() {\n    match x {\n        y if z => 1,\n        _ => 2,\n    }\n}\n';
		const keysOf = (wire: Wire) => {
			const [withGroup, without] = engines[wire].parse(seats).statements() as unknown as Node[];
			const wildcardOf = (item: Node | undefined) => (item!.argument as () => Node)();
			return [wildcardOf(withGroup), wildcardOf(without)].map((wildcard) => ({ view: recordOf(wildcard) !== undefined, path: typeof wildcard.path, value: shape(wildcard) }));
		};
		const views = keysOf('arena');
		expect(views.map((read) => [read.view, read.path])).toEqual([[true, 'function'], [true, 'undefined']]);
		expect(views.map(({ path, value }) => ({ path, value }))).toEqual(keysOf('object').map(({ path, value }) => ({ path, value })));
		expect(shape(engines.arena.parse(seats))).toEqual(shape(engines.object.parse(seats)));
	});

	it('renders untouched as its source, and writes through its row', () => {
		expect(String(engines.arena.parse(source))).toBe(source);
		const item = functionAt('arena');
		const renamed = item.$with.name(engines.arena.build.identifier('h'));
		expect(recordOf(renamed)).toBeUndefined();
		expect(String(renamed)).toContain('fn h(x: u8)');
		expect(String(item)).toContain('fn f(x: u8)');
	});
});
