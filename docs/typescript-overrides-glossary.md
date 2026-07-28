# TypeScript Overrides Glossary

Per-rule reference for `packages/typescript/overrides.ts`: every named rule
override, conflict, and precedence declaration significant enough to need
explanation. Each entry covers what the rule/conflict addresses, why it's
needed (the specific ambiguity or shape mismatch), and what would break if
it were removed.

See [AGENTS.md § Wave-style decomposition before commits](../AGENTS.md) for
the convention this glossary exists to serve — long rationale comments in
`overrides.ts` move here instead of living inline.

---

### `conflicts` (`packages/typescript/overrides.ts:31`)

```text
			// Conflict markers for variant() adoption on kinds where splitting
			// exposes LR(1) ambiguities the unsplit grammar resolved via shared
			// state. Each entry names two or more rules tree-sitter should
			// treat as requiring a GLR state so it can defer the decision
			// until more input disambiguates. Hidden (`_foo`) and visible
			// (`$.foo`) names are both valid here.
			// `previous` is the TS grammar's own conflicts list (which
			// itself concats the JS base's conflicts). Concat so we don't
			// drop the base entries — we only ADD the new ones required by
			// variant() adoption.
```

### `inline` (`packages/typescript/overrides.ts:232`)

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

### `_export_statement_default` (`packages/typescript/overrides.ts:305`)

```text
				// PR 3 (2026-07-21 union-slot design): `_export_statement_default`
				// used to be split via 3 SEPARATE, CASCADED polymorphs entries
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
				// cascade into ONE polymorphs entry with deep, multi-level string
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

### `class_body` (`packages/typescript/overrides.ts:363`)

```text
				// class_body body: `seq('{', repeat(choice(5 arms)), '}')`.
				// Inner repeat-choice has 3 heterogeneous seqs, 1 bare symbol
				// (class_static_block), 1 bare literal (';'). Split the 3 seqs
				// so the choice becomes symbol-like across all arms.
```

### `_for_header` (`packages/typescript/overrides.ts:373`)

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

### `public_field_definition` (`packages/typescript/overrides.ts:387`)

```text
				// public_field_definition body position 1:
				//   optional(choice(
				//     seq('declare', optional(accessibility_modifier)),
				//     seq(accessibility_modifier, optional(field('declare', _kw_declare))),
				//   ))
				// Split both arms and INLINE the synthesized hidden rules (see
				// `inline:` below). Inlining is critical here: the `access_first`
				// arm reduces to "just accessibility_modifier" which conflicts
				// with every class-member rule sharing that prefix
				// (`method_definition`, `method_signature`,
				// `abstract_method_signature`). Keeping them as standalone
				// hidden rules produces an unresolvable LR state that
				// tree-sitter can't disambiguate via conflict groups alone.
				// Inlining folds each arm's body back into `public_field_definition`'s
				// state machine — the LR table looks exactly like the pre-split
				// grammar at the conflict site, while sittir's derive-audit
				// still sees the post-polymorph shape (all-alias choice) as
				// canonical. Variant adoption stays a pure sittir-side concern;
				// tree-sitter parses the same tree as before.
```

### `1/0/0/0` (`packages/typescript/overrides.ts:407`)

```text
					// Paths carry an extra '/0' hop at position 1 vs. the raw base
					// shape ('1/0/0/0' not '1/0/0') because `transforms:` below wraps
					// position 1 in `field('visibility_prefix', …)` — transforms
					// compose innermost, polymorphs outermost (see wire.ts), so these
					// polymorph paths address the ALREADY-field-wrapped tree. FIELD is
					// a single-content wrapper (like OPTIONAL) that consumes one
					// index-0 hop to descend into its content, shifting every path
					// under position 1 by one segment.
```

### `2/0` (`packages/typescript/overrides.ts:417`)

```text
					// Position 2: a four-arm modifier choice (heterogeneous).
```

### `jsx_opening_element_content` (`packages/typescript/overrides.ts:425`)

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

### `arguments` (`packages/typescript/overrides.ts:448`)

```text
				// Naked-choice field names (was unresolvable `content` slots).
```

### `class_body` (`packages/typescript/overrides.ts:471`)

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

### `1/0/1/1` (`packages/typescript/overrides.ts:480`)

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

### `abstract_class_declaration` (`packages/typescript/overrides.ts:492`)

```text
				// abstract_class_declaration: wrap pos 5 (class_heritage choice).
				// pos 0 is REPEAT(field('decorator')) — don't touch it, it's a real
				// base-grammar field and the original override clobbered it.
