; bindings.scm — python: which python node is which vocabulary kind, and which slot is which member.
; How `sittir tool bindings-inventory` reads a pattern: docs/glossary/packages-tools-src-inventory.md
; (`readBindings` for the captures, `derive` for the members a claim takes from its slots).

; ── module ─────────────────────────────────────────────────────────────────────
(module) @module

; ── declaration ────────────────────────────────────────────────────────────────
(function_definition) @declaration.function
(function_definition body: (suite_block (block . (simple_statements (simple_statements_elements . item: (expression_statement (string) @doc @literal.string.docstring))))))
(class_definition superclasses: (_)? @bases) @declaration.class
(class_definition body: (suite_block (block . (simple_statements (simple_statements_elements . item: (expression_statement (string) @doc @literal.string.docstring))))))
(class_definition body: (suite_block (block (function_definition) @declaration.method)))
((function_definition name: (identifier) @name) @declaration.constructor (#eq? @name "__init__"))
((function_definition name: (identifier) @name) @declaration.method.dunder (#match? @name "^__(?<stem>.*)__$"))
((decorated_definition (decorator (identifier) @_d) (function_definition) @declaration.method.static) (#eq? @_d "staticmethod"))
((decorated_definition (decorator (identifier) @_d) (function_definition) @declaration.method.class) (#eq? @_d "classmethod"))
(decorated_definition (decorator)* @decorators definition: (_) @element)
(parameters (parameters_elements (identifier) @declaration.parameter))
(parameters (parameters_elements . (identifier) @declaration.parameter.self))
(lambda_parameters (parameters_elements (identifier) @declaration.parameter))
(typed_parameter) @declaration.parameter.typed
(default_parameter value: (_)? @default) @declaration.parameter.default
(typed_default_parameter value: (_)? @default) @declaration.parameter.typed_default
(type_parameter) @declaration.type_parameter
(assignment_eq left: (_) @name right: (_) @value) @declaration.variable
(assignment_typed left: (_) @name right: (_) @value) @declaration.variable
(assignment_type left: (_) @name) @declaration.variable
((assignment_eq left: (identifier) @name) @declaration.constant (#match? @name "^[A-Z][A-Z_0-9]*$"))
((assignment_typed left: (identifier) @name) @declaration.constant (#match? @name "^[A-Z][A-Z_0-9]*$"))
((assignment_type left: (identifier) @name) @declaration.constant (#match? @name "^[A-Z][A-Z_0-9]*$"))
(type_alias_statement) @declaration.type_alias

; ── statement ──────────────────────────────────────────────────────────────────
(block) @statement.block
(if_statement) @statement.if
(for_statement) @statement.loop.for
(while_statement) @statement.loop.while
(return_statement (_)? @expression) @statement.return
(try_statement (except_clause)* @handlers (else_clause)? @alternative (finally_clause)? @finalizer) @statement.try
(raise_statement (_)? @expression) @statement.throw
(import_statement) @statement.import
(import_from_statement) @statement.import.from
(match_statement (subjects subject: (_)+ @subject)) @statement.match
(with_statement) @statement.with
(assert_statement) @statement.assert
(delete_statement) @statement.delete
(pass_statement) @statement.pass
(break_statement) @statement.break
(continue_statement) @statement.continue
(global_statement) @statement.global
(nonlocal_statement) @statement.nonlocal
(expression_statement) @statement.expression
(future_import_statement) @statement.import.future
(print_statement) @statement.print
(print_statement_plain) @statement.print
(print_statement_chevron) @statement.print.chevron
(exec_statement) @statement.exec

; ── clause ─────────────────────────────────────────────────────────────────────
(elif_clause) @clause.elif
(else_clause) @clause.else
(except_clause) @clause.except
(finally_clause) @clause.finally
(case_clause) @clause.case
(with_clause) @clause.with
(with_item) @clause.with.item
(for_in_clause) @clause.comprehension.for
(if_clause) @clause.comprehension.if
(chevron) @clause.print.chevron
(relative_import) @clause.import.relative
(import_prefix) @clause.import.relative.prefix
(aliased_import) @clause.import.alias
(wildcard_import) @clause.import.wildcard
(comprehension_clauses) @clause.comprehension
(lambda_within_for_in_clause) @expression.lambda

; ── argument (pieces of a call that are not expressions) ───────────────────────
(keyword_argument) @argument.keyword

; ── element (pieces of a composite expression that are not expressions) ────────
(pair) @element.pair
(list_splat) @element.splat
(dictionary_splat) @element.splat.dictionary
(parenthesized_list_splat) @element.splat.parenthesized

; ── expression ─────────────────────────────────────────────────────────────────
(call) @expression.call
(call function: (attribute) @function) @expression.call.member
(binary_operator) @expression.binary
(binary_operator operator: "+") @expression.binary.arithmetic.add
(binary_operator operator: "-") @expression.binary.arithmetic.subtract
(binary_operator operator: "*") @expression.binary.arithmetic.multiply
(binary_operator operator: "/") @expression.binary.arithmetic.divide
(binary_operator operator: "%") @expression.binary.arithmetic.modulo
(binary_operator operator: "//") @expression.binary.arithmetic.floor_divide
(binary_operator operator: "**") @expression.binary.arithmetic.exponent
(binary_operator operator: "@") @expression.binary.matmul
(binary_operator operator: "&") @expression.binary.bitwise.and
(binary_operator operator: "|") @expression.binary.bitwise.or
(binary_operator operator: "^") @expression.binary.bitwise.xor
(binary_operator operator: "<<") @expression.binary.shift.left
(binary_operator operator: ">>") @expression.binary.shift.right
(boolean_operator) @expression.binary.logical
(boolean_operator operator: "and") @expression.binary.logical.and
(boolean_operator operator: "or") @expression.binary.logical.or
(comparison_operator (comparison_operator_comparator operators: _ @operator)) @expression.binary
(comparison_operator (comparison_operator_comparator operators: "==")) @expression.binary.comparison.equal
(comparison_operator (comparison_operator_comparator operators: "!=")) @expression.binary.comparison.not_equal
(comparison_operator (comparison_operator_comparator operators: "<")) @expression.binary.comparison.less
(comparison_operator (comparison_operator_comparator operators: ">")) @expression.binary.comparison.greater
(comparison_operator (comparison_operator_comparator operators: "<=")) @expression.binary.comparison.less_equal
(comparison_operator (comparison_operator_comparator operators: ">=")) @expression.binary.comparison.greater_equal
(comparison_operator (comparison_operator_comparator operators: "in")) @expression.binary.membership.in
(comparison_operator (comparison_operator_comparator operators: "not in")) @expression.binary.membership.not_in
(comparison_operator (comparison_operator_comparator operators: "is")) @expression.binary.identity.is
(comparison_operator (comparison_operator_comparator operators: "is not")) @expression.binary.identity.is_not
(unary_operator) @expression.unary
(unary_operator operator: "-") @expression.unary.negation
(unary_operator operator: "+") @expression.unary.plus
(unary_operator operator: "~") @expression.unary.bitwise_not
(not_operator) @expression.unary.not
(augmented_assignment) @expression.assignment.compound
(augmented_assignment operator: "+=") @expression.assignment.compound.add
(augmented_assignment operator: "-=") @expression.assignment.compound.subtract
(augmented_assignment operator: "*=") @expression.assignment.compound.multiply
(augmented_assignment operator: "/=") @expression.assignment.compound.divide
(augmented_assignment operator: "//=") @expression.assignment.compound.floor_divide
(augmented_assignment operator: "%=") @expression.assignment.compound.modulo
(augmented_assignment operator: "**=") @expression.assignment.compound.exponent
(augmented_assignment operator: "@=") @expression.assignment.compound.matmul
(augmented_assignment operator: "&=") @expression.assignment.compound.bitwise_and
(augmented_assignment operator: "|=") @expression.assignment.compound.bitwise_or
(augmented_assignment operator: "^=") @expression.assignment.compound.bitwise_xor
(augmented_assignment operator: "<<=") @expression.assignment.compound.shift_left
(augmented_assignment operator: ">>=") @expression.assignment.compound.shift_right
(named_expression name: (_) @left value: (_) @right) @expression.assignment
(conditional_expression body: (_)? @consequence) @expression.conditional
(attribute attribute: (_) @property) @expression.member
(subscript value: (_) @object (subscripts subscript: (_)+ @index)) @expression.subscript
(slice) @expression.slice
(lambda) @expression.lambda
(await (_)? @expression) @expression.await
(yield) @expression.yield
(interpolation) @expression.interpolation
(list_comprehension) @expression.comprehension.list
(set_comprehension) @expression.comprehension.set
(dictionary_comprehension) @expression.comprehension.dictionary
(generator_expression) @expression.comprehension.generator
(parenthesized_expression) @expression.parenthesized
(list) @expression.collection.list
(tuple) @expression.collection.tuple
(expression_list) @expression.collection.tuple.bare
(set) @expression.collection.set
(dictionary) @expression.collection.dictionary
(ellipsis) @literal.ellipsis
(format_specifier) @expression.interpolation.format
(type_conversion) @expression.interpolation.conversion

; ── pattern ────────────────────────────────────────────────────────────────────
(tuple_pattern) @pattern.tuple
(pattern_list) @pattern.tuple.bare
(list_pattern) @pattern.list
(list_splat_pattern) @pattern.splat
(dictionary_splat_pattern) @pattern.splat.dictionary
(as_pattern) @pattern.as
(case_pattern) @pattern.case
(union_pattern) @pattern.case.or
(dict_pattern) @pattern.case.dictionary
(keyword_pattern) @pattern.case.keyword
(splat_pattern) @pattern.case.splat
(class_pattern) @pattern.case.class
(complex_pattern) @pattern.case.complex
(case_tuple_pattern) @pattern.case.tuple
(case_list_pattern) @pattern.case.list
(case_as_pattern) @pattern.case.as

; ── type ───────────────────────────────────────────────────────────────────────
(type) @type
(generic_type) @type.generic
(union_type) @type.union
(constrained_type) @type.constrained
(member_type) @type.path
(splat_type) @type.splat

; ── literal ────────────────────────────────────────────────────────────────────
(string) @literal.string
(escape_sequence) @literal.string.escape
(concatenated_string) @literal.string.concatenated
((string (string_start) @_p) @literal.string.f (#match? @_p "^[fF]"))
((string (string_start) @_p) @literal.string.bytes (#match? @_p "^[bB]"))
((string (string_start) @_p) @literal.string.raw (#match? @_p "^[rR]"))
((string (string_start) @_p) @literal.string.triple (#match? @_p "\"\"\"|'''"))
(integer_decimal_plain) @literal.number.integer
(integer_decimal_long) @literal.number.integer.big
(integer_decimal_imaginary) @literal.number.integer.imaginary
(integer_hex) @literal.number.integer.hex
(integer_binary) @literal.number.integer.binary
(integer_octal) @literal.number.integer.octal
(float_point) @literal.number.float
(float_leading_point) @literal.number.float.leading_point
(float_scientific) @literal.number.float.scientific
(true) @literal.boolean.true
(false) @literal.boolean.false
(none) @literal.null

; ── identifier ─────────────────────────────────────────────────────────────────
(identifier) @identifier
(type (identifier) @identifier.type)
(dotted_name) @identifier.dotted

; ── modifier ───────────────────────────────────────────────────────────────────
; none: Python's modifiers are `async` (a member) and decorators (attributes)

; ── attribute ──────────────────────────────────────────────────────────────────
(decorator (_)? @content) @attribute.decorator

; ── comment ────────────────────────────────────────────────────────────────────
(comment) @comment.line

; ── keyword / punctuation ──────────────────────────────────────────────────────
["def" "class" "lambda"] @keyword.declaration
["if" "elif" "else" "match" "case"] @keyword.conditional
["for" "while"] @keyword.repeat
["return" "break" "continue" "pass"] @keyword.return
["import" "from" "as"] @keyword.import
["try" "except" "finally" "raise" "with"] @keyword.exception
["async" "await" "global" "nonlocal"] @keyword.modifier
["and" "or" "not" "in" "is"] @keyword.operator
["(" ")" "[" "]" "{" "}"] @punctuation.bracket
["," ":" "." ";"] @punctuation.delimiter

; ── unclaimed (parser artefacts) ───────────────────────────────────────────────
((line_continuation_newline) @unclaimed (#set! reason "layout token"))
((positional_separator) @unclaimed (#set! reason "parameter-list marker, not a parameter"))
((keyword_separator) @unclaimed (#set! reason "parameter-list marker, not a parameter"))
((string_start) @unclaimed (#set! reason "string delimiter, not content"))
((string_end) @unclaimed (#set! reason "string delimiter, not content"))
