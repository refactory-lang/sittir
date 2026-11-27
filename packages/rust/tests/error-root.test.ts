import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { isErrorNode } from '@sittir/common/utils';
import rust from '../src/index.ts';

type Snapshotted = { $snapshot(): unknown };

describe('an ERROR root', () => {
	for (const nodeStorage of ['object', 'arena'] as const) {
		it(`${nodeStorage}: renders as its source, untouched and as a snapshot`, async () => {
			using rs = await createEngine(rust, { nodeStorage });
			for (const source of ['const default', '{\n  (a, ..) => a,\n  B(..) => c,\n  D::E{f: g, ..} => g\n}']) {
				const root = rs.parse(source);
				expect(isErrorNode(root), source).toBe(true);
				expect(rs.render(root as never).toString(), source).toBe(source);
				expect(rs.render((root as unknown as Snapshotted).$snapshot() as never).toString(), source).toBe(source);
			}
		});
	}
});
