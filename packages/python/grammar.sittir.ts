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

const enrichedBase = enrich(base, {
	// `string_content`'s plain-text runs between escapes aren't CST children
	// at all (an implicit gap), so it renders via a verbatim $TEXT fallback
	// today. Fielding its choice (which applyNodeChoiceFieldWrap would
	// otherwise do — all four arms are node-shaped) flips the walker off
	// that fallback onto join-the-field-elements rendering, silently
	// dropping every gap. None of enrich's other passes touch this rule's
	// shape anyway, so exempting it from all of them is a no-op beyond the
	// one pass that matters here.
	skip: ['string_content']
});
export default grammar(
	enrichedBase,
	wire(
		{
			name: 'python',
			externals: ($, prev) => {
				role($._indent, 'indent');
				role($._dedent, 'dedent');
				role($._newline, 'newline');
				return [...(prev ?? []), $._tight, $._space];
			},
			expectTestFailures: {
				'parenthesized_list_splat.parenthesizedListSplat':
					'dummy stub — the aliased inner parenthesized_list_splat is stubbed with an identifier content the transport rejects'
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
				_newline: string('\n'),
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
			patches: {
				comma_separator_space_before: preference('comma_separator_space_before', 'tight'),
				semi_separator_space_before: preference('semi_separator_space_before', 'tight'),
				dot_separator_space_before: preference('dot_separator_space_before', 'tight'),
				dot_separator_space_after: preference('dot_separator_space_after', 'tight'),
				empty_separator_space: preference('empty_separator_space', 'tight'),
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
				_except_clause_as: ($) => seq(field('value', $.expression), optional($._except_clause_as_optional1)),
				_except_clause_as_optional1: ($) => seq('as', field('alias', $.expression)),

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

				// Case-context as-pattern split — same two-rules-one-parse-kind class
				// as `case_tuple_pattern`/`case_list_pattern` just above. Base
				// `case_pattern` arm 0 is `alias($._as_pattern, $.as_pattern)`:
				// match-statement `X as name` patterns parse to the SAME `as_pattern`
				// kind as the expression-context rule (`seq($.expression, 'as',
				// field('alias', alias($.expression, $.as_pattern_target)))`), whose
				// wrap requires an `expression` child the case shape
				// (`seq($.case_pattern, 'as', $.identifier)`) never produces — every
				// case-context as-pattern threw at wrap time ("singular slot
				// 'expression' on 'as_pattern' requires one value"). Declare the case
				// shape as its own REAL visible rule (per the precedent above, a
				// choice-arm position can't mint a content alias, so `alias($._x, …)`
				// would never enter the NodeMap). Non-natural name: the natural
				// stripped name `as_pattern` is taken by the expression-context kind.
				case_as_pattern: ($) => seq($.case_pattern, 'as', $.identifier),
				case_pattern: ($) => prec(1, choice($.case_as_pattern, $.keyword_pattern, $._simple_pattern)),

				// Comprehension-clause visibility (hidden-repeat-helper class): the
				// base `_comprehension_clauses` (`seq($.for_in_clause,
				// repeat(choice($.for_in_clause, $.if_clause)))`) is a hidden rule
				// referenced as a MANDATORY seq member from all four comprehension
				// kinds — tree-sitter inlines it (children flatten onto the parent),
				// but sittir models it as a singular `comprehension_clauses` slot,
				// and the native read never reassembles the flattened
				// for_in_clause/if_clause children into that slot: every
				// comprehension threw at wrap time ("singular slot
				// 'comprehension_clauses' … requires one value; got undefined").
				// A Track-B reference-site alias can't help here — every reference
				// is mandatory (no `optional(...)` site to satisfy
				// `parentIsOptionalSeq`, see the `set`/`collection_elements` note above) —
				// so declare it as a REAL visible rule and reference it directly.
				// Body is `repeat1(choice(...))`, NOT the base's
				// `seq($.for_in_clause, repeat(choice(...)))`: the seq shape derives
				// TWO slots (position-0 `for_in_clause` + the repeat as `content`),
				// but the native reader can only fill ONE bucket from the flat
				// children, and the generated render fn papers over the missing
				// slot by feeding BOTH template slots the same buffer — duplicating
				// every clause on deep render (`(x for x in y for x in y)`).
				// repeat1 is a deliberate, slight acceptance-widening (a leading
				// if_clause becomes grammatical to the override parser; base
				// rejects it) — it can't reject anything the base accepts, so no
				// override-parser ERROR regressions are possible from it.
				// The repeat is FIELDED so the native read keys every clause into
				// one `_content` array in cursor order — an unnamed union repeat
				// buckets children per kind and the wrap's merge cannot preserve
				// cross-kind order (a `for … if … for …` clause chain would
				// reorder). 'content' matches the sanctioned-union name the slot
				// derivation already produces for this row.
				comprehension_clauses: ($) => field('content', repeat1(choice($.for_in_clause, $.if_clause))),
				list_comprehension: ($) => seq('[', field('body', $.expression), $.comprehension_clauses, ']'),
				dictionary_comprehension: ($) => seq('{', field('body', $.pair), $.comprehension_clauses, '}'),
				set_comprehension: ($) => seq('{', field('body', $.expression), $.comprehension_clauses, '}'),
				generator_expression: ($) => seq('(', field('body', $.expression), $.comprehension_clauses, ')'),

				// print_statement's two arms are declared as real visible rules,
				// not left as anonymous seq arms: tree-sitter flattens an
				// anonymous arm's fields onto the parent, so a sittir-minted
				// arm kind would never resolve against parser output. Each
				// argument list is its own kind because the delimiter is a
				// fact of the list (hidden rule + visible alias, like the
				// `*_elements` family). The chevron form's post-chevron
				// language is `{ε, ',', (',' arg)+, (',' arg)+ ','?}`: the
				// comma-led list extracts as `(',' arg)+ ','?` and the bare
				// `','` arm stays in the optional choice, so the language is
				// unchanged.
				// The parenthesized import list is one kind shared by
				// `import_from_statement` and `future_import_statement`; its
				// list is the same visible `import_list` the bare arm shows.
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
