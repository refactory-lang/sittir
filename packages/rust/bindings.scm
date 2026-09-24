; bindings.scm — rust.
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
(source_file) @module

; ── declaration ────────────────────────────────────────────────────────────────
(function_item) @declaration.function
(function_item (function_modifiers "async" @async))
(function_item (function_modifiers "const" @const))
(function_item (function_modifiers "unsafe" @unsafe))
(function_item (function_modifiers "default" @default))
(function_item (function_modifiers (extern_modifier) @extern))
(function_signature_item) @declaration.function.signature
(trait_item (declaration_list (function_signature_item) @declaration.method.signature))
(impl_item (declaration_list (function_item (parameters . (self_parameter) @receiver)) @declaration.method))
(impl_item (declaration_list (function_item (parameters . (_) @_first)) @declaration.method.static))
(impl_item) @declaration.extension
(impl_item trait: (_) @implements) @declaration.extension.conformance
(trait_item bounds: (_)? @extends (declaration_list (function_item) @declaration.method)) @declaration.interface.trait
(struct_item) @declaration.struct
(enum_item) @declaration.enum
(enum_variant) @declaration.enum_member
(enum_variant body: (ordered_field_declaration_list)) @declaration.enum_member.tuple
(enum_variant body: (field_declaration_list)) @declaration.enum_member.struct
(union_item) @declaration.union
(type_item type: (_) @value) @declaration.type_alias
(associated_type) @declaration.type_alias.associated
(mod_item) @declaration.module
(foreign_mod_item) @declaration.module.foreign
(extern_crate_declaration) @statement.import.crate
(const_item) @declaration.constant
(static_item) @declaration.variable.static
(let_declaration pattern: (_) @name) @declaration.variable
(field_declaration) @declaration.field
(macro_definition) @declaration.macro
(parameter pattern: (_) @name) @declaration.parameter
(parameter (mutable_specifier) @mutable)
(self_parameter) @declaration.parameter.self
(self_parameter (mutable_specifier) @mutable)
(variadic_parameter) @declaration.parameter.variadic
(closure_parameters (_) @declaration.parameter)
(type_parameter bounds: (_)? @constraint default_type: (_)? @default) @declaration.type_parameter
(const_parameter) @declaration.type_parameter.const
(lifetime_parameter) @declaration.type_parameter.lifetime

; ── statement ──────────────────────────────────────────────────────────────────
(block) @statement.block
(if_expression) @statement.if
(loop_expression) @statement.loop
(while_expression) @statement.loop.while
(for_expression pattern: (_) @left value: (_) @right) @statement.loop.for
(return_expression (_)? @expression) @statement.return
(match_expression value: (_) @subject) @statement.match
(use_declaration) @statement.import
(expression_statement) @statement.expression
(empty_statement) @statement.empty
(break_expression) @statement.break
(continue_expression) @statement.continue

; ── clause ─────────────────────────────────────────────────────────────────────
(where_clause) @clause.where
(where_predicate) @clause.where.predicate
(else_clause) @clause.else
(let_condition) @clause.let
(let_chain) @clause.let.chain
(match_arm) @clause.match.arm
(last_match_arm) @clause.match.arm.last
(use_as_clause) @clause.import.as
(use_list) @clause.import.list
(scoped_use_list) @clause.import.list.scoped
(use_wildcard) @clause.import.wildcard
(macro_rule) @clause.macro.rule
(trait_bounds) @clause.bounds
(higher_ranked_trait_bound) @clause.bounds.higher_ranked
(removed_trait_bound) @clause.bounds.removed
(use_bounds) @clause.bounds.use
(for_lifetimes) @clause.lifetimes

; ── argument (pieces of a call that are not expressions) ───────────────────────
; none: every Rust argument is an expression

; ── element (pieces of a composite expression that are not expressions) ────────
(field_initializer) @element.struct.field
(shorthand_field_initializer) @element.struct.field.shorthand
(base_field_initializer) @element.struct.base
(type_binding) @element.type_binding
(token_tree) @element.macro.token_tree
(delim_token_tree) @element.macro.token_tree.delimited
(token_tree_pattern) @element.macro.token_tree.pattern
(token_binding_pattern) @element.macro.token_binding
(token_repetition) @element.macro.token_repetition
(token_repetition_pattern) @element.macro.token_repetition.pattern
(fragment_specifier) @element.macro.fragment

