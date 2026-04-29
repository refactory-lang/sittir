/// A grammar with only hidden rules — for edge case testing.
module.exports = grammar({
	name: 'hidden_only',

	rules: {
		_expr: (_$) => choice('a', 'b'),
		_stmt: (_$) => seq('x', 'y')
	}
});
