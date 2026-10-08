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
surface matches the reparse target — the upstream typescript wasm is the non-tsx
wasm. Pointing it at `tsx/grammar.js` is harmless for a non-JSX corpus but a
latent mismatch: anything JSX-shaped would reparse-fail. One grammar,
end-to-end.

### `sittirGrammar(base, …)` (`packages/typescript/grammar.sittir.ts:25`)

`export default sittirGrammar(base, {…})` composes the grammar in one call:
enrich runs over the upstream base with the config's authored `groups:`
patterns visible, so it declines any group a pattern covers; wire runs over
that enriched base; `grammar()` receives both. There is no separate enriched
binding to hand to two places, so the base wire sees and the base tree-sitter
compiles cannot drift apart.

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

`_kw_readonly` and `_kw_async` are NOT listed: `wire()`
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
				// provably-unreachable orphan. `sittirGrammar`'s dead-mint pass
				// (`blankDeadEnrichMints`) blanks every enrich mint the final
				// grammar does not reach, so the orphan is pruned before codegen.
				// Folding the ENTIRE `_export_statement_default`
				// cascade into ONE patches entry with deep, multi-level string
				// paths — same idiom `class_body`'s
				// `'1/0/0'`/`'1/0/1'`/`'1/0/3'` entry above already uses — means
				// `_export_statement_default` is fully materialized in ONE
				// resolvePatch call, instead of
				// leaving a nested raw mint behind for a LATER, separate
				// resolvePatch call to orphan. Produces the exact same final kind
				// names as the 3 cascaded entries did.
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

The bare `';'` arm (a stray member-separator semicolon) is minted as its own
hidden leaf kind by `'1/0/4': alias('empty_member')`: `_empty_member` over
`';'`, shown as `empty_member`. The mint keeps read identity (the node's
grammar symbol is `_empty_member`, not the shared `';'` token) and does not
collide with upstream's `_semicolon` (the automatic-semicolon rule).

The repeat is fielded `members` by the second patch set. Its element choice
is the hidden supertype `_class_body_member` (owner plus the singular of the
slot name). The three sequence arms are its kinds `class_body_member_method`,
`class_body_member_method_sig` and `class_body_member_declaration`, named by
the `variant()` patches of the third set; `class_static_block` and
`empty_member` are members of the supertype as they are. Every arm is a
variant of the supertype, none of `class_body`. The separator binding
addresses the slot as `class_body/members:/separator`.

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
arms' keyword steps to shared `field('<kw>', $._kw_*)` markers. The
merged slots (`declare`, `static`, `readonly`,
`abstract`, `accessor`, plus the `accessibility_modifier` /
`override_modifier` node slots) land directly on the kind; the template emits
them once each, in canonical flat order. The former per-arm kinds and their
`inline:`/conflict machinery are gone — the class-member ambiguities against
`public_field_definition` itself are derived conflicts.

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
				// field renders from its own slot.
				// The name+type_arguments arm is NOT written out inline: enrich's group
				// lift has already hoisted it into `_jsx_start_opening_element_group1`
				// (aliased visible) by the time pattern replacement compares bodies, so
				// the post-enrich sub-tree this pattern must equal holds that alias ref.
				// The old inline-seq form silently matched nothing (caught by
				// `body-pattern-zero-match`).
