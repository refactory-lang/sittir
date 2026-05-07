/**
 * SC-012 on typescript — grouped sub-namespace access produces identical
 * output to flat access. Mirrors the rust counterpart.
 */
import { describe, expect, it } from 'vitest';
import { ir, type as typeGroup } from '@sittir/typescript';

describe('typescript ir grouped sub-namespaces (SC-012)', () => {
	it('flat and grouped access resolve to the same factory bundle', () => {
		// Reserved words are valid property keys — no suffix needed.
		expect(ir.type.function).toBe(typeGroup.function);
		expect(ir.type.function.from).toBe(typeGroup.function.from);
	});

	it('grouped namespace attached to ir is the same object as standalone export', () => {
		expect(ir.type).toBe(typeGroup);
	});

	it('type group has at least one member', () => {
		const obj = ir.type as Record<string, unknown>;
		expect(Object.keys(obj).length).toBeGreaterThan(0);
	});
});
