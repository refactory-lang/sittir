// @ts-nocheck — evaluated with the DSL globals evaluate() installs
import { wire } from '../../dsl/wire/wire.ts';
import { reauthored, vocabulary } from '../../dsl/primitives/rule-cause.ts';

const base = grammar({
	name: 'rule_cause',
	rules: {
		a: ($) => seq($.b, $.c),
		b: (_$) => 'x',
		c: (_$) => 'y'
	}
});

export default grammar(
	base,
	wire(
		{
			rules: {
				a: reauthored('ambiguity', ($) => seq($.b, $._helper)),
				_helper: vocabulary(($) => $.c),
				c: (_$) => 'z'
			}
		},
		base
	)
);