```

### `class_body` (`packages/typescript/grammar.sittir.ts:471`)

```text
				// class_body: repeat-choice arm 3 is the upstream inline
				// `seq(choice(4 sigs), choice(_semicolon | ','))` that sittir extracts
				// into `class_body_member_declaration` — both positions unnamed → 2
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
				//   optional('?'),                          // pos 5  →  '5/0'  (optional)
				//   $._call_signature)                      // pos 6
				// Symmetric to
				// method_definition / method_signature for the trailing `?` plus
				// the accessor keyword. NOTE: no readonly — `'abstract'` is
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
				//   optional('static'),                    // pos 1  (auto-promoted: static by enrich)
				//   optional($.override_modifier),         // pos 2  →  'override' (field patch; kind stays override_modifier)
				//   optional('readonly'),                  // pos 3  (auto-promoted: readonly by enrich)
				//   optional('async'),                     // pos 4  (auto-promoted: async by enrich)
				//   optional(choice('get','set','*')),    // pos 5  →  '5/0'  (accessor_kind, choice-of-strings)
				//   field('name', $._property_name),       // pos 6
				//   optional('?'),                         // pos 7  →  '7/0'  (optional)
				//   $._call_signature,                     // pos 8
				//   field('body', $.statement_block)))    // pos 9
				// Label the
				// accessor `get`/`set`/`*` and trailing `?` so render preserves
				// `async get foo?(): T {}` shapes. Naming follows `<token>`;
				// enrich's CHOICE-form-of-optional path doesn't
				// fire on tree-sitter-evaluated rules so these positions are
				// hand-promoted. `readonly`
				// is promoted too, with one extra step: the synthesized
				// `_kw_readonly` hidden symbol's parse precedence diverges
				// from the bare `'readonly'` token in sibling rules — `class Foo
				// { readonly bar?(): T {} }` would otherwise parse as ERROR (the parser takes
				// `readonly` as the property identifier instead of the marker).
				// Hence `_kw_readonly` is in the top-level
				// `inline:` array (see above), which folds the hidden rule's body
				// into every reference site at LR-table generation while preserving
				// the FIELD wrapper for the parse tree.
```

### `method_signature` (`packages/typescript/grammar.sittir.ts:663`)

```text
				// method_signature: seq(
				//   optional($.accessibility_modifier),    // pos 0  (auto-promoted: accessibility_modifier by enrich)
				//   optional('static'),                    // pos 1  →  'static'
				//   optional($.override_modifier),         // pos 2  →  'override' (field patch; kind stays override_modifier)
				//   optional('readonly'),                  // pos 3  (auto-promoted: readonly by enrich)
				//   optional('async'),                     // pos 4  (auto-promoted: async by enrich)
				//   optional(choice('get','set','*')),    // pos 5  →  '5/0'  (accessor_kind, choice-of-strings)
				//   field('name', $._property_name),       // pos 6
				//   optional('?'),                         // pos 7  →  '7/0'  (optional)
				//   $._call_signature)                     // pos 8
				// Standalone `optional('readonly')` / `optional('async')` are
				// auto-promoted by enrich. Kept entries: accessor_kind
				// (choice-of-strings, enrich skips), optional
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

### `property_signature` (`packages/typescript/grammar.sittir.ts:699`)

```text
				// property_signature: seq(
				//   optional($.accessibility_modifier),  // pos 0  (auto-promoted: accessibility_modifier by enrich)
				//   optional('static'),                   // pos 1  →  'static'
				//   optional($.override_modifier),         // pos 2  →  'override' (field patch; kind stays override_modifier)
				//   optional('readonly'),                  // pos 3  (auto-promoted: readonly by enrich)
				//   field('name', $._property_name),       // pos 4
				//   optional('?'),                         // pos 5  →  '5/0'  (optional)
				//   field('type', optional($.type_annotation)))  // pos 6
				// Standalone `optional('readonly')` is auto-promoted by enrich.
				// Kept entries: optional (`?` non-identifier).
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
				// statement_block: 1 field(s)
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
				// template emits `{{ semicolon }}`. Without the label, readUntypedNode
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

### `function_signature` (`packages/typescript/grammar.sittir.ts`, `patches`)

`function_signature: { 4: field('semicolon') }`. The base rule is
`seq(optional('async'), 'function', field('name'), _call_signature,
choice(_semicolon, _function_signature_automatic_semicolon))`; position 4 is
the terminator choice, fielded so the explicit `;` and the automatic semicolon
land in one slot.

### JS-inherited function family — `async` promotion (`packages/typescript/grammar.sittir.ts`)

`function_expression`, `function_declaration`, `generator_function`, and
`generator_function_declaration` all start with `optional('async')` at
position 0. Enrich's optional-keyword pass fields it as `async`, the
same as `arrow_function`, so render preserves `async function …` /
`async function* …` shapes; no `patches:` entry names it.

The promotion only works because `_kw_async` is inlined at every
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
				//   optional('abstract'),  // pos 0  (auto-promoted: abstract by enrich)
				//   'new', type_parameters?, parameters, '=>', type))
```

