import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

type Holed = { elements(): readonly unknown[] };
type Built = Holed & { readonly $type: number };
type Builders = {
	identifier(text: string): Built;
	array(...items: readonly unknown[]): Built;
	arrayPattern(...items: readonly unknown[]): Built;
};

const HOLE = null as never;

const slotsOf = (node: Holed): readonly (number | null)[] => node.elements().map((item) => (item === null ? null : (item as Built).$type));
const firstOf = (tree: unknown, kind: number): Built => [...(tree as { $query(): { $descendants: { ofType(kind: number): Iterable<Built> } } }).$query().$descendants.ofType(kind)][0]!;

describe.each([
	['arena storage', {}],
	['object storage', { nodeStorage: 'object', nodeConstruction: 'object' }]
] as const)('a list whose element admits a hole keeps it as null, in %s', (_storage, storage) => {
	describe.each(['strict', 'default'] as const)('through the %s builder', (api) => {
		const engineOf = async () => createEngine(typescript, { api, ...storage });

		it('builds an array and an array pattern with a null hole, and reads the hole back as null', async () => {
			const engine = await engineOf();
			const b = engine.build as unknown as Builders;
			const x = b.identifier('x');
			const array = b.array(x, HOLE, x);
			expect(String(engine.render(array as never))).toBe('[x,, x]');
			expect(slotsOf(array)).toEqual([x.$type, null, x.$type]);
			const items = firstOf(engine.parse('const [a,,b] = o;'), typescript.kinds.ArrayPattern).elements();
			const pattern = b.arrayPattern(items[0], HOLE, items[2]);
			expect(String(engine.render(pattern as never))).toBe('[a,, b]');
			expect(slotsOf(pattern)[1]).toBeNull();
		});

		it('refuses undefined at a hole, naming the slot', async () => {
			const b = (await engineOf()).build as unknown as Builders;
			const x = b.identifier('x');
			expect(() => b.array(x, undefined, x)).toThrow('Array.elements: a hole is null, never undefined');
			expect(() => b.arrayPattern(x, undefined, x)).toThrow('ArrayPattern.elements: a hole is null, never undefined');
		});

		it('reads a parsed hole as null, writes it as null in JSON, and revives it as null', async () => {
			const engine = await engineOf();
			const b = engine.build as unknown as Builders;
			const x = b.identifier('x');
			for (const node of [firstOf(engine.parse('[x,,x];'), typescript.kinds.Array), b.array(x, HOLE, x)]) {
				expect(slotsOf(node)[1]).toBeNull();
				const json = JSON.stringify(node);
				expect((JSON.parse(json) as { elements: unknown[] }).elements[1]).toBeNull();
				const revived = JSON.parse(json, engine.reviver) as Built;
				expect(slotsOf(revived)[1]).toBeNull();
				expect(String(engine.render(revived as never))).toBe('[x,, x]');
			}
		});
	});
});

describe('a list whose element admits no hole', () => {
	it('refuses an absent item in its type', async () => {
		const b = (await createEngine(typescript)).build;
		// @ts-expect-error a statement block holds no holes
		const refused = () => b.statementBlock(b.emptyStatement(), undefined);
		expect(refused).toBeTypeOf('function');
	});
});
