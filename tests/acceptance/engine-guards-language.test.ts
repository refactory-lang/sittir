import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { is as rustIs } from '../../packages/rust/src/is.ts';
import rust from '@sittir/rust';
import typescript from '@sittir/typescript';

describe('the kind guards of an engine, across languages', () => {
	it('reject a node of another grammar whose kind id the guard would accept', async () => {
		const rs = await createEngine(rust);
		const ts = await createEngine(typescript);
		const foreign = ts.parse('let a = 1;\n').statements()[0] as unknown as { readonly $type: number };
		expect(rustIs.kind(foreign, foreign.$type)).toBe(true);
		expect(rs.is.kind(foreign as never, foreign.$type)).toBe(false);
		expect(ts.is.kind(foreign as never, foreign.$type)).toBe(true);
	});

	it('accept the nodes of the language, parsed or built, after the engine is disposed', async () => {
		const rs = await createEngine(rust);
		const parsed = rs.parse('fn main() {}\n').statements()[0]!;
		const built = rs.build.identifier('x');
		expect(rs.is.functionItem(parsed)).toBe(true);
		expect(rs.is.kind(built, built.$type)).toBe(true);
		rs.dispose();
		expect(rs.is.functionItem(parsed)).toBe(true);
		expect(rs.is.kind(built, built.$type)).toBe(true);
	});
});
