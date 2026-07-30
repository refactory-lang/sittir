import { describe, expect, it } from 'vitest';

/**
 * Phantom-kind ratchet — every kind name the generated model exposes should
 * have a parser-issued kindId row. Names without one ("phantom kinds") break
 * name-keyed id resolution and violate the every-kind-has-a-kindId
 * invariant.
 *
 * The ceilings are the audited baseline. Migrating a synthesis source
 * pre-generate, fixing anonymous-node naming, or pruning dead kinds lowers a
 * grammar's count — ratchet the ceiling down with it. A count above the
 * ceiling means a change minted NEW parser-invisible kinds; fix the minting
 * site rather than raising the ceiling.
 *
 * Counting imports the generated consts modules directly — no text parsing
 * (regex scans of consts.ts overcount; id rows span lines and OPERATORS
 * quoting differs).
 */
const CEILINGS: Record<string, number> = {
	rust: 54,
	typescript: 70,
	python: 31
};

interface ConstsModule {
	readonly ALL_KINDS: readonly string[];
	readonly KEYWORDS: readonly string[];
	readonly OPERATORS: readonly string[];
	readonly TREE_SITTER_KIND_ID_JSON: readonly { readonly name: string }[];
}

function phantomKinds(consts: ConstsModule): string[] {
	const withIds = new Set(consts.TREE_SITTER_KIND_ID_JSON.map((entry) => entry.name));
	const allNames = new Set([...consts.ALL_KINDS, ...consts.KEYWORDS, ...consts.OPERATORS]);
	return [...allNames].filter((name) => !withIds.has(name)).sort();
}

describe('phantom-kind ratchet', () => {
	for (const [grammar, ceiling] of Object.entries(CEILINGS)) {
		it(`${grammar}: kind names without an id row stay at or below ${ceiling}`, async () => {
			const consts = (await import(`../../../${grammar}/src/consts.ts`)) as ConstsModule;
			const phantoms = phantomKinds(consts);
			expect(
				phantoms.length,
				`${grammar} phantom kinds (${phantoms.length} > ${ceiling}):\n${phantoms.join('\n')}`
			).toBeLessThanOrEqual(ceiling);
		});
	}
});
