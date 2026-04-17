/**
 * overrides.ts — Grammar extension for typescript
 *
 * Converted from overrides.json. Each entry wraps an unnamed child
 * at a positional index with a named field.
 *
 * @generated from overrides.json — review before committing
 */

// @ts-nocheck — grammar.js is untyped
import base from '../../node_modules/.pnpm/tree-sitter-typescript@0.23.2/node_modules/tree-sitter-typescript/tsx/grammar.js'
import { transform, enrich, field, variant } from '../codegen/src/dsl/index.ts'

export default grammar(enrich(base), {
    name: 'typescript',
    rules: {
        // abstract_class_declaration: wrap pos 5 (class_heritage choice).
        // pos 0 is REPEAT(field('decorator')) — don't touch it, it's a real
        // base-grammar field and the original override clobbered it.
        abstract_class_declaration: ($, original) => transform(original, {
            5: field('class_heritage'),
        }),

        // abstract_method_signature: 2 field(s)
        abstract_method_signature: ($, original) => transform(original, {
            0: field('accessibility_modifier'), // accessibility_modifier [struct=0]
            2: field('override_modifier'), // override_modifier [struct=1]
        }),

        // ambient_declaration: 3 field(s)
        ambient_declaration: ($, original) => transform(original, {
            1: field('declaration'), // declaration | statement_block | property_identifier [struct=0]
        }),

        // array_type: 1 field(s)
        array_type: ($, original) => transform(original, {
            0: field('primary_type'), // primary_type [struct=0]
        }),

        // as_expression: 2 field(s)
        as_expression: ($, original) => transform(original, {
            0: field('expression'), // expression [struct=0]
            2: field('type_annotation'), // type [struct=1]
        }),

        // asserts_annotation: 1 field(s)
        asserts_annotation: ($, original) => transform(original, {
            0: field('asserts'), // asserts [struct=0]
        }),

        // await_expression: 1 field(s)
        await_expression: ($, original) => transform(original, {
            1: field('expression'), // expression [struct=0]
        }),

        // class: wrap pos 4 (class_heritage choice). pos 0 is decorator repeat.
        class: ($, original) => transform(original, {
            4: field('class_heritage'),
        }),

        // class_declaration: wrap pos 4 (class_heritage choice) and pos 6
        // (automatic_semicolon choice). pos 0 is decorator repeat — leave it
        // alone so the base 'decorator' field survives.
        class_declaration: ($, original) => transform(original, {
            4: field('class_heritage'),
            6: field('automatic_semicolon'),
        }),

        // class_heritage (T028a): polymorph split — copy-pasted from
        // overrides.suggested.ts. Each choice alternative becomes its
        // own named rule via variant().
        class_heritage: ($, original) => transform(original, {
            '0': variant('extends_clause'),
            '1': variant('implements_clause'),
        }),

        // computed_property_name: 1 field(s)
        computed_property_name: ($, original) => transform(original, {
            1: field('expression'), // expression [struct=0]
        }),

        // else_clause: 1 field(s)
        else_clause: ($, original) => transform(original, {
            1: field('statement'), // statement [struct=0]
        }),

        // enum_body: 2 field(s)
        enum_body: ($, original) => transform(original, {
            1: field('opening'), // enum_assignment [struct=0]
        }),

        // flow_maybe_type: 1 field(s)
        flow_maybe_type: ($, original) => transform(original, {
            1: field('primary_type'), // primary_type [struct=0]
        }),

        // import_alias: 3 field(s)
        import_alias: ($, original) => transform(original, {
            1: field('name'), // identifier [struct=0]
            3: field('value'), // identifier | nested_identifier [struct=1]
            4: field('semicolon'), //  [struct=2]
        }),

        // import_attribute: 1 field(s)
        import_attribute: ($, original) => transform(original, {
            0: field('object'), // object [struct=0]
        }),

        // import_clause (T028a): polymorph split from suggested.ts.
        import_clause: ($, original) => transform(original, {
            '0': variant('namespace_import'),
            '1': variant('named_imports'),
            '2': variant('default_import'),
        }),

        // import_require_clause: 1 field(s)
        import_require_clause: ($, original) => transform(original, {
            0: field('identifier'), // identifier [struct=0]
        }),

        // import_statement: 4 field(s)
        import_statement: ($, original) => transform(original, {
            1: field('import_clause'), // import_clause | import_require_clause [struct=0]
            2: field('from_clause'), //  [struct=1]
            3: field('import_attribute'), // import_attribute [struct=2]
            4: field('semicolon'), //  [struct=3]
        }),

        // index_signature (T028a): polymorph split from suggested.ts.
        index_signature: ($, original) => transform(original, {
            '2/0': variant('colon'),
            '2/1': variant('mapped_type_clause'),
        }),

        // import_specifier (T028a): polymorph split from suggested.ts.
        import_specifier: ($, original) => transform(original, {
            '1/0': variant('name'),
            '1/1': variant('as'),
        }),

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

        // arrow_function (T028b): polymorph split from suggested.ts.
        arrow_function: ($, original) => transform(original, {
            '1/0': variant('parameter'),
            '1/1': variant('_call_signature'),
        }),

        // index_type_query: 1 field(s)
        index_type_query: ($, original) => transform(original, {
            1: field('primary_type'), // primary_type [struct=0]
        }),

        // infer_type: 2 field(s)
        infer_type: ($, original) => transform(original, {
            1: field('type_identifier'), // _type_identifier | type_identifier [struct=0]
            2: field('constraint'), // type | type_identifier [struct=1]
        }),

        // instantiation_expression: 1 field(s)
        instantiation_expression: ($, original) => transform(original, {
            0: field('expression'), // expression [struct=0]
        }),

        // interface_declaration: 1 field(s)
        interface_declaration: ($, original) => transform(original, {
            3: field('extends_type_clause'), // extends_type_clause [struct=0]
        }),

        // intersection_type: 2 field(s)
        intersection_type: ($, original) => transform(original, {
            0: field('left'), // type [struct=0]
            2: field('right'), // type [struct=1]
        }),

        // lexical_declaration: 2 field(s)
        lexical_declaration: ($, original) => transform(original, {
            1: field('declarators'), // variable_declarator [struct=0]
            2: field('semicolon'), //  [struct=1]
        }),

        // lookup_type: 2 field(s)
        lookup_type: ($, original) => transform(original, {
            0: field('primary_type'), // primary_type [struct=0]
            2: field('index_type'), // type [struct=1]
        }),

        // method_definition: 2 field(s)
        method_definition: ($, original) => transform(original, {
            0: field('accessibility_modifier'), // accessibility_modifier [struct=0]
            1: field('override_modifier'), // override_modifier [struct=1]
        }),

        // method_signature: 2 field(s)
        method_signature: ($, original) => transform(original, {
            0: field('accessibility_modifier'), // accessibility_modifier [struct=0]
            1: field('override_modifier'), // override_modifier [struct=1]
        }),

        // namespace_import: 1 field(s)
        namespace_import: ($, original) => transform(original, {
            2: field('identifier'), // identifier [struct=0]
        }),

        // non_null_expression: 1 field(s)
        non_null_expression: ($, original) => transform(original, {
            0: field('expression'), // expression [struct=0]
        }),

        // object_type: 3 field(s)
        object_type: ($, original) => transform(original, {
            0: field('opening'), // export_statement | property_signature | call_signature | construct_signature | index_signature | method_signature [struct=0]
            1: field('members'), // export_statement | property_signature | call_signature | construct_signature | index_signature | method_signature [struct=1]
            2: field('closing'), //  [struct=2]
        }),

        // optional_parameter: position 0 is the hidden `_parameter_name`
        // helper which tree-sitter inlines — its `decorator`, `pattern`, and
        // `name` fields promote onto the parent at parse time. The former
        // override wrapped pos 0 as a synthetic `parameter_name` slot that
        // doesn't exist at runtime, clobbering all five declared fields.
        // Positions 1/2/3 (the `?`, the type field, and the initializer)
        // are already correctly structured in the base rule.
        optional_parameter: ($, original) => original,

        // program: 2 field(s)
        program: ($, original) => transform(original, {
            0: field('hash_bang_line'), // hash_bang_line [struct=0]
            1: field('statements'), // statement [struct=1]
        }),

        // property_signature: 2 field(s)
        property_signature: ($, original) => transform(original, {
            0: field('accessibility_modifier'), // accessibility_modifier [struct=0]
            1: field('override_modifier'), // override_modifier [struct=1]
        }),

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

        // satisfies_expression: 2 field(s)
        satisfies_expression: ($, original) => transform(original, {
            0: field('expression'), // expression [struct=0]
            2: field('type_annotation'), // type [struct=1]
        }),

        // spread_element: 1 field(s)
        spread_element: ($, original) => transform(original, {
            1: field('expression'), // expression [struct=0]
        }),

        // statement_block: 2 field(s)
        statement_block: ($, original) => transform(original, {
            1: field('statements'), // statement [struct=0]
            3: field('automatic_semicolon'), //  [struct=1]
        }),

        // type_assertion: 2 field(s)
        type_assertion: ($, original) => transform(original, {
            0: field('type_arguments'), // type_arguments [struct=0]
            1: field('expression'), // expression [struct=1]
        }),

        // type_predicate_annotation: 1 field(s)
        type_predicate_annotation: ($, original) => transform(original, {
            0: field('type_predicate'), // type_predicate [struct=0]
        }),

        // union_type: 2 field(s)
        union_type: ($, original) => transform(original, {
            0: field('left'), // type [struct=0]
            2: field('right'), // type [struct=1]
        }),

        // variable_declaration: 2 field(s)
        variable_declaration: ($, original) => transform(original, {
            1: field('declarators'), // variable_declarator [struct=0]
            2: field('semicolon'), //  [struct=1]
        }),

        // yield_expression: 1 field(s)
        yield_expression: ($, original) => transform(original, {
            1: field('expression'), // expression [struct=0]
        }),

    },
})
