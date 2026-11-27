/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import base from './base.ts';
import resolutions from './.sittir/resolutions.json' with { type: 'json' };
import type { FieldRule, GrammarRule, SeqRule } from '../codegen/src/grammar-shapes/grammar-json.ts';
import { copy, enrich, field, preference, replace, variant, wire } from '../codegen/src/dsl/dsl-authoring.ts';

export default grammar(enrich(base), wire({
	resolutions,
	options: {
		indent: preference('    '),
		const_declaration_arm: { 'const_spec:/separator/kind': preference('source_file_text') },
		field_declarations: { 'item:/separator/kind': preference('source_file_text') },
		import_specs: { 'item:/separator/kind': preference('source_file_text') },
		interface_elems: { 'item:/separator/kind': preference('source_file_text') },
		special_argument_list_group: { 'trailing_comma:': preference('blank') },
		statements: { 'item:/separator/kind': preference('source_file_text') },
		type_conversion_expression: { 'trailing_comma:': preference('blank') },
		type_declaration_elements: { 'item:/separator/kind': preference('source_file_text') },
		var_spec_list: { 'var_spec:/separator/kind': preference('source_file_text') }
	},
	expectDiagnostics: {
		'token-interior-unstructurable': ['int_literal_arm1', 'int_literal_arm4', 'int_literal_arm5'],
		'unclassifiable-shape': ['field_declaration', 'slice_expression'],
		'union-slot-mixed-row': ['field_declaration']
	},
	edits: {
		channel_type: { 0: variant('bidirectional'), 1: variant('send_only'), 2: variant('receive_only') },
		field_declaration_arm: {
			'.': ($, arm) => {
				const type = (arm as unknown as SeqRule<readonly [GrammarRule, FieldRule]>).members[1];
				return field('type', choice(replace(copy($.pointer_type), 'type:', type.content), type.content));
			}
		},
		special_argument_list_group: { '2/0': field('trailing_comma') },
		type_conversion_expression: { '3/0': field('trailing_comma') },
		// The extras' `\s` also matches `\n`, so the lexer reads a whole run of
		// line breaks as this terminator; the rule says what the lexer reads.
		source_file_text: { '.': /\n+/ }
	}
}));
