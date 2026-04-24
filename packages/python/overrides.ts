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
import { transform, role, enrich, field, wire } from '../codegen/src/dsl/index.ts'

export default grammar(enrich(base), wire({
    name: 'python',
    // Structural-whitespace role bindings — declared inline in the
    // externals callback. `role(symbolRef, name)` returns the symbol
    // unchanged (so externals still receives a valid token reference)
    // and records the binding on a per-grammar accumulator that Link
    // reads to drive symbol resolution. No more dummy `_indent` rules.
    externals: ($, prev) => {
        // Mark existing base externals with sittir roles. role() records
        // the binding as a side-effect (sittir runtime) and returns the
        // symbol unchanged. Returning `prev` directly avoids duplicating
        // the externals list — tree-sitter's grammar() doesn't dedupe,
        // so spreading prev plus role() returns would emit each token
        // twice and the generated parser.c would fail to compile.
        role($._indent,  'indent')
        role($._dedent,  'dedent')
        role($._newline, 'newline')
        return prev
    },
    conflicts: ($, previous) => (previous ?? []).concat([
        // expression_statement tuple-variant extraction: the bare
        // `expression` arm and the hoisted `_expression_statement_tuple`
        // both start with `expression • …`. In the base grammar
        // tree-sitter's LR(1) table merged the common prefix into a
        // single state; with the tuple form lifted into its own hidden
        // rule, tree-sitter needs an explicit GLR fork group to decide
        // between the bare expression and the tuple form on the `,`
        // suffix that only the tuple accepts.
        [$.expression_statement, $._expression_statement_tuple],
    ]),
    polymorphs: {
        assignment: { '1/0': 'eq', '1/1': 'type', '1/2': 'typed' },

        // expression_statement: bare expression / comma-separated tuple
        // form / assignment / augmented_assignment / yield. Arms 0, 2,
        // 3, 4 are bare symbol refs to existing visible kinds — the
        // classifier treats the all-symbol shape as canonical, so they
        // need no adoption. Arm 1 is the structural seq (tuple form);
        // adopting it wraps the seq in an alias so the rule becomes an
        // all-symbol choice from the walker's perspective. The
        // `conflicts` entry above tells tree-sitter to fork between
        // `expression` and `_expression_statement_tuple` when the LR
        // table sees `expression • …` and needs to decide on the `,`
        // continuation only the tuple form accepts.
        expression_statement: {
            1: 'tuple',
        },

        // with_clause: bare (`a, b, c`) vs parenthesized (`(a, b, c)`).
        // Same with_item content on both arms; paren form wraps with
        // '(' ... ')'. Split per variant so each owns its template.
        with_clause: {
            0: 'bare',
            1: 'paren',
        },

        // _match_block: base rule is
        //   choice(
        //     seq($._indent, repeat(field('alternative', $.case_clause)),
        //         $._dedent),                         // arm 0 — block form
        //     $._newline,                             // arm 1 — empty form
        //   )
        // Heterogeneous: one seq + one bare symbol. Splitting the seq arm
        // into `_match_block_block` leaves the remaining choice as all
        // symbol-like (alias + symbol) — canonical.
        _match_block: { 0: 'block' },
    },
    transforms: {
        // as_pattern: 1 field(s)
        as_pattern: {
            0: field('expression'), // expression | case_pattern | identifier [struct=0]
        },

        // await: 1 field(s)
        await: {
            1: field('primary_expression'), // primary_expression [struct=0]
        },

        // chevron: 1 field(s)
        chevron: {
            1: field('expression'), // expression [struct=0]
        },

        // class_pattern: 2 field(s)
        class_pattern: {
            0: field('dotted_name'), // dotted_name [struct=0]
            2: field('arguments'), // case_pattern [struct=1]
        },

        // comparison_operator: 2 field(s)
        comparison_operator: {
            0: field('left'), // primary_expression [struct=0]
            1: field('comparators'), // primary_expression [struct=1]
        },

        // complex_pattern: 2 field(s)
        complex_pattern: {
            0: field('real'), // integer | float [struct=0]
            1: field('imaginary'), // integer | float [struct=1]
        },

        // conditional_expression: 3 field(s)
        conditional_expression: {
            0: field('body'), // expression [struct=0]
            2: field('condition'), // expression [struct=1]
            4: field('alternative'), // expression [struct=2]
        },

        // constrained_type: 2 field(s)
        constrained_type: {
            0: field('base_type'), // type [struct=0]
            2: field('constraint'), // type [struct=1]
        },

        // decorator: 2 field(s)
        decorator: {
            1: field('expression'), // expression [struct=0]
            2: field('newline'), //  [struct=1]
        },

        // dictionary_splat: 1 field(s)
        dictionary_splat: {
            1: field('expression'), // expression [struct=0]
        },

        // exec_statement: grammar is seq('exec', code, optional(seq('in', exprs)))
        // Template walker emits the `in` keyword as a literal at top level,
        // which surfaces in rendering even when the optional(seq(...))
        // didn't match. Wrap the optional as field('in_clause') so the
        // whole clause (`in` + exprs) renders only when present.
        exec_statement: {
            2: field('in_clause'),
        },

        // finally_clause: 1 field(s)
        finally_clause: {
            2: field('block'), // block [struct=0]
        },

        // generic_type: 2 field(s)
        generic_type: {
            0: field('identifier'), // identifier [struct=0]
            1: field('type_parameter'), // type_parameter [struct=1]
        },

        // if_clause: 1 field(s)
        if_clause: {
            1: field('expression'), // expression [struct=0]
        },

        // import_from_statement: 1 field(s)
        import_from_statement: {
            3: field('wildcard_import'), // wildcard_import [struct=0]
        },

        // keyword_pattern: 2 field(s)
        keyword_pattern: {
            0: field('identifier'), // identifier | class_pattern | complex_pattern | concatenated_string | dict_pattern | dotted_name | false | float | integer | list_pattern | none | splat_pattern | string | true | tuple_pattern | union_pattern [struct=0]
            2: field('simple_pattern'), // _simple_pattern | class_pattern | complex_pattern | concatenated_string | dict_pattern | dotted_name | false | float | integer | list_pattern | none | splat_pattern | string | true | tuple_pattern | union_pattern [struct=1]
        },

        // list_splat: 1 field(s)
        list_splat: {
            1: field('expression'), // expression | attribute | identifier | subscript [struct=0]
        },

        // member_type: 2 field(s)
        member_type: {
            0: field('base_type'), // type [struct=0]
            2: field('identifier'), // identifier [struct=1]
        },

        // relative_import: 2 field(s)
        relative_import: {
            0: field('import_prefix'), // import_prefix [struct=0]
            1: field('dotted_name'), // dotted_name [struct=1]
        },

        // slice: 3 field(s)
        slice: {
            0: field('start'), // expression [struct=0]
            2: field('stop'), // expression [struct=1]
            3: field('step'), // expression [struct=2]
        },

        // splat_pattern: 1 field(s)
        splat_pattern: {
            0: field('identifier'), // identifier [struct=0]
        },

        // splat_type: 1 field(s)
        splat_type: {
            0: field('identifier'), // identifier [struct=0]
        },

        // string: 3 field(s)
        string: {
            0: field('string_start'), // string_start [struct=0]
            1: field('content'), // interpolation | string_content [struct=1]
            2: field('string_end'), // string_end [struct=2]
        },

        // type_alias_statement: wrap base position 0 (bare 'type' literal)
        // as field('type') so $fields.type carries the keyword. Without
        // this override, enrich's bare-leading-keyword pass (globally off
        // — rust corpus regresses with it on) leaves the literal
        // unwrapped, and $fields only has left/right. The spec-008-US7
        // regression test (python type_alias_statement collision)
        // assumes the wrapped form.
        type_alias_statement: {
            0: field('type'),
        },

        // try_statement: 3 field(s)
        try_statement: {
            3: field('except_clauses'), // except_clause [struct=0]
            4: field('else_clause'), // else_clause [struct=1]
            5: field('finally_clause'), // finally_clause [struct=2]
        },

        // union_type: 2 field(s)
        union_type: {
            0: field('left'), // type [struct=0]
            2: field('right'), // type [struct=1]
        },
    },
    rules: {},
}))
