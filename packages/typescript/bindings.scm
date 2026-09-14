; bindings.scm — typescript.
; Delta form: a kind claim on every visible kind; a member capture only where the upstream
; field is missing, or its name differs from the converged member name. A single-segment
; capture on a nested node names a member; on the pattern's top node it names the namespace
; root kind. Namespaces are the supertypes: no grammar supertype is ever claimed.
; A kind claim is unconditional: an optional member named in the same pattern carries a quantifier
; (`?`, `*`, `+`) so the claim matches whether or not the member is present.
; The names rules for markers and modifiers (`async_marker` is `async`, `visibility_modifier` is
; `visibility`) are applied by the derivation to every slot, so no claim spells them.
; A container that wraps one declaration or statement is never claimed: a pattern that captures the wrapped
; node as `@element` assigns its other captures (`@declare`, `@decorator`, `@label`) to that element.

; ── module ─────────────────────────────────────────────────────────────────────
(program) @module

; ── declaration ────────────────────────────────────────────────────────────────
(function_declaration) @declaration.function
(generator_function_declaration) @declaration.function.generator
(generator_function_declaration "*" @generator)
(class_declaration) @declaration.class
(class_declaration (class_heritage (class_heritage_extends_clause (_) @extends)))
(class_declaration (class_heritage (implements_clause type: (_) @implements)))
(abstract_class_declaration) @declaration.class.abstract
(abstract_class_declaration "abstract" @abstract)
(interface_declaration (extends_type_clause)? @extends) @declaration.interface
(enum_declaration) @declaration.enum
(enum_assignment) @declaration.enum_member
(enum_body (_) @declaration.enum_member)
(type_alias_declaration) @declaration.type_alias
(method_definition) @declaration.method
(method_definition (accessibility_modifier) @visibility)
(method_definition "*" @generator)
(method_definition "?" @optional)
(method_definition accessor_kind: "get") @declaration.getter
(method_definition accessor_kind: "set") @declaration.setter
((method_definition name: (property_identifier) @name) @declaration.constructor (#eq? @name "constructor"))
(method_signature) @declaration.method.signature
(method_signature (accessibility_modifier) @visibility)
(abstract_method_signature) @declaration.method.signature.abstract
(abstract_method_signature "abstract" @abstract)
(abstract_method_signature (accessibility_modifier) @visibility)
(property_signature) @declaration.field.signature
(property_signature (accessibility_modifier) @visibility)
(public_field_definition) @declaration.field
(public_field_definition (accessibility_modifier) @visibility)
(public_field_definition "?" @optional)
(public_field_definition "!" @definite)
(lexical_declaration) @declaration.variable.lexical
(variable_declaration) @declaration.variable.var
(variable_declarator_arm2) @declaration.variable
(variable_declarator_arm1) @declaration.variable.pattern
(required_parameter pattern: (_) @name value: (_)? @default) @declaration.parameter
(required_parameter (accessibility_modifier) @visibility)
(optional_parameter pattern: (_) @name value: (_)? @default) @declaration.parameter.optional
(optional_parameter "?" @optional)
(optional_parameter (accessibility_modifier) @visibility)
(type_parameter value: (_)? @default) @declaration.type_parameter
(ambient_declaration "declare" @declare (_) @element)
(internal_module) @declaration.module
(module) @declaration.module.external
(field_definition) @declaration.field
(class_static_block) @statement.block.static
(function_signature) @declaration.function.signature
(call_signature) @declaration.signature.call
(construct_signature) @declaration.signature.construct
(index_signature) @declaration.signature.index

; ── statement ──────────────────────────────────────────────────────────────────
(statement_block) @statement.block
(if_statement) @statement.if
(for_statement) @statement.loop.counted
(for_in_statement) @statement.loop.for
(while_statement) @statement.loop.while
(do_statement) @statement.loop.do_while
(return_statement) @statement.return
(switch_statement) @statement.switch
(try_statement handler: (_)? @handlers) @statement.try
(throw_statement) @statement.throw
(import_statement) @statement.import
(export_statement) @statement.export
(expression_statement) @statement.expression
(break_statement) @statement.break
(continue_statement) @statement.continue
(debugger_statement) @statement.debugger
(empty_statement) @statement.empty
(labeled_statement label: (_) @label body: (_) @element)
(with_statement) @statement.scope

; ── clause ─────────────────────────────────────────────────────────────────────
(else_clause) @clause.else
(catch_clause) @clause.catch
(finally_clause) @clause.finally
(switch_case) @clause.case
(switch_default) @clause.case.default
(extends_clause) @clause.extends
(extends_type_clause) @clause.extends.type
(implements_clause) @clause.implements
(export_clause) @clause.export
(import_clause) @clause.import.names
(import_require_clause) @clause.import.require
(namespace_import) @clause.import.namespace
(import_specifier) @clause.import.specifier
(import_attribute) @clause.import.attribute
(import_alias) @clause.import.alias
(namespace_export) @clause.export.namespace
(export_specifier) @clause.export.specifier
(mapped_type_clause) @clause.mapped_type
; type annotations are transparent wrappers: the annotated member takes the type
(constraint) @clause.constraint
(default_type) @clause.default

; ── argument (pieces of a call that are not expressions) ───────────────────────
; none: every TypeScript argument is an expression or a spread element

; ── element (pieces of a composite expression that are not expressions) ────────
(spread_element) @element.splat
(pair) @element.pair
(jsx_attribute) @element.jsx.attribute
(tuple_parameter) @element.tuple.member
(optional_tuple_parameter) @element.tuple.member.optional
(template_type) @element.template.substitution

; ── expression ─────────────────────────────────────────────────────────────────
(call_expression_call) @expression.call
(call_expression_member) @expression.call.member
(call_expression_template_call) @expression.call.template
(new_expression constructor: (_)? @function) @expression.call.new
(binary_expression) @expression.binary
(binary_expression operator: "+") @expression.binary.arithmetic.add
(binary_expression operator: "-") @expression.binary.arithmetic.subtract
(binary_expression operator: "*") @expression.binary.arithmetic.multiply
(binary_expression operator: "/") @expression.binary.arithmetic.divide
(binary_expression operator: "%") @expression.binary.arithmetic.modulo
(binary_expression operator: "**") @expression.binary.arithmetic.exponent
(binary_expression operator: "==") @expression.binary.comparison.equal
(binary_expression operator: "!=") @expression.binary.comparison.not_equal
(binary_expression operator: "===") @expression.binary.comparison.strict_equal
(binary_expression operator: "!==") @expression.binary.comparison.strict_not_equal
(binary_expression operator: "<") @expression.binary.comparison.less
(binary_expression operator: ">") @expression.binary.comparison.greater
(binary_expression operator: "<=") @expression.binary.comparison.less_equal
(binary_expression operator: ">=") @expression.binary.comparison.greater_equal
(binary_expression operator: "&") @expression.binary.bitwise.and
(binary_expression operator: "|") @expression.binary.bitwise.or
(binary_expression operator: "^") @expression.binary.bitwise.xor
(binary_expression operator: "<<") @expression.binary.shift.left
(binary_expression operator: ">>") @expression.binary.shift.right
(binary_expression operator: ">>>") @expression.binary.shift.right_unsigned
(binary_expression operator: "&&") @expression.binary.logical.and
(binary_expression operator: "||") @expression.binary.logical.or
(binary_expression operator: "??") @expression.binary.nullish
(binary_expression operator: "in") @expression.binary.membership.in
(binary_expression operator: "instanceof") @expression.binary.membership.instanceof
(unary_expression) @expression.unary
(unary_expression operator: "-") @expression.unary.negation
(unary_expression operator: "+") @expression.unary.plus
(unary_expression operator: "!") @expression.unary.not
(unary_expression operator: "~") @expression.unary.bitwise_not
(unary_expression operator: "typeof") @expression.unary.typeof
(unary_expression operator: "void") @expression.unary.void
(unary_expression operator: "delete") @expression.unary.delete
(update_expression) @expression.update
(update_expression operator: "++") @expression.update.increment
(update_expression operator: "--") @expression.update.decrement
(augmented_assignment_expression) @expression.assignment.compound
(augmented_assignment_expression operator: "+=") @expression.assignment.compound.add
(augmented_assignment_expression operator: "-=") @expression.assignment.compound.subtract
(augmented_assignment_expression operator: "*=") @expression.assignment.compound.multiply
(augmented_assignment_expression operator: "/=") @expression.assignment.compound.divide
(augmented_assignment_expression operator: "%=") @expression.assignment.compound.modulo
(augmented_assignment_expression operator: "**=") @expression.assignment.compound.exponent
(augmented_assignment_expression operator: "&=") @expression.assignment.compound.bitwise_and
(augmented_assignment_expression operator: "|=") @expression.assignment.compound.bitwise_or
(augmented_assignment_expression operator: "^=") @expression.assignment.compound.bitwise_xor
(augmented_assignment_expression operator: "<<=") @expression.assignment.compound.shift_left
(augmented_assignment_expression operator: ">>=") @expression.assignment.compound.shift_right
(augmented_assignment_expression operator: ">>>=") @expression.assignment.compound.shift_right_unsigned
(augmented_assignment_expression operator: "&&=") @expression.assignment.compound.and
(augmented_assignment_expression operator: "||=") @expression.assignment.compound.or
(augmented_assignment_expression operator: "??=") @expression.assignment.compound.nullish
(assignment_expression) @expression.assignment
(ternary_expression) @expression.conditional
(member_expression) @expression.member
(member_expression (optional_chain) @optional_chain)
(subscript_expression (optional_chain) @optional_chain)
(call_expression_call (optional_chain) @optional_chain)
(subscript_expression) @expression.subscript
(arrow_function parameter: (_)? @parameters) @expression.lambda
(function_expression) @expression.function
(generator_function) @expression.function.generator
(generator_function "*" @generator)
(await_expression) @expression.await
(yield_expression) @expression.yield
(template_substitution) @expression.interpolation
(parenthesized_expression) @expression.parenthesized
(sequence_expression) @expression.sequence
(object) @expression.collection.object
(array) @expression.collection.list
(as_expression) @expression.cast.as
(satisfies_expression) @expression.cast.satisfies
(non_null_expression) @expression.cast.non_null
(type_assertion) @expression.cast.assertion
(instantiation_expression) @expression.instantiation
(jsx_element) @expression.jsx.element
(jsx_self_closing_element) @expression.jsx.element.self_closing
(jsx_opening_element) @expression.jsx.element.opening
(jsx_closing_element) @expression.jsx.element.closing
(jsx_expression) @expression.jsx.expression
(import) @expression.call.import
(meta_property) @expression.meta
(class) @expression.class
(class (class_heritage (class_heritage_extends_clause (_) @extends)))
(class (class_heritage (implements_clause type: (_) @implements)))
(decorator_member_expression) @attribute.content.member
(decorator_call_expression) @attribute.content.call
(decorator_parenthesized_expression) @attribute.content.parenthesized

; ── pattern ────────────────────────────────────────────────────────────────────
(object_pattern) @pattern.object
(object_assignment_pattern) @pattern.object.assignment
(pair_pattern) @pattern.object.pair
(array_pattern) @pattern.array
(rest_pattern) @pattern.rest
(assignment_pattern) @pattern.assignment

; ── type ───────────────────────────────────────────────────────────────────────
(predefined_type) @type.primitive
((predefined_type) @type.primitive.never (#eq? @type.primitive.never "never"))
(generic_type) @type.generic
(union_type) @type.union
(intersection_type) @type.intersection
(array_type) @type.array
(tuple_type) @type.tuple
(function_type) @type.function
(constructor_type) @type.function.constructor
(object_type) @type.object
(literal_type) @type.literal
(lookup_type) @type.lookup
(conditional_type) @type.conditional
(infer_type) @type.infer
(type_query) @type.query
(type_predicate) @type.predicate
(readonly_type) @type.readonly
(optional_type) @type.optional
(rest_type) @type.rest
(parenthesized_type) @type.parenthesized
(template_literal_type) @type.template
(index_type_query) @type.index_query
(asserts) @type.predicate.asserts
(existential_type) @type.existential
(flow_maybe_type) @type.maybe

; ── literal ────────────────────────────────────────────────────────────────────
(string) @literal.string
(escape_sequence) @literal.string.escape
(template_string) @literal.template
(regex) @literal.regex
(number) @literal.number
(true) @literal.boolean.true
(false) @literal.boolean.false
(null) @literal.null
(undefined) @literal.null.undefined
(regex_pattern) @literal.regex.pattern
(regex_flags) @literal.regex.flags
(html_character_reference) @literal.html_entity

; ── identifier ─────────────────────────────────────────────────────────────────
(identifier) @identifier
(type_identifier) @identifier.type
(property_identifier) @identifier.property
(private_property_identifier) @identifier.property.private
(shorthand_property_identifier) @identifier.property.shorthand
(nested_identifier) @identifier.nested
(nested_type_identifier) @type.path
(this) @identifier.self
(super) @identifier.super

; every TypeScript modifier is a keyword: `visibility` is a member whose value is the keyword text,
; the markers are boolean members; no modifier is a kind
(computed_property_name) @identifier.property.computed
(jsx_identifier) @identifier.jsx
(jsx_namespace_name) @identifier.jsx.namespace

; ── modifier ───────────────────────────────────────────────────────────────────

; ── attribute ──────────────────────────────────────────────────────────────────
(decorator (_)? @content) @attribute.decorator

; ── comment ────────────────────────────────────────────────────────────────────
(comment) @comment
((comment) @comment.block.doc (#match? @comment.block.doc "^/\\*\\*"))
((comment) @comment.line (#match? @comment.line "^//"))
((comment) @comment.block (#match? @comment.block "^/\\*"))

; ── keyword / punctuation ──────────────────────────────────────────────────────
["function" "class" "interface" "type" "enum" "namespace" "let" "const" "var"] @keyword.declaration
["if" "else" "switch" "case" "default"] @keyword.conditional
["for" "while" "do"] @keyword.repeat
["return" "break" "continue"] @keyword.return
["import" "export" "from"] @keyword.import
["try" "catch" "finally" "throw"] @keyword.exception
["async" "static" "readonly" "abstract" "declare" "override"] @keyword.modifier
["public" "private" "protected"] @keyword.visibility
["typeof" "instanceof" "in" "of" "as" "new" "delete" "void"] @keyword.operator
["(" ")" "[" "]" "{" "}"] @punctuation.bracket
["," ";" ":" "." "?." "=>"] @punctuation.delimiter

; ── unclaimed (parser artefacts) ───────────────────────────────────────────────
((hash_bang_line) @unclaimed (#set! reason "interpreter line, not a statement"))
