// @ts-nocheck — grammar.js is untyped
import base from 'tree-sitter-scm/grammar.js';
import resolutions from './.sittir/resolutions.json' with { type: 'json' };
import {
	field,
	variant,
	sittirGrammar
} from '../codegen/src/dsl/index.ts';

export default sittirGrammar(base, {
	resolutions,
	name: 'scm',
	patches: {
		_group_expression: { '1/0': field('left'), '1/2': field('right') },
		_named_node_expression: { '2/0': field('left'), '2/2': field('right') },
		named_node: { '1/0': variant('plain'), '1/1': variant('supertyped') },
		named_node_group: {
			'1/0': variant('children'),
			'1/1': variant('anchored_last'),
			'1/1/1/0': field('last')
		}
	},
	expectDiagnostics: {
		'unclassifiable-shape': ['predicate']
	}
});
