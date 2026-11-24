/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import base from './base.ts';
import resolutions from './.sittir/resolutions.json' with { type: 'json' };
import { alias, enrich, field, preference, variant, vocabulary, wire } from '../codegen/src/dsl/dsl-authoring.ts';

const flag = (word: string) => optional(field(word, word));
const staticAsync = () => choice(seq(flag('static'), flag('async')), seq(flag('async'), flag('static')));

const realExponent = () => seq(field('marker', choice('e', 'E')), field('exponent_sign', optional(choice('-', '+'))), field('exponent', /[0-9][0-9_]*/));

export default grammar(enrich(base), wire({
	resolutions,
	options: { indent: preference('    ') },
	expectDiagnostics: {
		'token-interior-unstructurable': ['identifier_token'],
		'unclassifiable-shape': ['interpolated_string_expression', 'lambda_expression', 'recursive_pattern'],
		'union-slot-mixed-row': ['recursive_pattern'],
		'union-slot-routed-repeated': ['for_statement_conditions_initializer']
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
		_bracketed_parameter_list_optional1: { '0/0/1': alias('parameter_array'), '1/0/1/0/1': alias('parameter_array') },
		switch_statement: { '1/0': variant('parenthesized'), '1/1': variant('tuple') },
		type_parameter_constraint: { 0: variant('class'), 1: variant('struct'), 2: variant('notnull'), 3: variant('unmanaged'), '*': variant('', { default: true }) },
		real_literal: {
			'0/0/0': field('integer'),
			'0/0/2': field('fraction'),
			'0/0/3/0': realExponent(),
			'1/0/1': field('fraction'),
			'1/0/2/0': realExponent(),
			'2/0/0': field('integer'),
			'2/0/1': realExponent(),
			'3/0/0': field('integer')
		},
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
		_parenthesized_pattern_with_designation: { 1: field('pattern') },
		using_directive: [
			{ 1: () => seq('using', flag('static'), flag('unsafe')), '2/0': ($) => seq(field('name', $.identifier), '=', $.type), '2/1': ($) => $._name },
			{ '2/0': variant('alias') }
		],
		_lambda_expression_init: { '.': ($) => seq(field('attribute_lists', repeat($._attribute_list)), staticAsync(), optional(field('type', $.type)), field('parameters', $._lambda_parameters)) },
		anonymous_method_expression: { '.': ($) => seq(staticAsync(), 'delegate', optional(field('parameters', $.parameter_list)), field('block', $.block)) },
		parameter: {
			1: ($) =>
				seq(
					flag('this'),
					optional(field('scoped', prec.dynamic(1, 'scoped'))),
					optional(field('mode', prec.dynamic(1, choice('ref', $.ref_readonly, 'out', 'in')))),
					optional(field('type', $.type))
				)
		}
	},
	rules: {
		ref_readonly: vocabulary(() => seq('ref', 'readonly'))
	}
}));