```

### `abstract_method_signature` (`packages/typescript/overrides.ts:497`)

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

### `ambient_declaration` (`packages/typescript/overrides.ts:514`)

```text
				// ambient_declaration: split the heterogeneous declaration choice
				// so each arm owns its own literal scaffold (`declare global …`,
				// `declare module.<name>: <type>;`, or direct declaration).
```

### `array_type` (`packages/typescript/overrides.ts:524`)

```text
				// array_type: 1 field(s)
```

### `as_expression` (`packages/typescript/overrides.ts:527`)

```text
				// as_expression: 2 field(s)
```

### `asserts_annotation` (`packages/typescript/overrides.ts:532`)

```text
				// asserts_annotation: 1 field(s)
```

### `await_expression` (`packages/typescript/overrides.ts:537`)

```text
				// await_expression: 1 field(s)
```

### `class` (`packages/typescript/overrides.ts:540`)

```text
				// class: wrap pos 4 (class_heritage choice). pos 0 is decorator repeat.
```

### `class_declaration` (`packages/typescript/overrides.ts:543`)

```text
				// class_declaration: wrap pos 4 (class_heritage choice) and pos 6
				// (automatic_semicolon choice). pos 0 is decorator repeat — leave it
				// alone so the base 'decorator' field survives.
```

### `computed_property_name` (`packages/typescript/overrides.ts:550`)

```text
				// computed_property_name: 1 field(s)
```

### `else_clause` (`packages/typescript/overrides.ts:553`)

```text
				// else_clause: 1 field(s)
```

### `enum_body` (`packages/typescript/overrides.ts:556`)

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

### `flow_maybe_type` (`packages/typescript/overrides.ts:570`)

```text
				// flow_maybe_type: 1 field(s)
```

### `import_alias` (`packages/typescript/overrides.ts:573`)

```text
				// import_alias: 3 field(s)
```

### `import_attribute` (`packages/typescript/overrides.ts:580`)

```text
				// import_attribute: 1 field(s)
```

### `import_require_clause` (`packages/typescript/overrides.ts:585`)

```text
				// import_require_clause: 1 field(s)
```

### `import_statement` (`packages/typescript/overrides.ts:588`)

```text
				// import_statement: 4 field(s)
```

### `index_type_query` (`packages/typescript/overrides.ts:595`)

```text
				// index_type_query: 1 field(s)
```

### `infer_type` (`packages/typescript/overrides.ts:598`)

```text
				// infer_type: 2 field(s)
```

### `instantiation_expression` (`packages/typescript/overrides.ts:604`)

```text
				// instantiation_expression: 1 field(s)
```

### `interface_declaration` (`packages/typescript/overrides.ts:607`)

```text
				// interface_declaration: 1 field(s)
```

### `intersection_type` (`packages/typescript/overrides.ts:610`)

```text
				// intersection_type: 2 field(s)
```

### `lexical_declaration` (`packages/typescript/overrides.ts:616`)

```text
				// lexical_declaration: 2 field(s)
```

### `lookup_type` (`packages/typescript/overrides.ts:622`)

```text
				// lookup_type: 2 field(s)
```

### `method_definition` (`packages/typescript/overrides.ts:627`)

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

### `method_signature` (`packages/typescript/overrides.ts:663`)

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

### `namespace_import` (`packages/typescript/overrides.ts:685`)

```text
				// namespace_import: 1 field(s)
```

### `non_null_expression` (`packages/typescript/overrides.ts:688`)

```text
				// non_null_expression: 1 field(s)
```

### `program` (`packages/typescript/overrides.ts:693`)

```text
				// program: 2 field(s)
```

### `property_signature` (`packages/typescript/overrides.ts:699`)

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

### `satisfies_expression` (`packages/typescript/overrides.ts:716`)

```text
				// satisfies_expression: 2 field(s)
```

### `spread_element` (`packages/typescript/overrides.ts:721`)

```text
				// spread_element: 1 field(s)
```

### `statement_block` (`packages/typescript/overrides.ts:724`)

```text
				// statement_block: 2 field(s)
```

### `type_assertion` (`packages/typescript/overrides.ts:730`)

```text
				// type_assertion: 2 field(s)
```

### `type_predicate_annotation` (`packages/typescript/overrides.ts:733`)

```text
				// type_predicate_annotation: 1 field(s)
```

### `union_type` (`packages/typescript/overrides.ts:738`)

```text
				// union_type: 2 field(s)
```

### `variable_declaration` (`packages/typescript/overrides.ts:744`)

```text
				// variable_declaration: 2 field(s)
