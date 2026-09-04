/**
 * grammar.sittir.ts — Grammar extension for rust
 *
 * Converted from overrides.json. Each entry wraps an unnamed child
 * at a positional index with a named field.
 *
 * @generated from overrides.json — review before committing
 */
/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import base from './base.ts';

import { enrich, field, alias, variant, arm, wire, prec, token, grammar, preference } from '../codegen/src/dsl/dsl-authoring.ts';
import type { RustGrammarShape } from '../codegen/src/grammar-shapes/grammar-shape.rust.ts';
import type { EnrichedGrammar } from '../codegen/src/dsl/enrich.ts';

declare const string: (value: string) => unknown;

const enrichedBase = enrich(base, {
	// `tuple_type`'s separated list is extracted into its own
	// `_tuple_type_elements` rule (`rules:` below) with every element
	// position explicitly fielded, and `trait_bounds` fields its list's
	// element position via its `bounds` field override —
	// applyNodeChoiceFieldWrap's separated-list target fielding the same
	// position first left those overrides with nothing to find: a hard
	// `tree-sitter generate` failure for `tuple_type` (kind-match search
	// came up empty) and an accessor-throw for `trait_bounds` (merged slot
	// ended up empty).
	// `function_modifiers` already fields EVERY position with a wildcard
	// override (`_: field('modifier')` below) — same nested-field collision
	// as `tuple_type`/`trait_bounds`, this time surfacing as a render-time
	// unknown-kind-id error rather than a hard generate failure or an
	// accessor-throw. `_where_predicates` regressed factory-render-parse
	// (-2) and `_closure_parameters_optional1`/`_use_clauses` each
	// regressed coverage (-1) when enabled — found via bisection against
	// `validate:native`, root cause not further isolated (each is a small,
	// contained loss, not a hard failure); left skipped until diagnosed.
	skip: ['tuple_type', 'trait_bounds', 'function_modifiers']
});

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
				[$._expression_except_range, $._closure_expression_arm],
				[$.async_block, $._kw_async_marker],
				[$.scoped_identifier, $.scoped_type_identifier, $._visibility_modifier_crate],
				[$._visibility_modifier_pub],
				[$._attributed_type_parameter, $._type],
				[$._attributed_argument]
			],
			externals: ($, previous) => [...(previous ?? []), $._tight, $._space, $._newline],
			visibleExternals: (_$) => ({
				_tight: string(''),
				_space: string(' '),
				_newline: string('\n')
			}),
			defaults: {
				comma_separator_space_before: 'tight',
				semi_separator_space_before: 'tight',
				empty_separator_space: 'newline',
				token_tree_paren: { tokens_empty_separator_space: 'tight' },
				token_tree_bracket: { tokens_empty_separator_space: 'tight' },
				token_tree_brace: { tokens_empty_separator_space: 'tight' },
				delim_token_tree_paren: { delim_tokens_empty_separator_space: 'tight' },
				delim_token_tree_bracket: { delim_tokens_empty_separator_space: 'tight' },
				delim_token_tree_brace: { delim_tokens_empty_separator_space: 'tight' },
				token_tree_pattern_paren: { token_patterns_empty_separator_space: 'tight' },
				token_tree_pattern_bracket: { token_patterns_empty_separator_space: 'tight' },
				token_tree_pattern_brace: { token_patterns_empty_separator_space: 'tight' }
			},
			groups: {
				_visibility_modifier_pub: {
					'1': 'parens'
				},

				visibility_modifier_in_path: ($) => seq('in', $._path),

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
			patches: {
				parameter: {
					'1': field('name')
				},

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
				last_match_arm: {
					'0': field('attributes'),
					'4/0': field('comma')
				},

				match_block: {
					'1/0/1': field('last_arm')
				},

				async_block: {
					2: field('body')
				},

				array_expression: [
					{ 1: field('attributes'), '2/0/0': field('element') },
					{ '2/0': variant('semi'), '2/1': variant('list') }
				],

				attribute: [{ 0: field('path') }, { '1/0': variant('input') }, { 1: field('input') }],

				block: {
					3: field('trailing_expression')
				},

				bounded_type: {
					0: field('left'),
					2: field('right')
				},

				closure_expression: { '4/0': variant('block'), '4/1': variant('expr') },

				function_modifiers: {
					_: field('modifier')
				},

				visibility_modifier: [
					{ '1/1/0/1/3/0': field('in') },
					{
						'1/1/0/1/3': variant('in_path'),
						'0': variant('crate'),
						'1': variant('pub')
					}
				],

				function_type: { '1/0/0': variant('trait_form'), '1/0/1': variant('fn_form') },

				gen_block: {
					2: field('body')
				},

				index_expression: {
					0: field('object'),
					2: field('index')
				},

				macro_invocation: {
					2: field('arguments')
				},

				mod_item: { '3/0': variant('external'), '3/1': variant('inline') },

				negative_literal: {
					1: field('value')
				},

				ordered_field_declaration_list: {
					1: field('attributes')
				},

				or_pattern: [
					{
						'0/0': field('left'),
						'0/2': field('right'),
						'1/1': field('right')
					},
					{ '0': variant('binary'), '1': variant('prefix') }
				],

				pointer_type: {
					'1/0': variant('const'),
					'1/1': variant('mut')
				},

				// string_literal's opening token carries the b"/c" byte-/C-string
				// prefix (`alias(/[bc]?"/, $.string_open)` in `rules:` below) — a
				// NAMED alias, so its real per-occurrence text (`c"`/`b"`/`"`)
				// survives instead of collapsing to the base grammar's anonymous
				// `alias(/[bc]?"/, '"')` display string.
				string_literal: {
					0: field('string_open')
				},

				// raw_string_literal's delimiters are HIDDEN external-scanner
				// tokens (`$._raw_string_literal_start`/`_end`) — invisible in
				// the CST, so their per-occurrence text (the hash-run width:
				// `r#"` vs `r###"`) never reaches the read layer, and the render
				// had to invent a fixed single-hash spelling that corrupts any
				// raw string whose content embeds `#"`-runs. Same fix as
				// `string_literal`/`string_open`: name the tokens via alias so
				// each occurrence's real text survives as a captured slot.
				raw_string_literal: [
					{ '0': alias('raw_string_literal_start'), '2': alias('raw_string_literal_end') },
					{
						0: field('raw_string_literal_start'),
						1: field('string_content'),
						2: field('raw_string_literal_end')
					}
				],

				// range_expression's bare-'..' arm (RangeFull, e.g. `let x = ..;`) is
				// the only choice arm that isn't a seq — arms 0-2 get auto-synthesized
				// group kinds (range_expression_binary/postfix/prefix), but a bare
				// literal produces an ANONYMOUS/unnamed token, so the wrap layer's
				// `content` accessor never finds a value ("singular slot 'content' on
				// 'range_expression' requires one value; got undefined"). Same fix as
				// `_pattern`'s `wildcard_pattern` below: alias the literal into its
				// own real, named node (`_range_expression_bare` in `rules:`).
				range_expression: [
					{ '-1': alias('range_expression_bare') },
					{
						'0/0': field('start'),
						'0/1': field('operator'),
						'0/2': field('end'),
						'1/0': field('start'),
						'1/1': field('operator'),
						'2/0': field('operator'),
						'2/1': field('end'),
						'3': field('operator')
					},
					{
						'0': variant('binary'),
						'1': variant('postfix'),
						'2': variant('prefix'),
						'3': variant('bare')
					}
				],

				self_parameter: {
					0: field('reference')
				},

				shorthand_field_initializer: {
					0: field('attributes'),
					1: field('name')
				},

				try_expression: {
					0: field('value')
				},

				type_item: {
					4: field('where_clause'),
					7: field('trailing_where_clause')
				},

				unary_expression: {
					0: field('operator'),
					1: field('operand')
				},

				extern_modifier: { '1/0': field('abi') },
				lifetime: { 1: field('name') },
				label: { 1: field('name') },
				captured_pattern: { 0: field('name') },
				base_field_initializer: { 1: field('value') },
				unsafe_block: { 1: field('body') },
				try_block: { 1: field('body') },
				declaration_list: { 1: field('declarations') },

				expression_statement: {
					0: variant('with_semi'),
					1: variant('block_ending')
				},

				foreign_mod_item: {
					'2/0': variant('semi'),
					'2/1': variant('body')
				},

				match_arm: [{ 0: field('attributes') }, { '3/0': variant('with_comma'), '3/1': variant('block_ending') }],

				// `///` and `//!` reach this choice as separate arms: their
				// outer/inner marker fields are alternatives, which enrich
				// distributes over the doc sequence rather than fusing onto one
				// kind as two independent optional markers.
				line_comment: {
					'1/0': variant('regular_dslash'),
					'1/1': variant('doc_outer'),
					'1/2': variant('doc_inner'),
					'1/3': variant('content')
				},

				// `/**` and `/*!`, the block spelling of the same split. Only
				// the two distributed arms are named; the third is already a
				// reference to a named content rule.
				block_comment: {
					'1/0/0': variant('doc_outer'),
					'1/0/1': variant('doc_inner')
				},

				// The token-tree repeats' element fields (`field('delim_tokens',
				// repeat($._delim_tokens))` and siblings) come from enrich's
				// repeat-union field promotion (dsl/enrich.ts) — no override
				// needed here; only the visible-variant splits remain.
				token_tree_pattern: { 0: variant('paren'), 1: variant('bracket'), 2: variant('brace') },
				token_tree: { 0: variant('paren'), 1: variant('bracket'), 2: variant('brace') },
				delim_token_tree: { 0: variant('paren'), 1: variant('bracket'), 2: variant('brace') },

				field_pattern: { '2/0': variant('shorthand'), '2/1': variant('named') },

				macro_definition: { '2/0': variant('paren'), '2/1': variant('bracket'), '2/2': variant('brace') },

				range_pattern: [
					{
						'0/1/0': variant('left_with_right'),
						'0/1/1': variant('left_bare'),
						'1': variant('prefix')
					},
					{ '0': variant('with_left') }
				],

				struct_item: { '4/0': variant('brace'), '4/1': variant('tuple'), '4/2': variant('unit') },

				// The wildcard `_` is a bare literal alternative of the `_pattern`
				// supertype choice. At multi-valued list positions (`sepBy(',',
				// $._pattern)` in tuple_struct_pattern, tuple_pattern, slice_pattern,
				// closure parameters) tree-sitter surfaces `_` as an anonymous child
				// that the read's named-only capture drops. Aliasing it to the named
				// `wildcard_pattern` kind (the `_wildcard_pattern` rule in `rules:`)
				// gives it a real node, so every `_pattern` list position round-trips
				// without render-side heuristics.
				_pattern: { '-1': alias('wildcard_pattern') },

				// Both trait-clause arms wrap the same `field('trait', <type>)`,
				// the negative one behind a leading `!`, so a bare type name fits
				// either. The positive clause is what a bare value means; the
				// negative arm stays reachable by tag or through its own
				// sub-factory.
				impl_item: { '3/0/0/0': arm.default }
			},
			rules: {
				// tuple_type's separated list realized as its own kind — the
				// delimiter is a fact of the list, so the list is a top-level
				// rule carrying it (hidden rule + visible alias, matching the
				// `*_elements` family). Every element position is fielded so
				// the extracted rule classifies separatedList and enrich's
				// separated-list field wrap has nothing left to target.
				_tuple_type_elements: ($) =>
					seq(field('type', $._type), repeat(seq(',', field('type', $._type))), optional(',')),
				tuple_type: ($) => seq('(', alias($._tuple_type_elements, $.tuple_type_elements), ')'),

				// tuple_expression's list is comma-TERMINATED with an optional
				// bare final element (`(e ',')+ e?`) — the shape that makes
				// `(1,)` a tuple and `(1)` a parenthesized expression. The
				// structure is mirrored verbatim from the base rule inside the
				// extracted kind; the separator lift's suffix windows merge it
				// to one repeat with an optional trailing delimiter.
				_tuple_expression_elements: ($) =>
					seq(
						seq(field('element', $._expression), ','),
						repeat(seq(field('element', $._expression), ',')),
						optional(field('element', $._expression))
					),
				tuple_expression: ($) =>
					seq(
						'(',
						field('attributes', repeat($.attribute_item)),
						alias($._tuple_expression_elements, $.tuple_expression_elements),
						')'
					),

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

				// The first seven base alternatives stay; the punctuation choice
				// becomes a reference to the `_token_tree_punctuation` rule shown
				// as `token_tree_punctuation`, and the keyword literals become one
				// `_token_keywords` reference.
				_non_special_token: ($, original) =>
					choice(
						...original.members.slice(0, 7),
						prec.right(0, alias($._token_tree_punctuation, $.token_tree_punctuation)),
						$._token_keywords
					),

				// `$` is the one token-tree token the base grammar keeps OUT of
				// `_non_special_token` (in macro-definition patterns `$` must stay
				// bindable as the metavariable sigil) and splices into invocation
				// token trees as a bare STRING arm instead. A bare literal arm has
				// no kind identity, so the read's array capture cannot materialize
				// it into `_delim_tokens` — `a!($)` read back and re-rendered as
				// `a!()`. Alias the STRING itself to the same visible punctuation
				// kind its 44 sibling tokens already use: the parse content stays
				// the literal `'$'` (only the node's name changes — no lexing or LR
				// impact), and definition-context `$` is untouched. NOT the
				// transform-spec `alias('name')` helper — that substitutes an
				// aliased reference to the whole `_token_tree_punctuation` RULE,
				// which makes every punctuation token doubly derivable here and is
				// a real LR ambiguity.
				_non_delim_token: ($, original) => ({
					...original,
					members: original.members.map((m) =>
						(m as { type?: string; value?: string }).type === 'STRING' && (m as { value?: string }).value === '$'
							? alias('$', $.token_tree_punctuation)
							: m
					)
				}),

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

				_where_predicates: ($, previous) => prec.right(0, previous),

				_wildcard_pattern: ($) => '_',

				_range_expression_bare: ($) => '..',

				// string_literal's opening token is `alias(/[bc]?"/, '"')` in the
				// base grammar — an UNNAMED alias, so the b"/c" prefix distinction
				// collapses to the fixed display string '"' before the compiler
				// ever sees it. Same fix as `_wildcard_pattern`/`_range_expression_bare`
				// above: alias the pattern into its own real, named node so its
				// per-occurrence text survives.
				string_literal: ($, original) =>
					seq(alias($._string_literal_open, $.string_open), ...original.members.slice(1)),

				_string_literal_open: ($) => /[bc]?"/,

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
			renderAs: (_$) => ({
				_inner_line_doc_comment_marker: string('!'),
				_outer_block_doc_comment_marker: string('*'),
				_inner_block_doc_comment_marker: string('!')
			})
		},
		enrichedBase
	)
);
