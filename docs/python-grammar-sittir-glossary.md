# Python Overrides Glossary

Per-rule reference for `packages/python/grammar.sittir.ts`: every named rule
override, conflict, and precedence declaration significant enough to need
explanation. Each entry covers what the rule/conflict addresses, why it's
needed (the specific ambiguity or shape mismatch), and what would break if
it were removed.

See [AGENTS.md § Wave-style decomposition before commits](../AGENTS.md) for
the convention this glossary exists to serve — long rationale comments in
`grammar.sittir.ts` move here instead of living inline.

---

### `enrichedBase` (`packages/python/grammar.sittir.ts:14`)

`enrich(base)` is bound once and the SAME enriched grammar is handed to both
`grammar()` and `wire()` (matching rust and typescript). `wire`'s
base-dependent passes — auto-group synthesis, body-pattern groups, and the
enrich-hoisted-clause inline registration — must see the post-enrich shape;
enriching twice, or wiring against the raw base, desynchronises them from the
grammar tree-sitter actually compiles.

### `externals` (`packages/python/grammar.sittir.ts:20`)

Binds structural-whitespace roles onto python's existing base externals.
`role(symbolRef, name)` records the binding on a per-grammar accumulator that
Link reads to drive symbol resolution, and returns the symbol unchanged so
`externals` still receives a valid token reference.

The callback returns `prev` directly rather than spreading it alongside the
`role()` return values: tree-sitter's `grammar()` does not dedupe the externals
list, so a spread would emit every token twice and the generated `parser.c`
would fail to compile.

### `conflicts` (`packages/python/grammar.sittir.ts:26`)

Every entry declares a GLR fork that only became necessary because a variant
arm was lifted out of a rule tree-sitter had previously merged into a single
LR(1) state.

- `[expression_statement, _expression_statement_tuple]` — both arms start with
  `expression`, and only the tuple form accepts the trailing `,`.
- `[_except_clause_as, _except_clause_list]` — both begin with
  `field('value', expression)` and diverge only on the `as` / `,`
  continuation.
- `[as_pattern, _except_clause_as]` — `except E as e:` overlaps `E as e` after
  the shared `expression 'as'` prefix.
- `[_expressions, expression_list]` — `_expressions` is a minted visible-group
  arm source, filtered out of `inline:` so its mint survives to the parser.
  Keeping it un-inlined leaves it sharing the `expression ,` prefix with
  `expression_list`; this is the fork tree-sitter itself suggests for the
  yield/tuple overlap.

### `inline` (`packages/python/grammar.sittir.ts:69`)

```text
			// EXPERIMENT (see `_except_clause_as` in `rules`). The real fix is enrich
			// auto-hoisting inline-safe groups nested inside variant arms — FOLLOWUP.
			// Inline the hoisted group into tree-sitter so the `as_pattern` LR overlap
			// dissolves exactly as the base grammar resolves it (no extra conflict
			// needed — the `as` is inline in `_except_clause_as` at parse time).
```

### `visibleExternals` (`packages/python/grammar.sittir.ts:75`)

```text
			// _newline is python's statement-terminator EXTERNAL (the scanner
			// consumes the newline character and drives indent tracking).
			// visibleExternals materializes it as a real `newline` CST node —
			// aliases don't touch the LR tables, so the parser behavior is
			// identical — and renders emit a real '\n' terminator that
			// re-parses to the SAME node type (round-trip-stable): the ts
			// automatic_semicolon pattern applied to newline-as-syntax.
```

### `expression_statement` (`packages/python/grammar.sittir.ts:88`)

```text
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
```

### `with_clause` (`packages/python/grammar.sittir.ts:103`)

```text
				// with_clause: bare (`a, b, c`) vs parenthesized (`(a, b, c)`).
				// Same with_item content on both arms; paren form wraps with
				// '(' ... ')'. Split per variant so each owns its template.
```

### `_match_block` (`packages/python/grammar.sittir.ts:111`)

```text
				// _match_block: base rule is
				//   choice(
				//     seq($._indent, repeat(field('alternative', $.case_clause)),
				//         $._dedent),                         // arm 0 — block form
				//     $._newline,                             // arm 1 — empty form
				//   )
				// Heterogeneous: one seq + one bare symbol. Splitting the seq arm
				// into `_match_block_block` leaves the remaining choice as all
				// symbol-like (alias + symbol) — canonical.
```

### `_simple_pattern` (`packages/python/grammar.sittir.ts:137`)

```text
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
```

### `except_clause` (`packages/python/grammar.sittir.ts:169`)

```text
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
```

### `comparison_operator_comparator` (`packages/python/grammar.sittir.ts:188`)

```text
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
```

### `argument_list` (`packages/python/grammar.sittir.ts:221`)

```text
				// argument_list: name the naked args choice (was an unresolvable
				// `content` slot). expression | list_splat | dictionary_splat |
				// parenthesized_expression | keyword_argument
```

### `expression_list` (`packages/python/grammar.sittir.ts:228`)

