/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import base from './base.ts';
import resolutions from './.sittir/resolutions.json' with { type: 'json' };
import { alias, enrich, field, preference, variant, wire } from '../codegen/src/dsl/index.ts';

export default grammar(enrich(base), wire({
	resolutions,
	options: { indent: preference('    ') },
	expectDiagnostics: {
		'content-collision': ['alignas_qualifier'],
		'unclassifiable-shape': ['concatenated_string', 'for_statement', 'parameter_list', 'sized_type_specifier'],
		'union-slot-mixed-row': ['parameter_list']
	},
	edits: {
		_top_level_item: { 7: alias('empty_declaration') },
		_block_item: { 7: alias('empty_declaration') },
		preproc_defined: { 0: variant('parenthesized'), 1: variant('bare') },
		update_expression: { 0: variant('prefix'), 1: variant('postfix') },
		concatenated_string: {
			'0/0/0': field('elements'),
			'0/0/1': field('elements'),
			'0/1/0': field('elements'),
			'0/1/1': field('elements'),
			'0/2/0': field('elements'),
			'0/2/1': field('elements')
		},
		generic_expression: { 2: field('controlling_expression') },
		_type_definition_type: { 0: field('type_qualifiers'), 2: field('type_qualifiers') },
		type_descriptor: { 0: field('type_qualifiers'), 2: field('type_qualifiers') }
	}
}));
