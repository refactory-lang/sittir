/**
 * overrides.ts — Grammar extension for rust
 *
 * Converted from overrides.json. Each entry wraps an unnamed child
 * at a positional index with a named field.
 *
 * @generated from overrides.json — review before committing
 */

// @ts-nocheck — grammar.js is untyped; overrides use sittir DSL
import base from '../../node_modules/.pnpm/tree-sitter-rust@0.24.0/node_modules/tree-sitter-rust/grammar.js'
import { transform, enrich, field } from '../codegen/src/dsl/index.ts'

export default grammar(enrich(base), {
    name: 'rust',
    rules: {
        // abstract_type: 1 field(s)
        abstract_type: ($, original) => transform(original, {
            1: field('type_parameters'), // type_parameters [struct=0]
        }),

        // array_expression: pos 1 is the outer attribute_item repeat. Pos 2
        // is a choice between `[expr; length]` and `[elem1, elem2, ...]`
        // shapes. Wrapping pos 2 as a single `elements` field carries the
        // list-shape joinBy but clobbers `field('length', ...)` in the
        // semi form. Open gap: promotePolymorph would splice in both
        // shapes but loses the list-form ',' separator from the repeat.
        array_expression: ($, original) => transform(original, {
            1: field('attributes'), // attribute_item
            2: field('elements'), // _expression | attribute_item
        }),

        // associated_type: 1 field(s)
        associated_type: ($, original) => transform(original, {
            4: field('where_clause'), // where_clause [struct=0]
        }),

        // async_block: position 2 is the `block` symbol (position 1 is
        // the optional `move` choice). Autogen placed the override at
        // position 1, which wrapped the move choice and dropped the
        // block routing entirely.
        async_block: ($, original) => transform(original, {
            2: field('block'),
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
        // Grammar: seq(optional('ref'), optional(mutable_specifier), choice(...))
        // Position 0 = optional('ref') [anonymous], position 1 = optional(mutable_specifier)
        field_pattern: ($, original) => transform(original, {
            1: field('mutable_specifier'), // mutable_specifier [struct=0]
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

        // function_item: pos 6 is optional(seq('->', field('return_type', ..))) —
        // don't touch it, return_type is already a base-grammar field. The
        // where_clause symbol lives at pos 7. Pos 8 is the body block (also
        // already a base field).
        function_item: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier
            1: field('function_modifiers'), // function_modifiers
            7: field('where_clause'), // where_clause
        }),

        // function_signature_item: same shape as function_item but ends in
        // ';' instead of a body block — pos 7 is where_clause here too.
        function_signature_item: ($, original) => transform(original, {
            0: field('visibility_modifier'), // visibility_modifier
            1: field('function_modifiers'), // function_modifiers
            7: field('where_clause'), // where_clause
        }),

        // function_type: 2 field(s)
        function_type: ($, original) => transform(original, {
            0: field('for_lifetimes'), // for_lifetimes [struct=0]
            1: field('function_modifiers'), // function_modifiers [struct=1]
        }),

        // gen_block: same fix as async_block — the block symbol is
        // at position 2, position 1 is the optional `move` choice.
        gen_block: ($, original) => transform(original, {
            2: field('block'),
        }),

        // impl_item: override removed. Same autogen mistake as struct_item —
        // position 0 was labeled `field('where_clause')` but it's the
        // unsafe/impl header start, not a where_clause. The where_clause
        // is buried deeper in the rule's seq.

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

        // ordered_field_declaration_list: 1 field(s)
        // The original override had position 2 for `visibility_modifier`
        // targeting `optional(',')` (trailing comma). After evaluate's
        // `absorbTrailingSeparator` collapses the trailing comma into the
        // repeat's `trailing: true` flag, position 2 becomes `)` — wrong.
        // Also `visibility_modifier` is inside the per-element seq, not at
        // the outer level, so the position 2 override was structurally
        // incorrect. Only wrapping position 1 (the per-element group).
        ordered_field_declaration_list: ($, original) => transform(original, {
            1: field('attributes'), // per-element group [struct=0]
        }),

        // parameter: 1 field(s)
        parameter: ($, original) => transform(original, {
            0: field('mutable_specifier'), // mutable_specifier [struct=0]
        }),

        // pointer_type: position 1 is `choice('const', $.mutable_specifier)`.
        // Wrapping the choice as `field('mutable_specifier')` makes BOTH
        // the `const` string and the `mutable_specifier` symbol route to
        // the named slot at readNode time, so the template can emit the
        // actual qualifier text instead of hardcoding "const".
        pointer_type: ($, original) => transform(original, {
            1: field('mutable_specifier'),
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

        // struct_item: position 0 is `choice(visibility_modifier, BLANK)`
        // — wrap it as `field('visibility_modifier')` so readNode
        // routes the modifier child onto the named slot. Position 4
        // (the body/semi/unit polymorph choice) is intentionally NOT
        // wrapped — that's what lets Link's promotePolymorph classify
        // the body/semi/unit variants.
        struct_item: ($, original) => transform(original, {
            0: field('visibility_modifier'),
        }),

        // trait_item: position 0 is the same visibility_modifier
        // optional choice as struct_item. The where_clause at
        // position 6 and the body field at position 7 stay as
        // declared in the base grammar.
        trait_item: ($, original) => transform(original, {
            0: field('visibility_modifier'),
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

        // unary_expression: override removed. Autogen wrapped position
        // 0 (the `choice('-','*','!')` operator) in `field('operand')`
        // but that position is the OPERATOR, not the operand. Letting
        // the walker see the raw enum emits `-$$$CHILDREN`. Note:
        // overrides.json still has `operator`/`operand` fields, so
        // readNode at runtime produces field data — but the walker
        // no longer masks the operator as an "operand" slot.

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

        // ---------------------------------------------------------------------------
        // New overrides — expressing field routing previously only in overrides.json
        // ---------------------------------------------------------------------------

        // closure_expression — label the three optional modifiers so readNode
        // can route `async`, `move`, `static` tokens to named fields instead
        // of leaving them as anonymous children.
        closure_expression: ($, original) => transform(original, {
            0: field('static'),  // optional 'static'
            1: field('async'),   // optional 'async'
            2: field('move'),    // optional 'move'
        }),

        // function_modifiers — full replacement: label each choice alternative
        // so readNode can route `async`, `const`, `default`, `unsafe` tokens.
        function_modifiers: ($) => repeat1(choice(
            field('async', 'async'),
            field('default', 'default'),
            field('const', 'const'),
            field('unsafe', 'unsafe'),
            $.extern_modifier,
        )),

        // or_pattern — patches the BASE rule's prec.left(-2, ...)
        // structure to add field labels. Base shape:
        //   choice(seq(_pattern, '|', _pattern), seq('|', _pattern))
        or_pattern: ($, original) => transform(original, {
            '0/0': field('left'),
            '0/2': field('right'),
            '1/1': field('right'),
        }),

        // range_expression — patches the BASE rule's choice alternatives
        // by position so the prec.left(1, ...) wrapper survives. The
        // base shape (after path addressing's prec-transparency) is:
        //   choice(
        //     seq(expr, choice('..','...','..='), expr),  // alt 0 — binary
        //     seq(expr, '..'),                            // alt 1 — postfix
        //     seq('..', expr),                            // alt 2 — prefix
        //     '..',                                       // alt 3 — bare
        //   )
        // Each {path,value} below labels one position in one alternative.
        range_expression: ($, original) => transform(original, {
            '0/0': field('start'),
            '0/1': field('operator'),
            '0/2': field('end'),
            '1/0': field('start'),
            '1/1': field('operator'),
            '2/0': field('operator'),
            '2/1': field('end'),
            '3':   field('operator'),
        }),

        // unary_expression — label both the operator token (pos 0) and
        // the operand expression (pos 1). overrides.json promotes both
        // to fields at readNode time; the walker needs matching IR
        // fields so the template emits `$OPERATOR$OPERAND` instead of
        // `$OPERATOR $$$CHILDREN` (which reads empty after field promotion).
        unary_expression: ($, original) => transform(original, {
            0: field('operator'), // choice('-', '*', '!')
            1: field('operand'),  // $._expression
        }),

        // visibility_modifier — label the `pub` keyword and the `in` keyword
        // (inside `pub(in path)`) so readNode can route them to named fields.
        visibility_modifier: ($) => choice(
            $.crate,
            seq(
                field('pub', 'pub'),
                optional(seq(
                    '(',
                    choice(
                        $.self,
                        $.super,
                        $.crate,
                        seq(field('in', 'in'), $._path),
                    ),
                    ')',
                )),
            ),
        ),

    },
})
