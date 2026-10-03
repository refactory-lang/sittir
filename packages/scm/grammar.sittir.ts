/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import base from './base.ts';
import resolutions from './.sittir/resolutions.json' with { type: 'json' };
import {
	alias,
	field,
	preference,
	variant,
	sittirGrammar
} from '../codegen/src/dsl/dsl-authoring.ts';

export default sittirGrammar(base, {
	resolutions,
	name: 'scm',
	patches: {
		grouping: { '1/0/1/0': alias('anchor') },
		_group_expression: { '1/0': field('left'), '1/2': field('right') },
		_named_node_expression: { '2/0': field('left'), '2/2': field('right') },
		named_node: { '1/0': variant('plain'), '1/1': variant('supertyped') },
		named_node_group: {
			'0/0': alias('anchor'),
			'1/0': variant('children'),
			'1/1': variant('anchored_last'),
			'1/1/1/0': field('last')
		},
		predicate: { '1/0/0': field('prefix') }
	},
	options: {
		indent: preference('    '),
		named_node: { '"("/after': preference('tight'), '")"/before': preference('tight') },
		program: { 'definitions:/separator': preference('newline') },
		field_definition: { '":"/before': preference('tight') },
		list: { '"["/after': preference('tight'), '"]"/before': preference('tight') },
		grouping: { '"("/after': preference('tight'), '")"/before': preference('tight') },
		predicate: { '"("/after': preference('tight'), '")"/before': preference('tight') }
	},
	expectDiagnostics: {
		'unclassifiable-shape': ['predicate']
	}
});
