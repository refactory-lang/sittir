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

/* Unified composition (matches rust + typescript): bind `enrich(base)` once and
   pass the SAME enriched grammar to both grammar() and wire(), so wire's
   base-dependent passes (auto-group synthesis, body-pattern groups, and the
   enrich-hoisted-clause inline registration) operate on the post-enrich shape. */
const enrichedBase = enrich(base);
export default grammar(
	enrichedBase,
	wire(
		{
			name: 'python',
			externals: ($, prev) => {
				/* Mark existing base externals with sittir roles. role() records
				   the binding as a side-effect (sittir runtime) and returns the
				   symbol unchanged. Returning `prev` directly avoids duplicating
				   the externals list — tree-sitter's grammar() doesn't dedupe, so
				   spreading prev plus role() returns would emit each token twice
				   and the generated parser.c would fail to compile. */
				role($._indent, 'indent');
				role($._dedent, 'dedent');
				role($._newline, 'newline');
				return prev;
			},
			conflicts: ($, previous) => [
				...(previous ?? []),
				/* expression_statement tuple-variant extraction: the bare
				   `expression` arm and the hoisted `_expression_statement_tuple`
				   both start with `expression • …`. In the base grammar
				   tree-sitter's LR(1) table merged the common prefix into a
				   single state; with the tuple form lifted into its own hidden
				   rule, tree-sitter needs an explicit GLR fork group to decide
				   between the bare expression and the tuple form on the `,`
				   suffix that only the tuple accepts. */
				[$.expression_statement, $._expression_statement_tuple],
				/* except_clause variant split: the `as` form (`except E as e:`)
				   and the comma-list form (`except E1, E2:`) both begin with
				   `field('value', expression) • …` and only diverge on the `as` /
				   `,` continuation. Lifting each arm into its own hidden rule
				   (`_except_clause_as` / `_except_clause_list`) requires an
				   explicit GLR fork to decide between them after the shared
				   prefix. */
				[$._except_clause_as, $._except_clause_list],
				/* The `as` form (`except E as e:`) overlaps with `as_pattern`
				   (`E as e`) after the shared `expression 'as'` prefix — fork. */
				[$.as_pattern, $._except_clause_as],
				/* Un-inlining `_expressions` (a minted visible-group arm source,
				   filtered out of `inline:` so its mint survives to the parser)
				   makes it and `expression_list` share the `expression • ,`
				   prefix that inlining would otherwise let the LR table merge —
				   the fork tree-sitter itself suggests for the yield/tuple
				   overlap. */
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
					2: field('arguments') // case_pattern [struct=1]
				},

				comparison_operator: {
					0: field('left'), // primary_expression [struct=0]
					1: field('comparators') // primary_expression [struct=1]
				},

				complex_pattern: {
					0: field('real'), // integer | float [struct=0]
					1: field('imaginary'), // integer | float [struct=1]
					2: field('operator') // '+' | '-'
				},

				conditional_expression: {
					0: field('body'), // expression [struct=0]
					2: field('condition'), // expression [struct=1]
					4: field('alternative') // expression [struct=2]
				},

				constrained_type: {
					0: field('base_type'), // type [struct=0]
					2: field('constraint') // type [struct=1]
				},

				decorator: {
					2: field('newline') //  [struct=1]
				},

				dictionary: {
					1: field('entries')
				},

				exec_statement: {
					2: field('in_clause')
				},

				/* for_statement / function_definition / with_statement: each
				   starts with `optional('async')` at pos 0, auto-promoted by
				   enrich as `field('async_marker', SYMBOL(_kw_async_marker))` —
				   no manual transform entry is needed for them here. */

				for_in_clause: {
					'0/0': field('async_marker')
				},

				finally_clause: {
					2: field('block') // block [struct=0]
				},

				generic_type: {
					0: field('identifier') // identifier [struct=0]
				},

				import_from_statement: {
					3: field('wildcard_import') // wildcard_import [struct=0]
				},

				keyword_pattern: {
					2: field('simple_pattern') // _simple_pattern | class_pattern | complex_pattern | concatenated_string | dict_pattern | dotted_name | false | float | integer | list_pattern | none | splat_pattern | string | true | tuple_pattern | union_pattern [struct=1]
				},

				member_type: {
					0: field('base_type') // type [struct=0]
				},

				slice: {
					0: field('start'), // expression [struct=0]
					2: field('stop'), // expression [struct=1]
					3: field('step') // expression [struct=2]
				},

				splat_pattern: {
					'0': field('operator'), // '*' | '**'
					1: field('identifier') // identifier | '_'
				},

				splat_type: {
					0: field('identifier') // identifier [struct=0]
				},

				string: {
					1: field('content') // interpolation | string_content [struct=1]
				},

				type_alias_statement: {
					0: field('type')
				},

				try_statement: {
					3: field('except_clauses') // except_clause [struct=0]
				},

				union_type: {
					0: field('left'), // type [struct=0]
					2: field('right') // type [struct=1]
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
