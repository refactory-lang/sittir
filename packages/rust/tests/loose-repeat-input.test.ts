import { describe, expect, expectTypeOf, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';
import type { FunctionModifiers } from '../src/types.ts';

const rs = await createEngine(rust);

describe('loose repeated-envelope inputs', () => {
	it('coerces a single text array per element', () => {
		const node = rs.build.functionModifiers(['async', 'unsafe']);
		expect(node.$render().toString()).toBe('async unsafe');
		expect(node._modifier).toEqual([rs.kinds.AsyncKeyword, rs.kinds.UnsafeKeyword]);
	});

	it('coerces a single enum array per element', () => {
		const node = rs.build.functionModifiers([rs.kinds.AsyncKeyword, rs.kinds.UnsafeKeyword]);
		expect(node.$render().toString()).toBe('async unsafe');
		expect(node._modifier).toEqual([rs.kinds.AsyncKeyword, rs.kinds.UnsafeKeyword]);
	});

	it('accepts a readonly array', () => {
		const values = ['async', 'unsafe'] as const;
		expect(rs.build.functionModifiers(values).$render().toString()).toBe('async unsafe');
	});

	it('rejects an empty array for a non-empty repeat', () => {
		expectTypeOf<[[]]>().not.toMatchTypeOf<FunctionModifiers.LooseArgs>();
		expect(() => Reflect.apply(rs.build.functionModifiers, undefined, [[]])).toThrow('requires at least one element');
	});

	it('keeps config arrays equivalent to spread arguments', () => {
		const spread = rs.build.functionModifiers('async', 'unsafe');
		const config = rs.build.functionModifiers({ modifier: ['async', 'unsafe'] });
		expect(config._modifier).toEqual(spread._modifier);
		expect(config.$render().toString()).toBe(spread.$render().toString());
	});

	it('preserves held-node reconstruction', () => {
		const original = rs.build.functionModifiers('async', 'unsafe');
		const rebuilt = rs.build.functionModifiers(original);
		expect(rebuilt._modifier).toEqual(original._modifier);
		expect(rebuilt.$render().toString()).toBe('async unsafe');
	});
});
