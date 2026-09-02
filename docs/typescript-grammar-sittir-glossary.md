# TypeScript Overrides Glossary

Per-rule reference for `packages/typescript/grammar.sittir.ts`: every named rule
override, conflict, and precedence declaration significant enough to need
explanation. Each entry covers what the rule/conflict addresses, why it's
needed (the specific ambiguity or shape mismatch), and what would break if
it were removed.

See [AGENTS.md § Wave-style decomposition before commits](../AGENTS.md) for
the convention this glossary exists to serve — long rationale comments in
`grammar.sittir.ts` move here instead of living inline.

---

### `base` import (`packages/typescript/grammar.sittir.ts:11`)

The import points at the **typescript** (non-tsx) grammar so the codegen
surface matches the reparse target — `WASM_PATHS.typescript` loads the non-tsx
wasm. Pointing it at `tsx/grammar.js` is harmless for a non-JSX corpus but a
latent mismatch: anything JSX-shaped would reparse-fail. One grammar,
end-to-end.

### `enrichedBase` (`packages/typescript/grammar.sittir.ts:19`)

`enrich(base)` is bound once and the SAME enriched grammar is handed to both
`grammar()` and `wire()` (matching rust). `wire` needs the enriched base so its
base-dependent passes — auto-group synthesis, body-pattern groups, and the
enrich-hoisted-clause inline registration — operate on the post-enrich shape.
Without the second argument those passes silently no-op, leaving
enrich-hoisted clause groups un-inlined and producing LR conflicts.

### `conflicts` (`packages/typescript/grammar.sittir.ts:25`)

Conflict markers for `variant()` adoption on kinds where splitting exposes
LR(1) ambiguities the unsplit grammar resolved via shared state. Each entry
names two or more rules tree-sitter should treat as requiring a GLR state, so
it can defer the decision until more input disambiguates. Hidden (`_foo`) and
visible (`$.foo`) names are both valid.

`previous` is the TS grammar's own conflicts list (which itself concats the JS
base's conflicts). Concat so the base entries survive — this list only ADDS the
entries `variant()` adoption requires.

Per-entry rationale for the sittir-added groups:

- `[sequence_expression, _parenthesized_expression_typed]` — the
  parenthesized_expression split makes `( expression )` and
  `( sequence_expression )` share the expression prefix, so the typed variant's
  hidden rule competes with `sequence_expression` at `( expression •`. GLR
  resolves on what follows.
- `[sequence_expression, _parenthesized_expression_group1]` — same class, for
  the widened mint's own group rule.
- `[primary_expression, arrow_function]` — a latent `async` ambiguity the split
  exposes. Previously tree-sitter resolved `async (` via state shared between
  the typed parenthesized expression and arrow_function's call signature; with
  the typed variant lifted to its own hidden rule the parser needs explicit GLR
  to decide whether `async (` starts a call or an arrow function.
- `[primary_expression, _property_name]` — `export` as `primary_expression` vs
  as `_property_name`, which collide once the typed-parenthesized variant
  brings more expression contexts into the same state.
- `[string]` — the string refine rewrite is one fielded `seq` with a correlated
  `contents` choice. Both content arms accept `escape_sequence`, so after the
  opening quote tree-sitter needs GLR to defer which repeat arm owns the
  fragment stream until more input arrives.
- `[await_expression, _update_expression_postfix]` and its siblings — the
  hoisted `_update_expression_postfix` / `_update_expression_prefix` hidden
  rules inherit the outer `prec.left(0, …)`, but after extraction each has
  `prec 0` individually and competes with `await_expression` (prec
  `unary_void`) on `await expr • '++'` / `'++' • expr`. One unsplit rule
  carried the whole choice under one prec declaration and the LR table handled
  it internally; after splitting, GLR is the only resolver.
- `[await_expression, _update_expression_group1]` — same ambiguity, inherited
  by the widened mint's own group rule.
- `[_variable_declarator_group1, _for_header_let_const_kind]` — a `for (let x`
  shared-prefix ambiguity, surfaced when repointing
  `_export_statement_default`'s nested `from_arm` alias onto its fully-split
  polymorph home shifted rule registration order.
- `[import, _meta_property_group2]` — the `import.meta` arm mint and the
  `import` rule share the `import` keyword prefix.
- `[primary_expression, _meta_property_group1]` — the `new.target` twin: the
  mint shares the `new` keyword prefix with primary_expression's new_expression
  arm.
- `[_lhs_expression, _export_statement_equals_export]` — `export = <lhs>` and a
  bare lhs expression statement share the expression prefix once the
  export-statement mints are no longer inline-dissolved.
- `[object_assignment_pattern, _lhs_expression]` (and its 3-way superset with
  the `export =` arm) — cascade of the same un-dissolution: `{ x` may open an
  object assignment pattern or a bare lhs.
- `[function_type, _arrow_function__call_signature]` and
  `[constructor_type, _arrow_function__call_signature]` — arrow-function family
  cascade: the `_call_signature` polymorph helper and function_type share the
  `( params )` prefix in type position.
- `[_lhs_expression]` — the `_lhs_expression` cascade walks the whole type
  family one pairwise suggestion at a time (primary_type → literal_type →
  readonly_type → …), so GLR is declared on the union itself as well; same
  singleton pattern as `[class]` and `[string]`.
- `[primary_expression, _export_statement_default_from_arm]` /
  `[…_decl_arm]` — the `_export_statement_default` outer split inherits the
  outer `_export_statement_default` vs primary_expression conflict on the
  `export` prefix, propagated to the two outer variants.
- `[primary_expression, _parameter_name, readonly_type]` — inlining
  `_kw_readonly_marker` into `_parameter_name` makes the bare `'readonly'`
  token visible in `_parameter_name`'s state machine. At
  `'<' '(' 'readonly' • '('` (a generic-typed function-type parameter) the
  parser sees three readings: `_parameter_name 'readonly' • pattern`,
  `primary_expression 'readonly'` (treating `readonly` as an identifier), and
  `readonly_type 'readonly' • type`. Static precedence can't separate them.
