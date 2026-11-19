import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

describe.each(['arena', 'object'] as const)('a hoisted slot under runtime verification, %s storage', (nodeStorage) => {
	it('takes back the items it reads, including the content of an attributed item', async () => {
		using rs = await createEngine(rust, { nodeStorage, verifyStructure: 'runtime' });
		const fn = rs.parse('fn f(a: u8) {}\n').statements()[0] as unknown as {
			parameters(): readonly unknown[];
			readonly $with: Record<string, (...values: unknown[]) => { $render(): unknown }>;
		};
		expect(String(fn.$with.parameters!(...fn.parameters()).$render())).toBe('fn f(a: u8) {}');
	});

	it('holds a presence guard on the wrapper a hoisted accessor reads through', async () => {
		using rs = await createEngine(rust, { nodeStorage });
		const fn = rs.parse('pub(crate) fn f() {}\n').statements()[0] as unknown as { visibilityModifier(): never };
		const modifier = fn.visibilityModifier();
		const guards = rs.is.visibilityModifier as unknown as { pub: { scope: { (v: never): boolean; crate(v: never): boolean } } };
		expect(guards.pub.scope(modifier)).toBe(true);
		expect(guards.pub.scope.crate(modifier)).toBe(true);
	});
});
