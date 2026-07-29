/**
 * PR-K2 (KindId-NodeRefs design §2.1/§3.2): `deriveValuesForRule` stamps
 * parser kind ids as FACTS on minted refs — `storageKindId`/`parseKindId`
 * on node refs, `resolvedKindId`/`parseKindId` on value-bearing literal
 * refs. Ids resolve through the ONE shared chain pair (PR-K1):
 * `findEntryForKindName` for rule names, `findEntryForLiteralText` for
 * literal texts (anon-scoped first — the #129 pin).
 *
 * Absence is typed, not discovered: a target with no catalog entry
 * (enrich markers, IR-only enums, erased hidden supertypes) mints an
 * id-less ref. No consumer reads the stamps yet (that is PR-K3); this
 * suite pins the mint contract only.
 */

import { CHOICE, STRING, SUPERTYPE, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import { deriveValuesForRule, type DeriveCtx } from '../model/node-map.ts';
import type { GeneratedKindEntry } from '../generated-metadata.ts';
import type { Rule } from '../../types/rule.ts';

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
		const rule: Rule = { type: SYMBOL, name: 'block', aliasedFrom: '_simple_statements' };
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
		const rule: Rule = { type: SUPERTYPE, name: '_statement', subtypes: ['identifier', 'block'] };
		const out = deriveValuesForRule(rule, ctx, 'single');
		expect(out.map((v) => v.storageKindId)).toEqual([1, 6]);
		expect(out.map((v) => v.parseKindId)).toEqual([1, 6]);
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
});
