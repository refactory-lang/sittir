# Rust Overrides Glossary

Per-rule reference for `packages/rust/grammar.sittir.ts`: every named rule
override, conflict, and precedence declaration significant enough to need
explanation. Each entry covers what the rule/conflict addresses, why it's
needed (the specific ambiguity or shape mismatch), and what would break if
it were removed.

See [AGENTS.md § Wave-style decomposition before commits](../AGENTS.md) for
the convention this glossary exists to serve — long rationale comments in
`grammar.sittir.ts` move here instead of living inline.

---

### Module preamble — where the DSL globals come from (`packages/rust/grammar.sittir.ts:9`)

Tree-sitter's ambient DSL (`Rule` / `RuleOrLiteral` / `GrammarSchema` /
`GrammarSymbols` / `RuleBuilder` plus `seq` / `choice` / `repeat` / `repeat1` /
`optional` / …) reaches this file through `tree-sitter-cli/dsl.d.ts` listed in
`tsconfig.overrides.json`'s `types`, NOT via a `/// <reference>` directive —
a reference directive fails with TS2688 under this `rootDir`.

`prec` / `token` / `grammar` are deliberately NOT ambient here. They are
imported from `dsl-authoring.ts`, which shadows tree-sitter's ambient versions
through ordinary lexical scoping with sittir's own `AuthoringRule`-typed /
`GrammarResult`-typed re-exports of the SAME runtime-injected functions.
`dsl-authoring.ts` explains why: `const`-declared ambient globals don't merge
as overloads across files the way `declare function` does, and tree-sitter's
`grammar()` expects a flat `GrammarSchema` base rather than `enrich()`'s
`{ grammar: { … } }` shape.

### `string` (`packages/rust/grammar.sittir.ts:26`)

`string` is the ONE DSL primitive with no ambient or exported declaration: it
is a runtime global injected by tree-sitter's `grammar()`, used solely inside
the `renderAs` callback. Everything else is either ambient (see the module
preamble entry above) or imported, so this is the only stub the file needs.

### `enrichedBase` (`packages/rust/grammar.sittir.ts:28`)

Two reasons this is a named binding declared before the wire payload rather
than an inline `enrich(base)` argument.

Type inference: the inline `wire({…}, enrichedBase)` call infers `wire`'s `B`
type-param from `enrichedBase` (typed `EnrichedGrammar<RustGrammarShape>`), and
that inference contextually types the config literal against
`WireConfig<EnrichedGrammar<RustGrammarShape>>` — every rule/transform/groups/
conflicts callback's `$` is a typed `ShapedSymbols`, and each
`previous`/`original` is the precise per-rule post-enrich shape, with no
explicit `WireConfig` annotation anywhere. Hoisting the payload into a separate
`const config = {…}` would lose all of that: its callback params would infer as
implicit `any`, because the literal has no contextual type at its declaration
site.

Behaviour: `wire` needs the enriched base so body-pattern groups (the
function-valued entries in `groups:`) can walk base rules and inject
pattern-replacing passthroughs. Without the base arg, unoverridden base rules
bypass pattern replacement and tree-sitter never emits the `alias()`-wrapped
visible kinds.

### `wire<EnrichedGrammar<RustGrammarShape>>` (`packages/rust/grammar.sittir.ts:32`)

The explicit type-arg binds `B` to the lazy `EnrichedGrammar<RustGrammarShape>`
alias rather than letting it reach `WireConfig<B>` as a fresh generic
parameter. That distinction is load-bearing: a generically-parameterized
`config: WireConfig<B>` forces TS to eagerly instantiate the precise
`PatchesConfig<B>` mapped-type branch while contextually typing the literal,
which trips TS2589 ("excessively deep"). The concrete alias is evaluated lazily
and stays shallow. The type-arg is the only `EnrichedGrammar` reference left at
a value position, and the inline literal is still fully checked against
`WireConfig<EnrichedGrammar<RustGrammarShape>>`.

`grammar` here is `dsl-authoring.ts`'s own typed re-export of the
runtime-injected `grammarFn` — its real two-arg contract is
`(base: GrammarResult, options: WiredOpts)`, not tree-sitter's ambient
`GrammarSchema`-based overloads — so `enrichedBase`'s `{ grammar: { … } }`
shape needs no suppression at this call site.

### `conflicts` (`packages/rust/grammar.sittir.ts:35`)

