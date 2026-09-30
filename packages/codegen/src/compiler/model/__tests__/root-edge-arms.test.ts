import { describe, expect, it } from 'vitest';
import { compileGrammar } from '../../compile.ts';
import { loadGeneratedIdTables } from '../../generated-metadata.ts';
import { grammarPackage } from '../../../grammars.ts';
import { rootEdgeArms, whitespaceSymbolsOf } from '../whitespace-arms.ts';
import { NEWLINE_MEMBER, TIGHT_MEMBER } from '../../../dsl/whitespace.ts';
import type { NodeMap } from '../../types.ts';

const COMPILE_TIMEOUT = 120_000;

async function nodeMapOf(grammar: string): Promise<NodeMap> {
	return (await compileGrammar({ package: grammarPackage(grammar), generatedIdTables: await loadGeneratedIdTables(grammar) })).nodeMap;
}

function memberOf(nodeMap: NodeMap, arm: string): string | undefined {
	return whitespaceSymbolsOf(nodeMap).get(arm);
}

describe('the grammar root ends in a line break exactly when the grammar declares file types', () => {
	for (const [grammar, after] of [
		['rust', NEWLINE_MEMBER],
		['typescript', NEWLINE_MEMBER],
		['python', NEWLINE_MEMBER],
		['scm', NEWLINE_MEMBER],
		['regex', TIGHT_MEMBER]
	] as const) {
		it(
			`${grammar}: the root starts tight and ends ${after === NEWLINE_MEMBER ? 'in a line break' : 'tight'}`,
			async () => {
				const nodeMap = await nodeMapOf(grammar);
				const edges = rootEdgeArms(nodeMap);
				expect(nodeMap.fileTypes.length > 0).toBe(after === NEWLINE_MEMBER);
				expect(memberOf(nodeMap, edges.before)).toBe(TIGHT_MEMBER);
				expect(memberOf(nodeMap, edges.after)).toBe(after);
			},
			COMPILE_TIMEOUT
		);
	}

	it(
		'a grammar without file types ends tight even when its vocabulary has a line break',
		async () => {
			const nodeMap = await nodeMapOf('rust');
			const edges = rootEdgeArms({ ...nodeMap, fileTypes: [] });
			expect(memberOf(nodeMap, edges.after)).toBe(TIGHT_MEMBER);
		},
		COMPILE_TIMEOUT
	);
});
