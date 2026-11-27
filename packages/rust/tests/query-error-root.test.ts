import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

type Queried = { $query(): { readonly $descendants: Iterable<object> } };

describe('a query walk started on an ERROR', () => {
	for (const nodeStorage of ['object', 'arena'] as const) {
		it(`${nodeStorage}: yields nothing`, async () => {
			using rs = await createEngine(rust, { nodeStorage });
			for (const source of ['const default', '{\n  (a, ..) => a,\n  B(..) => c,\n  D::E{f: g, ..} => g\n}']) {
				const root = rs.parse(source) as unknown as Queried;
				expect([...root.$query().$descendants], source).toEqual([]);
			}
		});
	}
});
