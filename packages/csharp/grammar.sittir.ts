/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import base from './base.ts';
import resolutions from './.sittir/resolutions.json' with { type: 'json' };
import { enrich, field, preference, variant, wire } from '../codegen/src/dsl/index.ts';

export default grammar(enrich(base), wire({
	resolutions,
	name: 'csharp',
	options: { indent: preference('    ') },
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
		_anonymous_object_member_declarator: { '0/0': field('name'), '0/2': field('value') }
	}
}));
