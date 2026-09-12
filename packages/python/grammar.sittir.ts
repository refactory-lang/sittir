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
import { role, enrich, field, alias, variant, wire, preference } from '../codegen/src/dsl/index.ts';

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
				return [...(prev ?? []), $._tight, $._space, $._blankline, $._double_newline];
			},
			supertypes: ($, previous) => [...(previous ?? []), $._whitespace],
			expectTestFailures: {
				'parenthesized_list_splat.parenthesizedListSplat':
					'dummy stub — the aliased inner parenthesized_list_splat is stubbed with an identifier content the transport rejects'
			},
			conflicts: ($, previous) => [
				...(previous ?? []),
				[$.expression_statement, $._expression_statement_tuple],
				[$._except_clause_exception_as, $._except_clause_exception_list],
				[$.as_pattern, $._except_clause_exception_as],
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

			// String-interior scanner tokens: the external scanner claims their
			// characters directly, so no whitespace can ever precede them — a
			// string's plain-text run abutting an escape is one lexical region,
			// not a token seam, and the rendered text must never receive a seam
			// space. `token.immediate` cannot be written on an externals entry,
			// so each token's sittir-side `renderAs` body carries the wrapper:
			// the TOKEN flatten at link pushes `immediate` onto the rule the
			// render pipeline sees. The pattern bodies are nominal text shapes
			// (these leaves render verbatim from wire text, never from the
			// pattern).
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
				module: {
					'statements:/separator': preference('tight'),
					'statements:/(function_definition)/after': preference('double_newline'),
					'statements:/(class_definition)/after': preference('double_newline'),
					'statements:/(decorated_definition)/after': preference('double_newline')
				},

				_: {
					'_/separator/","/before': preference('tight'),
					'_/separator/";"/before': preference('tight'),
					'_/separator/"."/before': preference('tight'),
					'_/separator/"."/after': preference('tight'),
					'":"/after': preference('space'),
					'"->"/before': preference('space'),
					'"->"/after': preference('space'),
					'"="/before': preference('space'),
					'"="/after': preference('space'),
					'":="/before': preference('space'),
					'":="/after': preference('space'),
					'operator:/before': preference('space'),
					'operator:/after': preference('space'),
					'operators:/before': preference('space'),
					'operators:/after': preference('space')
				},
				keyword_argument: { '"="/before': preference('tight'), '"="/after': preference('tight') },
				default_parameter: { '"="/before': preference('tight'), '"="/after': preference('tight') },
				slice: { '":"/before': preference('tight'), '":"/after': preference('tight') },
				splat_pattern: { 'operator:/after': preference('tight') },
				splat_type: { 'operator:/after': preference('tight') },

				_bindings: {
					'block/statements:/separator': 'gap/separator',
					'comparison_operator/comparators:/separator': 'gap/separator',
					'comprehension_clauses/content:/separator': 'gap/separator',
					'concatenated_string/string:/separator': 'gap/separator',
					'decorated_definition/decorator:/separator': 'gap/separator',
					'if_statement/alternative:/separator': 'gap/separator',
					'match_block_block/alternative:/separator': 'gap/separator',
					'try_statement/except_clauses:/separator': 'gap/separator'
				}
			},

			patches: {
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

				// Arm 11 of `_simple_pattern` is the negative-literal shape
				// (`seq(optional('-'), choice(integer, float))`, minted as
				// `simple_pattern_negative`): the optional `-` is an anonymous
				// token enrich's optional-keyword promotion skips (not
				// word-shaped), so unfielded it lands in `$other` and never
				// renders. Fielding it mints `_kw_sign` — the same mechanism
				// `complex_pattern`'s leading `-` uses via its position-0 field.
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

				// import_from_statement: 1 field(s)
				// Path-scoped to choice arm 0 (the bare `$.wildcard_import` symbol).
				// The previous flat `3: field('wildcard_import')` wrapped the WHOLE
				// position-3 choice, so in the parenthesized arm
				// (`seq('(', $._import_list, ')')`) the field landed on the anonymous
				// '(' / ',' / ')' tokens (the named imports inside `_import_list`
				// already carry their own field('name')) — the wildcard_import slot
				// then filtered those out and threw "repeated slot 'wildcard_import'
				// requires at least one value" for `from a import (b, c)`.
				import_from_statement: [
					{ '3/0': field('wildcard_import') }, // wildcard_import [struct=0]
					{ '3/2': alias('parenthesized_import_list') }
				],
				future_import_statement: { '3/1': alias('parenthesized_import_list') },

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
					// Same star position as splat_pattern above — the choice of
					// '*'/'**' is the operator, not a second 'identifier' (the
					// duplicate name merged both positions into one slot and
					// dropped the star from renders).
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

				// A suite is one of three forms: simple statements on the same
				// line, an indented block, or nothing at all. Arms 0 and 2 are
				// aliases (to `simple_statements` / `newline`) and only need arm
				// names. Arm 1 (`seq($._indent, $.block)`) is an anonymous seq
				// member with no identity of its own; promoting it to a kind
				// (same mechanism as `_match_block`'s `block` arm above) gives
				// it a real template, so its INDENT member renders instead of
				// being dropped by emitChoice's union-slot routing.
				_suite: { 0: variant('inline'), 1: variant('block'), 2: variant('empty') }
			},
			rules: {
				_whitespace: ($) => choice($._tight, $._space, $._newline, $._blankline, $._double_newline, $._indent, $._dedent),
				// Base grammar aliases this arm (`alias($.list_splat_pattern,
				// $.list_splat)`), making primary_expression and list_splat_pattern
				// parse-kind-non-injective; stripping the alias below (needed so
				// both fork this OR/AND choice arm produce a real, distinct kind)
				// exposes the declared `[primary_expression, list_splat_pattern]`
				// GLR conflict as two visibly different kinds instead of one
				// display name, with the winning fork now decided by structural
				// tie-break noise instead of upstream's alias. `prec.dynamic(-1)`
				// restores upstream's outcome deterministically: the expression
				// fork (list_splat) wins every genuine ambiguity — true pattern
				// contexts (`a, *rest = xs`) are unaffected since the expression
				// fork dies at `=` there, leaving no tie to break.
				primary_expression: ($: any, original: ChoiceRule) => {
					let base = original.members;

					return choice(...base.slice(0, -1), prec.dynamic(-1, $.list_splat_pattern));
				},
				_except_clause_exception_as: ($) => seq(field('value', $.expression), optional($._except_clause_exception_as_optional1)),
				_except_clause_exception_as_optional1: ($) => seq('as', field('alias', $.expression)),

				// `string_content`'s plain-text runs (`_string_content`) and
				// invalid-escape runs (`_not_escape_sequence`) are hidden
				// tokens — absent from the CST, so a read can only see the
				// escape children and any string mixing text with escapes
				// loses its text through the slot-based render (the verbatim
				// $text fallback fires only when ALL slots are empty).
				// Alias both visible so fragments surface as leaf nodes the
				// read captures; the reader's `$slotOrder` stamp then merges
				// the per-kind buckets back into document order. Mirrors
				// tree-sitter-typescript, whose string fragments are visible
				// named tokens (`unescaped_double_string_fragment`).
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

				// `format_specifier`'s text run behaves immediate — its regex
				// absorbs any whitespace as content, so inter-token extras can
				// never materialize before it — but upstream writes plain
				// `token(...)`. Declaring `token.immediate` matters beyond the
				// parse: the text|text seam is load-bearing for RENDERING and
				// not subsumed by static char-class analysis. At parse time two
				// adjacent text runs can't occur (greedy lexing), but
				// config-built nodes ($with setters, untyped construction
				// through the Verbatim scalar arm) CAN pass '10' and 'd' as
				// separate items;
				// a seam check would inject '10 d' — corrupting the format
				// spec, where raw '10d' is the only correct output (verbatim
				// content: a space is semantics). Both sides are
				// class-indeterminate, so only the declared-immediacy fact can
				// clear that seam. (The text↔format_expression seams, by
				// contrast, are statically safe via the interpolation's fixed
				// non-word '{'/'}' flanks.)
				format_specifier: ($) =>
					seq(':', repeat(choice(token.immediate(prec(1, /[^{}\n]+/)), alias($.interpolation, $.format_expression)))),

				parameters: ($) => seq('(', optional(alias($._parameters, $.parameters_elements)), ')'),
				lambda_parameters: ($) => alias($._parameters, $.parameters_elements),
				tuple_pattern: ($) => seq('(', optional(alias($._patterns, $.patterns)), ')'),
				list_pattern: ($) => seq('[', optional(alias($._patterns, $.patterns)), ']'),
				list: ($) => seq('[', optional(alias($._collection_elements, $.collection_elements)), ']'),
				set: ($) => seq('{', alias($._collection_elements, $.collection_elements), '}'),
				tuple: ($) => seq('(', optional(alias($._collection_elements, $.collection_elements)), ')'),

				// Reference the shared case-pattern list kind (the enrich mint
				// serving _list_pattern/_tuple_pattern/class_pattern) instead of
				// respelling the list inline — the visible list node carries the
				// per-instance trailing-separator fact; an inline spelling would
				// keep per-field flank capture alive on these two kinds alone.
				case_tuple_pattern: ($) =>
					seq('(', optional(alias($._list_pattern_case_patterns, $.list_pattern_case_patterns)), ')'),
				case_list_pattern: ($) =>
					seq('[', optional(alias($._list_pattern_case_patterns, $.list_pattern_case_patterns)), ']'),

				// See docs/python-grammar-sittir-glossary.md::case_as_pattern
				case_as_pattern: ($) => seq($.case_pattern, 'as', $.identifier),
				case_pattern: ($) => prec(1, choice($.case_as_pattern, $.keyword_pattern, $._simple_pattern)),

				// See docs/python-grammar-sittir-glossary.md::comprehension_clauses
				comprehension_clauses: ($) => field('content', repeat1(choice($.for_in_clause, $.if_clause))),
				list_comprehension: ($) => seq('[', field('body', $.expression), $.comprehension_clauses, ']'),
				dictionary_comprehension: ($) => seq('{', field('body', $.pair), $.comprehension_clauses, '}'),
				set_comprehension: ($) => seq('{', field('body', $.expression), $.comprehension_clauses, '}'),
				generator_expression: ($) => seq('(', field('body', $.expression), $.comprehension_clauses, ')'),

				// See docs/python-grammar-sittir-glossary.md::_parenthesized_import_list
				_parenthesized_import_list: ($) => seq('(', alias($._import_list, $.import_list), ')'),
				_print_arguments: ($) =>
					seq(field('argument', $.expression), repeat(seq(',', field('argument', $.expression))), optional(',')),
				_print_chevron_arguments: ($) => seq(repeat1(seq(',', field('argument', $.expression))), optional(',')),
				print_statement_chevron: ($) =>
					seq('print', $.chevron, optional(choice(alias($._print_chevron_arguments, $.print_chevron_arguments), ','))),
				print_statement_plain: ($) => seq('print', alias($._print_arguments, $.print_arguments)),
				print_statement: ($) =>
					choice(prec(1, $.print_statement_chevron), prec(-3, prec.dynamic(-1, $.print_statement_plain))),
				// Base `_simple_pattern`'s last arm is the bare literal `'_'`
				// (the match-statement wildcard pattern). Every other arm is a
				// named rule (`$.dotted_name`, `$.string`, ...), so when
				// `_simple_pattern` (hidden) inlines into `case_pattern`, those
				// arms surface as a real named child that routes into
				// `case_pattern`'s singular `content` slot — but a bare string
				// literal produces an ANONYMOUS/unnamed token instead, which
				// the wrap layer's `content` accessor never finds ("singular
				// slot 'content' on 'case_pattern' requires one value; got
				// undefined"). Same root-cause class, same fix, as rust's
				// `_pattern`/`_wildcard_pattern` (packages/rust/grammar.sittir.ts):
				// alias the literal into its own real, named node so it can
				// fill the slot like every sibling arm.
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
