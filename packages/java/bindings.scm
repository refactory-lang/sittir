; bindings.scm — java: which java node is which vocabulary kind, and which slot is which member.
; A probe binding for the feature scrub: it claims the vocabulary content java has, so the
; inventory measures java's holder set. Access levels are java's modifier keywords.

; ── file ───────────────────────────────────────────────────────────────────────
(program) @file

; ── declaration ────────────────────────────────────────────────────────────────
(class_declaration) @declaration.class
(class_declaration superclass: (_) @extends)
(class_declaration interfaces: (_) @implements)
(class_declaration type_parameters: (_) @typeParameters)
(class_declaration (modifiers "abstract" @abstract))
(record_declaration) @declaration.class
(interface_declaration) @declaration.interface
(interface_declaration type_parameters: (_) @typeParameters)
(enum_declaration) @declaration.enum
(enum_constant) @declaration.enum_member
(method_declaration) @declaration.method
(method_declaration type_parameters: (_) @typeParameters)
(method_declaration type: (_) @returnType)
(method_declaration (modifiers "static" @static))
((method_declaration (modifiers "abstract") !body) @declaration.method.signature.abstract)
(interface_body (method_declaration !body) @declaration.method.signature)
(constructor_declaration) @declaration.constructor
(constructor_declaration type_parameters: (_) @typeParameters)
(compact_constructor_declaration) @declaration.constructor
(field_declaration) @declaration.field
(field_declaration type: (_) @type)
(field_declaration (modifiers "static" @static))
(constant_declaration) @declaration.constant
(formal_parameter) @declaration.parameter
(formal_parameter type: (_) @type)
(spread_parameter) @declaration.parameter.variadic
(receiver_parameter) @declaration.parameter.receiver
(local_variable_declaration) @declaration.variable
(local_variable_declaration type: (_) @type)
((local_variable_declaration (modifiers "final")) @declaration.variable.constant)
(type_parameter) @declaration.type_parameter
(type_parameter type_bound: (_) @bounds)
(module_declaration) @declaration.module
((method_declaration (modifiers "public")) @declaration.method.public)
((method_declaration (modifiers "private")) @declaration.method.private)
((method_declaration (modifiers "protected")) @declaration.method.protected)
((field_declaration (modifiers "public")) @declaration.field.public)
((field_declaration (modifiers "private")) @declaration.field.private)
((field_declaration (modifiers "protected")) @declaration.field.protected)
((constructor_declaration (modifiers "public")) @declaration.constructor.public)
((constructor_declaration (modifiers "private")) @declaration.constructor.private)
((constructor_declaration (modifiers "protected")) @declaration.constructor.protected)
((enum_declaration (modifiers "public")) @declaration.enum.public)
((enum_declaration (modifiers "private")) @declaration.enum.private)
((constant_declaration (modifiers "public")) @declaration.constant.public)
((constant_declaration (modifiers "private")) @declaration.constant.private)

; ── clause ─────────────────────────────────────────────────────────────────────
(catch_clause) @clause.catch
(finally_clause) @clause.finally
(superclass) @clause.extends
(super_interfaces) @clause.implements
(extends_interfaces) @clause.extends.type
(switch_block_statement_group) @clause.case.switch
(switch_rule) @clause.case.match
(resource_specification) @clause.resource
(resource) @clause.resource.item
(type_bound) @clause.bounds

; ── statement ──────────────────────────────────────────────────────────────────
(import_declaration) @statement.import
(asterisk) @clause.import.wildcard
(block) @statement.block
(static_initializer) @statement.block.static
(if_statement) @statement.if
(if_statement alternative: (_) @alternative)
(while_statement) @statement.loop.while
(do_statement) @statement.loop.do_while
(for_statement) @statement.loop.counted
(enhanced_for_statement) @statement.loop.for_each
(switch_expression) @statement.switch
(return_statement) @statement.return
(break_statement) @statement.break
(break_statement identifier: (_) @label)
(continue_statement) @statement.continue
(continue_statement identifier: (_) @label)
(labeled_statement) @statement.labeled
(throw_statement) @statement.throw
(try_statement) @statement.try
(try_with_resources_statement) @statement.resource
(assert_statement) @statement.assert
(expression_statement) @statement.expression