```

### `yield_expression` (`packages/typescript/overrides.ts:750`)

```text
				// yield_expression: 1 field(s)
```

### `expression_statement` (`packages/typescript/overrides.ts:755`)

```text
				// expression_statement: label the trailing `_semicolon` so the
				// template emits `{{ semicolon }}`. Without the label, readNode
				// captures the anon `;` child but the parent template's
				// `{{ children | join(" ") }}` filters to NAMED-only children
				// and the `;` drops. Grammar: `seq(_expressions, _semicolon)`.
```

### `type_alias_declaration` (`packages/typescript/overrides.ts:764`)

```text
				// type_alias_declaration: same semicolon-drop pattern. Grammar:
				// `seq('type', field('name'), optional(type_parameters), '=',
				// field('value'), _semicolon)` — label pos 5.
```

### `return_statement` (`packages/typescript/overrides.ts:771`)

```text
				// return_statement: seq('return', optional(_expressions),
				// _semicolon). Label pos 2.
```

### `throw_statement` (`packages/typescript/overrides.ts:777`)

```text
				// throw_statement: seq('throw', _expressions, _semicolon).
```

### `function_signature` (`packages/typescript/overrides.ts:782`)

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

### `function_expression` (`packages/typescript/overrides.ts:826`)

```text
				// function_expression: prec('literal', seq(
				//   optional('async'), 'function', field('name', optional($.identifier)),
				//   $._call_signature, field('body', $.statement_block)))
```

### `function_declaration` (`packages/typescript/overrides.ts:833`)

```text
				// function_declaration: prec.right('declaration', seq(
				//   optional('async'), 'function', field('name', $.identifier),
				//   $._call_signature, field('body', $.statement_block),
				//   optional($._automatic_semicolon)))
```

### `generator_function` (`packages/typescript/overrides.ts:841`)

```text
				// generator_function: prec('literal', seq(
				//   optional('async'), 'function', '*',
				//   field('name', optional($.identifier)),
				//   $._call_signature, field('body', $.statement_block)))
```

### `generator_function_declaration` (`packages/typescript/overrides.ts:849`)

```text
				// generator_function_declaration: prec.right('declaration', seq(
				//   optional('async'), 'function', '*', field('name', $.identifier),
				//   $._call_signature, field('body', $.statement_block),
				//   optional($._automatic_semicolon)))
```

### `break_statement` (`packages/typescript/overrides.ts:861`)

```text
				// break_statement: seq('break', field('label', optional(...)),
				// _semicolon). Label the trailing `;` at pos 2.
```

### `continue_statement` (`packages/typescript/overrides.ts:867`)

```text
				// continue_statement: seq('continue', field('label', ...), _semicolon).
```

### `debugger_statement` (`packages/typescript/overrides.ts:872`)

```text
				// debugger_statement: seq('debugger', _semicolon).
```

### `do_statement` (`packages/typescript/overrides.ts:877`)

```text
				// do_statement: seq('do', field('body'), 'while', field('condition'),
				// optional(_semicolon)). Optional wrapper at pos 4; labeling as
				// a semicolon field lets the template emit it when present.
```

### `constructor_type` (`packages/typescript/overrides.ts:892`)

```text
				// constructor_type: prec.left(seq(
				//   optional('abstract'),  // pos 0  →  '0/0'  (abstract_marker)
				//   'new', type_parameters?, parameters, '=>', type))
				// prec.left wrapper hides the seq from enrich; hand-promoted here.
```

### `enum_declaration` (`packages/typescript/overrides.ts:906`)

```text
				// enum_declaration: seq(
				//   optional('const'),  // pos 0  →  '0/0'  (const_marker)
				//   'enum', name, body)
				// Kept hand-promoted because the factoryRoundtrip AST match fails
				// when only enrich auto-promotes (synthesized `_kw_const_marker`
				// content shape diverges).
```

### `function_signature` (`packages/typescript/overrides.ts:916`)

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

### `assignment_expression` (`packages/typescript/overrides.ts:930`)

```text
				// assignment_expression: prec.right('assign', seq(
				//   optional('using'),  // pos 0  →  '0/0'  (using_marker)
				//   field('left', ...), '=', field('right', ...)))
				// prec.right wrapper hides the seq from enrich; hand-promoted here.
```

### `export_specifier` (`packages/typescript/overrides.ts:938`)

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

### `import_specifier` (`packages/typescript/overrides.ts:951`)

```text
				// import_specifier: seq(
				//   optional(choice('type', 'typeof')),  // pos 0  →  '0/0'  (import_kind)
				//   choice(...))
				// Same caveat as export_specifier above re: choice-of-strings.
