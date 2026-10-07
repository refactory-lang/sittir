import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { allGrammars, grammarPackage, REPO_ROOT } from '../../grammars.ts';
import { ruleListParts } from '../../dsl/rule-patterns.ts';
import { compileGrammar } from '../compile.ts';
import { loadGeneratedIdTables } from '../generated-metadata.ts';
import { delimitedLeafVerdicts, type LeafSafety } from '../model/delimited.ts';

const SAFETY_COLUMNS: readonly LeafSafety[] = ['guard-excludes-closer', 'reserved-word', 'regular-token', 'unguarded'];

async function censusOf(grammar: string): Promise<Record<LeafSafety, number>> {
	const { nodeMap } = await compileGrammar({ package: grammarPackage(grammar), generatedIdTables: await loadGeneratedIdTables(grammar) });
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
	it('no grammar has an external text leaf whose guard admits the closer, and the glossary census is the derived one', async () => {
		const glossary = readFileSync(`${REPO_ROOT}/docs/glossary/compiler-model.md`, 'utf8');
		for (const grammar of allGrammars()) {
			const counts = await censusOf(grammar);
			expect(counts.unguarded, `${grammar}: skipped delimited composites with an unguarded external text leaf`).toBe(0);
			const row = `| ${grammar} | ${SAFETY_COLUMNS.map((column) => counts[column]).join(' | ')} |`;
			expect(glossary, `docs/glossary/compiler-model.md census row for ${grammar}`).toContain(row);
		}
	}, 600_000);
});