- `[_class_body_method]` — class_body repeat-choice split: the `method` arm
  ends with `optional(_semicolon)`, so tree-sitter can't decide whether to
  consume the `;` as part of `_class_body_method` or as the next iteration's
  start. The self-conflict tells it to fork.
- `[_class_body_method_sig, _class_body_member]` — `method_signature` appears
  both in the `method_sig` arm (followed by `_function_signature_…` or `,`) and
  in the `member` arm (wrapped in a choice-of-member-kinds).
- `[primary_expression, _for_header_lhs]` and the other `_for_header` pairs —
  each `_for_header` sub-variant inherits the for-header's identifier-prefix
  ambiguity.

### `inline` (`packages/typescript/grammar.sittir.ts:232`)

```text
			// Inline `public_field_definition`'s polymorph-synthesized variant
			// bodies at the alias site. Why inline instead of `conflicts:` —
			// `access_first` reduces to "just accessibility_modifier" and
			// conflicts unrecoverably with method_definition / method_signature
			// / abstract_method_signature that share the prefix. Inlining
			// folds the body into public_field_definition's LR state machine
			// so the pre-split parser states are restored; the alias wrapper
			// survives inlining so the parse tree still surfaces the named
			// variant kind.
			//
			// Experimentally tried moving _for_header and _export_statement_default
			// variants here too — tree-sitter accepted the build, but 1 corpus
			// round-trip dropped to 92 and the typescript factory round-trip
			// started failing. The difference: those variants are referenced
			// through multi-level paths (cascaded polymorph adoption) where
			// inlining changes how tree-sitter resolves alias boundaries at
			// parse time, in ways that slightly alter tree output. Kept as
			// `conflicts:` entries which preserve the exact pre-inline shape.
```

The surviving structured mints listed here are load-bearing: un-inlining them
re-opens the non-convergent `_lhs_expression` / reserved-identifier conflict
cascade. Entries whose mints were retired by the `isSupertypeLike` structural
decline are dead — tree-sitter emits a non-fatal "inline rule not defined"
warning for each, and they should be dropped on the next overrides sweep.

`_kw_readonly_marker` and `_kw_async_marker` are NOT listed: `wire()`
auto-inlines them whenever field promotion synthesizes them, so only the
polymorph helpers need to appear explicitly.

### `_export_statement_default` (`packages/typescript/grammar.sittir.ts:305`)

