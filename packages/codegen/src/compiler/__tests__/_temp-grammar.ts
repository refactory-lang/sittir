import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { evaluate } from '../evaluate.ts';
import type { RawGrammar } from '../types.ts';

const DSL = JSON.stringify(resolve(__dirname, '../../dsl/index.ts'));

export async function evaluateTempGrammar(upstream: { extras: string; rules: string }, config: string): Promise<RawGrammar> {
	const dir = mkdtempSync(join(tmpdir(), 'sittir-temp-grammar-'));
	try {
		writeFileSync(
			join(dir, 'base.js'),
			`module.exports = grammar({ name: 'demo', extras: () => [${upstream.extras}], rules: { source: ($) => repeat($.word), word: () => /[a-z]+/, ${upstream.rules} } });\n`
		);
		writeFileSync(
			join(dir, 'grammar.sittir.ts'),
			`import base from './base.js';\nimport { sittirGrammar } from ${DSL};\nexport default sittirGrammar(base, { name: 'demo', ${config} });\n`
		);
		return await evaluate(join(dir, 'grammar.sittir.ts'));
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}
