import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluate } from '../evaluate.ts';
import { collectGrammarDiagnosticsForGrammar } from '../diagnostics/grammar-diagnostics.ts';
import { AssembledPattern, AssembledPunctuation } from '../model/node-map.ts';
import { NO_FILE_TYPES } from '../upstream-file-types.ts';

describe('the enriched stage sees the whitespace bodies enrich mints', () => {
	it('assembles _tight as a literal kind, as the final evaluation does', async () => {
		const raw = await evaluate(resolve(__dirname, '../../../../regex/grammar.sittir.ts'), NO_FILE_TYPES);
		const enriched = raw.stages!.enriched.grammar;
		const tight = collectGrammarDiagnosticsForGrammar({ rawGrammar: enriched }).nodeMap.nodes.get('_tight');
		expect(tight).toBeInstanceOf(AssembledPunctuation);
		expect(tight).not.toBeInstanceOf(AssembledPattern);
	}, 120_000);

	it('leaves out depth members that collide with upstream externals, so python has no _indent/_dedent members', async () => {
		const raw = await evaluate(resolve(__dirname, '../../../../python/grammar.sittir.ts'), NO_FILE_TYPES);
		const members = JSON.stringify(raw.stages!.enriched.grammar.rules['_whitespace']);
		expect(members).toContain('"_tight"');
		expect(members).not.toContain('"_indent"');
		expect(members).not.toContain('"_dedent"');
	}, 120_000);
});
