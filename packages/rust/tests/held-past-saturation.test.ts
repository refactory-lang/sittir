import { createEngine } from '@sittir/common';
import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';

describe('a built record held past its count byte, in arena storage', () => {
	it('outlives every holder but the last, and goes with the last', async () => {
		using engine = await createEngine(rust, { nodeStorage: 'arena' });
		const rs = engine as any;
		const body = rs.build.block({ statements: [] });
		const roots = Array.from({ length: 300 }, (_, n) =>
			rs.build.functionItem({ name: rs.build.identifier(`f${n}`), parameters: rs.build.parameters(), body })
		);
		for (const root of roots.slice(0, -1)) root[Symbol.dispose]();
		expect(String(rs.render(roots.at(-1)))).toBe('fn f299() {}');
		expect(String(rs.render(body))).toBe('{}');
		roots.at(-1)[Symbol.dispose]();
		expect(() => String(rs.render(body))).toThrow(/released/);
	});

	it('renders while the counts past its byte are still in JavaScript', async () => {
		using engine = await createEngine(rust, { nodeStorage: 'arena' });
		const rs = engine as any;
		const body = rs.build.block({ statements: [] });
		const statements = Array.from({ length: 300 }, () => rs.build.expressionStatement.withSemi(body));
		const root = rs.build.sourceFile({ statements });
		expect(String(rs.render(root))).toBe('{};\n'.repeat(300));
		root[Symbol.dispose]();
	});
});
