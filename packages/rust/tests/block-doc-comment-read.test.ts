// A block doc comment's marker is a named node the parser issues (`/**`'s
// `*`, `/*!`'s `!`), spelled by the kind's own template: the read skips it as
// layout, so the comment reads whole at any depth and renders its source.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { treeOf } from '@sittir/common/utils';
import { coordinateOf } from '../../common/src/transport-data.ts';
import { readNode } from '../../common/src/read.ts';
import rust from '../src/index.ts';

const rs = await createEngine(rust);

describe('a block doc comment read', () => {
	for (const source of ['/** x */\nfn f() {}\n', '/*! x */\nfn f() {}\n']) {
		it(`reads ${JSON.stringify(source)} whole at every depth and round-trips it`, () => {
			const root = rs.parse(source, { depth: Infinity });
			const [fn] = root.statements();
			if (fn === undefined || typeof fn === 'number') throw new Error('expected an item');
			const comments = fn.$trivia.leading().filter((entry) => typeof entry !== 'number' && entry.$type === rs.kinds.BlockComment);
			expect(comments).toHaveLength(1);
			const at = coordinateOf(comments[0]!);
			const tree = treeOf(comments[0]!);
			if (at === undefined || tree === undefined) throw new Error('expected the comment to name its source');
			expect(readNode(tree, at, Infinity)).toMatchObject({ $type: rs.kinds.BlockComment });
			expect(root.$render()).toBe(source);
		});
	}
});
