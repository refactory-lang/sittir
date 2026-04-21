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
import { transform, enrich, field, alias, wire } from '../codegen/src/dsl/index.ts'


export default grammar(enrich(base), wire({
    name: 'rust',
    polymorphs: {
        array_expression:    { '2/0': 'semi', '2/1': 'list' },
        closure_expression:  { '4/0': 'block', '4/1': 'expr' },
        field_pattern:       { '2/0': 'shorthand', '2/1': 'named' },
        function_type:       { '1/0/0': 'trait_form', '1/0/1': 'fn_form' },
        impl_item:           { '6/0': 'body', '6/1': 'semi' },
        macro_definition:    { '2/0': 'paren', '2/1': 'bracket', '2/2': 'brace' },
        mod_item:            { '3/0': 'external', '3/1': 'inline' },
        or_pattern:          { '0': 'binary', '1': 'prefix' },
        range_expression:    { '0': 'binary', '1': 'postfix', '2': 'prefix', '3': 'bare' },
        range_pattern:       { '0': 'left', '1': 'prefix' },
        struct_item:         { '4/0': 'brace', '4/1': 'tuple', '4/2': 'unit' },
    },
    transforms: {
        // abstract_type: 1 field(s)
        abstract_type: {
            1: field('type_parameters'), // type_parameters [struct=0]
        },

        // associated_type: 1 field(s)
        associated_type: {
            4: field('where_clause'), // where_clause [struct=0]
        },

        // async_block: position 2 is the `block` symbol (position 1 is
        // the optional `move` choice). Autogen placed the override at
        // position 1, which wrapped the move choice and dropped the
        // block routing entirely.
        async_block: {
            '1/0': field('move'),  // optional('move') → surface as field
            2: field('block'),
        },

        // attribute_item: 1 field(s)
        attribute_item: {
            2: field('attribute'), // attribute [struct=0]
        },

        // block: 1 field(s)
        block: {
            0: field('label'), // label [struct=0]
        },

        // bounded_type: 2 field(s)
        bounded_type: {
            0: field('left'), // lifetime | _type | use_bounds [struct=0]
            2: field('right'), // lifetime | _type | use_bounds [struct=1]
        },

        // break_expression: 2 field(s)
        break_expression: {
            1: field('label'), // label [struct=0]
            2: field('expression'), // _expression [struct=1]
        },

        // captured_pattern: 2 field(s)
        captured_pattern: {
            0: field('identifier'), // identifier [struct=0]
            2: field('pattern'), // _pattern [struct=1]
        },

        // closure_expression — label the three optional modifiers so readNode
        // can route `async`, `move`, `static` tokens to named fields instead
        // of leaving them as anonymous children.
        closure_expression: [
            { 0: field('static'), 1: field('async'), 2: field('move') },
        ],

        // const_item: 1 field(s)
        const_item: {
            0: field('visibility_modifier'), // visibility_modifier [struct=0]
        },

        // continue_expression: 1 field(s)
        continue_expression: {
            1: field('label'), // label [struct=0]
        },

        // enum_item: 2 field(s)
        enum_item: {
            0: field('visibility_modifier'), // visibility_modifier [struct=0]
            4: field('where_clause'), // where_clause [struct=1]
        },

        // enum_variant: 1 field(s)
        enum_variant: {
            0: field('visibility_modifier'), // visibility_modifier [struct=0]
        },

        // extern_crate_declaration: 2 field(s)
        extern_crate_declaration: {
            0: field('visibility_modifier'), // visibility_modifier [struct=0]
            2: field('crate'), // crate [struct=1]
        },

        // extern_modifier: 1 field(s)
        extern_modifier: {
            1: field('string_literal'), // string_literal [struct=0]
        },

        // field_declaration: 1 field(s)
        field_declaration: {
            0: field('visibility_modifier'), // visibility_modifier [struct=0]
        },

        // field_pattern: 1 field(s)
        // Grammar: seq(optional('ref'), optional(mutable_specifier), choice(...))
        // Position 0 = optional('ref') [anonymous], position 1 = optional(mutable_specifier)
        field_pattern: {
            1: field('mutable_specifier'), // mutable_specifier [struct=0]
        },

        // for_expression: 1 field(s)
        for_expression: {
            0: field('label'), // label [struct=0]
        },

        // foreign_mod_item: 2 field(s)
        foreign_mod_item: {
            0: field('visibility_modifier'), // visibility_modifier [struct=0]
            1: field('extern_modifier'), // extern_modifier [struct=1]
        },

        // function_item: pos 6 is optional(seq('->', field('return_type', ..))) —
        // don't touch it, return_type is already a base-grammar field. The
        // where_clause symbol lives at pos 7. Pos 8 is the body block (also
        // already a base field).
        function_item: {
            0: field('visibility_modifier'), // visibility_modifier
            1: field('function_modifiers'), // function_modifiers
            7: field('where_clause'), // where_clause
        },

        // function_signature_item: same shape as function_item but ends in
        // ';' instead of a body block — pos 7 is where_clause here too.
        function_signature_item: {
            0: field('visibility_modifier'), // visibility_modifier
            1: field('function_modifiers'), // function_modifiers
            7: field('where_clause'), // where_clause
        },

        // function_type: top-level seq is
        //   [for_lifetimes, prec(call, seq(choice(trait, fn_form), parameters)),
        //    optional(->return_type)]
        // The choice at position 1 inner-seq[0] chooses between trait form
        // (bare type with field('trait', ...)) and fn form (seq with
        // optional modifiers + 'fn' literal). Template walker drops the
        // 'fn' literal because it's only in one arm. Polymorph-split each
        // arm. prec is transparent to path addressing, so path `1/0` is
        // the choice inside.
        function_type: [
            { 0: field('for_lifetimes') },
        ],

        // gen_block: same fix as async_block — the block symbol is
        // at position 2, position 1 is the optional `move` choice.
        gen_block: {
            '1/0': field('move'),  // optional('move') → surface as field
            2: field('block'),
        },

        // generic_type_with_turbofish: aliased to `generic_type` at 4 call
        // sites. Wrap `::` at pos 1 as a field('turbofish') so the aliased-
        // shape generic_type surfaces it (confirmed: parse produces
        // field=turbofish for `C::<D>`). The generic_type template itself
        // still needs to reference $TURBOFISH — handled via its override
        // below.
        generic_type_with_turbofish: {
            1: field('turbofish'),
        },

        // generic_type: base rule unchanged. ADR-0006 dispatches via
        // drillAs at alias-declared field sites so consumers see source-
        // typed views (`generic_type_with_turbofish` with the turbofish
        // template). Validators walk the wrapped tree, rewrite `$type`
        // to source, and use the `generic_type_with_turbofish` reparse
        // wrapper that accepts turbofish in a scoped-path context.

        // impl_item: field('where_clause') at pos 5 (inferred from 86%
        // agreement across 7 parents), plus polymorph at pos 6 —
        // choice(field('body', declaration_list), ';'). The ';' arm is
        // the trait-signature form (no body), which the template walker
        // drops without a polymorph split.
        impl_item: [
            {
                '0/0': field('unsafe'),  // optional('unsafe') → surface as field
                5: field('where_clause'),
            },
        ],

        // index_expression: 2 field(s)
        index_expression: {
            0: field('object'), // _expression [struct=0]
            2: field('index'), // _expression [struct=1]
        },

        // inner_attribute_item: 1 field(s)
        inner_attribute_item: {
            3: field('attribute'), // attribute [struct=0]
        },

        // label: 1 field(s)
        label: {
            1: field('identifier'), // identifier [struct=0]
        },

        // let_declaration: 1 field(s)
        let_declaration: {
            1: field('mutable_specifier'), // mutable_specifier [struct=0]
        },

        // lifetime: 1 field(s)
        lifetime: {
            1: field('identifier'), // identifier [struct=0]
        },

        // loop_expression: 1 field(s)
        loop_expression: {
            0: field('label'), // label [struct=0]
        },

        // macro_invocation: 1 field(s)
        macro_invocation: {
            2: field('token_tree'), // token_tree [struct=0]
        },

        // mod_item: two forms — `mod name;` (external) vs `mod name { ... }`
        // (inline). Polymorph-split so each form's template emits the
        // right terminator (trailing `;` vs `{...}` body).
        mod_item: [
            { 0: field('visibility_modifier') },
        ],

        // mut_pattern: 2 field(s)
        mut_pattern: {
            0: field('mutable_specifier'), // mutable_specifier [struct=0]
            1: field('pattern'), // _pattern [struct=1]
        },

        // negative_literal: 2 field(s)
        negative_literal: {
            1: field('value'), // integer_literal | float_literal [struct=0]
        },

        // ordered_field_declaration_list: 1 field(s)
        // The original override had position 2 for `visibility_modifier`
        // targeting `optional(',')` (trailing comma). After evaluate's
        // `absorbTrailingSeparator` collapses the trailing comma into the
        // repeat's `trailing: true` flag, position 2 becomes `)` — wrong.
        // Also `visibility_modifier` is inside the per-element seq, not at
        // the outer level, so the position 2 override was structurally
        // incorrect. Only wrapping position 1 (the per-element group).
        ordered_field_declaration_list: {
            1: field('attributes'), // per-element group [struct=0]
        },

        // parameter: 1 field(s)
        parameter: {
            0: field('mutable_specifier'), // mutable_specifier [struct=0]
        },

        // pointer_type: position 1 is `choice('const', $.mutable_specifier)`.
        // Wrapping the choice as `field('mutable_specifier')` makes BOTH
        // the `const` string and the `mutable_specifier` symbol route to
        // the named slot at readNode time, so the template can emit the
        // actual qualifier text instead of hardcoding "const".
        pointer_type: {
            1: field('mutable_specifier'),
        },

        // raw_string_literal: 3 field(s)
        raw_string_literal: {
            0: field('raw_string_literal_start'), //  [struct=0]
            1: field('string_content'), // string_content [struct=1]
            2: field('raw_string_literal_end'), //  [struct=2]
        },

        // reference_expression: 1 field(s)
        reference_expression: {
            1: field('mutable_specifier'), // mutable_specifier [struct=0]
        },

        // reference_pattern: 2 field(s)
        reference_pattern: {
            1: field('mutable_specifier'), // mutable_specifier [struct=0]
            2: field('pattern'), // _pattern [struct=1]
        },

        // reference_type: 2 field(s)
        reference_type: {
            1: field('lifetime'), // lifetime [struct=0]
            2: field('mutable_specifier'), // mutable_specifier [struct=1]
        },

        // self_parameter: 3 field(s)
        self_parameter: {
            0: field('lifetime'), // lifetime [struct=0]
            1: field('mutable_specifier'), // mutable_specifier [struct=1]
            2: field('self'), // self [struct=2]
        },

        // shorthand_field_initializer: 2 field(s)
        shorthand_field_initializer: {
            0: field('attributes'), // attribute_item [struct=0]
            1: field('identifier'), // identifier [struct=1]
        },

        // source_file: 2 field(s)
        source_file: {
            0: field('shebang'), // shebang [struct=0]
            1: field('statements'), // _statement [struct=1]
        },

        // static_item: 2 field(s)
        static_item: {
            0: field('visibility_modifier'), // visibility_modifier [struct=0]
            2: field('mutable_specifier'), // mutable_specifier [struct=1]
        },

        // struct_item: three body shapes — brace (`{ ... }`), tuple
        // (`(...)` + `;`), unit (`;`). Polymorph-split each into a visible
        // variant so the trailing `;` on tuple/unit forms gets rendered
        // (the flat template dropped it because `;` is an anonymous
        // token not routed to any field).
        struct_item: [
            { 0: field('visibility_modifier') },
        ],

        // trait_item: position 0 is the same visibility_modifier
        // optional choice as struct_item. The where_clause at
        // position 6 and the body field at position 7 stay as
        // declared in the base grammar.
        trait_item: {
            0: field('visibility_modifier'),
            '1/0': field('unsafe'),   // optional('unsafe')
            6: field('where_clause'), // inferred 88% agreement across 8 parents
        },

        // try_block: 1 field(s)
        try_block: {
            1: field('block'), // block [struct=0]
        },

        // try_expression: 2 field(s)
        try_expression: {
            0: field('value'), // _expression [struct=0]
        },

        // tuple_expression: flat list of expressions comma-separated.
        // Kind-match labels every `_expression` as `elements` without
        // capturing the `,` separators (same pattern as array_expression).
        tuple_expression: {
            1: field('attributes'),
            '_expression': field('elements'),
        },

        // type_item: 3 field(s)
        type_item: {
            0: field('visibility_modifier'), // visibility_modifier [struct=0]
            4: field('where_clause'), // where_clause [struct=1]
            7: field('trailing_where_clause'), // where_clause [struct=2]
        },

        // unary_expression — label both the operator token (pos 0) and
        // the operand expression (pos 1). overrides.json promotes both
        // to fields at readNode time; the walker needs matching IR
        // fields so the template emits `$OPERATOR$OPERAND` instead of
        // `$OPERATOR $$$CHILDREN` (which reads empty after field promotion).
        unary_expression: {
            0: field('operator'), // choice('-', '*', '!')
            1: field('operand'),  // $._expression
        },

        // union_item: 2 field(s)
        union_item: {
            0: field('visibility_modifier'), // visibility_modifier [struct=0]
            4: field('where_clause'), // where_clause [struct=1]
        },

        // unsafe_block: 1 field(s)
        unsafe_block: {
            1: field('block'), // block [struct=0]
        },

        // use_declaration: 1 field(s)
        use_declaration: {
            0: field('visibility_modifier'), // visibility_modifier [struct=0]
        },

        // use_wildcard: 1 field(s)
        use_wildcard: {
            0: field('path'), // crate | identifier | metavariable | scoped_identifier | self | super [struct=0]
        },

        // variadic_parameter: 1 field(s)
        variadic_parameter: {
            0: field('mutable_specifier'), // mutable_specifier [struct=0]
        },

        // while_expression: 1 field(s)
        while_expression: {
            0: field('label'), // label [struct=0]
        },
    },
    rules: {
        // ---------------------------------------------------------------------------
        // Polymorph-interleaved transforms: must run on raw `original` before
        // polymorphs wrap the choice arms. In wire(), polymorphs run first (they
        // compose as userFn in buildPolymorphParentFn), then the synthesized
        // transform fn applies on top. Rules whose transforms navigate INTO the
        // same paths that polymorphs replace (e.g. '0/2' after '0' → variant)
        // must stay here so the polymorph wrapper calls them first.
        // ---------------------------------------------------------------------------

        // array_expression: polymorph split — auto-hoist includes `[`/`]`
        // in each alias body and uses INLINE alias (no new named hidden
        // rule), so tree-sitter's state machine doesn't have to reconcile
        // a new symbol against its auto-generated _repeat1 helpers.
        // Must stay in rules: — kind-match '2/_expression' fails after
        // polymorph wraps 2/0 and 2/1 with aliases (kind-match finds no
        // _expression occurrences in the alias-wrapped choice).
        array_expression: ($, original) => transform(original,
            { 1: field('attributes') },
            { '2/_expression': field('elements') },
        ),

        // or_pattern — patches the BASE rule's prec.left(-2, ...)
        // structure to add field labels. Base shape:
        //   choice(seq(_pattern, '|', _pattern), seq('|', _pattern))
        // Must stay in rules: — paths '0/0', '0/2', '1/1' navigate into
        // choice arms that polymorphs replace with aliases at paths '0', '1'.
        or_pattern: ($, original) => transform(original,
            { '0/0': field('left'), '0/2': field('right'), '1/1': field('right') },
        ),

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
        // Must stay in rules: — paths '0/0', '0/2', etc. navigate into
        // choice arms that polymorphs replace with aliases at paths '0'–'3'.
        range_expression: ($, original) => transform(original,
            {
                '0/0': field('start'), '0/1': field('operator'), '0/2': field('end'),
                '1/0': field('start'), '1/1': field('operator'),
                '2/0': field('operator'), '2/1': field('end'),
                '3': field('operator'),
            },
        ),

        // ---------------------------------------------------------------------------
        // New overrides — expressing field routing previously only in overrides.json
        // ---------------------------------------------------------------------------

        // function_modifiers — full replacement: label each choice alternative
        // so readNode can route `async`, `const`, `default`, `unsafe` tokens.
        // Route the bare-keyword strings through `_kw_<name>` hidden rules
        // (declared below) so FIELD survives tree-sitter normalization —
        // FIELD around bare STRING gets stripped; FIELD around SYMBOL survives.
        function_modifiers: ($) => repeat1(choice(
            field('async', $._kw_async),
            field('default', $._kw_default),
            field('const', $._kw_const),
            field('unsafe', $._kw_unsafe),
            $.extern_modifier,
        )),

        // Hand-authored `_kw_<name>` hidden rules. Required for
        // function_modifiers and visibility_modifier to route bare
        // keywords through SYMBOLs so FIELD wrappers survive. These
        // could also live in a shared module if more grammars start
        // needing the same keyword set; for now, rust is the only one.
        _kw_async:   $ => 'async',
        _kw_default: $ => 'default',
        _kw_const:   $ => 'const',
        _kw_unsafe:  $ => 'unsafe',
        _kw_pub:     $ => 'pub',
        _kw_in:      $ => 'in',

        // _pattern — the wildcard `_` is a bare literal alternative
        // (position 20) of the _pattern supertype choice. At multi-valued
        // list positions (rust `sepBy(',', $._pattern)` used by
        // tuple_struct_pattern, tuple_pattern, slice_pattern, closure
        // parameters) tree-sitter surfaces `_` as an anonymous child,
        // which readNode promotes to $fields['_'] and $$$CHILDREN's
        // named-only filter subsequently drops. Aliasing `_` to a named
        // `wildcard_pattern` kind gives it a proper node in the tree so
        // every `_pattern` list position round-trips cleanly without any
        // render-side heuristics. The hidden `_wildcard_pattern` rule is
        // declared explicitly below so tree-sitter's `ruleMap` snapshot
        // picks it up — no runtime synthesis, no wrapper machinery.
        _pattern: ($, original) => transform(original, {
            '-1': alias($._wildcard_pattern, $.wildcard_pattern),
        }),

        // The hidden rule `_wildcard_pattern` is just the `_` literal;
        // the named alias on `_pattern` above promotes it to a proper
        // `wildcard_pattern` kind at parse time.
        _wildcard_pattern: $ => '_',

        // visibility_modifier — label the `pub` keyword and the `in` keyword
        // (inside `pub(in path)`) so readNode can route them to named fields.
        visibility_modifier: ($) => choice(
            $.crate,
            seq(
                field('pub', $._kw_pub),
                optional(seq(
                    '(',
                    choice(
                        $.self,
                        $.super,
                        $.crate,
                        seq(field('in', $._kw_in), $._path),
                    ),
                    ')',
                )),
            ),
        ),

    },
}))