`previous` is the base grammar's conflicts list — concat so the base entries
(`$._type`, `$._pattern`, etc.) aren't dropped. The sittir-added entries:

- `[_expression_except_range, _match_arm_block_ending]` — the match_arm split
  into `seq(expr, ',')` vs block-ending variants exposes a shared-prefix
  conflict with other expression contexts when the parser sees `… => if_expr (`.
- `[generic_type_with_turbofish, generic_pattern, _path]` — `_path` is a minted
  visible-group arm source, filtered out of `inline:` so its mint survives to
  the parser. Un-inlined it re-exposes the `for identifier ::` prefix ambiguity
  with generic_pattern / generic_type_with_turbofish that inlining previously
  let the LR table merge; this is the fork tree-sitter itself suggests.
- `[generic_type_with_turbofish, _path]` — the pair-only state of the turbofish
  trio above (`impl identifier ::`, where no generic_pattern is in scope).
- `[visibility_modifier, _path]` — `struct X ( crate :: …`: `pub(crate)`-style
  visibility vs a crate-rooted path in tuple-struct field position.
- `[_expression_except_range, _closure_expression_group1]` —
  closure_expression's widened choice-arm mint shares the
  `closure_parameters block ';'` prefix with `_expression_except_range`; same
  class as the match_arm conflict.
- `[scoped_identifier, scoped_type_identifier, _visibility_modifier_crate]` —
  visibility_modifier variant extraction: `pub(crate)` and `crate::foo` share
  the `crate` prefix.
- `[_visibility_modifier_pub]` — variant extraction again: `pub` and `pub(x)`
  share the `pub` prefix, so the parser needs lookahead.
- `[_attributed_type_parameter, _type]` — the `_attributed_type_parameter`
  body-pattern and `_type` can both begin with `metavariable`; declaring the
  conflict makes tree-sitter use lookahead instead of failing parser
  generation.
- `[_attributed_argument]` — `_attributed_argument` is
  `seq(repeat(attribute_item), _expression)`, and since the repeat can be zero
  a bare `_expression` is a valid `_attributed_argument`. That creates an LR
  ambiguity in array_expression's list-arm, where elements share the same
  structural unit as call arguments; the declaration lets GLR disambiguate at
  parse time.

### `patches` — `variant()` arms in the `identifier '::' …` position (`packages/rust/grammar.sittir.ts`)

Widened choice-arm mints that land in Rust's `identifier '::' …` position hit
one of the grammar's most heavily hand-tuned ambiguities: turbofish generics vs
scoped path vs generic pattern vs tree-sitter's OWN internal
`_scoped_type_identifier_group1` auto-naming for an anonymous hidden rule
extracted from `scoped_type_identifier`'s body.

Adding pairwise or grouped `conflicts` entries for this cluster does not
converge — each lookahead context (bare, `for`, `impl`, generic_pattern-adjacent)
needs a DIFFERENT rule combination, which says the ambiguity isn't a fixed
closed set. The technique that works is inlining the mints sittir controls,
dissolving their LR states entirely (the same move used for
`_except_clause_as_optional1`). Union-slot routing survives: inlining
substitutes the RULE's production at its call site and does not touch the alias
wrapping that call site, so each reference still produces its own labeled CST
node.

Under the `isSupertypeLike` structural mint decline these particular mints are
no longer produced, so there is currently nothing here to dissolve — but the
ambiguity cluster and the inlining remedy both remain live if a mint lands in
that position again.

### `impl_item` — no `variant()` split (`packages/rust/grammar.sittir.ts`)

`impl_item` is de-polymorphed: it is expressed as a full `rules:` replacement
instead, because its co-optional trait clause has to render as a unit. See the
`_impl_item_unsafe_marker` entry below.

### `range_pattern` (`packages/rust/grammar.sittir.ts:187`)

```text
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
```

### `visibility_modifier` (`packages/rust/grammar.sittir.ts:204`)

```text
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
```

### `_visibility_modifier_pub` (`packages/rust/grammar.sittir.ts:228`)

```text
				// visibility_modifier — lift the inner optional(seq('(', choice, ')'))
				// into a synthesized hidden kind (_visibility_modifier_pub_parens) so
				// the polymorph variant's render template naturally references the
				// group via the children slot. Closes bug #3 (`pub()` → `pub`).
				// See: docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md
```

### `in_path` (`packages/rust/grammar.sittir.ts:237`)

