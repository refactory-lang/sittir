// Read depth: `engine.parse(source)` reads one level and leaves each child
// below it as a coordinate the accessors read on demand;
// `engine.parse(source, { depth: Infinity })` reads the whole tree up front.
// Nothing was rebuilt under either, so both fold back to the root's
// coordinate and render the source byte for byte.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { isCoordinate, readNode, type TreeHandle } from '@sittir/common/utils';
import type { AnyUntypedNode, TransportCoordinate } from '@sittir/types';
import rust from '../src/index.ts';

const SOURCE = 'pub fn main() { let x = 1; }\nstruct S { a: u8 }\n';

/** A statement's kind: a keyword statement (`;`) is stored as its kind id,
 *  every other statement as a node carrying `$type`. */
const kindOf = (statement: { readonly $type: number } | number): number =>
	typeof statement === 'number' ? statement : statement.$type;

/** The slot values directly under `value`, flattened. */
function slotValues(value: object): unknown[] {
	return Object.entries(value)
		.filter(([key]) => key.startsWith('_'))
		.flatMap(([, child]) => (Array.isArray(child) ? child : [child]));
}

/** Every coordinate in `value`'s slots, at any depth: a child past the read's depth. */
function countCoordinates(value: unknown): number {
	if (Array.isArray(value)) return value.reduce<number>((total, entry) => total + countCoordinates(entry), 0);
	if (value === null || typeof value !== 'object') return 0;
	if (isCoordinate(value)) return 1;
	return countCoordinates(slotValues(value));
}

/** The coordinates directly under `value`'s slots, in slot order. */
const coordinatesOf = (value: object): TransportCoordinate[] => slotValues(value).filter(isCoordinate);

describe('read depth', () => {
	it('leaves children unread by default', async () => {
		const native = (await rust.load()).createNative();
		const { root } = native.parseAndRead(SOURCE);
		expect(countCoordinates(root)).toBeGreaterThan(0);
	});

	it('reads every child under { depth: Infinity }', async () => {
		const native = (await rust.load()).createNative();
		const { root } = native.parseAndRead(SOURCE, { depth: Infinity });
		expect(countCoordinates(root)).toBe(0);
	});

	it('reads a counted number of levels, each child past them a coordinate that reads again', async () => {
		const native = (await rust.load()).createNative();
		const { root, tree } = native.parseAndRead(SOURCE);
		const [item] = coordinatesOf(root);
		const two = readNode(tree as TreeHandle, item!, 2) as AnyUntypedNode;
		expect(item).toMatchObject(two.$_layout!.at!);
		const expanded = slotValues(two).filter((child): child is AnyUntypedNode => typeof child === 'object' && child !== null && !isCoordinate(child) && slotValues(child).length > 0);
		expect(expanded.length).toBeGreaterThan(0);
		const grandchildren = expanded.flatMap(coordinatesOf);
		expect(grandchildren.length).toBeGreaterThan(0);
		for (const coordinate of grandchildren) {
			expect(coordinate).toMatchObject((readNode(tree as TreeHandle, coordinate) as AnyUntypedNode).$_layout!.at!);
		}
	});

	it('reads the root again at the depth asked for, not the depth the parse read it at', async () => {
		const native = (await rust.load()).createNative();
		const { root, tree } = native.parseAndRead(SOURCE);
		const read = (tree as TreeHandle).read!;
		expect(read(0)).toBe(root);
		const deep = read(0, Infinity) as AnyUntypedNode;
		expect(countCoordinates(deep)).toBe(0);
		expect(deep.$_layout?.at).toEqual(root.$_layout?.at);
	});

	it('refuses a depth that is not a whole number of levels', async () => {
		const native = (await rust.load()).createNative();
		const { root, tree } = native.parseAndRead(SOURCE);
		const [item] = coordinatesOf(root);
		expect(() => readNode(tree as TreeHandle, item!, 0)).toThrow(/whole number of levels/);
	});

	it('gives a deep-parsed root the same accessor surface as a shallow one', async () => {
		const engine = await createEngine(rust);
		const shallow = engine.parse(SOURCE).statements();
		const deep = engine.parse(SOURCE, { depth: Infinity }).statements();

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
		expect(engine.parse(SOURCE, { depth: Infinity }).$render()).toBe(SOURCE);
	});

	it('re-parses both renders to the same statement kinds', async () => {
		const engine = await createEngine(rust);
		const kinds = (text: string) => engine.parse(text).statements().map(kindOf);
		expect(kinds(engine.parse(SOURCE, { depth: Infinity }).$render())).toEqual(kinds(SOURCE));
		expect(kinds(engine.parse(SOURCE).$render())).toEqual(kinds(SOURCE));
	});
});

describe('a rebuilt deep-read node', () => {
	/** The first item of `source`, read at the given depth, renamed to `g` and rendered. */
	async function renamed(source: string, deep: boolean): Promise<string> {
		const engine = await createEngine(rust);
		const item = engine.parse(source, { depth: deep ? Infinity : 1 }).statements()[0];
		if (item === undefined || typeof item === 'number' || !engine.is.functionItem(item))
			throw new Error('expected a function item');
		return String(engine.render(item.$with.name(engine.build.identifier('g'))));
	}

	it('keeps the source bytes of its untouched children, as a shallow read does', async () => {
		const source = 'fn  f( a: i32 ) { a; }\n';
		const shallow = await renamed(source, false);
		expect(shallow).toContain('( a: i32 ) { a; }');
		expect(await renamed(source, true)).toBe(shallow);
	});

	it.each([
		['one parameter and one statement', 'fn f(a: i32) { a; }\n'],
		['two parameters', 'fn f(a: i32, b: i32) { a; }\n'],
		['two statements', 'fn f(a: i32) { a; b; }\n']
	])('renders %s like a shallow read', async (_shape, source) => {
		expect(await renamed(source, true)).toBe(await renamed(source, false));
	});

	it('renders a deep child that owns a comment with its content intact (canonical gaps around it until relative coordinates land)', async () => {
		const rendered = await renamed('fn f(a: i32) /* c */ { a; }\n', true);
		expect(rendered.replace(/\s+/g, '')).toBe('fng(a:i32)/*c*/{a;}');
	});
});
