import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import language from '../src/index.ts';

const engines = {
	record: await sharedEngine(() => createEngine(language)),
	object: await sharedEngine(() => createEngine(language, { nodeStorage: 'object' }))
};

describe.each(Object.entries(engines))('%s construction', (_, { build, kinds }) => {
	const ir = build as unknown as Record<string, (...args: unknown[]) => { $render(): string }>;

	it('a statement slot takes a `;` by its kind id', () => {
		expect(ir.whileStatement!({ condition: 'x', body: kinds.Semi }).$render()).toMatch(/^while\s*\(\s*x\s*\)\s*;$/);
	});

	it('a statement list takes a `;` by its kind id', () => {
		expect(ir.block!(kinds.Semi).$render()).toMatch(/^\{\s*;\s*\}$/);
	});

	it('a statement slot refuses a bare `;`', () => {
		expect(() => ir.whileStatement!({ condition: 'x', body: ';' })).toThrow(/bare string/);
	});

	it('a slot with a number taker keeps the same value as a number', () => {
		expect(ir.ternaryExpression!({ condition: kinds.Semi, consequence: 2, alternative: 3 }).$render()).toBe(`${kinds.Semi} ? 2 : 3`);
	});
});