### `enum_declaration` (`packages/typescript/grammar.sittir.ts:906`)

```text
				// enum_declaration: seq(
				//   optional('const'),  // pos 0  (auto-promoted: const by enrich)
				//   'enum', name, body)
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
				//   optional('using'),  // pos 0  (auto-promoted: using by enrich)
				//   field('left', ...), '=', field('right', ...)))
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
				//   optional(choice('?', '!')),                     // pos 4  →  '4/0'  (optionality)
				//   field('type', optional($.type_annotation)),    // pos 5
				//   optional($._initializer))                       // pos 6
				// `?`/`!` share one `optionality` discriminator field —
				// different semantics (`?` optional field, `!` definite
				// assignment) but one slot; the literal value distinguishes.
				//
				// Positions 1 and 2 stay inline (permutation choices — no arm
				// mint); the authored `accessibility_modifier` field on both
				// pos-1 spellings makes the two exclusive occurrences merge
				// into one slot, the same way the enrich-promoted keyword
				// fields merge across the permutation arms. Without the shared
				// name the two bare refs derive two positional slots that
				// collide on the `accessibility_modifier` storage key.
```

### `_type_query_subscript_expression` (`packages/typescript/grammar.sittir.ts`)

Tree-sitter aliases this hidden rule to the public `subscript_expression` kind
via `alias($._type_query_subscript_expression, $.subscript_expression)`, and
the base JS `subscript_expression` already labels its `?.` with
`optional(field('optional_chain', $.optional_chain))`.

This rule's `?.` is a bare literal. It is aliased `optional_chain_marker` to
give it a kind, and fielded `optional_chain` so its slot is `optionalChain`,
the same as `subscript_expression`'s. The alias kind keeps its own name:
`optional_chain` is already the kind of the canonical rule's `?.`. The alias
and the field are two patch sets on the same position, because a position
takes one patch per set.

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

### `export_statement_default` unfielded declaration arms (`packages/typescript/grammar.sittir.ts`)

```text
				// export_statement_default: paths `1/2/0` and `1/2/1/1/0` replace
				// the `field('declaration', $.declaration)` arm of the two
				// declaration-or-value choices with the bare `$.declaration`
				// symbol (a literal rule object). Each choice is one union slot:
				// its other arm is a lifted group (`default_kw`, then `value`), so
				// the slot spans two kinds and is stored as `content`. With the
				// field in place the parser reported the declaration under the
				// label `declaration` while storage held it in `content`, and the
				// reader needed a field-label route into the slot; unfielded, the
				// arm is routed by kind like its sibling and the parser and storage
				// agree. Both paths are needed: removing one leaves that kind's
				// label route.
```

### `call_expression` (`packages/typescript/grammar.sittir.ts:1041`)

