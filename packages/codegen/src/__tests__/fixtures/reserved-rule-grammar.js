module.exports = grammar({
	name: 'reserved_rule',
	word: ($) => $.identifier,
	reserved: {
		global: (_$) => ['if'],
		properties: (_$) => []
	},
	rules: {
		source_file: ($) => repeat($.member),
		member: ($) => seq($.identifier, '.', reserved('properties', alias($.identifier, $.property_identifier))),
		identifier: (_$) => /[a-z]+/
	}
});