```text
				// expression_list / pattern_list: `seq(member, choice(',',
				// <enrich-lifted group>))` — the tail position is an UNNAMED
				// mixed row (anon-literal | named-node). The single-element
				// `c,` case parses the tail as a bare anonymous ',' token that
				// lands in $other where the derived slot can't reach it, while
				// the multi-element case parses the visible group node. Field
				// the position so tree-sitter keys BOTH arms — the
				// class_body_member / function_signature precedent; the
				// id-first transport arms dispatch the anon comma, and the
				// headless group renders via its captured leading flank.
```

### `complex_pattern` (`packages/python/grammar.sittir.ts:256`)

```text
				// complex_pattern: real/imaginary (0,1) + the `+`/`-` operator enum (2)
				// and a trailing number choice (3). Positions 2 and 3 are both unnamed
				// → 2 `content` slots; name the operator so the number stays the single
				// sanctioned `content` (base-rule field, complex_pattern is not a polymorph).
```

### `dictionary` (`packages/python/grammar.sittir.ts:284`)

```text
				// dictionary: name the naked entries choice (pair | dictionary_splat)
```

### `exec_statement` (`packages/python/grammar.sittir.ts:289`)

```text
				// exec_statement: grammar is seq('exec', code, optional(seq('in', exprs)))
				// Template walker emits the `in` keyword as a literal at top level,
				// which surfaces in rendering even when the optional(seq(...))
				// didn't match. Wrap the optional as field('in_clause') so the
				// whole clause (`in` + exprs) renders only when present.
```

### `for_in_clause` (`packages/python/grammar.sittir.ts:128`)

`for_in_clause` is `prec.left(seq(optional('async'), 'for', …))`. The
`prec.left` wrapper hides the seq from enrich's auto-promotion walker, so the
`async` position has to be hand-promoted here.

`for_statement`, `function_definition`, and `with_statement` also start with
`optional('async')` at position 0, but their seqs are unwrapped, so enrich
auto-promotes them as `field('async_marker', SYMBOL(_kw_async_marker))` and
they need no entry in `transforms`.

### `splat_pattern` (`packages/python/grammar.sittir.ts:343`)

```text
				// splat_pattern: base is `seq(choice('*', '**'), choice($.identifier, '_'))`.
				// Position 1 is one semantic slot — "what's being splatted" —
				// that can be a real identifier OR the `_` discard marker; the
				// prior override only field-named the `_` arm (`'1/1'`), leaving
				// the `$.identifier` arm unnamed. Both then derived the SAME
				// kind-derived storageName ('identifier'), a storagename-
				// collision whose last-write-wins merge silently dropped the
				// `_` value. Field-naming the WHOLE choice (not one arm) makes
				// this the same-name-both-positions "genuinely one combined
				// slot" case: one named `identifier` slot unioning both values,
				// same convention as `argument_list`'s naked-choice `1: field(...)` above.
```

### `type_alias_statement` (`packages/python/grammar.sittir.ts:369`)

```text
				// type_alias_statement: wrap base position 0 (bare 'type' literal)
				// as field('type') so $fields.type carries the keyword. Without
				// this override, enrich's bare-leading-keyword pass (globally off
				// — rust corpus regresses with it on) leaves the literal
				// unwrapped, and $fields only has left/right. The spec-008-US7
				// regression test (python type_alias_statement collision)
				// assumes the wrapped form.
```

### `_except_clause_as` (`packages/python/grammar.sittir.ts:397`)

```text
				// EXPERIMENT (manual; real fix = enrich should auto-hoist an inline-safe
				// group nested inside a variant arm). The `except_clause` polymorph split
				// auto-creates `_except_clause_as` = seq(value, optional(seq('as', alias)));
				// enrich does NOT recurse into the variant arm to hoist the inner
				// inline-safe group, so the emitter leaks `as` ungated
				// (`except E:` -> `except E as:`). Redefine it with the inner group
				// explicitly hoisted to `_except_clause_as_optional1` so the emitter
				// inline+gates the `as`.
```

### `parameters` (`packages/python/grammar.sittir.ts:408`)

```text
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
```

### `lambda_parameters` (`packages/python/grammar.sittir.ts:487`)

```text
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
```

### `set` (`packages/python/grammar.sittir.ts:503`)

```text
				// `set`'s reference is MANDATORY (base: `seq('{', $._collection_elements, '}')`,
				// no `optional(...)`) — it can't itself satisfy `parentIsOptionalSeq`,
				// but doesn't need to: `list`/`tuple`'s optional-wrapped references
				// mint the kind; this site just resolves through the same alias.
```

### `case_tuple_pattern` (`packages/python/grammar.sittir.ts:510`)

```text
				// Case-context tuple/list pattern split (KNOWN_ISSUES "two-rules-one-
				// parse-kind"): base arms 3/4 are `alias($._list_pattern, $.list_pattern)`
				// / `alias($._tuple_pattern, $.tuple_pattern)` — match-statement case
				// patterns parse to the SAME kinds as the assignment-context rules,
				// whose templates only know the assignment shape (Track B's
				// `pattern_group` slot), so `case (a, b):` rendered as `()` and
				// `case [a, b]:` as `[]` (probe-confirmed; the list twin just had no
				// corpus coverage). Give each case-context source rule its own
				// visible kind so each rule owns its parse kind and template.
				//
				// `case_tuple_pattern`/`case_list_pattern` are REAL visible rules
				// (bodies = the hidden rules verbatim), referenced directly — NOT
				// `alias($._x, ...)`: the content-alias mint only fires for
				// optional-in-seq reference sites (Track B's shape), so an aliased
				// choice arm never enters the NodeMap and the kind is unrenderable.
				// `_tuple_pattern`/`_list_pattern` go unused and drop out of the
				// parser. The names are deliberately NON-natural: the natural
				// stripped names are taken by the assignment-context kinds, and
				// would trip the mintContentAliasKinds self-ref bug anyway
				// (KNOWN_ISSUES).
				//
				// The full `_simple_pattern` reconstruction (base body verbatim except
				// arms 3/4) is deliberate: a numeric-key transform would flat-broadcast
				// across the choice. Arm ORDER must stay identical — the patches
				// entry `_simple_pattern: [..., { '11': variant('negative') }]` composes
				// on top of this body and addresses the negative-literal arm by index.
```

### `print_statement_group1` (`packages/python/grammar.sittir.ts:541`)

```text
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
```
