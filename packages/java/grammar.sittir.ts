/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import base from './base.ts';
import resolutions from './.sittir/resolutions.json' with { type: 'json' };
import { enrich, preference, variant, wire } from '../codegen/src/dsl/index.ts';

export default grammar(enrich(base), wire({
	resolutions,
	name: 'java',
	options: { indent: preference('    ') },
	expectDiagnostics: {
		'content-collision': ['method_reference'],
		'storagename-collision': ['assert_statement_arm', 'object_creation_expression_arm'],
		'token-interior-unstructurable': ['hex_floating_point_literal_arm1'],
		'unclassifiable-shape': ['_unqualified_object_creation_expression', 'cast_expression', 'object_creation_expression_arm'],
		'union-slot-mixed-row': ['cast_expression'],
		'union-slot-routed-repeated': ['annotation_argument_list', 'switch_label_arm']
	},
	edits: {
		formal_parameters: { '1/0': variant('receiver'), '1/1': variant('list') },
		try_statement: { '2/0': variant('catches'), '2/1': variant('finally') }
	}
}));
