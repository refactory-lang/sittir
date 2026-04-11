/**
 * overrides.ts — Grammar extension for python
 *
 * Converted from overrides.json. Each entry wraps an unnamed child
 * at a positional index with a named field.
 *
 * @generated from overrides.json — review before committing
 */

// @ts-nocheck — grammar.js is untyped
import base from '../../node_modules/.pnpm/tree-sitter-python@0.25.0/node_modules/tree-sitter-python/grammar.js'

export default grammar(base, {
    name: 'python',
    rules: {
        // as_pattern: 1 field(s)
        as_pattern: ($, original) => transform(original, {
            0: field('expression'), // expression | case_pattern | identifier
        }),

        // await: 1 field(s)
        await: ($, original) => transform(original, {
            0: field('primary_expression'), // primary_expression
        }),

        // chevron: 1 field(s)
        chevron: ($, original) => transform(original, {
            0: field('expression'), // expression
        }),

        // class_pattern: 2 field(s)
        class_pattern: ($, original) => transform(original, {
            0: field('dotted_name'), // dotted_name
            1: field('arguments'), // case_pattern
        }),

        // comparison_operator: 2 field(s)
        comparison_operator: ($, original) => transform(original, {
            0: field('left'), // primary_expression
            1: field('comparators'), // primary_expression
        }),

        // complex_pattern: 2 field(s)
        complex_pattern: ($, original) => transform(original, {
            0: field('real'), // integer | float
            1: field('imaginary'), // integer | float
        }),

        // conditional_expression: 3 field(s)
        conditional_expression: ($, original) => transform(original, {
            0: field('body'), // expression
            1: field('condition'), // expression
            2: field('alternative'), // expression
        }),

        // constrained_type: 2 field(s)
        constrained_type: ($, original) => transform(original, {
            0: field('base_type'), // type
            1: field('constraint'), // type
        }),

        // decorator: 2 field(s)
        decorator: ($, original) => transform(original, {
            0: field('expression'), // expression
            1: field('newline'), // 
        }),

        // dictionary_splat: 1 field(s)
        dictionary_splat: ($, original) => transform(original, {
            0: field('expression'), // expression
        }),

        // finally_clause: 1 field(s)
        finally_clause: ($, original) => transform(original, {
            0: field('block'), // block
        }),

        // generic_type: 2 field(s)
        generic_type: ($, original) => transform(original, {
            0: field('identifier'), // identifier
            1: field('type_parameter'), // type_parameter
        }),

        // if_clause: 1 field(s)
        if_clause: ($, original) => transform(original, {
            0: field('expression'), // expression
        }),

        // import_from_statement: 1 field(s)
        import_from_statement: ($, original) => transform(original, {
            0: field('wildcard_import'), // wildcard_import
        }),

        // keyword_pattern: 2 field(s)
        keyword_pattern: ($, original) => transform(original, {
            0: field('identifier'), // identifier | class_pattern | complex_pattern | concatenated_string | dict_pattern | dotted_name | false | float | integer | list_pattern | none | splat_pattern | string | true | tuple_pattern | union_pattern
            1: field('simple_pattern'), // _simple_pattern | class_pattern | complex_pattern | concatenated_string | dict_pattern | dotted_name | false | float | integer | list_pattern | none | splat_pattern | string | true | tuple_pattern | union_pattern
        }),

        // list_splat: 1 field(s)
        list_splat: ($, original) => transform(original, {
            0: field('expression'), // expression | attribute | identifier | subscript
        }),

        // member_type: 2 field(s)
        member_type: ($, original) => transform(original, {
            0: field('base_type'), // type
            1: field('identifier'), // identifier
        }),

        // print_statement: 1 field(s)
        print_statement: ($, original) => transform(original, {
            0: field('chevron'), // chevron
        }),

        // relative_import: 2 field(s)
        relative_import: ($, original) => transform(original, {
            0: field('import_prefix'), // import_prefix
            1: field('dotted_name'), // dotted_name
        }),

        // slice: 3 field(s)
        slice: ($, original) => transform(original, {
            0: field('start'), // expression
            1: field('stop'), // expression
            2: field('step'), // expression
        }),

        // splat_pattern: 1 field(s)
        splat_pattern: ($, original) => transform(original, {
            0: field('identifier'), // identifier
        }),

        // splat_type: 1 field(s)
        splat_type: ($, original) => transform(original, {
            0: field('identifier'), // identifier
        }),

        // string: 3 field(s)
        string: ($, original) => transform(original, {
            0: field('string_start'), // string_start
            1: field('content'), // interpolation | string_content
            2: field('string_end'), // string_end
        }),

        // try_statement: 3 field(s)
        try_statement: ($, original) => transform(original, {
            0: field('except_clauses'), // except_clause
            1: field('else_clause'), // else_clause
            2: field('finally_clause'), // finally_clause
        }),

        // union_type: 2 field(s)
        union_type: ($, original) => transform(original, {
            0: field('left'), // type
            1: field('right'), // type
        }),

        // with_statement: 1 field(s)
        with_statement: ($, original) => transform(original, {
            0: field('with_clause'), // with_clause
        }),

    },
})