```text
				// visibility_modifier_group1's choice is
				// `choice(self, super, crate, seq('in', _path))` — the bare seq arm makes
				// it a STRUCTURAL choice, so emitChoice renders only the first arm and
				// `pub(crate)` drops to `pub ( )`. Lift the seq arm into a named group so
				// the choice becomes all-symbol (canonical) and every arm renders.
				// (Followup: enrich should auto-lift structural choice arms.)
```

### `groups` — body-pattern entries (`packages/rust/grammar.sittir.ts`)

Every function-valued entry in `groups:` declares a STRUCTURAL PATTERN rather
than a rule body. Codegen creates `_<key>` as the hidden rule body and rewrites
every matching sub-tree as `alias($._<key>, $.<key>)`, so tree-sitter emits the
visible kind as a real CST node. Without the alias, tree-sitter inlines the
hidden `_*` rule, the kind never appears at runtime, and the transport-side
slot stays permanently empty.

Two positions are covered entirely by this mechanism and therefore have no
`patches:` entry of their own: call arguments (synthesized as the visible
`attributed_argument` kind, mirroring `attributed_parameter`) and
`type_parameters` (via `attributed_type_parameter`, whose `metavariable`
overlap with `_type` is declared in `conflicts:`).

### `attributed_field_declaration` (`packages/rust/grammar.sittir.ts:253`)

```text
				// Pattern: attribute_item(s) attached to a struct field.
				// Used inline at every comma-separated position in
				// field_declaration_list. Without this lift, the parent's $children
				// flattens to alternating attribute_item / field_declaration entries
				// joined by commas (e.g. `#[attr],y: i32` instead of `#[attr] y: i32`).
```

### `attributed_enum_variant` (`packages/rust/grammar.sittir.ts:260`)

```text
				// Pattern: attribute_item(s) attached to an enum variant.
				// enum_variant_list uses SEQ(REPEAT(attribute_item), enum_variant)
				// inline at every comma-separated position.
```

### `attributed_parameter` (`packages/rust/grammar.sittir.ts:265`)

```text
				// Pattern: optional attribute_item attached to a function parameter.
				// parameters uses SEQ(CHOICE(attribute_item, BLANK), CHOICE(...)).
				// The sittir IR normalizes CHOICE(x, BLANK) to optional(x).
				// Members: parameter | self_parameter | variadic_parameter |
				// '_' wildcard | _type (anonymous type).
```

### `attributed_type_parameter` (`packages/rust/grammar.sittir.ts:273`)

```text
				// Pattern: attribute_item(s) attached to a type parameter.
				// type_parameters uses SEQ(REPEAT(attribute_item), CHOICE(metavariable,
				// type_parameter, lifetime_parameter, const_parameter)) inline at every
				// comma-separated position.
```

### `attributed_argument` (`packages/rust/grammar.sittir.ts:283`)

```text
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
```

### `attributed_ordered_field` (`packages/rust/grammar.sittir.ts:297`)

```text
				// ordered_field_declaration_list: each comma-separated position is
				// seq(repeat(attribute_item), optional(visibility_modifier), field('type', _type)).
				// Without this lift the parent's $children flattens to alternating
				// attribute_item / visibility_modifier / _type entries joined by commas
				// (e.g. `#[attr] pub i32` as three siblings instead of one unit).
				// Mirrors attributed_field_declaration (the brace-form `field_declaration_list`
				// sibling). A multi-slot repeated unit must be a visible node so the flat
				// parse can be reconstructed; this is step 1 of making multiplicity intrinsic.
```

### `type_argument` (`packages/rust/grammar.sittir.ts:308`)

```text
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
```

### `match_block_arms` (`packages/rust/grammar.sittir.ts:323`)

```text
				// match_block: optional(seq(repeat(match_arm), alias(last_match_arm, match_arm))).
				// _match_block_optional1 is a two-slot inline seq (match_arm[] + last_arm field).
				// Without this group the template gates both arms on `{% if match_arm | isPresent %}`
				// — wrong for a single-arm match (last_arm present, match_arm absent). The visible
				// group collapses the parent optional to one slot so each slot renders independently.
				// The `field('last_arm', ...)` must be included in the body so the pattern matches
				// the post-transform sub-tree (the transforms: entry adds the field wrapper first).
				// NO alias() around last_match_arm: enrich UN-ALIASES the base's
				// `alias(last_match_arm, match_arm)` to keep parse-kind dispatch injective
				// (both arms surfaced as kind `match_arm`), so the post-enrich sub-tree this
				// pattern must equal holds a plain `$.last_match_arm` ref. The stale alias form
				// silently matched nothing (caught by `body-pattern-zero-match`).
				// Fixes Copilot PR review comments #1–#3 (template gating + render order).
