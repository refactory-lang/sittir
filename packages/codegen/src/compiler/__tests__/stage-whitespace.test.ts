import { describe, expect, it } from 'vitest';
import { collectGrammarDiagnosticsForGrammar } from '../diagnostics/grammar-diagnostics.ts';
import { AssembledPattern, AssembledPunctuation } from '../model/node-map.ts';
import { evaluatePackage } from '../evaluate-package.ts';
import { grammarPackage } from '../../grammars.ts';

describe('the enriched stage sees the whitespace bodies enrich mints', () => {
	it('assembles _tight as a literal kind, as the final evaluation does', async () => {
		const raw = await evaluatePackage(grammarPackage('regex'));
		const enriched = raw.stages!.enriched.grammar;
		const tight = collectGrammarDiagnosticsForGrammar({ rawGrammar: enriched }).nodeMap.nodes.get('_tight');
		expect(tight).toBeInstanceOf(AssembledPunctuation);
		expect(tight).not.toBeInstanceOf(AssembledPattern);
	}, 120_000);

	it('leaves out depth members that collide with upstream externals, so python has no _indent/_dedent members', async () => {
		const raw = await evaluatePackage(grammarPackage('python'));
		const members = JSON.stringify(raw.stages!.enriched.grammar.rules['_layout']);
		expect(members).toContain('"_tight"');
		expect(members).not.toContain('"_indent"');
		expect(members).not.toContain('"_dedent"');
	}, 120_000);
});
