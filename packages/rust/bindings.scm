; bindings.scm — rust: which rust node is which vocabulary kind, and which slot is which member.
; How `sittir tool bindings-inventory` reads a pattern: docs/glossary/packages-tools-src-inventory.md
; (`readBindings` for the captures, `derive` for the members a claim takes from its slots).

; ── file ───────────────────────────────────────────────────────────────────────
(source_file) @file

; ── declaration ────────────────────────────────────────────────────────────────
(function_item) @declaration.function
(function_item (function_modifiers "async" @async))
(function_item (function_modifiers "const" @const))
(function_item (function_modifiers "unsafe" @unsafe))
(function_item (function_modifiers "default" @default))
(function_item (function_modifiers (extern_modifier) @extern))
(function_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.function.private
(function_item (visibility_modifier (visibility_modifier_pub))) @declaration.function.public
(function_item (visibility_modifier (crate_visibility_modifier))) @declaration.function.public.crate
(function_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.function.public.crate
(function_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.function.public.restricted
(function_signature_item) @declaration.function.signature
(function_signature_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.function.signature.private
(function_signature_item (visibility_modifier (visibility_modifier_pub))) @declaration.function.signature.public
(function_signature_item (visibility_modifier (crate_visibility_modifier))) @declaration.function.signature.public.crate
(function_signature_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.function.signature.public.crate
(function_signature_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.function.signature.public.restricted
(trait_item (declaration_list (function_signature_item) @declaration.method.signature))
(trait_item (declaration_list (function_signature_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.method.signature.private))
(trait_item (declaration_list (function_signature_item (visibility_modifier (visibility_modifier_pub))) @declaration.method.signature.public))
(trait_item (declaration_list (function_signature_item (visibility_modifier (crate_visibility_modifier))) @declaration.method.signature.public.crate))
(trait_item (declaration_list (function_signature_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.method.signature.public.crate))
(trait_item (declaration_list (function_signature_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.method.signature.public.restricted))
(impl_item_body (declaration_list (function_item (parameters (parameters_elements . (attributed_parameter (self_parameter)) @receiver))) @declaration.method))
(impl_item_body (declaration_list (function_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.method.private))
(impl_item_body (declaration_list (function_item (visibility_modifier (visibility_modifier_pub))) @declaration.method.public))
(impl_item_body (declaration_list (function_item (visibility_modifier (crate_visibility_modifier))) @declaration.method.public.crate))
(impl_item_body (declaration_list (function_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.method.public.crate))
(impl_item_body (declaration_list (function_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.method.public.restricted))
(impl_item_body (declaration_list (function_item (parameters (parameters_elements (attributed_parameter (attribute_item)? (_) @_p)*)?)) @declaration.method.static) (#not-kind-eq? @_p "self_parameter"))
(impl_item_body) @declaration.impl
(impl_item_semi) @declaration.impl
(impl_item_body trait_clause: (_ trait: (_) @implements)) @declaration.impl.conformance
(trait_item) @declaration.interface.trait
(trait_item bounds: (trait_bounds bounds: (_) @extends))
(trait_item (declaration_list (function_item) @declaration.method))
(trait_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.interface.trait.private
(trait_item (visibility_modifier (visibility_modifier_pub))) @declaration.interface.trait.public
(trait_item (visibility_modifier (crate_visibility_modifier))) @declaration.interface.trait.public.crate
(trait_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.interface.trait.public.crate
(trait_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.interface.trait.public.restricted
(trait_item (declaration_list (function_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.method.private))
(trait_item (declaration_list (function_item (visibility_modifier (visibility_modifier_pub))) @declaration.method.public))
(trait_item (declaration_list (function_item (visibility_modifier (crate_visibility_modifier))) @declaration.method.public.crate))
(trait_item (declaration_list (function_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.method.public.crate))
(trait_item (declaration_list (function_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.method.public.restricted))
(struct_item) @declaration.struct
(struct_item_brace (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.struct.private
(struct_item_brace (visibility_modifier (visibility_modifier_pub))) @declaration.struct.public
(struct_item_brace (visibility_modifier (crate_visibility_modifier))) @declaration.struct.public.crate
(struct_item_brace (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.struct.public.crate
(struct_item_brace (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.struct.public.restricted
(struct_item_tuple) @declaration.struct.tuple
(struct_item_tuple (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.struct.tuple.private
(struct_item_tuple (visibility_modifier (visibility_modifier_pub))) @declaration.struct.tuple.public
(struct_item_tuple (visibility_modifier (crate_visibility_modifier))) @declaration.struct.tuple.public.crate
(struct_item_tuple (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.struct.tuple.public.crate
(struct_item_tuple (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.struct.tuple.public.restricted
(struct_item_unit) @declaration.struct.unit
(struct_item_unit (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.struct.unit.private
(struct_item_unit (visibility_modifier (visibility_modifier_pub))) @declaration.struct.unit.public
(struct_item_unit (visibility_modifier (crate_visibility_modifier))) @declaration.struct.unit.public.crate
(struct_item_unit (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.struct.unit.public.crate
(struct_item_unit (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.struct.unit.public.restricted
(enum_item) @declaration.enum
(enum_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.enum.private
(enum_item (visibility_modifier (visibility_modifier_pub))) @declaration.enum.public
(enum_item (visibility_modifier (crate_visibility_modifier))) @declaration.enum.public.crate
(enum_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.enum.public.crate
(enum_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.enum.public.restricted
(enum_variant) @declaration.variant
(enum_variant (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.variant.private
(enum_variant (visibility_modifier (visibility_modifier_pub))) @declaration.variant.public
(enum_variant (visibility_modifier (crate_visibility_modifier))) @declaration.variant.public.crate
(enum_variant (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.variant.public.crate
(enum_variant (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.variant.public.restricted
(enum_variant body: (ordered_field_declaration_list)) @declaration.variant.tuple
(enum_variant (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self)))) body: (ordered_field_declaration_list)) @declaration.variant.tuple.private
(enum_variant (visibility_modifier (visibility_modifier_pub)) body: (ordered_field_declaration_list)) @declaration.variant.tuple.public
(enum_variant (visibility_modifier (crate_visibility_modifier)) body: (ordered_field_declaration_list)) @declaration.variant.tuple.public.crate
(enum_variant (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate)))) body: (ordered_field_declaration_list)) @declaration.variant.tuple.public.crate
(enum_variant (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope)) body: (ordered_field_declaration_list)) @declaration.variant.tuple.public.restricted
(enum_variant body: (field_declaration_list)) @declaration.variant.struct
(enum_variant (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self)))) body: (field_declaration_list)) @declaration.variant.struct.private
(enum_variant (visibility_modifier (visibility_modifier_pub)) body: (field_declaration_list)) @declaration.variant.struct.public
(enum_variant (visibility_modifier (crate_visibility_modifier)) body: (field_declaration_list)) @declaration.variant.struct.public.crate
(enum_variant (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate)))) body: (field_declaration_list)) @declaration.variant.struct.public.crate
(enum_variant (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope)) body: (field_declaration_list)) @declaration.variant.struct.public.restricted
(attributed_enum_variant (attribute_item)* @attributes (_) @element)
(union_item) @declaration.union
(union_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.union.private
(union_item (visibility_modifier (visibility_modifier_pub))) @declaration.union.public
(union_item (visibility_modifier (crate_visibility_modifier))) @declaration.union.public.crate
(union_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.union.public.crate
(union_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.union.public.restricted
(type_item type: (_) @value) @declaration.type_alias
(type_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.type_alias.private
(type_item (visibility_modifier (visibility_modifier_pub))) @declaration.type_alias.public
(type_item (visibility_modifier (crate_visibility_modifier))) @declaration.type_alias.public.crate
(type_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.type_alias.public.crate
(type_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.type_alias.public.restricted
(associated_type) @declaration.type_alias.associated
(associated_type bounds: (trait_bounds bounds: (_) @bounds))
(mod_item) @declaration.mod
(mod_item_external (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.mod.private
(mod_item_external (visibility_modifier (visibility_modifier_pub))) @declaration.mod.public
(mod_item_external (visibility_modifier (crate_visibility_modifier))) @declaration.mod.public.crate
(mod_item_external (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.mod.public.crate
(mod_item_external (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.mod.public.restricted
(mod_item_inline (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.mod.private
(mod_item_inline (visibility_modifier (visibility_modifier_pub))) @declaration.mod.public
(mod_item_inline (visibility_modifier (crate_visibility_modifier))) @declaration.mod.public.crate
(mod_item_inline (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.mod.public.crate
(mod_item_inline (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.mod.public.restricted
(foreign_mod_item) @declaration.mod.foreign
(foreign_mod_item_body "unsafe" @unsafe)
(foreign_mod_item_semi "unsafe" @unsafe)
(extern_crate_declaration) @statement.import.crate
(extern_crate_declaration (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @statement.import.crate.private
(extern_crate_declaration (visibility_modifier (visibility_modifier_pub))) @statement.import.crate.public
(extern_crate_declaration (visibility_modifier (crate_visibility_modifier))) @statement.import.crate.public.internal
(extern_crate_declaration (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @statement.import.crate.public.internal
(extern_crate_declaration (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @statement.import.crate.public.restricted
(const_item) @declaration.constant
(const_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.constant.private
(const_item (visibility_modifier (visibility_modifier_pub))) @declaration.constant.public
(const_item (visibility_modifier (crate_visibility_modifier))) @declaration.constant.public.crate
(const_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.constant.public.crate
(const_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.constant.public.restricted
(let_declaration pattern: (_) @name) @declaration.variable
(static_item) @declaration.variable
(static_item ref: _ @byReference)
(static_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.variable.private
(static_item (visibility_modifier (visibility_modifier_pub))) @declaration.variable.public
(static_item (visibility_modifier (crate_visibility_modifier))) @declaration.variable.public.crate
(static_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.variable.public.crate
(static_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.variable.public.restricted
(field_declaration) @declaration.field
(field_declaration (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.field.private
(field_declaration (visibility_modifier (visibility_modifier_pub))) @declaration.field.public
(field_declaration (visibility_modifier (crate_visibility_modifier))) @declaration.field.public.crate
(field_declaration (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.field.public.crate
(field_declaration (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.field.public.restricted
(attributed_ordered_field (attribute_item)* @attributes) @declaration.field
(attributed_ordered_field (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.field.private
(attributed_ordered_field (visibility_modifier (visibility_modifier_pub))) @declaration.field.public
(attributed_ordered_field (visibility_modifier (crate_visibility_modifier))) @declaration.field.public.crate
(attributed_ordered_field (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.field.public.crate
(attributed_ordered_field (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.field.public.restricted
(attributed_field_declaration (attribute_item)* @attributes (_) @element)
(macro_definition name: (_) (_)? @rules) @declaration.macro
(parameter name: (_) @name) @declaration.parameter
(parameter (mutable_specifier) @mutable)
(self_parameter) @declaration.parameter.self
(parameter name: (self)) @declaration.parameter.self
(self_parameter (mutable_specifier) @mutable)
(variadic_parameter) @declaration.parameter.variadic
(closure_parameters (_) @declaration.parameter)
((attributed_parameter (attribute_item)? @dropped (_) @element) (#set! reason "the element admits the _type supertype, so an attributes capture would reach only some of the kinds it holds"))
(type_parameter default_type: (_)? @default) @declaration.type_parameter
(type_parameter bounds: (trait_bounds bounds: (_) @bounds))
(const_parameter value: (_)? @default) @declaration.type_parameter.value
(lifetime_parameter) @declaration.type_parameter.lifetime
(lifetime_parameter bounds: (trait_bounds bounds: (_) @bounds))
(attributed_type_parameter (attribute_item)* @attributes (_) @element)


; Each owner keeps the ordinary list after receiver extraction.
(function_item (parameters (parameters_elements item: (_)* @parameters)?))
(function_signature_item (parameters (parameters_elements item: (_)* @parameters)?))
(function_type (parameters (parameters_elements item: (_)* @parameters)?))
(function_item (parameters (parameters_elements . (attributed_parameter (self_parameter)) @receiver)))
(function_item (parameters (parameters_elements . (attributed_parameter (parameter name: (self))) @receiver)))
(function_signature_item (parameters (parameters_elements . (attributed_parameter (self_parameter)) @receiver)))
(function_signature_item (parameters (parameters_elements . (attributed_parameter (parameter name: (self))) @receiver)))
((function_type (parameters (parameters_elements . (attributed_parameter (self_parameter)) @dropped))) (#set! reason "a function pointer type does not declare a receiver"))

; ── statement ──────────────────────────────────────────────────────────────────
(block) @statement.block
(if_expression) @statement.if
(loop_expression) @statement.loop
(while_expression) @statement.loop.while
(for_expression pattern: (_) @left value: (_) @right) @statement.loop.for_each
(return_expression (_)? @expression) @statement.return
(match_expression value: (_) @subject) @statement.match
(use_declaration) @statement.use
(use_declaration (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @statement.use.private
(use_declaration (visibility_modifier (visibility_modifier_pub))) @statement.use.public
(use_declaration (visibility_modifier (crate_visibility_modifier))) @statement.use.public.internal
(use_declaration (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @statement.use.public.internal
(use_declaration (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @statement.use.public.restricted
(expression_statement) @statement.expression
(empty_statement) @statement.empty
(break_expression) @statement.break
(continue_expression) @statement.continue

; ── clause ─────────────────────────────────────────────────────────────────────
(where_clause) @clause.where
(where_predicate) @clause.where.predicate
(where_predicate bounds: (trait_bounds bounds: (_) @bounds))
(else_clause) @clause.else
(let_condition) @clause.let
(let_chain) @clause.let.chain
(match_arm pattern: _ @match) @clause.match.arm
(last_match_arm pattern: _ @match) @clause.match.arm.last
(use_as_clause) @clause.import.alias
(use_as_clause path: (_) @name)
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
((attributed_argument (attribute_item)* @dropped (_) @element) (#set! reason "the element is the _expression supertype, so an attributes capture would have no direct target"))

; ── element (pieces of a composite expression that are not expressions) ────────
(field_initializer) @element.struct.field
(field_initializer (attribute_item)* @attributes)
(shorthand_field_initializer) @element.struct.field
(shorthand_field_initializer name: (_) @field)
(base_field_initializer) @element.struct.base
(type_binding) @element.type_binding
(token_tree) @element.macro.token_tree
(delim_token_tree (_)* @tokens) @element.macro.token_tree.delimited
(token_tree_pattern (_)* @tokens) @element.macro.token_tree.pattern
(token_binding_pattern) @element.macro.token_binding
(token_repetition) @element.macro.token_repetition
(token_repetition_pattern) @element.macro.token_repetition.pattern
(fragment_specifier) @element.macro.fragment

; ── expression ─────────────────────────────────────────────────────────────────
(call_expression) @expression.call
(call_expression function: (field_expression) @function) @expression.call.field
(call_expression function: (scoped_identifier) @function) @expression.call.scoped
(macro_invocation macro: (_) @function arguments: (delim_token_tree) @arguments) @expression.call.macro
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
(reference_expression_mut (mutable_specifier) @exclusive)
(reference_expression_raw_const "raw" @raw)
(reference_expression_raw_mut "raw" @raw)
(reference_expression_raw_mut (mutable_specifier) @writable)
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
(field_expression value: (_) @object field: (_) @property) @expression.field
(index_expression (_) @object (_) @index) @expression.index
(closure_expression body: (_)? @body) @expression.closure
(await_expression (_)? @expression) @expression.await
(yield_expression) @expression.yield
(range_expression) @expression.range
(range_expression_binary operator: "..=") @expression.range.inclusive
(range_expression_binary operator: "...") @expression.range.inclusive
(range_expression_binary operator: "..") @expression.range.exclusive
(range_expression_postfix) @expression.range.exclusive
(range_expression_prefix) @expression.range.exclusive
(range_expression_bare) @expression.range.exclusive
(type_cast_expression) @expression.cast.conversion
(type_cast_expression value: (_) @expression)
(parenthesized_expression) @expression.parenthesized
(tuple_expression (expressions) @elements) @expression.collection.tuple
(array_expression) @expression.collection.array
(array_expression_semi) @expression.collection.array.repeat
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
(field_pattern ref: _? @byReference) @pattern.struct.field
(remaining_field_pattern) @pattern.struct.rest
(slice_pattern (patterns)? @elements) @pattern.slice
(or_pattern) @pattern.or
(range_pattern) @pattern.range
(range_pattern_prefix "..=") @pattern.range.inclusive
(range_pattern_prefix "..") @pattern.range.exclusive
(range_pattern_with_left (range_pattern_with_left_with_right "..=")) @pattern.range.inclusive
(range_pattern_with_left (range_pattern_with_left_with_right "...")) @pattern.range.inclusive
(range_pattern_with_left (range_pattern_with_left_with_right "..")) @pattern.range.exclusive
(range_pattern_with_left (range_pattern_with_left_bare)) @pattern.range.exclusive
(range_pattern_with_left (range_pattern_with_left_with_right right: (_) @right))
(ref_pattern) @pattern.reference
(reference_pattern) @pattern.reference.value
(reference_pattern (mutable_specifier) @exclusive)
(mut_pattern) @pattern.mutable
(captured_pattern) @pattern.as
(generic_pattern) @pattern.generic
(wildcard_pattern) @pattern.wildcard

; ── type ───────────────────────────────────────────────────────────────────────
(primitive_type) @type.primitive
((primitive_type) @type.primitive.integral.int8 (#eq? @type.primitive.integral.int8 "i8"))
((primitive_type) @type.primitive.integral.int8.unsigned (#eq? @type.primitive.integral.int8.unsigned "u8"))
((primitive_type) @type.primitive.integral.int16 (#eq? @type.primitive.integral.int16 "i16"))
((primitive_type) @type.primitive.integral.int16.unsigned (#eq? @type.primitive.integral.int16.unsigned "u16"))
((primitive_type) @type.primitive.integral.int32 (#eq? @type.primitive.integral.int32 "i32"))
((primitive_type) @type.primitive.integral.int32.unsigned (#eq? @type.primitive.integral.int32.unsigned "u32"))
((primitive_type) @type.primitive.integral.int64 (#eq? @type.primitive.integral.int64 "i64"))
((primitive_type) @type.primitive.integral.int64.unsigned (#eq? @type.primitive.integral.int64.unsigned "u64"))
((primitive_type) @type.primitive.integral.int128 (#eq? @type.primitive.integral.int128 "i128"))
((primitive_type) @type.primitive.integral.int128.unsigned (#eq? @type.primitive.integral.int128.unsigned "u128"))
((primitive_type) @type.primitive.integral.size (#eq? @type.primitive.integral.size "isize"))
((primitive_type) @type.primitive.integral.size.unsigned (#eq? @type.primitive.integral.size.unsigned "usize"))
((primitive_type) @type.primitive.floating.float32 (#eq? @type.primitive.floating.float32 "f32"))
((primitive_type) @type.primitive.floating.float64 (#eq? @type.primitive.floating.float64 "f64"))
((primitive_type) @type.primitive.bool (#eq? @type.primitive.bool "bool"))
((primitive_type) @type.primitive.char (#eq? @type.primitive.char "char"))
((primitive_type) @type.primitive.str (#eq? @type.primitive.str "str"))
(generic_type) @type.generic
(generic_type_with_turbofish) @type.generic.turbofish
(type_argument) @element.type_argument
(type_argument (trait_bounds bounds: (_) @bounds))
(reference_type) @type.reference
(reference_type (mutable_specifier) @exclusive)
(pointer_type) @type.pointer
(pointer_type_mut (mutable_specifier) @writable)
(array_type) @type.array
(tuple_type) @type.tuple
(unit_type) @type.unit
(never_type) @type.primitive.never
(function_type) @type.function
(function_type (function_type_trait_form trait: (_) @trait))
(function_type (function_type_fn_form (function_modifiers "unsafe" @unsafe)))
(function_type (function_type_fn_form (function_modifiers (extern_modifier) @extern)))
(abstract_type) @type.abstract
(dynamic_type) @type.dynamic
(bounded_type) @type.bounded
(qualified_type) @type.qualified
(bracketed_type) @type.bracketed
(scoped_type_identifier) @type.path
(scoped_type_identifier_in_expression_position) @type.path.expression
((type_identifier) @type.named.prelude (#match? @type.named.prelude "^(Option|Result|String|Vec|Box)$"))

; ── literal ────────────────────────────────────────────────────────────────────
(string_literal) @literal.string
((string_literal) @literal.string.bytes (#match? @literal.string.bytes "^b\""))
(raw_string_literal string_content: (string_content) @content) @literal.string.raw
(char_literal) @literal.char
(escape_sequence) @literal.string.escape
(string_content) @literal.string.text
(integer_literal_decimal) @literal.number.integer
(integer_literal_hex) @literal.number.integer.hex
(integer_literal_binary) @literal.number.integer.binary
(integer_literal_octal) @literal.number.integer.octal
(float_literal) @literal.number.float
(negative_literal) @literal.number.negative
(boolean_literal) @literal.boolean
((boolean_literal) @literal.boolean.true (#eq? @literal.boolean.true "true"))
((boolean_literal) @literal.boolean.false (#eq? @literal.boolean.false "false"))

; ── identifier ─────────────────────────────────────────────────────────────────
(identifier) @identifier
(type_identifier) @identifier.type
(field_identifier) @identifier.field
(shorthand_field_identifier) @identifier.property.shorthand
(metavariable) @identifier.metavariable
(lifetime) @identifier.lifetime
(label) @identifier.label
(self) @identifier.self
(super) @identifier.super
(crate) @identifier.crate

; a keyword modifier is a member of what it modifies (`async`, `const`, `unsafe`, `mutable`), never a kind;
; a modifier with structure (`pub(in path)`, `extern "C"`) is a kind carrying that structure
; ── modifier ───────────────────────────────────────────────────────────────────
(visibility_modifier (_) @element)
(crate_visibility_modifier) @modifier.visibility.public.crate
(visibility_modifier_pub) @modifier.visibility.public
(visibility_modifier_pub (visibility_modifier_pub_scope (self))) @modifier.visibility.private
(visibility_modifier_pub (visibility_modifier_pub_scope (crate))) @modifier.visibility.public.crate
(visibility_modifier_pub (visibility_modifier_pub_scope (super) @scope)) @modifier.visibility.public.restricted
(visibility_modifier_pub (visibility_modifier_pub_scope (visibility_modifier_pub_scope_in_path (_) @scope))) @modifier.visibility.public.restricted
(extern_modifier) @modifier.extern

; ── attribute ──────────────────────────────────────────────────────────────────
(attribute_item (attribute)? @content) @attribute
(inner_attribute_item (attribute)? @content) @attribute.inner
(attribute) @attribute.content
(attribute input: (attribute_input value: (_) @input))
(attribute input: (attribute_input arguments: (_) @input))

; ── comment ────────────────────────────────────────────────────────────────────
(line_comment) @comment.line
(block_comment) @comment.block
(line_comment (line_comment_doc_outer)) @comment.line.doc
(line_comment (line_comment_doc_inner)) @comment.line.doc.inner
(block_comment (block_comment_doc_outer)) @comment.block.doc
(block_comment (block_comment_doc_inner)) @comment.block.doc.inner
(doc_comment) @comment.text
(line_comment_regular) @comment.text
(line_comment_extra_slashes) @comment.text
(block_comment_regular) @comment.text

; ── keyword / punctuation ──────────────────────────────────────────────────────
["fn" "let" "impl" "trait" "struct" "enum" "mod" "type"] @keyword.declaration
["use" "extern"] @keyword.import
(crate) @keyword.import
["if" "else" "match"] @keyword.conditional
["for" "while" "loop"] @keyword.repeat
["return" "break" "continue"] @keyword.return
["pub"] @keyword.visibility
["async" "unsafe" "const" "static" "move" "dyn"] @keyword.modifier
(mutable_specifier) @keyword.modifier
["as" "in" "where"] @keyword.operator
["(" ")" "[" "]" "{" "}"] @punctuation.bracket
["," ";" ":" "::" "->" "=>"] @punctuation.delimiter

; ── unclaimed (parser artefacts) ───────────────────────────────────────────────
((shebang) @unclaimed (#set! reason "interpreter line, not an item"))
((string_open) @unclaimed (#set! reason "string delimiter, not content"))
((raw_string_literal_start) @unclaimed (#set! reason "string delimiter, not content"))
((raw_string_literal_end) @unclaimed (#set! reason "string delimiter, not content"))
