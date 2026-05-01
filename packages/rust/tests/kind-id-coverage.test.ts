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
import { TSKindId, kindIdFromName, kindNameFromId } from '../src/types.ts';

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

	it('resolves anonymous tokens by parser symbol name (PLUS)', () => {
		// `anon_sym_PLUS` → catalog key `PLUS`, id 10
		const id = kindIdFromName('PLUS');
		expect(typeof id).toBe('number');
		expect(id).toBe(TSKindId.PLUS);
	});

	it('resolves anonymous tokens by displayName (+)', () => {
		// Tree-sitter emits the literal text `+` on the wire for `value.$type`.
		// kindIdFromName('+') must resolve to the same id as kindIdFromName('PLUS').
		const idByDisplay = kindIdFromName('+');
		const idByCatalog = kindIdFromName('PLUS');
		expect(idByDisplay).toBe(idByCatalog);
	});

	it('round-trips: kindNameFromId(kindIdFromName(name)) returns canonical name', () => {
		// Canonical name = catalog `kind` (parser symbol name). For anon tokens
		// the round-trip drops the displayName alias — `+` → 10 → `"PLUS"`.
		expect(kindNameFromId(kindIdFromName('empty_statement'))).toBe('empty_statement');
		expect(kindNameFromId(kindIdFromName('PLUS'))).toBe('PLUS');
		expect(kindNameFromId(kindIdFromName('+'))).toBe('PLUS');
	});

	it('throws on genuinely unknown kinds', () => {
		expect(() => kindIdFromName('definitely_not_a_real_kind_xyz')).toThrow(
			/unknown kind name/
		);
	});
});
