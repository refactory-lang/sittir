/**
 * overrides.ts — Grammar extension for rust
 *
 * Converted from overrides.json. Each entry wraps an unnamed child
 * at a positional index with a named field.
 *
 * @generated from overrides.json — review before committing
 */
/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import base from './base.ts';

import {
	transform,
	enrich,
	field,
	alias,
	variant,
	wire,
	prec,
	token,
	grammar
} from '../codegen/src/dsl/dsl-authoring.ts';
import type { RustGrammarShape } from '../codegen/src/grammar-shapes/grammar-shape.rust.ts';
import type { EnrichedGrammar } from '../codegen/src/dsl/enrich.ts';

declare const string: (value: string) => unknown;

const enrichedBase = enrich(base);

export default grammar(
	enrichedBase,
	wire<EnrichedGrammar<RustGrammarShape>>(
		{
			name: 'rust',
			conflicts: ($, previous) => [
				...(previous ?? []),
				[$._expression_except_range, $._match_arm_block_ending],
				[$.generic_type_with_turbofish, $.generic_pattern, $._path],
				[$.generic_type_with_turbofish, $._path],
				[$.visibility_modifier, $._path],
				[$._expression_except_range, $._closure_expression_group1],
				[$.scoped_identifier, $.scoped_type_identifier, $._visibility_modifier_crate],
				[$._visibility_modifier_pub],
				[$._attributed_type_parameter, $._type],
				[$._attributed_argument]
			],
			polymorphs: {
				array_expression: { '2/0': 'semi', '2/1': 'list' },
				closure_expression: { '4/0': 'block', '4/1': 'expr' },
				field_pattern: { '2/0': 'shorthand', '2/1': 'named' },
				function_type: { '1/0/0': 'trait_form', '1/0/1': 'fn_form' },
				macro_definition: { '2/0': 'paren', '2/1': 'bracket', '2/2': 'brace' },
				mod_item: { '3/0': 'external', '3/1': 'inline' },
				or_pattern: { '0': 'binary', '1': 'prefix' },
				range_expression: {
					'0': 'binary',
					'1': 'postfix',
					'2': 'prefix',
					'3': 'bare'
				},
				range_pattern: {
					'0/1/0': 'left_with_right',
					'0/1/1': 'left_bare',
					'1': 'prefix'
				},
				struct_item: { '4/0': 'brace', '4/1': 'tuple', '4/2': 'unit' },
				visibility_modifier: {
					'1/1/0/1/3': 'in_path',
					'0': 'crate',
					'1': 'pub'
				}
			},
			groups: {
				_visibility_modifier_pub: {
					'1': 'parens'
				},

				in_path: ($) => seq('in', $._path),

				attributed_field_declaration: ($) => seq(repeat($.attribute_item), $.field_declaration),

				attributed_enum_variant: ($) => seq(repeat($.attribute_item), $.enum_variant),

				attributed_parameter: ($) =>
					seq(optional($.attribute_item), choice($.parameter, $.self_parameter, $.variadic_parameter, '_', $._type)),

				attributed_type_parameter: ($) =>
					seq(
						repeat($.attribute_item),
						choice($.metavariable, $.type_parameter, $.lifetime_parameter, $.const_parameter)
					),

				attributed_argument: ($) => seq(repeat($.attribute_item), $._expression),

				attributed_ordered_field: ($) =>
					seq(repeat($.attribute_item), optional($.visibility_modifier), field('type', $._type)),

				type_argument: ($) =>
					seq(choice($._type, $.type_binding, $.lifetime, $._literal, $.block), optional($.trait_bounds)),

				match_block_arms: ($) => seq(repeat($.match_arm), field('last_arm', $.last_match_arm))
			},
			transforms: {
				token_repetition: {
					4: field('separator'),
					5: field('operator')
				},

				token_repetition_pattern: {
					4: field('separator'),
					5: field('operator')
				},

				field_initializer_list: {
					1: field('initializers')
				},

				tuple_pattern: {
					1: field('elements')
				},

				closure_parameters: {
					1: field('parameters')
				},
				struct_pattern: {
					2: field('fields')
				},
				trait_bounds: {
					1: field('bounds')
				},
				use_bounds: {
					2: field('bounds')
				},
				// last_match_arm: seq(repeat(attrs)[0], field('pattern')[1], '=>'[2],
				//   field('value')[3], optional(',')[4]).
				// Pos 4's optional trailing comma is an unnamed anonymous token — never
				// captured, so a source last-arm's trailing ',' was silently dropped on
				// render (3 corpus AST mismatches: [pattern,"=>",value,","] vs
				// [pattern,"=>",value]). Field it ('4/0' = the optional's content) so
				// read captures and render preserves it; same marker-promotion pattern
				// as async_block's move_marker.
				last_match_arm: {
					'0': field('attributes'),
					'4/0': field('comma')
				},

				match_block: {
					'1/0/1': field('last_arm')
				},

				async_block: {
					'1/0': field('move_marker')
				},

				array_expression: [{ 1: field('attributes') }],

				attribute: {
					0: field('path')
				},

				block: {
					3: field('trailing_expression')
				},

				bounded_type: {
					0: field('left'),
					2: field('right')
				},

				closure_expression: {
					'0/0': field('static_marker'),
					'1/0': field('async_marker'),
					'2/0': field('move_marker')
				},

				extern_modifier: {},

				function_modifiers: {
					_: field('modifier')
				},

				visibility_modifier: {
					'1/0': field('pub'),
					'1/1/0/1/3/0': field('in')
				},

				function_type: [],

				gen_block: {
					'1/0': field('move_marker')
				},

				generic_type_with_turbofish: {
					1: field('turbofish')
				},

				index_expression: {
					0: field('object'),
					2: field('index')
				},

				macro_invocation: {
					2: field('token_tree')
				},

				mod_item: [],

				negative_literal: {
					1: field('value')
				},

				ordered_field_declaration_list: {
					1: field('attributes')
				},

				or_pattern: {
					'0/0': field('left'),
					'0/2': field('right'),
					'1/1': field('right')
				},

				pointer_type: {
					'1/0': variant('const'),
					'1/1': variant('mut')
				},

				// string_literal deliberately NOT fielded: its opening token is
				// `alias(/[bc]?"/, '"')` — a PATTERN carrying the b"/c" byte-/C-string
				// prefixes, aliased to the constant '"'. Field-promoting it was tried
				// (2026-07-28) and does NOT recover the prefix: slot classification
				// keys off the ALIAS display string, minting a fixed `dquote`
				// TERMINAL whose wire encoding is a presence boolean, so the render
				// still emits the static '"' and c"..." renders as "..." (1 corpus
				// AST mismatch). Needs a classification fix (alias-of-PATTERN whose
				// regex isn't the alias string is content-bearing) — see specs/026
				// progress notes.

				// raw_string_literal: 3 field(s)
				raw_string_literal: {
					0: field('raw_string_literal_start'),
					1: field('string_content'),
					2: field('raw_string_literal_end')
				},

				range_expression: {
					'0/0': field('start'),
					'0/1': field('operator'),
					'0/2': field('end'),
					'1/0': field('start'),
					'1/1': field('operator'),
					'2/0': field('operator'),
					'2/1': field('end'),
					'3': field('operator')
				},

				reference_pattern: {
					2: field('pattern')
				},

				reference_type: {},

				self_parameter: {
					0: field('reference')
				},

				shorthand_field_initializer: {
					0: field('attributes')
				},

				source_file: {
					1: field('statements')
				},

				static_item: {
					2: field('mutable_specifier')
				},

				trait_item: {
					'1/0': field('unsafe_marker')
				},

				try_expression: {
					0: field('value')
				},

				tuple_expression: {
					1: field('attributes'),
					'(_expression)': field('elements')
				},

				tuple_type: {
					'(_type)': field('type')
				},

				type_item: {
					4: field('where_clause'),
					7: field('trailing_where_clause')
				},

				unary_expression: {
					0: field('operator'),
					1: field('operand')
				},

				variadic_parameter: {},

				expression_statement: {
					0: variant('with_semi'),
					1: variant('block_ending')
				},

				foreign_mod_item: {
					'2/0': variant('semi'),
					'2/1': variant('body')
				},

				match_arm: [{ 0: field('attributes') }, { '3/0': variant('with_comma'), '3/1': variant('block_ending') }],

				line_comment: {
					'1/0': variant('regular_dslash'),
					'1/1': variant('doc'),
					'1/2': variant('content')
				},

				token_tree_pattern: {
					0: variant('paren'),
					1: variant('bracket'),
					2: variant('brace')
				},
				token_tree: {
					0: variant('paren'),
					1: variant('bracket'),
					2: variant('brace')
				},
				delim_token_tree: {
					0: variant('paren'),
					1: variant('bracket'),
					2: variant('brace')
				}
			},
			rules: {
				_token_tree_punctuation: ($) =>
					choice(
						'+',
						'-',
						'*',
						'/',
						'%',
						'^',
						'!',
						'&',
						'|',
						'&&',
						'||',
						'<<',
						'>>',
						'+=',
						'-=',
						'*=',
						'/=',
						'%=',
						'^=',
						'&=',
						'|=',
						'<<=',
						'>>=',
						'=',
						'==',
						'!=',
						'>',
						'<',
						'>=',
						'<=',
						'@',
						'_',
						'.',
						'..',
						'...',
						'..=',
						',',
						';',
						':',
						'::',
						'->',
						'=>',
						'#',
						'?'
					),

				_non_special_token: ($, original) => {
					const patched = transform(original, {
						'-30': alias('token_tree_punctuation')
					});
					const members = patched.members;
					return {
						...patched,
						members: [...members.slice(0, 8), $._token_keywords]
					};
				},

				_token_keywords: ($) =>
					choice(
						"'",
						'as',
						'async',
						'await',
						'break',
						'const',
						'continue',
						'default',
						'enum',
						'fn',
						'for',
						'gen',
						'if',
						'impl',
						'let',
						'loop',
						'match',
						'mod',
						'pub',
						'return',
						'static',
						'struct',
						'trait',
						'type',
						'union',
						'unsafe',
						'use',
						'where',
						'while'
					),

				use_wildcard: ($) => seq(optional($._use_wildcard_clause), '*'),
				_use_wildcard_clause: ($) => seq(field('path', $._path), '::'),

				_where_clause_group1: ($, previous) => prec.right(0, previous),

				_pattern: ($, original) =>
					transform(original, {
						'-1': alias($._wildcard_pattern, $.wildcard_pattern)
					}),

				_wildcard_pattern: ($) => '_',

				// range_expression's bare-'..' arm (RangeFull, e.g. `let x = ..;`) is
				// the only choice arm that isn't a seq — arms 0-2 get auto-synthesized
				// group kinds (range_expression_binary/postfix/prefix), but a bare
				// literal produces an ANONYMOUS/unnamed token, so the wrap layer's
				// `content` accessor never finds a value ("singular slot 'content' on
				// 'range_expression' requires one value; got undefined"). Same fix as
				// `_wildcard_pattern` just above: alias the literal into its own real,
				// named node.
				range_expression: ($, original) =>
					transform(original, {
						'-1': alias($._range_expression_bare, $.range_expression_bare)
					}),

				_range_expression_bare: ($) => '..',

				_reference_expression_raw_const: ($) => seq('raw', 'const'),
				_reference_expression_raw_mut: ($) => seq('raw', $.mutable_specifier),
				reference_expression: ($) =>
					prec(
						12,
						seq(
							'&',
							optional(
								choice(
									alias($._reference_expression_raw_const, $.reference_expression_raw_const),
									alias($._reference_expression_raw_mut, $.reference_expression_raw_mut),
									$.mutable_specifier
								)
							),
							field('value', $._expression)
						)
					),

				_impl_item_unsafe_marker: ($) => 'unsafe',
				_impl_item_body: ($) => $.declaration_list,
				_impl_item_semi: ($) => ';',
				_impl_item_positive_clause: ($) =>
					seq(field('trait', choice($._type_identifier, $.scoped_type_identifier, $.generic_type)), 'for'),
				_impl_item_negative_clause: ($) =>
					seq('!', field('trait', choice($._type_identifier, $.scoped_type_identifier, $.generic_type)), 'for'),
				impl_item: ($) =>
					seq(
						optional(field('unsafe_marker', $._impl_item_unsafe_marker)),
						'impl',
						optional(field('type_parameters', $.type_parameters)),
						optional(
							field(
								'trait_clause',
								choice(
									alias($._impl_item_positive_clause, $.impl_item_positive_clause),
									alias($._impl_item_negative_clause, $.impl_item_negative_clause)
								)
							)
						),
						field('type', $._type),
						optional(field('where_clause', $.where_clause)),
						choice(alias($._impl_item_body, $.impl_item_body), alias($._impl_item_semi, $.impl_item_semi))
					),

				_let_chain: ($) =>
					prec.left(
						3,
						choice(
							seq(field('left', $._let_chain), '&&', field('right', $.let_condition)),
							seq(field('left', $._let_chain), '&&', field('right', $._expression)),
							seq(field('left', $.let_condition), '&&', field('right', $._expression)),
							seq(field('left', $.let_condition), '&&', field('right', $.let_condition)),
							seq(field('left', $._expression), '&&', field('right', $.let_condition))
						)
					)
			},

			expectTestFailures: {
				async_block: '#130 — factory returns block $type / no $render accessor',
				block_comment: '#130 — factory output has no $render accessor',
				gen_block: '#130 — factory returns block $type / no $render accessor',
				reference_pattern: '#130 — factory returns wrong $type / no $render accessor',
				self_parameter: '#130 — factory output has no $render accessor',
				variadic_parameter: '#130 — factory output has no $render accessor'
			},
			renderAs: (_$) => ({
				_outer_line_doc_comment_marker: string('/'), // /// outer line doc
				_inner_line_doc_comment_marker: string('!'), // //! inner line doc
				_outer_block_doc_comment_marker: string('*'), // /** outer block doc */
				_inner_block_doc_comment_marker: string('!'), // /*! inner block doc */
				_raw_string_literal_start: string('r#"'),
				_raw_string_literal_end: string('"#')
			})
		},
		enrichedBase
	)
);
