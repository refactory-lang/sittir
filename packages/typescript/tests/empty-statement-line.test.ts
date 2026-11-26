import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const rebuilt = [
	['after a declaration ending in a block', 'declare module Foo.Bar { export var foo; };\n', 'declare module Foo.Bar { export var foo; };\n'],
	['after a statement its own terminator ends', 'a();;\n', 'a();;\n'],
	['after a line comment, which ends its line', 'a(); // c\n;\n', 'a(); // c\n;\n']
] as const;

describe.each(['object', 'arena'] as const)('an empty statement stays on its predecessor’s line (%s storage)', (nodeStorage) => {
	it.each(rebuilt)('%s', async (_, source, expected) => {
		using engine = await createEngine(typescript, { nodeStorage });
		const root = engine.parse(source);
		expect(root.$with.statements(...root.statements()).$render()).toBe(expected);
	});
});