```

### `token_repetition` (`packages/rust/grammar.sittir.ts:339`)

```text
				// token_repetition: `$( _tokens* ) <sep>? <op>` —
				//   seq('$'[0], '('[1], repeat(_tokens)[2], ')'[3],
				//       optional(pattern '[^+*?]+')[4], enum('+'|'*'|'?')[5]).
				// The optional separator pattern (pos 4) and repetition operator enum
				// (pos 5) are both unnamed nonterminal slots → both fall back to `content`,
				// colliding on `_content` (the double `{{ content }}` in the template).
				// Name them so each gets its own slot.
```

### `token_repetition_pattern` (`packages/rust/grammar.sittir.ts:351`)

```text
				// token_repetition_pattern: same shape as token_repetition — the optional
				// separator pattern (pos 4) and the repetition operator enum (pos 5) are
				// both unnamed → 2 `content` slots. Name them.
```

### `field_initializer_list` (`packages/rust/grammar.sittir.ts:359`)

```text
				// field_initializer_list: name the naked initializers choice (was an
				// unresolvable `content` slot).
```

### `tuple_pattern` (`packages/rust/grammar.sittir.ts:365`)

```text
				// tuple_pattern: name the naked elements choice (was an unresolvable
				// `content` slot).
```

### `closure_parameters` (`packages/rust/grammar.sittir.ts:371`)

```text
				// Naked-choice field names (was unresolvable `content` slots).
```

### `match_block` (`packages/rust/grammar.sittir.ts:388`)

```text
				// match_block: seq('{', optional(seq(repeat(match_arm),
				//   alias(last_match_arm, match_arm))), '}').
				// The trailing `alias($.last_match_arm, $.match_arm)` is a SECOND unnamed
				// positional child alongside the `repeat(match_arm)` array — BOTH surface as
				// kind `match_arm`, so the slot model can't distinguish them by kind (the
				// "multiple unnamed children in sequence" case). Field the trailing arm so it
				// routes to a distinct NAMED slot instead of colliding with the array. Path:
				// member 1 (optional) → its content seq → member 1 (the alias).
```

### `async_block` (`packages/rust/grammar.sittir.ts:400`)

```text
				// async_block: seq('async', optional('move'), $.block).
				// Field-promotion wave 1 (016 task #23): label the standalone
				// optional `move` punct as `move_marker` so render preserves it
				// (`async move { ... }` vs `async { ... }`). Naming follows the
				// `<token>_marker` convention enrich uses for auto-promotion
				// (016 task #30); kept hand-promoted because the hand-emitted
				// template renders without the spacing that auto-promotion
				// introduces (the `async move {}` parity fixture round-trips
				// only with this entry).
```

### `array_expression` (`packages/rust/grammar.sittir.ts:413`)

```text
				// array_expression polymorph splits '2/0' (semi) / '2/1' (list).
				// Only the outer `repeat($.attribute_item)` at pos 1 needs a field
				// label (the header attributes). The per-element label is no longer
				// needed — the `attributed_array_element` visible group (see groups:
				// above) now carries each element's attribute_item(s) + _expression
				// pair as a self-contained unit, exactly as `attributed_argument`
				// does for call arguments.
```

### `attribute` (`packages/rust/grammar.sittir.ts:426`)

```text
				// attribute: seq(_path, optional(choice(seq('=', field('value',
				// _expression)), field('arguments', delim_token_tree)))).
				// storageName collision: _path (pos 0) and the optional choice
				// (pos 1) both infer storageName='children'. Promote the path at
				// pos 0 to a named field; the expression/arguments side already
				// has inner field() wrappers and stays as $children.
```

### `block` (`packages/rust/grammar.sittir.ts:436`)

```text
				// block: seq(optional(seq(field('label', label), ':')), '{',
				// repeat(_statement), optional(_expression), '}').
				// storageName collision: repeat(_statement) at pos 2 and
				// optional(_expression) at pos 3 both infer storageName='children'.
				// Promote the trailing expression to a named field; statements stay
				// as $children.
```

### `bounded_type` (`packages/rust/grammar.sittir.ts:446`)

```text
				// bounded_type: 2 field(s)
