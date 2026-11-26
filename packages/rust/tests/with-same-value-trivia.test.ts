import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

describe.each(['arena', 'object'] as const)(
	'a same-value $with set keeps the comment inside the rebuilt node, in %s storage',
	(nodeStorage) => {
		it('renders a reference pattern unchanged after setting its pattern to its own value', async () => {
			using rs: any = await createEngine(rust, { nodeStorage });
			const tree = rs.parse('fn f() {\n    let &mut /*c*/ x = y;\n}\n');
			const holder = tree
				.$query()
				.$descendants.find((node: unknown) => typeof node === 'object' && rs.is.referencePattern(node));
			expect(holder).toBeDefined();
			const before = String(holder);
			expect(String(holder.$with.pattern(holder.pattern()))).toBe(before);
		});
	}
);
