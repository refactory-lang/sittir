/**
 * Regression coverage for the `kindIdFromName` / `TSKindId` /
 * `AnyTransport::FromNapiValue` superset alignment (Phase B coverage gap).
 *
 * Pre-fix, `kindIdFromName` was sourced from `nodeMap.nodes.keys()` — rule
 * roots only. The Rust napi `AnyTransport` dispatch sourced from a SUPERSET
 * that included children-only kinds (`empty_statement`, `never_type`) and
 * anonymous tokens (`anon_sym_PLUS` keyed as `PLUS`, displayName `"+"`).
 *
 * The mismatch caused `projectTransportValue` to fall through its try/catch
 * fallback for these kinds and emit a string `$type` on the wire. Real napi
 * decoding then crashed because `AnyTransport::FromNapiValue` reads `$type`
 * as `u16`. Mocked tests missed this because they didn't exercise real napi.
 *
 * These tests assert the post-fix invariants:
 *   1. Every parser-symbol-bearing kind resolves through `kindIdFromName`.
 *   2. Both the parser symbol name AND the displayName resolve to the same
 *      numeric id (anon tokens carry both spellings on the wire).
 *   3. The `kindIdFromName` ↔ `kindNameFromId` round-trip is consistent.
 */

import { describe, expect, it } from 'vitest';
import { TSKindId, kindIdFromName, KIND_NAMES } from '../src/types.ts';

describe('kindIdFromName coverage (Phase B)', () => {
	it('resolves children-only named kinds (empty_statement)', () => {
		const id = kindIdFromName('empty_statement');
		expect(typeof id).toBe('number');
		expect(id).toBe(TSKindId.EmptyStatement);
	});

	it('resolves children-only named kinds (never_type)', () => {
		const id = kindIdFromName('never_type');
		expect(typeof id).toBe('number');
		expect(id).toBe(TSKindId.NeverType);
	});

	it('resolves anonymous tokens by parser symbol name (plus)', () => {
		// `anon_sym_PLUS` → catalog key `plus` (lowercased anon-sym names so
		// the catalog stays consistently snake-case across all kinds; the
		// displayName `+` and the parser cSymbol `anon_sym_PLUS` are
		// preserved on the catalog row).
		const id = kindIdFromName('plus');
		expect(typeof id).toBe('number');
		expect(id).toBe(TSKindId.Plus);
	});

	it('resolves anonymous tokens by symbol value / displayName (+)', () => {
		// ADR-0017 / commit 259a43d1: kindIdFromName now resolves symbol values
		// (displayNames like '+', ';', 'is not') in addition to canonical catalog
		// keys. This is CORRECT behavior — the native wire format sends numeric
		// $type IDs, and displayName resolution is needed for round-trip fidelity
		// when tree-sitter surfaces these tokens as children.
		const id = kindIdFromName('+');
		expect(typeof id).toBe('number');
		expect(id).toBe(TSKindId.Plus);
	});

	it('round-trips: KIND_NAMES.get(kindIdFromName(name)) returns canonical name', () => {
		// Canonical name = catalog `kind` (parser symbol name). Anon-sym names
		// are lowercased on the catalog side (`anon_sym_PLUS` → `plus`).
		// Both the canonical key 'plus' and the displayName '+' resolve to the
		// same numeric id, and that id maps back to the canonical name 'plus'.
		expect(KIND_NAMES.get(kindIdFromName('empty_statement'))).toBe('empty_statement');
		expect(KIND_NAMES.get(kindIdFromName('plus'))).toBe('plus');
		expect(KIND_NAMES.get(kindIdFromName('+'))).toBe('plus');
	});

	it('throws on genuinely unknown kinds', () => {
		expect(() => kindIdFromName('definitely_not_a_real_kind_xyz')).toThrow(
			/unknown kind name/
		);
	});
});
