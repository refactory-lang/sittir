import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const rebuilt = [
	['a run of two blank lines between statements is kept', 'const   x  =  1;\n\n\nfoo( a,b );\n', 'const   x  =  1;\n\n\nfoo( a,b );\n'],
	['two blank lines above a leading comment are kept above it', 'a();\n\n\n// c\nb();\n', 'a();\n\n\n// c\nb();\n'],
	['a statement the source did not set apart gets no blank line', 'a();\nb();\n', 'a();\nb();\n']
] as const;

describe.each(['object', 'arena'] as const)('a rebuilt list writes the blank lines the source set an item apart with, up to two (%s storage)', (nodeStorage) => {
	it.each(rebuilt)('%s', async (_, source, expected) => {
		using engine = await createEngine(typescript, { nodeStorage });
		const root = engine.parse(source);
		expect(root.$with.statements(...root.statements()).$render()).toBe(expected);
	});
});
