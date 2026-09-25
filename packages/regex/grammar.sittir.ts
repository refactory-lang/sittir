// @ts-nocheck — grammar.js is untyped
import base from 'tree-sitter-regex/grammar.js';
import { enrich, field, variant, wire } from '../codegen/src/dsl/index.ts';

const enrichedBase = enrich(base);
export default grammar(
	enrichedBase,
	wire(
		{
			name: 'regex',
			externals: ($, previous) => [...(previous ?? []), $._tight, $._space, $._newline],
			supertypes: ($, previous) => [...(previous ?? []), $._whitespace],
			visibleExternals: (_$) => ({
				_tight: string(''),
				_space: string(' '),
				_newline: string('\n')
			}),
			patches: {
				class_range: { 0: field('start'), 2: field('end') },
				term: { '0/1': field('quantifier') },
				inline_flags_group: [
					{
						'1/0': field('enabled'),
						'1/1/0': field('enabled'),
						'1/1/2': field('disabled'),
						'1/2/1': field('disabled')
					},
					{ '1/0': variant('enable'), '1/1': variant('toggle'), '1/2': variant('disable') }
				]
			},
			rules: {
				_whitespace: ($) => choice($._tight, $._space, $._newline)
			}
		},
		enrichedBase
	)
);
