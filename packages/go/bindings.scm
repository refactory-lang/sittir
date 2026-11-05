; bindings.scm — go: which go node is which vocabulary kind, and which slot is which member.
; A probe binding for the feature scrub: it claims the vocabulary content go has, so the
; inventory measures go's holder set. Exported names are go's visibility: the compiler
; enforces that an identifier starting with an upper-case letter is visible outside its package.

; ── file ───────────────────────────────────────────────────────────────────────
(source_file) @file

; ── declaration ────────────────────────────────────────────────────────────────
(function_declaration) @declaration.function
(function_declaration type_parameters: (_) @typeParameters)
(function_declaration result: (_) @returnType)
((function_declaration !body) @declaration.function.signature)
((function_declaration name: (identifier) @_n) @declaration.function.public (#match? @_n "^[A-Z]"))
((function_declaration name: (identifier) @_n) @declaration.function.private (#match? @_n "^[a-z_]"))
(method_declaration) @declaration.method
(method_declaration receiver: (_) @receiver)
(method_declaration result: (_) @returnType)
((method_declaration name: (field_identifier) @_n) @declaration.method.public (#match? @_n "^[A-Z]"))
((method_declaration name: (field_identifier) @_n) @declaration.method.private (#match? @_n "^[a-z_]"))
(method_elem) @declaration.method.signature
(method_elem result: (_) @returnType)
(parameter_declaration) @declaration.parameter
(parameter_declaration type: (_) @type)
(variadic_parameter_declaration) @declaration.parameter.variadic
(type_parameter_declaration) @declaration.type_parameter
(type_parameter_declaration type: (_) @bounds)
(var_spec) @declaration.variable
(short_var_declaration) @declaration.variable
((var_spec name: (identifier) @_n) @declaration.variable.public (#match? @_n "^[A-Z]"))
((var_spec name: (identifier) @_n) @declaration.variable.private (#match? @_n "^[a-z_]"))
(const_spec) @declaration.constant
((const_spec name: (identifier) @_n) @declaration.constant.public (#match? @_n "^[A-Z]"))
((const_spec name: (identifier) @_n) @declaration.constant.private (#match? @_n "^[a-z_]"))
(type_spec) @declaration
(type_spec type: (struct_type)) @declaration.struct
((type_spec name: (type_identifier) @_n type: (struct_type)) @declaration.struct.public (#match? @_n "^[A-Z]"))
((type_spec name: (type_identifier) @_n type: (struct_type)) @declaration.struct.private (#match? @_n "^[a-z_]"))
(type_spec type_parameters: (_) @typeParameters type: (struct_type))
(type_spec type: (interface_type)) @declaration.interface
(type_spec type_parameters: (_) @typeParameters type: (interface_type))
(type_alias) @declaration.type_alias
(type_alias type_parameters: (_) @typeParameters)
((type_alias name: (type_identifier) @_n) @declaration.type_alias.public (#match? @_n "^[A-Z]"))
((type_alias name: (type_identifier) @_n) @declaration.type_alias.private (#match? @_n "^[a-z_]"))
(field_declaration) @declaration.field
(field_declaration type: (_) @type)
((field_declaration name: (field_identifier) @_n) @declaration.field.public (#match? @_n "^[A-Z]"))
((field_declaration name: (field_identifier) @_n) @declaration.field.private (#match? @_n "^[a-z_]"))

; ── clause ─────────────────────────────────────────────────────────────────────
(import_spec) @clause.import
(import_spec name: (package_identifier)) @clause.import.alias
(import_spec name: (dot)) @clause.import.wildcard
(expression_case) @clause.case.switch
(type_case) @clause.case.switch
(default_case) @clause.case.default
(type_constraint) @clause.bounds

; ── statement ──────────────────────────────────────────────────────────────────
(import_declaration) @statement.import
(block) @statement.block
(if_statement) @statement.if
(if_statement alternative: (_) @alternative)
(for_statement) @statement.loop
(for_statement (for_clause)) @statement.loop.counted
(for_statement (range_clause)) @statement.loop.for_each
(expression_switch_statement) @statement.switch
(type_switch_statement) @statement.switch
(return_statement) @statement.return
(break_statement) @statement.break
(break_statement (label_name) @label)
(continue_statement) @statement.continue
(continue_statement (label_name) @label)
(labeled_statement) @statement.labeled
(expression_statement) @statement.expression
(empty_statement) @statement.empty
(inc_statement) @expression.update.increment
(dec_statement) @expression.update.decrement

; ── expression ─────────────────────────────────────────────────────────────────
(call_expression) @expression.call
(call_expression (call_expression_arm2 function: (selector_expression))) @expression.call.member
(call_expression (call_expression_arm2 type_arguments: (_) @typeArguments))
(selector_expression) @expression.member
(index_expression) @expression.subscript
(slice_expression) @expression.slice
(parenthesized_expression) @expression.parenthesized
(func_literal) @expression.function
(func_literal result: (_) @returnType)
(type_assertion_expression) @expression.cast
(type_conversion_expression) @expression.cast.conversion
(type_instantiation_expression) @expression.instantiation
(variadic_argument) @element.spread
(keyed_element) @element.pair
(composite_literal type: (map_type)) @expression.collection.map
(composite_literal type: (slice_type)) @expression.collection.list
(composite_literal type: (array_type)) @expression.collection.list
(composite_literal type: (implicit_length_array_type)) @expression.collection.list
(composite_literal type: (type_identifier)) @expression.collection.struct
(composite_literal type: (qualified_type)) @expression.collection.struct
(composite_literal type: (generic_type)) @expression.collection.struct
(composite_literal type: (struct_type)) @expression.collection.struct
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
(unary_expression operator: "^") @expression.unary.bitwise_not
(unary_expression operator: "*") @expression.unary.deref
(unary_expression operator: "&") @expression.reference
(assignment_statement) @expression.assignment
(assignment_statement operator: "+=") @expression.assignment.compound.add
(assignment_statement operator: "-=") @expression.assignment.compound.subtract
(assignment_statement operator: "*=") @expression.assignment.compound.multiply
(assignment_statement operator: "/=") @expression.assignment.compound.divide
(assignment_statement operator: "%=") @expression.assignment.compound.modulo
(assignment_statement operator: "&=") @expression.assignment.compound.bitwise_and
(assignment_statement operator: "|=") @expression.assignment.compound.bitwise_or
(assignment_statement operator: "^=") @expression.assignment.compound.bitwise_xor
(assignment_statement operator: "<<=") @expression.assignment.compound.shift_left
(assignment_statement operator: ">>=") @expression.assignment.compound.shift_right

; ── pattern ────────────────────────────────────────────────────────────────────
(blank_identifier) @pattern.wildcard

; ── type ───────────────────────────────────────────────────────────────────────
(pointer_type) @type.pointer
(array_type) @type.array
(slice_type) @type.array
(implicit_length_array_type) @type.array
(function_type) @type.function
(generic_type) @type.generic
(struct_type) @type.object
(parenthesized_type) @type.parenthesized
((type_identifier) @type.primitive.integral.int8 (#eq? @type.primitive.integral.int8 "int8"))
((type_identifier) @type.primitive.integral.int16 (#eq? @type.primitive.integral.int16 "int16"))
((type_identifier) @type.primitive.integral.int32 (#eq? @type.primitive.integral.int32 "int32"))
((type_identifier) @type.primitive.integral.int64 (#eq? @type.primitive.integral.int64 "int64"))
((type_identifier) @type.primitive.integral.size (#eq? @type.primitive.integral.size "int"))
((type_identifier) @type.primitive.floating.float32 (#eq? @type.primitive.floating.float32 "float32"))
((type_identifier) @type.primitive.floating.float64 (#eq? @type.primitive.floating.float64 "float64"))
((type_identifier) @type.primitive.boolean (#eq? @type.primitive.boolean "bool"))
((type_identifier) @type.primitive.string (#eq? @type.primitive.string "string"))
((type_identifier) @type.primitive.character (#eq? @type.primitive.character "rune"))
((type_identifier) @type.primitive.unchecked (#eq? @type.primitive.unchecked "any"))

; ── literal ────────────────────────────────────────────────────────────────────
(int_literal) @literal.number.integer
(int_literal (int_literal_arm1)) @literal.number.integer.binary
(int_literal (int_literal_arm4)) @literal.number.integer.octal
(int_literal (int_literal_arm5)) @literal.number.integer.hex
(float_literal) @literal.number.float
(imaginary_literal) @literal.number.integer.imaginary
(rune_literal) @literal.character
(interpreted_string_literal) @literal.string
(raw_string_literal) @literal.string.raw
(raw_string_literal) @literal.string.multiline
(escape_sequence) @literal.string.escape
(interpreted_string_literal_content) @literal.string.text
(raw_string_literal_content) @literal.string.text
(true) @literal.boolean.true
(false) @literal.boolean.false
(nil) @literal.null

; ── identifier ─────────────────────────────────────────────────────────────────
(identifier) @identifier
(field_identifier) @identifier
(type_identifier) @identifier
(package_identifier) @identifier
(qualified_type) @identifier.qualified
(label_name) @identifier.label

; ── comment ────────────────────────────────────────────────────────────────────
(comment_arm1) @comment.line
(comment_arm2) @comment.block
