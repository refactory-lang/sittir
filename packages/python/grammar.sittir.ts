/**
 * grammar.sittir.ts — Grammar extension for python
 *
 * Converted from overrides.json. Each entry wraps an unnamed child
 * at a positional index with a named field.
 *
 * @generated from overrides.json — review before committing
 */

// @ts-nocheck — grammar.js is untyped
import base from '../../node_modules/.pnpm/tree-sitter-python@0.25.0/node_modules/tree-sitter-python/grammar.js';
import { role, enrich, field, alias, variant, wire, preference, rule } from '../codegen/src/dsl/index.ts';

const enrichedBase = enrich(base);
const comprehensionClauses = rule('comprehension_clauses', ($) => field('content', repeat1(choice($.for_in_clause, $.if_clause))));
export default grammar(
	enrichedBase,
	wire(
		{
			name: 'python',
			externals: ($, prev) => {
				role($._indent, 'indent');
				role($._dedent, 'dedent');
				role($._newline, 'newline');
				return [...(prev ?? []), $._tight, $._space, $._blankline, $._double_newline];
			},
			supertypes: ($, previous) => [...(previous ?? []), $._whitespace],
			conflicts: ($, previous) => [
				...(previous ?? []),
				[$.expression_statement, $.expression_statement_tuple],
				[$.except_clause_exception_as, $.except_clause_exception_list],
				[$.as_pattern, $.except_clause_exception_as],
				[$._expressions, $.expression_list]
			],
			inline: ($, previous) => [...(previous ?? []), $._except_clause_exception_as_optional1],
			visibleExternals: (_$) => ({
				_newline: string('\n'),
				_blankline: string('\n\n'),
				_double_newline: string('\n\n\n'),
				_tight: string(''),
				_space: string(' ')
			}),

			// See docs/python-grammar-sittir-glossary.md::renderAs
			renderAs: (_$) => ({
				string_start: /[a-zA-Z]*["']+/,
				_string_content: token.immediate(/[^"'\\{}\n]+/),
				escape_interpolation: token.immediate(/\{\{|\}\}/),
				string_end: token.immediate(/["']+/)
			}),
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
					),
				yield_from_clause: ($) => seq('from', $.expression)
			},
			options: {
				gap: { separator: preference('tight') },
				integer_hex: { 'prefix:': preference('0x') },
				integer_octal: { 'prefix:': preference('0o') },
				integer_binary: { 'prefix:': preference('0b') },
				module: {
					'statements:/separator': preference('tight'),
					'statements:/(function_definition)/after': preference('double_newline'),
					'statements:/(class_definition)/after': preference('double_newline'),
					'statements:/(decorated_definition)/after': preference('double_newline')
				},

				_: {
					'"("/before': preference('tight'),
					'"("/after': preference('tight'),
					'")"/before': preference('tight'),
					'"["/before': preference('tight'),
					'"["/after': preference('tight'),
					'"]"/before': preference('tight'),
					'"{"/after': preference('tight'),
					'"}"/before': preference('tight'),
					'"."/before': preference('tight'),
					'"."/after': preference('tight'),
					'","/before': preference('tight'),
					'_/separator/","/before': preference('tight'),
					'_/separator/";"/before': preference('tight'),
					'_/separator/"."/before': preference('tight'),
					'_/separator/"."/after': preference('tight'),
					'":"/before': preference('tight'),
					'":"/after': preference('space'),
					'"->"/before': preference('space'),
					'"->"/after': preference('space'),
					'"="/before': preference('space'),
					'"="/after': preference('space'),
					'":="/before': preference('space'),
					'":="/after': preference('space'),
					'operator:/before': preference('space'),
					'operator:/after': preference('space'),
					'operators:/after': preference('space')
				},
				keyword_argument: { '"="/before': preference('tight'), '"="/after': preference('tight') },
				default_parameter: { '"="/before': preference('tight'), '"="/after': preference('tight') },
				slice: { '":"/before': preference('tight'), '":"/after': preference('tight') },
				splat_pattern: { 'operator:/after': preference('tight') },
				splat_type: { 'operator:/after': preference('tight') },
				interpolation: { before: preference('tight'), after: preference('tight') },
				comprehension_clauses: { 'content:/separator': preference('space') },

				_bindings: {
					'block/statements:/separator': 'gap/separator',
					'comparison_operator/comparators:/separator': 'gap/separator',
					'concatenated_string/string:/separator': 'gap/separator',
					'decorated_definition/decorator:/separator': 'gap/separator',
					'if_statement/alternative:/separator': 'gap/separator',
					'match_block_block/alternative:/separator': 'gap/separator',
					'try_statement/except_clauses:/separator': 'gap/separator'
				}
			},

			patches: {
				// See docs/python-grammar-sittir-glossary.md::case_pattern
				case_pattern: { 0: alias('case_as_pattern') },
				// See docs/python-grammar-sittir-glossary.md::comprehension_clauses
				list_comprehension: { 2: comprehensionClauses },
				dictionary_comprehension: { 2: comprehensionClauses },
				set_comprehension: { 2: comprehensionClauses },
				generator_expression: { 2: comprehensionClauses },
				integer: {
					0: variant('hex'),
					1: variant('octal'),
					2: variant('binary'),
					3: variant('decimal', { default: true })
				},
				float: {
					'0/0/0/0': field('integer'),
					'0/0/0/2': field('fraction'),
					'0/0/0/3/0/0': field('marker'),
					'0/0/0/3/0/1': field('exponent'),
					'0/0/1': field('imaginary'),
					'1/0/0/0': field('integer'),
					'1/0/0/2': field('fraction'),
					'1/0/0/3/0/0': field('marker'),
					'1/0/0/3/0/1': field('exponent'),
					'1/0/1': field('imaginary'),
					'2/0/0/0': field('integer'),
					'2/0/0/1/0': field('marker'),
					'2/0/0/1/1': field('exponent'),
					'2/0/1': field('imaginary'),
					0: variant('point', { default: true }),
					1: variant('leading_point'),
					2: variant('scientific')
				},
				escape_sequence: {
					0: variant('unicode_fixed'),
					1: variant('unicode_wide'),
					2: variant('hex'),
					3: variant('octal'),
					4: variant('line_break'),
					5: variant('simple', { default: true }),
					6: variant('named')
				},
				line_continuation: {
					0: variant('newline', { default: true }),
					1: variant('nul')
				},
				// See docs/python-grammar-sittir-glossary.md::parameters
				parameters: [{ '1/0': alias('parameters_elements') }, { '1/0': field('elements') }],
				lambda_parameters: {
					'.': alias('parameters_elements')
				},
				tuple_pattern: {
					'1/0': alias('patterns')
				},
				list_pattern: {
					'1/0': alias('patterns')
				},
				list: {
					'1/0': alias('collection_elements')
				},
				set: {
					1: alias('collection_elements')
				},
				tuple: {
					'1/0': alias('collection_elements')
				},

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
					0: field('name'),
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

				// See docs/python-grammar-sittir-glossary.md::_simple_pattern
				_simple_pattern: [{ '11/0': field('sign') }, { '11': variant('negative') }],

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

				except_clause: [
					{ '1/0': field('star_marker') },
					{ '2/0/0': variant('as'), '2/0/1': variant('list') },
					{ '2/0': variant('exception') },
					{ 2: field('exception') }
				],

				exec_statement: {
					2: field('in_clause')
				},

				for_in_clause: {
					'0/0': field('async_marker'),
					'5/0': field('comma')
				},

				finally_clause: {
					2: field('block')
				},

				generic_type: {
					0: field('name')
				},

				// See docs/python-grammar-sittir-glossary.md::import_from_statement
				import_from_statement: [
					{ '3/0': field('wildcard_import') }, // wildcard_import [struct=0]
					{ '3/2': alias('parenthesized_import_list') }
				],
				future_import_statement: { '3/1': alias('parenthesized_import_list') },
				// See docs/python-grammar-sittir-glossary.md::_parenthesized_import_list
				_parenthesized_import_list: { 1: alias('import_list') },

				interpolation: {
					'2/0': field('eq_marker')
				},

				keyword_pattern: {
					0: field('name'),
					2: field('value')
				},

				member_type: {
					0: field('base_type'),
					2: field('name')
				},

				slice: {
					0: field('start'),
					2: field('stop'),
					3: field('step')
				},

				splat_pattern: {
					'0': field('operator'),
					1: field('name')
				},

				splat_type: {
					// See docs/python-grammar-sittir-glossary.md::splat_type
					0: field('operator'),
					1: field('name')
				},

				string: {
					1: field('content')
				},

				try_statement: {
					3: field('except_clauses')
				},

				union_type: {
					0: field('left'),
					2: field('right')
				},

				relative_import: { 0: field('prefix'), '1/0': field('name') },
				global_statement: { 1: field('names') },
				nonlocal_statement: { 1: field('names') },
				dotted_name: { 0: field('names'), 1: field('names') },
				union_pattern: { 0: field('patterns'), 1: field('patterns') },
				if_clause: { 1: field('condition') },
				await: { 1: field('expression') },

				assignment: { '1/0': variant('eq'), '1/1': variant('type'), '1/2': variant('typed') },

				expression_statement: {
					1: variant('tuple')
				},

				with_clause: {
					0: variant('bare'),
					1: variant('paren')
				},

				_match_block: { 0: variant('block'), 1: variant('empty') },

				// See docs/python-grammar-sittir-glossary.md::_suite
				_suite: { 0: variant('inline'), 1: variant('block'), 2: variant('empty') }
			},
			rules: {
				_whitespace: ($) => choice($._tight, $._space, $._newline, $._blankline, $._double_newline, $._indent, $._dedent),
				// See docs/python-grammar-sittir-glossary.md::primary_expression
				primary_expression: ($: any, original: ChoiceRule) => {
					let base = original.members;

					return choice(...base.slice(0, -1), prec.dynamic(-1, $.list_splat_pattern));
				},
				except_clause_exception_as: ($) => seq(field('value', $.expression), optional($._except_clause_exception_as_optional1)),
				_except_clause_exception_as_optional1: ($) => seq('as', field('alias', $.expression)),

				// See docs/python-grammar-sittir-glossary.md::string_content
				string_content: ($) =>
					prec.right(
						repeat1(
							choice(
								$.escape_interpolation,
								$.escape_sequence,
								alias($._not_escape_sequence, $.not_escape_sequence),
								alias($._string_content, $.string_fragment)
							)
						)
					),

				// See docs/python-grammar-sittir-glossary.md::format_specifier
				format_specifier: ($) =>
					seq(':', repeat(choice(token.immediate(prec(1, /[^{}\n]+/)), alias($.interpolation, $.format_expression)))),

				// See docs/python-grammar-sittir-glossary.md::case_tuple_pattern
				case_tuple_pattern: ($) => seq('(', optional($.list_pattern_case_patterns), ')'),
				case_list_pattern: ($) => seq('[', optional($.list_pattern_case_patterns), ']'),

				_print_arguments: ($) =>
					seq(field('argument', $.expression), repeat(seq(',', field('argument', $.expression))), optional(',')),
				_print_chevron_arguments: ($) => seq(repeat1(seq(',', field('argument', $.expression))), optional(',')),
				print_statement_chevron: ($) =>
					seq('print', $.chevron, optional(choice(alias($._print_chevron_arguments, $.print_chevron_arguments), ','))),
				print_statement_plain: ($) => seq('print', alias($._print_arguments, $.print_arguments)),
				print_statement: ($) =>
					choice(prec(1, $.print_statement_chevron), prec(-3, prec.dynamic(-1, $.print_statement_plain))),
				// See docs/python-grammar-sittir-glossary.md::_simple_pattern
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
							alias($._wildcard_pattern, $.wildcard_pattern)
						)
					),

				_wildcard_pattern: ($) => '_'
			}
		},
		enrichedBase
	)
);
