/**
 * `deriveValuesForRule` stamps parser kind ids as FACTS on minted refs —
 * `storageKindId`/`parseKindId` on node refs, `resolvedKindId`/`parseKindId`
 * on value-bearing literal refs. Ids resolve through the ONE shared chain
 * pair: `findEntryForKindName` for rule names, `findEntryForLiteralText`
 * for literal texts (anon-scoped first, so an anonymous token wins over a
 * same-spelled named rule).
 *
 * Absence is typed, not discovered: a target with no catalog entry
 * (enrich markers, IR-only enums, erased hidden supertypes) mints an
 * id-less ref. For a SUPERTYPE rule, each subtype ref may ALREADY carry
 * its own `kindId`/`aliasedFromId` (stamped at link) — those cases read
 * the stamp directly instead of re-deriving via the catalog; the
 * catalog-lookup chain above is the fallback for refs that weren't
 * stamped.
 */

import { CHOICE, PATTERN, STRING, SUPERTYPE, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import { AssembledKeyword, AssembledToken, deriveValuesForRule, type DeriveCtx } from '../model/node-map.ts';
import type { GeneratedKindEntry } from '../generated-metadata.ts';
import type { Rule, StringRule } from '../../types/rule.ts';

const kindEntries: readonly GeneratedKindEntry[] = [
	{ kind: 'identifier', id: 1 },
	// Named rule `type` and its anon keyword twin — the #129 collision pair.
	{ kind: 'type', id: 2 },
	{ kind: 'anon_type', id: 3, symbolName: 'type', anon: true },
	{ kind: 'lt', id: 4, symbolName: '<', anon: true },
	{ kind: '_simple_statements', id: 5 },
	{ kind: 'block', id: 6 }
];
const ctx: DeriveCtx = { kindEntries };

describe('deriveValuesForRule — kind-id stamps at the mint (PR-K2)', () => {
	it('a plain symbol ref stamps storageKindId and parseKindId with the same id', () => {
		const rule: Rule = { type: SYMBOL, name: 'identifier' };
		const [v] = deriveValuesForRule(rule, ctx, 'single');
		expect(v).toMatchObject({ storageKindId: 1, parseKindId: 1 });
	});

	it('an aliased symbol stamps storage (source) and parse (target) ids separately', () => {
		// `_suite`-shaped case: node = hidden source, parseKind = alias target.
		const rule: Rule = { type: SYMBOL, name: '_simple_statements', aliasedTo: 'block' };
		const [v] = deriveValuesForRule(rule, ctx, 'single');
		expect(v).toMatchObject({
			node: { kind: 'unresolved-ref', name: '_simple_statements' },
			storageKindId: 5,
			parseKindId: 6
		});
	});

	it('a ref to a catalog-absent kind mints WITHOUT ids (typed absence)', () => {
		const rule: Rule = { type: SYMBOL, name: '_kw_async_marker' };
		const [v] = deriveValuesForRule(rule, ctx, 'single');
		expect(v?.storageKindId).toBeUndefined();
		expect(v?.parseKindId).toBeUndefined();
	});

	it('a link-operator literal stamps ids through the LITERAL chain', () => {
		const rule: Rule = { type: SYMBOL, name: 'lt', literal: '<' };
		const [v] = deriveValuesForRule(rule, ctx, 'single');
		expect(v).toMatchObject({ value: '<', resolvedKind: 'lt', resolvedKindId: 4, parseKindId: 4 });
	});

	it('a STRING whose text collides with a NAMED rule stamps the ANON twin id (#129 pin)', () => {
		const rule: Rule = { type: STRING, value: 'type' };
		const [v] = deriveValuesForRule(rule, ctx, 'single');
		// resolvedKind is the anon token's kind — and the id is the anon id
		// (3), NOT the named `type` rule's id (2).
		expect(v).toMatchObject({ resolvedKind: 'anon_type', resolvedKindId: 3, parseKindId: 3 });
	});

	it('a STRING with no catalog entry mints an id-less terminal', () => {
		const rule: Rule = { type: STRING, value: '~~nowhere~~' };
		const [v] = deriveValuesForRule(rule, ctx, 'single');
		expect(v?.resolvedKind).toBeUndefined();
		expect(v?.resolvedKindId).toBeUndefined();
		expect(v?.parseKindId).toBeUndefined();
	});

	it('supertype subtype refs each stamp their own id', () => {
		const rule: Rule = {
			type: SUPERTYPE,
			name: '_statement',
			subtypes: [
				{ type: SYMBOL, name: 'identifier' },
				{ type: SYMBOL, name: 'block' }
			]
		};
		const out = deriveValuesForRule(rule, ctx, 'single');
		expect(out.map((v) => v.storageKindId)).toEqual([1, 6]);
		// Catalog-fallback path for parseKindId (node-map.ts's re-derivation
		// chain, distinct from the pre-stamped-ref path the next test covers).
		expect(out.map((v) => v.parseKindId)).toEqual([1, 6]);
	});

	it('supertype subtype refs read their OWN pre-stamped id instead of re-deriving from the catalog', () => {
		const rule: Rule = {
			type: SUPERTYPE,
			name: '_statement',
			subtypes: [
				// Stamped with an id that does NOT match its kindEntries row —
				// if deriveValuesForRule fell back to a catalog lookup by name,
				// 'identifier' would resolve to id 1 (see kindEntries above), not 99.
				{ type: SYMBOL, name: 'identifier', kindId: 99 },
				// Aliased + stamped: kindId is the storage (source) id,
				// aliasedToId is the parse (alias-target) id — same pairing as the
				// aliased-symbol case above, just carried on the ref itself.
				{ type: SYMBOL, name: '_simple_statements', aliasedTo: 'block', kindId: 77, aliasedToId: 42 }
			]
		};
		const out = deriveValuesForRule(rule, ctx, 'single');
		expect(out.map((v) => v.storageKindId)).toEqual([99, 77]);
		expect(out.map((v) => v.parseKindId)).toEqual([99, 42]);
	});

	it('enum-choice members stamp per-member literal-chain ids', () => {
		const rule: Rule = {
			type: CHOICE,
			members: [
				{ type: STRING, value: '<' },
				{ type: STRING, value: 'type' }
			]
		};
		const out = deriveValuesForRule(rule, ctx, 'single');
		expect(out.map((v) => v.resolvedKindId)).toEqual([4, 3]);
	});

	it('without a derive context, refs mint id-less (fixture parity)', () => {
		const rule: Rule = { type: SYMBOL, name: 'identifier' };
		const [v] = deriveValuesForRule(rule, undefined, 'single');
		expect(v?.storageKindId).toBeUndefined();
		expect(v?.parseKindId).toBeUndefined();
	});

	// The tests above construct UNSTAMPED rules for the plain symbol/literal
	// cases, so they only exercise the catalog-fallback path and would still
	// pass if the link-time-stamp fast path were accidentally removed. Each
	// test below stamps a value that DISAGREES with what the catalog would
	// resolve, so only the fast path (not the fallback) can produce the
	// expected id.
	it('a stamped link-operator literal reads ids from the stamp, not the catalog', () => {
		// Catalog resolves '<' to id 4 (see kindEntries) — the stamp disagrees.
		const rule: Rule = { type: SYMBOL, name: 'lt', literal: '<', kindId: 999 };
		const [v] = deriveValuesForRule(rule, ctx, 'single');
		expect(v).toMatchObject({ value: '<', resolvedKind: 'lt', resolvedKindId: 999, parseKindId: 999 });
	});

	it('a stamped plain symbol ref reads ids from the stamp, not the catalog', () => {
		// Catalog resolves 'identifier' to id 1 (see kindEntries) — disagrees.
		const rule: Rule = { type: SYMBOL, name: 'identifier', kindId: 999 };
		const [v] = deriveValuesForRule(rule, ctx, 'single');
		expect(v).toMatchObject({ storageKindId: 999, parseKindId: 999 });
	});

	it('a stamped PATTERN reads the id from the stamp, not the catalog', () => {
		// This text has NO catalog entry at all — if the fast path were
		// removed, resolvedKindId would fall back to undefined, not 4.
		const rule: Rule = { type: PATTERN, value: '~~nowhere~~', resolvedKindId: 4 };
		const [v] = deriveValuesForRule(rule, ctx, 'single');
		expect(v).toMatchObject({ resolvedKind: 'lt', resolvedKindId: 4, parseKindId: 4 });
	});
});

describe('AssembledKeyword / AssembledToken — construction-time id stamp', () => {
	it('AssembledKeyword reads resolvedKindId from the stamp, not the catalog', () => {
		// Catalog resolves 'type' to the ANON twin id 3 (#129 pin, see above) —
		// the stamp deliberately disagrees.
		const rule: StringRule = { type: STRING, value: 'type', resolvedKindId: 999 };
		const node = new AssembledKeyword('type', rule as unknown as StringRule<'link'>, { kindEntries });
		expect(node.resolvedKindId).toBe(999);
		// resolvedKind is looked up BY the stamped id (999 has no catalog row),
		// not re-derived from the text — proving the id, not the text, drives it.
		expect(node.resolvedKind).toBeUndefined();
	});

	it('AssembledToken reads resolvedKindId from the stamp, not the catalog', () => {
		const rule: StringRule = { type: STRING, value: 'type', resolvedKindId: 999 };
		const node = new AssembledToken('type', rule as unknown as StringRule<'link'>, { kindEntries });
		expect(node.resolvedKindId).toBe(999);
		expect(node.resolvedKind).toBeUndefined();
	});
});
