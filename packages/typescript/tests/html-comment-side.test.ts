import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { coordinateOf } from '@sittir/common/utils';
import typescript from '../src/index.ts';

const SOURCE = '<!-- x -->\nlet a = 1;\n';

type Sided = { readonly $trivia: { leading(...entries: unknown[]): unknown }; $query(): { readonly $descendants: Iterable<unknown> } };

/** The node of `root`'s tree whose leading side holds the comment. */
function holderOf(root: unknown): Sided {
	const nodes = [root, ...(root as Sided).$query().$descendants].filter((node): node is Sided => typeof node === 'object' && node !== null);
	const holder = nodes.find((node) => (node.$trivia.leading() as readonly unknown[]).length > 0);
	if (holder === undefined) throw new Error('no node holds the comment in its leading side');
	return holder;
}

describe('an extra no reader reads, held in a side', () => {
	for (const nodeStorage of ['object', 'arena'] as const) {
		it(`${nodeStorage}: is a node of its own kind with its text, and renders as read`, async () => {
			using ts = await createEngine(typescript, { nodeStorage });
			const root = ts.parse(SOURCE);
			const [comment] = holderOf(root).$trivia.leading() as readonly { readonly $type: number; $text(): string }[];
			expect(comment?.$type).toBe(ts.kinds.HtmlComment);
			expect(comment?.$text()).toBe('<!-- x -->');
			expect(ts.render(root).toString()).toBe(SOURCE);
		});
	}

	it('arena: is named by a record of its own', async () => {
		using ts = await createEngine(typescript, { nodeStorage: 'arena' });
		const [comment] = holderOf(ts.parse(SOURCE)).$trivia.leading() as readonly object[];
		expect(Object.keys(coordinateOf(comment!) as object).sort()).toEqual(['$node', '$span', '$type']);
	});

	it('arena: renders the same when its side is written back as read', async () => {
		using ts = await createEngine(typescript, { nodeStorage: 'arena' });
		const root = ts.parse(SOURCE);
		const sided = holderOf(root);
		const again = sided.$trivia.leading(...(sided.$trivia.leading() as readonly unknown[]));
		expect(ts.render(again as never).toString()).toBe(sided === (root as unknown) ? SOURCE : SOURCE.trimEnd());
	});
});
