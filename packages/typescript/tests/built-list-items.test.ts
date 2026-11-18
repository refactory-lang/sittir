import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

type Node = Record<string, unknown> & { readonly $type: number; $render(): string };

const CASES = [
	{ list: 'ExportSpecifiers', wrapper: 'ExportSpecifier', build: 'exportSpecifiers', source: 'export { type a, b as c, d };\n' },
	{ list: 'TypeParametersElements', wrapper: 'TypeParameter', build: 'typeParametersElements', source: 'function f<const T extends U = V, W>() {}\n' }
] as const;

const SKIP = new Set(['toString', 'toJSON', 'separator', 'delimiter']);

function find(node: unknown, kind: number): Node | undefined {
	return (node as { $query(): { $descendants: { ofType(kind: number): { at(index: number): Node | undefined } } } }).$query().$descendants.ofType(kind).at(0);
}

const fingerprint = (item: unknown): unknown => (typeof item === 'object' && item !== null ? [(item as Node).$type, (item as Node).$render()] : item);

describe.each(['object', 'arena'] as const)('a built wrapper list in %s storage', (storage) => {
	it.each(CASES)('$list holds the items its parsed form reads', async ({ list, wrapper, build, source }) => {
		const ts = await createEngine(typescript, storage === 'object' ? { nodeStorage: 'object' } : {});
		const kinds = ts.kinds as unknown as Record<string, number>;
		const parsed = find(ts.parse(source, { depth: Infinity }), kinds[list]!);
		expect(parsed).toBeDefined();
		const items = [...(parsed as unknown as Iterable<unknown>)];
		const stored = (parsed!.items as () => readonly unknown[])();
		expect(items.some((item) => (item as Node).$type === kinds[wrapper])).toBe(true);
		expect(items.some((item) => (item as Node).$type !== kinds[wrapper])).toBe(true);
		expect(stored.every((item) => (item as Node).$type === kinds[wrapper])).toBe(true);
		const builder = (ts.build as unknown as Record<string, (...items: unknown[]) => Iterable<unknown>>)[build]!;
		for (const input of [items, stored]) {
			const built = [...builder(...input)];
			expect(built.map(fingerprint)).toEqual(items.map(fingerprint));
			if (storage === 'object') expect(built.every((item, at) => item === items[at])).toBe(true);
		}
	});
});
