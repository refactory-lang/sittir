/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import base from './base.ts';
import resolutions from './.sittir/resolutions.json' with { type: 'json' };
import { enrich, preference, variant, wire } from '../codegen/src/dsl/index.ts';

export default grammar(enrich(base), wire({
	resolutions,
	options: { indent: preference('    ') },
	expectDiagnostics: {
		'separator-default-undeclared': ['const_declaration_arm', 'field_declarations', 'import_specs', 'interface_elems', 'statements', 'type_declaration_elements', 'var_spec_list'],
		'unclassifiable-shape': ['field_declaration', 'slice_expression'],
		'union-slot-mixed-row': ['field_declaration']
	},
	edits: {
		channel_type: { 0: variant('bidirectional'), 1: variant('send_only'), 2: variant('receive_only') }
	}
}));