```

### `closure_expression` (`packages/rust/grammar.sittir.ts:452`)

```text
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
```

### `extern_modifier` (`packages/rust/grammar.sittir.ts:486`)

```text
				// extern_modifier: 1 field(s)
```

### `function_modifiers` (`packages/rust/grammar.sittir.ts:489`)

```text
				// function_modifiers — base is
				//   repeat1(choice('async', 'default', 'const', 'unsafe', $.extern_modifier))
				// Wrap the inner choice (path `0` = repeat1's content) with a single
				// `field('modifier')`. Tree-sitter then reports the per-arm token
				// union in node-types.json under `function_modifiers.fields.modifier`,
				// which lets sittir surface the modifier set as an enum / bitflag
				// (ADR-0012) rather than dropping the anonymous arms from $children.
```

### `_` (`packages/rust/grammar.sittir.ts:497`)

```text
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
```

### `visibility_modifier` (`packages/rust/grammar.sittir.ts:517`)

```text
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
```

### `function_type` (`packages/rust/grammar.sittir.ts:551`)

```text
				// function_type: top-level seq is
				//   [for_lifetimes, prec(call, seq(choice(trait, fn_form), parameters)),
				//    optional(->return_type)]
				// The choice at position 1 inner-seq[0] chooses between trait form
				// (bare type with field('trait', ...)) and fn form (seq with
				// optional modifiers + 'fn' literal). Template walker drops the
				// 'fn' literal because it's only in one arm. Polymorph-split each
				// arm. prec is transparent to path addressing, so path `1/0` is
				// the choice inside.
```

### `gen_block` (`packages/rust/grammar.sittir.ts`)

```text
				// gen_block: seq('gen', optional('move'), $.block).
				// Symmetric to async_block — label the optional `move` punct as
				// `move_marker` so render preserves it. Kept hand-promoted for
				// the same render-spacing reason as async_block (see note above).
```

### `generic_type` (`packages/rust/grammar.sittir.ts`)

The base rule is deliberately left unchanged. The wire `$type` is the grammar
symbol stamped by the native read, so a node parsed through
`alias($.generic_type_with_turbofish, $.generic_type)` arrives as
`generic_type_with_turbofish` even though tree-sitter's display tree labels it
`generic_type` — consumers get the source-typed view with no rewrite step. The
turbofish punct itself is field-labeled on the source kind (the
`generic_type_with_turbofish` positional override below). Validator reparse
candidates key on `generic_type_with_turbofish` directly, reparsed in a
context that accepts a turbofish.

### `index_expression` (`packages/rust/grammar.sittir.ts:604`)

```text
				// index_expression: 2 field(s)
```

### `macro_invocation` (`packages/rust/grammar.sittir.ts:610`)

```text
				// macro_invocation: 1 field(s)
```

### `mod_item` (`packages/rust/grammar.sittir.ts:615`)

```text
				// mod_item: two forms — `mod name;` (external) vs `mod name { ... }`
				// (inline). Polymorph-split so each form's template emits the
				// right terminator (trailing `;` vs `{...}` body).
```

### `negative_literal` (`packages/rust/grammar.sittir.ts:620`)

```text
				// negative_literal: 2 field(s)
```

### `ordered_field_declaration_list` (`packages/rust/grammar.sittir.ts:625`)

```text
				// ordered_field_declaration_list: 1 field(s)
				// The original override had position 2 for `visibility_modifier`
				// targeting `optional(',')` (trailing comma). After evaluate's
				// `absorbTrailingSeparator` collapses the trailing comma into the
				// repeat's `trailing: true` flag, position 2 becomes `)` — wrong.
				// Also `visibility_modifier` is inside the per-element seq, not at
				// the outer level, so the position 2 override was structurally
				// incorrect. Only wrapping position 1 (the per-element group).
```

### `or_pattern` (`packages/rust/grammar.sittir.ts:637`)

```text
				// or_pattern polymorph splits '0' (binary) / '1' (prefix).
				// Field labels land on base-shape choice arms pre-alias.
```

### `pointer_type` (`packages/rust/grammar.sittir.ts:645`)

```text
				// pointer_type: position 1 is `choice('const', $.mutable_specifier)`.
				// Wrapping the choice as `field('mutable_specifier')` makes BOTH
				// the `const` string and the `mutable_specifier` symbol route to
				// the named slot at readNode time, so the template can emit the
				// actual qualifier text instead of hardcoding "const".
