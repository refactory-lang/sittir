import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../compiler/__tests__/_temp-grammar.ts';

const rules = "k: ($) => seq(field('opening', choice('{', '{|')), field('members', optional($.item)), field('closing', choice('}', '|}'))), item: () => /[a-z]+/";
const FORMS = "{ curly: { 'opening:': '{', 'closing:': '}' }, flow: { 'opening:': '{|', 'closing:': '|}' } }";


describe('refine() as an entry at the rule', () => {
	it('records the forms the inline call records', async () => {
		const inline = await evaluateTempGrammar({ extras: '', rules }, '', {
			bindings: `rules: { k: ($, previous) => refine(previous, ${FORMS}) }`
		});
		const keyed = await evaluateTempGrammar({ extras: '', rules }, '', {
			bindings: `edits: { k: { '.': refine(${FORMS}) } }`
		});
		expect(inline.refineForms?.get('k')?.map((form) => form.name)).toEqual(['curly', 'flow']);
		expect(keyed.refineForms).toEqual(inline.refineForms);
	}, 60_000);

	it('leaves the rule body as the inline call leaves it', async () => {
		const base = await evaluateTempGrammar({ extras: '', rules }, '', { bindings: '' });
		const inline = await evaluateTempGrammar({ extras: '', rules }, '', {
			bindings: `rules: { k: ($, previous) => refine(previous, ${FORMS}) }`
		});
		const keyed = await evaluateTempGrammar({ extras: '', rules }, '', {
			bindings: `edits: { k: { '.': refine(${FORMS}) } }`
		});
		expect(inline.rules.k).toEqual(base.rules.k);
		expect(keyed.rules.k).toEqual(base.rules.k);
	}, 60_000);
});
