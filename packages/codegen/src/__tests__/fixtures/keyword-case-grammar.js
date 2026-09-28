/// Two keywords that differ only by case, as C's `_alignof` and `_Alignof`.
module.exports = grammar({
	name: 'keyword_case',
	word: ($) => $.identifier,
	rules: {
		source_file: ($) => repeat(choice($.lower, $.upper)),
		lower: ($) => seq('_alignof', $.identifier),
		upper: ($) => seq('_Alignof', $.identifier),
		identifier: (_) => /[_a-zA-Z]+/
	}
});
