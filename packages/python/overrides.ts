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
            0: field('expression'), // expression | case_pattern | identifier [struct=0]
        }),

        // await: 1 field(s)
        await: ($, original) => transform(original, {
            1: field('primary_expression'), // primary_expression [struct=0]
        }),

        // chevron: 1 field(s)
        chevron: ($, original) => transform(original, {
            1: field('expression'), // expression [struct=0]
        }),

        // class_pattern: 2 field(s)
        class_pattern: ($, original) => transform(original, {
            0: field('dotted_name'), // dotted_name [struct=0]
            2: field('arguments'), // case_pattern [struct=1]
        }),

        // comparison_operator: 2 field(s)
        comparison_operator: ($, original) => transform(original, {
            0: field('left'), // primary_expression [struct=0]
            1: field('comparators'), // primary_expression [struct=1]
        }),

        // complex_pattern: 2 field(s)
        complex_pattern: ($, original) => transform(original, {
            0: field('real'), // integer | float [struct=0]
            1: field('imaginary'), // integer | float [struct=1]
        }),

        // conditional_expression: 3 field(s)
        conditional_expression: ($, original) => transform(original, {
            0: field('body'), // expression [struct=0]
            2: field('condition'), // expression [struct=1]
            4: field('alternative'), // expression [struct=2]
        }),

        // constrained_type: 2 field(s)
        constrained_type: ($, original) => transform(original, {
            0: field('base_type'), // type [struct=0]
            2: field('constraint'), // type [struct=1]
        }),

        // decorator: 2 field(s)
        decorator: ($, original) => transform(original, {
            1: field('expression'), // expression [struct=0]
            2: field('newline'), //  [struct=1]
        }),

        // dictionary_splat: 1 field(s)
        dictionary_splat: ($, original) => transform(original, {
            1: field('expression'), // expression [struct=0]
        }),

        // finally_clause: 1 field(s)
        finally_clause: ($, original) => transform(original, {
            2: field('block'), // block [struct=0]
        }),

        // generic_type: 2 field(s)
        generic_type: ($, original) => transform(original, {
            0: field('identifier'), // identifier [struct=0]
            1: field('type_parameter'), // type_parameter [struct=1]
        }),

        // if_clause: 1 field(s)
        if_clause: ($, original) => transform(original, {
            1: field('expression'), // expression [struct=0]
        }),

        // import_from_statement: 1 field(s)
        import_from_statement: ($, original) => transform(original, {
            3: field('wildcard_import'), // wildcard_import [struct=0]
        }),

        // keyword_pattern: 2 field(s)
        keyword_pattern: ($, original) => transform(original, {
            0: field('identifier'), // identifier | class_pattern | complex_pattern | concatenated_string | dict_pattern | dotted_name | false | float | integer | list_pattern | none | splat_pattern | string | true | tuple_pattern | union_pattern [struct=0]
            2: field('simple_pattern'), // _simple_pattern | class_pattern | complex_pattern | concatenated_string | dict_pattern | dotted_name | false | float | integer | list_pattern | none | splat_pattern | string | true | tuple_pattern | union_pattern [struct=1]
        }),

        // list_splat: 1 field(s)
        list_splat: ($, original) => transform(original, {
            1: field('expression'), // expression | attribute | identifier | subscript [struct=0]
        }),

        // member_type: 2 field(s)
        member_type: ($, original) => transform(original, {
            0: field('base_type'), // type [struct=0]
            2: field('identifier'), // identifier [struct=1]
        }),

        // relative_import: 2 field(s)
        relative_import: ($, original) => transform(original, {
            0: field('import_prefix'), // import_prefix [struct=0]
            1: field('dotted_name'), // dotted_name [struct=1]
        }),

        // slice: 3 field(s)
        slice: ($, original) => transform(original, {
            0: field('start'), // expression [struct=0]
            2: field('stop'), // expression [struct=1]
            3: field('step'), // expression [struct=2]
        }),

        // splat_pattern: 1 field(s)
        splat_pattern: ($, original) => transform(original, {
            0: field('identifier'), // identifier [struct=0]
        }),

        // splat_type: 1 field(s)
        splat_type: ($, original) => transform(original, {
            0: field('identifier'), // identifier [struct=0]
        }),

        // string: 3 field(s)
        string: ($, original) => transform(original, {
            0: field('string_start'), // string_start [struct=0]
            1: field('content'), // interpolation | string_content [struct=1]
            2: field('string_end'), // string_end [struct=2]
        }),

        // try_statement: 3 field(s)
        try_statement: ($, original) => transform(original, {
            3: field('except_clauses'), // except_clause [struct=0]
            4: field('else_clause'), // else_clause [struct=1]
            5: field('finally_clause'), // finally_clause [struct=2]
        }),

        // union_type: 2 field(s)
        union_type: ($, original) => transform(original, {
            0: field('left'), // type [struct=0]
            2: field('right'), // type [struct=1]
        }),

        // with_statement: 1 field(s)
        with_statement: ($, original) => transform(original, {
            0: field('with_clause'), // with_clause [struct=0]
        }),

    },
})
