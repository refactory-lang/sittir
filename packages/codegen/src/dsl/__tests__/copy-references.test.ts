import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluateSittirGrammar } from '../../compiler/__tests__/_sittir-grammar.ts';
import { evaluateTempGrammar } from '../../compiler/__tests__/_temp-grammar.ts';

const RULES = "src: ($) => seq('(', $.word, ')'), owner: ($) => seq('a', $.word), other: ($) => seq('b', $.word)";

describe('a copy reference is bare or aliased by what it copies', () => {
	it('references a part copy of a visible source bare, not aliased to the source', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: RULES }, '', { bindings: "rules: { cp: ($) => seq(copy('src', '0'), 'z') }" });
		expect(raw.rules.cp).toMatchObject({ type: 'SEQ', members: [{ type: 'SYMBOL', name: '_src_0_cp', inline: true }, { type: 'STRING', value: 'z' }] });
	}, 60_000);

	it('aliases a whole copy of a visible non-supertype back to its source', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: RULES }, '', { bindings: 'rules: { cp: ($) => copy(\'src\') }' });
		expect(raw.rules.cp).toMatchObject({ type: 'ALIAS', value: 'src', named: true, content: { type: 'SYMBOL', name: '_src_cp' } });
	}, 60_000);

	it('references a whole copy of a visible base supertype bare, not aliased back to it', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'copy-ref-super-'));
		try {
			const base = join(dir, 'base.js');
			writeFileSync(
				base,
				"module.exports = grammar({ name: 'demo', supertypes: ($) => [$.expr], rules: { source: ($) => repeat($.expr), expr: ($) => choice($.a, $.b), a: () => 'a', b: () => 'b' } });\n"
			);
			const raw = await evaluateSittirGrammar(base, 'demo', '', undefined, { bindings: "rules: { cp: ($) => copy('expr') }" });
			expect(raw.rules.cp).toMatchObject({ type: 'SYMBOL', name: '_expr_cp' });
			expect(JSON.stringify(raw.rules.cp)).not.toContain('"ALIAS"');
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	}, 60_000);
});
