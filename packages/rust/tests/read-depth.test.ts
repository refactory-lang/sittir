// Read depth: `engine.parse(source)` expands one level and leaves each child
// with substructure as a stub the accessors expand on demand;
// `engine.parse(source, { deep: true })` expands the whole tree up front.
// Nothing was rebuilt under either, so both fold back to the root's
// coordinate and render the source byte for byte.
import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/engine.js';
import { is } from '../src/is.js';

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
	let total = record.$nodeHandle != null && record.$childIndex != null ? 1 : 0;
	for (const [key, child] of Object.entries(record)) {
		if (key.startsWith('_') || key === '$other') total += countStubs(child);
	}
	return total;
}

describe('read depth', () => {
	it('leaves children unexpanded by default', () => {
		const engine = createEngine();
		const { root } = engine.diagnostics.parseAndRead(SOURCE);
		expect(countStubs(root)).toBeGreaterThan(0);
	});

	it('expands every child under { deep: true }', () => {
		const engine = createEngine();
		const { root } = engine.diagnostics.parseAndRead(SOURCE, { deep: true });
		expect(countStubs(root)).toBe(0);
	});

	it('gives a deep-parsed root the same accessor surface as a shallow one', () => {
		const engine = createEngine();
		const shallow = engine.parse(SOURCE).statements();
		const deep = engine.parse(SOURCE, { deep: true }).statements();

		expect(Array.isArray(deep)).toBe(true);
		expect(deep.length).toBe(shallow.length);
		expect(deep.map(kindOf)).toEqual(shallow.map(kindOf));

		// Accessors return wrapped nodes at every level, deep data included.
		const first = deep[0];
		if (first === undefined || typeof first === 'number' || !is.functionItem(first))
			throw new Error('expected a function item');
		expect(typeof (first as unknown as { $render?: unknown }).$render).toBe('function');
		expect(first.body().statements().length).toBe(1);
	});

	it('renders a deep-parsed root byte for byte, like a shallow one', () => {
		const engine = createEngine();
		expect(engine.parse(SOURCE).$render()).toBe(SOURCE);
		expect(engine.parse(SOURCE, { deep: true }).$render()).toBe(SOURCE);
	});

	it('re-parses both renders to the same statement kinds', () => {
		const engine = createEngine();
		const kinds = (text: string) => engine.parse(text).statements().map(kindOf);
		expect(kinds(engine.parse(SOURCE, { deep: true }).$render())).toEqual(kinds(SOURCE));
		expect(kinds(engine.parse(SOURCE).$render())).toEqual(kinds(SOURCE));
	});
});
