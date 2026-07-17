/**
 * Regression: python's `type_alias_statement` has a field literally named
 * `type`. Pre-US7 this collided with the NodeData kind discriminant.
 * Post-US7 the discriminant is `$type` and the field is stored under `_type`
 * (ADR-0018 de-hoisted storage) — this test pins the shape so a future
 * regression can't silently collapse them.
 *
 * Post ADR-0010: `type` is an auto-stamp field (always the literal "type"),
 * so it is omitted from Config and stamped directly by the factory via `_type`.
 * Post ADR-0018: fields are stored directly as `_<name>` keys on the node
 * (de-hoisted), not under `$fields`. The accessor is `type()` — valid as
 * an object literal method name.
 */

import { describe, it, expect } from 'vitest';
import { ir, TSKindId } from '../src/index.ts';

describe('python type_alias_statement collision (spec 008 US7)', () => {
	it('$type holds the kind discriminant, _type holds the `type` keyword field (ADR-0018)', () => {
		const node = ir.typeAlias({
			left: { $type: TSKindId.Type, $text: 'Foo', $source: 2 } as any,
			right: { $type: TSKindId.Type, $text: 'u64', $source: 2 } as any
		});

		// Kind discriminant — numeric TSKindId post Phase A KindID migration
		expect(node.$type).toBe(TSKindId.TypeAliasStatement);

		// `type` keyword field — auto-stamped by the factory (ADR-0010). Post
		// the AutoStamp<KindEnum<...>> branding fix, this is the numeric
		// kindEnum discriminant for the single-candidate 'type' keyword, not
		// the literal string — ADR-0018: stored under `_type`, not `$fields.type`.
		expect((node as unknown as Record<string, unknown>)['_type']).toBe(TSKindId.Type);

		// The de-hoisted storage key differs from the kind discriminant
		expect(node.$type).not.toBe(TSKindId.Type);

		// Provenance tag also present on the factory output
		expect(node.$source).toBe(2);
	});

	it('the two instances have distinct _left/_right content, shared _type stamp', () => {
		const a = ir.typeAlias({
			left: { $type: TSKindId.Type, $text: 'A', $source: 2 } as any,
			right: { $type: TSKindId.Type, $text: 'B', $source: 2 } as any
		});
		const b = ir.typeAlias({
			left: { $type: TSKindId.Type, $text: 'X', $source: 2 } as any,
			right: { $type: TSKindId.Type, $text: 'Y', $source: 2 } as any
		});

		// Both instances share kind and the auto-stamp `type` literal
		expect(a.$type).toBe(b.$type);
		expect((a as unknown as Record<string, unknown>)['_type']).toBe((b as unknown as Record<string, unknown>)['_type']);
		// Left/right distinguish — sanity check the `_type` field isn't a global.
		const aLeft = ((a as unknown as Record<string, unknown>)['_left'] as { $text?: string })?.$text;
		const bLeft = ((b as unknown as Record<string, unknown>)['_left'] as { $text?: string })?.$text;
		expect(aLeft).not.toBe(bLeft);
	});
});
