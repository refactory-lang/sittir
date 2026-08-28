# Assemble off the simplified tree — one slot derivation, one literal derivation

**Status:** ruled, ready to plan · **Phase:** simplify / assemble ·
**Gate:** review-gated behaviour step (the node model and generated surface
change by design); each sub-step names its own invariant. ·
**Depends on:** phase-typed builders (`RuleBuilder<P>` in the grammar DSL's
shape; `flatten`; evaluate's DSL is `structuralBuilder`; typed builder
outputs).

## The rule

The node model has exactly two views of a kind and each answers one
question:

- the **simplified rule** answers *what is a slot* — slots are not derived
  from it, they **are** its members;
- the **normalized rule** answers *what is rendered* — literals, separators,
  layout, seams.

Nothing downstream of assemble sees a link-phase tree, and no question is
answered twice from two trees.

## Findings that fix the shape (census, 2026-08-28, overridden grammars)

- The derive-audit (`SITTIR_AUDIT_DERIVE=1`) reports zero non-canonical
  shapes reaching derivation on all three grammars.
- The strict "seq of leaves" universal shape holds for rust 148/293,
  typescript 142/309, python 126/200 kinds. The remainder is not defects:
  supertype / enum / group / separatedList / pattern bodies are their own
  model shapes, and the branch remainder is overwhelmingly a **choice of
  leaves** — an all-symbol choice **body** (rust 21, ts 31, py 16: the
  polymorph population) or an all-symbol / all-literal choice **member**
  (rust 40+3, ts 38+11, py 12+5: a union-valued slot).
- Real structure exceptions — a choice of flat seqs or a nested seq that
  simplify did not reduce — are ~9 kinds: rust `function_type`,
  `binary_expression`, `_let_chain`; typescript `public_field_definition`
  (×2), `for_statement`, `_jsx_string`, `binary_expression`,
  `index_signature`; python none. Mixed symbol+literal choices are 4
  bodies (`function_modifiers`, `_closure_expression_expr`, `class_body`,
  `format_specifier`) and 1/2/4 members.
- Seam census: static boundaries are 15/470 (rust), 28/567 (typescript),
  6/253 (python); the rest is classified runtime-varying residue.

So the honest universal shape is **a seq of (leaf | choice-of-leaves), or a
single one of those**; a choice of leaves is one union-valued slot.

## Node types are the simplified rule types

`classifyNode` dispatches on the **simplified** rule, where literals beside
slots are already gone and singleton seqs already collapsed:

| simplified body | node | members |
|---|---|---|
| `SymbolRule` (any multiplicity) | `AssembledSymbol` — the single-slot kind; `seq('(', $.x, ')')` and naked `$.x` are the same simplified rule | the body |
| `SeqRule` | `AssembledBranch<SeqRule>` | the members: each a slot (`SymbolRule`), a union-valued slot (`ChoiceRule` of leaves), or a slot-promoted literal |
| `ChoiceRule` of symbols / named arms | `AssembledPolymorph<ChoiceRule & { members: (SymbolRule \| NamedArm<SeqRule>)[] }>` | the arms; a named inline arm is a sub-factory (`binaryExpression.add(…)`) |
| `ChoiceRule` of literals | `AssembledEnum` | the literals |
| `STRING` / `PATTERN` / layout | `AssembledLeaf` (existing subclasses) | — |
| symbol with array multiplicity + `separator` | `AssembledList` | the element |
| `SUPERTYPE` | `AssembledPolymorph` + `transparent` | the subtypes |

Orthogonal **facts**, stamped at assemble, never model types: `hidden`
(was `group` / `multi`), `transparent` (was `supertype`), `word` (was
`keyword` vs `token`), the single-slot sugar (was `BranchSlotClass`: it is
the `AssembledSymbol` case, or a branch whose members hold one slot).
`multi` and `separatedList` are one `list` shape with `separator?`.

`deriveSlots`'s tree walk is gone. What remains is **per-member
resolution**, one level down: the member's stamped `kindId` → node ref or
terminal value, parse-kind collision folding, visible-alias expansion,
determined-slot pruning. `buildSlotsRecord`'s second derivation over the
render tree (for `sourceRuleIds`) is gone: identity is uniform in
`flatten`, so the simplified tree carries every id — gated by
`DBG_SLOT_MISS=1` staying at zero.

A body that matches no row records an `unclassifiable-shape` diagnostic
(kind, simplified shape, census bucket) into `grammar-diagnostics.json` —
a ratchet — and is skipped downstream. Never thrown on, never
special-cased. `assertUniversalShape` is that diagnostic's producer, not
an opt-in throw.

## VARIANT and GROUP leave the rule vocabulary

They are not part of tree-sitter's DSL and never were rules: `variant()`
is an override placeholder (`dsl/primitives/variant.ts`) resolved by
transform; `GROUP` is minted only by link when it hoists. Both are facts a
sittir layer decided, spelled as wrapper nodes. Under this ruling:

