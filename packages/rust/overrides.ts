/**
 * overrides.ts — Grammar extension for rust
 *
 * Converted from overrides.json. Each entry wraps an unnamed child
 * at a positional index with a named field.
 *
 * @generated from overrides.json — review before committing
 */
// tree-sitter's ambient DSL (`Rule` / `RuleOrLiteral` / `GrammarSchema` /
// `GrammarSymbols` / `RuleBuilder` + `seq` / `choice` / `repeat` / `repeat1` /
// `optional` / ...) is pulled in via `tree-sitter-cli/dsl.d.ts` in
// tsconfig.overrides.json `types` — NOT a `/// <reference>` directive (that
// fails TS2688 under this rootDir). `prec` / `token` / `grammar` are NOT
// ambient here: they're imported from dsl-authoring.ts below, which shadows
// (via ordinary lexical scoping) tree-sitter's ambient versions with sittir's
// own AuthoringRule-typed / GrammarResult-typed re-exports of the SAME
// runtime-injected functions (see dsl-authoring.ts for why — `const`-declared
// ambient globals don't merge as overloads across files the way
// `declare function` does, and tree-sitter's `grammar()` expects a flat
// `GrammarSchema` base rather than enrich()'s `{grammar:{…}}` shape).
//
// The wire payload is passed INLINE to `wire<EnrichedGrammar<RustGrammarShape>>(…)`
// at the bottom of the file (see the comment there). The explicit type-arg
// contextually types the literal against `WireConfig<EnrichedGrammar<RustGrammarShape>>`
// — every rule/transform/groups/conflicts callback's `$` is a typed
// `ShapedSymbols` (rule-name autocomplete) instead of an `any`/`unknown` sink,
// and each `previous`/`original` is the precise per-rule post-enrich shape —
// without any explicit `WireConfig` annotation on the payload itself.
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

// `string` is the ONE DSL primitive with no ambient/exported declaration: it
// is a runtime global injected by tree-sitter's `grammar()`, used solely
// inside the `renderAs` callback below. `seq` / `choice` / `repeat` /
// `repeat1` / `optional` are tree-sitter ambient (see the `types` note
// above); `prec` / `token` / `grammar` are imported from dsl-authoring.ts
// instead of ambient — no stubs needed either way.
declare const string: (value: string) => unknown;

// `enrich(base)` is defined BEFORE the wire payload so the inline
// `wire({…}, enrichedBase)` call below can infer `wire`'s `B` type-param
// from `enrichedBase` (typed `EnrichedGrammar<RustGrammarShape>`). That
// inference contextually types the inline config literal against
// `WireConfig<EnrichedGrammar<RustGrammarShape>>` — every rule/transform/
// groups/conflicts callback's `$` is a typed `ShapedSymbols` and each
// `previous`/`original` is the precise per-rule post-enrich shape — with
// NO explicit `WireConfig` annotation. (A separate `const config = {…}`
// would lose this: its callback params would infer as implicit `any`
// because the literal has no contextual type at its declaration site.)
//
// Pass `enrich(base)` to wire so body-pattern groups (function-valued
// entries in `groups:`) can walk base rules and inject pattern-replacing
// passthroughs. Without the base arg, unoverridden base rules bypass
// pattern replacement and tree-sitter never emits the alias()-wrapped
// visible kinds. Evaluating `enrich(base)` twice is intentional and cheap.
const enrichedBase = enrich(base);

