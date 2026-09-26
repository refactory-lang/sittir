// @ts-nocheck — evaluated with the DSL globals evaluate() installs
import { wire } from '../../dsl/wire/wire.ts';
import { field, rule, variant } from '../../dsl/index.ts';

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
	base,
	wire(
		{
			name: 'patch_sites',
			patches: {
				host: { 0: field('first'), 1: rule('helper', ($) => repeat1($.b)) },
				pick: { '1/0': variant('left'), '1/1': variant('right') }
			}
		},
		base
	)
);
