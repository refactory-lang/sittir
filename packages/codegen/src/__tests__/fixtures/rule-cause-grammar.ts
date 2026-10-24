// @ts-nocheck — evaluated with the DSL globals evaluate() installs
import { enrich, reauthored, vocabulary, wire } from '../../dsl/dsl-authoring.ts';

const base = grammar({
	name: 'rule_cause',
	rules: {
		a: ($) => seq($.b, $.c),
		b: (_$) => 'x',
		c: (_$) => 'y'
	}
});

export default grammar(
	enrich(base),
	wire({
		rules: {
			a: reauthored('ambiguity', ($) => seq($.b, $._helper)),
			_helper: vocabulary(($) => $.c),
			c: (_$) => 'z'
		}
	})
);
