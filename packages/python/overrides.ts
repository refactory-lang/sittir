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
import { transform, role, enrich, field, wire } from '../codegen/src/dsl/index.ts';

export default grammar(
	enrich(base),
	wire({
		name: 'python',
		// Structural-whitespace role bindings — declared inline in the
		// externals callback. `role(symbolRef, name)` returns the symbol
		// unchanged (so externals still receives a valid token reference)
		// and records the binding on a per-grammar accumulator that Link
		// reads to drive symbol resolution. No more dummy `_indent` rules.
		externals: ($, prev) => {
			// Mark existing base externals with sittir roles. role() records
			// the binding as a side-effect (sittir runtime) and returns the
			// symbol unchanged. Returning `prev` directly avoids duplicating
			// the externals list — tree-sitter's grammar() doesn't dedupe,
			// so spreading prev plus role() returns would emit each token
			// twice and the generated parser.c would fail to compile.
			role($._indent, 'indent');
			role($._dedent, 'dedent');
			role($._newline, 'newline');
			return prev;
		},
		conflicts: ($, previous) => [
			...(previous ?? []),
			// expression_statement tuple-variant extraction: the bare
			// `expression` arm and the hoisted `_expression_statement_tuple`
			// both start with `expression • …`. In the base grammar
			// tree-sitter's LR(1) table merged the common prefix into a
			// single state; with the tuple form lifted into its own hidden
			// rule, tree-sitter needs an explicit GLR fork group to decide
			// between the bare expression and the tuple form on the `,`
			// suffix that only the tuple accepts.
			[$.expression_statement, $._expression_statement_tuple],
			// except_clause variant split: the `as` form (`except E as e:`)
			// and the comma-list form (`except E1, E2:`) both begin with
			// `field('value', expression) • …` and only diverge on the `as` /
			// `,` continuation. Lifting each arm into its own hidden rule
			// (`_except_clause_as` / `_except_clause_list`) requires an explicit
			// GLR fork to decide between them after the shared prefix.
			[$._except_clause_as, $._except_clause_list],
			// The `as` form (`except E as e:`) overlaps with `as_pattern`
			// (`E as e`) after the shared `expression 'as'` prefix — fork.
			[$.as_pattern, $._except_clause_as]
		],
		polymorphs: {
			assignment: { '1/0': 'eq', '1/1': 'type', '1/2': 'typed' },

			// expression_statement: bare expression / comma-separated tuple
			// form / assignment / augmented_assignment / yield. Arms 0, 2,
			// 3, 4 are bare symbol refs to existing visible kinds — the
			// classifier treats the all-symbol shape as canonical, so they
			// need no adoption. Arm 1 is the structural seq (tuple form);
			// adopting it wraps the seq in an alias so the rule becomes an
			// all-symbol choice from the walker's perspective. The
			// `conflicts` entry above tells tree-sitter to fork between
			// `expression` and `_expression_statement_tuple` when the LR
			// table sees `expression • …` and needs to decide on the `,`
			// continuation only the tuple form accepts.
			expression_statement: {
				1: 'tuple'
			},

			// with_clause: bare (`a, b, c`) vs parenthesized (`(a, b, c)`).
			// Same with_item content on both arms; paren form wraps with
			// '(' ... ')'. Split per variant so each owns its template.
			with_clause: {
				0: 'bare',
				1: 'paren'
			},

			// _match_block: base rule is
			//   choice(
			//     seq($._indent, repeat(field('alternative', $.case_clause)),
			//         $._dedent),                         // arm 0 — block form
			//     $._newline,                             // arm 1 — empty form
			//   )
			// Heterogeneous: one seq + one bare symbol. Splitting the seq arm
			// into `_match_block_block` leaves the remaining choice as all
			// symbol-like (alias + symbol) — canonical.
			_match_block: { 0: 'block' },

			// dict_pattern: base rule is
			//   seq('{', optional(seq(
			//     commaSep1(choice($._key_value_pattern, $.splat_pattern)),
			//     optional(','),
			//   )), '}')
			// liftCommaSep converts the commaSep1 into a repeat1 with
			// separator, so after simplify the path to the heterogeneous
			// choice is 1/0/0 (optional → seq → repeat1 → choice). One arm is
			// the inlined `_key_value_pattern` seq (tree-sitter wraps the
			// hidden rule in an alias); the other is `splat_pattern`.
			// Splitting the key-value arm into `dict_pattern_kv` leaves the
			// remaining choice all symbol-like. Requires infra (B)'s alias
			// descent in applyPath.
			dict_pattern: { '1/0/0/0': 'kv' },

			// _simple_pattern: base rule is
			//   prec(1, choice(
			//     class_pattern,               ← 0
			//     splat_pattern,               ← 1
			//     union_pattern,               ← 2
			//     alias(_list_pattern, …),     ← 3
			//     alias(_tuple_pattern, …),    ← 4
			//     dict_pattern,                ← 5
			//     string,                      ← 6
			//     concatenated_string,         ← 7
			//     true,                        ← 8
			//     false,                       ← 9
			//     none,                        ← 10
			//     seq(optional('-'),           ← 11 — negative literal arm
			//         choice(integer, float)),
			//     complex_pattern,             ← 12
			//     dotted_name,                 ← 13
			//     '_',                         ← 14
			//   ))
			// Arm 11 is a SEQ containing an optional anonymous '-' token.
			// The anonymous token is not a named child, so the parent template
			// `{{ children | join(" ") }}` renders only the integer/float,
			// silently dropping '-' for negative patterns like `-1` or `-1.0`.
			// Adopting arm 11 as `simple_pattern_negative` (visible kind,
			// leading '_' stripped per polymorphVisibleName convention) gives it
			// its own template that includes the '-' prefix literal.
			//
			// Note: `_simple_pattern` is a hidden rule, so no conflicts entry
			// is needed — tree-sitter inlines it into parent rules directly.
			// The visible variant kind is `simple_pattern_negative`.
			_simple_pattern: { '11': 'negative' },

			// except_clause: base rule is
			//   seq('except', optional('*'), optional(choice(
			//     seq(field('value', expr), optional(seq('as', field('alias', expr)))),  ← arm 0 "as" form
			//     commaSep1(field('value', expr)),                                        ← arm 1 comma-list form
			//   )), ':', _suite)
			// The two arms have DIFFERENT field sets (arm 0: value + optional
			// alias; arm 1: repeated value), so the cross-branch field merge
			// (hoistSharedFieldAcrossChoiceBranches) can't fuse them — the
			// choice reaches derivation as the non-canonical
			// `seq-member-choice-needs-variant-or-merge` shape (hard error).
			// Split per variant so each form owns its template. Path: seq pos 2
			// = the optional, `/0` = its choice content, `/0`,`/1` = the arms.
			// `except_clause` is visible, but the arms share the `expression`
			// prefix; if tree-sitter reports an unresolved conflict between the
			// aliased forms, add `[$.except_clause_as, $.except_clause_list]` to
			// `conflicts`.
			except_clause: { '2/0/0': 'as', '2/0/1': 'list' }
		},
		transforms: {
			// argument_list: name the naked args choice (was an unresolvable
			// `content` slot). expression | list_splat | dictionary_splat |
			// parenthesized_expression | keyword_argument
			argument_list: {
				1: field('arguments')
			},

			// as_pattern: 1 field(s)
			as_pattern: {},

			// await: 1 field(s)
			await: {},

			// chevron: 1 field(s)
			chevron: {},

			// class_pattern: 2 field(s)
			class_pattern: {
				2: field('arguments') // case_pattern [struct=1]
			},

			// comparison_operator: 2 field(s)
			comparison_operator: {
				0: field('left'), // primary_expression [struct=0]
				1: field('comparators') // primary_expression [struct=1]
			},

			// complex_pattern: 2 field(s)
			complex_pattern: {
				0: field('real'), // integer | float [struct=0]
				1: field('imaginary') // integer | float [struct=1]
			},

			// conditional_expression: 3 field(s)
			conditional_expression: {
				0: field('body'), // expression [struct=0]
				2: field('condition'), // expression [struct=1]
				4: field('alternative') // expression [struct=2]
			},

			// constrained_type: 2 field(s)
			constrained_type: {
				0: field('base_type'), // type [struct=0]
				2: field('constraint') // type [struct=1]
			},

			// decorator: 2 field(s)
			decorator: {
				2: field('newline') //  [struct=1]
			},

			// dictionary: name the naked entries choice (pair | dictionary_splat)
			dictionary: {
				1: field('entries')
			},

			// dictionary_splat: 1 field(s)
			dictionary_splat: {},

			// exec_statement: grammar is seq('exec', code, optional(seq('in', exprs)))
			// Template walker emits the `in` keyword as a literal at top level,
			// which surfaces in rendering even when the optional(seq(...))
			// didn't match. Wrap the optional as field('in_clause') so the
			// whole clause (`in` + exprs) renders only when present.
			exec_statement: {
				2: field('in_clause')
			},

			// for_statement / function_definition / with_statement: each
			// starts with `optional('async')` at pos 0. Auto-promoted by
			// enrich (016 task #30) as `field('async_marker', SYMBOL(_kw_async_marker))`.
			// Wave 2's manual entries are now redundant.

			// for_in_clause: prec.left(seq(optional('async'), 'for', ...)).
			// The prec.left wrapper hides the seq from enrich's auto-promotion
			// walker, so the position is still hand-promoted (016 task #30
			// naming convention).
			for_in_clause: {
				'0/0': field('async_marker')
			},

			// finally_clause: 1 field(s)
			finally_clause: {
				2: field('block') // block [struct=0]
			},

			// generic_type: 2 field(s)
			generic_type: {
				0: field('identifier') // identifier [struct=0]
			},

			// if_clause: 1 field(s)
			if_clause: {},

			// import_from_statement: 1 field(s)
			import_from_statement: {
				3: field('wildcard_import') // wildcard_import [struct=0]
			},

			// keyword_pattern: 2 field(s)
			keyword_pattern: {
				2: field('simple_pattern') // _simple_pattern | class_pattern | complex_pattern | concatenated_string | dict_pattern | dotted_name | false | float | integer | list_pattern | none | splat_pattern | string | true | tuple_pattern | union_pattern [struct=1]
			},

			// list_splat: 1 field(s)
			list_splat: {},

			// member_type: 2 field(s)
			member_type: {
				0: field('base_type') // type [struct=0]
			},

			// relative_import: 2 field(s)
			relative_import: {},

			// slice: 3 field(s)
			slice: {
				0: field('start'), // expression [struct=0]
				2: field('stop'), // expression [struct=1]
				3: field('step') // expression [struct=2]
			},

			// splat_pattern: 1 field(s)
			splat_pattern: {
				0: field('identifier') // identifier [struct=0]
			},

			// splat_type: 1 field(s)
			splat_type: {
				0: field('identifier') // identifier [struct=0]
			},

			// string: 3 field(s)
			string: {
				1: field('content') // interpolation | string_content [struct=1]
			},

			// type_alias_statement: wrap base position 0 (bare 'type' literal)
			// as field('type') so $fields.type carries the keyword. Without
			// this override, enrich's bare-leading-keyword pass (globally off
			// — rust corpus regresses with it on) leaves the literal
			// unwrapped, and $fields only has left/right. The spec-008-US7
			// regression test (python type_alias_statement collision)
			// assumes the wrapped form.
			type_alias_statement: {
				0: field('type')
			},

			// try_statement: 3 field(s)
			try_statement: {
				3: field('except_clauses') // except_clause [struct=0]
			},

			// union_type: 2 field(s)
			union_type: {
				0: field('left'), // type [struct=0]
				2: field('right') // type [struct=1]
			}
		},
		rules: {}
	})
);
