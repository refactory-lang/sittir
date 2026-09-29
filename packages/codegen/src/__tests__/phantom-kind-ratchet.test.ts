import { describe, expect, it } from 'vitest';
import { compileGrammar } from '../compiler/compile.ts';
import { loadPackageIdTables } from '../compiler/generated-metadata.ts';
import { AssembledSupertype } from '../compiler/model/node-map.ts';
import type { AssembledNodeMap } from '../compiler/assemble.ts';
import { grammarPackage } from '../grammars.ts';

/**
 * Phantom-kind ratchet — every non-supertype kind in the compiled model
 * should carry a parser-issued kindId stamp. Kinds without one ("phantom
 * kinds") break id-keyed resolution and violate the every-kind-has-a-kindId
 * invariant. Supertypes are excluded: the inlined ones and the sittir-side
 * trivia supertypes have no parser symbol.
 *
 * Each ceiling is a shrink-only upper bound. A count above the ceiling means
 * a change minted NEW parser-invisible kinds; fix the minting site rather
 * than raising the ceiling.
 */
const CEILINGS: Record<string, number> = {
	rust: 0,
	typescript: 0,
	python: 0,
	scm: 0,
	regex: 0
};

const FULL_PIPELINE_TIMEOUT = 180_000;

function phantomKinds(nodeMap: AssembledNodeMap): string[] {
	return [...nodeMap.nodes]
		.filter(([, node]) => !(node instanceof AssembledSupertype) && node.kindId === undefined)
		.map(([kind]) => kind)
		.sort();
}

describe('phantom-kind ratchet', () => {
	for (const [grammar, ceiling] of Object.entries(CEILINGS)) {
		it(
			`${grammar}: non-supertype kinds without a kindId stay at or below ${ceiling}`,
			async () => {
				const pkg = grammarPackage(grammar);
				const { nodeMap } = await compileGrammar({ package: pkg, generatedIdTables: await loadPackageIdTables(pkg) });
				const phantoms = phantomKinds(nodeMap);
				expect(
					phantoms.length,
					`${grammar} phantom kinds (${phantoms.length} > ${ceiling}):\n${phantoms.join('\n')}`
				).toBeLessThanOrEqual(ceiling);
			},
			FULL_PIPELINE_TIMEOUT
		);
	}
});