```text
				// call_expression: variant() adoption on three per-prec
				// branches. Each branch is wrapped in `prec('call' |
				// 'template_call' | 'member')` and Link's variant hoist
				// re-wraps each extracted hidden rule in the same prec so the
				// base grammar's conflict resolution carries through.
```

### `string` (`packages/typescript/grammar.sittir.ts`, `patches`)

`string: [{ '0/2': token.immediate('"'), '1/2': token.immediate("'") }, { 0: variant('double'), 1: variant('single') }]`.
The base rule is `choice(seq('"', …, '"'), seq("'", …, "'"))`. The first set
makes each closing quote immediate, so the render glues it to the last fragment
(without it `"baz"` renders `" baz "`); the fragments already absorb every
character the closing token could follow, so the parse table is unchanged. The
second set splits the arms into `string_double` / `string_single`, giving each
quote style its own template; it comes second so the paths in the first set
still address the unsplit arms. Keeping the quote literal and its fragment
token inside one arm leaves no cross-arm lexical ambiguity.

### Template delimiters (`packages/typescript/grammar.sittir.ts`, `patches`)

`template_string: { 2: token.immediate('`') }`,
`template_literal_type: { 2: token.immediate('`') }`,
`template_type: { 0: token.immediate('${'), 1: field('type') }`,
`template_substitution: { 0: token.immediate('${'), 1: field('expression') }`.
The closing backtick is immediate for the same reason as `string`'s closing
quote. The opening `${` is immediate so the render never spaces it from a
preceding fragment: `$` is word-class, so without the stamp the seam before
the substitution is a runtime-varying option site, and in `template_literal_type`
the seam after the opening backtick becomes a spaced-by-default `bquote_after`
option. `field('type')` names `template_type`'s `choice(primary_type,
infer_type)`; fielding it keeps enrich from splitting the kind into variants.
`field('expression')` names the substitution's `_expressions`.

### `update_expression` (`packages/typescript/grammar.sittir.ts:1086`)

```text
				// update_expression: postfix vs prefix `++` / `--`.
```

### `options` — `literal_type_negative_number` (`packages/typescript/grammar.sittir.ts`)

The sign of a negative-number literal type binds tight to its number
(`-1`, not `- 1`). The site is the variant's `operator:/after` seam: the
upstream `_number` rule is hidden and spliced into the variant, so its
operator field is addressed there.

### `options` — `unary_expression`

`operator:/after` is tight, so a factory-built `unary_expression` renders
`!x`, `-x`, `~x`. The preference addresses the slot's punctuation values
only: a keyword operator keeps its word seam (`typeof x`, `typeof (x)`,
`typeof -x`, `void 0`). A repeated sign stays spaced (`- -x`, `+ +x`,
`- --x`): the render crate guards the `-|-` and `+|+` seams, because `--` and
`++` can begin what directly follows a unary `-` or `+`, and a tight site
still takes that lexical space.

### `options` — `update_expression_postfix` / `update_expression_prefix`

The update operator binds tight to its operand: `operator:/before` on the
postfix variant (`x++`), `operator:/after` on the prefix variant (`--x`).
Upstream spells both operators as an inline `choice('++', '--')` in each
arm, so the operator is a slot of the variant itself and takes the
grammar-wide `operator:` spacing unless its variant says otherwise.

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
			// no change to the LR tables). `string('\n')` is the round-trip-stable
			// render: a whitespace-only fixed text is emitted as a whitespace-token
			// payload,
			// so the newline gap after the statement absorbs it, a blank-line gap
			// outranks it, and a break the source relied on (`try {}` then
			// `catch` on the next line) survives so the render re-parses to the
			// SAME automatic_semicolon node. `''` would lose that break and `';'`
			// would flip the node type on re-parse; neither is a newline role,
			// which would strip the node from the `terminator` choice it is an
			// arm of and leave that slot without a value.
```

### `expectDiagnostics` (`packages/typescript/grammar.sittir.ts`)

The `rule-reauthored-without-cause` floor: `rules:` entries that replace an
upstream rule whose shape no current diagnostic provokes. Each stays because
deleting it (so the upstream body stands) makes the output worse; the floor
only shrinks, and an entry leaves when its detector lands.

- `object_type` (declared `'ambiguity'`, unverified: no detector): without it, generate blocks on
  `storagename-collision` / `content-collision` on `object_type`. missing detector: 'ambiguity' ← a tree-sitter generate conflict on the upstream.

Shape floors (the compiler has no model for these shapes yet; each blocks
without its entry):

- `unclassifiable-shape` on `binary_expression` and `public_field_definition`:
  a choice with structured arms beside leaves. Resolve with `rule(name, body)`
  in `patches:` naming the structured arm as its own rule.
- `union-slot-mixed-row` on `binary_expression`: a singular row with a
  structured named arm beside union arms. Resolve with `variant(name)`
  splitting the row, until the structured-arm enrich mint gives each
  structured arm its own kind in the union slot.

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