```

### `raw_string_literal` (`packages/rust/grammar.sittir.ts`, `patches`)

Two patch sets: `alias()` placeholders on positions 0 and 2, then fields on
all three. The delimiters are HIDDEN external-scanner tokens
(`$._raw_string_literal_start` / `_end`), invisible in the CST, so their
per-occurrence text (the hash-run width, `r#"` vs `r###"`) never reached the
read layer and render had to invent a fixed spelling. The placeholders re-face
each token in place as a named kind (`raw_string_literal_start` / `_end`) so
the real text survives as a captured slot; wire mints no hidden rule for them
because the names are base externals (`baseExternalNames`).

### `range_expression` (`packages/rust/grammar.sittir.ts`, `patches`)

Three patch sets in order: `{ '-1': alias('range_expression_bare') }` first,
so the bare `..` arm (RangeFull, `let x = ..;` — the only arm that is not a
seq, and as a bare literal an anonymous token the wrap layer's `content`
accessor never finds) becomes `alias($._range_expression_bare,
$.range_expression_bare)` with `_range_expression_bare` authored in `rules:`;
then the field labels, which land on the base-shape choice arms; then the
`variant()` splits `'0'..'3'`.

### `reference_pattern` (`packages/rust/grammar.sittir.ts:681`)

```text
				// reference_pattern: 2 field(s)
```

### `reference_type` (`packages/rust/grammar.sittir.ts:686`)

```text
				// reference_type: 2 field(s)
```

### `self_parameter` (`packages/rust/grammar.sittir.ts:689`)

```text
				// self_parameter: canonical tree-sitter-rust has no fields here;
				// labels below are ours. `&` is the lifetime marker (pos 0,
				// routed through _kw_lifetime so FIELD survives). `$.lifetime`
				// at pos 1 is the explicit lifetime name ('a etc.) — distinct
				// name to avoid colliding with pos 0's label.
```

### `shorthand_field_initializer` (`packages/rust/grammar.sittir.ts:698`)

```text
				// shorthand_field_initializer: 2 field(s)
```

### `source_file` (`packages/rust/grammar.sittir.ts:704`)

```text
				// source_file: 2 field(s)
```

### `static_item` (`packages/rust/grammar.sittir.ts:709`)

```text
				// static_item: 2 field(s)
```

### `struct_item` (`packages/rust/grammar.sittir.ts`)

Three body shapes: brace (`{ … }`), tuple (`(…)` + `;`), and unit (`;`). Each
is polymorph-split into its own visible variant so the trailing `;` on the
tuple and unit forms gets rendered — the flat template dropped it, because `;`
is an anonymous token not routed to any field.

### `trait_item` (`packages/rust/grammar.sittir.ts:720`)

```text
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
```

### `try_expression` (`packages/rust/grammar.sittir.ts:734`)

```text
				// try_block: 1 field(s)
				// try_expression: 2 field(s)
```

### `tuple_expression` (`packages/rust/grammar.sittir.ts:740`)

```text
				// tuple_expression: flat list of expressions comma-separated.
				// Kind-match labels every `_expression` as `elements` without
				// capturing the `,` separators (same pattern as array_expression).
```

### `tuple_type` (`packages/rust/grammar.sittir.ts:748`)

```text
				// tuple_type: seq('(', sepBy1(',', $._type), optional(','), ')').
				// sepBy1 expands to seq($._type, repeat(seq(',', $._type))).
				// read_node routes unfielded _type children by concrete kind
				// (primitive_type, type_identifier, …) into separate supertype
				// buckets — losing CST order and reversing the tuple element list.
				// Kind-match wraps EVERY $._type occurrence with the same 'type'
				// field name so read_node collapses them into one ordered slot.
				// Uses transforms: (not rules:) so the parse is unchanged.
```

### `type_item` (`packages/rust/grammar.sittir.ts:760`)

```text
				// type_item: 3 field(s)
```

### `unary_expression` (`packages/rust/grammar.sittir.ts:771`)

```text
				// unary_expression — label both the operator token (pos 0) and
				// the operand expression (pos 1). overrides.json promotes both
				// to fields at readNode time; the walker needs matching IR
				// fields so the template emits `$OPERATOR$OPERAND` instead of
				// `$OPERATOR $$$CHILDREN` (which reads empty after field promotion).
```

### `variadic_parameter` (`packages/rust/grammar.sittir.ts:786`)

