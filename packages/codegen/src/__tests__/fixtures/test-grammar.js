/// A minimal grammar for testing the Evaluate phase.
module.exports = grammar({
    name: 'test',

    rules: {
        source_file: $ => repeat($.statement),

        statement: $ => choice(
            $.assignment,
            $.expression_statement,
        ),

        assignment: $ => seq(
            field('name', $.identifier),
            '=',
            field('value', $._expression),
            ';',
        ),

        expression_statement: $ => seq(
            $._expression,
            ';',
        ),

        _expression: $ => choice(
            $.identifier,
            $.number,
            $.binary_expression,
        ),

        binary_expression: $ => prec.left(1, seq(
            field('left', $._expression),
            field('operator', choice('+', '-', '*', '/')),
            field('right', $._expression),
        )),

        identifier: $ => /[a-z_]\w*/,

        number: $ => /\d+/,
    },
})
