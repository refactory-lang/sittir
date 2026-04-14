/**
 * overrides.ts — Grammar extension for rust
 *
 * Converted from overrides.json. Each entry wraps an unnamed child
 * at a positional index with a named field.
 *
 * @generated from overrides.json — review before committing
 */

// @ts-ignore
import base from '../../node_modules/.pnpm/tree-sitter-rust@0.24.0/node_modules/tree-sitter-rust/grammar.js'

export default grammar(base, {
    name: 'rust',
    rules: {
        // abstract_type: 1 field(s)
        abstract_type: ($, original) => transform(original, {
            1: field('type_parameters'), // type_parameters [struct=0]
        }),

        // array_expression: 2 field(s)
        array_expression: ($, original) => transform(original, {
            1: field('attributes'), // attribute_item [struct=0]
            2: field('elements'), // _expression | attribute_item [struct=1]
        }),

        // associated_type: 1 field(s)
        associated_type: ($, original) => transform(original, {
            4: field('where_clause'), // where_clause [struct=0]
        }),

        // async_block: 1 field(s)
        async_block: ($, original) => transform(original, {
            1: field('block'), // block [struct=0]
        }),

        // attribute_item: 1 field(s)
        attribute_item: ($, original) => transform(original, {
            2: field('attribute'), // attribute [struct=0]
        }),

        // block: 1 field(s)
        block: ($, original) => transform(original, {
            0: field('label'), // label [struct=0]
        }),

        // bounded_type: 2 field(s)
        bounded_type: ($, original) => transform(original, {
            0: field('left'), // lifetime | _type | use_bounds [struct=0]
            2: field('right'), // lifetime | _type | use_bounds [struct=1]
        }),

        // break_expression: 2 field(s)
        break_expression: ($, original) => transform(original, {
            1: field('label'), // label [struct=0]
            2: field('expression'), // _expression [struct=1]
        }),

        // captured_pattern: 2 field(s)
        captured_pattern: ($, original) => transform(original, {
            0: field('identifier'), // identifier [struct=0]
            2: field('pattern'), // _pattern [struct=1]
        }),

        // const_item: 1 field(s)
        const_item: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier [struct=0]
        }),

        // continue_expression: 1 field(s)
        continue_expression: ($, original) => transform(original, {
            1: field('label'), // label [struct=0]
        }),

        // enum_item: 2 field(s)
        enum_item: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier [struct=0]
            4: field('where_clause'), // where_clause [struct=1]
        }),

        // enum_variant: 1 field(s)
        enum_variant: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier [struct=0]
        }),

        // extern_crate_declaration: 2 field(s)
        extern_crate_declaration: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier [struct=0]
            2: field('crate'), // crate [struct=1]
        }),

        // extern_modifier: 1 field(s)
        extern_modifier: ($, original) => transform(original, {
            1: field('string_literal'), // string_literal [struct=0]
        }),

        // field_declaration: 1 field(s)
        field_declaration: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier [struct=0]
        }),

        // field_pattern: 1 field(s)
        field_pattern: ($, original) => transform(original, {
            0: field('mutable_specifier'), // mutable_specifier [struct=0]
        }),

        // for_expression: 1 field(s)
        for_expression: ($, original) => transform(original, {
            0: field('label'), // label [struct=0]
        }),

        // foreign_mod_item: 2 field(s)
        foreign_mod_item: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier [struct=0]
            1: field('extern_modifier'), // extern_modifier [struct=1]
        }),

        // function_item: 3 field(s)
        function_item: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier [struct=0]
            1: field('function_modifiers'), // function_modifiers [struct=1]
            6: field('where_clause'), // where_clause [struct=2]
        }),

        // function_signature_item: 3 field(s)
        function_signature_item: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier [struct=0]
            1: field('function_modifiers'), // function_modifiers [struct=1]
            6: field('where_clause'), // where_clause [struct=2]
        }),

        // function_type: 2 field(s)
        function_type: ($, original) => transform(original, {
            0: field('for_lifetimes'), // for_lifetimes [struct=0]
            1: field('function_modifiers'), // function_modifiers [struct=1]
        }),

        // gen_block: 1 field(s)
        gen_block: ($, original) => transform(original, {
            1: field('block'), // block [struct=0]
        }),

        // impl_item: 1 field(s)
        impl_item: ($, original) => transform(original, {
            0: field('where_clause'), // where_clause [struct=0]
        }),

        // index_expression: 2 field(s)
        index_expression: ($, original) => transform(original, {
            0: field('object'), // _expression [struct=0]
            2: field('index'), // _expression [struct=1]
        }),

        // inner_attribute_item: 1 field(s)
        inner_attribute_item: ($, original) => transform(original, {
            3: field('attribute'), // attribute [struct=0]
        }),

        // label: 1 field(s)
        label: ($, original) => transform(original, {
            1: field('identifier'), // identifier [struct=0]
        }),

        // let_declaration: 1 field(s)
        let_declaration: ($, original) => transform(original, {
            1: field('mutable_specifier'), // mutable_specifier [struct=0]
        }),

        // lifetime: 1 field(s)
        lifetime: ($, original) => transform(original, {
            1: field('identifier'), // identifier [struct=0]
        }),

        // loop_expression: 1 field(s)
        loop_expression: ($, original) => transform(original, {
            0: field('label'), // label [struct=0]
        }),

        // macro_definition: 1 field(s)
        macro_definition: ($, original) => transform(original, {
            2: field('rules'), // macro_rule [struct=0]
        }),

        // macro_invocation: 1 field(s)
        macro_invocation: ($, original) => transform(original, {
            2: field('token_tree'), // token_tree [struct=0]
        }),

        // mod_item: 1 field(s)
        mod_item: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier [struct=0]
        }),

        // mut_pattern: 2 field(s)
        mut_pattern: ($, original) => transform(original, {
            0: field('mutable_specifier'), // mutable_specifier [struct=0]
            1: field('pattern'), // _pattern [struct=1]
        }),

        // negative_literal: 2 field(s)
        negative_literal: ($, original) => transform(original, {
            1: field('value'), // integer_literal | float_literal [struct=0]
        }),

        // ordered_field_declaration_list: 3 field(s)
        ordered_field_declaration_list: ($, original) => transform(original, {
            1: field('attributes'), // attribute_item [struct=0]
            2: field('visibility_modifier'), // visibility_modifier [struct=1]
        }),

        // parameter: 1 field(s)
        parameter: ($, original) => transform(original, {
            0: field('mutable_specifier'), // mutable_specifier [struct=0]
        }),

        // pointer_type: 1 field(s)
        pointer_type: ($, original) => transform(original, {
            1: field('mutable_specifier'), // mutable_specifier [struct=0]
        }),

        // raw_string_literal: 3 field(s)
        raw_string_literal: ($, original) => transform(original, {
            0: field('raw_string_literal_start'), //  [struct=0]
            1: field('string_content'), // string_content [struct=1]
            2: field('raw_string_literal_end'), //  [struct=2]
        }),

        // reference_expression: 1 field(s)
        reference_expression: ($, original) => transform(original, {
            1: field('mutable_specifier'), // mutable_specifier [struct=0]
        }),

        // reference_pattern: 2 field(s)
        reference_pattern: ($, original) => transform(original, {
            1: field('mutable_specifier'), // mutable_specifier [struct=0]
            2: field('pattern'), // _pattern [struct=1]
        }),

        // reference_type: 2 field(s)
        reference_type: ($, original) => transform(original, {
            1: field('lifetime'), // lifetime [struct=0]
            2: field('mutable_specifier'), // mutable_specifier [struct=1]
        }),

        // self_parameter: 3 field(s)
        self_parameter: ($, original) => transform(original, {
            0: field('lifetime'), // lifetime [struct=0]
            1: field('mutable_specifier'), // mutable_specifier [struct=1]
            2: field('self'), // self [struct=2]
        }),

        // shorthand_field_initializer: 2 field(s)
        shorthand_field_initializer: ($, original) => transform(original, {
            0: field('attributes'), // attribute_item [struct=0]
            1: field('identifier'), // identifier [struct=1]
        }),

        // source_file: 2 field(s)
        source_file: ($, original) => transform(original, {
            0: field('shebang'), // shebang [struct=0]
            1: field('statements'), // _statement [struct=1]
        }),

        // static_item: 2 field(s)
        static_item: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier [struct=0]
            2: field('mutable_specifier'), // mutable_specifier [struct=1]
        }),

        // struct_item: override removed. Position 0 (visibility_modifier)
        // and position 4 (the top-level body/semi/unit choice) were both
        // wrapped in `field(...)` by the autogen from node-types.json.
        // Top-level seq members aren't fields in tree-sitter's sense —
        // they're structural positions. The visibility_modifier wrapper
        // was redundant (or worse, redundant + mislabel), and the
        // where_clause wrapper prevented polymorph promotion for the
        // body/semi/unit variants. Letting the original rule through
        // lets Link's promotePolymorph classify the variants properly.

        // trait_item: 2 field(s)
        trait_item: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier [struct=0]
            1: field('where_clause'), // where_clause [struct=1]
        }),

        // try_block: 1 field(s)
        try_block: ($, original) => transform(original, {
            1: field('block'), // block [struct=0]
        }),

        // try_expression: 2 field(s)
        try_expression: ($, original) => transform(original, {
            0: field('value'), // _expression [struct=0]
        }),

        // tuple_expression: 4 field(s)
        tuple_expression: ($, original) => transform(original, {
            1: field('attributes'), // attribute_item [struct=0]
            2: field('first'), // _expression [struct=1]
            3: field('rest'), // _expression [struct=2]
            4: field('trailing'), // _expression [struct=3]
        }),

        // type_item: 3 field(s)
        type_item: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier [struct=0]
            4: field('where_clause'), // where_clause [struct=1]
            7: field('trailing_where_clause'), // where_clause [struct=2]
        }),

        // unary_expression: 2 field(s)
        unary_expression: ($, original) => transform(original, {
            0: field('operand'), // _expression [struct=0]
        }),

        // union_item: 2 field(s)
        union_item: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier [struct=0]
            4: field('where_clause'), // where_clause [struct=1]
        }),

        // unsafe_block: 1 field(s)
        unsafe_block: ($, original) => transform(original, {
            1: field('block'), // block [struct=0]
        }),

        // use_declaration: 1 field(s)
        use_declaration: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier [struct=0]
        }),

        // use_wildcard: 1 field(s)
        use_wildcard: ($, original) => transform(original, {
            0: field('path'), // crate | identifier | metavariable | scoped_identifier | self | super [struct=0]
        }),

        // variadic_parameter: 1 field(s)
        variadic_parameter: ($, original) => transform(original, {
            0: field('mutable_specifier'), // mutable_specifier [struct=0]
        }),

        // while_expression: 1 field(s)
        while_expression: ($, original) => transform(original, {
            0: field('label'), // label [struct=0]
        }),

    },
})
