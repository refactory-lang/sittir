// Generated from bindings.scm and the vocabulary by `pnpm exec tsx packages/cli/src/cli.ts tool bindings-inventory --write`. Do not edit.
/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import sittir from './grammar.sittir.ts';
import { alias, enrich, field, wire } from '../codegen/src/dsl/dsl-authoring.ts';

export const hash = "56b39e55de0696ca76403e0f72374fb39fb65e5e049c62b0cd6ed64acaa855aa";

export const renames = {
	program: "file",
	enum_constant: "enum_member_declaration",
	formal_parameter: "parameter_declaration",
	spread_parameter: "variadic_parameter_declaration",
	receiver_parameter: "receiver_parameter_declaration",
	local_variable_declaration: "variable_declaration",
	type_parameter: "type_parameter_declaration",
	superclass: "extends_clause",
	super_interfaces: "implements_clause",
	extends_interfaces: "type_extends_clause",
	switch_block_statement_group: "switch_case_clause",
	switch_rule: "match_case_clause",
	resource_specification: "resource_clause",
	resource: "item_resource_clause",
	type_bound: "bounds_clause",
	import_declaration: "import_statement",
	asterisk: "wildcard_import_clause",
	block: "block_statement",
	static_initializer: "static_block_statement",
	while_statement: "while_loop_statement",
	do_statement: "do_while_loop_statement",
	for_statement: "counted_loop_statement",
	enhanced_for_statement: "for_each_loop_statement",
	switch_expression: "switch_statement",
	try_with_resources_statement: "resource_statement",
	method_invocation: "call_expression",
	field_access: "member_expression",
	array_access: "subscript_expression",
	ternary_expression: "conditional_expression",
	instanceof_expression: "instanceof_membership_binary_expression",
	object_creation_expression: "construct_call_expression",
	array_creation_expression: "list_collection_expression",
	template_expression: "template_call_expression",
	record_pattern: "struct_pattern",
	record_pattern_component: "field_struct_pattern",
	underscore_pattern: "wildcard_pattern",
	integral_type: "integral_primitive_type",
	floating_point_type: "floating_primitive_type",
	boolean_type: "boolean_primitive_type",
	void_type: "void_primitive_type",
	modifiers: "modifier",
	decimal_integer_literal: "integer_number_literal",
	hex_integer_literal: "hex_integer_number_literal",
	octal_integer_literal: "octal_integer_number_literal",
	binary_integer_literal: "binary_integer_number_literal",
	string_fragment: "text_string_literal",
	escape_sequence: "escape_string_literal",
	string_interpolation: "interpolation_expression",
	true: "true_boolean_literal",
	false: "false_boolean_literal",
	scoped_identifier: "qualified_identifier",
	this: "receiver_identifier",
	super: "super_identifier",
	annotation: "attribute"
};

export default grammar(
	enrich(sittir),
	wire({
		generated: true,
		edits: {
			_literal: { "-7": alias("float_number_literal"), "-6": alias("float_number_literal") },
			_method_header: { "1": field("return_type") },
			break_statement: { "1/0": field("label") },
			class_declaration: { "4/0": field("extends"), "5/0": field("implements") },
			continue_statement: { "1/0": field("label") },
			type_parameter: { "2/0": field("bounds") }
		}
	})
);