// `wire<EnrichedGrammar<RustGrammarShape>>(…)` — the explicit type-arg
// binds `B` to the lazy `EnrichedGrammar<RustGrammarShape>` alias rather
// than letting it reach `WireConfig<B>` as a fresh generic parameter.
// That distinction matters: a generically-parameterized `config:
// WireConfig<B>` forces TS to eagerly instantiate the precise
// `TransformsConfig<B>` mapped-type branch while contextually typing the
// literal, which trips TS2589 ("excessively deep"); the concrete alias
// is evaluated lazily and stays shallow (same as the prior
// `const config: WireConfig<EnrichedGrammar<RustGrammarShape>>`
// annotation did). The type-arg is the ONLY `EnrichedGrammar` reference
// left at a value position — no `WireConfig` annotation, and the inline
// literal is still fully checked + IntelliSense'd against
// `WireConfig<EnrichedGrammar<RustGrammarShape>>` (`$` is a typed
// `ShapedSymbols`, each `previous`/`original` the precise per-rule shape).
//
// `grammar` here is dsl-authoring.ts's own typed re-export of the
// runtime-injected `grammarFn` (its real two-arg contract IS `(base:
// GrammarResult, options: WiredOpts)`), not tree-sitter's ambient
// `GrammarSchema`-based overloads — so `enrichedBase`'s `{grammar:{…}}`
// shape needs no suppression here. (The separate `conflicts`/`SymbolRule`
// errors inside the wire payload are pre-existing and unrelated to this seam.)
export default grammar(
	enrichedBase,
	wire<EnrichedGrammar<RustGrammarShape>>(
		{
			name: 'rust',
			conflicts: ($, previous) => [
				...(previous ?? []),
				// match_arm split: the `seq(expr, ',')` vs block-ending variants
				// expose a shared-prefix conflict with other expression
				// contexts when the parser sees `… => if_expr (`.
				[$._expression_except_range, $._match_arm_block_ending],
				// PR 3 un-inlining: `_path` (a minted visible-group arm source,
				// filtered out of `inline:` so its mint survives to the parser)
				// re-exposes the `for identifier • ::` prefix ambiguity with
				// generic_pattern / generic_type_with_turbofish that inlining
				// previously let the LR table merge — the fork tree-sitter
				// itself suggests.
				[$.generic_type_with_turbofish, $.generic_pattern, $._path],
				// (Removed: `[$._scoped_identifier_group1, $._scoped_type_identifier_group1]`
				// and `[$.scoped_use_list, $._scoped_identifier_group1, $._use_wildcard_clause]`
				// — their mint sources are gone under the `isSupertypeLike`
				// structural mint decline; the names no longer exist.)
				// Pair-only state of the turbofish trio above (`impl identifier
				// • ::` — no generic_pattern in scope there).
				[$.generic_type_with_turbofish, $._path],
				// `struct X ( crate • :: …` — `pub(crate)`-style visibility vs a
				// crate-rooted path in tuple-struct field position.
				[$.visibility_modifier, $._path],
				// PR 3 (2026-07-21 union-slot design): closure_expression's
				// widened choice-arm mint (`_closure_expression_group1`) shares
				// the `closure_parameters block • ';'` prefix with
				// `_expression_except_range` — same class as the match_arm
				// conflict just above.
				[$._expression_except_range, $._closure_expression_group1],
				// visibility_modifier variant extraction: `pub(crate)` vs
				// `crate::foo` share the `crate` prefix.
				[$.scoped_identifier, $.scoped_type_identifier, $._visibility_modifier_crate],
				// visibility_modifier variant extraction: `pub` vs `pub(x)`
				// share the `pub` prefix; parser needs lookahead.
				[$._visibility_modifier_pub],
				// `_attributed_type_parameter` (body-pattern in groups:) and `_type`
				// both can begin with `metavariable` — declare the conflict so
				// tree-sitter uses lookahead instead of failing parser generation.
				[$._attributed_type_parameter, $._type],
				// `_attributed_argument` = seq(repeat(attribute_item), _expression).
				// Since repeat(attribute_item) can be zero, bare `_expression` is a
				// valid `_attributed_argument`. This creates an LR ambiguity in
				// array_expression's list-arm where elements share the same structural
				// unit as call arguments. The conflict declaration allows tree-sitter's
				// GLR mechanism to disambiguate at parse time.
				[$._attributed_argument]
				// NOTE: two conflicts were added here for an earlier shape of the
				// _token_tree_punctuation fix ([$._non_delim_token, ...] and
				// [$._token_pattern, ...], both resolving a nested-repeat ambiguity
				// from wrapping the alias in its own repeat1). Removed — the
				// current shape (rules: below aliases the whole
				// prec.right(repeat1(choice(...))) arm, no repeat of our own) has
				// no inner repeat, so the ambiguity these existed to resolve no
				// longer arises.
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

				// --- body-pattern groups: tree-sitter visible-kind synthesis ---
				// Each function-valued entry below declares a STRUCTURAL PATTERN.
				// Codegen creates `_<key>` as the hidden rule body and rewrites every
				// matching sub-tree as `alias($._<key>, $.<key>)` so tree-sitter emits
				// the visible kind as a CST node. Without alias, tree-sitter inlines
				// the hidden `_*` rule and the kind never appears at runtime — the
				// transport-side slot remains permanently empty.

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
				last_match_arm: {
					0: field('attributes')
				},

				match_block: {
					'1/0/1': field('last_arm')
				},

				async_block: {
					'1/0': field('move_marker')
				},

				array_expression: [{ 1: field('attributes') }],

				// arguments: handled by the `attributed_argument` body-pattern group
				// (see groups: above) — each call arg is synthesized as a visible
				// `attributed_argument` kind, like `attributed_parameter`.

				attribute: {
					0: field('path')
				},

				block: {
					3: field('trailing_expression')
				},

				bounded_type: {
					0: field('left'), // lifetime | _type | use_bounds [struct=0]
					2: field('right') // lifetime | _type | use_bounds [struct=1]
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

				// generic_type: base rule unchanged. ADR-0006 dispatches via
				// drillAs at alias-declared field sites so consumers see source-
				// typed views (`generic_type_with_turbofish` with the turbofish
				// template). Validators walk the wrapped tree, rewrite `$type`
				// to source, and use the `generic_type_with_turbofish` reparse
				// wrapper that accepts turbofish in a scoped-path context.

				// impl_item: field('where_clause') at pos 5 (inferred from 86%
				// agreement across 7 parents), plus polymorph at pos 6 —
				// choice(field('body', declaration_list), ';'). The ';' arm is
				// the trait-signature form (no body), which the template walker
				// drops without a polymorph split.
				//
				// Field-promotion wave 1 (016 task #23):
				//   - pos 0 = `optional('unsafe')` — leading `unsafe` marker on
				//     `unsafe impl` blocks. Path `0/0` descends into the optional
				//     and labels the bare literal as `unsafe_marker` (016 task
				//     #30 naming convention). Kept hand-promoted because enrich's
				//     auto-promotion at this position introduces extra spacing
				//     in the rendered output (`unsafe impl Foo {}` round-trips
				//     only with the manual override).
				//   - pos 3/0/0 = `optional('!')` — the `!` in `impl !Send for X`
				//     (negative trait impl). Path `3/0/0/0` reaches the bare `!`
				//     literal inside the inner-seq's leading optional. The
				//     `negative` name is context-specific (not `bang_marker`).
				// impl_item — field promotion (unsafe_marker, negative) is handled inline in the
				// rules: replacement (de-polymorph). Was:
				// impl_item: { '0/0': field('unsafe_marker'), '3/0/0/0': field('negative') },

				index_expression: {
					0: field('object'), // _expression [struct=0]
					2: field('index') // _expression [struct=1]
				},

				macro_invocation: {
					2: field('token_tree') // token_tree [struct=0]
				},

				mod_item: [],

				negative_literal: {
					1: field('value') // integer_literal | float_literal [struct=0]
				},

				ordered_field_declaration_list: {
					1: field('attributes') // per-element group [struct=0]
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

				raw_string_literal: {
					0: field('raw_string_literal_start'), //  [struct=0]
					1: field('string_content'), // string_content [struct=1]
					2: field('raw_string_literal_end') //  [struct=2]
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

				// reference_expression — full rule replacement in `rules:` below.
				// The reference-mode is a single optional choice slot whose arms are
				// real alias kinds that OWN their full surface (`raw const` / `raw mut`),
				// so `&` stays a bare mandatory literal and `& mut x` / `& x` render
				// correctly with no polymorph/forms machinery. See rules: reference_expression.

				reference_pattern: {
					2: field('pattern') // _pattern [struct=1]
				},

				reference_type: {},

				self_parameter: {
					0: field('reference') // optional('&')
				},

				shorthand_field_initializer: {
					0: field('attributes') // attribute_item [struct=0]
					// pos 1 $.identifier auto-labelled by enrich pass 1
				},

				source_file: {
					1: field('statements') // _statement [struct=1]
				},

				static_item: {
					2: field('mutable_specifier') // mutable_specifier [struct=1]
				},

				// struct_item: three body shapes — brace (`{ ... }`), tuple
				// (`(...)` + `;`), unit (`;`). Polymorph-split each into a visible
				// variant so the trailing `;` on tuple/unit forms gets rendered
				// (the flat template dropped it because `;` is an anonymous
				// token not routed to any field).

				trait_item: {
					'1/0': field('unsafe_marker')
				},

				try_expression: {
					0: field('value') // _expression [struct=0]
				},

				tuple_expression: {
					1: field('attributes'),
					'(_expression)': field('elements')
				},

				tuple_type: {
					'(_type)': field('type')
				},

				type_item: {
					4: field('where_clause'), // where_clause [struct=1]
					7: field('trailing_where_clause') // where_clause [struct=2]
				},

				// type_parameters: handled by `attributed_type_parameter` body-
				// pattern in `groups:`. The parser conflict with `_type` (both
				// begin with metavariable) is declared in `conflicts:` above.
				// No override-side field-promotion needed.

				unary_expression: {
					0: field('operator'), // choice('-', '*', '!')
					1: field('operand') // $._expression
				},

				// use_wildcard — manually re-authored in `rules:` below as a VISIBLE
				// (non-inlined) clause group `_use_wildcard_clause`, so it has a real
				// presence slot to gate the co-mandatory `::` (the enrich auto-hoist
				// inlined it, losing presence → `::*`). See rules: use_wildcard.

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

				// _let_chain: left-recursive `_let_chain && let_condition` vs
				// base `let_condition`. Hidden rule — tree-sitter flattens the
				// recursion at parse time, so variant() adoption would emit
				// unreachable `_let_chain_and` / `_let_chain_base` kinds. The
				// non-canonical audit for this kind reflects the derive walker's
				// view of an inlined helper; it doesn't surface as a user-facing
				// shape. No variant() here — see the `_let_chain` entry in
				// `rules:` below for the storagename-collision fix (field()
				// naming, not variant()).

				// block_comment: deferred. Inner choice at `1/0` branches on
				// doc-marker form vs bare `_block_comment_content`, but the
				// latter is an EXTERNAL token (lexer callback). Variant hoist
				// tries to reference `_block_comment_content` from a generated
				// hidden rule, and tree-sitter rejects it as "used as both an
				// external token and a non-terminal rule." Resolving this
				// needs either conflicts-awareness in the hoist or a
				// merge-branches path that doesn't extract the external-token
				// branch.
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
				_outer_block_doc_comment_marker: string('*'), // /** outer block doc */ (was '!' in MVP — typo)
				_inner_block_doc_comment_marker: string('!'), // /*! inner block doc */
				_raw_string_literal_start: string('r#"'),
				_raw_string_literal_end: string('"#')
			})
		},
		enrichedBase
	)
);