```

### `public_field_definition` (`packages/typescript/overrides.ts:959`)

```text
				// public_field_definition: seq(
				//   repeat(field('decorator', ...)),                // pos 0
				//   optional(choice(...)),                           // pos 1 (POLYMORPHED — declare_first / access_first)
				//   choice(...),                                     // pos 2 (POLYMORPHED — static_mods / abstract_first / readonly_first / accessor_opt)
				//   field('name', $._property_name),                 // pos 3
				//   optional(choice('?', '!')),                     // pos 4  →  '4/0'  (optionality_marker)
				//   field('type', optional($.type_annotation)),     // pos 5
				//   optional($._initializer))                        // pos 6
				// Field-promotion wave 3 (016 task #25): label the `?`/`!` choice
				// as `optionality_marker`. Different semantics in one slot
				// (`?` = optional field, `!` = definite-assignment) — keep as one
				// discriminator field; the literal value distinguishes.
				//
				// content-collision (PR-L task 4): positions 1 and 2 are both
				// unnamed POLYMORPHED unions (declare/access-first, and the
				// 4-arm modifier choice) — 2 anonymous 'content' slots sharing
				// the `_content` storage key. Name position 1's outer union
				// `visibility_prefix` (>1 drops to 1, silencing the diagnostic;
				// position 2 stays unnamed, no collision remains since only one
				// unnamed content slot is left). The polymorphs map above adds
				// an extra '/0' hop under position 1 to compensate — this
				// field() wrap runs BEFORE polymorphs (transforms innermost,
				// polymorphs outermost), so it shifts every path under
				// position 1 by one segment.
```

### `parenthesized_expression` (`packages/typescript/overrides.ts:1001`)

```text
				// parenthesized_expression: variant() adoption. Shape is
				// `seq('(', choice(typed_expr, sequence_expression), ')')`.
				// The inner choice's alternatives become variant-child kinds
				// that own the surrounding `(` / `)` scaffold via Link's
				// push-down; the parent template collapses to $$$CHILDREN.
				// Path 1/N targets choice alt N inside the seq's member 1.
```

### `export_statement` (`packages/typescript/overrides.ts:1012`)

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

### `call_expression` (`packages/typescript/overrides.ts:1041`)

```text
				// call_expression: variant() adoption on three per-prec
				// branches. Each branch is wrapped in `prec('call' |
				// 'template_call' | 'member')` and Link's variant hoist
				// re-wraps each extracted hidden rule in the same prec so the
				// base grammar's conflict resolution carries through.
```

### `string` (`packages/typescript/overrides.ts:1052`)

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

### `update_expression` (`packages/typescript/overrides.ts:1086`)

```text
				// update_expression: postfix vs prefix `++` / `--`.
```

### `visibleExternals` (`packages/typescript/overrides.ts:1092`)

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

### `expectTestFailures` (`packages/typescript/overrides.ts:1111`)

```text
			// Known-failing generated nodes.test.ts kinds — tracked defects, not
			// silenced mysteries. Remove an entry + regen when its issue is fixed.
```

### `expectDiagnostics` (`packages/typescript/overrides.ts:1120`)

```text
			// PR 3 (2026-07-21 union-slot design): `_export_statement_group2` is an
			// orphaned duplicate — enrich's raw clause-hoist mint of
			// `_export_statement_default`'s `from_arm` position, superseded once
			// the nested `polymorphs:` config below (`_export_statement_default`
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

### `_reserved_identifier` (`packages/typescript/overrides.ts:1137`)

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

### `jsx_namespace_name` (`packages/typescript/overrides.ts:1194`)

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

### `public_field_definition` (`packages/typescript/overrides.ts:1224`)

```text
				// public_field_definition: pos 0 is decorator repeat (real base
				// field). The original override labeled pos 0 as
				// accessibility_modifier, clobbering decorator. Dropped entirely —
				// the internal accessibility/override-modifier slots are deep inside
				// nested choices and don't have stable raw positions.
```

### `required_parameter` (`packages/typescript/overrides.ts:1231`)

```text
				// required_parameter: same shape as optional_parameter modulo the
				// `?` — drop the synthetic `parameter_name` wrapper override and
				// let the walker inline the `_parameter_name` helper's fields.
```

### `object_type` (`packages/typescript/overrides.ts:1236`)

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

### `object_type_content` (`packages/typescript/overrides.ts:1282`)

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
