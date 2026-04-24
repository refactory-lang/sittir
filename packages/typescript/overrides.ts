/**
 * overrides.ts — Grammar extension for typescript
 *
 * Converted from overrides.json. Each entry wraps an unnamed child
 * at a positional index with a named field.
 *
 * @generated from overrides.json — review before committing
 */

// @ts-nocheck — grammar.js is untyped
// Use the typescript (non-tsx) grammar so the codegen surface matches
// the reparse target (`WASM_PATHS.typescript` loads the non-tsx wasm).
// Previously imported `tsx/grammar.js` — harmless for the current
// non-JSX corpus but a latent mismatch: anything JSX-shaped would
// reparse-fail. Pick one grammar and stick with it end-to-end.
import base from '../../node_modules/.pnpm/tree-sitter-typescript@0.23.2/node_modules/tree-sitter-typescript/typescript/grammar.js'
import { transform, enrich, field, wire, refine, variant } from '../codegen/src/dsl/index.ts'

export default grammar(enrich(base), wire({
    name: 'typescript',
    // Conflict markers for variant() adoption on kinds where splitting
    // exposes LR(1) ambiguities the unsplit grammar resolved via shared
    // state. Each entry names two or more rules tree-sitter should
    // treat as requiring a GLR state so it can defer the decision
    // until more input disambiguates. Hidden (`_foo`) and visible
    // (`$.foo`) names are both valid here.
    // `previous` is the TS grammar's own conflicts list (which
    // itself concats the JS base's conflicts). Concat so we don't
    // drop the base entries — we only ADD the new ones required by
    // variant() adoption.
    conflicts: ($, previous) => (previous ?? []).concat([
        // parenthesized_expression split: `( expression )` vs
        // `( sequence_expression )` share the expression prefix. The
        // typed variant's hidden rule (`_parenthesized_expression_typed`)
        // competes with `sequence_expression` when the parser sees
        // `( expression •`. GLR resolves based on what follows.
        [$.sequence_expression, $._parenthesized_expression_typed],
        // Also exposes a latent `async` ambiguity — before the split,
        // tree-sitter resolved `async (` via state shared between the
        // typed parenthesized expression and arrow_function's call
        // signature. With the typed variant lifted to its own hidden
        // rule, the parser needs explicit GLR to decide whether `async
        // (` starts a call (primary_expression) or an arrow function.
        [$.primary_expression, $.arrow_function],
        // `export` as `primary_expression` vs as `_property_name`
        // surfaces once the typed-parenthesized variant brings more
        // expression contexts into the same state.
        [$.primary_expression, $._property_name],
        [$.labeled_statement, $._property_name],
        [$.object, $.object_pattern],
        [$.primary_expression, $.method_definition],
        [$.primary_expression, $.arrow_function, $._property_name],
        [$.call_expression, $.binary_expression, $.unary_expression, $.instantiation_expression],
        [$.assignment_expression, $.pattern],
        [$.primary_expression, $.pattern],
        [$.primary_expression, $._parameter_name],
        [$.call_expression, $.await_expression, $.binary_expression, $.instantiation_expression],
        [$.array, $.array_pattern],
        [$.primary_type, $.type_parameter],
        [$.call_expression, $.binary_expression, $.update_expression, $.instantiation_expression],
        [$.primary_expression, $.rest_pattern],
        [$._for_header, $.primary_expression],
        [$.class],
        [$.class_static_block, $._property_name],
        [$.primary_expression, $.literal_type],
        [$.pattern, $.primary_type],
        [$.primary_expression, $.primary_type],
        [$.primary_expression, $.nested_identifier, $.nested_type_identifier],
        [$.primary_expression, $.generic_type],
        [$._parameter_name, $.primary_type],
        [$.primary_expression, $.predefined_type],
        [$._call_signature, $.function_type],
        [$.optional_tuple_parameter, $.primary_type],
        [$.call_expression, $.binary_expression, $.instantiation_expression],
        [$.object_assignment_pattern, $.assignment_expression],
        [$.array, $.computed_property_name],
        [$.variable_declarator, $._for_header],
        [$.object, $.object_pattern, $._property_name],
        [$.object_pattern, $.object_type],
        [$.object, $.object_type],
        [$.primary_expression, $.pattern, $.primary_type],
        [$.primary_expression, $._parameter_name, $.primary_type],
        [$.array, $.array_pattern, $.tuple_type],
        [$.array_pattern, $.tuple_type],
        [$.array, $.tuple_type],
        [$._call_signature, $.constructor_type],
        [$.template_string, $.template_literal_type],
        [$.object, $.object_pattern, $.object_type],
        [$.primary_expression, $.rest_pattern, $.primary_type],
        [$.primary_expression, $.rest_pattern, $.literal_type],
        [$.primary_expression, $.rest_pattern, $.predefined_type],
        [$.nested_identifier, $.nested_type_identifier],
        [$._initializer, $.binary_expression],
        [$.primary_expression, $._export_statement_namespace_export],
        [$.binary_expression, $.unary_expression, $.instantiation_expression, $._call_expression_call],
        [$.await_expression, $.binary_expression, $.instantiation_expression, $._call_expression_call],
        [$.binary_expression, $.update_expression, $.instantiation_expression, $._call_expression_call],
        [$.binary_expression, $.instantiation_expression, $._call_expression_call],
        [$._type_query_call_expression_in_type_annotation, $._call_expression_call],
        [$._type_query_call_expression, $._call_expression_call],
        [$.primary_expression, $._export_statement_default],
        // update_expression variant extraction: the hoisted
        // `_update_expression_postfix` / `_update_expression_prefix`
        // hidden rules inherit the outer `prec.left(0, ...)`, but after
        // extraction they compete with `await_expression` (prec
        // 'unary_void') on the `await expr • '++' …` / `'++' • expr`
        // sequences. Before the split, one `update_expression` rule
        // carried the whole choice under one prec declaration;
        // tree-sitter's LR table handled disambiguation internally.
        // After splitting, both hidden rules each have `prec 0` and
        // compete with `await_expression` individually — GLR is the
        // only resolver. Declare the conflict groups explicitly.
        [$.await_expression, $._update_expression_postfix],
        [$.await_expression, $._update_expression_prefix],
        [$.arrow_function, $._update_expression_postfix],
        [$.arrow_function, $._update_expression_prefix],
        // _export_statement_default outer split inherits the outer
        // `_export_statement_default` vs primary_expression conflict on
        // the `export` prefix, propagated to the two outer variants.
        [$.primary_expression, $._export_statement_default_from_arm],
        [$.primary_expression, $._export_statement_default_decl_arm],
        // class_body repeat-choice split: the `method` arm ends with
        // `optional(_semicolon)` — tree-sitter can't decide whether to
        // consume the `;` as part of `_class_body_method` or as the
        // next iteration's start. Self-conflict tells it to fork.
        [$._class_body_method],
        // class_body repeat-choice: `method_signature` can appear both
        // in the `method_sig` arm (followed by `_function_signature_…`
        // or `,`) and in the `member` arm (wrapped in a choice-of-
        // member-kinds). Shared prefix requires a GLR fork.
        [$._class_body_method_sig, $._class_body_member],
        // _for_header variant splits: each sub-variant inherits the
        // for-header's identifier-prefix ambiguity.
        [$.primary_expression, $._for_header_lhs],
        [$.primary_expression, $._for_header_var_kind],
        [$.primary_expression, $._for_header_let_const_kind],
        [$.variable_declarator, $._for_header_var_kind],
        [$.variable_declarator, $._for_header_let_const_kind],
    ]),
    // Inline the `public_field_definition` variants so the LR table
    // retains the pre-split state — each variant body is folded back
    // into `public_field_definition` at the alias site. Inlining keeps
    // the alias so sittir's post-polymorph canonical shape is
    // preserved AND the parse tree still surfaces the named variant
    // kind, while tree-sitter's state machine sees the unrolled shape
    // and avoids LR conflicts that the split would otherwise create.
    inline: ($, previous) => (previous ?? []).concat([
        $._public_field_definition_declare_first,
        $._public_field_definition_access_first,
        $._public_field_definition_static_mods,
        $._public_field_definition_abstract_first,
        $._public_field_definition_readonly_first,
        $._public_field_definition_accessor_opt,
    ]),
    polymorphs: {
        arrow_function:  { '1/0': 'parameter',        '1/1': '_call_signature' },
        class_heritage:  { '0':   'extends_clause',   '1':   'implements_clause' },
        import_clause:   { '0':   'namespace_import', '1':   'named_imports',    '2': 'default_import' },
        import_specifier: { '1/0': 'name',             '1/1': 'as' },
        index_signature: { '2/0': 'colon',             '2/1': 'mapped_type_clause' },

        // _export_statement_default — synthesized by
        // `export_statement: { 0: variant('default') }` transform. Body
        // is a two-arm heterogeneous choice:
        //   arm 0: `seq('export', choice(4 from-clause shapes), _semicolon)`
        //   arm 1: `seq(repeat(field('decorator',…)), 'export',
        //             choice(field('declaration',…), seq('default', …)))`
        // Top-level split.
        _export_statement_default: { 0: 'from_arm', 1: 'decl_arm' },

        // _export_statement_default_from_arm body:
        //   `seq('export', choice(4 from-clause shapes), _semicolon)`
        // Inner choice at path 1 has 3 seqs + 1 bare symbol — split the
        // 3 seqs so the remaining choice is all symbol-like.
        _export_statement_default_from_arm: {
            '1/0': 'star_from',       // seq('*', _from_clause)
            '1/1': 'ns_from',         // seq(namespace_export, _from_clause)
            '1/2': 'clause_from',     // seq(export_clause, _from_clause)
        },

        // _export_statement_default_decl_arm body:
        //   `seq(repeat(field('decorator',…)), 'export', choice(
        //       field('declaration', declaration),
        //       seq('default', choice(
        //           field('declaration', declaration),
        //           seq(field('value', expression), _semicolon),
        //       )),
        //   ))`
        // Split outer and nested default-arm choices at every unique
        // heterogeneous path — multi-level adoption hits the leaves
        // directly rather than cascading through intermediate kinds.
        _export_statement_default_decl_arm: {
            '2/1': 'default_kw',     // seq('default', …)
        },
        _export_statement_default_decl_arm_default_kw: {
            '1/1': 'value',           // seq(field('value', expression), _semicolon)
        },

        // class_body body: `seq('{', repeat(choice(5 arms)), '}')`.
        // Inner repeat-choice has 3 heterogeneous seqs, 1 bare symbol
        // (class_static_block), 1 bare literal (';'). Split the 3 seqs
        // so the choice becomes symbol-like across all arms.
        class_body: {
            '1/0/0': 'method',         // seq(repeat(field(decorator,…)), method_definition, optional(_semicolon))
            '1/0/1': 'method_sig',     // seq(method_signature, choice(…))
            '1/0/3': 'member',         // seq(choice(4 member kinds), choice(_semicolon, ','))
        },

        // _for_header body (base-grammar hidden):
        //   seq('(', choice(3 arms), field('operator', choice('in','of')),
        //       field('right', _expressions), ')')
        //   arm 0: field('left', choice(_lhs_expression, parenthesized_expression))
        //   arm 1: seq(field('kind','var'), field('left',…), optional(_initializer))
        //   arm 2: seq(field('kind', choice('let','const')), field('left',…),
        //              optional(_automatic_semicolon))
        // Split each arm so the outer choice becomes all symbol-like.
        _for_header: {
            '1/0': 'lhs',
            '1/1': 'var_kind',
            '1/2': 'let_const_kind',
        },

        // public_field_definition body position 1:
        //   optional(choice(
        //     seq('declare', optional(accessibility_modifier)),
        //     seq(accessibility_modifier, optional(field('declare', _kw_declare))),
        //   ))
        // Split both arms and INLINE the synthesized hidden rules (see
        // `inline:` below). Inlining is critical here: the `access_first`
        // arm reduces to "just accessibility_modifier" which conflicts
        // with every class-member rule sharing that prefix
        // (`method_definition`, `method_signature`,
        // `abstract_method_signature`). Keeping them as standalone
        // hidden rules produces an unresolvable LR state that
        // tree-sitter can't disambiguate via conflict groups alone.
        // Inlining folds each arm's body back into `public_field_definition`'s
        // state machine — the LR table looks exactly like the pre-split
        // grammar at the conflict site, while sittir's derive-audit
        // still sees the post-polymorph shape (all-alias choice) as
        // canonical. Variant adoption stays a pure sittir-side concern;
        // tree-sitter parses the same tree as before.
        public_field_definition: {
            '1/0/0': 'declare_first',
            '1/0/1': 'access_first',
            // Position 2: a four-arm modifier choice (heterogeneous).
            '2/0': 'static_mods',
            '2/1': 'abstract_first',
            '2/2': 'readonly_first',
            '2/3': 'accessor_opt',
        },
    },
    transforms: {
        // abstract_class_declaration: wrap pos 5 (class_heritage choice).
        // pos 0 is REPEAT(field('decorator')) — don't touch it, it's a real
        // base-grammar field and the original override clobbered it.
        abstract_class_declaration: {
            5: field('class_heritage'),
        },

        // abstract_method_signature: 2 field(s)
        abstract_method_signature: {
            0: field('accessibility_modifier'), // accessibility_modifier [struct=0]
            2: field('override_modifier'), // override_modifier [struct=1]
        },

        // ambient_declaration: 3 field(s)
        ambient_declaration: {
            1: field('declaration'), // declaration | statement_block | property_identifier [struct=0]
        },

        // array_type: 1 field(s)
        array_type: {
            0: field('primary_type'), // primary_type [struct=0]
        },

        // as_expression: 2 field(s)
        as_expression: {
            0: field('expression'), // expression [struct=0]
            2: field('type_annotation'), // type [struct=1]
        },

        // asserts_annotation: 1 field(s)
        asserts_annotation: {
            0: field('asserts'), // asserts [struct=0]
        },

        // await_expression: 1 field(s)
        await_expression: {
            1: field('expression'), // expression [struct=0]
        },

        // class: wrap pos 4 (class_heritage choice). pos 0 is decorator repeat.
        class: {
            4: field('class_heritage'),
        },

        // class_declaration: wrap pos 4 (class_heritage choice) and pos 6
        // (automatic_semicolon choice). pos 0 is decorator repeat — leave it
        // alone so the base 'decorator' field survives.
        class_declaration: {
            4: field('class_heritage'),
            6: field('automatic_semicolon'),
        },

        // computed_property_name: 1 field(s)
        computed_property_name: {
            1: field('expression'), // expression [struct=0]
        },

        // else_clause: 1 field(s)
        else_clause: {
            1: field('statement'), // statement [struct=0]
        },

        // enum_body: 2 field(s)
        enum_body: {
            1: field('opening'), // enum_assignment [struct=0]
        },

        // flow_maybe_type: 1 field(s)
        flow_maybe_type: {
            1: field('primary_type'), // primary_type [struct=0]
        },

        // import_alias: 3 field(s)
        import_alias: {
            1: field('name'), // identifier [struct=0]
            3: field('value'), // identifier | nested_identifier [struct=1]
            4: field('semicolon'), //  [struct=2]
        },

        // import_attribute: 1 field(s)
        import_attribute: {
            0: field('object'), // object [struct=0]
        },

        // import_require_clause: 1 field(s)
        import_require_clause: {
            0: field('identifier'), // identifier [struct=0]
        },

        // import_statement: 4 field(s)
        import_statement: {
            1: field('import_clause'), // import_clause | import_require_clause [struct=0]
            2: field('from_clause'), //  [struct=1]
            3: field('import_attribute'), // import_attribute [struct=2]
            4: field('semicolon'), //  [struct=3]
        },

        // index_type_query: 1 field(s)
        index_type_query: {
            1: field('primary_type'), // primary_type [struct=0]
        },

        // infer_type: 2 field(s)
        infer_type: {
            1: field('type_identifier'), // _type_identifier | type_identifier [struct=0]
            2: field('constraint'), // type | type_identifier [struct=1]
        },

        // instantiation_expression: 1 field(s)
        instantiation_expression: {
            0: field('expression'), // expression [struct=0]
        },

        // interface_declaration: 1 field(s)
        interface_declaration: {
            3: field('extends_type_clause'), // extends_type_clause [struct=0]
        },

        // intersection_type: 2 field(s)
        intersection_type: {
            0: field('left'), // type [struct=0]
            2: field('right'), // type [struct=1]
        },

        // lexical_declaration: 2 field(s)
        lexical_declaration: {
            1: field('declarators'), // variable_declarator [struct=0]
            2: field('semicolon'), //  [struct=1]
        },

        // lookup_type: 2 field(s)
        lookup_type: {
            0: field('primary_type'), // primary_type [struct=0]
            2: field('index_type'), // type [struct=1]
        },

        // method_definition: 2 field(s)
        method_definition: {
            0: field('accessibility_modifier'), // accessibility_modifier [struct=0]
            1: field('override_modifier'), // override_modifier [struct=1]
        },

        // method_signature: 2 field(s)
        method_signature: {
            0: field('accessibility_modifier'), // accessibility_modifier [struct=0]
            1: field('override_modifier'), // override_modifier [struct=1]
        },

        // namespace_import: 1 field(s)
        namespace_import: {
            2: field('identifier'), // identifier [struct=0]
        },

        // non_null_expression: 1 field(s)
        non_null_expression: {
            0: field('expression'), // expression [struct=0]
        },

        // object_type: handled by refine() in rules: — see below.

        // program: 2 field(s)
        program: {
            0: field('hash_bang_line'), // hash_bang_line [struct=0]
            1: field('statements'), // statement [struct=1]
        },

        // property_signature: 2 field(s)
        property_signature: {
            0: field('accessibility_modifier'), // accessibility_modifier [struct=0]
            1: field('override_modifier'), // override_modifier [struct=1]
        },

        // satisfies_expression: 2 field(s)
        satisfies_expression: {
            0: field('expression'), // expression [struct=0]
            2: field('type_annotation'), // type [struct=1]
        },

        // spread_element: 1 field(s)
        spread_element: {
            1: field('expression'), // expression [struct=0]
        },

        // statement_block: 2 field(s)
        statement_block: {
            1: field('statements'), // statement [struct=0]
            3: field('automatic_semicolon'), //  [struct=1]
        },

        // type_assertion: 2 field(s)
        type_assertion: {
            0: field('type_arguments'), // type_arguments [struct=0]
            1: field('expression'), // expression [struct=1]
        },

        // type_predicate_annotation: 1 field(s)
        type_predicate_annotation: {
            0: field('type_predicate'), // type_predicate [struct=0]
        },

        // union_type: 2 field(s)
        union_type: {
            0: field('left'), // type [struct=0]
            2: field('right'), // type [struct=1]
        },

        // variable_declaration: 2 field(s)
        variable_declaration: {
            1: field('declarators'), // variable_declarator [struct=0]
            2: field('semicolon'), //  [struct=1]
        },

        // yield_expression: 1 field(s)
        yield_expression: {
            1: field('expression'), // expression [struct=0]
        },

        // expression_statement: label the trailing `_semicolon` so the
        // template emits `{{ semicolon }}`. Without the label, readNode
        // captures the anon `;` child but the parent template's
        // `{{ children | join(" ") }}` filters to NAMED-only children
        // and the `;` drops. Grammar: `seq(_expressions, _semicolon)`.
        expression_statement: {
            1: field('semicolon'),
        },

        // type_alias_declaration: same semicolon-drop pattern. Grammar:
        // `seq('type', field('name'), optional(type_parameters), '=',
        // field('value'), _semicolon)` — label pos 5.
        type_alias_declaration: {
            5: field('semicolon'),
        },

        // return_statement: seq('return', optional(_expressions),
        // _semicolon). Label pos 2.
        return_statement: {
            2: field('semicolon'),
        },

        // throw_statement: seq('throw', _expressions, _semicolon).
        throw_statement: {
            2: field('semicolon'),
        },

        // function_signature: seq(optional('async'), 'function',
        // field('name'), _call_signature, choice(_semicolon,
        // _function_signature_automatic_semicolon)). The trailing
        // choice carries the semi (either explicit or auto); labeling
        // pos 4 as a semicolon field lets it render.
        function_signature: {
            4: field('semicolon'),
        },

        // break_statement: seq('break', field('label', optional(...)),
        // _semicolon). Label the trailing `;` at pos 2.
        break_statement: {
            2: field('semicolon'),
        },

        // continue_statement: seq('continue', field('label', ...), _semicolon).
        continue_statement: {
            2: field('semicolon'),
        },

        // debugger_statement: seq('debugger', _semicolon).
        debugger_statement: {
            1: field('semicolon'),
        },

        // do_statement: seq('do', field('body'), 'while', field('condition'),
        // optional(_semicolon)). Optional wrapper at pos 4; labeling as
        // a semicolon field lets the template emit it when present.
        do_statement: {
            4: field('semicolon'),
        },

        // parenthesized_expression: variant() adoption. Shape is
        // `seq('(', choice(typed_expr, sequence_expression), ')')`.
        // The inner choice's alternatives become variant-child kinds
        // that own the surrounding `(` / `)` scaffold via Link's
        // push-down; the parent template collapses to $$$CHILDREN.
        // Path 1/N targets choice alt N inside the seq's member 1.
        parenthesized_expression: {
            '1/0': variant('typed'),
            '1/1': variant('sequence'),
        },

        // export_statement: variant() adoption on all four branches.
        // Path 0 is the JS-inherited `previous` (export default,
        // export function, export from, …); paths 1/2/3 are
        // `export type`, `export =`, `export as namespace`. Without
        // labeling path 0, its base-JS branches render without the
        // `export` prefix (parent template is just `$$$CHILDREN`,
        // which filters to named children) — the wrapper becomes
        // invisible at render time.
        //
        // `_export_statement_default`'s body is a top-level choice of
        // TWO structurally distinct shapes:
        //   arm 0 — `seq('export', choice(4 from-clause forms), _semicolon)`
        //   arm 1 — `seq(decorator, 'export', choice(declaration | default value))`
        // Splitting it further (e.g. `0/0` / `0/1` for these sub-arms)
        // just moves the non-canonical flag one level deeper — each
        // split arm STILL has inner choice-with-fields shapes
        // (specifiers, from-clause forms, default value). Adoption on
        // kinds synthesized by a parent polymorph adoption isn't
        // supported end-to-end, so deferred for future work. The
        // walker handles the shape via its per-branch + downgrade
        // logic correctly; the audit flag surfaces real adoption
        // opportunity but not a blocking bug.
        export_statement: {
            0: variant('default'),
            1: variant('type_export'),
            2: variant('equals_export'),
            3: variant('namespace_export'),
        },

        // call_expression: variant() adoption on three per-prec
        // branches. Each branch is wrapped in `prec('call' |
        // 'template_call' | 'member')` and Link's variant hoist
        // re-wraps each extracted hidden rule in the same prec so the
        // base grammar's conflict resolution carries through.
        call_expression: {
            0: variant('call'),
            1: variant('template_call'),
            2: variant('member'),
        },

        // string: variant() adoption on the quote-style choice. Base
        // grammar: `choice(seq('"', …, '"'), seq("'", …, "'"))`. The
        // walker's primary-branch-wins would always pick the first
        // (double-quoted) branch as the template, so `'x'` source
        // round-trips as `"x"` — AST mismatch. Splitting into variant
        // children (`string_double` / `string_single`) gives each its
        // own template that preserves the quote style.
        string: {
            0: variant('double'),
            1: variant('single'),
        },

        // update_expression: postfix vs prefix `++` / `--`.
        update_expression: {
            0: variant('postfix'),
            1: variant('prefix'),
        },

    },
    rules: {
        // parenthesized_expression: held. Base is plain `seq('(',
        // _expressions, ')')` with no outer prec — my hoist's prec
        // preservation captures OUTER wrappers, not per-alt prec. The
        // real conflict is that sequence_expression has its OWN
        // `prec.right(commaSep1(...))` that wins against a bare
        // expression alt; splitting exposes this as an unresolvable
        // tie. Fix would need the DSL to recognize per-alt prec inside
        // the choice and lift it to the variant rule — another
        // iteration.

        // export_statement: held. Base has no prec wrapper so prec-
        // preservation doesn't help. The conflict is deeper: `export`
        // as a keyword overlaps with its use as an identifier in
        // primary_expression, and tree-sitter resolves this via
        // internal state in the unsplit grammar. Splitting forces
        // the decision earlier, exposing the ambiguity.

        // call_expression: held. Each alt has its own per-branch prec
        // tag ('call'/'template_call'/'member') which prec-preservation
        // captures correctly, but the split exposes the base grammar's
        // call_expression vs binary_expression vs instantiation_
        // expression ambiguity on `typeof expr <` that the unsplit
        // rule resolves via LR state the base intentionally left
        // ambiguous. Fix would need explicit conflicts entries with
        // external rules — out of scope for variant() adoption.

        // optional_parameter: position 0 is the hidden `_parameter_name`
        // helper which tree-sitter inlines — its `decorator`, `pattern`, and
        // `name` fields promote onto the parent at parse time. The former
        // override wrapped pos 0 as a synthetic `parameter_name` slot that
        // doesn't exist at runtime, clobbering all five declared fields.
        // Positions 1/2/3 (the `?`, the type field, and the initializer)
        // are already correctly structured in the base rule.
        optional_parameter: ($, original) => original,

        // public_field_definition: pos 0 is decorator repeat (real base
        // field). The original override labeled pos 0 as
        // accessibility_modifier, clobbering decorator. Dropped entirely —
        // the internal accessibility/override-modifier slots are deep inside
        // nested choices and don't have stable raw positions.
        public_field_definition: ($, original) => original,

        // required_parameter: same shape as optional_parameter modulo the
        // `?` — drop the synthetic `parameter_name` wrapper override and
        // let the walker inline the `_parameter_name` helper's fields.
        required_parameter: ($, original) => original,

        // object_type / interface_body — correlated choice selection
        // across non-adjacent positions: the opening and closing
        // delimiters must agree (`{ }` pair is a curly object type;
        // `{| |}` pair is a flow object type). Refine declares two
        // named forms so factory callers can pick one and have both
        // literals auto-stamped:
        //   ir.objectType.curly({ members: [...] })  // {  }
        //   ir.objectType.flow ({ members: [...] })  // {| |}
        // The `transform(original, { ... })` inside adds the
        // `opening`/`members`/`closing` field labels that refine()'s
        // path segments (`'opening:'` / `'closing:'`) target. Both
        // object_type (primary rule) and interface_body (alias target)
        // share the same parse shape — both get the same treatment.
        object_type: ($, original) => refine(
            transform(original, {
                0: field('opening'),
                1: field('members'),
                2: field('closing'),
            }),
            {
                curly: { 'opening:': '{',  'closing:': '}'  },
                flow:  { 'opening:': '{|', 'closing:': '|}' },
            },
        ),
        // interface_body is a tree-sitter alias target of object_type —
        // it has no base rule of its own, so there's nothing to refine
        // via an override callback. It inherits the parse shape from
        // object_type. If per-form factory support for `interface_body`
        // is needed, a follow-up can add a codegen pass that mirrors
        // `object_type`'s refineForms onto the alias-target kind.

    },
}))
