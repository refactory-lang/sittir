import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluate } from '../evaluate.ts';
import { collectGrammarDiagnosticsForGrammar } from '../diagnostics/grammar-diagnostics.ts';
import { AssembledPattern, AssembledPunctuation } from '../model/node-map.ts';

describe('the enriched stage sees the whitespace bodies enrich mints', () => {
	it('assembles _tight as a literal kind, as the final evaluation does', async () => {
		const raw = await evaluate(resolve(__dirname, '../../../../regex/grammar.sittir.ts'));
		const enriched = raw.stages!.enriched.grammar;
		const tight = collectGrammarDiagnosticsForGrammar({ rawGrammar: enriched }).nodeMap.nodes.get('_tight');
		expect(tight).toBeInstanceOf(AssembledPunctuation);
		expect(tight).not.toBeInstanceOf(AssembledPattern);
	}, 120_000);
});