; ── expression ─────────────────────────────────────────────────────────────────
(method_invocation) @expression.call
(method_invocation (method_invocation_arm object: (_))) @expression.call.member
(method_invocation (method_invocation_arm type_arguments: (_) @typeArguments))
(field_access) @expression.member
(array_access) @expression.subscript
(parenthesized_expression) @expression.parenthesized
(lambda_expression) @expression.lambda
(ternary_expression) @expression.conditional
(cast_expression) @expression.cast
(instanceof_expression) @expression.binary.membership.instanceof
(object_creation_expression) @expression.call.construct
(unqualified_object_creation_expression) @expression.call.construct
(array_creation_expression) @expression.collection.list
(array_initializer) @expression.collection.list
(template_expression) @expression.call.template
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
(binary_expression operator: ">>>") @expression.binary.shift.right_unsigned
(binary_expression operator: "&&") @expression.binary.logical.and
(binary_expression operator: "||") @expression.binary.logical.or
(unary_expression) @expression.unary
(unary_expression operator: "-") @expression.unary.negation
(unary_expression operator: "+") @expression.unary.plus
(unary_expression operator: "!") @expression.unary.not
(unary_expression operator: "~") @expression.unary.bitwise_not
(update_expression) @expression.update
(update_expression "++") @expression.update.increment
(update_expression "--") @expression.update.decrement
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
(assignment_expression operator: ">>>=") @expression.assignment.compound.shift_right_unsigned

; ── pattern ────────────────────────────────────────────────────────────────────
(pattern) @pattern
(record_pattern) @pattern.struct
(record_pattern_component) @pattern.struct.field
(underscore_pattern) @pattern.wildcard

; ── type ───────────────────────────────────────────────────────────────────────
(integral_type) @type.primitive.integral
((integral_type) @type.primitive.integral.int8 (#eq? @type.primitive.integral.int8 "byte"))
((integral_type) @type.primitive.integral.int16 (#eq? @type.primitive.integral.int16 "short"))
((integral_type) @type.primitive.integral.int32 (#eq? @type.primitive.integral.int32 "int"))
((integral_type) @type.primitive.integral.int64 (#eq? @type.primitive.integral.int64 "long"))
((integral_type) @type.primitive.character (#eq? @type.primitive.character "char"))
(floating_point_type) @type.primitive.floating
((floating_point_type) @type.primitive.floating.float32 (#eq? @type.primitive.floating.float32 "float"))
((floating_point_type) @type.primitive.floating.float64 (#eq? @type.primitive.floating.float64 "double"))
(boolean_type) @type.primitive.boolean
(void_type) @type.primitive.void
(array_type) @type.array
(generic_type) @type.generic
(modifiers) @modifier

; ── literal ────────────────────────────────────────────────────────────────────
(decimal_integer_literal) @literal.number.integer
(hex_integer_literal) @literal.number.integer.hex
(octal_integer_literal) @literal.number.integer.octal
(binary_integer_literal) @literal.number.integer.binary
(decimal_floating_point_literal) @literal.number.float
(hex_floating_point_literal) @literal.number.float
(character_literal) @literal.character
(string_literal) @literal.string
(string_literal (multiline_string_literal_arm1)) @literal.string.multiline
(string_fragment) @literal.string.text
(multiline_string_fragment) @literal.string.text
(escape_sequence) @literal.string.escape
(string_interpolation) @expression.interpolation
(true) @literal.boolean.true
(false) @literal.boolean.false
(null_literal) @literal.null

; ── identifier ─────────────────────────────────────────────────────────────────
(identifier) @identifier
(type_identifier) @identifier
(scoped_identifier) @identifier.qualified
(scoped_type_identifier) @identifier.qualified
(this) @identifier.receiver
(super) @identifier.super

; ── attribute ──────────────────────────────────────────────────────────────────
(annotation) @attribute
(marker_annotation) @attribute

; ── comment ────────────────────────────────────────────────────────────────────
(line_comment) @comment.line
(block_comment) @comment.block
((block_comment) @comment.block.doc (#match? @comment.block.doc "^/\\*\\*"))
