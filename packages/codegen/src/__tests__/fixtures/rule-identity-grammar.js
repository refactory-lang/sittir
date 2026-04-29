export default grammar({
	name: 'rule_identity',

	rules: {
		source_file: ($) => repeat($.container),

		container: ($) =>
			seq(
				field('name', $.identifier),
				choice($.identifier, $.identifier),
				field('value', alias($.identifier, $.named_identifier)),
				alias('literal', 'literal_alias'),
				token(/[a-z]+/),
				repeat1(seq(',', $.identifier))
			),

		identifier: (_$) => /[a-z_]\w*/
	}
});
