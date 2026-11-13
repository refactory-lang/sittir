import { describe, expect, it } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../../__tests__/helpers/timeouts.ts';
import { grammarPackage } from '../../../grammars.ts';
import { compileGrammar } from '../../compile.ts';
import { joinSeamsOf } from '../join-seams/index.ts';

async function kindsJoiningNext(grammar: string): Promise<ReadonlySet<string>> {
	const { nodeMap, evaluated, generatedIdTables } = await compileGrammar({ package: grammarPackage(grammar) });
	if (generatedIdTables.parser === null) throw new Error(`${grammar} has no built parser`);
	return joinSeamsOf(nodeMap, evaluated.rules, generatedIdTables.parser).joinsNextKinds;
}

describe('the kinds whose last token can join what is written after them', () => {
	it(
		'python: a string, its content, an escaped brace and an interpolation end in tokens that join nothing, and the brace opening an interpolation joins',
		async () => {
			const kinds = await kindsJoiningNext('python');
			for (const kind of ['string', 'string_content', 'escape_interpolation', 'interpolation'])
				expect(kinds.has(kind), kind).toBe(false);
			expect(kinds.has('{')).toBe(true);
		},
		FULL_PIPELINE_TIMEOUT
	);

	it(
		'rust: a range pattern open on the right ends in a `..` that joins a following `=`',
		async () => {
			const kinds = await kindsJoiningNext('rust');
			for (const kind of ['range_pattern_with_left_bare', 'range_pattern_with_left', '..'])
				expect(kinds.has(kind), kind).toBe(true);
		},
		FULL_PIPELINE_TIMEOUT
	);
});
