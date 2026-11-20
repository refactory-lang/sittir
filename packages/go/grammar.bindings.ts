// Generated from bindings.scm and the vocabulary by `pnpm exec tsx packages/cli/src/cli.ts tool bindings-inventory --write`. Do not edit.
/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import sittir from './grammar.sittir.ts';
import { enrich, field, wire } from '../codegen/src/dsl/dsl-authoring.ts';

export const hash = "6b6fe8bf70350e541f1c8b29ddf4194d4fb633d316634afddb0905c7a77db07e";

export const renames = {
	source_file: "file",
	method_elem: "signature_method_declaration",
	var_spec: "variable_declaration",
	const_spec: "constant_declaration",
	type_spec: "declaration",
	type_alias: "type_alias_declaration",
	import_spec: "import_clause",
	expression_case: "switch_case_clause",
	default_case: "default_case_clause",
	import_declaration: "import_statement",
	block: "block_statement",
	for_statement: "loop_statement",
	expression_switch_statement: "switch_statement",
	inc_statement: "increment_update_expression",
	dec_statement: "decrement_update_expression",
	selector_expression: "member_expression",
	index_expression: "subscript_expression",
	func_literal: "function_expression",
	type_assertion_expression: "cast_expression",
	type_conversion_expression: "conversion_cast_expression",
	type_instantiation_expression: "instantiation_expression",
	variadic_argument: "spread_element",
	keyed_element: "pair_element",
	composite_literal: "map_collection_expression",
	assignment_statement: "assignment_expression",
	blank_identifier: "wildcard_pattern",
	struct_type: "object_type",
	int_literal: "integer_number_literal",
	int_literal_arm1: "binary_integer_number_literal",
	int_literal_arm4: "octal_integer_number_literal",
	int_literal_arm5: "hex_integer_number_literal",
	float_literal: "float_number_literal",
	imaginary_literal: "imaginary_integer_number_literal",
	rune_literal: "character_literal",
	interpreted_string_literal: "string_literal",
	escape_sequence: "escape_string_literal",
	true: "true_boolean_literal",
	false: "false_boolean_literal",
	nil: "null_literal",
	qualified_type: "qualified_identifier",
	comment_arm1: "line_comment",
	comment_arm2: "block_comment"
};

export default grammar(
	enrich(sittir),
	wire({
		generated: true,
		edits: {
			break_statement: { "1/0": field("label") },
			continue_statement: { "1/0": field("label") },
			func_literal: { "2": field("return_type") },
			function_declaration: { "4": field("return_type") },
			method_declaration: { "4": field("return_type") },
			method_elem: { "2": field("return_type") },
			type_parameter_declaration: { "1": field("bounds") }
		}
	})
);
