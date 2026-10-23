import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { evaluateSittirGrammar, type FixtureLayers } from './sittir-grammar.ts';
import type { RawGrammar } from '../../compiler/types.ts';
import type { ProjectedGrammar } from '../../dsl/verbs/effects.ts';

export async function evaluateTempGrammar(upstream: { extras: string; rules: string }, config: string, layers: FixtureLayers = {}): Promise<ProjectedGrammar<RawGrammar>> {
	const dir = mkdtempSync(join(tmpdir(), 'sittir-temp-grammar-'));
	try {
		const base = join(dir, 'base.js');
		writeFileSync(
			base,
			`module.exports = grammar({ name: 'demo', extras: ($) => [${upstream.extras}], rules: { source: ($) => repeat($.word), word: () => /[a-z]+/, ${upstream.rules} } });\n`
		);
		return await evaluateSittirGrammar(base, 'demo', config, undefined, layers);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}
