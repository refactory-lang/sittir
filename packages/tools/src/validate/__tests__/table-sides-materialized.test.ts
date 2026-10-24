import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';

import { languageByName } from '../../languages.ts';
import { loadSlotAccessorOf, tableSides, walkWrappedTree, type ReadNodeLike } from '../common.ts';

async function tableComments(nodeStorage: 'object' | 'arena'): Promise<unknown[]> {
	const engine = await createEngine(await languageByName('python'), { nodeStorage });
	const accessorOf = await loadSlotAccessorOf('python');
	const comments: unknown[] = [];
	walkWrappedTree(engine.parse('a = 1  # c\n'), accessorOf, (node) => {
		const sides = tableSides(node as unknown as ReadNodeLike, accessorOf, (read) => read);
		for (const entries of [sides?.leading, sides?.trailing, sides?.inner]) {
			for (const entry of entries ?? []) {
				if (typeof entry === 'object') comments.push({ $type: entry.$type, _content: (entry as { _content?: unknown })._content });
			}
		}
	});
	engine.dispose();
	return comments;
}

describe("a node's table trivia, built for a lane", () => {
	it('is the comment materialized, its content included, on either wire', async () => {
		const object = await tableComments('object');
		expect(object).toEqual([{ $type: expect.any(Number), _content: ' c' }]);
		expect(await tableComments('arena')).toEqual(object);
	});
});
