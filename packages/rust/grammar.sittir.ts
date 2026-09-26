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

import { enrich, field, alias, variant, arm, flatten, regex, wire, prec, token, grammar, preference } from '../codegen/src/dsl/dsl-authoring.ts';

declare const string: (value: string) => unknown;

const enrichedBase = enrich(base);

export default grammar(
	enrichedBase,
	wire(
		{
			name: 'rust',
			conflicts: ($, previous) => [
				...(previous ?? []),
				[$._expression_except_range, $.match_arm_block_ending],
				[$.generic_type_with_turbofish, $.generic_pattern, $._path],
				[$.generic_type_with_turbofish, $._path],
				[$.visibility_modifier, $._path],
				[$._expression_except_range, $.closure_expression_arm],
				[$.async_block, $._kw_async_marker],
				[$.scoped_identifier, $.scoped_type_identifier, $.visibility_modifier_crate],
				[$.visibility_modifier_pub],
				[$._attributed_type_parameter, $._type],
				[$._attributed_argument]
			],
			externals: ($, previous) => [...(previous ?? []), $._tight, $._space, $._newline, $._blankline, $._indent, $._dedent],
			supertypes: ($, previous) => [...(previous ?? []), $._whitespace],
			visibleExternals: (_$) => ({
				_tight: string(''),
				_space: string(' '),
				_newline: string('\n'),
				_blankline: string('\n\n'),
				_indent: indent(),
				_dedent: dedent()
			}),

			groups: {
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
			options: {
				body: { before: preference('indent'), after: preference('dedent') },
				gap: { separator: preference('newline') },
				field_declaration_list_elements: {
					'element:/separator/","/after': preference('newline'),
					'element:/delimiter': preference('Delimiter.Trailing')
				},
				enum_variant_list_elements: {
					'element:/separator/","/after': preference('newline'),
					'element:/delimiter': preference('Delimiter.Trailing')
				},

				_: {
					'_/separator/"+"/before': preference('space'),
					'_/separator/"+"/after': preference('space'),
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
					'".."/before': preference('tight'),
					'".."/after': preference('tight'),
					'"..="/before': preference('tight'),
					'"..="/after': preference('tight'),
					'"..."/before': preference('tight'),
					'"..."/after': preference('tight'),
					'","/before': preference('tight'),
					'_/separator/","/before': preference('tight'),
					'_/separator/";"/before': preference('tight'),
					'";"/before': preference('tight'),
					'":"/before': preference('tight'),
					'":"/after': preference('space'),
					'"::"/before': preference('tight'),
					'"::"/after': preference('tight'),
					'"<"/before': preference('tight'),
					'"<"/after': preference('tight'),
					'">"/before': preference('tight'),
					'"!"/before': preference('tight'),
					'"!"/after': preference('tight'),
					'"&"/after': preference('tight'),
					'"#"/after': preference('tight'),
					'"$"/after': preference('tight'),
					'"\'"/before': preference('tight'),
					'"\'"/after': preference('tight'),
					'"->"/before': preference('space'),
					'"->"/after': preference('space'),
					'"="/before': preference('space'),
					'"="/after': preference('space'),
					'"=>"/before': preference('space'),
					'"=>"/after': preference('space'),
					'operator:/before': preference('space'),
					'operator:/after': preference('space')
				},

				struct_pattern: { '"{"/before': preference('tight') },
				macro_invocation: { '"!"/after': preference('tight') },
				visibility_modifier_pub: { '"pub"/after': preference('tight') },
				self_parameter: { 'reference:/after': preference('tight') },
				variadic_parameter: { '"..."/before': preference('space') },
				closure_parameters: { '"|"/after': preference('tight'), '"|"/before': preference('tight'), after: preference('space') },

				source_file: {
					'statements:/separator': preference('tight'),
					'statements:/(_)/after': preference('blankline'),
					'statements:/(attribute_item)/after': preference('newline')
				},

				block: { before: preference('space'), 'statements:/end': preference('newline') },
				match_block: { before: preference('space') },
				declaration_list: { before: preference('space') },
				field_declaration_list: { before: preference('space') },
				enum_variant_list: { before: preference('space') },
				field_initializer_list: {
					before: preference('space'),
					'"{"/after': preference('space'),
					'"}"/before': preference('space')
				},
				last_match_arm: { before: preference('newline') },

				range_expression_binary: { 'operator:/before': preference('tight'), 'operator:/after': preference('tight') },
				range_expression_prefix: { 'operator:/after': preference('tight') },
				range_expression_postfix: { 'operator:/before': preference('tight') },
				unary_expression: { 'operator:/after': preference('tight') },
				token_tree_punctuation: { '","/after': preference('space'), '"..."/before': preference('space'), '"..."/after': preference('space') },

				_bindings: {
					'block/"{"/after': 'body/before',
					'block/"}"/before': 'body/after',
					'match_block/"{"/after': 'body/before',
					'match_block/"}"/before': 'body/after',
					'declaration_list/"{"/after': 'body/before',
					'declaration_list/"}"/before': 'body/after',
					'field_declaration_list/"{"/after': 'body/before',
					'field_declaration_list/"}"/before': 'body/after',
					'enum_variant_list/"{"/after': 'body/before',
					'enum_variant_list/"}"/before': 'body/after',
					'array_expression_list/attributes:/separator': 'gap/separator',
					'array_expression_semi/attributes:/separator': 'gap/separator',
					'attributed_argument/attribute_item:/separator': 'gap/separator',
					'attributed_enum_variant/attribute_item:/separator': 'gap/separator',
					'attributed_field_declaration/attribute_item:/separator': 'gap/separator',
					'attributed_ordered_field/attribute_item:/separator': 'gap/separator',
					'attributed_type_parameter/attribute_item:/separator': 'gap/separator',
					'block/statements:/separator': 'gap/separator',
					'declaration_list/declarations:/separator': 'gap/separator',
					'field_initializer/attribute_item:/separator': 'gap/separator',
					'function_modifiers/modifier:/separator': 'gap/separator',
					'last_match_arm/attributes:/separator': 'gap/separator',
					'match_arm/attributes:/separator': 'gap/separator',
					'match_block_arms/match_arm:/separator': 'gap/separator',
					'shorthand_field_initializer/attributes:/separator': 'gap/separator',
					'token_repetition/tokens:/separator': 'gap/separator',
					'token_repetition_pattern/token_patterns:/separator': 'gap/separator',
					'tuple_expression/attributes:/separator': 'gap/separator'
				}
			},

			patches: {
				bracketed_type: { 1: field('type') },
				else_clause: { 1: field('body') },
				generic_pattern: { 0: field('name') },
				integer_literal: {
					0: variant('decimal', { default: true }),
					1: variant('hex'),
					2: variant('binary'),
					3: variant('octal')
				},
				char_literal: {
					0: variant('escaped'),
					1: variant('plain', { default: true }),
					2: variant('empty')
				},
				escape_sequence: {
					0: variant('simple', { default: true }),
					1: variant('unicode_fixed'),
					2: variant('unicode_braced'),
					3: variant('hex')
				},
				metavariable: { '.': regex(/\$(?<name>[a-zA-Z_]\w*)/) },

				shebang: { '.': regex(/#!(?<content>[\r\f\t\v ]*(?:[^\[\n].*)?)\n/) },

				// See docs/rust-grammar-sittir-glossary.md::use_wildcard
				use_wildcard: {
					'0/0/0': field('path')
				},

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
					'1': flatten(),
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
					{ '2/1': arm.default },
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

				_let_chain: {
					'0/0': field('left'),
					'0/2': field('right'),
					'1/0': field('left'),
					'1/2': field('right'),
					'2/0': field('left'),
					'2/2': field('right'),
					'3/0': field('left'),
					'3/2': field('right'),
					'4/0': field('left'),
					'4/2': field('right')
				},

				closure_expression: { '4/0': variant('block'), '4/1': variant('expr') },

				// A braced, named-field body (`{ x: i32 }`) is what a bare array of
				// field configs means; the parenthesized, ordered-tuple body stays
				// reachable by building it explicitly.
				enum_variant: { '2/0/0/0': arm.default },

				reference_expression: { '1/0/0': variant('raw_const'), '1/0/1': variant('raw_mut'), '1/0/2': variant('mut') },

				// Both trait-clause arms wrap the same `field('trait', <type>)`,
				// the negative one behind a leading `!`, so a bare type name fits
				// either. The positive clause is what a bare value means; the
				// negative arm stays reachable by tag or through its own
				// sub-factory.
				impl_item: [
					{ '3/0/0/0': variant('positive_clause'), '3/0/0/1': variant('negative_clause') },
					{ '3/0/0/0': arm.default },
					{ '6/0': variant('body'), '6/1': variant('semi') }
				],

				function_modifiers: {
					_: field('modifier')
				},

				visibility_modifier: [
					{ '1/1/0/1/3/0': field('in') },
					{ '1/1/0/1/3': variant('in_path') },
					{ '1/1/0': variant('scope') },
					{ '0': variant('crate'), '1': variant('pub') }
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
				// prefix. The base grammar's `alias(/[bc]?"/, '"')` is unnamed, so
				// the prefix would collapse to the display string '"'; alias() names
				// it `string_open`, so its real per-occurrence text (`c"`/`b"`/`"`)
				// survives as a captured slot.
				string_literal: [{ 0: alias('string_open') }, { 0: field('string_open') }],

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
				declaration_list: {
					1: field('declarations')
				},

				expression_statement: {
					0: variant('with_semi'),
					1: variant('block_ending')
				},

				foreign_mod_item: {
					'2/0': variant('semi'),
					'2/1': variant('body')
				},

				match_arm: [{ 0: field('attributes'), 1: flatten() }, { '3/0': variant('with_comma'), '3/1': variant('block_ending') }],

				// `///` and `//!` reach this choice as separate arms: their
				// outer/inner marker fields are alternatives, which enrich
				// distributes over the doc sequence rather than fusing onto one
				// kind as two independent optional markers.
				line_comment: {
					'1/0': variant('extra_slashes'),
					'1/1': variant('doc_outer'),
					'1/2': variant('doc_inner'),
					'1/3': variant('regular', { default: true })
				},

				// `/**` and `/*!`, the block spelling of the same split; the
				// plain `/* … */` arm is the default.
				block_comment: {
					'1/0/0': variant('doc_outer'),
					'1/0/1': variant('doc_inner'),
					'1/0/2': variant('regular', { default: true })
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
						'0/1/0': variant('with_right'),
						'0/1/1': variant('bare'),
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
				// `wildcard_pattern` kind (alias() mints the `_wildcard_pattern` leaf)
				// gives it a real node, so every `_pattern` list position round-trips
				// without render-side heuristics.
				_pattern: { '-1': alias('wildcard_pattern') },
			},
			rules: {
				_whitespace: ($) => choice($._tight, $._space, $._newline, $._blankline, $._indent, $._dedent),
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

				// Enrich mints `_primitive_type` as the storage of upstream's inline
				// `alias(choice(...primitive types), $.primitive_type)`. As a rule of
				// its own it is a reduction point, so a bare primitive-type keyword
				// in a pattern (`fn f((u8))`) reaches it and `_pattern` alike;
				// `_pattern` is the correct read, so this rule yields.
				_primitive_type: ($, original) => prec(-1, original),

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

				where_predicates: ($, previous) => prec.right(0, previous),

				_range_expression_bare: ($) => '..',

				reference_expression: ($) =>
					prec(
						12,
						seq(
							'&',
							optional(choice(seq('raw', 'const'), seq('raw', $.mutable_specifier), $.mutable_specifier)),
							field('value', $._expression)
						)
					),

				_impl_item_unsafe_marker: ($) => 'unsafe',
				impl_item: ($) =>
					seq(
						optional(field('unsafe_marker', $._impl_item_unsafe_marker)),
						'impl',
						optional(field('type_parameters', $.type_parameters)),
						optional(
							field(
								'trait_clause',
								choice(
									seq(field('trait', choice($._type_identifier, $.scoped_type_identifier, $.generic_type)), 'for'),
									seq('!', field('trait', choice($._type_identifier, $.scoped_type_identifier, $.generic_type)), 'for')
								)
							)
						),
						field('type', $._type),
						optional(field('where_clause', $.where_clause)),
						choice($.declaration_list, ';')
					)
			},
			renderAs: (_$) => ({
				float_literal: /[0-9][0-9_]*(?:\.[0-9_]*(?:[eE][+-]?[0-9_]+)?|[eE][+-]?[0-9_]+)(?:[uif][0-9]+)?/,
				string_content: /[^"\\]+/,
				raw_string_literal_content: /[\s\S]*/,
				_inner_line_doc_comment_marker: token.immediate('!'),
				_outer_block_doc_comment_marker: token.immediate('*'),
				_inner_block_doc_comment_marker: token.immediate('!'),
				_raw_string_literal_start: /[bc]?r#*"/,
				_raw_string_literal_end: token.immediate(/"#*/),
				_line_doc_content: token.immediate(/.*/),
				_block_comment_content: token.immediate(/[^]*/)
			})
		},
		enrichedBase
	)
);
