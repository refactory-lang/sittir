/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import base from './base.ts';
import resolutions from './.sittir/resolutions.json' with { type: 'json' };
import { enrich, field, preference, variant, wire } from '../codegen/src/dsl/index.ts';

export default grammar(enrich(base), wire({
	resolutions,
	name: 'csharp',
	options: { indent: preference('    ') },
	visibleExternals: (_$) => ({
		_optional_semi: string(';')
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
		record_base: { 0: variant('names'), 1: variant('primary_constructor') }
	}
}));
