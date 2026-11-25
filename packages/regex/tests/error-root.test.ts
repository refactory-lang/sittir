// A source the parser cannot read at all parses to an ERROR root: the read
// gives it its text, and it renders as the source, untouched and as a
// snapshot, in either storage.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { isErrorNode } from '@sittir/common/utils';
import regex from '../src/index.ts';

type Snapshotted = { $snapshot(): unknown };

describe('an ERROR root', () => {
	for (const nodeStorage of ['object', 'arena'] as const) {
		it(`${nodeStorage}: reads as an ERROR node holding the whole source, and renders as it`, async () => {
			using re = await createEngine(regex, { nodeStorage });
			for (const source of [')', '*', '+', '?']) {
				const root = re.parse(source);
				expect(isErrorNode(root), source).toBe(true);
				expect((root as unknown as { $text(): string }).$text()).toBe(source);
				expect(re.render(root as never).toString()).toBe(source);
				expect(re.render((root as unknown as Snapshotted).$snapshot() as never).toString()).toBe(source);
			}
		});
	}
});
