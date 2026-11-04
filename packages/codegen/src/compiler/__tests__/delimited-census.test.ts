import { describe, expect, it } from 'vitest';
import { allGrammars, grammarPackage } from '../../grammars.ts';
import { ruleListParts } from '../../dsl/rule-patterns.ts';
import { compileGrammar } from '../compile.ts';
import { delimitedLeafVerdicts, type LeafSafety } from '../model/delimited.ts';

const SAFETY_COLUMNS: readonly LeafSafety[] = ['guard-excludes-closer', 'reserved-word', 'regular-token', 'unguarded'];

const CENSUS: Readonly<Record<string, Record<LeafSafety, number>>> = {
	python: { 'guard-excludes-closer': 2, 'reserved-word': 0, 'regular-token': 0, unguarded: 0 },
	regex: { 'guard-excludes-closer': 16, 'reserved-word': 0, 'regular-token': 0, unguarded: 0 },
	rust: { 'guard-excludes-closer': 25, 'reserved-word': 0, 'regular-token': 1, unguarded: 0 },
	scm: { 'guard-excludes-closer': 7, 'reserved-word': 0, 'regular-token': 1, unguarded: 0 },
	typescript: { 'guard-excludes-closer': 13, 'reserved-word': 0, 'regular-token': 2, unguarded: 0 }
};

async function censusOf(grammar: string): Promise<Record<LeafSafety, number>> {
	const { nodeMap } = await compileGrammar({ package: grammarPackage(grammar) });
	const verdicts = delimitedLeafVerdicts(nodeMap.nodes, nodeMap.wordMatcher, {
		word: nodeMap.word,
		reserved: nodeMap.reserved,
		externals: new Set(ruleListParts(nodeMap.externals ?? []).names)
	});
	const counts = Object.fromEntries(SAFETY_COLUMNS.map((column) => [column, 0])) as Record<LeafSafety, number>;
	for (const verdict of verdicts) counts[verdict.safety]++;
	return counts;
}

describe('delimited composites the stamp skips', () => {
	it('no grammar has an external text leaf whose guard admits the closer, and each grammar holds its census', async () => {
		for (const grammar of allGrammars()) {
			const counts = await censusOf(grammar);
			expect(counts.unguarded, `${grammar}: skipped delimited composites with an unguarded external text leaf`).toBe(0);
			expect(counts, `${grammar}: delimited composites the stamp skips, by why the leaf is safe`).toEqual(CENSUS[grammar]);
		}
	}, 600_000);
});
