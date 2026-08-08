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
import { role, enrich, field, alias, wire } from '../codegen/src/dsl/index.ts';

const enrichedBase = enrich(base, {
	// `string_content`'s plain-text runs between escapes aren't CST children
	// at all (an implicit gap), so it renders via a verbatim $TEXT fallback
	// today. Fielding its choice (which applyNodeChoiceFieldWrap would
	// otherwise do — all four arms are node-shaped) flips the walker off
	// that fallback onto join-the-field-elements rendering, silently
	// dropping every gap. None of enrich's other passes touch this rule's
	// shape anyway, so exempting it from all of them is a no-op beyond the
	// one pass that matters here.
	//
	// `_dict_pattern_group2`'s leading and repeated occurrences are the
	// SAME `choice($._key_value_pattern, $.splat_pattern)` body (tree-sitter's
	// `commaSep1` passes one shared choice object to both positions), so
	// `fieldSeparatedListElements` fields both as `element` — but `dict_pattern`'s
	// own override (`'1/0/0/0': 'kv'`) already targets the leading occurrence
	// to mint the visible `dict_pattern_kv` kind. Auto-fielding it first left
	// the override's positional path pointing at an already-FIELD-wrapped
	// node instead of the bare choice it expects — the override silently no
	// longer applies, and `dict_pattern_kv` stops existing as a distinct
	// exported kind. Same override-collision class found in rust's
	// `tuple_type`/`trait_bounds` and typescript's `lexical_declaration`.
	skip: ['string_content', '_dict_pattern_group2']
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

				// `_suite`'s indent-bearing arm (`seq($._indent, $.block)`) has no
				// identity of its own otherwise — it's an anonymous seq member of
				// a CHOICE whose other two arms are themselves aliases (to
				// `simple_statements`/`newline`). Promoting it to its own kind
				// (same mechanism as `_match_block`'s `block` arm above) gives it
				// a real template, walked normally by emitRule/emitOne, so its
				// own INDENT member (`case INDENT` in templates.ts) renders
				// correctly instead of being silently dropped by emitChoice's
				// union-slot routing, which has no notion of "gate an anonymous
				// seq arm with no discriminating field of its own."
				_suite: { 1: 'block_with_indent' },

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
					),
				yield_from_clause: ($) => seq('from', $.expression)
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

				except_clause: {
					'1/0': field('star_marker')
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

				// import_from_statement: 1 field(s)
				// Path-scoped to choice arm 0 (the bare `$.wildcard_import` symbol).
				// The previous flat `3: field('wildcard_import')` wrapped the WHOLE
				// position-3 choice, so in the parenthesized arm
				// (`seq('(', $._import_list, ')')`) the field landed on the anonymous
				// '(' / ',' / ')' tokens (the named imports inside `_import_list`
				// already carry their own field('name')) — the wildcard_import slot
				// then filtered those out and threw "repeated slot 'wildcard_import'
				// requires at least one value" for `from a import (b, c)`.
				import_from_statement: {
					'3/0': field('wildcard_import') // wildcard_import [struct=0]
				},

				interpolation: {
					'2/0': field('eq_marker')
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
				// `parentIsOptionalSeq`, see the `set`/`element_list` note above) —
				// so declare it as a REAL visible rule (natural stripped name, per
				// the `print_statement_group1/2` precedent: it's what the generated
				// model already expects) and reference it directly.
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
				comprehension_clauses: ($) => repeat1(choice($.for_in_clause, $.if_clause)),
				list_comprehension: ($) => seq('[', field('body', $.expression), $.comprehension_clauses, ']'),
				dictionary_comprehension: ($) => seq('{', field('body', $.pair), $.comprehension_clauses, '}'),
				set_comprehension: ($) => seq('{', field('body', $.expression), $.comprehension_clauses, '}'),
				generator_expression: ($) => seq('(', field('body', $.expression), $.comprehension_clauses, ')'),

				// print_statement: base is a bare `choice(prec(1, seq('print',
				// chevron, ...)), prec(-3, prec.dynamic(-1, seq('print',
				// commaSep1(field('argument', expression)), ...))))` — TWO
				// anonymous seq arms, neither BLANK. Sittir's own IR auto-names
				// these `_print_statement_group1`/`_print_statement_group2` and
				// (per the multi-slot/single-slot visible-group rule) models
				// `content` as a union referencing both — but since neither
				// arm is authored as its own named rule OR wrapped in
				// `alias($._x, $.x)`, tree-sitter's native grammar compiler
				// just flattens both arms' fields (chevron / argument) directly
				// onto `print_statement` itself. The `_print_statement_group1`/
				// `_print_statement_group2` node-refs in the IR's `content`
				// field never resolve against the real parser output —
				// `hydrateSlots` (assemble.ts) correctly detects this as its
				// documented "inlined-before-assemble" category and leaves
				// them `UnresolvedRef`, but nothing downstream falls back to
				// the flattened fields, so `wrapPrintStatement`'s `_content`
				// accessor chain (`_content ?? _print_statement_group1 ??
				// _print_statement_group2`) never finds a value — every
				// print-statement form throws at wrap time.
				//
				// Per the `case_tuple_pattern`/`case_list_pattern` precedent
				// just above (same file, same root cause class): a CHOICE ARM
				// position is NOT the `optional(...)`/`CHOICE[x, BLANK]` shape
				// `mintContentAliasKinds` requires to register a
				// reference-site alias — an `alias($._x, ...)` here would
				// never enter the NodeMap. The fix is to declare each arm as
				// its OWN real, independently-visible rule (natural stripped
				// names — already what the generated types/wrap model
				// expects) and reference them directly by symbol, matching
				// the base grammar's arms verbatim (including precedence).
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

				_wildcard_pattern: ($) => '_',
			}
		},
		enrichedBase
	)
);
