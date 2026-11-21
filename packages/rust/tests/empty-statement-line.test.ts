import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const rebuilt = [
	['after a block-ending expression', 'const { 1 + 3 };\n', 'const { 1 + 3 };\n'],
	['after a statement its own terminator ends', 'let x = 1;;\n', 'let x = 1;;\n'],
	['whatever the arm the list seats after an item', 'fn f() {}\n;\n', 'fn f() {};\n'],
	['after a line comment, which ends its line', 'a(); // c\n;\n', 'a(); // c\n;\n']
] as const;

describe.each(['object', 'arena'] as const)('an empty statement stays on its predecessor’s line (%s storage)', (nodeStorage) => {
	it.each(rebuilt)('%s', async (_, source, expected) => {
		using engine = await createEngine(rust, { nodeStorage });
		const root = engine.parse(source);
		expect(root.$with.statements(...root.statements()).$render()).toBe(expected);
	});
});
