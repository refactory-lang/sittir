// @ts-nocheck — grammar.js is untyped
import base from 'tree-sitter-scm/grammar.js';
import { enrich, field, variant, wire } from '../codegen/src/dsl/index.ts';

const enrichedBase = enrich(base);
export default grammar(
	enrichedBase,
	wire(
		{
			name: 'scm',
			externals: ($, previous) => [...(previous ?? []), $._tight, $._space, $._newline],
			supertypes: ($, previous) => [...(previous ?? []), $._whitespace],
			visibleExternals: (_$) => ({
				_tight: string(''),
				_space: string(' '),
				_newline: string('\n')
			}),
			patches: {
				_group_expression: { '1/0': field('left'), '1/2': field('right') },
				_named_node_expression: { '2/0': field('left'), '2/2': field('right') },
				named_node_group: {
					'1/0': variant('children'),
					'1/1': variant('anchored_last'),
					'1/1/1/0': field('last')
				}
			},
			rules: {
				_whitespace: ($) => choice($._tight, $._space, $._newline)
			}
		},
		enrichedBase
	)
);
