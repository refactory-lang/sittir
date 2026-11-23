// Generated from bindings.scm and the vocabulary by `pnpm exec tsx packages/cli/src/cli.ts tool bindings-inventory --write`. Do not edit.
/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import sittir from './grammar.sittir.ts';
import { alias, enrich, field, wire } from '../codegen/src/dsl/dsl-authoring.ts';

export const hash = "1f80a44b2c6cc2896b65ff22e9adb98c7637c131b3d5641d08b844fd860aa478";

export const renames = {
	translation_unit: "file",
	function_definition: "function_declaration",
	variadic_parameter: "variadic_parameter_declaration",
	struct_specifier: "struct_declaration",
	union_specifier: "union_declaration",
	enum_specifier: "enum_declaration",
	enumerator: "enum_member_declaration",
	type_definition: "type_alias_declaration",
	case_statement: "switch_case_clause",
	compound_statement: "block_statement",
	while_statement: "while_loop_statement",
	do_statement: "do_while_loop_statement",
	for_statement: "counted_loop_statement",
	field_expression: "member_expression",
	comma_expression: "sequence_expression",
	compound_literal_expression: "struct_expression",
	initializer_list: "list_expression",
	initializer_pair: "field_struct_element",
	sized_type_specifier: "integral_primitive_type",
	pointer_declarator: "pointer_type",
	abstract_function_declarator: "function_type",
	storage_class_specifier: "modifier",
	concatenated_string: "concatenated_string_literal",
	escape_sequence: "escape_string_literal",
	char_literal: "character_literal",
	true: "true_boolean_literal",
	false: "false_boolean_literal",
	null: "null_literal",
	comment_arm1: "line_comment",
	comment_arm2: "block_comment"
};

export default grammar(
	enrich(sittir),
	wire({
		generated: true,
		edits: {
			_abstract_declarator: { "-2": alias("array_type") },
			_declaration_declarator: { "-3": alias("array_type") },
			_declarator: { "-3": alias("array_type") },
			parenthesized_expression: { "1/0": field("expression") },
			return_statement: { "1/0/0": field("expression") }
		}
	})
);
