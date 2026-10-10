// A block doc comment's marker is a named node the parser issues (`/**`'s
// `*`, `/*!`'s `!`), spelled by the kind's own template: the read skips it as
// layout, so the comment reads whole at any depth and renders its source.
import { describe, expect, it } from 'vitest';
import type { TransportCoordinate } from '@sittir/types';
import { createEngine } from '@sittir/common';
import { isCoordinate, readNode } from '../../common/src/read.ts';
import rust from '../src/index.ts';

const rs = await createEngine(rust);

/** Every trivia coordinate a read holds, at any depth. */
function triviaOf(value: unknown, out: TransportCoordinate[] = []): TransportCoordinate[] {
	if (Array.isArray(value)) for (const item of value) triviaOf(item, out);
	else if (value !== null && typeof value === 'object') {
		const trivia = (value as { $_layout?: { trivia?: { leading?: unknown[]; trailing?: unknown[] } } }).$_layout?.trivia;
		for (const entry of [...(trivia?.leading ?? []), ...(trivia?.trailing ?? [])]) if (isCoordinate(entry)) out.push(entry);
		for (const [key, child] of Object.entries(value)) if (key.startsWith('_')) triviaOf(child, out);
	}
	return out;
}

describe('a block doc comment read', () => {
	for (const source of ['/** x */\nfn f() {}\n', '/*! x */\nfn f() {}\n']) {
		it(`reads ${JSON.stringify(source)} whole at every depth and round-trips it`, () => {
			const { root, tree } = rs.diagnostics.parseAndRead(source, { depth: Infinity });
			const comments = triviaOf(root).filter((entry) => entry.$type === rs.kinds.BlockComment);
			expect(comments).toHaveLength(1);
			expect(readNode(tree, comments[0]!, Infinity)).toMatchObject({ $type: rs.kinds.BlockComment });
			expect(rs.parse(source, { depth: Infinity }).$render()).toBe(source);
		});
	}
});