; ── expression ─────────────────────────────────────────────────────────────────
(call_expression) @expression.call
(call_expression function: (field_expression) @function) @expression.call.member
(call_expression function: (scoped_identifier) @function) @expression.call.path
(macro_invocation macro: (_) @function (token_tree) @arguments) @expression.call.macro
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
(unary_expression (_) @argument) @expression.unary
(unary_expression "-" (_) @argument) @expression.unary.negation
(unary_expression "!" (_) @argument) @expression.unary.not
(unary_expression "*" (_) @argument) @expression.unary.deref
(reference_expression value: (_) @argument) @expression.reference
(try_expression (_) @argument) @expression.try
(compound_assignment_expr) @expression.assignment.compound
(compound_assignment_expr operator: "+=") @expression.assignment.compound.add
(compound_assignment_expr operator: "-=") @expression.assignment.compound.subtract
(compound_assignment_expr operator: "*=") @expression.assignment.compound.multiply
(compound_assignment_expr operator: "/=") @expression.assignment.compound.divide
(compound_assignment_expr operator: "%=") @expression.assignment.compound.modulo
(compound_assignment_expr operator: "&=") @expression.assignment.compound.bitwise_and
(compound_assignment_expr operator: "|=") @expression.assignment.compound.bitwise_or
(compound_assignment_expr operator: "^=") @expression.assignment.compound.bitwise_xor
(compound_assignment_expr operator: "<<=") @expression.assignment.compound.shift_left
(compound_assignment_expr operator: ">>=") @expression.assignment.compound.shift_right
(assignment_expression) @expression.assignment
(field_expression value: (_) @object field: (_) @property) @expression.member
(index_expression (_) @object (_) @index) @expression.subscript
(closure_expression body: (_)? @body) @expression.lambda
(await_expression (_)? @expression) @expression.await
(yield_expression) @expression.yield
(range_expression) @expression.range
(type_cast_expression) @expression.cast.as
(parenthesized_expression) @expression.parenthesized
(tuple_expression) @expression.collection.tuple
(array_expression) @expression.collection.list
(struct_expression) @expression.collection.struct
(unit_expression) @expression.unit
(unsafe_block) @expression.block.unsafe
(async_block) @expression.block.async
(const_block) @expression.block.const
(try_block) @expression.block.try
(gen_block) @expression.block.gen
(generic_function) @expression.instantiation
(scoped_identifier) @identifier.scoped

; ── pattern ────────────────────────────────────────────────────────────────────
(match_pattern) @pattern.match
(tuple_pattern) @pattern.tuple
(tuple_struct_pattern) @pattern.tuple.struct
(struct_pattern) @pattern.struct
(field_pattern) @pattern.struct.field
(remaining_field_pattern) @pattern.struct.rest
(slice_pattern) @pattern.slice
(or_pattern) @pattern.or
(range_pattern) @pattern.range
(ref_pattern) @pattern.reference
(reference_pattern) @pattern.reference.value
(mut_pattern) @pattern.mutable
(captured_pattern) @pattern.captured
(generic_pattern) @pattern.generic

; ── type ───────────────────────────────────────────────────────────────────────
(primitive_type) @type.primitive
(generic_type) @type.generic
(generic_type_with_turbofish) @type.generic.turbofish
(reference_type) @type.reference
(pointer_type) @type.pointer
(array_type) @type.array
(tuple_type) @type.tuple
(unit_type) @type.unit
(never_type) @type.primitive.never
(function_type) @type.function
(abstract_type) @type.abstract
(dynamic_type) @type.dynamic
(bounded_type) @type.bounded
(qualified_type) @type.qualified
(bracketed_type) @type.bracketed
(scoped_type_identifier) @type.path
(scoped_type_identifier_in_expression_position) @type.path.expression
((type_identifier) @type.named.prelude (#match? @type.named.prelude "^(Option|Result|String|Vec|Box)$"))

; ── literal ────────────────────────────────────────────────────────────────────
(string_literal (string_content)* @content) @literal.string
(raw_string_literal (raw_string_literal_content)? @content) @literal.string.raw
(char_literal) @literal.char
(escape_sequence) @literal.string.escape
(integer_literal) @literal.number.integer
(integer_literal_hex) @literal.number.integer.hex
(float_literal) @literal.number.float
(negative_literal) @literal.number.negative
(boolean_literal) @literal.boolean
((boolean_literal) @literal.boolean.true (#eq? @literal.boolean.true "true"))
((boolean_literal) @literal.boolean.false (#eq? @literal.boolean.false "false"))

; ── identifier ─────────────────────────────────────────────────────────────────
(identifier) @identifier
(type_identifier) @identifier.type
(field_identifier) @identifier.field
(metavariable) @identifier.metavariable
(lifetime) @identifier.lifetime
(label) @identifier.label
(self) @identifier.self
(super) @identifier.super
(crate) @identifier.crate

; a keyword modifier is a member of what it modifies (`async`, `const`, `unsafe`, `mutable`), never a kind;
; a modifier with structure (`pub(in path)`, `extern "C"`) is a kind carrying that structure
; ── modifier ───────────────────────────────────────────────────────────────────
(visibility_modifier) @modifier.visibility
(visibility_modifier_pub) @modifier.visibility.pub
(extern_modifier) @modifier.extern

; ── attribute ──────────────────────────────────────────────────────────────────
(attribute_item (attribute)? @content) @attribute
(inner_attribute_item (attribute)? @content) @attribute.inner
(attribute) @attribute.content

; ── comment ────────────────────────────────────────────────────────────────────
(line_comment) @comment.line
(block_comment) @comment.block
(line_comment (line_comment_doc_outer)) @comment.line.doc
(line_comment (line_comment_doc_inner)) @comment.line.doc.inner
(block_comment (block_comment_doc_outer)) @comment.block.doc
(block_comment (block_comment_doc_inner)) @comment.block.doc.inner

; ── keyword / punctuation ──────────────────────────────────────────────────────
["fn" "let" "impl" "trait" "struct" "enum" "mod" "type"] @keyword.declaration
["use" "extern" "crate"] @keyword.import
["if" "else" "match"] @keyword.conditional
["for" "while" "loop"] @keyword.repeat
["return" "break" "continue"] @keyword.return
["pub"] @keyword.visibility
["mut" "async" "unsafe" "const" "static" "move" "dyn"] @keyword.modifier
["as" "in" "where"] @keyword.operator
["(" ")" "[" "]" "{" "}"] @punctuation.bracket
["," ";" ":" "::" "->" "=>"] @punctuation.delimiter

; ── unclaimed (parser artefacts) ───────────────────────────────────────────────
((shebang) @unclaimed (#set! reason "interpreter line, not an item"))
