import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';

const RULES = "src: ($) => seq('(', $.word, ')'), owner: ($) => seq('a', $.word), other: ($) => seq('b', $.word)";

const inner = { type: 'FIELD', name: 'inner', content: { type: 'SYMBOL', name: 'word' } };

describe('a copy reads its source as the layer leaves it', () => {
	it('gives a copy the body an edit in the same layer adds to its source', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: RULES }, '', {
			bindings: "edits: { src: { '1': field('inner') } }, rules: { cp: ($) => copy('src') }"
		});
		expect(raw.rules._src_cp).toMatchObject({ type: 'SEQ', members: [{ type: 'STRING', value: '(' }, inner, { type: 'STRING', value: ')' }] });
	}, 60_000);

	it('gives the copy the edited body even when the source rule is defined later in the layer', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: RULES }, '', {
			bindings: "edits: { src: { '1': field('inner') } }, rules: { cp: ($) => copy('src'), src: ($) => seq('(', $.word, ')') }"
		});
		expect(raw.rules._src_cp).toMatchObject({ type: 'SEQ', members: [{ type: 'STRING', value: '(' }, inner, { type: 'STRING', value: ')' }] });
	}, 60_000);
});
