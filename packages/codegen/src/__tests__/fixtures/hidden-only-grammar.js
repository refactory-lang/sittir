/// A grammar with only hidden rules — for edge case testing.
module.exports = grammar({
    name: 'hidden_only',

    rules: {
        _expr: $ => choice('a', 'b'),
        _stmt: $ => seq('x', 'y'),
    },
})
