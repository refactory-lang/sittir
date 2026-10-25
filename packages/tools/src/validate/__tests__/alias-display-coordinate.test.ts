import { afterAll, describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { languageByName } from '../../languages.ts';
import { loadStorageKindNameFromId, loadSlotAccessorOf, walkWrappedTree } from '../common.ts';

type Coordinate = { readonly $treeHandle: number; readonly $span: { start: number; end: number }; readonly $type: number };
type Display = { readonly $type: number; readonly $_layout?: { readonly at?: Coordinate } };
type ReadEngine = {
	parse(source: string, options: { depth: number }): unknown;
	render(node: never): { toString(): string };
	dispose(): void;
};

// Flat alias displays: the parser issues the display, the read shows its
// storage's slots, and the node's coordinate stamps the display id.
const CASES = [
	{ grammar: 'typescript', display: 'interface_body', source: 'interface I { x(): number }\n' },
	{ grammar: 'python', display: 'format_expression', source: 'x = f"{a:{b}}"\n' },
	{ grammar: 'python', display: 'names', source: 'import r\n' }
] as const;

const engines = new Map<string, ReadEngine>();
const engineFor = async (grammar: string): Promise<ReadEngine> => {
	const known = engines.get(grammar);
	if (known !== undefined) return known;
	const engine: ReadEngine = await createEngine(await languageByName(grammar));
	engines.set(grammar, engine);
	return engine;
};
afterAll(() => {
	for (const engine of engines.values()) engine.dispose();
});

describe('a flat alias display, read', () => {
	for (const { grammar, display, source } of CASES) {
		it(`${grammar} ${display}: its coordinate stamps the display id, and it renders its bytes once`, async () => {
			const engine = await engineFor(grammar);
			const kindName = await loadStorageKindNameFromId(grammar);
			const root = engine.parse(source, { depth: Infinity });
			const found: Display[] = [];
			walkWrappedTree(root, await loadSlotAccessorOf(grammar), (node) => {
				if (kindName(node.$type) === display) found.push(node as unknown as Display);
			});
			expect(found).toHaveLength(1);
			const node = found[0]!;
			const at = node.$_layout?.at;
			expect(at).toBeDefined();
			expect(at!.$type).toBe(node.$type);
			expect(engine.render(node as never).toString()).toBe(source.slice(at!.$span.start, at!.$span.end));
		});
	}
});
