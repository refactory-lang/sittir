/**
 * overrides.ts — Grammar extension for python
 *
 * Converted from overrides.json. Each entry wraps an unnamed child
 * at a positional index with a named field.
 *
 * @generated from overrides.json — review before committing
 */

// @ts-nocheck — grammar.js is untyped
import base from '../../node_modules/.pnpm/tree-sitter-python@0.25.0/node_modules/tree-sitter-python/grammar.js';
import { role, enrich, field, alias, wire } from '../codegen/src/dsl/index.ts';

const enrichedBase = enrich(base);
export default grammar(
	enrichedBase,
	wire(
		{
			name: 'python',
			externals: ($, prev) => {
				role($._indent, 'indent');
				role($._dedent, 'dedent');
				role($._newline, 'newline');
				return prev;
			},
			conflicts: ($, previous) => [
				...(previous ?? []),
				[$.expression_statement, $._expression_statement_tuple],
				[$._except_clause_as, $._except_clause_list],
				[$.as_pattern, $._except_clause_as],
				[$._expressions, $.expression_list]
			],
			inline: ($, previous) => [...(previous ?? []), $._except_clause_as_optional1],
			visibleExternals: (_$) => ({
				_newline: string('\n')
			}),
			polymorphs: {
				assignment: { '1/0': 'eq', '1/1': 'type', '1/2': 'typed' },

				expression_statement: {
					1: 'tuple'
				},

				with_clause: {
					0: 'bare',
					1: 'paren'
				},

				_match_block: { 0: 'block' },

				dict_pattern: { '1/0/0/0': 'kv' },

				_simple_pattern: { '11': 'negative' },

				except_clause: { '2/0/0': 'as', '2/0/1': 'list' }
			},
			groups: {
				comparison_operator_comparator: ($) =>
					seq(
						field(
							'operators',
							choice(
								'<',
								'<=',
								'==',
								'!=',
								'>=',
								'>',
								'<>',
								'in',
								alias($._not_in, 'not in'),
								'is',
								alias($._is_not, 'is not')
							)
						),
						$.primary_expression
					)
			},
			transforms: {
				argument_list: {
					1: field('arguments')
				},

				expression_list: {
					1: field('tail')
				},
				pattern_list: {
					1: field('tail')
				},

				class_pattern: {
					2: field('arguments')
				},

				comparison_operator: {
					0: field('left'),
					1: field('comparators')
				},

				complex_pattern: {
					0: field('real'),
					1: field('imaginary'),
					2: field('operator')
				},

				conditional_expression: {
					0: field('body'),
					2: field('condition'),
					4: field('alternative')
				},

				constrained_type: {
					0: field('base_type'),
					2: field('constraint')
				},

				decorator: {
					2: field('newline')
				},

				dictionary: {
					1: field('entries')
				},

				exec_statement: {
					2: field('in_clause')
				},

				for_in_clause: {
					'0/0': field('async_marker')
				},

				finally_clause: {
					2: field('block')
				},

				generic_type: {
					0: field('identifier')
				},

				import_from_statement: {
					3: field('wildcard_import')
				},

				keyword_pattern: {
					2: field('simple_pattern')
				},

				member_type: {
					0: field('base_type')
				},

				slice: {
					0: field('start'),
					2: field('stop'),
					3: field('step')
				},

				splat_pattern: {
					'0': field('operator'),
					1: field('identifier')
				},

				splat_type: {
					0: field('identifier')
				},

				string: {
					1: field('content')
				},

				type_alias_statement: {
					0: field('type')
				},

				try_statement: {
					3: field('except_clauses')
				},

				union_type: {
					0: field('left'),
					2: field('right')
				}
			},
			rules: {
				primary_expression: ($: any, original: ChoiceRule) => {
					let base = original.members;

					return choice(...base.slice(0, -1), $.list_splat_pattern);
				},
				_except_clause_as: ($) => seq(field('value', $.expression), optional($._except_clause_as_optional1)),
				_except_clause_as_optional1: ($) => seq('as', field('alias', $.expression)),

				parameters: ($) => seq('(', optional(alias($._parameters, $.parameter_list)), ')'),
				lambda_parameters: ($) => alias($._parameters, $.parameter_list),
				tuple_pattern: ($) => seq('(', optional(alias($._patterns, $.pattern_group)), ')'),
				list_pattern: ($) => seq('[', optional(alias($._patterns, $.pattern_group)), ']'),
				list: ($) => seq('[', optional(alias($._collection_elements, $.element_list)), ']'),
				set: ($) => seq('{', alias($._collection_elements, $.element_list), '}'),
				tuple: ($) => seq('(', optional(alias($._collection_elements, $.element_list)), ')'),

				case_tuple_pattern: ($) =>
					seq('(', optional(seq($.case_pattern, repeat(seq(',', $.case_pattern)), optional(','))), ')'),
				case_list_pattern: ($) =>
					seq('[', optional(seq($.case_pattern, repeat(seq(',', $.case_pattern)), optional(','))), ']'),

				print_statement_group1: ($) =>
					seq('print', $.chevron, repeat(seq(',', field('argument', $.expression))), optional(',')),
				print_statement_group2: ($) =>
					seq(
						'print',
						field('argument', $.expression),
						repeat(seq(',', field('argument', $.expression))),
						optional(',')
					),
				print_statement: ($) =>
					choice(prec(1, $.print_statement_group1), prec(-3, prec.dynamic(-1, $.print_statement_group2))),
				_simple_pattern: ($) =>
					prec(
						1,
						choice(
							$.class_pattern,
							$.splat_pattern,
							$.union_pattern,
							$.case_list_pattern,
							$.case_tuple_pattern,
							$.dict_pattern,
							$.string,
							$.concatenated_string,
							$.true,
							$.false,
							$.none,
							seq(optional('-'), choice($.integer, $.float)),
							$.complex_pattern,
							$.dotted_name,
							'_'
						)
					)
			}
		},
		enrichedBase
	)
);
