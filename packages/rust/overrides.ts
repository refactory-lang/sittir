/**
 * overrides.ts — Grammar extension for rust
 *
 * Converted from overrides.json. Each entry wraps an unnamed child
 * at a positional index with a named field.
 *
 * @generated from overrides.json — review before committing
 */

// grammar.js + tree-sitter's injected global DSL (`grammar`, `$._rule`
// proxy, `seq` / `choice` / `prec` / ...) are intentionally untyped.
// We narrow the @ts-nocheck blast radius by lifting the wire payload
// into a typed `const config: WireConfig<RustGrammar>` — that
// declaration type-checks with kind-name autocomplete + typo
// protection on `polymorphs` / `transforms` / `rules` keys. Only the
// final `grammar(enrich(base), wire(config))` line and the injected
// DSL globals inside rule callbacks need suppression.
import base from '../../node_modules/.pnpm/tree-sitter-rust@0.24.0_tree-sitter@0.22.4/node_modules/tree-sitter-rust/grammar.js';
import { transform, enrich, field, alias, variant, wire } from '../codegen/src/dsl/index.ts';
import type { WireConfig } from '../codegen/src/dsl/index.ts';
import type { RustGrammar } from './src/grammar.ts';

// Injected globals from tree-sitter's grammar() + DSL — declare so the
// typed `config` below can reference `$.<rule>` / `seq(...)` / etc.
// without pulling in an untyped `any` sink.
declare const grammar: (base: unknown, opts: unknown) => unknown;
declare const seq: (...args: unknown[]) => unknown;
declare const choice: (...args: unknown[]) => unknown;
declare const prec: {
	(p: number, r: unknown): unknown;
	left: (p: number, r: unknown) => unknown;
	right: (p: number, r: unknown) => unknown;
};
declare const repeat: (r: unknown) => unknown;
declare const repeat1: (r: unknown) => unknown;
declare const optional: (r: unknown) => unknown;
declare const token: {
	(r: unknown): unknown;
	immediate: (r: unknown) => unknown;
};
declare const string: (value: string) => unknown;

const config: WireConfig<RustGrammar> = {
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
		[$._attributed_type_parameter, $._type]
	],
	polymorphs: {
		array_expression: { '2/0': 'semi', '2/1': 'list' },
		closure_expression: { '4/0': 'block', '4/1': 'expr' },
		field_pattern: { '2/0': 'shorthand', '2/1': 'named' },
		function_type: { '1/0/0': 'trait_form', '1/0/1': 'fn_form' },
		impl_item: { '6/0': 'body', '6/1': 'semi' },
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
			seq(
				optional($.attribute_item),
				choice($.parameter, $.self_parameter, $.variadic_parameter, '_', $._type)
			),

		// Pattern: attribute_item(s) attached to a type parameter.
		// type_parameters uses SEQ(REPEAT(attribute_item), CHOICE(metavariable,
		// type_parameter, lifetime_parameter, const_parameter)) inline at every
		// comma-separated position.
		attributed_type_parameter: ($) =>
			seq(
				repeat($.attribute_item),
				choice($.metavariable, $.type_parameter, $.lifetime_parameter, $.const_parameter)
			)
	},
	transforms: {
		// abstract_type: 1 field(s)
		abstract_type: {},

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
		// These base-shape patches add field labels BEFORE polymorph
		// aliasing — composition-order inversion in wire() lets this
		// flow declaratively instead of inline in rules:.
		array_expression: [{ 1: field('attributes') }, { '2/(_expression)': field('elements') }],

		// arguments: seq('(', repeat(seq(repeat(attribute_item), _expression,
		// optional(','))), ')').
		// storageName collision: repeat(attribute_item) at inner-seq pos 0
		// and _expression at inner-seq pos 1 both infer storageName='children'.
		// Promote attribute_item to named field; expression stays as $children.
		arguments: {
			'1/0': field('attributes')
		},

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
		impl_item: {
			'0/0': field('unsafe_marker'),
			'3/0/0/0': field('negative')
		},

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
			1: field('mutable_specifier')
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

		// reference_expression: 1 field(s)
		reference_expression: {
			1: field('mutable_specifier') // mutable_specifier [struct=0]
		},

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
		struct_item: [],

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

		// use_wildcard: 1 field(s)
		use_wildcard: {
			'0/0/0': field('path') // optional($._path) inside the optional `path ::` prefix; excludes the `::` token
		},

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

		// pointer_type: choice('const', mutable_specifier) at pos 1.
		// Literal 'const' vs symbol → split arms.
		pointer_type: {
			'1/0': variant('const'),
			'1/1': variant('mut')
		},

		// reference_expression: inner choice at path 1/0/1 selects
		// `const` vs `mutable_specifier` inside the `&raw (…) …`
		// form. Same const-vs-mut shape as pointer_type.
		reference_expression: {
			'1/0/1/0': variant('raw_const'),
			'1/0/1/1': variant('raw_mut')
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
		// shape. Leave as-is.

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
		_wildcard_pattern: ($) => '_'
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
		_outer_line_doc_comment_marker: string('/'),   // /// outer line doc
		_inner_line_doc_comment_marker: string('!'),   // //! inner line doc
		_outer_block_doc_comment_marker: string('*'),  // /** outer block doc */ (was '!' in MVP — typo)
		_inner_block_doc_comment_marker: string('!'),  // /*! inner block doc */
		// Raw string literal delimiters — static (1-hash form only).
		// Round-trip will fail for `r##"..."##` etc. Factory-side
		// benefit: no delimiter-count parameter needed.
		_raw_string_literal_start: string('r#"'),
		_raw_string_literal_end: string('"#')
	})
};

// The typed `config` above is validated against WireConfig<RustGrammar>.
// `grammar()` is tree-sitter's injected global (declared at top of file);
// `base` comes from the untyped `grammar.js` import.
//
// Pass `enrich(base)` to wire so body-pattern groups (function-valued
// entries in `groups:`) can walk base rules and inject pattern-replacing
// passthroughs. Without the base arg, unoverridden base rules bypass
// pattern replacement and tree-sitter never emits the alias()-wrapped
// visible kinds. Evaluating `enrich(base)` twice is intentional and cheap.
const enrichedBase = enrich(base);
export default grammar(enrichedBase, wire<RustGrammar>(config, enrichedBase));
