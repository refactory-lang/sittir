export default grammar({
	name: 'chain',
	word: ($) => $.identifier,
	extras: () => [/\s/],
	rules: {
		program: ($) => repeat($._statement),
		_statement: ($) => choice($.let_statement, $.expression_statement),
		let_statement: ($) => seq('let', $.identifier, '=', $._expression, ';'),
		expression_statement: ($) => seq($._expression, ';'),
		_expression: ($) => choice($.identifier, $.number, $.call_expression, $.binary_expression),
		call_expression: ($) => seq($.identifier, '(', optional(seq($._expression, repeat(seq(',', $._expression)))), ')'),
		binary_expression: ($) => prec.left(seq($._expression, choice('+', '-'), $._expression)),
		identifier: () => /[a-z]+/,
		number: () => /\d+/
	}
});
