/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import base from './base.ts';
import resolutions from './.sittir/resolutions.json' with { type: 'json' };
import { enrich, field, preference, wire } from '../codegen/src/dsl/index.ts';

export default grammar(enrich(base), wire({
	resolutions,
	options: { indent: preference('    ') },
	expectDiagnostics: {
		'content-collision': ['alignas_qualifier'],
		'unclassifiable-shape': ['concatenated_string', 'for_statement', 'parameter_list', 'sized_type_specifier'],
		'union-slot-mixed-row': ['parameter_list']
	},
	edits: {
		generic_expression: { 2: field('controlling_expression') },
		_type_definition_type: { 0: field('type_qualifiers'), 2: field('type_qualifiers') },
		type_descriptor: { 0: field('type_qualifiers'), 2: field('type_qualifiers') }
	}
}));
