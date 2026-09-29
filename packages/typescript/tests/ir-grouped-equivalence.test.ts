/**
 * SC-012 on typescript — grouped sub-namespace access produces identical
 * output to flat access. Mirrors the rust counterpart.
 */
import { describe, expect, it } from 'vitest';
import { type as typeGroup } from '@sittir/typescript';
import typescript from '@sittir/typescript';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

describe('typescript ir grouped sub-namespaces (SC-012)', () => {
	it('flat and grouped access resolve to the same factory bundle', () => {
		// Reserved words are valid property keys — no suffix needed.
		expect(ts.build.type.function).toBe(typeGroup.function);
		expect(ts.build.type.function.strict).toBe(typeGroup.function.strict);
	});

	it('grouped namespace attached to ir is the same object as standalone export', () => {
		expect(ts.build.type).toBe(typeGroup);
	});

	it('type group has at least one member', () => {
		const obj = ts.build.type as Record<string, unknown>;
		expect(Object.keys(obj).length).toBeGreaterThan(0);
	});
});
