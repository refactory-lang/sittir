; bindings.scm — rust: which rust node is which vocabulary kind, and which slot is which member.
; How `sittir tool bindings-inventory` reads a pattern: docs/glossary/packages-tools-src-inventory.md
; (`readBindings` for the captures, `derive` for the members a claim takes from its slots).

; ── module ─────────────────────────────────────────────────────────────────────
(source_file) @module

; ── declaration ────────────────────────────────────────────────────────────────
(function_item) @declaration.function
(function_item (function_modifiers "async" @async))
(function_item (function_modifiers "const" @const))
(function_item (function_modifiers "unsafe" @unsafe))
(function_item (function_modifiers "default" @default))
(function_item (function_modifiers (extern_modifier) @extern))
(function_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.function.private
(function_item (visibility_modifier (visibility_modifier_pub))) @declaration.function.public
(function_item (visibility_modifier (crate))) @declaration.function.public.internal
(function_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.function.public.internal
(function_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.function.public.restricted
(function_signature_item) @declaration.function.signature
(function_signature_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.function.signature.private
(function_signature_item (visibility_modifier (visibility_modifier_pub))) @declaration.function.signature.public
(function_signature_item (visibility_modifier (crate))) @declaration.function.signature.public.internal
(function_signature_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.function.signature.public.internal
(function_signature_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.function.signature.public.restricted
(trait_item (declaration_list (function_signature_item) @declaration.method.signature))
(trait_item (declaration_list (function_signature_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.method.signature.private))
(trait_item (declaration_list (function_signature_item (visibility_modifier (visibility_modifier_pub))) @declaration.method.signature.public))
(trait_item (declaration_list (function_signature_item (visibility_modifier (crate))) @declaration.method.signature.public.internal))
(trait_item (declaration_list (function_signature_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.method.signature.public.internal))
(trait_item (declaration_list (function_signature_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.method.signature.public.restricted))
(impl_item_body (declaration_list (function_item (parameters (parameters_elements . (attributed_parameter (self_parameter) @_receiver)))) @declaration.method) (#kind-eq? @_receiver "self_parameter"))
(impl_item_body (declaration_list (function_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.method.private))
(impl_item_body (declaration_list (function_item (visibility_modifier (visibility_modifier_pub))) @declaration.method.public))
(impl_item_body (declaration_list (function_item (visibility_modifier (crate))) @declaration.method.public.internal))
(impl_item_body (declaration_list (function_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.method.public.internal))
(impl_item_body (declaration_list (function_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.method.public.restricted))
(impl_item_body (declaration_list (function_item (parameters (parameters_elements (attributed_parameter (attribute_item)? (_) @_p)*)?)) @declaration.method.static) (#not-kind-eq? @_p "self_parameter"))
(impl_item_body) @declaration.extension
(impl_item_semi) @declaration.extension
(impl_item_body trait_clause: (_ trait: (_) @implements)) @declaration.extension.conformance
(trait_item bounds: (_)? @extends (declaration_list (function_item) @declaration.method)) @declaration.interface.trait
(trait_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.interface.trait.private
(trait_item (visibility_modifier (visibility_modifier_pub))) @declaration.interface.trait.public
(trait_item (visibility_modifier (crate))) @declaration.interface.trait.public.internal
(trait_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.interface.trait.public.internal
(trait_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.interface.trait.public.restricted
(trait_item (declaration_list (function_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.method.private))
(trait_item (declaration_list (function_item (visibility_modifier (visibility_modifier_pub))) @declaration.method.public))
(trait_item (declaration_list (function_item (visibility_modifier (crate))) @declaration.method.public.internal))
(trait_item (declaration_list (function_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.method.public.internal))
(trait_item (declaration_list (function_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.method.public.restricted))
(struct_item) @declaration.struct
(struct_item_brace) @declaration.struct
(struct_item_brace (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.struct.private
(struct_item_brace (visibility_modifier (visibility_modifier_pub))) @declaration.struct.public
(struct_item_brace (visibility_modifier (crate))) @declaration.struct.public.internal
(struct_item_brace (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.struct.public.internal
(struct_item_brace (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.struct.public.restricted
(struct_item_tuple) @declaration.struct.tuple
(struct_item_tuple (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.struct.tuple.private
(struct_item_tuple (visibility_modifier (visibility_modifier_pub))) @declaration.struct.tuple.public
(struct_item_tuple (visibility_modifier (crate))) @declaration.struct.tuple.public.internal
(struct_item_tuple (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.struct.tuple.public.internal
(struct_item_tuple (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.struct.tuple.public.restricted
(struct_item_unit) @declaration.struct.unit
(struct_item_unit (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.struct.unit.private
(struct_item_unit (visibility_modifier (visibility_modifier_pub))) @declaration.struct.unit.public
(struct_item_unit (visibility_modifier (crate))) @declaration.struct.unit.public.internal
(struct_item_unit (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.struct.unit.public.internal
(struct_item_unit (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.struct.unit.public.restricted
(enum_item) @declaration.enum
(enum_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.enum.private
(enum_item (visibility_modifier (visibility_modifier_pub))) @declaration.enum.public
(enum_item (visibility_modifier (crate))) @declaration.enum.public.internal
(enum_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.enum.public.internal
(enum_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.enum.public.restricted
(enum_variant) @declaration.enum_member
(enum_variant (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.enum_member.private
(enum_variant (visibility_modifier (visibility_modifier_pub))) @declaration.enum_member.public
(enum_variant (visibility_modifier (crate))) @declaration.enum_member.public.internal
(enum_variant (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.enum_member.public.internal
(enum_variant (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.enum_member.public.restricted
(enum_variant body: (ordered_field_declaration_list)) @declaration.enum_member.tuple
(enum_variant (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self)))) body: (ordered_field_declaration_list)) @declaration.enum_member.tuple.private
(enum_variant (visibility_modifier (visibility_modifier_pub)) body: (ordered_field_declaration_list)) @declaration.enum_member.tuple.public
(enum_variant (visibility_modifier (crate)) body: (ordered_field_declaration_list)) @declaration.enum_member.tuple.public.internal
(enum_variant (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate)))) body: (ordered_field_declaration_list)) @declaration.enum_member.tuple.public.internal
(enum_variant (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope)) body: (ordered_field_declaration_list)) @declaration.enum_member.tuple.public.restricted
(enum_variant body: (field_declaration_list)) @declaration.enum_member.struct
(enum_variant (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self)))) body: (field_declaration_list)) @declaration.enum_member.struct.private
(enum_variant (visibility_modifier (visibility_modifier_pub)) body: (field_declaration_list)) @declaration.enum_member.struct.public
(enum_variant (visibility_modifier (crate)) body: (field_declaration_list)) @declaration.enum_member.struct.public.internal
(enum_variant (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate)))) body: (field_declaration_list)) @declaration.enum_member.struct.public.internal
(enum_variant (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope)) body: (field_declaration_list)) @declaration.enum_member.struct.public.restricted
(attributed_enum_variant (attribute_item)* @attributes (_) @element)
(union_item) @declaration.union
(union_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.union.private
(union_item (visibility_modifier (visibility_modifier_pub))) @declaration.union.public
(union_item (visibility_modifier (crate))) @declaration.union.public.internal
(union_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.union.public.internal
(union_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.union.public.restricted
(type_item type: (_) @value) @declaration.type_alias
(type_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.type_alias.private
(type_item (visibility_modifier (visibility_modifier_pub))) @declaration.type_alias.public
(type_item (visibility_modifier (crate))) @declaration.type_alias.public.internal
(type_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.type_alias.public.internal
(type_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.type_alias.public.restricted
(associated_type) @declaration.type_alias.associated
(mod_item) @declaration.module
(mod_item_external) @declaration.module
(mod_item_external (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.module.private
(mod_item_external (visibility_modifier (visibility_modifier_pub))) @declaration.module.public
(mod_item_external (visibility_modifier (crate))) @declaration.module.public.internal
(mod_item_external (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.module.public.internal
(mod_item_external (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.module.public.restricted
(mod_item_inline) @declaration.module
(mod_item_inline (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.module.private
(mod_item_inline (visibility_modifier (visibility_modifier_pub))) @declaration.module.public
(mod_item_inline (visibility_modifier (crate))) @declaration.module.public.internal
(mod_item_inline (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.module.public.internal
(mod_item_inline (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.module.public.restricted
(foreign_mod_item) @declaration.module.foreign
(foreign_mod_item_body) @declaration.module.foreign
(foreign_mod_item_body (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.module.foreign.private
(foreign_mod_item_body (visibility_modifier (visibility_modifier_pub))) @declaration.module.foreign.public
(foreign_mod_item_body (visibility_modifier (crate))) @declaration.module.foreign.public.internal
(foreign_mod_item_body (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.module.foreign.public.internal
(foreign_mod_item_body (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.module.foreign.public.restricted
(foreign_mod_item_semi) @declaration.module.foreign
(foreign_mod_item_semi (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.module.foreign.private
(foreign_mod_item_semi (visibility_modifier (visibility_modifier_pub))) @declaration.module.foreign.public
(foreign_mod_item_semi (visibility_modifier (crate))) @declaration.module.foreign.public.internal
(foreign_mod_item_semi (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.module.foreign.public.internal
(foreign_mod_item_semi (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.module.foreign.public.restricted
(extern_crate_declaration) @statement.import.crate
(extern_crate_declaration (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @statement.import.crate.private
(extern_crate_declaration (visibility_modifier (visibility_modifier_pub))) @statement.import.crate.public
(extern_crate_declaration (visibility_modifier (crate))) @statement.import.crate.public.internal
(extern_crate_declaration (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @statement.import.crate.public.internal
(extern_crate_declaration (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @statement.import.crate.public.restricted
(const_item) @declaration.constant
(const_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.constant.private
(const_item (visibility_modifier (visibility_modifier_pub))) @declaration.constant.public
(const_item (visibility_modifier (crate))) @declaration.constant.public.internal
(const_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.constant.public.internal
(const_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.constant.public.restricted
(static_item) @declaration.variable.static
(static_item ref: _ @byReference)
(static_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.variable.static.private
(static_item (visibility_modifier (visibility_modifier_pub))) @declaration.variable.static.public
(static_item (visibility_modifier (crate))) @declaration.variable.static.public.internal
(static_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.variable.static.public.internal
(static_item (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.variable.static.public.restricted
(let_declaration pattern: (_) @name) @declaration.variable
(field_declaration) @declaration.field
(field_declaration (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.field.private
(field_declaration (visibility_modifier (visibility_modifier_pub))) @declaration.field.public
(field_declaration (visibility_modifier (crate))) @declaration.field.public.internal
(field_declaration (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.field.public.internal
(field_declaration (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.field.public.restricted
(attributed_ordered_field (attribute_item)* @attributes) @declaration.field
(attributed_ordered_field (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @declaration.field.private
(attributed_ordered_field (visibility_modifier (visibility_modifier_pub))) @declaration.field.public
(attributed_ordered_field (visibility_modifier (crate))) @declaration.field.public.internal
(attributed_ordered_field (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @declaration.field.public.internal
(attributed_ordered_field (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @declaration.field.public.restricted
(attributed_field_declaration (attribute_item)* @attributes (_) @element)
(macro_definition name: (_) (_)? @rules) @declaration.macro
(parameter name: (_) @name) @declaration.parameter
(parameter (mutable_specifier) @mutable)
(self_parameter) @declaration.parameter.self
(self_parameter (mutable_specifier) @mutable)
(variadic_parameter) @declaration.parameter.variadic
(closure_parameters (_) @declaration.parameter)
((attributed_parameter (attribute_item)? @dropped (_) @element) (#set! reason "the element admits the _type supertype, so an attributes capture would reach only some of the kinds it holds"))
(type_parameter bounds: (_)? @constraint default_type: (_)? @default) @declaration.type_parameter
(const_parameter value: (_)? @default) @declaration.type_parameter.value
(lifetime_parameter) @declaration.type_parameter.lifetime
(attributed_type_parameter (attribute_item)* @attributes (_) @element)

; ── statement ──────────────────────────────────────────────────────────────────
(block) @statement.block
(if_expression) @statement.if
(loop_expression) @statement.loop
(while_expression) @statement.loop.while
(for_expression pattern: (_) @left value: (_) @right) @statement.loop.for
(return_expression (_)? @expression) @statement.return
(match_expression value: (_) @subject) @statement.match
(use_declaration) @statement.import
(use_declaration (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (self))))) @statement.import.private
(use_declaration (visibility_modifier (visibility_modifier_pub))) @statement.import.public
(use_declaration (visibility_modifier (crate))) @statement.import.public.internal
(use_declaration (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope (crate))))) @statement.import.public.internal
(use_declaration (visibility_modifier (visibility_modifier_pub (visibility_modifier_pub_scope [(super) (visibility_modifier_pub_scope_in_path)]) @scope))) @statement.import.public.restricted
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
(call_expression function: (field_expression) @function) @expression.call.member
(call_expression function: (scoped_identifier) @function) @expression.call.path
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
(field_expression value: (_) @object field: (_) @property) @expression.member
(index_expression (_) @object (_) @index) @expression.subscript
(closure_expression body: (_)? @body) @expression.lambda
(await_expression (_)? @expression) @expression.await
(yield_expression) @expression.yield
(range_expression) @expression.range
(range_expression_binary) @expression.range
(range_expression_binary operator: "..=") @expression.range.inclusive
(range_expression_binary operator: "...") @expression.range.inclusive
(range_expression_binary operator: "..") @expression.range.exclusive
(range_expression_postfix) @expression.range.exclusive
(range_expression_prefix) @expression.range.exclusive
(range_expression_bare) @expression.range.exclusive
(type_cast_expression) @expression.cast.as
(parenthesized_expression) @expression.parenthesized
(tuple_expression (expressions) @elements) @expression.collection.tuple
(array_expression) @expression.collection.list
(array_expression_semi) @expression.collection.list.repeat
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
(slice_pattern) @pattern.slice
(or_pattern) @pattern.or
(range_pattern) @pattern.range
(range_pattern_prefix) @pattern.range
(range_pattern_prefix "..=") @pattern.range.inclusive
(range_pattern_prefix "..") @pattern.range.exclusive
(range_pattern_with_left) @pattern.range
(range_pattern_with_left (range_pattern_with_left_with_right "..=")) @pattern.range.inclusive
(range_pattern_with_left (range_pattern_with_left_with_right "...")) @pattern.range.inclusive
(range_pattern_with_left (range_pattern_with_left_with_right "..")) @pattern.range.exclusive
(range_pattern_with_left (range_pattern_with_left_bare)) @pattern.range.exclusive
(range_pattern_with_left (range_pattern_with_left_with_right right: (_) @right))
(ref_pattern) @pattern.reference
(reference_pattern) @pattern.reference.value
(reference_pattern (mutable_specifier) @exclusive)
(mut_pattern) @pattern.mutable
(captured_pattern) @pattern.captured
(generic_pattern) @pattern.generic
(wildcard_pattern) @pattern.wildcard

; ── type ───────────────────────────────────────────────────────────────────────
(primitive_type) @type.primitive
(generic_type) @type.generic
(generic_type_with_turbofish) @type.generic.turbofish
(type_argument (trait_bounds)? @constraint) @element.type_argument
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
(visibility_modifier (crate) @modifier.visibility.public.internal)
(visibility_modifier_pub) @modifier.visibility.public
(visibility_modifier_pub (visibility_modifier_pub_scope (self))) @modifier.visibility.private
(visibility_modifier_pub (visibility_modifier_pub_scope (crate))) @modifier.visibility.public.internal
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
