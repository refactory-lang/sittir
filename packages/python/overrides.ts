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

// Unified composition (matches rust + typescript): bind `enrich(base)` once and
// pass the SAME enriched grammar to both grammar() and wire(), so wire's
// base-dependent passes (auto-group synthesis, body-pattern groups, and the
// enrich-hoisted-clause inline registration) operate on the post-enrich shape.
const enrichedBase = enrich(base);
export default grammar(
	enrichedBase,
	wire(
		{
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
			// EXPERIMENT (see `_except_clause_as` in `rules`). The real fix is enrich
			// auto-hoisting inline-safe groups nested inside variant arms — FOLLOWUP.
			// Inline the hoisted group into tree-sitter so the `as_pattern` LR overlap
			// dissolves exactly as the base grammar resolves it (no extra conflict
			// needed — the `as` is inline in `_except_clause_as` at parse time).
			inline: ($, previous) => [...(previous ?? []), $._except_clause_as_optional1],
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
				// (hoistSharedFieldFromBranchesForChoice) can't fuse them — the
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
			groups: {
				// comparison_operator: each comparator pair is
				// seq(field('operators', choice(...)), primary_expression).
				// Without this lift the parent's $children flattens to alternating
				// operator / primary_expression entries joined in sequence, losing
				// the per-pair grouping needed to render `a < b <= c` correctly.
				// `comparison_operator` is: prec.left(seq(primary_expression,
				//   repeat1(seq(field('operators', choice(...)), primary_expression)))).
				// The inner seq of the repeat1 is the multi-slot repeated unit —
				// a multi-slot repeated unit must be a visible node so the flat
				// parse can be reconstructed. This is step 1 of making multiplicity
				// intrinsic; the first groups: registration in python overrides.
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
				// argument_list: name the naked args choice (was an unresolvable
				// `content` slot). expression | list_splat | dictionary_splat |
				// parenthesized_expression | keyword_argument
				argument_list: {
					1: field('arguments')
				},

				// class_pattern: 2 field(s)
				class_pattern: {
					2: field('arguments') // case_pattern [struct=1]
				},

				// comparison_operator: 2 field(s)
				comparison_operator: {
					0: field('left'), // primary_expression [struct=0]
					1: field('comparators') // primary_expression [struct=1]
				},

				// complex_pattern: real/imaginary (0,1) + the `+`/`-` operator enum (2)
				// and a trailing number choice (3). Positions 2 and 3 are both unnamed
				// → 2 `content` slots; name the operator so the number stays the single
				// sanctioned `content` (base-rule field, complex_pattern is not a polymorph).
				complex_pattern: {
					0: field('real'), // integer | float [struct=0]
					1: field('imaginary'), // integer | float [struct=1]
					2: field('operator') // '+' | '-'
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

				// import_from_statement: 1 field(s)
				import_from_statement: {
					3: field('wildcard_import') // wildcard_import [struct=0]
				},

				// keyword_pattern: 2 field(s)
				keyword_pattern: {
					2: field('simple_pattern') // _simple_pattern | class_pattern | complex_pattern | concatenated_string | dict_pattern | dotted_name | false | float | integer | list_pattern | none | splat_pattern | string | true | tuple_pattern | union_pattern [struct=1]
				},

				// member_type: 2 field(s)
				member_type: {
					0: field('base_type') // type [struct=0]
				},

				// slice: 3 field(s)
				slice: {
					0: field('start'), // expression [struct=0]
					2: field('stop'), // expression [struct=1]
					3: field('step') // expression [struct=2]
				},

				// splat_pattern: 1 field(s)
				splat_pattern: {
					'0': field('operator'), // '*' | '**'
					'1/1': field('identifier') // identifier [struct=0]
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
			rules: {
				primary_expression: ($: any, original: ChoiceRule) => {
					let base = original.members;

					return choice(...base.slice(0, -1), $.list_splat_pattern);
				},
				// EXPERIMENT (manual; real fix = enrich should auto-hoist an inline-safe
				// group nested inside a variant arm). The `except_clause` polymorph split
				// auto-creates `_except_clause_as` = seq(value, optional(seq('as', alias)));
				// enrich does NOT recurse into the variant arm to hoist the inner
				// inline-safe group, so the emitter leaks `as` ungated
				// (`except E:` -> `except E as:`). Redefine it with the inner group
				// explicitly hoisted to `_except_clause_as_optional1` so the emitter
				// inline+gates the `as`.
				_except_clause_as: ($) => seq(field('value', $.expression), optional($._except_clause_as_optional1)),
				_except_clause_as_optional1: ($) => seq('as', field('alias', $.expression)),

				// Track B (separator-as-slot follow-up): _collection_elements/
				// _parameters/_patterns are grammar-authored, standalone hidden
				// rules (not sittir enrich synthesis) carrying genuine optional
				// trailing/leading separator flanks — confirmed live (Task 2).
				// Unlike Track A's enrich-synthesized `_<parent>_group<N>`
				// helpers, there is no enrich pass to hook a visible-promotion
				// alias into; these are pre-existing base-grammar rules referenced
				// directly by their parents (`parameters`/`lambda_parameters` for
				// `_parameters`; `tuple_pattern`/`list_pattern` for `_patterns`;
				// `list`/`set`/`tuple` for `_collection_elements`).
				//
				// IMPORTANT — alias the SYMBOL at each REFERENCE SITE, never the
				// hidden rule's OWN body. An earlier version of this fix redefined
				// each hidden rule's body as `alias(previous, $.visibleName)`
				// (`previous` being the rule's SEQ content, not a symbol).
				// Tree-sitter's `flatten_grammar` doesn't wrap a non-symbol alias
				// in a single container node — it pushes the alias down onto
				// EVERY symbol step of the flattened production. `_parameters`'s
				// production flattens to `[pattern, _patterns_repeat1?, ','?]`-
				// shaped steps, so BOTH the first element and the hidden
				// repeat-continuation helper each individually surfaced as
				// separate `pattern_group`/`parameter_list` nodes — confirmed via
				// probe-kind: `tuple_pattern` on `(a, b)` produced
				// `pattern_group("a")` AND a second `pattern_group(", b")`, while
				// the IR (correctly) expects exactly one value for that singular
				// slot. Track A's already-proven mechanism aliases the SYMBOL at
				// the reference site instead (`alias($._hiddenRule,
				// $.visibleName)`), which produces exactly one container node
				// regardless of the hidden rule's own internal structure
				// (confirmed already working in this codebase: `_list_pattern_
				// group1` is shared across 3 different parent rules, each
				// aliasing the symbol at its own reference site, and correctly
				// produces one node per occurrence). Applying that same pattern
				// here.
				//
				// Naming: `patterns` and `collection_elements` are free (no
				// existing kind by those names in python's grammar). `parameters`
				// is NOT free — python already has a distinct VISIBLE `parameters`
				// kind (`seq('(', optional($._parameters), ')')`, the parenthesized
				// wrapper) — aliasing `_parameters` to `$.parameters` would collide
				// with it. Named the promoted list `parameter_list` instead
				// (verified no existing `parameter_list` kind either).
				//
				// `field()`-wrapping each reference site with the SAME name as
				// the alias target is still required (orthogonal to the body-vs-
				// reference-site fix above): `buildSlot`'s field-name derivation
				// for an unnamed (bare-symbol) reference falls back to the RAW
				// symbol name minus its leading underscore (`_parameters` ->
				// `parameters`), independent of what the referenced symbol
				// resolves to via alias. That diverges from
				// `emitters/templates.ts`'s slot-reference naming for this same
				// position (which follows the ALIAS-RESOLVED render rule's name,
				// `parameter_list`) whenever the alias target differs from the
				// raw symbol's stripped name — confirmed via a real cargo build
				// failure (`ParametersTransport` has no field `parameter_list`).
				// Explicitly field-wrapping each reference with the SAME name as
				// its alias target realigns both derivations and eliminates the
				// divergence, without touching any emitter.
				// NOTE on field(): do NOT field()-wrap these alias references.
				// `link.ts`'s `mintContentAliasKinds` (the pass that actually
				// registers the visible kind from a reference-site alias) only
				// mints when the alias is the IMMEDIATE content of `optional(...)`
				// / a 2-member `CHOICE[x, BLANK]` (`isClauseHoistVisibleGroupAlias`'s
				// `parentIsOptionalSeq` check) — its structural walk treats `field()`
				// as an opaque wrapper (falls through the generic `content` case,
				// which resets `parentIsOptionalSeq` to `false`), so interposing a
				// `field()` between `optional(...)` and the alias silently
				// prevents the mint entirely (confirmed: with field() present, the
				// promoted kinds vanished — `no NodeMap render path`, kind absent
				// from node-model.json5). This also means Bug 1's field()-wrap
				// workaround (from the earlier body-alias mechanism) is no longer
				// needed at all: with the reference resolving THROUGH the alias to
				// the real `parameter_list`/`pattern_group`/`element_list` kind
				// (not the mismatched `_parameters`/`_patterns`/
				// `_collection_elements` hidden name), `buildSlot`'s bare-symbol
				// field-name fallback (strip leading `_`) already produces the
				// SAME name `emitters/templates.ts` derives — no divergence to
				// paper over.
				parameters: ($) => seq('(', optional(alias($._parameters, $.parameter_list)), ')'),
				// `lambda_parameters`'s base definition is the bare symbol
				// `$ => $._parameters` (its whole body IS the reference). Aliasing
				// this reference site too is a deliberate decision, not an
				// oversight: `_parameters`'s separator variability is a property
				// of the RULE, not of which parent references it — leaving this
				// site unaliased would silently revert `lambda_parameters` to the
				// ORIGINAL pre-feature behavior (hidden, AssembledMulti-
				// classified, separator unreachable), defeating this feature for
				// that reference site. (No `optional(...)` needed for the mint
				// here — `parameters`'s reference site above already satisfies
				// `parentIsOptionalSeq` and mints the kind; this site just needs
				// to resolve through the same alias.)
				lambda_parameters: ($) => alias($._parameters, $.parameter_list),
				tuple_pattern: ($) => seq('(', optional(alias($._patterns, $.pattern_group)), ')'),
				list_pattern: ($) => seq('[', optional(alias($._patterns, $.pattern_group)), ']'),
				list: ($) => seq('[', optional(alias($._collection_elements, $.element_list)), ']'),
				// `set`'s reference is MANDATORY (base: `seq('{', $._collection_elements, '}')`,
				// no `optional(...)`) — it can't itself satisfy `parentIsOptionalSeq`,
				// but doesn't need to: `list`/`tuple`'s optional-wrapped references
				// mint the kind; this site just resolves through the same alias.
				set: ($) => seq('{', alias($._collection_elements, $.element_list), '}'),
				tuple: ($) => seq('(', optional(alias($._collection_elements, $.element_list)), ')')
			}
		},
		enrichedBase
	)
);
