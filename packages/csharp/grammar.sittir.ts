/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import base from './base.ts';
import resolutions from './.sittir/resolutions.json' with { type: 'json' };
import { enrich, field, preference, variant, wire } from '../codegen/src/dsl/index.ts';

export default grammar(enrich(base), wire({
	resolutions,
	options: { indent: preference('    ') },
	expectDiagnostics: {
		'token-interior-unstructurable': ['identifier_token'],
		'unclassifiable-shape': ['interpolated_string_expression', 'recursive_pattern', 'using_directive'],
		'union-slot-mixed-row': ['recursive_pattern', 'using_directive'],
		'union-slot-routed-repeated': ['for_statement_conditions_initializer'],
		'union-slot-unaddressable': ['foreach_statement']
	},
	renderAs: (_$) => ({
		_optional_semi: string(';'),
		interpolation_regular_start: /\$+/,
		interpolation_verbatim_start: /@\$+|\$+@/,
		interpolation_raw_start: /\$+/,
		interpolation_start_quote: /"+/,
		interpolation_end_quote: /"+/,
		interpolation_open_brace: /\{+/,
		interpolation_close_brace: /\s*\}+/,
		interpolation_string_content: /[\s\S]+/,
		raw_string_start: /"{3,}/,
		raw_string_end: /"{3,}/,
		raw_string_content: /[\s\S]+/
	}),
	edits: {
		argument: { 1: field('modifier') },
		preproc_nullable: { 1: field('setting'), 2: field('target') },
		preproc_line: { '1/3/1': field('start_line'), '1/3/3': field('start_character'), '1/3/7': field('end_line'), '1/3/9': field('end_character'), '1/3/11/0': field('character_offset') },
		preproc_pragma: { '1/1/1': field('file_name'), '1/1/2': field('guid'), '1/1/3': field('checksum') },
		enum_declaration: { '1/0': variant('with_body'), '1/1': variant('without_body') },
		_declaration_list_body: { 0: variant('with_body'), 1: variant('without_body') },
		class_declaration: { 1: field('declaration_list_body') },
		interface_declaration: { 1: field('declaration_list_body') },
		record_declaration: { 1: field('declaration_list_body') },
		struct_declaration: { 1: field('declaration_list_body') },
		type_argument_list: { '1/0': variant('unbound'), '1/1': variant('bound') },
		record_base: { 0: variant('names'), 1: variant('primary_constructor') },
		_join_header: { 1: field('name'), 3: field('source') },
		_join_body: { 1: field('left'), 3: field('right') },
		_anonymous_object_member_declarator: { '0/0': field('name'), '0/2': field('value') },
		_parenthesized_pattern_with_designation: { 1: field('pattern') }
	}
}));
