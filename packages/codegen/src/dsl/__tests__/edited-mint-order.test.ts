import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';

const rules = "k: ($) => choice(seq('x', $.y), seq('z', $.y)), m: ($) => choice(seq('p', $.y), seq('q', $.y)), y: () => /y/";
const MINTS = "k: { '0': variant('a'), '1': variant('b') }, m: { '0': variant('c'), '1': variant('d') }";

describe('an edited minted kind keeps its deposit position', () => {
	it('keeps the rule order of the unedited mints when an edit names a minted kind', async () => {
		const plain = await evaluateTempGrammar({ extras: '', rules }, '', { bindings: `edits: { ${MINTS} }` });
		const edited = await evaluateTempGrammar({ extras: '', rules }, '', {
			bindings: `edits: { ${MINTS}, m_c: { '1': field('f') } }`
		});
		expect(Object.keys(edited.rules)).toEqual(Object.keys(plain.rules));
		expect(JSON.stringify(edited.rules.m_c)).toContain('"name":"f"');
	}, 60_000);
});
