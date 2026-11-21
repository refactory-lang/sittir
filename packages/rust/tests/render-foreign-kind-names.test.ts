import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

describe.each(['arena', 'object'] as const)('a render of a child the slot does not admit, default engine, %s storage', (nodeStorage) => {
	it('names the kind id and the slot it was refused in', async () => {
		using engine = await createEngine(rust, { nodeStorage });
		const build = engine.build as unknown as Record<string, (...items: unknown[]) => { $render(): unknown }>;
		const built = build.parametersElements!(build.block!());
		const blockId = engine.kinds.Block;
		expect(() => String(built.$render())).toThrow(new RegExp(`unknown kind id ${blockId} \\(block\\) in AttributedParameterContentNodeSlot`));
	});
});