```text
				// PR 3 (2026-07-21 union-slot design): `_export_statement_default`
				// used to be split via 3 SEPARATE, CASCADED variant() entries
				// (itself, then `_export_statement_default_from_arm`, then
				// `_export_statement_default_decl_arm`/`..._default_kw`) — each a
				// distinct resolvePatch call materializing its own name. Enrich's
				// widened clause-hoist mint gate raw-mints EVERY one of those
				// intermediate positions (from the RAW base grammar, before any
				// override runs) under its own `_export_statement_group<N>` name;
				// once a NESTED cascade level's config replaces that raw mint's
				// alias content with the properly-split polymorph body (transform.ts's
				// ALIAS-rename deposit + repoint), the ORIGINAL raw mint becomes a
				// provably-unreachable orphan that still reaches codegen (nothing
				// prunes `rules` map entries by reachability — see
				// docs/KNOWN_ISSUES.md's "Assemble-time grammar diagnostics scan
				// every `rules` map entry..." entry) and can trip real bugs
				// downstream (confirmed: a duplicate `AnyTransport` impl, a hard
				// `cargo build` failure, from `_export_statement_default_from_arm`'s
				// nested raw mint). Folding the ENTIRE `_export_statement_default`
				// cascade into ONE patches entry with deep, multi-level string
				// paths — same idiom `class_body`'s
				// `'1/0/0'`/`'1/0/1'`/`'1/0/3'` entry above already uses — means
				// `_export_statement_default` is fully materialized in ONE
				// resolvePatch call, so wire()'s existing orphan-detection
				// (`getEnrichClauseGroupOwners`/`context.authoredRuleNames`) marks
				// its raw enrich mint as orphaned in that ONE pass, instead of
				// leaving a nested raw mint behind for a LATER, separate
				// resolvePatch call to orphan. Produces the exact same final kind
				// names as the 3 cascaded entries did (verified against
				// `conflicts:`'s existing `$._export_statement_default_from_arm` /
				// `..._decl_arm` references above, which still resolve to these
				// names).
				//
				// Body (unchanged from the 3-entry cascade this replaces):
				//   `choice(
				//     seq('export', choice(         // path 0 — from_arm
				//       seq('*', _from_clause),                    // 0/1/0 — star_from
				//       seq(namespace_export, _from_clause),       // 0/1/1 — ns_from
				//       seq(export_clause, _from_clause),          // 0/1/2 — clause_from
				//       export_clause,                             // 0/1/3 — left unlabeled
				//     ), _semicolon),
				//     seq(repeat(field('decorator',…)), 'export', choice(  // path 1 — decl_arm
				//       field('declaration', declaration),
				//       seq('default', choice(                     // 1/2/1 — default_kw
				//         field('declaration', declaration),
				//         seq(field('value', expression), _semicolon),  // 1/2/1/1/1 — value
				//       )),
				//     )),
				//   )`
```

### `class_body` (`packages/typescript/grammar.sittir.ts:363`)

```text
				// class_body body: `seq('{', repeat(choice(5 arms)), '}')`.
				// Inner repeat-choice has 3 heterogeneous seqs, 1 bare symbol
				// (class_static_block), 1 bare literal (';'). Split the 3 seqs
				// so the choice becomes symbol-like across all arms.
```

### `_for_header` (`packages/typescript/grammar.sittir.ts:373`)

```text
				// _for_header body (base-grammar hidden):
				//   seq('(', choice(3 arms), field('operator', choice('in','of')),
				//       field('right', _expressions), ')')
				//   arm 0: field('left', choice(_lhs_expression, parenthesized_expression))
				//   arm 1: seq(field('kind','var'), field('left',…), optional(_initializer))
				//   arm 2: seq(field('kind', choice('let','const')), field('left',…),
				//              optional(_automatic_semicolon))
				// Split each arm so the outer choice becomes all symbol-like.
```

### `public_field_definition` — modifier positions (no polymorph split)

`public_field_definition` is ONE kind with flat optional marker slots. The
upstream modifier positions (1 and 2) are permutation choices — every arm is
an ordering of the same modifier set — so enrich declines the choice-arm mint
(`isPermutationChoice`) instead of extracting per-arm kinds, and promotes the
arms' keyword steps to shared `field('<kw>_marker', $._kw_*)` markers. The
merged slots (`declare_marker`, `static_marker`, `readonly_marker`,
`abstract_marker`, `accessor_marker`, plus the `accessibility_modifier` /
`override_modifier` node slots) land directly on the kind; the template emits
them once each, in canonical flat order. The former per-arm kinds and their
`inline:`/conflict machinery are gone — the conflicts block declares the
class-member ambiguities against `public_field_definition` itself.

### `2/0` (`packages/typescript/grammar.sittir.ts:417`)

```text
					// Position 2: a four-arm modifier choice (heterogeneous).
```

### `jsx_opening_element_content` (`packages/typescript/grammar.sittir.ts:425`)

```text
				// __jsx_start_opening_element_optional1 is the inline two-slot helper for
				// JSX element head content: choice(name / name+type_args) + repeat(attribute).
				// The two-slot seq causes the template to flatten both slots, losing the
				// name–attribute distinction. Registering as a visible group collapses the
				// parent's optional to a single `jsx_opening_element_content` slot so each
				// field renders from its own slot. Also fixes _jsx_start_opening_element's
				// multi-slot-nested-seq diagnostic (it inlines __jsx_start_opening_element_optional1).
				// The name+type_arguments arm is NOT written out inline: enrich's group
				// lift has already hoisted it into `_jsx_start_opening_element_group1`
				// (aliased visible) by the time pattern replacement compares bodies, so
				// the post-enrich sub-tree this pattern must equal holds that alias ref.
				// The old inline-seq form silently matched nothing (caught by
				// `body-pattern-zero-match`).
```

### `arguments` (`packages/typescript/grammar.sittir.ts:448`)

```text
				// Naked-choice field names (was unresolvable `content` slots).
```

### `class_body` (`packages/typescript/grammar.sittir.ts:471`)

```text
				// class_body: repeat-choice arm 3 is the upstream inline
				// `seq(choice(4 sigs), choice(_semicolon | ','))` that sittir extracts
				// into the hidden `_class_body_member` — both positions unnamed → 2
				// `content` slots (content-collision). Name the terminator by its path
				// in the parent (fields are applied before the extraction): pos 0 (the
				// member) keeps `content`, pos 1 (the `;`/`,` choice) → `terminator`.
				// Path `1/0/3/1`: seq pos 1 (repeat) → `/0` repeat content (choice) →
				// arm 3 → arm-seq pos 1 (terminator choice).
```

### `1/0/1/1` (`packages/typescript/grammar.sittir.ts:480`)

```text
					// Arm 1 (method_signature) terminates with the unnamed mixed
					// row `choice(_function_signature_automatic_semicolon, ',')`
					// — same shape as arm 3's, but with one arm ANONYMOUS: the
					// bare `,` lands in `$other` where the kind-derived slot
					// can't reach it, so a comma-terminated signature leaves the
					// `function_signature_automatic_semicolon` slot empty and
					// wrap throws. Field both arms under the same `terminator`
					// name as arm 3 (the expression_list/pattern_list precedent).
```

### `abstract_class_declaration` (`packages/typescript/grammar.sittir.ts:492`)

```text
				// abstract_class_declaration: wrap pos 5 (class_heritage choice).
				// pos 0 is REPEAT(field('decorator')) — don't touch it, it's a real
				// base-grammar field and the original override clobbered it.
```

### `abstract_method_signature` (`packages/typescript/grammar.sittir.ts:497`)

```text
				// abstract_method_signature: seq(
				//   optional($.accessibility_modifier),    // pos 0
				//   'abstract',                             // pos 1 (literal, not optional)
				//   optional($.override_modifier),          // pos 2
				//   optional(choice('get','set','*')),     // pos 3  →  '3/0'  (accessor_kind, choice-of-strings)
				//   field('name', $._property_name),        // pos 4
				//   optional('?'),                          // pos 5  →  '5/0'  (optional_marker)
				//   $._call_signature)                      // pos 6
				// Field-promotion wave 3 (016 task #25): symmetric to
				// method_definition / method_signature for the trailing `?` plus
				// the accessor keyword. NOTE: no readonly_marker — `'abstract'` is
				// a required literal at pos 1, not optional.
```

### `ambient_declaration` (`packages/typescript/grammar.sittir.ts:514`)

```text
				// ambient_declaration: split the heterogeneous declaration choice
				// so each arm owns its own literal scaffold (`declare global …`,
				// `declare module.<name>: <type>;`, or direct declaration).
```

### `array_type` (`packages/typescript/grammar.sittir.ts:524`)

```text
				// array_type: 1 field(s)
```

### `as_expression` (`packages/typescript/grammar.sittir.ts:527`)

```text
				// as_expression: 2 field(s)
```

### `asserts_annotation` (`packages/typescript/grammar.sittir.ts:532`)

```text
				// asserts_annotation: 1 field(s)
```

### `await_expression` (`packages/typescript/grammar.sittir.ts:537`)

```text
				// await_expression: 1 field(s)
```

### `class` (`packages/typescript/grammar.sittir.ts:540`)

```text
				// class: wrap pos 4 (class_heritage choice). pos 0 is decorator repeat.
```

### `class_declaration` (`packages/typescript/grammar.sittir.ts:543`)

```text
				// class_declaration: wrap pos 4 (class_heritage choice) and pos 6
				// (automatic_semicolon choice). pos 0 is decorator repeat — leave it
				// alone so the base 'decorator' field survives.
```

### `computed_property_name` (`packages/typescript/grammar.sittir.ts:550`)

```text
				// computed_property_name: 1 field(s)
```

### `else_clause` (`packages/typescript/grammar.sittir.ts:553`)

```text
				// else_clause: 1 field(s)
```

### `enum_body` (`packages/typescript/grammar.sittir.ts:556`)

```text
				// enum_body — NO override field. Upstream each member is already
				// `choice(field('name', $._property_name), $.enum_assignment)`, so the
				// members carry their own fields. The auto-generated `field('opening')`
				// wrapped the list in a SPURIOUS outer field that nested over the inner
				// `name`; the reader keyed members under the innermost (`name`) while the
				// model only knew `opening`, dropping every member on render (`{ }`).
				// The fix is to add no field at all — pass the upstream rule through.
				// (Tried aliasing the bare-name arm to a node kind to force one union
				// slot; `carriesNamedField` sees through the alias to the inner field and
				// distributes anyway, and the alias-of-hidden-rule got stripped — no gain.
				// A separate visible `enum_property` rule would work but is a parser
				// change for the uncorpused mixed-enum case; left as a latent gap.)
```

### `flow_maybe_type` (`packages/typescript/grammar.sittir.ts:570`)

```text
				// flow_maybe_type: 1 field(s)
```

### `import_alias` (`packages/typescript/grammar.sittir.ts:573`)

```text
				// import_alias: 3 field(s)
```

### `import_attribute` (`packages/typescript/grammar.sittir.ts:580`)

```text
				// import_attribute: 1 field(s)
```

### `import_require_clause` (`packages/typescript/grammar.sittir.ts:585`)

```text
				// import_require_clause: 1 field(s)
```

### `import_statement` (`packages/typescript/grammar.sittir.ts:588`)

```text
				// import_statement: 4 field(s)
```

### `index_type_query` (`packages/typescript/grammar.sittir.ts:595`)

```text
				// index_type_query: 1 field(s)
```

### `infer_type` (`packages/typescript/grammar.sittir.ts:598`)

```text
				// infer_type: 2 field(s)
```

### `instantiation_expression` (`packages/typescript/grammar.sittir.ts:604`)

```text
				// instantiation_expression: 1 field(s)
```

### `interface_declaration` (`packages/typescript/grammar.sittir.ts:607`)

```text
				// interface_declaration: 1 field(s)
```

### `intersection_type` (`packages/typescript/grammar.sittir.ts:610`)

```text
				// intersection_type: 2 field(s)
```

### `lexical_declaration` (`packages/typescript/grammar.sittir.ts:616`)

```text
				// lexical_declaration: 2 field(s)
```

### `lookup_type` (`packages/typescript/grammar.sittir.ts:622`)

```text
				// lookup_type: 2 field(s)
```

### `method_definition` (`packages/typescript/grammar.sittir.ts:627`)

```text
				// method_definition: prec.left(seq(
				//   optional($.accessibility_modifier),    // pos 0  (auto-promoted: accessibility_modifier by enrich)
				//   optional('static'),                    // pos 1  →  'static_marker' (T048: was wrongly labeled
				//                                          //         override_modifier; _kw_static_marker synthesized
				//                                          //         here; add to inline: if parse drift emerges)
				//   optional($.override_modifier),         // pos 2  (auto-promoted: override_modifier by enrich)
				//   optional('readonly'),                  // pos 3  →  '3/0'  (readonly_marker)
				//   optional('async'),                     // pos 4  →  '4/0'  (async_marker)
				//   optional(choice('get','set','*')),    // pos 5  →  '5/0'  (accessor_kind, choice-of-strings)
				//   field('name', $._property_name),       // pos 6
				//   optional('?'),                         // pos 7  →  '7/0'  (optional_marker)
				//   $._call_signature,                     // pos 8
				//   field('body', $.statement_block)))    // pos 9
				// Field-promotion wave 3 (016 task #25): label `async`, the
				// accessor `get`/`set`/`*`, and trailing `?` so render preserves
				// `async get foo?(): T {}` shapes. Naming follows `<token>_marker`
				// (016 task #30); enrich's CHOICE-form-of-optional path doesn't
				// fire on tree-sitter-evaluated rules so these positions are
				// hand-promoted. Wave-3 follow-up (016 task #28): `readonly_marker`
				// was deferred in wave 3 because the synthesized
				// `_kw_readonly_marker` hidden symbol's parse precedence diverges
				// from the bare `'readonly'` token in sibling rules — `class Foo
				// { readonly bar?(): T {} }` regressed to ERROR (parser took
				// `readonly` as the property identifier instead of the marker).
				// Resolved by adding `_kw_readonly_marker` to the top-level
				// `inline:` array (see above), which folds the hidden rule's body
				// into every reference site at LR-table generation while preserving
				// the FIELD wrapper for the parse tree.
```

### `method_signature` (`packages/typescript/grammar.sittir.ts:663`)

```text
				// method_signature: seq(
				//   optional($.accessibility_modifier),    // pos 0  (auto-promoted: accessibility_modifier by enrich)
				//   optional('static'),                    // pos 1  →  'static_marker' (T048: was wrongly labeled
				//                                          //         override_modifier; pos 2 override_modifier
				//                                          //         auto-promoted by enrich)
				//   optional($.override_modifier),         // pos 2  (auto-promoted: override_modifier by enrich)
				//   optional('readonly'),                  // pos 3  (auto-promoted: readonly_marker by enrich)
				//   optional('async'),                     // pos 4  (auto-promoted: async_marker by enrich)
				//   optional(choice('get','set','*')),    // pos 5  →  '5/0'  (accessor_kind, choice-of-strings)
				//   field('name', $._property_name),       // pos 6
				//   optional('?'),                         // pos 7  →  '7/0'  (optional_marker)
				//   $._call_signature)                     // pos 8
				// Standalone `optional('readonly')` / `optional('async')` are
				// auto-promoted by enrich. Kept entries: accessor_kind
				// (choice-of-strings, enrich skips), optional_marker
				// (`?` not identifier-shaped).
```

### `namespace_import` (`packages/typescript/grammar.sittir.ts:685`)

```text
				// namespace_import: 1 field(s)
```

### `non_null_expression` (`packages/typescript/grammar.sittir.ts:688`)

```text
				// non_null_expression: 1 field(s)
```

### `program` (`packages/typescript/grammar.sittir.ts:693`)

```text
				// program: 2 field(s)
```

### `property_signature` (`packages/typescript/grammar.sittir.ts:699`)

```text
				// property_signature: seq(
				//   optional($.accessibility_modifier),  // pos 0  (auto-promoted: accessibility_modifier by enrich)
				//   optional('static'),                   // pos 1  →  'static_marker' (T048: was wrongly labeled
				//                                         //         override_modifier; pos 2 override_modifier
				//                                         //         auto-promoted by enrich)
				//   optional($.override_modifier),         // pos 2  (auto-promoted: override_modifier by enrich)
				//   optional('readonly'),                  // pos 3  (auto-promoted: readonly_marker by enrich)
				//   field('name', $._property_name),       // pos 4
				//   optional('?'),                         // pos 5  →  '5/0'  (optional_marker)
				//   field('type', optional($.type_annotation)))  // pos 6
				// Standalone `optional('readonly')` is auto-promoted by enrich.
				// Kept entries: optional_marker (`?` non-identifier).
```

### `satisfies_expression` (`packages/typescript/grammar.sittir.ts:716`)

```text
				// satisfies_expression: 2 field(s)
```

### `spread_element` (`packages/typescript/grammar.sittir.ts:721`)

```text
				// spread_element: 1 field(s)
```

### `statement_block` (`packages/typescript/grammar.sittir.ts:724`)

```text
				// statement_block: 2 field(s)
```

### `type_assertion` (`packages/typescript/grammar.sittir.ts:730`)

```text
				// type_assertion: 2 field(s)
```

### `type_predicate_annotation` (`packages/typescript/grammar.sittir.ts:733`)

```text
				// type_predicate_annotation: 1 field(s)
```

### `union_type` (`packages/typescript/grammar.sittir.ts:738`)

```text
				// union_type: 2 field(s)
```

### `variable_declaration` (`packages/typescript/grammar.sittir.ts:744`)

```text
				// variable_declaration: 2 field(s)
```

### `yield_expression` (`packages/typescript/grammar.sittir.ts:750`)

```text
				// yield_expression: 1 field(s)
```

### `expression_statement` (`packages/typescript/grammar.sittir.ts:755`)

```text
				// expression_statement: label the trailing `_semicolon` so the
				// template emits `{{ semicolon }}`. Without the label, readNode
				// captures the anon `;` child but the parent template's
				// `{{ children | join(" ") }}` filters to NAMED-only children
				// and the `;` drops. Grammar: `seq(_expressions, _semicolon)`.
```

### `type_alias_declaration` (`packages/typescript/grammar.sittir.ts:764`)

```text
				// type_alias_declaration: same semicolon-drop pattern. Grammar:
				// `seq('type', field('name'), optional(type_parameters), '=',
				// field('value'), _semicolon)` — label pos 5.
```

### `return_statement` (`packages/typescript/grammar.sittir.ts:771`)

```text
				// return_statement: seq('return', optional(_expressions),
				// _semicolon). Label pos 2.
```

### `throw_statement` (`packages/typescript/grammar.sittir.ts:777`)

```text
				// throw_statement: seq('throw', _expressions, _semicolon).
```

### `function_signature` (`packages/typescript/grammar.sittir.ts:782`)

```text
				// function_signature: seq(
				//   optional('async'),
				//   'function',
				//   field('name'),
				//   _call_signature,
				//   choice(_semicolon, _function_signature_automatic_semicolon))
				// Keep the trailing semicolon field optional in the override
				// surface. The declarations corpus includes EOF-terminated
				// ambient exports like `export async function …` that parse as a
				// function_signature without surfacing either semicolon token.
				// Model the real read surface instead of forcing a missing slot.
```

### JS-inherited function family — `async_marker` promotion (`packages/typescript/grammar.sittir.ts`)

`function_expression`, `function_declaration`, `generator_function`, and
`generator_function_declaration` all start with `optional('async')` at
position 0, and each labels `0/0` as `async_marker` so render preserves
`async function …` / `async function* …` shapes.

They need hand-promotion because all four are wrapped in `prec(…)`, and
enrich's optional-keyword pass doesn't descend through `prec`. `arrow_function`
is a bare seq, so enrich auto-promotes it and needs no entry.

The promotion only works because `_kw_async_marker` is inlined at every
reference site (see `inline:`). Un-inlined, the synthesized hidden rule's
`prec(-1)` body collides with `primary_expression` / `_property_name` on
`{ async (` (method-shorthand vs async-function ambiguity) and with sibling
function rules on `'async' • 'function'`. Inlining folds the body into each
function rule's state machine — the same shape as the pre-promotion grammar —
while the FIELD wrapper survives inlining, so the parse tree still labels the
marker.

The same rule governs the other standalone optional-punct markers
(`abstract`, `const`, `await`, `readonly`): only prec-wrapped sites such as
`constructor_type` need a hand-written entry; bare-seq sites like
`construct_signature`, `type_parameter`, `for_in_statement`, and
`_parameter_name` are covered by enrich.

### `function_expression` (`packages/typescript/grammar.sittir.ts:826`)

```text
				// function_expression: prec('literal', seq(
				//   optional('async'), 'function', field('name', optional($.identifier)),
				//   $._call_signature, field('body', $.statement_block)))
```

### `function_declaration` (`packages/typescript/grammar.sittir.ts:833`)

```text
				// function_declaration: prec.right('declaration', seq(
				//   optional('async'), 'function', field('name', $.identifier),
				//   $._call_signature, field('body', $.statement_block),
				//   optional($._automatic_semicolon)))
```

### `generator_function` (`packages/typescript/grammar.sittir.ts:841`)

```text
				// generator_function: prec('literal', seq(
				//   optional('async'), 'function', '*',
				//   field('name', optional($.identifier)),
				//   $._call_signature, field('body', $.statement_block)))
```

### `generator_function_declaration` (`packages/typescript/grammar.sittir.ts:849`)

```text
				// generator_function_declaration: prec.right('declaration', seq(
				//   optional('async'), 'function', '*', field('name', $.identifier),
				//   $._call_signature, field('body', $.statement_block),
				//   optional($._automatic_semicolon)))
```

### `break_statement` (`packages/typescript/grammar.sittir.ts:861`)

```text
				// break_statement: seq('break', field('label', optional(...)),
				// _semicolon). Label the trailing `;` at pos 2.
```

### `continue_statement` (`packages/typescript/grammar.sittir.ts:867`)

```text
				// continue_statement: seq('continue', field('label', ...), _semicolon).
```

### `debugger_statement` (`packages/typescript/grammar.sittir.ts:872`)

```text
				// debugger_statement: seq('debugger', _semicolon).
```

### `do_statement` (`packages/typescript/grammar.sittir.ts:877`)

```text
				// do_statement: seq('do', field('body'), 'while', field('condition'),
				// optional(_semicolon)). Optional wrapper at pos 4; labeling as
				// a semicolon field lets the template emit it when present.
```

### `constructor_type` (`packages/typescript/grammar.sittir.ts:892`)

```text
				// constructor_type: prec.left(seq(
				//   optional('abstract'),  // pos 0  →  '0/0'  (abstract_marker)
				//   'new', type_parameters?, parameters, '=>', type))
				// prec.left wrapper hides the seq from enrich; hand-promoted here.
```

### `enum_declaration` (`packages/typescript/grammar.sittir.ts:906`)

```text
				// enum_declaration: seq(
				//   optional('const'),  // pos 0  →  '0/0'  (const_marker)
				//   'enum', name, body)
				// Kept hand-promoted because the factoryRoundtrip AST match fails
				// when only enrich auto-promotes (synthesized `_kw_const_marker`
				// content shape diverges).
```

### `function_signature` (`packages/typescript/grammar.sittir.ts:916`)

```text
				// function_signature: seq(optional('async'), 'function',
				//   field('name', ...), _call_signature,
				//   choice(_semicolon, alias(_function_signature_automatic_semicolon, ...)))
				// pos 4 is the UNNAMED terminator choice. visibleExternals makes
				// the ASI arm a real kind-keyed node, but the explicit-';' arm is
				// an anonymous token that lands in $other where the derived
				// singular slot can't reach it ("singular slot 'content' ...
				// got undefined"). Field it like type_alias_declaration's
				// grammar-authored `semicolon:` field — both arms then arrive
				// field-keyed and the terminator classifies as the same enum.
```

### `assignment_expression` (`packages/typescript/grammar.sittir.ts:930`)

```text
				// assignment_expression: prec.right('assign', seq(
				//   optional('using'),  // pos 0  →  '0/0'  (using_marker)
				//   field('left', ...), '=', field('right', ...)))
				// prec.right wrapper hides the seq from enrich; hand-promoted here.
```

### `export_specifier` (`packages/typescript/grammar.sittir.ts:938`)

```text
				// export_specifier: seq(
				//   optional(choice('type', 'typeof')),  // pos 0  →  '0/0'  (export_kind)
				//   previous)
				// Choice-of-strings: tree-sitter strips FIELD wrappers around bare
				// STRING but retains FIELD around CHOICE. The synthesized
				// `_kw_<name>` indirection in maybeKeywordSymbol only targets bare
				// STRING / OPTIONAL(STRING) shapes — falls through here unchanged
				// (CHOICE without BLANK is not handled). Risk: tree-sitter may
				// strip the FIELD around the bare-STRING choice arms.
```

### `import_specifier` (`packages/typescript/grammar.sittir.ts:951`)

```text
				// import_specifier: seq(
				//   optional(choice('type', 'typeof')),  // pos 0  →  '0/0'  (import_kind)
				//   choice(...))
				// Same caveat as export_specifier above re: choice-of-strings.
```

### `public_field_definition` (`packages/typescript/grammar.sittir.ts:959`)

```text
				// public_field_definition: seq(
				//   repeat(field('decorator', ...)),                // pos 0
				//   optional(choice(...)),                          // pos 1 (permutation: declare/accessibility orders)
				//   choice(...),                                    // pos 2 (permutation: static/override/readonly/abstract/accessor stacks)
				//   field('name', $._property_name),                // pos 3
				//   optional(choice('?', '!')),                     // pos 4  →  '4/0'  (optionality_marker)
				//   field('type', optional($.type_annotation)),    // pos 5
				//   optional($._initializer))                       // pos 6
				// `?`/`!` share one `optionality_marker` discriminator field —
				// different semantics (`?` optional field, `!` definite
				// assignment) but one slot; the literal value distinguishes.
				//
				// Positions 1 and 2 stay inline (permutation choices — no arm
				// mint); the authored `accessibility_modifier` field on both
				// pos-1 spellings makes the two exclusive occurrences merge
				// into one slot, the same way the enrich-promoted `*_marker`
				// fields merge across the permutation arms. Without the shared
				// name the two bare refs derive two positional slots that
				// collide on the `accessibility_modifier` storage key.
```

### `_type_query_subscript_expression` — deferred promotion (`packages/typescript/grammar.sittir.ts`)

Tree-sitter aliases this hidden rule to the public `subscript_expression` kind
via `alias($._type_query_subscript_expression, $.subscript_expression)`, and
the base JS `subscript_expression` already labels its `?.` with
`optional(field('optional_chain', $.optional_chain))`.

Adding `optional_chain_marker` on the hidden alias source would extend the
merged kind's field set, but the merged template (emitted from the canonical
`subscript_expression` rule) only references `optional_chain` — so the coverage
validator flags the unreferenced `optional_chain_marker` field. Promoting at
the alias source needs either coalescing both field names downstream, or
overriding the canonical rule too.

### `parenthesized_expression` (`packages/typescript/grammar.sittir.ts:1001`)

```text
				// parenthesized_expression: variant() adoption. Shape is
				// `seq('(', choice(typed_expr, sequence_expression), ')')`.
				// The inner choice's alternatives become variant-child kinds
				// that own the surrounding `(` / `)` scaffold via Link's
				// push-down; the parent template collapses to $$$CHILDREN.
				// Path 1/N targets choice alt N inside the seq's member 1.
```

### `export_statement` (`packages/typescript/grammar.sittir.ts:1012`)

```text
				// export_statement: variant() adoption on all four branches.
				// Path 0 is the JS-inherited `previous` (export default,
				// export function, export from, …); paths 1/2/3 are
				// `export type`, `export =`, `export as namespace`. Without
				// labeling path 0, its base-JS branches render without the
				// `export` prefix (parent template is just `$$$CHILDREN`,
				// which filters to named children) — the wrapper becomes
				// invisible at render time.
				//
				// `_export_statement_default`'s body is a top-level choice of
				// TWO structurally distinct shapes:
				//   arm 0 — `seq('export', choice(4 from-clause forms), _semicolon)`
				//   arm 1 — `seq(decorator, 'export', choice(declaration | default value))`
				// Splitting it further (e.g. `0/0` / `0/1` for these sub-arms)
				// just moves the non-canonical flag one level deeper — each
				// split arm STILL has inner choice-with-fields shapes
				// (specifiers, from-clause forms, default value). Adoption on
				// kinds synthesized by a parent polymorph adoption isn't
				// supported end-to-end, so deferred for future work. The
				// walker handles the shape via its per-branch + downgrade
				// logic correctly; the audit flag surfaces real adoption
				// opportunity but not a blocking bug.
```

### `call_expression` (`packages/typescript/grammar.sittir.ts:1041`)

```text
				// call_expression: variant() adoption on three per-prec
				// branches. Each branch is wrapped in `prec('call' |
				// 'template_call' | 'member')` and Link's variant hoist
				// re-wraps each extracted hidden rule in the same prec so the
				// base grammar's conflict resolution carries through.
```

### `string` (`packages/typescript/grammar.sittir.ts:1052`)

```text
				// string: variant() adoption on the quote-style choice. Base
				// grammar: `choice(seq('"', …, '"'), seq("'", …, "'"))`. The
				// walker's primary-branch-wins would always pick the first
				// (double-quoted) branch as the template, so `'x'` source
				// round-trips as `"x"` — AST mismatch. Splitting into variant
				// children (`string_double` / `string_single`) gives each its
				// own template that preserves the quote style.
				//
				// Restored 2026-07-20 (was removed in c5f7f88ff, 2026-05-12,
				// in favor of a `rules:` rewrite using `refine()` to
				// correlate an uncorrelated flat seq — see that rule's
				// former doc comment for the intent). refine() is
				// authoring-only metadata (packages/codegen/src/dsl/primitives/refine.ts)
				// and never constrains the actual generated parser: the
				// rewritten grammar left `unescaped_double_string_fragment`
				// and `unescaped_single_string_fragment` lexically reachable
				// in the SAME parser state regardless of which quote char
				// opened the string, so tree-sitter's longest-match lexer
				// could pick the wrong fragment token and consume past the
				// intended closing quote — every plain string literal
				// produced ERROR (rust/crates/sittir-parity-tests/tests/native_parser.rs's
				// `typescript_lexical_declaration_reads_override_named_fields`,
				// confirmed via `tree-sitter parse` on the compiled parser
				// directly, no read/transport layer involved). This variant
				// split leaves the base grammar's already-correlated
				// `choice(seq('"',…,'"'), seq("'",…,"'"))` untouched — the
				// quote literal and its matching fragment token are baked
				// into the same seq branch, so there's no cross-branch
				// lexical ambiguity for tree-sitter to resolve at runtime.
```

### `update_expression` (`packages/typescript/grammar.sittir.ts:1086`)

```text
				// update_expression: postfix vs prefix `++` / `--`.
```

### `visibleExternals` (`packages/typescript/grammar.sittir.ts:1092`)

```text
			// Sittir-side rule bodies for external scanner symbols. The grammar's
			// external scanner triggers ASI (Automatic Semicolon Insertion) by
			// producing `_automatic_semicolon` and `_function_signature_automatic_semicolon`
			// as zero-width terminator tokens. Every `SYMBOL` reference to
			// either name gets wrapped in a named visible alias
			// (`alias($._automatic_semicolon, $.automatic_semicolon)`, etc.)
			// under both runtimes, so tree-sitter materializes a real CST node
			// for the ASI marker instead of it vanishing invisibly into its
			// referencing rule (proven via a scratch parser: aliasing a
			// zero-width external to a named node yields a
			// `[0,15]-[0,15]`-spanning CST node at every insertion point, with
			// no change to the LR tables). `string('\n')` (not `';'`) is the
			// round-trip-stable render — it re-parses to the SAME
			// automatic_semicolon node, whereas `';'` would flip the node type
			// on re-parse.
```

### `expectTestFailures` (`packages/typescript/grammar.sittir.ts:1111`)

```text
			// Known-failing generated nodes.test.ts kinds — tracked defects, not
			// silenced mysteries. Remove an entry + regen when its issue is fixed.
```

### `expectDiagnostics` (`packages/typescript/grammar.sittir.ts:1120`)

```text
			// PR 3 (2026-07-21 union-slot design): `_export_statement_group2` is an
			// orphaned duplicate — enrich's raw clause-hoist mint of
			// `_export_statement_default`'s `from_arm` position, superseded once
			// the nested `patches:` entry (`_export_statement_default`
			// → `_export_statement_default_from_arm`) properly splits the SAME
			// content under its own name (transform.ts's ALIAS-rename deposit now
			// repoints the live alias there). `_export_statement_group2` is
			// provably unreachable from `export_statement` but assemble's
			// diagnostics still scan it like live structure — see
			// docs/KNOWN_ISSUES.md's "Assemble-time grammar diagnostics scan
			// every `rules` map entry, including ones unreachable from any
			// top-level kind" for the principled (reachability-based) fix,
			// tracked there rather than implemented here.
```

### `_reserved_identifier` (`packages/typescript/grammar.sittir.ts:1137`)

```text
				// _reserved_identifier — upstream shape is
				// `(_, previous) => choice(...18 TS-specific bare strings,
				// previous)`, where `previous` is the base JS grammar's own
				// `_reserved_identifier` (get/set/async/static/export/let),
				// left NESTED as a sub-CHOICE member rather than flattened.
				// That nesting blocks classifyHiddenChoiceRule's ENUM
				// admission (requires flat SYMBOL/STRING/named-ALIAS members
				// only — mirrors rust's `_non_special_token` REPEAT1 case,
				// specs/026), so `_reserved_identifier` stays unclassified
				// (rule.type=CHOICE, "mixed/structural — survive as-is") and
				// inlines directly into `_property_identifier`'s occurrence
				// with no node of its own — which is what lets
				// `_property_identifier`'s alias (`statement_identifier_group1`)
				// collapse into a text-only leaf when the matched alternative
				// is one of these bare reserved words, hitting the same
				// anonymous-token-fusion path the wrap.ts fallback exists for.
				// Flatten programmatically (not hardcoding the string list,
				// so this stays correct if upstream's own list ever changes).
```

### `jsx_namespace_name` (`packages/typescript/grammar.sittir.ts:1194`)

```text
				// optional_parameter: position 0 is the hidden `_parameter_name`
				// helper which tree-sitter inlines — its `decorator`, `pattern`, and
				// `name` fields promote onto the parent at parse time. The former
				// override wrapped pos 0 as a synthetic `parameter_name` slot that
				// doesn't exist at runtime, clobbering all five declared fields.
				// Positions 1/2/3 (the `?`, the type field, and the initializer)
				// are already correctly structured in the base rule.
				// jsx_namespace_name — base is `seq($._jsx_identifier, ':',
				// $._jsx_identifier)`: an XML-namespace-style `<ns:name>` JSX
				// tag/attribute head where BOTH positions are the same
				// `_jsx_identifier` kind but distinct structural roles. Neither
				// is field-named upstream, so both collapse to the same
				// kind-derived storageName. Field them by role (`namespace` /
				// `name`) — two genuinely distinct positions, not a union.
```

### `public_field_definition` (`packages/typescript/grammar.sittir.ts:1224`)

```text
				// public_field_definition: pos 0 is decorator repeat (real base
				// field). The original override labeled pos 0 as
				// accessibility_modifier, clobbering decorator. Dropped entirely —
				// the internal accessibility/override-modifier slots are deep inside
				// nested choices and don't have stable raw positions.
```

### `required_parameter` (`packages/typescript/grammar.sittir.ts:1231`)

```text
				// required_parameter: same shape as optional_parameter modulo the
				// `?` — drop the synthetic `parameter_name` wrapper override and
				// let the walker inline the `_parameter_name` helper's fields.
```

### `object_type` (`packages/typescript/grammar.sittir.ts:1236`)

```text
				// object_type — full manual rewrite (deviates from author intent).
				// Upstream is
				//   seq(brace,
				//       optional(seq(
				//         optional(choice(',', ';')),                       // leading sep
				//         sepBy1(choice(',', $._semicolon), member),        // the list
				//         optional(choice(',', $._semicolon)))),            // trailing sep
				//       brace)
				// which folds the `,`-vs-`;` delimiter choice AND both flanking
				// separators into one opaque body. Under the value-bearing-slot
				// model the flanking `optional(choice(...))` survive as phantom
				// unnamed `content` slots (a choice is a nonterminal), so the
				// renderer emits stray separators (`{ , … , }`).
				//
				// Re-express the intent explicitly: a curly/flow brace pair around
				// an optional `object_type_content`, where the content is a
				// comma-delimited OR semicolon-delimited member list. Splitting the
				// two delimiter forms makes each form's flanking separators BARE
				// strings (`optional(',')` / `optional(';')`), which the
				// leading/trailing separator fold absorbs into the list repeat's
				// `leading`/`trailing` flags — no phantom content slot. A VISIBLE
				// `object_type_content` rule (not a hidden group) gives tree-sitter
				// real LR states to disambiguate `,` vs `;` at parse time.
				//
				// The brace pair is modeled with `refine` curly/flow forms (NOT a
				// bare `choice(seq(...), seq(...))` and NOT `variant()`): a bare
				// choice distributes to just the shared `content` slot and DROPS
				// the `{`/`{|`/`}`/`|}` differentiating literals from the render
				// template, and `variant()` does not transpile to grammar.js in a
				// full rule replacement (`Invalid rule: [object Object]`). `refine`
				// declares two correlated named forms so the opening/closing brace
				// pair agrees (`{ }` curly, `{| |}` flow) and both literals are
				// auto-stamped, restoring `ir.objectType.curly()` / `.flow()`.
```

### `object_type_content` (`packages/typescript/grammar.sittir.ts:1282`)

```text
				// object_type_content — a single visible rule whose separator is
				// itself a nonterminal `choice(',', ';')`. Under the separator-as-
				// slot model (docs/superpowers/specs/2026-07-12-separator-as-slot-
				// design.md), a rule-shaped separator's per-instance kind is
				// captured on the wire (`_separator_kind`) and resynthesized at
				// render time from a compile-time KindId→literal match — so one
				// shared rule can correctly preserve either delimiter, unlike the
				// old comma/semi split this replaces (which needed two rules only
				// because the previous model could store just one compile-time-
				// constant separator string per rule). This also lets a genuinely
				// mixed-delimiter instance (`{ a, b; c }`, legal upstream) parse
				// and round-trip instead of hitting an ERROR node, though a mixed
				// instance's per-gap delimiter choice isn't individually preserved
				// (`_separator_kind` assumes a uniform separator — out of scope,
				// see the design doc).
```

### `interface_body` — no override possible (`packages/typescript/grammar.sittir.ts`)

`interface_body` is a tree-sitter alias target of `object_type`; it has no base
rule of its own, so there is nothing an override callback can refine. It
inherits its parse shape from `object_type`. Per-form factory support for
`interface_body` would need a codegen pass that mirrors `object_type`'s
`refineForms` onto the alias-target kind.
