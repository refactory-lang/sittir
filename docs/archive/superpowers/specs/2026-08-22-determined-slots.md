# Determined Slots — No Storage for Grammar-Fixed Values

**Status:** Realized (design settled 2026-08-22)

## Problem

A slot whose value set has exactly one member (a required, singular position
holding one literal or one reference to a parameterless kind) carries zero
information per instance: the grammar fixes its value. Today such slots are
"auto-stamped" — the factory writes the value itself, wrap captures it, the
transport declares a field, `from()` reads it back, and the validator
compares it — one grammar fact re-stored on every node. The mechanism
(`stampExpressionFor` / `autoStampExpression` / the container path's
`stampedExtras`) also leaks into factory-shape classification, where
"auto-stamped fields don't count" had to be special-cased.

Population (all three grammars, live NodeMap): **16 slots**.
- Fielded literals (5): rust `generic_type_with_turbofish.turbofish = "::"`,
  `_visibility_modifier_pub.pub = "pub"`; ts `_binary_expression_arm.operator = "in"`,
  `_for_header_var_kind.kind = "var"`; python `type_alias_statement.type = "type"`.
- References to parameterless kinds (11): rust `extern_crate_declaration.crate`,
  `self_parameter.self`, `mut_pattern.mutable_specifier`,
  `_reference_expression_raw_mut.mutable_specifier`,
  `_range_expression_{prefix,postfix}.operator → _kw_operator`; ts
  `_public_field_definition_{static_mods,abstract_first,readonly_first}.*_marker
  → _kw_*_marker`; python `_simple_statements.newline`, `decorator.newline → _newline`.

## Design

**A determined slot is an enum of cardinality 1, and an enum of cardinality 1
is template text.** Slot representation has three orthogonal axes — existence,
parameter-bearing, type representation (boolean / bitflag / kind-enum
coercion). A literal-choice field is a kind-enum slot where the value varies
(`for_header.kind: let | const`, `binary_expression.operator` across 24 arms);
after form extraction the same field may hold one value in a given form
(`_for_header_var_kind.kind = var`). Cardinality is therefore a **per-kind**
fact evaluated after extraction, on the form's own slot.

Rule, at slot classification (assemble/collect-slots): a required, singular
slot whose value set has exactly one member **is not a slot**. Its value
renders as template text — the literal itself, or the parameterless kind's
constant render (`mut`, `static`, `\n` via the external's `string(...)`).
No storage key, no transport field, no wrap capture, no accessor, no `$with`
setter, no `from()` handling. The grammar is untouched: upstream fields stay
(they are load-bearing in the unsplit parent), and `_kw_*` marker symbols
stay where they serve the parser.

Consequences:
- `stampExpressionFor`, `autoStampExpression`, and the `stampedExtras`
  handling in the container factory path are **deleted**, not renamed.
- `classifyFactoryShape`'s "configurable extras" predicate no longer needs a
  stamp exception: *single slot* means single slot.
- The wire contract shrinks by the 16 keys; read and factory sides drop them
  atomically (the validator's key-set comparison is the gate).
- Form-split justification becomes checkable: two arms that differ only in a
  literal-choice member must stay one kind with an enum slot — splitting
  them mints forms whose sole difference is a cardinality-1 enum.
  `mintStructuredChoiceArm` declines such arms. (Both current splits —
  `binary_expression`'s `in` arm with its `private_property_identifier`
  left, `for_header`'s var form with its `_initializer` tail — are
  structural and stay.)

Optional follow-on: the three override-fielded mandatory keywords
(`turbofish`, `pub`, `type`) can drop their `field(...)` wrappers if the
`_kw_*` symbols prove parser-neutral (gate: parser equivalence) — then they
are plain template text with no rule involved at all.

## Gates

Floors byte-identical across all three grammars (render output is
unchanged by construction — the text moves from storage to template);
`validate history` compared numerically; full suite with stash-isolated
new failures; baseline 9716/23 never regresses; trivia anchoring verified
for a comment adjacent to a determined token (read-side check — the token
leaves the wire, the trivia must not).

## Follow-on: ergonomic factory namespaces (not this spec)

Forms and arms remain kinds in storage. The factory API hides the
splitting: a branch whose sole top-level slot is a choice (today only
registered polymorph variants; expandable to any kind of that shape)
exposes its forms as named constructors under the parent factory —
`forHeader.var(...)`, `forHeader.let(...)`, `forHeader.const(...)`;
an enum-discriminated kind exposes one constructor per member —
`binaryExpression.plus(x, y)`, `binaryExpression.in(...)` — fixing the
enum member by method name. Parameters are the form's parameters; storage
is the form's node. Specified separately once determined slots land.

## Realization notes

- Classification and text share one derivation (`determinedSlotText`,
  node-map). `pruneDeterminedSlots` runs in generate before node-model
  emission and hydration: determined slots leave the slot record (every
  record-driven emitter — factories, types, wrap, transport, from — drops
  them atomically) and land on `node.determinedSlots`, stamped
  `determined`; `slotByRuleId` still resolves them, which is how the
  template emitter inlines their text (`emitSlotReference`;
  whitespace-only text emits as an expression tag). Ref targets are leaf
  kinds only (keyword / string-bodied token) — a parameterless compound
  target stays a real slot.
- Realized population: rust 6, typescript 6, python 2 (the spec's other
  three — `turbofish`, `pub`, `type` — left with the dropped
  override-fielded keywords). A fully-static template (rust
  `_reference_expression_raw_mut` → `raw mut`) emits its askama struct
  without the now-unused lifetime.
- The READ wire keeps the keys: tree-sitter field labels are load-bearing
  (the parser's own surface, and form dispatch routes
  `binary_expression`'s `in` arm by the `operator` field), so "drop
  atomically" is realized at the storage contract and the comparison
  contract — node-model serializes `determinedSlots` (name, storageKey,
  text) and the validators consume the stamped fact: factory-render-parse
  skips determined storage keys, template-coverage exempts determined
  fields from the missing-placeholder check.
- `mintStructuredChoiceArm`'s callers decline an arm whose delta against a
  sibling is EXACTLY one literal-choice position
  (`armsDifferOnlyByLiteralChoice`) — one enum slot expresses it. Arms
  differing at two literal positions (`new . target` vs `import . meta`)
  are distinct forms and stay split.
- `stampExpressionFor` / `autoStampExpression` / `stampedExtras` /
  `isAutoStampField` / `resolveEffectiveLiteral` and the compound-level
  `stampExpression` are deleted; the `AutoStamp` brand is no longer
  emitted. `parameterless` is computed from `determinedSlots` + the
  remaining record.
