import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

type Node = Record<string, unknown> & { $type?: number; $render(): string; $snapshot(): unknown; $with: Record<string, (...items: unknown[]) => Node> };

const SOURCES = [
	['a comment', 'fn f() { g(( /* c */ )); }', '( /* c */ )'],
	['a line comment', 'fn f() { g(( // c\n)); }', '( // c\n)'],
	['an ERROR', 'fn f() { g((self: Box<Self>)); }', '(self: Box<Self>)']
] as const;

describe('what lies between the tokens of a unit', () => {
	for (const nodeStorage of ['object', 'arena'] as const) {
		for (const [what, source, unit] of SOURCES) {
			it(`${nodeStorage}: renders only from the source, while its holder is untouched (${what})`, async () => {
				using rs = (await createEngine(rust, { nodeStorage })) as unknown as { build: Record<string, (...args: unknown[]) => Node>; parse(source: string): Node; render(node: unknown): { toString(): string }; kinds: Record<string, number>; [Symbol.dispose](): void };
				const root = rs.parse(source);
				const args = [...(root.$query as () => { $descendants: Iterable<Node> })().$descendants].find((node) => typeof node === 'object' && node !== null && node.$type === rs.kinds.Arguments)!;
				const items = [...(args.elements as () => Iterable<unknown>)()];
				expect(items).toEqual([rs.kinds.UnitExpression]);
				expect(rs.render(root).toString()).toBe(source);
				expect(args.$with.elements!((args.elements as () => unknown)()).$render()).toBe(`(${unit})`);
				expect(args.$with.elements!(...items).$render()).toBe('(())');
				expect(rs.build.arguments!(...items).$render()).toBe('(())');
				expect(rs.render(root.$snapshot()).toString()).toBe('fn f() {\n    g(());\n}');
			});
		}
	}
});
