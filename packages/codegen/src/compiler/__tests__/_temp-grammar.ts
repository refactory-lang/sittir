import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { evaluateSittirGrammar } from './_sittir-grammar.ts';
import type { RawGrammar } from '../types.ts';

export async function evaluateTempGrammar(upstream: { extras: string; rules: string }, config: string): Promise<RawGrammar> {
	const dir = mkdtempSync(join(tmpdir(), 'sittir-temp-grammar-'));
	try {
		const base = join(dir, 'base.js');
		writeFileSync(
			base,
			`module.exports = grammar({ name: 'demo', extras: () => [${upstream.extras}], rules: { source: ($) => repeat($.word), word: () => /[a-z]+/, ${upstream.rules} } });\n`
		);
		return await evaluateSittirGrammar(base, 'demo', config);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}
