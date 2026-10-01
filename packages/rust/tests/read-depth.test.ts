// Read depth: `engine.parse(source)` expands one level and leaves each child
// with substructure as a stub the accessors expand on demand;
// `engine.parse(source, { deep: true })` expands the whole tree up front.
// Nothing was rebuilt under either, so both fold back to the root's
// coordinate and render the source byte for byte.
import { describe, expect, it } from 'vitest';
import { createEngine, treeHandleOf } from '@sittir/common';
import type { TreeHandle } from '@sittir/common/utils';
import rust from '../src/index.ts';

const SOURCE = 'pub fn main() { let x = 1; }\nstruct S { a: u8 }\n';

/** A statement's kind: a keyword statement (`;`) is stored as its kind id,
 *  every other statement as a node carrying `$type`. */
const kindOf = (statement: { readonly $type: number } | number): number =>
	typeof statement === 'number' ? statement : statement.$type;

/** Every node in `value` that is still an unexpanded read stub: it carries the
 *  coordinates to read one more level and none of the storage that read would
 *  produce. */
function countStubs(value: unknown): number {
	if (Array.isArray(value)) return value.reduce<number>((total, entry) => total + countStubs(entry), 0);
	if (value === null || typeof value !== 'object') return 0;
	const record = value as Record<string, unknown>;
	let total = record.$parentHandle != null && record.$childIndex != null ? 1 : 0;
	for (const [key, child] of Object.entries(record)) {
		if (key.startsWith('_') || key === '$other') total += countStubs(child);
	}
	return total;
}

type Stub = Record<string, unknown> & { readonly $type: number; readonly $parentHandle: number; readonly $childIndex: number };

/** The unexpanded read stubs directly under `value`'s slots, in slot order. */
function stubsOf(value: Record<string, unknown>): Stub[] {
	const children = Object.entries(value)
		.filter(([key]) => key.startsWith('_'))
		.flatMap(([, child]) => (Array.isArray(child) ? child : [child]));
	return children.filter(
		(child): child is Stub =>
			typeof child === 'object' && child !== null && (child as Stub).$parentHandle != null && countStubs(child) === 1
	);
}

describe('read depth', () => {
	it('leaves children unexpanded by default', async () => {
		const native = (await rust.load()).createNative();
		const { root } = native.parseAndRead(SOURCE);
		expect(countStubs(root)).toBeGreaterThan(0);
	});

	it('expands every child under { deep: true }', async () => {
		const native = (await rust.load()).createNative();
		const { root } = native.parseAndRead(SOURCE, { deep: true });
		expect(countStubs(root)).toBe(0);
	});

	it('reads a counted number of levels, each expanded child keeping its own stubs re-readable', async () => {
		const native = (await rust.load()).createNative();
		const { root, tree } = native.parseAndRead(SOURCE);
		const read = (tree as TreeHandle).read!;
		const [item] = stubsOf(root as unknown as Record<string, unknown>);
		const two = read(item!.$parentHandle, item!.$childIndex, 2) as unknown as Record<string, unknown>;
		const expanded = Object.entries(two)
			.filter(([key]) => key.startsWith('_'))
			.map(([, child]) => child as Record<string, unknown>)
			.filter((child) => Object.keys(child).some((key) => key.startsWith('_')));
		expect(expanded.length).toBeGreaterThan(0);
		for (const child of expanded) expect(treeHandleOf(child)).toBeUndefined();
		const grandchildren = expanded.flatMap(stubsOf);
		expect(grandchildren.length).toBeGreaterThan(0);
		for (const stub of grandchildren) {
			const reread = read(stub.$parentHandle, stub.$childIndex);
			expect([reread.$type, reread.$span]).toEqual([stub.$type, stub.$span]);
		}
	});

	it('refuses a depth that is not a whole number of levels', async () => {
		const native = (await rust.load()).createNative();
		const { root, tree } = native.parseAndRead(SOURCE);
		const read = (tree as TreeHandle).read!;
		const [item] = stubsOf(root as unknown as Record<string, unknown>);
		expect(() => read(item!.$parentHandle, item!.$childIndex, 0)).toThrow(/whole number of levels/);
	});

	it('gives a deep-parsed root the same accessor surface as a shallow one', async () => {
		const engine = await createEngine(rust);
		const shallow = engine.parse(SOURCE).statements();
		const deep = engine.parse(SOURCE, { deep: true }).statements();

		expect(Array.isArray(deep)).toBe(true);
		expect(deep.length).toBe(shallow.length);
		expect(deep.map(kindOf)).toEqual(shallow.map(kindOf));

		// Accessors return wrapped nodes at every level, deep data included.
		const first = deep[0];
		if (first === undefined || typeof first === 'number' || !engine.is.functionItem(first))
			throw new Error('expected a function item');
		expect(typeof (first as unknown as { $render?: unknown }).$render).toBe('function');
		expect(first.body().statements().length).toBe(1);
	});

	it('renders a deep-parsed root byte for byte, like a shallow one', async () => {
		const engine = await createEngine(rust);
		expect(engine.parse(SOURCE).$render()).toBe(SOURCE);
		expect(engine.parse(SOURCE, { deep: true }).$render()).toBe(SOURCE);
	});

	it('re-parses both renders to the same statement kinds', async () => {
		const engine = await createEngine(rust);
		const kinds = (text: string) => engine.parse(text).statements().map(kindOf);
		expect(kinds(engine.parse(SOURCE, { deep: true }).$render())).toEqual(kinds(SOURCE));
		expect(kinds(engine.parse(SOURCE).$render())).toEqual(kinds(SOURCE));
	});
});
