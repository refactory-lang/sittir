/**
 * SC-012 on typescript — grouped sub-namespace access produces identical
 * output to flat access. Mirrors the rust counterpart.
 */
import { describe, expect, it } from 'vitest';
import typescript from '@sittir/typescript';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

describe('typescript ir grouped sub-namespaces (SC-012)', () => {
	it('flat and grouped access resolve to the same factory bundle', () => {
		expect(ts.build.type.function).toBe(ts.build.functionType);
		expect(ts.build.type.function.strict).toBe(ts.build.functionType.strict);
	});

	it('type group has at least one member', () => {
		const obj = ts.build.type as Record<string, unknown>;
		expect(Object.keys(obj).length).toBeGreaterThan(0);
	});
});
