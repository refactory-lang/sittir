import { describe, expect, it } from 'vitest';
import { allGrammars } from '@sittir/codegen/grammars';
import { computeUncoveredContentCensus } from '../../src/validate/uncovered-content.ts';

describe('uncovered-content census', () => {
	for (const grammar of allGrammars()) {
		it(`finds nothing in ${grammar}: every byte sits in a visible node`, async () => {
			const census = await computeUncoveredContentCensus(grammar);
			expect(census.rows).toEqual([]);
		}, 120_000);
	}
});
