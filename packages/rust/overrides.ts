/**
 * overrides.ts — Grammar extension for rust
 *
 * Converted from overrides.json. Each entry wraps an unnamed child
 * at a positional index with a named field.
 *
 * @generated from overrides.json — review before committing
 */

// @ts-nocheck — grammar.js is untyped; overrides use sittir DSL.
// The `wire<RustGrammar>` generic below still binds kind-name
// autocomplete + typo protection to `polymorphs` / `transforms` /
// `rules` keys; @ts-nocheck only suppresses errors on the untyped
// `grammar(...)` / `$._rule` / `base` surface.
import base from '../../node_modules/.pnpm/tree-sitter-rust@0.24.0/node_modules/tree-sitter-rust/grammar.js'
import { transform, enrich, field, alias, variant, wire } from '../codegen/src/dsl/index.ts'
import type { RustGrammar } from './src/grammar.ts'


export default grammar(enrich(base), wire<RustGrammar>({
    name: 'rust',
    // `previous` is the base grammar's conflicts list — concat so we
    // don't drop the base entries (`$._type`, `$._pattern`, etc.).
    conflicts: ($, previous) => [...(previous ?? []),
        // match_arm split: the `seq(expr, ',')` vs block-ending variants
        // expose a shared-prefix conflict with other expression
        // contexts when the parser sees `… => if_expr (`.
        [$._expression_except_range, $._match_arm_block_ending],
        // visibility_modifier variant extraction: `pub(crate)` vs
        // `crate::foo` share the `crate` prefix.
        [$.scoped_identifier, $.scoped_type_identifier, $._visibility_modifier_crate],
        // visibility_modifier variant extraction: `pub` vs `pub(x)`
        // share the `pub` prefix; parser needs lookahead.
        [$._visibility_modifier_pub],
    ],
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
        // range_pattern: the base rule is
        //   choice(
        //     seq(field('left', X), choice(             ← 0
        //       seq(enum('...', '..=', '..'), field('right', X)),  ← 0/1/0 "left_with_right"
        //       '..',                                               ← 0/1/1 "left_bare"
        //     )),
        //     seq(enum, field('right', X)),             ← 1 "prefix"
        //   )
        // Flatten the adoption so the inner-choice arms get their own
        // variant names — the asymmetry (`..=`/`...` require a right,
        // bare `..` doesn't) means these are genuine structural variants.
        range_pattern:       { '0/1/0': 'left_with_right', '0/1/1': 'left_bare', '1': 'prefix' },
        struct_item:         { '4/0': 'brace', '4/1': 'tuple', '4/2': 'unit' },
        visibility_modifier: { '0': 'crate', '1': 'pub' },
        // `_visibility_modifier_pub` is the body of `visibility_modifier`'s
        // `pub` arm — `seq('pub', optional(seq('(', choice(self, super,
        // crate, seq('in', _path)), ')')))`. The inner choice has three
        // bare symbols plus one seq (`seq('in', _path)`), which makes it
        // heterogeneous. Split the seq arm into its own variant so the
        // inner choice becomes four bare symbols (canonical).
        _visibility_modifier_pub: { '1/0/1/3': 'in_path' },
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

        // array_expression polymorph splits '2/0' (semi) / '2/1' (list).
        // These base-shape patches add field labels BEFORE polymorph
        // aliasing — composition-order inversion in wire() lets this
        // flow declaratively instead of inline in rules:.
        array_expression: [
            { 1: field('attributes') },
            { '2/(_expression)': field('elements') },
        ],

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

        // or_pattern polymorph splits '0' (binary) / '1' (prefix).
        // Field labels land on base-shape choice arms pre-alias.
        or_pattern: {
            '0/0': field('left'), '0/2': field('right'), '1/1': field('right'),
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

        // range_expression polymorph splits '0'..'3'. Field labels
        // land on base-shape choice arms pre-alias.
        range_expression: {
            '0/0': field('start'), '0/1': field('operator'), '0/2': field('end'),
            '1/0': field('start'), '1/1': field('operator'),
            '2/0': field('operator'), '2/1': field('end'),
            '3': field('operator'),
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

        // self_parameter: canonical tree-sitter-rust has no fields here;
        // labels below are ours. `&` is the lifetime marker (pos 0,
        // routed through _kw_lifetime so FIELD survives). `$.lifetime`
        // at pos 1 is the explicit lifetime name ('a etc.) — distinct
        // name to avoid colliding with pos 0's label.
        self_parameter: {
            0: field('lifetime'),          // optional('&')
            1: field('lifetime_name'),     // optional($.lifetime)
            2: field('mutable_specifier'), // optional($.mutable_specifier)
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
            '(_expression)': field('elements'),
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

        // expression_statement: choice(seq(_expression, ';'),
        //                              prec(1, _expression_ending_with_block)).
        // Heterogeneous — the ';'-terminated form and the block-ending
        // form have structurally distinct templates. Each becomes its
        // own variant child kind.
        expression_statement: {
            0: variant('with_semi'),
            1: variant('block_ending'),
        },

        // foreign_mod_item: choice at pos 2 between ';' (bare extern
        // decl) and field('body', declaration_list) (block extern).
        // Variant-adopt so each arm owns its own template.
        foreign_mod_item: {
            '2/0': variant('semi'),
            '2/1': variant('body'),
        },

        // pointer_type: choice('const', mutable_specifier) at pos 1.
        // Literal 'const' vs symbol → split arms.
        pointer_type: {
            '1/0': variant('const'),
            '1/1': variant('mut'),
        },

        // reference_expression: inner choice at path 1/0/1 selects
        // `const` vs `mutable_specifier` inside the `&raw (…) …`
        // form. Same const-vs-mut shape as pointer_type.
        reference_expression: {
            '1/0/1/0': variant('raw_const'),
            '1/0/1/1': variant('raw_mut'),
        },

        // match_arm: choice(seq(field('value',expr), ','),
        //                   field('value', prec(1, _expr_ending_with_block)))
        // The ','-terminated form vs block-ending form have distinct
        // literals. Split arms.
        match_arm: {
            '3/0': variant('with_comma'),
            '3/1': variant('block_ending'),
        },

        // line_comment: choice at pos 1 between regular double-slash,
        // doc-comment, and regular content. Each arm has its own
        // distinct literal prefix.
        line_comment: {
            '1/0': variant('regular_dslash'),
            '1/1': variant('doc'),
            '1/2': variant('content'),
        },

        // token_tree_pattern / token_tree / delim_token_tree: each is
        // choice(seq('(', repeat(inner), ')'), seq('[', ..., ']'), seq('{', ..., '}')).
        // Three delimiter-variants — distinct opening/closing literals per
        // arm, same inner content. Split so each arm owns its template.
        token_tree_pattern: {
            0: variant('paren'),
            1: variant('bracket'),
            2: variant('brace'),
        },
        token_tree: {
            0: variant('paren'),
            1: variant('bracket'),
            2: variant('brace'),
        },
        delim_token_tree: {
            0: variant('paren'),
            1: variant('bracket'),
            2: variant('brace'),
        },

        // _let_chain: left-recursive `_let_chain && let_condition` vs
        // base `let_condition`. Hidden rule — tree-sitter flattens the
        // recursion at parse time, so variant() adoption would emit
        // unreachable `_let_chain_and` / `_let_chain_base` kinds. The
        // non-canonical audit for this kind reflects the derive walker's
        // view of an inlined helper; it doesn't surface as a user-facing
        // shape. Leave as-is.

        // block_comment: deferred. Inner choice at `1/0` branches on
        // doc-marker form vs bare `_block_comment_content`, but the
        // latter is an EXTERNAL token (lexer callback). Variant hoist
        // tries to reference `_block_comment_content` from a generated
        // hidden rule, and tree-sitter rejects it as "used as both an
        // external token and a non-terminal rule." Resolving this
        // needs either conflicts-awareness in the hoist or a
        // merge-branches path that doesn't extract the external-token
        // branch.

    },
    rules: {
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
        _kw_async:   $ => prec(-1, 'async'),
        _kw_default: $ => prec(-1, 'default'),
        _kw_const:   $ => prec(-1, 'const'),
        _kw_unsafe:  $ => prec(-1, 'unsafe'),
        _kw_pub:     $ => prec(-1, 'pub'),
        _kw_in:      $ => prec(-1, 'in'),

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
        //
        // Why inline here instead of declarative `transforms:` — the
        // patch value needs `$` (tree-sitter's symbol proxy) at call
        // time. `transforms:` values are evaluated at config-object-
        // literal time, before `$` exists. See ADR-0009 §Task-7.
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
