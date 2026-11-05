; bindings.scm — c: which c node is which vocabulary kind, and which slot is which member.
; A probe binding for the feature scrub: it claims the vocabulary content c has, so the
; inventory measures c's holder set. `static` at file scope gives internal linkage, which
; is c's one visibility fact; the preprocessor is a separate language and is not claimed.

; ── file ───────────────────────────────────────────────────────────────────────
(translation_unit) @file

; ── declaration ────────────────────────────────────────────────────────────────
(function_definition) @declaration.function
(function_definition type: (_) @returnType)
((function_definition (storage_class_specifier) @_s) @declaration.function.private (#eq? @_s "static"))
(declaration) @declaration
(declaration declarator: (function_declarator)) @declaration.function.signature
(declaration declarator: (init_declarator)) @declaration.variable
(declaration declarator: (identifier)) @declaration.variable
(declaration type: (_) @type)
((declaration (type_qualifier) @_q declarator: (init_declarator)) @declaration.variable.constant (#eq? @_q "const"))
(parameter_declaration) @declaration.parameter
(parameter_declaration type: (_) @type)
(variadic_parameter) @declaration.parameter.variadic
(field_declaration) @declaration.field
(field_declaration type: (_) @type)
(struct_specifier) @declaration.struct
(union_specifier) @declaration.union
(enum_specifier) @declaration.enum
(enumerator) @declaration.enum_member
(type_definition) @declaration.type_alias

; ── clause ─────────────────────────────────────────────────────────────────────
(else_clause) @clause.else
(case_statement value: (_)) @clause.case.switch
((case_statement !value) @clause.case.default)

; ── statement ──────────────────────────────────────────────────────────────────
(compound_statement) @statement.block
(if_statement) @statement.if
(if_statement alternative: (_) @alternative)
(while_statement) @statement.loop.while
(do_statement) @statement.loop.do_while
(for_statement) @statement.loop.counted
(switch_statement) @statement.switch
(return_statement) @statement.return
(break_statement) @statement.break
(continue_statement) @statement.continue
(labeled_statement) @statement.labeled
(expression_statement) @statement.expression

; ── expression ─────────────────────────────────────────────────────────────────
(call_expression) @expression.call
(call_expression function: (field_expression)) @expression.call.member
(field_expression) @expression.member
(subscript_expression) @expression.subscript
(parenthesized_expression) @expression.parenthesized
(conditional_expression) @expression.conditional
(comma_expression) @expression.sequence
(cast_expression) @expression.cast
(compound_literal_expression) @expression.collection.struct
(initializer_list) @expression.collection.list
(initializer_pair) @element.struct.field
(binary_expression) @expression.binary
(binary_expression operator: "+") @expression.binary.arithmetic.add
(binary_expression operator: "-") @expression.binary.arithmetic.subtract
(binary_expression operator: "*") @expression.binary.arithmetic.multiply
(binary_expression operator: "/") @expression.binary.arithmetic.divide
(binary_expression operator: "%") @expression.binary.arithmetic.modulo
(binary_expression operator: "==") @expression.binary.comparison.equal
(binary_expression operator: "!=") @expression.binary.comparison.not_equal
(binary_expression operator: "<") @expression.binary.comparison.less
(binary_expression operator: ">") @expression.binary.comparison.greater
(binary_expression operator: "<=") @expression.binary.comparison.less_equal
(binary_expression operator: ">=") @expression.binary.comparison.greater_equal
(binary_expression operator: "&") @expression.binary.bitwise.and
(binary_expression operator: "|") @expression.binary.bitwise.or
(binary_expression operator: "^") @expression.binary.bitwise.xor
(binary_expression operator: "<<") @expression.binary.shift.left
(binary_expression operator: ">>") @expression.binary.shift.right
(binary_expression operator: "&&") @expression.binary.logical.and
(binary_expression operator: "||") @expression.binary.logical.or
(unary_expression) @expression.unary
(unary_expression operator: "-") @expression.unary.negation
(unary_expression operator: "+") @expression.unary.plus
(unary_expression operator: "!") @expression.unary.not
(unary_expression operator: "~") @expression.unary.bitwise_not
(pointer_expression) @expression
(pointer_expression operator: "*") @expression.unary.deref
(pointer_expression operator: "&") @expression.reference
(update_expression) @expression.update
(update_expression (_ operator: "++")) @expression.update.increment
(update_expression (_ operator: "--")) @expression.update.decrement
(assignment_expression) @expression.assignment
(assignment_expression operator: "+=") @expression.assignment.compound.add
(assignment_expression operator: "-=") @expression.assignment.compound.subtract
(assignment_expression operator: "*=") @expression.assignment.compound.multiply
(assignment_expression operator: "/=") @expression.assignment.compound.divide
(assignment_expression operator: "%=") @expression.assignment.compound.modulo
(assignment_expression operator: "&=") @expression.assignment.compound.bitwise_and
(assignment_expression operator: "|=") @expression.assignment.compound.bitwise_or
(assignment_expression operator: "^=") @expression.assignment.compound.bitwise_xor
(assignment_expression operator: "<<=") @expression.assignment.compound.shift_left
(assignment_expression operator: ">>=") @expression.assignment.compound.shift_right

; ── type ───────────────────────────────────────────────────────────────────────
(primitive_type) @type.primitive
((primitive_type) @type.primitive.boolean (#eq? @type.primitive.boolean "bool"))
((primitive_type) @type.primitive.character (#eq? @type.primitive.character "char"))
((primitive_type) @type.primitive.floating.float32 (#eq? @type.primitive.floating.float32 "float"))
((primitive_type) @type.primitive.floating.float64 (#eq? @type.primitive.floating.float64 "double"))
((primitive_type) @type.primitive.integral.int32 (#eq? @type.primitive.integral.int32 "int"))
((primitive_type) @type.primitive.integral.int8 (#eq? @type.primitive.integral.int8 "int8_t"))
((primitive_type) @type.primitive.integral.int16 (#eq? @type.primitive.integral.int16 "int16_t"))
((primitive_type) @type.primitive.integral.int64 (#eq? @type.primitive.integral.int64 "int64_t"))
((primitive_type) @type.primitive.integral.size (#eq? @type.primitive.integral.size "size_t"))
((primitive_type) @type.primitive.void (#eq? @type.primitive.void "void"))
(sized_type_specifier) @type.primitive.integral
(pointer_declarator) @type.pointer
(abstract_pointer_declarator) @type.pointer
(array_declarator) @type.array
(abstract_array_declarator) @type.array
(abstract_function_declarator) @type.function
(storage_class_specifier) @modifier
(type_qualifier) @modifier

; ── literal ────────────────────────────────────────────────────────────────────
(number_literal) @literal.number
(string_literal) @literal.string
(concatenated_string) @literal.string.concatenated
(string_content) @literal.string.text
(escape_sequence) @literal.string.escape
(char_literal) @literal.character
(true) @literal.boolean.true
(false) @literal.boolean.false
(null) @literal.null

; ── identifier ─────────────────────────────────────────────────────────────────
(identifier) @identifier
(field_identifier) @identifier
(type_identifier) @identifier
(statement_identifier) @identifier.label

; ── attribute ──────────────────────────────────────────────────────────────────
(attribute_declaration) @attribute
(attribute) @attribute.content

; ── comment ────────────────────────────────────────────────────────────────────
(comment_arm1) @comment.line
(comment_arm2) @comment.block
