/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import base from './base.ts';
import resolutions from './.sittir/resolutions.json' with { type: 'json' };
import { enrich, field, preference, variant, wire } from '../codegen/src/dsl/index.ts';

export default grammar(enrich(base), wire({
	resolutions,
	options: { indent: preference('    ') },
	expectDiagnostics: {
		'token-interior-unstructurable': ['hex_floating_point_literal_arm1'],
		'unclassifiable-shape': ['_unqualified_object_creation_expression', 'cast_expression', 'object_creation_expression_arm'],
		'union-slot-mixed-row': ['cast_expression'],
		'union-slot-routed-repeated': ['annotation_argument_list', 'switch_label_arm']
	},
	reparseHosts: {
		hosts: {
			expression: 'class _H { Object _r = $r; }'
		}
	},
	edits: {
		assert_statement: { '0/1': field('condition'), '1/1': field('condition'), '1/3': field('message') },
		formal_parameters: { '1/0': variant('receiver'), '1/1': variant('list') },
		method_reference: { 3: field('name') },
		scoped_type_identifier: { 0: field('qualifier'), 3: field('name') },
		string_literal: { 0: variant('line', { default: true }), 1: variant('text_block') },
		try_statement: { '2/0': variant('catches'), '2/1': variant('finally') },
		update_expression: [
			{ '0/1': field('operator'), '1/1': field('operator'), '2/0': field('operator'), '3/0': field('operator') },
			{ 0: variant('postfix', { default: true }), 1: variant('postfix'), 2: variant('prefix'), 3: variant('prefix') }
		]
	}
}));
