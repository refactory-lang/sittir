// @ts-nocheck — evaluated with the DSL globals evaluate() installs
import { enrich, field, rule, variant, wire } from '../../dsl/dsl-authoring.ts';

const base = grammar({
	name: 'patch_sites',
	rules: {
		source: ($) => seq($.host, $.pick),
		host: ($) => seq($.a, $.b),
		pick: ($) => seq('(', choice($.a, $.b)),
		a: (_$) => 'a',
		b: (_$) => 'b'
	}
});

export default grammar(
	enrich(base),
	wire({
		edits: {
			host: { 0: field('first'), 1: rule('helper', ($) => repeat1($.b)) },
			pick: { '1/0': variant('left'), '1/1': variant('right') }
		}
	})
);