```text
				// variadic_parameter: 1 field(s)
```

### `expression_statement` (`packages/rust/grammar.sittir.ts:789`)

```text
				// expression_statement: choice(seq(_expression, ';'),
				//                              prec(1, _expression_ending_with_block)).
				// Heterogeneous — the ';'-terminated form and the block-ending
				// form have structurally distinct templates. Each becomes its
				// own variant child kind.
```

### `foreign_mod_item` (`packages/rust/grammar.sittir.ts:799`)

```text
				// foreign_mod_item: choice at pos 2 between ';' (bare extern
				// decl) and field('body', declaration_list) (block extern).
				// Variant-adopt so each arm owns its own template.
```

### `match_arm` (`packages/rust/grammar.sittir.ts:807`)

```text
				// match_arm: seq(repeat(choice(attribute_item, inner_attribute_item)),
				//   field('pattern', match_pattern), '=>', choice(...)).
				// storageName collision in synthesized form kinds: the
				// repeat(choice(attribute_item, inner_attribute_item)) at pos 0 and
				// the variant symbol at pos 3 both infer storageName='children'.
				// Promote attribute_item to named field; the variant child stays as
				// $children. Field patch (flat mode) runs before variant patches
				// (path mode) via array-of-patch-sets.
```

### `line_comment` (`packages/rust/grammar.sittir.ts:817`)

```text
				// line_comment: choice at pos 1 between regular double-slash,
				// doc-comment, and regular content. Each arm has its own
				// distinct literal prefix.
```

### `token_tree_pattern` (`packages/rust/grammar.sittir.ts:826`)

```text
				// token_tree_pattern / token_tree / delim_token_tree: each is
				// choice(seq('(', repeat(inner), ')'), seq('[', ..., ']'), seq('{', ..., '}')).
				// Three delimiter-variants — distinct opening/closing literals per
				// arm, same inner content. Split so each arm owns its template.
```

### `block_comment` — no variant entry (`packages/rust/grammar.sittir.ts`)

Deliberately absent from `variants:`. The inner choice at `1/0` branches on the
doc-marker form vs a bare `_block_comment_content`, but the latter is an
EXTERNAL token produced by a lexer callback. The variant hoist tries to
reference `_block_comment_content` from a generated hidden rule, and
tree-sitter rejects that as "used as both an external token and a non-terminal
rule". Supporting it needs either conflicts-awareness in the hoist or a
merge-branches path that leaves the external-token branch unextracted.

### `_token_tree_punctuation` (`packages/rust/grammar.sittir.ts:867`)

```text
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
```

### `_non_special_token` (`packages/rust/grammar.sittir.ts`)

Rewritten in `rules:` as `choice(...original.members.slice(0, 7),
prec.right(0, alias($._token_tree_punctuation, $.token_tree_punctuation)),
$._token_keywords)`.

Position 7 of the base's 37 alternatives is the punctuation run inside a token
tree (`,`, `::`, `->`, …): a bare anonymous `prec.right(repeat1(choice(...)))`
arm that tree-sitter never names, so the read routed it to `$other` and
punctuation between token-tree elements (the comma in `m!("hi", x)`) was lost on
render. The WHOLE arm is replaced by a bare aliased reference to the
`_token_tree_punctuation` rule — no repeat of our own. Two other shapes were
tried and rejected: aliasing only the inner choice while keeping
`prec.right`/`repeat1` compiles but creates a genuine nested-repeat ambiguity
(this rule's repeat vs the outer `_delim_tokens`/`_tokens` repeat one level up,
both able to absorb a run of consecutive punctuation) that needed `conflicts:`
entries to generate and still materialized `token_tree_punctuation` as its own
singular field instead of folding into `_delim_tokens`'s array; aliasing the
choice's first member alone silently covered only `'+'`. With no inner repeat,
the outer repeat alone produces one `token_tree_punctuation` array element per
consecutive punctuation token, matching how every other element reaches that
array.

Positions 8–36 (the bare `'` and the 28 reserved-word literals
`'as'`…`'while'`) are consolidated into the single `_token_keywords` reference,
mirroring the punctuation treatment. `_token_keywords`'s body is pure
bare-STRING members with no symbol refs, so link's `classifyHiddenChoiceRule`
admits it as an ENUM (its string-literal-only admission check), not a SUPERTYPE
— the keywords get type/enum/factory representation instead of being invisible
to the type system.

