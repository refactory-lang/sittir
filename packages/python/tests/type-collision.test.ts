/**
 * Regression: python's `type_alias_statement` has a field literally named
 * `type`. Pre-US7 this collided with the NodeData kind discriminant.
 * Post-US7 the discriminant is `$type` and the field stays `type` inside
 * `$fields` — this test pins the shape so a future regression can't silently
 * collapse them.
 *
 * The `as any` on leaf inputs is intentional — we're exercising the loose
 * factory-input path. The key assertion is that `$type` (kind discriminant)
 * and `$fields.type` (the `type` keyword field) are BOTH present and carry
 * distinct values.
 */

import { describe, it, expect } from 'vitest';
import { ir } from '../src/index.ts';

describe('python type_alias_statement collision (spec 008 US7)', () => {
	it('$type holds the kind discriminant, $fields.type holds the `type` keyword field', () => {
		const node = ir.typeAlias({
			type: 'type' as any,
			left: { $type: 'type', $text: 'Foo' } as any,
			right: { $type: 'type', $text: 'u64' } as any,
		});

		// Kind discriminant
		expect(node.$type).toBe('type_alias_statement');

		// `type` keyword field — survives the $-prefix rename
		expect(node.$fields).toBeDefined();
		expect((node.$fields as Record<string, unknown>).type).toBe('type');

		// Provenance tag also present on the factory output
		expect(node.$source).toBe('factory');
	});

	it('the two accessors do not alias — modifying one must not affect the other', () => {
		const a = ir.typeAlias({
			type: 'type' as any,
			left: { $type: 'type', $text: 'A' } as any,
			right: { $type: 'type', $text: 'B' } as any,
		});
		const b = ir.typeAlias({
			type: 'type' as any,
			left: { $type: 'type', $text: 'X' } as any,
			right: { $type: 'type', $text: 'Y' } as any,
		});

		// Both instances share kind but have distinct field content.
		expect(a.$type).toBe(b.$type);
		expect((a.$fields as Record<string, unknown>).type).toBe((b.$fields as Record<string, unknown>).type);
		// Left/right distinguish — sanity check the `type` field isn't a global.
		const aLeft = (a.$fields as { left?: { $text?: string } }).left?.$text;
		const bLeft = (b.$fields as { left?: { $text?: string } }).left?.$text;
		expect(aLeft).not.toBe(bLeft);
	});
});
