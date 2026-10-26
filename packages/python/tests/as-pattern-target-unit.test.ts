import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const targets = ['True', 'False', 'None', '...'];

describe('an as-pattern target whose expression is a unit', () => {
	it.each(['object', 'arena'] as const)('%s: reads and renders the whole tree', async (nodeStorage) => {
		const engine = await createEngine(python, { nodeStorage });
		try {
			for (const target of targets) {
				const source = `with x as ${target}:\n    pass\n`;
				const root = engine.parse(source, { depth: Infinity });
				expect(root.$errors).toEqual([]);
				expect(root.$render()).toBe(source);
			}
		} finally {
			engine.dispose();
		}
	});
});