- `RuleBuilder<P>` is exactly the DSL — `variant` / `group` leave the
  interface; `VARIANT` / `GROUP` leave `rule-types.ts` and every phase's
  `Rule` union.
- `variant(name)` resolves to `armName: name` stamped on the arm it
  patches. The polymorph reads its arms' names off its members; an arm
  without one is a plain kind ref.
- Link's hoist records its decision as stamps on the hoisted body
  (`hidden`, the minted name when it becomes a real hidden rule with a
  parser symbol) or does nothing when the body stays inline as a nested
  seq member. A tree-sitter hidden rule referenced from several parents is
  a real kind (`hidden: true`), not a group.
- Everything that walked through VARIANT/GROUP (`fanOutSeqChoices` /
  `factorChoiceBranches` re-wrapping in normalize, `unwrapForMerge`,
  `peelSeparatedListCore`, `hasSlotBearingContent`, polymorph detection
  reading `variantArms`) reads the stamps or the nested shape instead.
- The `_…_optional1` / `_…_arm` kinds stop existing: they are sub-shapes
  of their parent (nested seq member / named arm), typed inline in the
  parent's generated type, with sub-factories on the parent. This is the
  bulk of the phantom-kind population; the "every kind has a kindId"
  invariant closes with it.

## Simplify pre-work (byte-identical, lands first)

1. **Literal-only seq → `STRING`.** A seq with no slot anywhere folds to
   one `STRING` by the fixed-literal join (tokenized ⇒ `''`, else `' '`) —
   `collectFixedLiteral` moved from node-map to simplify, one derivation.
   A non-deterministic all-text body (optional literal, divergent choice
   texts) is retained whole; that is the leaf/enum boundary `classifyNode`
   already handles and the correct reason `char_literal` /
   `escape_sequence` / `integer_literal` / `float` / `comment` / `number`
   are patterns. `AssembledLeaf` text comes from the simplified `STRING`;
   `isAllTextShape` goes.
2. **A literal is stripped only beside a slot** (as now); slot-promoted
   literals stay slots.
3. The ~9 structure exceptions and ~7 mixed choices above are simplify
   defects or override/variant decisions, fixed at the source per kind and
   tracked by the `unclassifiable-shape` ratchet — not blockers.
4. The census probe (`ushape-census.mts`) is promoted to
   `sittir tool universal-shape-census` as the ratchet's report.

## Normalize: static spacing as literal members (bounded)

`seq(word, word) → seq(word, ' ', word)` and the seq-of-literals fold apply
on the normalized view **only where the seam census classifies the boundary
static** (glued ⇒ `''`, spaced ⇒ `' '`). Today that is 3–5% of boundaries;
the runtime-varying residue (436 / 528 / 237) is its own diagnosis — almost
certainly a conservative classifier, not a dynamic grammar — and is not
folded.

## Steps

- **3a** — no link tree past assemble: `AssembledBranch` drops the link
  `rule`; assemble's remaining `linkRules` walkers (`collectAnonymousNodes`,
  variant derivation, `optionalBodyKinds`, `_deriveSlotsInternal`'s
  `flatten(rule) as Rule<'link'>`) move onto the normalized / simplified
  trees; anonymous-node minting becomes catalog-driven (`kindEntries`:
  rust's parser has 111 anonymous symbols, the node map 96). Known
  behaviour delta to review: python's operator anon nodes lost via the
  enum-choice guard in `walkForStrings`, rust's real keyword `default`
  gained.
- **3b** — parked: the render plan as an assembled fact (`templates.ts`
  becomes a serializer; the normalized rule leaves the node).
- **3c** — simplify pre-work above; `classifyNode` on the simplified rule;
  `unclassifiable-shape` ratchet; census tool.
- **3d** — node types = simplified rule types; `AssembledPolymorph`
  resurrected; `deriveSlots` → per-member resolution; `BranchSlotClass`,
  `buildSlotsRecord`'s render pass and `multi`/`separatedList`/`group`/
  `keyword`/`token` model types become facts.
- **3e** — VARIANT/GROUP leave the rule vocabulary; `armName` and hoist
  stamps; sub-factories; phantom-kind ratchet drops accordingly.
- **3f** — normalize static spacing, bounded by the seam census; residue
  diagnosis.

## Invariants per step

3a, 3d, 3e change `node-model.json5` / generated types and factories by
design: review-gated, with the validator numbers as the floor (rust
146/146·208/208·134/137·1519/1519, typescript
142/143·194/194·112/114·1202/1202, python 122/122·142/142·115/116·1385/1390
may only rise) and the phantom-kind, unclassifiable-shape and slot-id-miss
ratchets as the counts that may only fall. 3c and 3f are byte-identical.