### `use_wildcard` (`packages/rust/grammar.sittir.ts:1045`)

```text
				// use_wildcard — re-authored as a VISIBLE clause group. Base was the
				// double-optional `seq(optional(seq(optional($._path), '::')), '*')`, which
				// (once detectClause is gone) the enrich auto-hoist inlines into a presence-
				// less group → renders `::*`. Here the `path ::` prefix is a hidden but
				// NON-inlined group `_use_wildcard_clause` with a single mandatory `path`
				// field: as a real node it carries a populated presence slot, so the parent
				// gates the whole prefix (incl. `::`) by the clause's presence → `path::*`
				// or `*`. (Drops the ~invalid bare-path `use ::*` form, which was never valid.)
```

### `_where_clause_group1` (`packages/rust/grammar.sittir.ts:1056`)

```text
				// _where_clause_group1 — enrich's visible-group hoist extracts base
				// where_clause's predicate list (sepBy1(',', where_predicate) +
				// trailing optional ',') into this hidden backing rule. Base
				// tree-sitter-rust resolves the trailing-comma-vs-next-predicate
				// shift/reduce with prec.right ON where_clause; the hoist moves those
				// productions out of that annotation's scope, so restore the same
				// right-associativity on the hoisted body (`where 'a: 'b, 'c: 'd` must
				// shift at `, • '`, not end the group).
```

### `_pattern` (`packages/rust/grammar.sittir.ts`, `patches`)

`_pattern: { '-1': alias('wildcard_pattern') }`. The wildcard `_` is a bare
literal alternative (the last arm) of the `_pattern` supertype choice. At
multi-valued list positions (`sepBy(',', $._pattern)` in tuple_struct_pattern,
tuple_pattern, slice_pattern, closure parameters) tree-sitter surfaces `_` as
an anonymous child that the read's named-only capture drops. The `alias()`
placeholder rewrites the arm as `alias($._wildcard_pattern, $.wildcard_pattern)`,
giving it a real node so every `_pattern` list position round-trips without
render-side heuristics. `_wildcard_pattern` is authored in `rules:` so the
placeholder mints nothing new. Keyword-carrier hidden rules (`_kw_async`,
`_kw_pub`, …) are not authored anywhere: `maybeKeywordSymbol` (field.ts)
synthesizes them whenever a one-arg `field('name')` patch lands on a bare
STRING — see `function_modifiers` / `visibility_modifier`.

### `_wildcard_pattern` (`packages/rust/grammar.sittir.ts:1096`)

```text
				// The hidden rule `_wildcard_pattern` is just the `_` literal;
				// the named alias on `_pattern` above promotes it to a proper
				// `wildcard_pattern` kind at parse time.
```

### `_reference_expression_raw_const` (`packages/rust/grammar.sittir.ts:1101`)

```text
				// reference_expression — reference-mode is a SINGLE optional choice slot.
				// Each raw arm is a real alias kind that OWNS its `raw` prefix (the
				// co-optional group `seq('raw', discriminator)`), so member-1 is a clean
				// choice-over-kinds and the branch emitters render it faithfully — no
				// forms / $variant / per-form transport. `&` is a bare mandatory literal
				// (NOT a field — fielding it forced the `_kw_reference` LR routing we no
				// longer need). `& mut x` → bare mutable_specifier arm; `& x` → optional
				// absent. raw_const/raw_mut stay real kindId-bearing kinds → factory
				// submethods derive from the choice arms as sugar.
```

### `_impl_item_unsafe_marker` (`packages/rust/grammar.sittir.ts:1128`)

```text
				// impl_item — full rule replacement (de-polymorph). The co-optional trait
				// clause is owned by alias'd positive/negative clause kinds so it renders as a
				// unit (no conditional-key-on-sub-optional bug); body/semi arms are alias kinds.
```

### `_let_chain` (`packages/rust/grammar.sittir.ts:1157`)

```text
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
```

### `expectTestFailures` (`packages/rust/grammar.sittir.ts:1183`)

```text
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
			// Known-failing generated nodes.test.ts kinds — tracked defects, not
			// silenced mysteries. Remove an entry + regen when its issue is fixed.
```

### `_raw_string_literal_start` (`packages/rust/grammar.sittir.ts:1223`)

```text
				// Raw string literal delimiters — static (1-hash form only).
				// Round-trip will fail for `r##"..."##` etc. Factory-side
				// benefit: no delimiter-count parameter needed.
```
