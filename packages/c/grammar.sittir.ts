/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import base from './base.ts';
import resolutions from './.sittir/resolutions.json' with { type: 'json' };
import { enrich, preference, wire } from '../codegen/src/dsl/index.ts';

export default grammar(enrich(base), wire({
	resolutions,
	options: { indent: preference('    ') },
	expectDiagnostics: {
		'content-collision': ['alignas_qualifier'],
		'display-union-mixed': ['primitive_type'],
		'storagename-collision': ['type_definition', 'type_descriptor'],
		'unclassifiable-shape': ['concatenated_string', 'for_statement', 'parameter_list', 'sized_type_specifier'],
		'union-slot-mixed-row': ['parameter_list']
	}
}));
