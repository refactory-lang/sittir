import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluateSittirGrammar } from '../../__tests__/helpers/sittir-grammar.ts';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';

const RULES = "src: ($) => seq('(', $.word, ')'), owner: ($) => seq('a', $.word)";

const SUPERTYPE_BASE =
	"module.exports = grammar({ name: 'demo', supertypes: ($) => [$._expr], rules: { source: ($) => repeat(choice($._expr, $.list)), list: ($) => seq('[', $._expr, ']'), _expr: ($) => choice($.a, $.b, $.c), a: () => 'a', b: () => 'b', c: () => 'c' } });\n";

async function withSupertypeBase(bindings: string) {
	const dir = mkdtempSync(join(tmpdir(), 'copy-named-'));
	try {
		const base = join(dir, 'base.js');
		writeFileSync(base, SUPERTYPE_BASE);
		return await evaluateSittirGrammar(base, 'demo', '', undefined, { bindings });
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

const symbol = (name: string) => ({ type: 'SYMBOL', name });

const word = { type: 'FIELD', name: 'word', content: symbol('word') };

describe('a copy given a name', () => {
	it('takes that name in place of the one its source and context make', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: RULES }, '', { bindings: "rules: { cp: ($) => seq(copy('src', { name: '_bracketed' }), 'z') }" });
		expect(raw.rules._bracketed).toMatchObject({ type: 'SEQ', members: [{ type: 'STRING', value: '(' }, word, { type: 'STRING', value: ')' }] });
		expect(raw.rules._src_cp).toBeUndefined();
	}, 60_000);

	it('keeps a part path beside the name', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: RULES }, '', { bindings: "rules: { cp: ($) => seq(copy('src', { path: '1', name: '_inner' }), 'z') }" });
		expect(raw.rules._inner).toMatchObject(word);
		expect(raw.rules._src_1_cp).toBeUndefined();
	}, 60_000);

	it('is the rule of the rules: entry it is named for, with no rule between them, and joins its source supertype', async () => {
		const raw = await withSupertypeBase("rules: { _ab: () => copy('_expr', { name: '_ab' }), list: ($) => seq('[', $._ab, ']') }");
		expect(raw.rules._ab).toMatchObject({ type: 'CHOICE', members: [symbol('a'), symbol('b'), symbol('c')] });
		expect(raw.supertypes).toContain('_ab');
		expect(Object.keys(raw.rules).filter((name) => name.includes('_ab') && name !== '_ab')).toEqual([]);
	}, 60_000);

	it('narrows in place as the rule it is, leaving its source whole', async () => {
		const raw = await withSupertypeBase("rules: { _ab: () => edit(copy('_expr', { name: '_ab' }), { '.': narrow.except(match('c')) }), list: ($) => seq('[', $._ab, ']') }");
		expect(raw.rules._ab).toMatchObject({ type: 'CHOICE', members: [symbol('a'), symbol('b')] });
		expect(raw.rules._expr).toMatchObject({ type: 'CHOICE', members: [symbol('a'), symbol('b'), symbol('c')] });
	}, 60_000);
});
