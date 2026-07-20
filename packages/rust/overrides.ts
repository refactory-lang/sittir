/**
 * overrides.ts — Grammar extension for rust
 *
 * Converted from overrides.json. Each entry wraps an unnamed child
 * at a positional index with a named field.
 *
 * @generated from overrides.json — review before committing
 */
// tree-sitter's ambient DSL (`Rule` / `RuleOrLiteral` / `GrammarSchema` /
// `GrammarSymbols` / `RuleBuilder` + `grammar` / `seq` / `choice` / `prec` /
// `repeat` / `repeat1` / `optional` / `token` / ...) is pulled in via
// `tree-sitter-cli/dsl.d.ts` in tsconfig.overrides.json `types` — NOT a
// `/// <reference>` directive (that fails TS2688 under this rootDir).
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

import { transform, enrich, field, alias, variant, wire } from '../codegen/src/dsl/dsl-authoring.ts';
import type { RustGrammarShape } from '../codegen/src/grammar-shapes/grammar-shape.rust.ts';
import type { EnrichedGrammar } from '../codegen/src/dsl/enrich.ts';

// `string` is the ONE DSL primitive with no ambient/exported declaration: it
// is a runtime global injected by tree-sitter's `grammar()`, used solely
// inside the `renderAs` callback below. All other DSL fns (`seq` / `choice` /
// `prec` / `repeat` / `repeat1` / `optional` / `token` / `grammar`) are
// tree-sitter ambient now (see the `types` note above) — no stubs needed.
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
// The `@ts-expect-error` below is the one designated suppression point
// (per the file header): `enrich()` returns sittir's `GrammarResult`
// (`{grammar: {…}}`) which wire's base-extraction handles at runtime, but
// its static type doesn't match tree-sitter's flat `GrammarSchema` — so
// `grammar(enrichedBase, …)`'s first arg is rejected. The directive keeps
// this honest (it fails if the mismatch ever resolves) rather than a
// silent cast. (The separate `conflicts`/`SymbolRule` errors inside the wire
// payload are pre-existing and unrelated to this seam.)
// @ts-expect-error — GrammarResult ({grammar:{rules}}) vs tree-sitter's flat GrammarSchema; runtime-handled by wire's base extraction.
export default grammar(
	enrichedBase,
	wire<EnrichedGrammar<RustGrammarShape>>(
		{
			name: 'rust',
			// `previous` is the base grammar's conflicts list — concat so we
			// don't drop the base entries (`$._type`, `$._pattern`, etc.).
			conflicts: ($, previous) => [
				...(previous ?? []),
				// match_arm split: the `seq(expr, ',')` vs block-ending variants
				// expose a shared-prefix conflict with other expression
				// contexts when the parser sees `… => if_expr (`.
				[$._expression_except_range, $._match_arm_block_ending],
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
				// impl_item — converted to a full rules: replacement (de-polymorph).
				// Was: impl_item: { '6/0': 'body', '6/1': 'semi' },
				macro_definition: { '2/0': 'paren', '2/1': 'bracket', '2/2': 'brace' },
				mod_item: { '3/0': 'external', '3/1': 'inline' },
				or_pattern: { '0': 'binary', '1': 'prefix' },
				range_expression: {
					'0': 'binary',
					'1': 'postfix',
					'2': 'prefix',
					'3': 'bare'
				},
				// range_pattern: the base rule is
				//   choice(
				//     seq(field('left', X), choice(             ← 0
				//       seq(enum('...', '..=', '..'), field('right', X)),  ← 0/1/0 "left_with_right"
				//       '..',                                               ← 0/1/1 "left_bare"
				//     )),
				//     seq(enum, field('right', X)),             ← 1 "prefix"
				//   )
				// Flatten the adoption so the inner-choice arms get their own
				// variant names — the asymmetry (`..=`/`...` require a right,
				// bare `..` doesn't) means these are genuine structural variants.
				range_pattern: {
					'0/1/0': 'left_with_right',
					'0/1/1': 'left_bare',
					'1': 'prefix'
				},
				struct_item: { '4/0': 'brace', '4/1': 'tuple', '4/2': 'unit' },
				// visibility_modifier — three variants at two nesting depths,
				// all addressed from the top-level rule:
				//   - `1/1/0/1/3` in_path
				//                     → `visibility_modifier_in_path`
				//     (inside the pub arm's `seq('(', choice(self, super,
				//     crate, seq('in', _path)), ')')` — the `seq('in', _path)`
				//     branch). Without this split the inner choice is
				//     heterogeneous and the shape classifier throws
				//     `'seq-member-optional-wrapping-choice-needs-variant-or-merge'`.
				//   - `0` crate       → `visibility_modifier_crate`
				//   - `1` pub         → `visibility_modifier_pub`
				//
				// Order matters: variant patches apply in iteration order, and
				// once `'1'` aliases arm 1 into `_visibility_modifier_pub`, the
				// deeper `'1/1/0/1/3'` path can no longer descend into it.
				// Same convention the range_pattern entry above uses — put the
				// deepest paths first.
				visibility_modifier: {
					'1/1/0/1/3': 'in_path',
					'0': 'crate',
					'1': 'pub'
				}
			},
			groups: {
				// visibility_modifier — lift the inner optional(seq('(', choice, ')'))
				// into a synthesized hidden kind (_visibility_modifier_pub_parens) so
				// the polymorph variant's render template naturally references the
				// group via the children slot. Closes bug #3 (`pub()` → `pub`).
				// See: docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md
				_visibility_modifier_pub: {
					'1': 'parens'
				},

				// visibility_modifier_group1's choice is
				// `choice(self, super, crate, seq('in', _path))` — the bare seq arm makes
				// it a STRUCTURAL choice, so emitChoice renders only the first arm and
				// `pub(crate)` drops to `pub ( )`. Lift the seq arm into a named group so
				// the choice becomes all-symbol (canonical) and every arm renders.
				// (Followup: enrich should auto-lift structural choice arms.)
				in_path: ($) => seq('in', $._path),

				// --- body-pattern groups: tree-sitter visible-kind synthesis ---
				// Each function-valued entry below declares a STRUCTURAL PATTERN.
				// Codegen creates `_<key>` as the hidden rule body and rewrites every
				// matching sub-tree as `alias($._<key>, $.<key>)` so tree-sitter emits
				// the visible kind as a CST node. Without alias, tree-sitter inlines
				// the hidden `_*` rule and the kind never appears at runtime — the
				// transport-side slot remains permanently empty.

				// Pattern: attribute_item(s) attached to a struct field.
				// Used inline at every comma-separated position in
				// field_declaration_list. Without this lift, the parent's $children
				// flattens to alternating attribute_item / field_declaration entries
				// joined by commas (e.g. `#[attr],y: i32` instead of `#[attr] y: i32`).
				attributed_field_declaration: ($) => seq(repeat($.attribute_item), $.field_declaration),

				// Pattern: attribute_item(s) attached to an enum variant.
				// enum_variant_list uses SEQ(REPEAT(attribute_item), enum_variant)
				// inline at every comma-separated position.
				attributed_enum_variant: ($) => seq(repeat($.attribute_item), $.enum_variant),

				// Pattern: optional attribute_item attached to a function parameter.
				// parameters uses SEQ(CHOICE(attribute_item, BLANK), CHOICE(...)).
				// The sittir IR normalizes CHOICE(x, BLANK) to optional(x).
				// Members: parameter | self_parameter | variadic_parameter |
				// '_' wildcard | _type (anonymous type).
				attributed_parameter: ($) =>
					seq(optional($.attribute_item), choice($.parameter, $.self_parameter, $.variadic_parameter, '_', $._type)),

				// Pattern: attribute_item(s) attached to a type parameter.
				// type_parameters uses SEQ(REPEAT(attribute_item), CHOICE(metavariable,
				// type_parameter, lifetime_parameter, const_parameter)) inline at every
				// comma-separated position.
				attributed_type_parameter: ($) =>
					seq(
						repeat($.attribute_item),
						choice($.metavariable, $.type_parameter, $.lifetime_parameter, $.const_parameter)
					),

				// arguments: each call arg is seq(repeat(attribute_item), _expression).
				// Synthesize a visible `attributed_argument` kind (mirrors
				// attributed_parameter / attributed_type_parameter) so the arg list
				// renders `attributed_argument` items. Replaces the transforms:
				// field('attributes') collision-patch, which named the attribute but
				// left `_expression` (the actual args) as an empty `$children` slot.
				// NOTE: the same `seq(repeat(attribute_item), _expression)` pattern
				// also appears in array_expression's element list — the body-pattern
				// replacement aliases BOTH sites to `attributed_argument` (call args
				// and array elements share the same structural unit). The array_expression
				// transform `{ '2/(_expression)': field('elements') }` is removed so the
				// elements stay in the bare seq form that this pattern can match.
				attributed_argument: ($) => seq(repeat($.attribute_item), $._expression),

				// ordered_field_declaration_list: each comma-separated position is
				// seq(repeat(attribute_item), optional(visibility_modifier), field('type', _type)).
				// Without this lift the parent's $children flattens to alternating
				// attribute_item / visibility_modifier / _type entries joined by commas
				// (e.g. `#[attr] pub i32` as three siblings instead of one unit).
				// Mirrors attributed_field_declaration (the brace-form `field_declaration_list`
				// sibling). A multi-slot repeated unit must be a visible node so the flat
				// parse can be reconstructed; this is step 1 of making multiplicity intrinsic.
				attributed_ordered_field: ($) =>
					seq(repeat($.attribute_item), optional($.visibility_modifier), field('type', $._type)),

				// type_arguments: each comma-separated position after the first is
				// seq(choice(_type, type_binding, lifetime, _literal, block), optional(trait_bounds)).
				// The inner seq is a 2-slot unit (element type + optional bounds) that
				// auto-group synthesis lifts into `_type_arguments_repeat1` (inline).
				// Without a visible group the slot-grouping diagnostic fires and the
				// parent template fragments (type + bounds appear as separate flat slots).
				// `type_argument` makes the repeating unit a first-class visible kind so
				// `type_arguments` renders `<{{ type_argument | joinWithTrailing(",") }}>`.
				//
				// Conflict: choice($._type, ...) can begin with `metavariable` (same as
				// `_attributed_type_parameter`); declare the conflict to allow tree-sitter
				// to use lookahead.
				type_argument: ($) =>
					seq(choice($._type, $.type_binding, $.lifetime, $._literal, $.block), optional($.trait_bounds)),

				// match_block: optional(seq(repeat(match_arm), alias(last_match_arm, match_arm))).
				// _match_block_optional1 is a two-slot inline seq (match_arm[] + last_arm field).
				// Without this group the template gates both arms on `{% if match_arm | isPresent %}`
				// — wrong for a single-arm match (last_arm present, match_arm absent). The visible
				// group collapses the parent optional to one slot so each slot renders independently.
				// The `field('last_arm', ...)` must be included in the body so the pattern matches
				// the post-transform sub-tree (the transforms: entry adds the field wrapper first).
				// Fixes Copilot PR review comments #1–#3 (template gating + render order).
				match_block_arms: ($) => seq(repeat($.match_arm), field('last_arm', alias($.last_match_arm, $.match_arm)))
			},
			transforms: {
				// token_repetition: `$( _tokens* ) <sep>? <op>` —
				//   seq('$'[0], '('[1], repeat(_tokens)[2], ')'[3],
				//       optional(pattern '[^+*?]+')[4], enum('+'|'*'|'?')[5]).
				// The optional separator pattern (pos 4) and repetition operator enum
				// (pos 5) are both unnamed nonterminal slots → both fall back to `content`,
				// colliding on `_content` (the double `{{ content }}` in the template).
				// Name them so each gets its own slot.
				token_repetition: {
					4: field('separator'),
					5: field('operator')
				},

				// token_repetition_pattern: same shape as token_repetition — the optional
				// separator pattern (pos 4) and the repetition operator enum (pos 5) are
				// both unnamed → 2 `content` slots. Name them.
				token_repetition_pattern: {
					4: field('separator'),
					5: field('operator')
				},

				// field_initializer_list: name the naked initializers choice (was an
				// unresolvable `content` slot).
				field_initializer_list: {
					1: field('initializers')
				},

				// tuple_pattern: name the naked elements choice (was an unresolvable
				// `content` slot).
				tuple_pattern: {
					1: field('elements')
				},

				// Naked-choice field names (was unresolvable `content` slots).
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

				// match_block: seq('{', optional(seq(repeat(match_arm),
				//   alias(last_match_arm, match_arm))), '}').
				// The trailing `alias($.last_match_arm, $.match_arm)` is a SECOND unnamed
				// positional child alongside the `repeat(match_arm)` array — BOTH surface as
				// kind `match_arm`, so the slot model can't distinguish them by kind (the
				// "multiple unnamed children in sequence" case). Field the trailing arm so it
				// routes to a distinct NAMED slot instead of colliding with the array. Path:
				// member 1 (optional) → its content seq → member 1 (the alias).
				match_block: {
					'1/0/1': field('last_arm')
				},

				// async_block: seq('async', optional('move'), $.block).
				// Field-promotion wave 1 (016 task #23): label the standalone
				// optional `move` punct as `move_marker` so render preserves it
				// (`async move { ... }` vs `async { ... }`). Naming follows the
				// `<token>_marker` convention enrich uses for auto-promotion
				// (016 task #30); kept hand-promoted because the hand-emitted
				// template renders without the spacing that auto-promotion
				// introduces (the `async move {}` parity fixture round-trips
				// only with this entry).
				async_block: {
					'1/0': field('move_marker')
				},

				// array_expression polymorph splits '2/0' (semi) / '2/1' (list).
				// Only the outer `repeat($.attribute_item)` at pos 1 needs a field
				// label (the header attributes). The per-element label is no longer
				// needed — the `attributed_array_element` visible group (see groups:
				// above) now carries each element's attribute_item(s) + _expression
				// pair as a self-contained unit, exactly as `attributed_argument`
				// does for call arguments.
				array_expression: [{ 1: field('attributes') }],

				// arguments: handled by the `attributed_argument` body-pattern group
				// (see groups: above) — each call arg is synthesized as a visible
				// `attributed_argument` kind, like `attributed_parameter`.

				// attribute: seq(_path, optional(choice(seq('=', field('value',
				// _expression)), field('arguments', delim_token_tree)))).
				// storageName collision: _path (pos 0) and the optional choice
				// (pos 1) both infer storageName='children'. Promote the path at
				// pos 0 to a named field; the expression/arguments side already
				// has inner field() wrappers and stays as $children.
				attribute: {
					0: field('path')
				},

				// block: seq(optional(seq(field('label', label), ':')), '{',
				// repeat(_statement), optional(_expression), '}').
				// storageName collision: repeat(_statement) at pos 2 and
				// optional(_expression) at pos 3 both infer storageName='children'.
				// Promote the trailing expression to a named field; statements stay
				// as $children.
				block: {
					3: field('trailing_expression')
				},

				// bounded_type: 2 field(s)
				bounded_type: {
					0: field('left'), // lifetime | _type | use_bounds [struct=0]
					2: field('right') // lifetime | _type | use_bounds [struct=1]
				},

				// closure_expression: prec(closure, seq(
				//   optional('static'),  // pos 0  →  '0/0' = bare 'static'
				//   optional('async'),   // pos 1  →  '1/0' = bare 'async'
				//   optional('move'),    // pos 2  →  '2/0' = bare 'move'
				//   field('parameters', ...),  // pos 3
				//   choice(...),               // pos 4 — polymorph split block/expr
				// ))
				// Field-promotion wave 1 (016 task #23) + wave-1 follow-up (task
				// #27): label each standalone optional marker so render preserves
				// them (`static async move |x| ...` vs `|x| ...`). Naming follows
				// the `<token>_marker` convention enrich uses for auto-promoted
				// sites (016 task #30).
				//
				// 016 task #35: enrich's optional-keyword pass now descends through
				// `prec(...)` wrappers — but ONLY at the in-memory codegen surface
				// (types.ts, factories.ts). The tree-sitter-cli `grammar.json`
				// generation receives base rules as callbacks BEFORE evaluation,
				// so enrich's modifications don't reach the synthesized `_kw_*`
				// hidden rules / FIELD wrappers in grammar.json. Removing this
				// override leaves the parser emitting bare anon `static`/`async`/
				// `move` tokens; readNode promotes them to `$fields.<bare-text>`
				// (not `$fields.<text>_marker`), the generated `.jinja` template
				// references the `_marker` keys → render drops them → round-trip
				// regresses. Keep this entry until enrich runs on tree-sitter-cli's
				// post-evaluation rule shape too (deferred).
				// The `_kw_async_marker` inline declaration above (wave-1
				// follow-up, task #27) is required to keep `let a = async move
				// || async move {}` from regressing to ERROR.
				closure_expression: {
					'0/0': field('static_marker'),
					'1/0': field('async_marker'),
					'2/0': field('move_marker')
				},

				// extern_modifier: 1 field(s)
				extern_modifier: {},

				// function_modifiers — base is
				//   repeat1(choice('async', 'default', 'const', 'unsafe', $.extern_modifier))
				// Wrap the inner choice (path `0` = repeat1's content) with a single
				// `field('modifier')`. Tree-sitter then reports the per-arm token
				// union in node-types.json under `function_modifiers.fields.modifier`,
				// which lets sittir surface the modifier set as an enum / bitflag
				// (ADR-0012) rather than dropping the anonymous arms from $children.
				function_modifiers: {
					// Wildcard `_` forces path-mode (a pure numeric key `0`
					// would trigger flat-mode, which descends into each choice
					// arm individually rather than wrapping the whole choice).
					// At a single-content wrapper (REPEAT1), wildcard means
					// "descend into the content and patch there" — equivalent
					// to `field('modifier', <inner choice>)`.
					//
					// TODO(ADR-0012 bitflag): the resulting type
					//   `modifier: NonEmptyArray<"async" | "default" | "const" |
					//    "unsafe" | ExternModifier>`
					// is correctly enum-shaped but each modifier is genuinely
					// mutually-exclusive and set-like (order doesn't matter,
					// duplicates aren't meaningful). This ought to surface as a
					// Bitflag<FunctionMod, …> brand so the Config / Loose surface
					// projects to a flags enum instead of an array. Deferred —
					// needs bitflag detection in the walker for the repeat1+field
					// combination, not just seq-positioned boolean-keyword slots.
					_: field('modifier')
				},

				// visibility_modifier — replaces the hand-authored rule below
				// that wrapped bare keywords in `_kw_pub` / `_kw_in` hidden
				// SYMBOLs so FIELD would survive tree-sitter normalization.
				// The one-arg `field('pub')` / `field('in')` placeholders land
				// on bare STRINGs; `maybeKeywordSymbol` (dsl/primitives/field.ts)
				// auto-synthesizes `_kw_pub` / `_kw_in` hidden rules and swaps
				// each STRING for a SYMBOL ref — same net effect, zero hand-
				// authored rule body.
				//
				// Base shape:
				//   choice(
				//     $.crate,                                 ← 0
				//     seq(                                     ← 1
				//       'pub',                                 ← 1/0        ← field('pub')
				//       optional(seq(                          ← 1/1
				//         '(',                                 ← 1/1/0/0
				//         choice(                              ← 1/1/0/1
				//           $.self,                            ← 1/1/0/1/0
				//           $.super,                          ← 1/1/0/1/1
				//           $.crate,                          ← 1/1/0/1/2
				//           seq(                              ← 1/1/0/1/3
				//             'in',                           ← 1/1/0/1/3/0 ← field('in')
				//             $._path,                        ← 1/1/0/1/3/1
				//           ),
				//         ),
				//         ')',                                 ← 1/1/0/2
				//       )),
				//     ),
				//   )
				visibility_modifier: {
					'1/0': field('pub'),
					'1/1/0/1/3/0': field('in')
				},

				// function_type: top-level seq is
				//   [for_lifetimes, prec(call, seq(choice(trait, fn_form), parameters)),
				//    optional(->return_type)]
				// The choice at position 1 inner-seq[0] chooses between trait form
				// (bare type with field('trait', ...)) and fn form (seq with
				// optional modifiers + 'fn' literal). Template walker drops the
				// 'fn' literal because it's only in one arm. Polymorph-split each
				// arm. prec is transparent to path addressing, so path `1/0` is
				// the choice inside.
				function_type: [],

				// gen_block: seq('gen', optional('move'), $.block).
				// Field-promotion wave 1 (016 task #23): symmetric to async_block
				// — label the optional `move` punct as `move_marker` so render
				// preserves it. Kept hand-promoted for the same render-spacing
				// reason as async_block (see note above).
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

				// index_expression: 2 field(s)
				index_expression: {
					0: field('object'), // _expression [struct=0]
					2: field('index') // _expression [struct=1]
				},

				// macro_invocation: 1 field(s)
				macro_invocation: {
					2: field('token_tree') // token_tree [struct=0]
				},

				// mod_item: two forms — `mod name;` (external) vs `mod name { ... }`
				// (inline). Polymorph-split so each form's template emits the
				// right terminator (trailing `;` vs `{...}` body).
				mod_item: [],

				// negative_literal: 2 field(s)
				negative_literal: {
					1: field('value') // integer_literal | float_literal [struct=0]
				},

				// ordered_field_declaration_list: 1 field(s)
				// The original override had position 2 for `visibility_modifier`
				// targeting `optional(',')` (trailing comma). After evaluate's
				// `absorbTrailingSeparator` collapses the trailing comma into the
				// repeat's `trailing: true` flag, position 2 becomes `)` — wrong.
				// Also `visibility_modifier` is inside the per-element seq, not at
				// the outer level, so the position 2 override was structurally
				// incorrect. Only wrapping position 1 (the per-element group).
				ordered_field_declaration_list: {
					1: field('attributes') // per-element group [struct=0]
				},

				// or_pattern polymorph splits '0' (binary) / '1' (prefix).
				// Field labels land on base-shape choice arms pre-alias.
				or_pattern: {
					'0/0': field('left'),
					'0/2': field('right'),
					'1/1': field('right')
				},

				// pointer_type: position 1 is `choice('const', $.mutable_specifier)`.
				// Wrapping the choice as `field('mutable_specifier')` makes BOTH
				// the `const` string and the `mutable_specifier` symbol route to
				// the named slot at readNode time, so the template can emit the
				// actual qualifier text instead of hardcoding "const".
				pointer_type: {
					'1/0': variant('const'),
					'1/1': variant('mut')
				},

				// raw_string_literal: 3 field(s)
				raw_string_literal: {
					0: field('raw_string_literal_start'), //  [struct=0]
					1: field('string_content'), // string_content [struct=1]
					2: field('raw_string_literal_end') //  [struct=2]
				},

				// range_expression polymorph splits '0'..'3'. Field labels
				// land on base-shape choice arms pre-alias.
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

				// reference_pattern: 2 field(s)
				reference_pattern: {
					2: field('pattern') // _pattern [struct=1]
				},

				// reference_type: 2 field(s)
				reference_type: {},

				// self_parameter: canonical tree-sitter-rust has no fields here;
				// labels below are ours. `&` is the lifetime marker (pos 0,
				// routed through _kw_lifetime so FIELD survives). `$.lifetime`
				// at pos 1 is the explicit lifetime name ('a etc.) — distinct
				// name to avoid colliding with pos 0's label.
				self_parameter: {
					0: field('reference') // optional('&')
				},

				// shorthand_field_initializer: 2 field(s)
				shorthand_field_initializer: {
					0: field('attributes') // attribute_item [struct=0]
					// pos 1 $.identifier auto-labelled by enrich pass 1
				},

				// source_file: 2 field(s)
				source_file: {
					1: field('statements') // _statement [struct=1]
				},

				// static_item: 2 field(s)
				static_item: {
					2: field('mutable_specifier') // mutable_specifier [struct=1]
				},

				// struct_item: three body shapes — brace (`{ ... }`), tuple
				// (`(...)` + `;`), unit (`;`). Polymorph-split each into a visible
				// variant so the trailing `;` on tuple/unit forms gets rendered
				// (the flat template dropped it because `;` is an anonymous
				// token not routed to any field).

				// trait_item: seq(
				//   optional($.visibility_modifier),  // pos 0
				//   optional('unsafe'),                // pos 1  →  '1/0' = bare 'unsafe'
				//   'trait', ...
				// )
				// Field-promotion wave 1 (016 task #23): label the standalone
				// optional `unsafe` punct as `unsafe_marker` so render preserves
				// it (`unsafe trait Foo { ... }` vs `trait Foo { ... }`). Kept
				// hand-promoted for the same render-spacing reason as async_block
				// (see note above).
				trait_item: {
					'1/0': field('unsafe_marker')
				},

				// try_block: 1 field(s)
				// try_expression: 2 field(s)
				try_expression: {
					0: field('value') // _expression [struct=0]
				},

				// tuple_expression: flat list of expressions comma-separated.
				// Kind-match labels every `_expression` as `elements` without
				// capturing the `,` separators (same pattern as array_expression).
				tuple_expression: {
					1: field('attributes'),
					'(_expression)': field('elements')
				},

				// tuple_type: seq('(', sepBy1(',', $._type), optional(','), ')').
				// sepBy1 expands to seq($._type, repeat(seq(',', $._type))).
				// read_node routes unfielded _type children by concrete kind
				// (primitive_type, type_identifier, …) into separate supertype
				// buckets — losing CST order and reversing the tuple element list.
				// Kind-match wraps EVERY $._type occurrence with the same 'type'
				// field name so read_node collapses them into one ordered slot.
				// Uses transforms: (not rules:) so the parse is unchanged.
				tuple_type: {
					'(_type)': field('type')
				},

				// type_item: 3 field(s)
				type_item: {
					4: field('where_clause'), // where_clause [struct=1]
					7: field('trailing_where_clause') // where_clause [struct=2]
				},

				// type_parameters: handled by `attributed_type_parameter` body-
				// pattern in `groups:`. The parser conflict with `_type` (both
				// begin with metavariable) is declared in `conflicts:` above.
				// No override-side field-promotion needed.

				// unary_expression — label both the operator token (pos 0) and
				// the operand expression (pos 1). overrides.json promotes both
				// to fields at readNode time; the walker needs matching IR
				// fields so the template emits `$OPERATOR$OPERAND` instead of
				// `$OPERATOR $$$CHILDREN` (which reads empty after field promotion).
				unary_expression: {
					0: field('operator'), // choice('-', '*', '!')
					1: field('operand') // $._expression
				},

				// use_wildcard — manually re-authored in `rules:` below as a VISIBLE
				// (non-inlined) clause group `_use_wildcard_clause`, so it has a real
				// presence slot to gate the co-mandatory `::` (the enrich auto-hoist
				// inlined it, losing presence → `::*`). See rules: use_wildcard.

				// variadic_parameter: 1 field(s)
				variadic_parameter: {},

				// expression_statement: choice(seq(_expression, ';'),
				//                              prec(1, _expression_ending_with_block)).
				// Heterogeneous — the ';'-terminated form and the block-ending
				// form have structurally distinct templates. Each becomes its
				// own variant child kind.
				expression_statement: {
					0: variant('with_semi'),
					1: variant('block_ending')
				},

				// foreign_mod_item: choice at pos 2 between ';' (bare extern
				// decl) and field('body', declaration_list) (block extern).
				// Variant-adopt so each arm owns its own template.
				foreign_mod_item: {
					'2/0': variant('semi'),
					'2/1': variant('body')
				},

				// match_arm: seq(repeat(choice(attribute_item, inner_attribute_item)),
				//   field('pattern', match_pattern), '=>', choice(...)).
				// storageName collision in synthesized form kinds: the
				// repeat(choice(attribute_item, inner_attribute_item)) at pos 0 and
				// the variant symbol at pos 3 both infer storageName='children'.
				// Promote attribute_item to named field; the variant child stays as
				// $children. Field patch (flat mode) runs before variant patches
				// (path mode) via array-of-patch-sets.
				match_arm: [{ 0: field('attributes') }, { '3/0': variant('with_comma'), '3/1': variant('block_ending') }],

				// line_comment: choice at pos 1 between regular double-slash,
				// doc-comment, and regular content. Each arm has its own
				// distinct literal prefix.
				line_comment: {
					'1/0': variant('regular_dslash'),
					'1/1': variant('doc'),
					'1/2': variant('content')
				},

				// token_tree_pattern / token_tree / delim_token_tree: each is
				// choice(seq('(', repeat(inner), ')'), seq('[', ..., ']'), seq('{', ..., '}')).
				// Three delimiter-variants — distinct opening/closing literals per
				// arm, same inner content. Split so each arm owns its template.
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
				// _token_tree_punctuation — the punctuation choice previously
				// inline at _non_special_token's position 7 (TOKEN_TREE_NON_SPECIAL_PUNCTUATION
				// from the base grammar, copied verbatim). `alias('token_tree_punctuation')`
				// below is the one-arg placeholder form; despite its own doc
				// comment ("resolvePatch fills it in with the original content at
				// the patch target"), confirmed via packages/rust/.sittir/src/grammar.json
				// that pre-declaring this rule makes THIS declaration's body the
				// real compiled content — the "auto-fill from original" behavior
				// does not apply once a same-named rule already exists. (An
				// earlier attempt left this as a placeholder-only sentinel
				// matching a single literal; that silently replaced all 41
				// punctuation literals with just that one character, turning the
				// comma into a genuine parse error — caught by checking the
				// compiled grammar.json directly, not by trusting the doc comment.)
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

				// _non_special_token — the punctuation run inside a token tree (`,`,
				// `::`, `->`, etc.) is a bare anonymous choice/repeat1 arm (position
				// 7 of 37): tree-sitter never names it, so readNode routes it to
				// $other and it never reaches _delim_tokens/_tokens — punctuation
				// between token-tree elements (e.g. the comma in `m!("hi", x)`) is
				// silently lost on render (docs/KNOWN_ISSUES.md, "Rust token_tree/
				// delim_token_tree's comma..."). Replace the WHOLE
				// prec.right(repeat1(choice(...))) arm with a bare aliased choice —
				// no repeat of our own. Two earlier shapes were tried and reverted:
				// (a) `7/0` — alias just the inner choice, leaving prec.right/
				// repeat1 wrapping it. Grammar-compiled fine but created a genuine
				// nested-repeat ambiguity (this rule's own repeat1 vs the outer
				// `_delim_tokens`/`_tokens` repeat one level up, both able to
				// absorb a run of consecutive punctuation) — needed `conflicts:`
				// entries to even generate, and even then the native read layer
				// materialized `token_tree_punctuation` as its own singular field
				// instead of folding it into `_delim_tokens`'s array (confirmed via
				// probe-kind + a full clean rebuild of every crate, including
				// sittir-core, ruling out staleness). (b) `7/0/0` — one segment too
				// many, silently aliased only the choice's FIRST member ('+')
				// instead of the whole choice (confirmed via grammar.json). This
				// shape sidesteps both: no inner repeat means no nested-repeat
				// ambiguity, and the outer `_delim_tokens`/`_tokens` repeat alone
				// produces one `token_tree_punctuation` array element per
				// consecutive punctuation token, matching how every other element
				// already reaches that array. Negative index (`-30` = position 7 of
				// 37 members) is required for `alias(...)` as a patch value to
				// compile — see `applyToIndexedMember`'s negative-index convention
				// and `transform()`'s flat-vs-path-mode dispatch in
				// packages/codegen/src/dsl/transform/transform.ts.
				_non_special_token: ($, original) =>
					transform(original, {
						'-30': alias('token_tree_punctuation')
					}),

				// use_wildcard — re-authored as a VISIBLE clause group. Base was the
				// double-optional `seq(optional(seq(optional($._path), '::')), '*')`, which
				// (once detectClause is gone) the enrich auto-hoist inlines into a presence-
				// less group → renders `::*`. Here the `path ::` prefix is a hidden but
				// NON-inlined group `_use_wildcard_clause` with a single mandatory `path`
				// field: as a real node it carries a populated presence slot, so the parent
				// gates the whole prefix (incl. `::`) by the clause's presence → `path::*`
				// or `*`. (Drops the ~invalid bare-path `use ::*` form, which was never valid.)
				use_wildcard: ($) => seq(optional($._use_wildcard_clause), '*'),
				_use_wildcard_clause: ($) => seq(field('path', $._path), '::'),

				// _where_clause_group1 — enrich's visible-group hoist extracts base
				// where_clause's predicate list (sepBy1(',', where_predicate) +
				// trailing optional ',') into this hidden backing rule. Base
				// tree-sitter-rust resolves the trailing-comma-vs-next-predicate
				// shift/reduce with prec.right ON where_clause; the hoist moves those
				// productions out of that annotation's scope, so restore the same
				// right-associativity on the hoisted body (`where 'a: 'b, 'c: 'd` must
				// shift at `, • '`, not end the group).
				_where_clause_group1: ($, previous) => prec.right(0, previous),

				// Hidden `_kw_*` rules that previously sat here
				// (`_kw_async` / `_kw_default` / `_kw_const` / `_kw_unsafe` /
				// `_kw_pub` / `_kw_in`) have been deleted. They're now
				// auto-synthesized by `maybeKeywordSymbol` (field.ts) whenever
				// the declarative `transforms:` entries above land a one-arg
				// `field('name')` on a bare STRING — see the
				// `function_modifiers` / `visibility_modifier` entries above.
				//
				// _pattern — the wildcard `_` is a bare literal alternative
				// (position 20) of the _pattern supertype choice. At multi-valued
				// list positions (rust `sepBy(',', $._pattern)` used by
				// tuple_struct_pattern, tuple_pattern, slice_pattern, closure
				// parameters) tree-sitter surfaces `_` as an anonymous child,
				// which readNode promotes to $fields['_'] and $$$CHILDREN's
				// named-only filter subsequently drops. Aliasing `_` to a named
				// `wildcard_pattern` kind gives it a proper node in the tree so
				// every `_pattern` list position round-trips cleanly without any
				// render-side heuristics. The hidden `_wildcard_pattern` rule is
				// declared explicitly below so tree-sitter's `ruleMap` snapshot
				// picks it up — no runtime synthesis, no wrapper machinery.
				//
				// Why inline here instead of declarative `transforms:` — the
				// patch value needs `$` (tree-sitter's symbol proxy) at call
				// time. `transforms:` values are evaluated at config-object-
				// literal time, before `$` exists. See ADR-0009 §Task-7.
				_pattern: ($, original) =>
					transform(original, {
						'-1': alias($._wildcard_pattern, $.wildcard_pattern)
					}),

				// The hidden rule `_wildcard_pattern` is just the `_` literal;
				// the named alias on `_pattern` above promotes it to a proper
				// `wildcard_pattern` kind at parse time.
				_wildcard_pattern: ($) => '_',

				// reference_expression — reference-mode is a SINGLE optional choice slot.
				// Each raw arm is a real alias kind that OWNS its `raw` prefix (the
				// co-optional group `seq('raw', discriminator)`), so member-1 is a clean
				// choice-over-kinds and the branch emitters render it faithfully — no
				// forms / $variant / per-form transport. `&` is a bare mandatory literal
				// (NOT a field — fielding it forced the `_kw_reference` LR routing we no
				// longer need). `& mut x` → bare mutable_specifier arm; `& x` → optional
				// absent. raw_const/raw_mut stay real kindId-bearing kinds → factory
				// submethods derive from the choice arms as sugar.
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

				// impl_item — full rule replacement (de-polymorph). The co-optional trait
				// clause is owned by alias'd positive/negative clause kinds so it renders as a
				// unit (no conditional-key-on-sub-optional bug); body/semi arms are alias kinds.
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

				// _let_chain — left-recursive `left && right` chain where each
				// operand independently ranges over {_let_chain, let_condition,
				// _expression} (base grammar has neither operand field-named).
				// Un-fielded, the 5 choice arms' 10 operand positions get
				// kind-derived storageNames ("let_chain"/"let_condition"/
				// "expression") that collide across arms once merged onto this
				// owner kind. Fielding BOTH operands with the SAME name
				// ('left'/'right') across every arm is the "genuinely one
				// combined slot" case: each field stays eligible for the
				// named-slot merge path, collapsing to a single `left` slot and
				// a single `right` slot (each a union of the 3 operand kinds)
				// instead of 3 colliding positional slots. `3` mirrors base
				// tree-sitter-rust's `PREC.and`.
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

			// renderAs — sittir-side rule bodies for external scanner symbols.
			// These bodies are used by sittir's slot/render/factory pipeline ONLY;
			// they are stripped before the grammar reaches tree-sitter (the C
			// external scanner still produces these symbols during parsing).
			//
			// Doc comment markers — sittir-side declarations of the marker character.
			// Tree-sitter's external scanner still produces these tokens; renderAs
			// entries let sittir's render/factory/from pipelines know the literal
			// text without depending on tree-sitter to expose it.
			//
			// Line markers (_outer_line / _inner_line) DO have IMMEDIATE_TOKEN bodies
			// in grammar.json — those are stripped by wire so tree-sitter never sees
			// duplicate rule bodies. Block markers (_outer_block / _inner_block) are
			// pure externals with no grammar body.
			//
			// Rust doc-comment syntax:
			//   ///outer line doc      — outer line marker is '/' (lexer consumes '//' first)
			//   //!inner line doc      — inner line marker is '!'
			//   /**outer block doc*/   — outer block marker is '*'
			//   /*!inner block doc*/   — inner block marker is '!'
			//
			// Raw string literal delimiters — static (1-hash form only).
			// Round-trip will fail for `r##"..."##` etc. Factory-side benefit: no
			// delimiter-count parameter needed.
			renderAs: (_$) => ({
				// Doc comment markers
				_outer_line_doc_comment_marker: string('/'), // /// outer line doc
				_inner_line_doc_comment_marker: string('!'), // //! inner line doc
				_outer_block_doc_comment_marker: string('*'), // /** outer block doc */ (was '!' in MVP — typo)
				_inner_block_doc_comment_marker: string('!'), // /*! inner block doc */
				// Raw string literal delimiters — static (1-hash form only).
				// Round-trip will fail for `r##"..."##` etc. Factory-side
				// benefit: no delimiter-count parameter needed.
				_raw_string_literal_start: string('r#"'),
				_raw_string_literal_end: string('"#')
			})
		},
		enrichedBase
	)
);
