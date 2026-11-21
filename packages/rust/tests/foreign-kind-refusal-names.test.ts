import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

describe.each(['arena', 'object'] as const)('a foreign-kind refusal under verifyStructure runtime, %s storage', (nodeStorage) => {
	it('names the refused kind and the kinds the slot admits', async () => {
		using engine = await createEngine(rust, { nodeStorage, verifyStructure: 'runtime' });
		const build = engine.build as unknown as Record<string, (...items: unknown[]) => unknown>;
		let message = '';
		try {
			build.parametersElements!(build.block!());
		} catch (error) {
			message = (error as Error).message;
		}
		expect(message).toMatch(/not a node of kind \d+ \(block\); the slot admits /);
		expect(/the slot admits (.*)$/.exec(message)![1]!.split(' / ')).toEqual(expect.arrayContaining(['parameter', 'variadic_parameter']));
	});
});
