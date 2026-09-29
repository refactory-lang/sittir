import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);
const rsNative = (await rust.load()).createNative();

function readModifiers(text: string): number[] {
	const { root } = rsNative.parseAndRead(`${text} fn f() {}`, { deep: true });
	const modifiers = (root as unknown as { _statements: { _function_modifiers: { _modifier: unknown } } })._statements
		._function_modifiers._modifier;
	return [modifiers].flat().map((modifier) => (modifier as { $type: number }).$type);
}

describe('keyword extraction at an array slot', () => {
	it('loose keyword text builds the keyword arm per element and equals the read', () => {
		const built = rs.build.functionModifiers('async');
		expect([built._modifier].flat()).toEqual([rs.kinds.AsyncKeyword]);
		expect(readModifiers(built.$render().toString())).toEqual([rs.kinds.AsyncKeyword]);
	});

	it('renders repeated modifiers on one line and reparses them', () => {
		const built = rs.build.functionModifiers('async', 'unsafe');
		const text = built.$render().toString();
		expect(text).toBe('async unsafe');
		expect(readModifiers(text)).toEqual([rs.kinds.AsyncKeyword, rs.kinds.UnsafeKeyword]);
	});
});
