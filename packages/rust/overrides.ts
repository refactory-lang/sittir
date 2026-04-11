/**
 * overrides.ts — Grammar extension for rust
 *
 * Converted from overrides.json. Each entry wraps an unnamed child
 * at a positional index with a named field.
 *
 * @generated from overrides.json — review before committing
 */

// @ts-nocheck — grammar.js is untyped
import base from '../../node_modules/.pnpm/tree-sitter-rust@0.24.0/node_modules/tree-sitter-rust/grammar.js'

export default grammar(base, {
    name: 'rust',
    rules: {
        // abstract_type: 1 field(s)
        abstract_type: ($, original) => transform(original, {
            0: field('type_parameters'), // type_parameters
        }),

        // array_expression: 2 field(s)
        array_expression: ($, original) => transform(original, {
            0: field('attributes'), // attribute_item
            1: field('elements'), // _expression | attribute_item
        }),

        // associated_type: 1 field(s)
        associated_type: ($, original) => transform(original, {
            0: field('where_clause'), // where_clause
        }),

        // async_block: 1 field(s)
        async_block: ($, original) => transform(original, {
            0: field('block'), // block
        }),

        // attribute_item: 1 field(s)
        attribute_item: ($, original) => transform(original, {
            0: field('attribute'), // attribute
        }),

        // block: 1 field(s)
        block: ($, original) => transform(original, {
            0: field('label'), // label
        }),

        // bounded_type: 2 field(s)
        bounded_type: ($, original) => transform(original, {
            0: field('left'), // lifetime | _type | use_bounds
            1: field('right'), // lifetime | _type | use_bounds
        }),

        // break_expression: 2 field(s)
        break_expression: ($, original) => transform(original, {
            0: field('label'), // label
            1: field('expression'), // _expression
        }),

        // captured_pattern: 2 field(s)
        captured_pattern: ($, original) => transform(original, {
            0: field('identifier'), // identifier
            1: field('pattern'), // _pattern
        }),

        // closure_expression: 3 field(s)
        closure_expression: ($, original) => transform(original, {
            -1: field('async'), // async
            -1: field('move'), // move
            -1: field('static'), // static
        }),

        // const_item: 1 field(s)
        const_item: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier
        }),

        // continue_expression: 1 field(s)
        continue_expression: ($, original) => transform(original, {
            0: field('label'), // label
        }),

        // enum_item: 2 field(s)
        enum_item: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier
            1: field('where_clause'), // where_clause
        }),

        // enum_variant: 1 field(s)
        enum_variant: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier
        }),

        // extern_crate_declaration: 2 field(s)
        extern_crate_declaration: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier
            1: field('crate'), // crate
        }),

        // extern_modifier: 1 field(s)
        extern_modifier: ($, original) => transform(original, {
            0: field('string_literal'), // string_literal
        }),

        // field_declaration: 1 field(s)
        field_declaration: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier
        }),

        // field_pattern: 1 field(s)
        field_pattern: ($, original) => transform(original, {
            0: field('mutable_specifier'), // mutable_specifier
        }),

        // for_expression: 1 field(s)
        for_expression: ($, original) => transform(original, {
            0: field('label'), // label
        }),

        // foreign_mod_item: 2 field(s)
        foreign_mod_item: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier
            1: field('extern_modifier'), // extern_modifier
        }),

        // function_modifiers: 4 field(s)
        function_modifiers: ($, original) => transform(original, {
            -1: field('async'), // async
            -1: field('default'), // default
            -1: field('const'), // const
            -1: field('unsafe'), // unsafe
        }),

        // function_item: 3 field(s)
        function_item: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier
            1: field('function_modifiers'), // function_modifiers
            2: field('where_clause'), // where_clause
        }),

        // function_signature_item: 3 field(s)
        function_signature_item: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier
            1: field('function_modifiers'), // function_modifiers
            2: field('where_clause'), // where_clause
        }),

        // function_type: 2 field(s)
        function_type: ($, original) => transform(original, {
            0: field('for_lifetimes'), // for_lifetimes
            1: field('function_modifiers'), // function_modifiers
        }),

        // gen_block: 1 field(s)
        gen_block: ($, original) => transform(original, {
            0: field('block'), // block
        }),

        // impl_item: 1 field(s)
        impl_item: ($, original) => transform(original, {
            0: field('where_clause'), // where_clause
        }),

        // index_expression: 2 field(s)
        index_expression: ($, original) => transform(original, {
            0: field('object'), // _expression
            1: field('index'), // _expression
        }),

        // inner_attribute_item: 1 field(s)
        inner_attribute_item: ($, original) => transform(original, {
            0: field('attribute'), // attribute
        }),

        // label: 1 field(s)
        label: ($, original) => transform(original, {
            0: field('identifier'), // identifier
        }),

        // let_declaration: 1 field(s)
        let_declaration: ($, original) => transform(original, {
            0: field('mutable_specifier'), // mutable_specifier
        }),

        // lifetime: 1 field(s)
        lifetime: ($, original) => transform(original, {
            0: field('identifier'), // identifier
        }),

        // loop_expression: 1 field(s)
        loop_expression: ($, original) => transform(original, {
            0: field('label'), // label
        }),

        // macro_definition: 1 field(s)
        macro_definition: ($, original) => transform(original, {
            0: field('rules'), // macro_rule
        }),

        // macro_invocation: 1 field(s)
        macro_invocation: ($, original) => transform(original, {
            0: field('token_tree'), // token_tree
        }),

        // mod_item: 1 field(s)
        mod_item: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier
        }),

        // mut_pattern: 2 field(s)
        mut_pattern: ($, original) => transform(original, {
            0: field('mutable_specifier'), // mutable_specifier
            1: field('pattern'), // _pattern
        }),

        // negative_literal: 2 field(s)
        negative_literal: ($, original) => transform(original, {
            -1: field('operator'), // -
            0: field('value'), // integer_literal | float_literal
        }),

        // or_pattern: 2 field(s)
        or_pattern: ($, original) => transform(original, {
            0: field('left'), // _pattern
            1: field('right'), // _pattern
        }),

        // ordered_field_declaration_list: 3 field(s)
        ordered_field_declaration_list: ($, original) => transform(original, {
            0: field('attributes'), // attribute_item
            1: field('visibility_modifier'), // visibility_modifier
            2: field('declarations'), // attribute_item | visibility_modifier
        }),

        // parameter: 1 field(s)
        parameter: ($, original) => transform(original, {
            0: field('mutable_specifier'), // mutable_specifier
        }),

        // pointer_type: 1 field(s)
        pointer_type: ($, original) => transform(original, {
            0: field('mutable_specifier'), // mutable_specifier
        }),

        // range_expression: 3 field(s)
        range_expression: ($, original) => transform(original, {
            0: field('start'), // _expression
            -1: field('operator'), // .. | ..= | ...
            1: field('end'), // _expression
        }),

        // raw_string_literal: 3 field(s)
        raw_string_literal: ($, original) => transform(original, {
            0: field('raw_string_literal_start'), // 
            1: field('string_content'), // string_content
            2: field('raw_string_literal_end'), // 
        }),

        // reference_expression: 1 field(s)
        reference_expression: ($, original) => transform(original, {
            0: field('mutable_specifier'), // mutable_specifier
        }),

        // reference_pattern: 2 field(s)
        reference_pattern: ($, original) => transform(original, {
            0: field('mutable_specifier'), // mutable_specifier
            1: field('pattern'), // _pattern
        }),

        // reference_type: 2 field(s)
        reference_type: ($, original) => transform(original, {
            0: field('lifetime'), // lifetime
            1: field('mutable_specifier'), // mutable_specifier
        }),

        // self_parameter: 3 field(s)
        self_parameter: ($, original) => transform(original, {
            0: field('lifetime'), // lifetime
            1: field('mutable_specifier'), // mutable_specifier
            2: field('self'), // self
        }),

        // shorthand_field_initializer: 2 field(s)
        shorthand_field_initializer: ($, original) => transform(original, {
            0: field('attributes'), // attribute_item
            1: field('identifier'), // identifier
        }),

        // source_file: 2 field(s)
        source_file: ($, original) => transform(original, {
            0: field('shebang'), // shebang
            1: field('statements'), // _statement
        }),

        // static_item: 2 field(s)
        static_item: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier
            1: field('mutable_specifier'), // mutable_specifier
        }),

        // struct_item: 2 field(s)
        struct_item: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier
            1: field('where_clause'), // where_clause
        }),

        // trait_item: 2 field(s)
        trait_item: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier
            1: field('where_clause'), // where_clause
        }),

        // try_block: 1 field(s)
        try_block: ($, original) => transform(original, {
            0: field('block'), // block
        }),

        // try_expression: 2 field(s)
        try_expression: ($, original) => transform(original, {
            0: field('value'), // _expression
            -1: field('operator'), // ?
        }),

        // tuple_expression: 4 field(s)
        tuple_expression: ($, original) => transform(original, {
            0: field('attributes'), // attribute_item
            1: field('first'), // _expression
            2: field('rest'), // _expression
            3: field('trailing'), // _expression
        }),

        // type_item: 3 field(s)
        type_item: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier
            1: field('where_clause'), // where_clause
            2: field('trailing_where_clause'), // where_clause
        }),

        // unary_expression: 2 field(s)
        unary_expression: ($, original) => transform(original, {
            -1: field('operator'), // - | * | !
            0: field('operand'), // _expression
        }),

        // union_item: 2 field(s)
        union_item: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier
            1: field('where_clause'), // where_clause
        }),

        // unsafe_block: 1 field(s)
        unsafe_block: ($, original) => transform(original, {
            0: field('block'), // block
        }),

        // use_declaration: 1 field(s)
        use_declaration: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier
        }),

        // use_wildcard: 1 field(s)
        use_wildcard: ($, original) => transform(original, {
            0: field('path'), // crate | identifier | metavariable | scoped_identifier | self | super
        }),

        // variadic_parameter: 1 field(s)
        variadic_parameter: ($, original) => transform(original, {
            0: field('mutable_specifier'), // mutable_specifier
        }),

        // while_expression: 1 field(s)
        while_expression: ($, original) => transform(original, {
            0: field('label'), // label
        }),

        // visibility_modifier: 2 field(s)
        visibility_modifier: ($, original) => transform(original, {
            -1: field('pub'), // pub
            -1: field('in'), // in
        }),

    },
})
