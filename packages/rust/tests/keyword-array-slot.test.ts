import { describe, expect, it } from 'vitest';
import { createEngine, ir, TSKindId } from '../src/index.ts';

function readModifiers(text: string): number[] {
	const { root } = createEngine().diagnostics.parseAndRead(`${text} fn f() {}`, { deep: true });
	const modifiers = (root as unknown as { _statements: { _function_modifiers: { _modifier: unknown } } })._statements
		._function_modifiers._modifier;
	return [modifiers].flat().map((modifier) => (modifier as { $type: number }).$type);
}

describe('keyword extraction at an array slot', () => {
	it('loose keyword text builds the keyword arm per element and equals the read', () => {
		const built = ir.functionModifiers('async');
		expect([built._modifier].flat()).toEqual([TSKindId.AsyncKeyword]);
		expect(readModifiers(built.$render().toString())).toEqual([TSKindId.AsyncKeyword]);
	});
});
