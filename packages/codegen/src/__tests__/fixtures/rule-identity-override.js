import base from './rule-identity-grammar.js';

export default grammar(base, {
	name: 'rule_identity',

	rules: {
		container: ($, previous) =>
			seq(previous, field('override_marker', $.identifier)),

		override_only: ($) => seq('override', $.identifier)
	}
});
