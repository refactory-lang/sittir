import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

type List = Iterable<unknown> & {
	$render(): string;
	items(): readonly { readonly $type: number }[];
	readonly $with: { items(...items: unknown[]): List };
};

const LISTS = [
	['ExportSpecifiers', 'ExportSpecifier', 'export { a, b as c };\n', 'a, b as c'],
	['TypeParametersElements', 'TypeParameter', 'function f<T, U>() {}\n', 'T, U']
] as const;

describe.each(['object', 'arena'] as const)('a list set with what its items hold builds each item, %s storage', (nodeStorage) => {
	it.each(LISTS)('%s', async (kind, item, source, rendered) => {
		using ts = await createEngine(typescript, { nodeStorage });
		const root = ts.parse(source) as unknown as { $query(): { $descendants: { ofType(kind: number): { at(index: number): List | undefined } } } };
		const list = root.$query().$descendants.ofType(ts.kinds[kind]).at(0)!;
		const rebuilt = list.$with.items(...list);
		expect(rebuilt.items().map((entry) => entry.$type)).toEqual([ts.kinds[item], ts.kinds[item]]);
		expect(rebuilt.$render()).toBe(rendered);
	});
});
