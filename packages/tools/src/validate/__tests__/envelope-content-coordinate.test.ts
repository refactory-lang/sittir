import { afterAll, describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { languageByName } from '../../languages.ts';
import { loadCanonicalKindNameFromId, walkWrappedTree } from '../common.ts';

type Coordinate = { readonly $treeHandle: number; readonly $span: { start: number; end: number }; readonly $type: number };
type Envelope = { readonly $type: number; readonly $_layout?: { readonly at?: Coordinate }; content(): Envelope };
type ReadEngine = {
	parse(source: string, options: { depth: number }): unknown;
	render(node: never): { toString(): string };
	dispose(): void;
};

// Alias envelopes the parser issues one node for: the envelope and its
// content name the same parser node, so both carry its coordinate, which
// stamps the envelope's display id.
const CASES = [
	{ grammar: 'typescript', envelope: 'interface_body', content: 'object_type', source: 'interface I { x(): number }\n' },
	{ grammar: 'python', envelope: 'format_expression', content: 'interpolation', source: 'x = f"{a:{b}}"\n' },
	{ grammar: 'python', envelope: 'names', content: 'import_list', source: 'import r\n' }
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

describe('an alias envelope and its content, read', () => {
	for (const { grammar, envelope, content, source } of CASES) {
		it(`${grammar} ${envelope} → ${content}: share one coordinate, each renders its bytes once`, async () => {
			const engine = await engineFor(grammar);
			const kindName = await loadCanonicalKindNameFromId(grammar);
			if (kindName === undefined) throw new Error(`no kind names for ${grammar}`);
			const root = engine.parse(source, { depth: Infinity });
			const found: Envelope[] = [];
			walkWrappedTree(root, (node) => {
				if (kindName(node.$type) === envelope) found.push(node as unknown as Envelope);
			});
			expect(found).toHaveLength(1);
			const env = found[0]!;
			const inner = env.content();
			const at = env.$_layout?.at;
			expect(at).toBeDefined();
			expect(kindName(inner.$type)).toBe(content);
			expect(inner.$_layout?.at).toEqual(at);
			expect(at!.$type).toBe(env.$type);
			const bytes = source.slice(at!.$span.start, at!.$span.end);
			expect(engine.render(env as never).toString()).toBe(bytes);
			expect(engine.render(inner as never).toString()).toBe(bytes);
		});
	}
});
