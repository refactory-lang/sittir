import { describe, expect, it } from 'vitest';
import { allGrammars, grammarPackage } from '../../../grammars.ts';
import { compileGrammar } from '../../compile.ts';
import { loadGeneratedIdTables } from '../../generated-metadata.ts';
import { continuationTriviaKinds } from '../trivia.ts';

describe('continuationTriviaKinds', () => {
	it.each(allGrammars())('%s: the continuation kinds are the arms of an extras kind whose default arm crosses a line', async (grammar) => {
		const { nodeMap } = await compileGrammar({ package: grammarPackage(grammar), generatedIdTables: await loadGeneratedIdTables(grammar) });
		expect(continuationTriviaKinds(nodeMap).sort()).toEqual(grammar === 'python' ? ['line_continuation_newline', 'line_continuation_nul'] : []);
	}, 120_000);
});
