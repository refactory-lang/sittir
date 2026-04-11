/**
 * overrides.ts — Grammar extension for typescript
 *
 * Converted from overrides.json. Each entry wraps an unnamed child
 * at a positional index with a named field.
 *
 * @generated from overrides.json — review before committing
 */

// @ts-nocheck — grammar.js is untyped
import base from '../../node_modules/.pnpm/tree-sitter-typescript@0.23.2/node_modules/tree-sitter-typescript/typescript/grammar.js'

export default grammar(base, {
    name: 'typescript',
    rules: {
        // abstract_class_declaration: 1 field(s)
        abstract_class_declaration: ($, original) => transform(original, {
            0: field('class_heritage'), // class_heritage
        }),

        // abstract_method_signature: 2 field(s)
        abstract_method_signature: ($, original) => transform(original, {
            0: field('accessibility_modifier'), // accessibility_modifier
            1: field('override_modifier'), // override_modifier
        }),

        // ambient_declaration: 3 field(s)
        ambient_declaration: ($, original) => transform(original, {
            0: field('declaration'), // declaration | statement_block | property_identifier
            1: field('type_annotation'), // type
            2: field('semicolon'), // 
        }),

        // array_type: 1 field(s)
        array_type: ($, original) => transform(original, {
            0: field('primary_type'), // primary_type
        }),

        // as_expression: 2 field(s)
        as_expression: ($, original) => transform(original, {
            0: field('expression'), // expression
            1: field('type_annotation'), // type
        }),

        // asserts_annotation: 1 field(s)
        asserts_annotation: ($, original) => transform(original, {
            0: field('asserts'), // asserts
        }),

        // await_expression: 1 field(s)
        await_expression: ($, original) => transform(original, {
            0: field('expression'), // expression
        }),

        // class: 1 field(s)
        class: ($, original) => transform(original, {
            0: field('class_heritage'), // class_heritage
        }),

        // class_declaration: 2 field(s)
        class_declaration: ($, original) => transform(original, {
            0: field('class_heritage'), // class_heritage
            1: field('automatic_semicolon'), // 
        }),

        // class_heritage: 2 field(s)
        class_heritage: ($, original) => transform(original, {
            0: field('extends_clause'), // extends_clause | implements_clause
            1: field('implements_clause'), // implements_clause
        }),

        // computed_property_name: 1 field(s)
        computed_property_name: ($, original) => transform(original, {
            0: field('expression'), // expression
        }),

        // else_clause: 1 field(s)
        else_clause: ($, original) => transform(original, {
            0: field('statement'), // statement
        }),

        // enum_body: 2 field(s)
        enum_body: ($, original) => transform(original, {
            0: field('opening'), // enum_assignment
            1: field('members'), // enum_assignment
        }),

        // export_statement: 2 field(s)
        export_statement: ($, original) => transform(original, {
            0: field('declaration'), // namespace_export | export_clause | expression | identifier
            1: field('source'), // 
        }),

        // flow_maybe_type: 1 field(s)
        flow_maybe_type: ($, original) => transform(original, {
            0: field('primary_type'), // primary_type
        }),

        // import_alias: 3 field(s)
        import_alias: ($, original) => transform(original, {
            0: field('name'), // identifier
            1: field('value'), // identifier | nested_identifier
            2: field('semicolon'), // 
        }),

        // import_attribute: 1 field(s)
        import_attribute: ($, original) => transform(original, {
            0: field('object'), // object
        }),

        // import_clause: 2 field(s)
        import_clause: ($, original) => transform(original, {
            0: field('default_import'), // namespace_import | named_imports | _import_identifier | identifier
            1: field('named_imports'), // namespace_import | named_imports | identifier
        }),

        // import_require_clause: 1 field(s)
        import_require_clause: ($, original) => transform(original, {
            0: field('identifier'), // identifier
        }),

        // import_statement: 4 field(s)
        import_statement: ($, original) => transform(original, {
            0: field('import_clause'), // import_clause | import_require_clause
            1: field('from_clause'), // 
            2: field('import_attribute'), // import_attribute
            3: field('semicolon'), // 
        }),

        // index_signature: 1 field(s)
        index_signature: ($, original) => transform(original, {
            0: field('mapped_type_clause'), // mapped_type_clause
        }),

        // index_type_query: 1 field(s)
        index_type_query: ($, original) => transform(original, {
            0: field('primary_type'), // primary_type
        }),

        // infer_type: 2 field(s)
        infer_type: ($, original) => transform(original, {
            0: field('type_identifier'), // _type_identifier | type_identifier
            1: field('constraint'), // type | type_identifier
        }),

        // instantiation_expression: 1 field(s)
        instantiation_expression: ($, original) => transform(original, {
            0: field('expression'), // expression
        }),

        // interface_declaration: 1 field(s)
        interface_declaration: ($, original) => transform(original, {
            0: field('extends_type_clause'), // extends_type_clause
        }),

        // intersection_type: 2 field(s)
        intersection_type: ($, original) => transform(original, {
            0: field('left'), // type
            1: field('right'), // type
        }),

        // lexical_declaration: 2 field(s)
        lexical_declaration: ($, original) => transform(original, {
            0: field('declarators'), // variable_declarator
            1: field('semicolon'), // 
        }),

        // lookup_type: 2 field(s)
        lookup_type: ($, original) => transform(original, {
            0: field('primary_type'), // primary_type
            1: field('index_type'), // type
        }),

        // method_definition: 2 field(s)
        method_definition: ($, original) => transform(original, {
            0: field('accessibility_modifier'), // accessibility_modifier
            1: field('override_modifier'), // override_modifier
        }),

        // method_signature: 2 field(s)
        method_signature: ($, original) => transform(original, {
            0: field('accessibility_modifier'), // accessibility_modifier
            1: field('override_modifier'), // override_modifier
        }),

        // namespace_import: 1 field(s)
        namespace_import: ($, original) => transform(original, {
            0: field('identifier'), // identifier
        }),

        // non_null_expression: 1 field(s)
        non_null_expression: ($, original) => transform(original, {
            0: field('expression'), // expression
        }),

        // object_type: 3 field(s)
        object_type: ($, original) => transform(original, {
            0: field('opening'), // export_statement | property_signature | call_signature | construct_signature | index_signature | method_signature
            1: field('members'), // export_statement | property_signature | call_signature | construct_signature | index_signature | method_signature
            2: field('closing'), // 
        }),

        // optional_parameter: 2 field(s)
        optional_parameter: ($, original) => transform(original, {
            0: field('parameter_name'), // _parameter_name | accessibility_modifier | override_modifier
            1: field('initializer'), // accessibility_modifier | override_modifier
        }),

        // program: 2 field(s)
        program: ($, original) => transform(original, {
            0: field('hash_bang_line'), // hash_bang_line
            1: field('statements'), // statement
        }),

        // property_signature: 2 field(s)
        property_signature: ($, original) => transform(original, {
            0: field('accessibility_modifier'), // accessibility_modifier
            1: field('override_modifier'), // override_modifier
        }),

        // public_field_definition: 3 field(s)
        public_field_definition: ($, original) => transform(original, {
            0: field('accessibility_modifier'), // accessibility_modifier
            1: field('override_modifier'), // override_modifier
            2: field('initializer'), // 
        }),

        // required_parameter: 2 field(s)
        required_parameter: ($, original) => transform(original, {
            0: field('parameter_name'), // _parameter_name | accessibility_modifier | override_modifier
            1: field('initializer'), // accessibility_modifier | override_modifier
        }),

        // satisfies_expression: 2 field(s)
        satisfies_expression: ($, original) => transform(original, {
            0: field('expression'), // expression
            1: field('type_annotation'), // type
        }),

        // spread_element: 1 field(s)
        spread_element: ($, original) => transform(original, {
            0: field('expression'), // expression
        }),

        // statement_block: 2 field(s)
        statement_block: ($, original) => transform(original, {
            0: field('statements'), // statement
            1: field('automatic_semicolon'), // 
        }),

        // type_assertion: 2 field(s)
        type_assertion: ($, original) => transform(original, {
            0: field('type_arguments'), // type_arguments
            1: field('expression'), // expression
        }),

        // type_predicate_annotation: 1 field(s)
        type_predicate_annotation: ($, original) => transform(original, {
            0: field('type_predicate'), // type_predicate
        }),

        // union_type: 2 field(s)
        union_type: ($, original) => transform(original, {
            0: field('left'), // type
            1: field('right'), // type
        }),

        // variable_declaration: 2 field(s)
        variable_declaration: ($, original) => transform(original, {
            0: field('declarators'), // variable_declarator
            1: field('semicolon'), // 
        }),

        // yield_expression: 1 field(s)
        yield_expression: ($, original) => transform(original, {
            0: field('expression'), // expression
        }),

    },
})
