import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

type Leaf = { $render(): string; readonly $trivia: { leading(...entries: unknown[]): unknown } };
type Declarator = { value(): { elements(): readonly Leaf[] } };
type Root = {
	$render(): string;
	$query(): { readonly $descendants: { ofType(kind: number): Iterable<Leaf> } };
	statements(): readonly { declarators(): readonly Declarator[] }[];
};

const arrayOf = (count: number): string => `const a = [${Array.from({ length: count }, (_, item) => String(item)).join(', ')}];\n`;

const itemsOf = (root: Root): readonly Leaf[] => root.statements()[0]!.declarators()[0]!.value().elements();

describe('a list slot names its leaf items by their item, 262,144 of them in arena storage', () => {
	for (const nodeStorage of ['object', 'arena'] as const) {
		it(`${nodeStorage}: a 70,000-item array is queried, its last item reached, and a leading side written and read back`, { timeout: 120_000 }, async () => {
			using ts = await createEngine(typescript, { nodeStorage });
			const source = arrayOf(70_000);
			const root = ts.parse(source) as unknown as Root;
			const numbers = [...root.$query().$descendants.ofType(ts.kinds.Number)];
			expect(numbers).toHaveLength(70_000);
			expect(numbers[65_536]!.$render()).toBe('65536');
			const last = itemsOf(root)[69_999]!;
			expect(last.$render()).toBe('69999');
			last.$trivia.leading('/* c */');
			expect((last.$trivia.leading() as readonly { $render(): string }[]).map((entry) => entry.$render())).toEqual(['/* c */']);
			expect(root.$render().endsWith(' 69998, /* c */ 69999];\n')).toBe(true);
		});
	}

	it('arena: a 262,144-item array is read, and its last item reached', { timeout: 120_000 }, async () => {
		using ts = await createEngine(typescript, { nodeStorage: 'arena' });
		const items = itemsOf(ts.parse(arrayOf(262_144)) as unknown as Root);
		expect(items).toHaveLength(262_144);
		expect(items[262_143]!.$render()).toBe('262143');
	});

	it('arena: a 262,145-item array is refused at parse, naming the limit as arena storage’s; object storage reads it', { timeout: 120_000 }, async () => {
		const source = arrayOf(262_145);
		{
			using ts = await createEngine(typescript, { nodeStorage: 'arena' });
			expect(() => ts.parse(source)).toThrow(
				'a list slot holds a leaf at item 262144, past the 262144 leaf items a list slot holds in arena storage, whose node names give an item 18 bits; object storage holds the list'
			);
		}
		using ts = await createEngine(typescript, { nodeStorage: 'object' });
		expect((ts.parse(source) as unknown as Root).$render()).toBe(source);
	});
});
